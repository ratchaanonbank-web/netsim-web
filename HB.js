function openNav() {
  document.getElementById("mySidepanel").style.width = "350px";
}

function closeNav() {
  document.getElementById("mySidepanel").style.width = "0";
}

// เพิ่มโค้ดนี้ใน home.js หรือ HB.js หรือส่วน window.onload ของหน้า home.html
function checkAdminAccess() {
    const role = localStorage.getItem("role");
    const sidepanel = document.getElementById("mySidepanel");

    if ((role === 'admin' || role === 'HAD') && sidepanel) {
        // สร้าง Link ไปหน้า Admin Dashboard
        const adminLink = document.createElement("a");
        adminLink.href = "admin_dashboard.html";
        adminLink.innerHTML = "🛠️ Admin Dashboard"; // ใส่ไอคอนให้เด่น
        adminLink.style.color = "#ffeb3b"; // สีเหลืองให้เด่นกว่าอันอื่น
        
        // แทรกไว้บนสุด หรือ ต่อท้ายก็ได้
        sidepanel.appendChild(adminLink);
    }
}

async function verifyUserRole() {
    const userJson = localStorage.getItem("user");
    if (!userJson) return; // ถ้าไม่มี user ก็ปล่อยให้ check.js เดิมทำงานไป

    const currentUser = JSON.parse(userJson);

    // ดึง Role ล่าสุดจาก Supabase
    const { data: dbUser, error } = await supabase
        .from('users')
        .select('role, status') // เช็ค status เผื่อกรณีโดนแบนด้วย
        .eq('id', currentUser.id)
        .single();

    if (error || !dbUser) {
        console.error("Error verifying user:", error);
        return;
    }

    // 1. เช็คว่า Role เปลี่ยนไปจากใน localStorage หรือไม่?
    // 2. (ตัวเลือกเสริม) เช็คว่า status เป็น active หรือไม่?
    if (dbUser.role !== currentUser.role) {
        alert("Your role has been updated. Please login again.");
        forceLogout();
    } 
    
    // (แถม) ถ้าอยากเช็คสถานะการแบน
    // if (dbUser.status === 'banned') { ... }
}

function forceLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("login_timestamp"); // ถ้ามี
    window.location.href = "login.html";
}

// เรียกใช้ฟังก์ชันเมื่อโหลดหน้า
window.addEventListener('load', () => {
    // ต้องมั่นใจว่า supabase client ถูก create แล้ว
    verifyUserRole();
});
// เรียกใช้งานเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', checkAdminAccess);
