const express = require("express");
const sqlite3 = require('sqlite3').verbose();
const Crypto = require("crypto-js");
const db = new sqlite3.Database('./data.db');
const app = express();
const fs = require("fs");
var throttle = require("express-throttle");
var fileupload = require("express-fileupload");

var notifs = new Map();

let throttleTight = {
    burst: 50,
    rate: "1/3s",
    key: (req) => req.name,
    cost: (req) => !req.data.isAdmin
};

var reset_table = 0;

db.serialize(() => {
    if(reset_table) db.run("DROP TABLE users");
    if(reset_table) db.run("DROP TABLE acts");
    if(reset_table) db.run("DROP TABLE edus");
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, secret TEXT, isAdmin BOOL DEFAULT 0, no INTEGER UNIQUE, fullname TEXT, activity INTEGER, graduation INTEGER, reviews TEXT DEFAULT \"[]\", hobbies TEXT DEFAULT \"-\", aboutMe TEXT DEFAULT \"-\")");
    db.run("CREATE TABLE IF NOT EXISTS acts (id INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT, participants TEXT, start INTEGER, end INTEGER, place TEXT, genre TEXT, activity TEXT, maxParticipants INTEGER, started BOOL DEFAULT false, desc TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS edus (id INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT, teachers TEXT, students TEXT, start INTEGER, end INTEGER, place TEXT, genre TEXT, subgenre TEXT, maxStudents INTEGER, started BOOL DEFAULT false, desc TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS ancs (id INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT, end INTEGER, place TEXT, genre TEXT, desc TEXT, imageUrl TEXT)");
    if(reset_table) db.run("INSERT INTO users (name, secret, isAdmin, no, fullname, graduation) VALUES ('ege123', ?, true, 123, 'Ege Serter', 2027)", [hashString("admin")]);
    if(reset_table) db.run("INSERT INTO users (name, secret, no, fullname, graduation) VALUES ('demo', ?, 0, 'demo', 2027)", [hashString("demo")]);
    console.log("Database is ready");
    serve();
});

