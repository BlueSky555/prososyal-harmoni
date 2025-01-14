$("#activityCreate").onclick = (e) => {
    if(e.target == $("#activityCreate")) $("#activityCreate").style.display = "none";
}

$("#eduCreate").onclick = (e) => {
    if(e.target == $("#eduCreate")) $("#eduCreate").style.display = "none";
}

$("#ancCreate").onclick = (e) => {
    if(e.target == $("#ancCreate")) $("#ancCreate").style.display = "none";
}

$("#activityContainer .new").onclick = (e) => {
    $("#activityCreate").style.display = "flex";
}

$("#eduContainer .new1").onclick = (e) => {
    asTeacher = true;
    $("#eduCreate .header").innerHTML = "Eğitim Ver";
    $("#eduCreate").style.display = "flex";
}

$("#eduContainer .new2").onclick = (e) => {
    asTeacher = false;
    $("#eduCreate .header").innerHTML = "Eğitim Al";
    $("#eduCreate").style.display = "flex";
}

$("#ancContainer .new").onclick = (e) => {
    $("#ancCreate").style.display = "flex";
}

$("#activityContainer .refresh").onclick = (e) => {
    loadActs();
}

$("#eduContainer .refresh").onclick = (e) => {
    loadEdus();
}

$("#ancContainer .refresh").onclick = (e) => {
    loadAncs();
}

function createActivity() {
    console.log($("#activityCreate input[type='number']").value);
}

let selectedTab = 0;
let tabs = ["activity", "edu", "anc"];

let activityOptions = {
    "Spor": ["Futbol", "Basketbol", "Masa Tenisi", "Badminton", "Voleybol", "Dart", "Diğer"],
    "Zeka Oyunları": ["Satranç", "Dama", "Mangala", "Denge Oyunu", "Hedef", "Diğer"],
    "Müzik": ["Piyano", "Gitar", "Diğer"],
    "Görsel Sanatlar": ["Karikatür", "Karakalem", "Mandala", "Sulu Boya", "Diğer"],
    "Sosyal Sorumluluk": ["Çöp Toplama", "Kedi Besleme", "Kuş Besleme", "Diğer"],
    "Edebiyat": ["Kitap Okuma", "Şiir Yazma", "Hikaye Yazma", "Diğer"],
};

let eduOptions = {
    "Ders": ["Matematik", "Fizik", "Kimya", "Biyoloji", "Edebiyat", "Tarih", "İngilizce", "Diğer"],
    "Zeka Oyunları": ["Satranç", "Dama", "Diğer"]
};

let asTeacher = false;

function animateSelector(id, anim = true) {
    let rect1 = $("#actions").getBoundingClientRect();
    let rect2 = $("#actions").children[id].getBoundingClientRect();
    let x = rect2.x - rect1.x - 1 - 16;
    let y = rect2.y - rect1.y - 1 - 8;
    let w = rect2.width + 32;
    let h = rect2.height + 16;
    $(".selector").animate({
        left: x + "px",
        top: y + "px",
        width: w + "px",
        height: h + "px"
    }, { fill: "forwards", duration: anim * 500, easing: "ease" });
}

function returnToSelected() {
    animateSelector(selectedTab);
}

function select(id) {
    $("#actions .selected").classList.remove("selected");
    $("#actions").children[id].classList.add("selected");
    $("#" + tabs[selectedTab] + "Container").style.display = "none";
    $("#" + tabs[id] + "Container").style.display = "flex";
    selectedTab = id;
    returnToSelected();
}

animateSelector(0, false);

window.addEventListener("resize", returnToSelected);

