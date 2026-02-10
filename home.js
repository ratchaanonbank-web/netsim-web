function checkAuth() {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) {
        window.location.replace("login.html");
        return; 
    } 
    const userInfo = document.getElementById("user-info");
    const welcomeText = document.getElementById("welcome-text");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");

    if (userInfo) userInfo.innerText = `${user.name} (${user.phone_number})`;
    if (welcomeText) welcomeText.innerText = `Hello ${user.name} ${user.surname}, choose the best service for you`;
    if (profileName) profileName.innerText = `${user.name} ${user.surname}`;
    if (profileEmail) profileEmail.innerText = user.email;
}

document.addEventListener("DOMContentLoaded", function() {
        // 1. ดึงข้อมูล User จาก LocalStorage
        const userStored = localStorage.getItem("user");
        
        if (userStored) {
            try {
                const user = JSON.parse(userStored);
                
                // 2. ตรวจสอบว่ามี field 'role' และเป็น 'admin' หรือ 'HAD' หรือไม่
                // (ปรับ user.role ให้ตรงกับชื่อ field จริงใน database ของคุณ เช่น user.user_role)
                if (user.role === 'admin' || user.role === 'HAD') {
                    const adminBtn = document.getElementById("adminBtn");
                    if (adminBtn) {
                        adminBtn.style.display = "block"; // แสดงปุ่ม
                    }
                }
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
    });

window.logout = function() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("login.html");
}
checkAuth();
