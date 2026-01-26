function checkAuth() {
    // ดึงข้อมูล user จาก localStorage
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    // ✅ [Auth Guard] ถ้าไม่มีข้อมูล user ในเครื่อง ให้ดีดกลับไปหน้า Login ทันที
    if (!user) {
        window.location.replace("login.html");
        return; // หยุดการทำงานของโค้ดส่วนอื่น
    } 

    // ถ้ามีข้อมูล user ให้แสดงผลตามปกติ
    const userInfo = document.getElementById("user-info");
    const welcomeText = document.getElementById("welcome-text");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");

    if (userInfo) userInfo.innerText = `${user.name} (${user.phone_number})`;
    if (welcomeText) welcomeText.innerText = `Hello ${user.name} ${user.surname}, choose the best service for you`;
    if (profileName) profileName.innerText = `${user.name} ${user.surname}`;
    if (profileEmail) profileEmail.innerText = user.email;
}

window.logout = function() {
    // ล้างค่าทุกอย่างก่อนออก
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("login.html");
}

// เรียกใช้งานทันทีที่โหลดสคริปต์
checkAuth();
