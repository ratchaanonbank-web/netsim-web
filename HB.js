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
function checkAdminAccess() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return; // ถ้าไม่ได้ล็อกอิน ไม่ต้องทำอะไร
    
    try {
        const user = JSON.parse(userStr);
        const sidepanel = document.getElementById("mySidepanel");

        if ((user.role === 'admin' || user.role === 'HAD') && sidepanel) {
            
            // ตรวจสอบว่ามีปุ่ม Admin Products อยู่แล้วหรือยัง (ป้องกันปุ่มซ้ำ)
            if (!document.getElementById("adminProductsBtn")) {
                
                // สร้างลิงก์ Manage Products
                const productLink = document.createElement("a");
                productLink.href = "admin_products.html";
                productLink.innerHTML = "📦 Manage Products"; 
                productLink.style.color = "#ffeb3b"; 
                productLink.id = "adminProductsBtn"; // ตั้ง ID ไว้เผื่อเช็ค
                
                // หาปุ่ม Admin Dashboard อันเดิม เพื่อเอาไปแทรกต่อท้าย
                const adminBtn = document.getElementById("adminBtn");
                if (adminBtn) {
                    // แทรกต่อท้าย Admin Dashboard
                    adminBtn.insertAdjacentElement('afterend', productLink);
                } else {
                    // ถ้าหาไม่เจอ ให้ต่อท้ายสุดของเมนูแทน
                    sidepanel.appendChild(productLink);
                }
            }
        }
    } catch (e) {
        console.error("Error checking admin access in HB.js", e);
    }
}

document.addEventListener('DOMContent Loaded', checkAdminAccess);
