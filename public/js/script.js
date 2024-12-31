var $ = (e) => document.querySelector(e);
var $$ = (e) => document.querySelectorAll(e);

function userProfile(name) {
    location.href = ("/profile?q="+name);
}

async function randHue(name) {
    return (new DataView(await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(name))).getUint8(0) / 256 * 360 + 200) % 360;
}

async function randColor(name, saturation = 80, lightness = 80) {
    return `hsl(${await randHue(name)}, ${saturation}%, ${lightness}%)`;
}

let errorElement, rmTimeout;

function error(t) {
    if(errorElement) errorElement.remove();
    errorElement = document.createElement("div"); 
    errorElement.id = "error";
    errorElement.innerHTML = t;
    document.body.appendChild(errorElement);

    clearTimeout(rmTimeout);
    rmTimeout = setTimeout(() => {
        errorElement.animate({ opacity: 0 }, {duration: 600, "easing-function": "ease", fill: "forwards"}).onfinish = () => {
            errorElement.remove();
        };
    }, 6000);
}

function success(t) {
    if(errorElement) errorElement.remove();
    errorElement = document.createElement("div"); 
    errorElement.id = "error";
    errorElement.classList.add("success");
    errorElement.innerHTML = t;
    document.body.appendChild(errorElement);

    clearTimeout(rmTimeout);
    rmTimeout = setTimeout(() => {
        errorElement.animate({ opacity: 0 }, {duration: 600, "easing-function": "ease", fill: "forwards"}).onfinish = () => {
            errorElement.remove();
        };
    }, 6000);
}

function antiEjection(s) { return s.replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function zoomImage(el) {
    let rect = el.getBoundingClientRect();
    let sw = rect.width, sh = rect.height, sx = rect.x + sw / 2, sy = rect.y + sh / 2;
    let scale = Math.min(window.innerWidth * 0.8 / sw, window.innerHeight * 0.8 / sh);
    let ew = sw * scale, eh = sh * scale, ex = window.innerWidth / 2, ey = window.innerHeight / 2;
    console.log(sw, sh, sx, sy);
    let img = document.createElement("img");
    img.classList.add("zoomed");
    img.src = el.src;
    img.animate([{width: sw + "px", height: sh + "px", left: sx + "px", top: sy + "px"}, {width: ew + "px", height: eh + "px", left: ex + "px", top: ey + "px"}], {fill: "forwards", easing: "ease", duration: 400});
    
    let bg = document.createElement("div");
    bg.classList.add("zoombg");

    document.documentElement.appendChild(bg);
    document.documentElement.appendChild(img);

    img.addEventListener("click", () => {
        bg.animate({opacity: 0}, {duration: 200});
        img.animate({opacity: 0}, {duration: 200}).onfinish = () => {
            bg.remove();
            img.remove();
        };
    });

    bg.addEventListener("click", () => {
        bg.animate({opacity: 0}, {duration: 200});
        img.animate({opacity: 0}, {duration: 200}).onfinish = () => {
            bg.remove();
            img.remove();
        };
    });
}

window.addEventListener("resize", () => {
    $$(".zoomed, .zoombg").forEach(e => e.remove());
});