
var name = new URL(location.href).searchParams.get("q") || "";
let lastShown = 0;
let starSelected = 0;

$("#starInput").addEventListener("mousemove", (e) => {
    let percentage = e.offsetX / e.target.getBoundingClientRect().width * 10;
    let vote = Math.max(Math.ceil(percentage) / 2, 0.5);

    lastShown = vote;

    displayStars(vote);
});

$("#starInput").addEventListener("mousedown", (e) => {
    starSelected = lastShown;
});

$("#starInput").addEventListener("mouseleave", (e) => {
    displayStars(starSelected);
});

function displayStars(stars) {
    for(let ch of $("#starInput").children) {
        if(stars > 0.7) ch.classList.remove("nostar"), ch.classList.remove("halfstar"), ch.classList.add("star"); 
        else if(stars < 0.3) ch.classList.add("nostar"), ch.classList.remove("halfstar"), ch.classList.remove("star"); 
        else ch.classList.remove("nostar"), ch.classList.add("halfstar"), ch.classList.remove("star"); 
        stars--;
    }
}

function starString(stars) {
    let ret = "";
    for(let i = 0; i < 5; i++) {
        if(stars > 0.7) ret += '<div class="star"></div>';
        else if(stars < 0.3) ret += '<div class="nostar"></div>';
        else ret += '<div class="halfstar"></div>';
        stars--;
    }
    return ret;
}

async function loadData() {
    let res, data;
    try {
        res = await fetch("/profileData?q=" + name);
        data = await res.json();
    } catch(err) {
        $("#infoContainer").style.display = "flex";
        $("#mainContainer").style.display = "none";
        $("#loadInfo").innerHTML = "Bir şeyler ters gitti.";
        return;
    }

    if(data.error) {
        $("#infoContainer").style.display = "flex";
        $("#mainContainer").style.display = "none";
        $("#loadInfo").innerHTML = data.error;
        return;
    }

    $("#infoFullname").innerHTML = data.fullname;
    $("#infoName").innerHTML = data.name;
    randColor(data.name, 100, 40).then(color => {
        $("#infoName").style.color = color;
        $("#profileCard").style.setProperty("--color1", color);
    });
    $("#infoClass").innerHTML = classCalc(data.graduation);
    $("#infoHobbies").innerHTML = data.hobbies;
    $("#infoAboutMe").innerHTML = data.aboutMe;
    $("#averageScore").innerHTML = "Ortalama Puan: " + (data.reviews.length ? Math.round(data.reviews.reduce((a, b) => a + b.stars, 0) / data.reviews.length * 10) / 10 : "-");

    // render reviews ;_;
    $(".reviewList").innerHTML = "";
    for(let r of data.reviews) {
        let div = document.createElement("div");
        div.classList.add("reviewCard");
        div.innerHTML = `
            <div class="name" ${r.anonymous ? "" : `onclick="userProfile('${r.name}')"`} style="cursor: pointer;">${r.anonymous ? "Gizli Kullanıcı" : r.name}</div>
            <div class="reviewScore"><div class="reviewStars">${starString(r.stars)}</div></div></div>
            <div class="reviewText">${r.text}</div>
        `;
        $(".reviewList").appendChild(div);
    }

    if(data.reviews.length == 0) {
        let div = document.createElement("div");
        div.innerHTML = `Bu kullanıcı hiç değerlendirilmemiş.`;
        div.style.textAlign = "center";
        $(".reviewList").appendChild(div);
    }

    $("#infoContainer").style.display = "none";
    $("#mainContainer").style.display = "flex";
    $(".writeContainer").style.display = name == window.account ? "none" : "flex";
    $(".modifyProfile").style.display = name == window.account ? "block" : "none";
}

loadData();

function sendReview() {
    let text = encodeURIComponent($("#textInput").value);
    let anon = $("#anonInput").checked;
    if(!starSelected) return error("Lütfen yıldız seçiniz.");
    if(!text) return error("Lütfen boş alan bırakmayın.");
    if(starSelected && text) {
        fetch(`createReview?name=${name}&text=${text}&stars=${starSelected}${anon ? "&anon=1" : ""}`).then(res => res.text()).then(res => {
            if(res == "1") loadData();
            else error(res);
        });
    }
}

function classCalc(n) {
    let c = 2037 - n;
    if(c < 8 || c > 12) return "-";
    if(c == 8) return "Hazırlık";
    return c + ". Sınıf";
}

$(".modifyProfile .btn").addEventListener("click", () => {
    fetch(`modifyProfile?hobbies=${encodeURIComponent(modifyHobbies.value)}&aboutMe=${encodeURIComponent(modifyAboutMe.value)}`).then(res => res.json()).then(res => {
        if(!res.error) {
            loadData();
            modifyHobbies.value = "";
            modifyAboutMe.value = "";
        } else error(res.error);
    }).catch(err => error("Bir şeyler ters gitti."));
});