function serve() {
    app.use(require("cookie-parser")());
    app.use(fileupload());

    app.get("/login", async (req, res) => {
        let name = req.query.name, secret = req.query.secret;
        if(!name || !secret) return res.sendFile(__dirname + "/pages/login.html");
        if(await authenticate(name, secret)) {
            res.cookie("name", name);
            res.cookie("secret", secret);
            notifs[name] = {title: "Giriş yaptınız.", body: `Hoşgeldiniz ${name}.`};
            return res.send("1");
        } else {
            return res.send("Kullanıcı adınız veya şifreniz yanlış.");
        }
    });
    
    
    app.use(express.static("./public/worker"));
    
    app.use(express.static("./public"));

    app.use("/usercontent", express.static("./usercontent"));
    
    // login wall
    app.use(async (req, res, next) => {
        let name = req.cookies.name, secret = req.cookies.secret;
        if(name && secret && await authenticate(name, secret)) req.name = name, next();
        else if(["/", "/action"].includes(req.url)) res.redirect("/login");
        else {
            res.status(401);
            res.send("Lütfen önce giriş yapınız.");
        }
    });

    app.use(async (req, res, next) => {
        let data = await SQL("SELECT * FROM users WHERE name=?", [req.name]);
        req.data = data[0];
        next();
    });
    
    app.get("/notification", (req, res) => {
        let data = {
            name: req.cookies.name,
            notification: notifs[req.cookies.name]
        };
        res.json(data);
        notifs[req.cookies.name] = undefined;
    });

    app.get("/logout", (req, res) => {
        res.cookie("name", "");
        res.cookie("secret", "");
        res.redirect("/login");
    });

    app.get("/admin", async (req, res) => {
        if(req.data.isAdmin) {
            let command = req.query.command;
            if(!command) return res.sendFile(__dirname + "/pages/admin.html");
            else {
                try {
                    let result = eval(command);
                    if(result instanceof Promise) result = await result;
                    if(result instanceof Array) result = "-Array-" + result.reduce((p, c) => p + "\n" + ((c.constructor.name == "Array" || c.constructor.name == "Object") ? JSON.stringify(c) : "" + c), "");
                    return res.send("" + result);
                } catch(err) {
                    if(!res.headersSent) return res.send(err.toString());
                }                
            }
        } else {
            res.redirect("/");
        }
    });

    app.get("/profileData", async (req, res) => {
        let name = req.query.q;
        let user = (await SQL("SELECT * FROM users WHERE name=?", [name]))[0];
        if(!user) return res.json({error: "Kullanıcı bulunamadı."});
        res.json({
            fullname: user.fullname,
            name: user.name,
            graduation: user.graduation,
            hobbies: user.hobbies,
            aboutMe: user.aboutMe,
            reviews: JSON.parse(user.reviews)
        });
    });

    app.get("/actList", async (req, res) => {
        var activities = await SQL("SELECT * FROM acts");
        res.json(activities);
    });

    app.get("/eduList", async (req, res) => {
        var edus = await SQL("SELECT * FROM edus");
        res.json(edus);
    });

    app.get("/ancList", async (req, res) => {
        var ancs = await SQL("SELECT * FROM ancs");
        res.json(ancs);
    });

    app.get("/modifyProfile", throttle(throttleTight), async (req, res) => {
        let hobbies = req.query.hobbies.slice(0, 80);
        let aboutMe = req.query.aboutMe.slice(0, 250);
        if(hobbies) await SQL("UPDATE users SET hobbies=? WHERE name=?", [hobbies, req.data.name]);
        if(aboutMe) await SQL("UPDATE users SET aboutMe=? WHERE name=?", [aboutMe, req.data.name]);
        return res.json({});
    });

    app.get("/createReview", throttle(throttleTight), async (req, res) => {
        let name = req.query.name, text = req.query.text.slice(0, 250), stars = Number(req.query.stars), anon = req.query.anon;
        let data = (await SQL("SELECT * FROM users WHERE name=?", [name]))[0];
        if(data && text && stars) {
        let reviews = JSON.parse(data.reviews);
            if(reviews.find(r => r.name == req.data.name)) {
                reviews.splice(reviews.indexOf(reviews.find(r => r.name == req.data.name)), 1);
            }

            reviews.push({
                name: req.data.name,
                stars,
                text,
                anonymous: !!anon
            });

            await SQL("UPDATE users SET reviews=? WHERE name=?", [JSON.stringify(reviews), name]);
            res.send("1");
        }
    });

    app.get("/createAct", throttle(throttleTight), async (req, res) => {
        var {genre, activity, start, end, place, maxParticipants, desc} = req.query;
        start = Number(start);
        end = Number(end);
        maxParticipants = Number(maxParticipants);
        desc = desc.slice(0, 80) || "-";
        if(start < Date.now()) return res.send("Aktivite henüz başlamamış olmalıdır.");
        if(genre && activity && start >= Date.now() && end >= start && place && maxParticipants) {
            let create = await createActivity(req.data.name, start, end, place, genre, activity, maxParticipants, desc);
            return res.send("1");
        }
        res.send("Beklenmedik bir hata oluştu.");
    });

    app.get("/createEdu", throttle(throttleTight), async (req, res) => {
        var {genre, subgenre, start, end, place, maxStudents, asTeacher, desc} = req.query;
        start = Number(start);
        end = Number(end);
        maxStudents = Number(maxStudents);
        asTeacher = !!asTeacher;
        desc = desc.slice(0, 80) || "-";
        if(start < Date.now()) return res.send("Eğitim henüz başlamamış olmalıdır.");
        if(genre && subgenre && start >= Date.now() && end >= start && place && maxStudents) {
            let create = await createEdu(req.data.name, start, end, place, genre, subgenre, maxStudents, asTeacher, desc);
            return res.send("1");
        }
        res.send("Beklenmedik bir hata oluştu.");
    });

    app.post("/createAnc", throttle(throttleTight), async (req, res) => {
        if(!req.data.isAdmin) return res.send("Bu özellik yöneticilere özeldir.");
        let title = req.query.title.slice(0, 50);
        let desc = req.query.desc.slice(0, 1200);
        if(!title || !desc) return res.send("Başlık veya açıklama eksik.");
        if(desc.length < 50) return res.send("Açıklama çok kısa.");
        let filename;
        if(req.files) {
            if(req.files.file.mimetype != "image/jpeg") return res.send("Dosya tipi desteklenmiyor.");
            filename = Date.now() + "" + req.files.file.name;
            fs.writeFile(__dirname + "/usercontent/" + filename, req.files.file.data, (err) => {
                if(err) res.send("Resim yüklenemedi.");
                else {
                    createAnc(req.data.name, Date.now() + 1000*60*60*24*30, "", title, desc, filename).then(() => {
                        res.send("1");
                    });
                }
            });
        } else {
            await createAnc(req.data.name, Date.now() + 1000*60*60*24*30, "", title, desc, null);
            res.send("1");
        }
    });

    app.get("/interAct", throttle(throttleTight), async (req, res) => {
        let id = Number(req.query.id);
        let act = (await SQL("SELECT participants, maxParticipants FROM acts WHERE id=?", [id]))[0];
        if(act) {
            let ps = JSON.parse(act.participants);
            if(ps.includes(req.data.name)) {
                ps.splice(ps.indexOf(req.cookies.name), 1);
                if(ps.length == 0) await SQL("DELETE FROM acts WHERE id=?", [id]);
                else await SQL("UPDATE acts SET participants=? WHERE id=?", [JSON.stringify(ps), id]);
                return res.send("1");
            } else {
                if(ps.length >= act.maxParticipants) return res.send("0");
                ps.push(req.cookies.name);
                await SQL("UPDATE acts SET participants=? WHERE id=?", [JSON.stringify(ps), id]);
                return res.send("1");
            }
        }
        res.send("0");
    });

    app.get("/interactEdu", throttle(throttleTight), async (req, res) => {
        let id = Number(req.query.id);
        let asTeacher = !!req.query.asTeacher;
        let edu = (await SQL("SELECT * FROM edus WHERE id=?", [id]))[0];
        if(edu) {
            let t = JSON.parse(edu.teachers), s = JSON.parse(edu.students);
            if(edu.owner == req.data.name) {
                await SQL("DELETE FROM edus WHERE id=?", [id]);
                res.send("1");
            } else if(t.includes(req.data.name)) {
                t.splice(t.indexOf(req.data.name), 1);
                await SQL("UPDATE edus SET teachers=? WHERE id=?", [JSON.stringify(t), id]);
                res.send("1");
            } else if(s.includes(req.data.name)) {
                s.splice(s.indexOf(req.data.name), 1);
                await SQL("UPDATE edus SET students=? WHERE id=?", [JSON.stringify(s), id]);
                res.send("1");
            } else if(asTeacher) {
                t.push(req.data.name);
                await SQL("UPDATE edus SET teachers=? WHERE id=?", [JSON.stringify(t), id]);
                res.send("1");
            } else {
                s.push(req.data.name);
                if(s.length <= edu.maxStudents) await SQL("UPDATE edus SET students=? WHERE id=?", [JSON.stringify(s), id]), res.send("1");
            }
        }
        if(!res.headersSent) res.send("0");
    });

    app.get("/", (req, res) => {
        res.sendFile(__dirname + "/pages/index.html");
    });

    app.get("/action", (req, res) => {
        res.sendFile(__dirname + "/pages/action.html");
    });

    app.get("/profile", (req, res) => {
        res.sendFile(__dirname + "/pages/profile.html");
    });

    app.get("/about", (req, res) => {
        res.sendFile(__dirname + "/pages/about.html");
    });
    
    // redirect 404 requests to homepage
    //app.use((req, res) => {
    //    res.redirect("/");
    //});

    app.listen(80, "", () => {
        console.log("Serving...");
    });
}

