document.querySelectorAll("#four > div").forEach(el => {
    el.onclick = () => {
        location.href = "/action";
    };
});