function loadActs() {
    fetch("actList").then(res => res.json()).then((res) => {
        res = res.sort((a, b) => {
            return a.start - b.start;
        });
        $("#activityContainer .list").innerHTML = "";
        for(let act of res) {
            var nw = document.createElement("div");
            let participants = JSON.parse(act.participants);
            var participantList = "";
            for(let p of participants) {
                participantList += `<div class="participant" onclick="userProfile('${p}')">${p}</div>`;
            }
            nw.classList.add("activity");
            nw.id = "activity" + act.id;
            nw.innerHTML = `
                <img class="ficon" src="assets/${antiEjection(act.genre)}.svg" />
                <div class="genre"><img class="genreIcon" src="assets/${act.genre}.svg" /><div class="genreText">${act.genre}</div></div>
                <div class="info"><b>Alt kategori:</b> ${antiEjection(act.activity)}</div>
                <div class="info"><b>Açıklama:</b> ${antiEjection(act.desc)}</div>
                <div class="info"><b>Yer:</b> ${act.place}</div>
                <div class="info"><b>Tarih:</b> ${formatDate(act.start)}</div>
                <div class="info"><b>Zaman Aralığı:</b> ${formatTime(act.start)}&nbsp;&nbsp;-&nbsp;&nbsp;${formatTime(act.end)}</div>
                <div class="info"><b>Kişi sayısı:</b> <span style="color: ${participants.length >= act.maxParticipants ? "#B00000" : "#009000"}">${participants.length}/${act.maxParticipants}</div>
                <div class="participants">
                    ${participantList}
                </div>
                <div class="activityJoin" ${!participants.includes(window.account) && participants.length >= act.maxParticipants ? "disabled" : ""} onclick="interAct(${act.id})">${participants.includes(window.account) ? "Aktiviteden Ayrıl" : "Aktiviteye Katıl"}</div>
            `;
            $("#activityContainer .list").appendChild(nw);
            nw.querySelectorAll(".participant").forEach(p => {
                randHue(p.innerHTML).then(res => {
                    p.style.setProperty("--phue", res);
                });
            });
        }
        if(res.length == 0) {
            let emptyInfo = document.createElement("div");
            emptyInfo.innerHTML = "Herhangi bir aktivite bulunamadı.";
            $("#activityContainer .list").appendChild(emptyInfo);
        }
    });
}

function loadEdus() {
    fetch("eduList").then(res => res.json()).then((res) => {
        res = res.sort((a, b) => {
            return a.start - b.start;
        });
        $("#eduContainer .list").innerHTML = "";
        for(let act of res) {
            var nw = document.createElement("div");
            let students = JSON.parse(act.students);
            var studentList = "";
            for(let p of students) {
                studentList += `<div class="participant">${p}</div>`;
            }
            let teachers = JSON.parse(act.teachers);
            var teacherList = "";
            for(let p of teachers) {
                teacherList += `<div class="participant">${p}</div>`;
            }
            let buttons;
            if(act.owner == window.account) {
                buttons = `<div class="eduJoin" onclick="interactEdu(${act.id})">Eğitimi İptal Et</div>`;
            } else if(teachers.includes(window.account) || students.includes(window.account)) {
                buttons = `<div class="eduJoin" onclick="interactEdu(${act.id})">Eğitimden Ayrıl</div>`;
            } else {
                buttons = `
                    <div class="eduJoin" onclick="interactEdu(${act.id}, 1)">Öğretici Olarak Katıl</div>
                    <div class="eduJoin" onclick="interactEdu(${act.id})">Öğrenci Olarak Katıl</div>
                    `;
            }
            nw.classList.add("activity");
            nw.id = "activity" + act.id;
            nw.innerHTML = `
                <img class="ficon" src="assets/${antiEjection(act.genre)}.svg" />
                <div class="genre"><img class="genreIcon" src="assets/${act.genre}.svg" onerror="this.style.height='0'"/><div class="genreText">${act.genre}</div></div>
                <div class="info"><b>Alt kategori:</b> ${antiEjection(act.subgenre)}</div>
                <div class="info"><b>Açıklama:</b> ${antiEjection(act.desc)}</div>
                <div class="info"><b>Yer:</b> ${act.place}</div>
                <div class="info"><b>Tarih:</b> ${formatDate(act.start)}</div>
                <div class="info"><b>Zaman Aralığı:</b> ${formatTime(act.start)}&nbsp;&nbsp;-&nbsp;&nbsp;${formatTime(act.end)}</div>
                <div class="info"><b>Öğretici sayısı:</b> <span>${teachers.length}</div>
                <div class="participants">
                    ${teacherList}
                </div>
                <div class="info"><b>Öğrenci sayısı:</b> <span>${students.length}/${act.maxStudents}</div>
                <div class="participants">
                    ${studentList}
                </div>
                <div>${buttons}</div>
            `;
            $("#eduContainer .list").appendChild(nw);
            nw.querySelectorAll(".participant").forEach(p => {
                randHue(p.innerHTML).then(res => {
                    p.style.setProperty("--phue", res);
                });
            });
        }
        if(res.length == 0) {
            let emptyInfo = document.createElement("div");
            emptyInfo.innerHTML = "Herhangi bir eğitim bulunamadı.";
            $("#eduContainer .list").appendChild(emptyInfo);
        }
    });
}

