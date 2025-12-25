function checkAuth() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.replace("login.html");
    } else {
        document.getElementById("user-info").innerText =
            `${user.name} (${user.phone_number})`;

        document.getElementById("welcome-text").innerText =
            `Hello ${user.name} ${user.surname}, choose the best service for you`;
    }
}

window.logout = function() {
    localStorage.removeItem("user");
    localStorage.clear();
    window.location.replace("login.html");
}

checkAuth();
