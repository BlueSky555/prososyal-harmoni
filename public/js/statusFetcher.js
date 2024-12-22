function pollNotifications() {
    fetch("/notification").then((res) => {
        if(res.status == 401) {
            location.href = "/login";
        } else {
            res.json().then((res) => {
                if(!window.account) window.account = res.name, onFetchAccount();
                window.account = res.name;
                if(res.notification) notify(res.notification);
            })
        }
    })
}

function onFetchAccount() {
    if("loadActs" in window) loadActs();
    if($("#profile")) {
        $("#profile").parentElement.href = "/profile?q=" + window.account;
    }
}

function notify(notif) {
    new Notification(notif.title, {body: notif.body});
}

setInterval(pollNotifications, 2000);
pollNotifications();