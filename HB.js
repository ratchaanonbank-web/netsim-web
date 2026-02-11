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

// เรียกใช้งานเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', checkAdminAccess);
