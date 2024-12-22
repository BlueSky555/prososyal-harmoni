$("#activityCreate").onclick = (e) => {
    if(e.target == $("#activityCreate")) $("#activityCreate").style.display = "none";
}

$("#eduCreate").onclick = (e) => {
    if(e.target == $("#eduCreate")) $("#eduCreate").style.display = "none";
}

$("#activityContainer .new").onclick = (e) => {
    $("#activityCreate").style.display = "flex";
}

$("#eduContainer .new1").onclick = (e) => {
    isTeacher = true;
    $("#eduCreate").style.display = "flex";
}

$("#eduContainer .new2").onclick = (e) => {
    isTeacher = false;
    $("#eduCreate").style.display = "flex";
}

$("#activityContainer .refresh").onclick = (e) => {
    loadActs();
}

$("#eduContainer .refresh").onclick = (e) => {
    loadEdus();
}

function createActivity() {
    console.log($("#activityCreate input[type='number']").value);
}

let selectedTab = 0;
let tabs = ["activity", "edu", "anc"];

let activityOptions = {
    "Spor": ["Futbol", "Basketbol", "Masa Tenisi", "Badminton", "Voleybol"],
    "Zeka Oyunları": ["Satranç", "Dama"],
    "Müzik": ["Müzik"],
    "Sanat": ["Sanat"],
};

let eduOptions = {
    "Ders": ["Matematik", "Fizik", "Kimya", "Biyoloji"],
    "Zeka Oyunları": ["Satranç", "Dama"]
};

let isTeacher = false;

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
                <img class="ficon" src="assets/${act.genre}.svg" />
                <div class="genre"><img class="genreIcon" src="assets/${act.genre}.svg" /><div class="genreText">${act.genre}</div></div>
                <div class="info"><b>Alt kategori:</b> ${act.activity}</div>
                <div class="info"><b>Açıklama:</b> ${act.desc.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                <div class="info"><b>Yer:</b> ${act.place}</div>
                <div class="info"><b>Zaman Aralığı:</b> ${formatDate(act.start)}&nbsp;&nbsp;-&nbsp;&nbsp;${formatDate(act.end)}</div>
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
                <div class="genre"><img class="genreIcon" src="assets/${act.genre}.svg" onerror="this.style.height='0'"/><div class="genreText">${act.genre}</div></div>
                <div class="info"><b>Alt kategori:</b> ${act.subgenre}</div>
                <div class="info"><b>Kurucu:</b> ${act.owner}</div>
                <div class="info"><b>Yer:</b> ${act.place}</div>
                <div class="info"><b>Başlangıç:</b> ${formatDate(act.start)}</div>
                <div class="info"><b>Bitiş:</b> ${formatDate(act.end)}</div>
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
                randColor(p.innerHTML).then(res => {
                    p.style.backgroundColor = res;
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
function formatDate(t) {
    var d = new Date(t);
    var now = new Date();
    let time = `${(d.getHours() < 10 ? "0" : "") + d.getHours()}:${(d.getMinutes() < 10 ? "0" : "") + d.getMinutes()}`;
    if(now.getDate() == d.getDate() && now.getMonth() == d.getMonth() && now.getFullYear() == d.getFullYear()) {
        return `Bugün ${time}`;
    }
    return `${time} ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`
}

resized();
loadActs();
loadEdus();

function createActivity() {
    let genre = encodeURIComponent($("#actGenre").value);
    let activity = encodeURIComponent($("#actActivity").value);
    let start = encodeURIComponent(parseDate($("#actStart").innerText));
    let end = encodeURIComponent(parseDate($("#actEnd").innerText));
    let place = encodeURIComponent($("#actPlace").value);
    let maxParticipants = encodeURIComponent($("#actMaxParticipants").innerText);
    let desc = encodeURIComponent($("#actDesc").value);
    console.log(start, end);
    if(genre && activity && place && maxParticipants) {
        fetch(`createAct?genre=${genre}&activity=${activity}&place=${place}&start=${start}&end=${end}&maxParticipants=${maxParticipants}&desc=${desc}`).then(res => res.text()).then(res => {
            if(res == "1") {
                loadActs();
                $("#activityCreate").style.display = "none";
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


function interAct(id) {
    fetch(`interAct?id=${id}`).then(res => res.text()).then(res => {
        if(res == "1") {
            loadActs();
        } else error(res);
    });
}

function interactEdu(id, isTeacher = false) {
    fetch(`interactEdu?id=${id}${isTeacher ? "&isTeacher=1" : ""}`).then(res => res.text()).then(res => {
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
    if(s[1]) {
        var d = s[1].split("/");
        date.setDate(Number(d[0]));
        date.setMonth(Number(d[1])-1);
        date.setFullYear(Number(d[2]));
    }
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