var $ = (e) => document.querySelector(e);
var $$ = (e) => document.querySelectorAll(e);

window.addEventListener("load", async () => {
    $$(".numberInput").forEach(el => {
        /*el.addEventListener("blur", () => {
            let mx = el.getAttribute("max");
            let mn = el.getAttribute("min");
            if(mx != null && Number(el.innerHTML) > mx) el.innerHTML = "" + mx;
            if(mn != null && Number(el.innerHTML) < mn) el.innerHTML = "" + mn;
        });
        el.addEventListener("input", () => {
            if(/[^0-9]/g.test(el.innerHTML)) {
                let sel = window.getSelection();
                let pos = sel.focusOffset - 1;
                let target = sel.focusNode;
                var range = document.createRange()
                el.innerHTML = el.innerHTML.replace(/[^0-9]/g, "");
                range.setStart(target, pos)
                range.collapse(true)
                
                sel.removeAllRanges()
                sel.addRange(range)
            }
        });*/
    });
});

function userProfile(name) {
    location.href = ("/profile?q="+name);
}

async function randHue(name) {
    return (new DataView(await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(name))).getUint8(0) / 256 * 360 + 200) % 360;
}

async function randColor(name, saturation = 80, lightness = 80) {
    return `hsl(${await randHue(name)}, ${saturation}%, ${lightness}%)`;
}

let errorElement;

function error(t) {
    if(errorElement) errorElement.remove();
    errorElement = document.createElement("div"); 
    errorElement.id = "error";
    errorElement.innerHTML = t;
    document.body.appendChild(errorElement);
}