async function systemPeriodic() {
    var res = await SQL("UPDATE acts SET started=true WHERE started=0 AND start<? RETURNING participants", [Date.now()]);
    res.forEach(act => {
        JSON.parse(act.participants).forEach(attendee => {
            notifs[attendee] = {title: "Aktivite Başladı!", body: `Katılmış olduğunuz aktivite başladı.`};
        });
    });


    var res = await SQL("DELETE FROM acts WHERE end<? RETURNING participants", [Date.now()]);
    /*res.forEach(act => {
        JSON.parse(act.participants).forEach(attendee => {
            SQL("UPDATE users SET activity=null WHERE name=?", [attendee]);
        });
    });*/

    var res = await SQL("UPDATE edus SET started=true WHERE started=0 AND start<? RETURNING *", [Date.now()]);
    res.forEach(edu => {
        JSON.parse(edu.students).forEach(attendee => {
            notifs[attendee] = {title: "Eğitim Başladı!", body: `Katılmış olduğunuz eğitim başladı.`};
        });
        JSON.parse(edu.teachers).forEach(attendee => {
            notifs[attendee] = {title: "Eğitim Başladı!", body: `Katılmış olduğunuz eğitim başladı.`};
        });
    });

    var res = await SQL("DELETE FROM edus WHERE end<?", [Date.now()]);
}

