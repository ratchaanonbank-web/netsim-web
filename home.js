function checkAuth() {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
        window.location.replace("login.html");
        return;
    }

    // ✅ ถ้ามี User จริง ให้เปิดการมองเห็นของหน้าจอ
    document.body.style.visibility = "visible";

    // อัปเดตข้อมูลบนหน้าจอ (ตรวจสอบชื่อคอลัมน์ให้ตรงกับ Supabase ของคุณ)
    const userInfo = document.getElementById("user-info");
    if (userInfo) {
        // ใน Supabase ของคุณใช้ phonenumber (ไม่มีขีดล่าง)
        userInfo.innerText = `${user.name} (${user.phonenumber || user.phone_number})`;
    }
    const welcomeText = document.getElementById("welcome-text");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");

    // ตรวจสอบชื่อคอลัมน์ให้ตรงกับฐานข้อมูล (phonenumber ไม่มีขีดล่าง)
    if (userInfo) userInfo.innerText = `${user.name} (${user.phonenumber || user.phone_number})`;
    if (welcomeText) welcomeText.innerText = `Hello ${user.name} ${user.surname}, choose the best service for you`;
    if (profileName) profileName.innerText = `${user.name} ${user.surname}`;
    if (profileEmail) profileEmail.innerText = user.email;
}

// เรียกใช้งานทันที
checkAuth();
