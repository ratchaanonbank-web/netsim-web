/* ================= AUTH MONITOR (SMART CHECK) ================= */
// 1. ตั้งค่า Supabase
const MONITOR_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const MONITOR_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const monitorClient = window.supabase.createClient(MONITOR_URL, MONITOR_KEY);

// 2. กำหนดว่าหน้าไหน ใครเข้าได้บ้าง (Whitelist)
// ถ้าหน้าไหนไม่อยู่ในนี้ แปลว่าเข้าได้ทุกคน
const PAGE_PERMISSIONS = {
    "admin_dashboard.html": ["admin", "HAD"],  // เฉพาะ Admin และ HAD
    "check_stock.html": ["admin", "HAD"],      // ตัวอย่างหน้าอื่นๆ (ถ้ามี)
    // "home.html": ["user", "admin", "HAD"],  // ไม่ต้องใส่ก็ได้ เพราะเข้าได้ทุกคน
};

async function checkUserStatus() {
    try {
        const localUserStr = localStorage.getItem("user");
        if (!localUserStr) return; // ถ้าไม่ได้ Login ก็ข้าม

        const localUser = JSON.parse(localUserStr);

        // ดึง Role ล่าสุดจาก Database
        const { data, error } = await monitorClient
            .from('users')
            .select('role')
            .eq('id', localUser.id)
            .single();

        if (error || !data) return; // ถ้า Error ข้ามไปก่อน

        // === จุดตัดสินใจ (Decision Point) ===
        if (data.role !== localUser.role) {
            console.log(`Role changed from ${localUser.role} to ${data.role}`);

            // 1. หาชื่อไฟล์หน้าปัจจุบัน
            const currentPage = window.location.pathname.split("/").pop();

            // 2. เช็คว่า Role ใหม่ มีสิทธิ์ในหน้านี้ไหม?
            const allowedRoles = PAGE_PERMISSIONS[currentPage];

            // ถ้าหน้านี้มีการจำกัดสิทธิ์ และ Role ใหม่ *ไม่อยู่* ในรายชื่อที่อนุญาต
            if (allowedRoles && !allowedRoles.includes(data.role)) {
                // >>> กรณีนี้คือ "ใช้เครื่องของ Role อื่นอยู่" (ผิดกฎ) -> ดีดออก
                alert(`สิทธิ์ของคุณถูกเปลี่ยนเป็น ${data.role} ซึ่งไม่สามารถเข้าถึงหน้านี้ได้`);
                localStorage.clear();
                window.location.href = "login.html";
            } else {
                // >>> กรณีนี้คือ "เลื่อนขั้น" หรือ "อยู่ในหน้าที่ใครก็เข้าได้" -> อัปเดตสิทธิ์ให้ แล้วโหลดหน้าใหม่
                alert(`สิทธิ์ของคุณถูกอัปเดตเป็น ${data.role}`);
                
                // อัปเดตข้อมูลใน LocalStorage ให้เป็นปัจจุบัน
                localUser.role = data.role;
                localStorage.setItem("user", JSON.stringify(localUser));
                
                // รีโหลดหน้าเพื่อให้เมนูต่างๆ เปลี่ยนตาม Role ใหม่
                window.location.reload();
            }
        }

    } catch (err) {
        console.error("Monitor Error:", err);
    }
}

// เช็คทุกๆ 2 วินาที
setInterval(checkUserStatus, 2000);
