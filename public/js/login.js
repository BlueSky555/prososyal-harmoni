let submit = document.querySelector("#submit");
let name = document.querySelector("#name");
let secret = document.querySelector("#secret");
let error = document.querySelector("#error");
submit.onclick = () => {
    if(name.value && secret.value) fetch("/login?name=" + encodeURIComponent(name.value) + "&secret=" + encodeURIComponent(secret.value)).then(res => res.text()).then(res => {
        if(res == "1") location.href = "/";
        else error.innerHTML = "Kullanıcı adınız veya şifreniz yanlış.";
    });
}