function loadAncs() {
    fetch("ancList").then(res => res.json()).then((res) => {
        res = res.sort((a, b) => {
            return b.end - a.end;
        });
        $("#ancContainer .list").innerHTML = "";
        for(let act of res) {
            var nw = document.createElement("div");
            nw.classList.add("activity");
            nw.id = "activity" + act.id;
            if(act.imageUrl) nw.classList.add("textimg");
            nw.innerHTML = `
                <div class="genre"><img class="genreIcon" src="assets/anc.svg" onerror="this.style.height='0'"/><div class="genreText">${antiEjection(act.genre)}</div></div>
                <div class="info">${antiEjection(act.desc).replace(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g, (a) => `<a href="${a}">${a.length > 35 ? a.slice(0,35) + "…" : a}</a>`).replace(/\n/g, "<descn></descn>")}</div>
                ${act.imageUrl ? `<img class="ancImg" src="usercontent/${act.imageUrl}" onclick="zoomImage(this)">` : ""}
                <div class="info"><b>Duyuran:</b> <span style="cursor:pointer;" onclick="userProfile('${act.owner}')">${act.owner}</span></div>
            `;
            $("#ancContainer .list").appendChild(nw);
            nw.querySelectorAll(".participant").forEach(p => {
                randHue(p.innerHTML).then(res => {
                    p.style.setProperty("--phue", res);
                });
            });
        }
        if(res.length == 0) {
            let emptyInfo = document.createElement("div");
            emptyInfo.innerHTML = "Herhangi bir eğitim bulunamadı.";
            $("#ancContainer .list").appendChild(emptyInfo);
        }
    });
}

function resized() {
    let cols = Math.ceil(window.innerWidth / 600);
    $(":root").style.setProperty("--part-cols", cols);
}

window.addEventListener("resize", resized);

function formatMins(mins) {
    let hrs = Math.floor(mins / 60);
    mins -= hrs * 60;
    return (hrs ? hrs + " saat " : "") + (mins ? mins + " dakika" : "");
}
function formatDate(t, pure = false) {
    var d = new Date(t);
    var now = new Date();
    if(!pure && now.getDate() == d.getDate() && now.getMonth() == d.getMonth() && now.getFullYear() == d.getFullYear()) {
        return `Bugün`;
    }
    return `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`
}
function formatTime(t) {
    var d = new Date(t);
    let time = `${(d.getHours() < 10 ? "0" : "") + d.getHours()}:${(d.getMinutes() < 10 ? "0" : "") + d.getMinutes()}`;
    return time;
}

resized();
loadActs();
loadEdus();
loadAncs();

function createActivity() {
    let genre = encodeURIComponent($("#actGenre").value);
    let activity = encodeURIComponent($("#actActivity").value);
    let start = encodeURIComponent(parseDate($("#actStart").innerText + " " + $("#actDate").innerText));
    let end = encodeURIComponent(parseDate($("#actEnd").innerText + " " + $("#actDate").innerText));
    let place = encodeURIComponent($("#actPlace").value);
    let maxParticipants = encodeURIComponent($("#actMaxParticipants").innerText);
    let desc = encodeURIComponent($("#actDesc").value);
    if(!genre) return error("Lütfen tür seçiniz.");
    if(!activity) return error("Lütfen alt tür seçiniz.");
    if(!place) return error("Lütfen yer seçiniz.");
    if(!maxParticipants) return error("Lütfen katılımcı sayısını giriniz.");
    if(isNaN(start) || isNaN(end)) return error("Lütfen tarihi ve saatleri düzgün yazınız.");
    if(genre && activity && place && maxParticipants) {
        fetch(`createAct?genre=${genre}&activity=${activity}&place=${place}&start=${start}&end=${end}&maxParticipants=${maxParticipants}&desc=${desc}`).then(res => res.text()).then(res => {
            if(res == "1") {
                loadActs();
                $("#activityCreate").style.display = "none";
            } else error(res);
        });
    }
}

