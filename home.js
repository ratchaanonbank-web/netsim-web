// home.js
function checkAuth() {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
        window.location.replace("login.html");
        return; 
    } 

    // แสดงเนื้อหาเมื่อยืนยันตัวตนสำเร็จ
    document.body.style.visibility = "visible";

    // แสดงผลข้อมูลตามปกติ
    const userInfo = document.getElementById("user-info");
    const welcomeText = document.getElementById("welcome-text");
    if (userInfo) userInfo.innerText = `${user.name} (${user.phonenumber})`; // แก้ตามชื่อคอลัมน์ในตาราง
    if (welcomeText) welcomeText.innerText = `Hello ${user.name} ${user.surname}, choose the best service for you`;
}

// ใน CSS ให้ตั้ง body { visibility: hidden; } ไว้สำหรับหน้า home.html
checkAuth();