setInterval(systemPeriodic, 2000);

function hashString(string) {
    return Crypto.enc.Hex.stringify(Crypto.SHA256(string));
}

function pullRandomQuote() {
    var file = fs.readFileSync("quotes.txt", "utf8");
    var split = file.split("\n");
    var get = split[Math.floor(Math.random() * split.length)];

    return [get.slice(get.indexOf('"') + 1, get.lastIndexOf('"')).trim(), get.slice(get.lastIndexOf("~") + 1).trim()]
}

const adminActions = {
    createUser: async (name, secret, fullname, no, graduation, admin = null) => {
        let isAdmin = admin === "YES";
        var hashed = hashString(secret);
        await SQL("INSERT INTO users (name, secret, fullname, no, graduation, isAdmin) VALUES (?, ?, ?, ?, ?, ?)", [name, hashed, fullname, no, graduation, isAdmin]);
        return "User was created.";
    },
    modifyUser: async (name, column, value) => {
        await SQL("UPDATE users SET "+column+"=? WHERE name=?", [value, name]);
        return "User was modified.";
    }
}

async function authenticate(name, secret) {
    var hashed = Crypto.enc.Hex.stringify(Crypto.SHA256(secret));
    let rows = await SQL("SELECT secret FROM users WHERE name=?", [name]);
    return rows[0] && rows[0].secret == hashed;
}

async function adminPerks(name) {
    let rows = await SQL("SELECT isAdmin FROM users WHERE name=?", [name]);
    return rows[0] && rows[0].isAdmin;
}

// turn sql queries into asynchronous commands
function SQL(sql, args) {
    return new Promise((res, rej) => {
       db.all(sql, args, (err, rows) => {
        if(err) rej(err);
        else res(rows);
       });
    });
}

function createActivity(owner, start, end, place, genre, activity, maxParticipants, desc) {
    return SQL("INSERT INTO acts (owner, participants, start, end, place, genre, activity, maxParticipants, desc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *", [owner, '["' + owner + '"]', start, end, place, genre, activity, maxParticipants, desc]);
}

function createEdu(owner, start, end, place, genre, subgenre, maxStudents, asTeacher, desc) {
    return SQL("INSERT INTO edus (owner, students, teachers, start, end, place, genre, subgenre, maxStudents, desc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *", [owner, !asTeacher ? '["' + owner + '"]' : "[]", asTeacher ? '["' + owner + '"]' : "[]", start, end, place, genre, subgenre, maxStudents, desc]);
}

function createAnc(owner, end, place, genre, desc, imageUrl) {
    return SQL("INSERT INTO ancs (owner, end, place, genre, desc, imageUrl) VALUES(?, ?, ?, ?, ?, ?) RETURNING *", [owner, end, place, genre, desc, imageUrl]);
}

// createAnc("ege123", Date.now() + 10000000, "Okul", "print(\"Hello, World!\")", `Gerçek dünyaya hoş geldin!
// Artık bilgiyi ve veriyi güç haline getiren Python, artık sadece bir programlama dili değil, aynı zamanda sonsuz olanakların kapısını aralayacak bir anahtar konumunda. 🤗
// Python ile karmaşık kodları çözebilir ve hem gerçek dünyanın hem de iş dünyasındaki fırsatların kapısını zorlayabilirsin.
// Sen de kapıları aralamak istiyorsan sana bir haberimiz var! Core Python Eğitim Programı başvuruları başladı! 📢
// Başvuru şartlarımız mı? Motivasyonunu bizimle paylaşman. YetGenli olma şartı programda aranmıyor. YetGen mezunuysan, avantajlar seni bekliyor! ✨`);