function createEdu() {
    let genre = encodeURIComponent($("#eduGenre").value);
    let subgenre = encodeURIComponent($("#eduSubgenre").value);
    let start = encodeURIComponent(parseDate($("#eduStart").innerText + " " + $("#eduDate").innerText));
    let end = encodeURIComponent(parseDate($("#eduEnd").innerText + " " + $("#eduDate").innerText));
    let place = encodeURIComponent($("#eduPlace").value);
    let maxStudents = encodeURIComponent($("#eduMaxStudents").innerText);
    let desc = encodeURIComponent($("#eduDesc").value);
    if(!genre) return error("Lütfen tür seçiniz.");
    if(!subgenre) return error("Lütfen alt tür seçiniz.");
    if(!place) return error("Lütfen yer seçiniz.");
    if(!maxStudents) return error("Lütfen öğrenci sayısını giriniz.");
    if(isNaN(start) || isNaN(end)) return error("Lütfen tarihi ve saatleri düzgün yazınız.");
    if(genre && subgenre && place && maxStudents) {
        fetch(`createEdu?genre=${genre}&subgenre=${subgenre}&place=${place}&start=${start}&end=${end}&maxStudents=${maxStudents}&desc=${desc}${asTeacher ? "&asTeacher=1" : ""}`).then(res => res.text()).then(res => {
            if(res == "1") {
                loadEdus();
                $("#eduCreate").style.display = "none";
            } else error(res);
        });
    }
}

function createAnc() {
    let title = encodeURIComponent($("#ancTitle").value);
    let desc = encodeURIComponent($("#ancDesc").value);
    let file = $("#ancImage").files[0];
    var data = new FormData()
    data.append('file', file);
    if(desc && title) {
        fetch(`createAnc?title=${title}&desc=${desc}`, {
            method: "POST",
            body: data
        }).then(res => res.text()).then(res => {
            console.log("hello", res);
            if(res == "1") {
                loadAncs();
                $("#ancCreate").style.display = "none";
            } else error(res);
        });
    }
}

$("#actGenre").onchange = () => {
    var opt = activityOptions[$("#actGenre").value] || [];
    var ih = "<option value selected default>-Alt Tür Seçiniz-</option>" + opt.map(o => `<option value="${o}">${o}</option>`).join("");
    $("#actActivity").innerHTML = ih;
    customizeSelect($("#actActivity").parentElement);
};

$("#eduGenre").onchange = () => {
    var opt = eduOptions[$("#eduGenre").value] || [];
    var ih = "<option value selected default>-Alt Tür Seçiniz-</option>" + opt.map(o => `<option value="${o}">${o}</option>`).join("");
    $("#eduSubgenre").innerHTML = ih;
    customizeSelect($("#eduSubgenre").parentElement);
};

let placeOptions = "<option value selected default>-Yer Seçiniz-</option>" + places.map(o => `<option value="${o.name}">${o.name}</option>`);
$("#actPlace").innerHTML = placeOptions;
customizeSelect($("#actPlace").parentElement);
$("#eduPlace").innerHTML = placeOptions;
customizeSelect($("#eduPlace").parentElement);

function interAct(id) {
    fetch(`interAct?id=${id}`).then(res => res.text()).then(res => {
        if(res == "1") {
            loadActs();
        } else error(res);
    });
}

function interactEdu(id, asTeacher = false) {
    fetch(`interactEdu?id=${id}${asTeacher ? "&asTeacher=1" : ""}`).then(res => res.text()).then(res => {
        if(res == "1") {
            loadEdus();
        } else error(res);
    });
}

function parseDate(s) {
    var date = new Date();
    s = s.split(" ");
    var t = s[0].split(":");
    date.setHours(Number(t[0]));
    date.setMinutes(Number(t[1]));
    date.setSeconds(0);
    date.setMilliseconds(0);
    var d = s[1].split(".");
    date.setDate(Number(d[0]));
    date.setMonth(Number(d[1])-1);
    date.setFullYear(Number(d[2]));
    return date.getTime();
}

if(location.href.includes("edu")) {
    select(1);
    animateSelector(1, 0);
}
if(location.href.includes("anc")) {
    select(2);
    animateSelector(2, 0);
}

function resetInputs() {
    $("#actDate").innerHTML = formatDate(Date.now(), true);
    $("#actStart").innerHTML = formatTime(Date.now());
    $("#actEnd").innerHTML = formatTime(Date.now());
    $("#eduDate").innerHTML = formatDate(Date.now(), true);
    $("#eduStart").innerHTML = formatTime(Date.now());
    $("#eduEnd").innerHTML = formatTime(Date.now());
}

resetInputs();