let submit = document.querySelector("#submit");
let name = document.querySelector("#name");
let secret = document.querySelector("#secret");
submit.onclick = () => {
    if(!name.value || !secret.value) return error("Lütfen kullanıcı adınızı ve şifrenizi giriniz.");
    if(name.value && secret.value) fetch("/login?name=" + encodeURIComponent(name.value) + "&secret=" + encodeURIComponent(secret.value)).then(res => res.text()).then(res => {
        if(res == "1") location.href = "/";
        else error(res);
    });
}

showSecret.onclick = () => {
    if(secret.type == "text") secret.type = "password";
    else secret.type = "text";
};