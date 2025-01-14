places.forEach(p => {
    let el = document.createElement("div");
    el.classList.add("place");
    el.innerHTML = p.name;
    el.onclick = () => {
        $("#popupContainer").style.display = "flex";
        $("#placeName").innerHTML = p.name;
        $("#placeImage").src = p.imageUrl;
        $("#placeDesc").innerHTML = p.desc;
    }
    $("#placeList").appendChild(el);
});

$("#popupContainer").onclick = (e) => {
    if(e.target == $("#popupContainer")) $("#popupContainer").style.display = "none";
};