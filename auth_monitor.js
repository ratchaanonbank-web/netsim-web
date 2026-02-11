/* ================= AUTH MONITOR (SMART CHECK) ================= */
// 1. ตั้งค่า Supabase Client (ใช้ชุดเดียวกับหน้าอื่นๆ)
const MONITOR_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const MONITOR_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const monitorClient = window.supabase.createClient(MONITOR_URL, MONITOR_KEY);

// 2. ตั้งค่า "โซนหวงห้าม" (หน้าไหน ใครเข้าได้บ้าง)
// * หน้าที่ไม่ได้เขียนไว้ในนี้ = เข้าได้ทุกคน *
const RESTRICTED_PAGES = {
    "admin_dashboard.html": ["admin", "HAD"],  // หน้านี้ให้เข้าได้แค่ Admin กับ HAD
    // "edit-profile.html": ["user", "admin", "HAD"] // ตัวอย่าง (ถ้าไม่ใส่ คือเข้าได้หมด)
};

async function smartRoleCheck() {
    try {
        const localUserStr = localStorage.getItem("user");
        if (!localUserStr) return; // ถ้าไม่ได้ Login อยู่ ก็จบ

        const localUser = JSON.parse(localUserStr);

        // ดึง Role ล่าสุดจาก Database
        const { data, error } = await monitorClient
            .from('users')
            .select('role')
            .eq('id', localUser.id)
            .single();

        // ถ้า error หรือหาไม่เจอ ข้ามไปก่อน
        if (error || !data) return;

        // === ถ้า Role ใน Database ไม่ตรงกับในเครื่อง (มีการเปลี่ยนแปลง) ===
        if (data.role !== localUser.role) {
            console.log(`Role Changed! Old: ${localUser.role}, New: ${data.role}`);

            // 1. หาชื่อไฟล์ปัจจุบัน (ตัดเอาแค่ชื่อไฟล์ เช่น 'admin_dashboard.html')
            let currentPage = window.location.pathname.split("/").pop();
            if (currentPage === "") currentPage = "index.html"; // กันเหนียวกรณีอยู่ root

            // 2. เช็คว่า Role ใหม่ มีสิทธิ์อยู่ในหน้านี้ไหม?
            const allowedRoles = RESTRICTED_PAGES[currentPage];

            // ตรวจสอบเงื่อนไขการ "ดีดออก"
            // ถ้าหน้านี้เป็นเขตหวงห้าม AND Role ใหม่ไม่มีชื่อในรายการอนุญาต
            if (allowedRoles && !allowedRoles.includes(data.role)) {
                
                alert(`สิทธิ์ของคุณถูกเปลี่ยนเป็น ${data.role} คุณไม่สามารถใช้งานหน้านี้ได้อีกต่อไป`);
                localStorage.clear();           // ล้างข้อมูล
                window.location.href = "login.html"; // ดีดไปหน้า Login
            
            } else {
                // ถ้าหน้านี้ใครก็อยู่ได้ หรือ Role ใหม่มีสิทธิ์อยู่ต่อ
                // ให้อัปเดตข้อมูลในเครื่อง แล้วรีเฟรชหน้าจอ
                alert(`สิทธิ์การใช้งานของคุณถูกอัปเดตเป็น ${data.role}`);
                
                localUser.role = data.role;
                localStorage.setItem("user", JSON.stringify(localUser)); // บันทึก Role ใหม่
                
                window.location.reload(); // รีเฟรชหน้าจอ (เพื่อให้เมนู Admin โผล่หรือซ่อนตามจริง)
            }
        }

    } catch (err) {
        console.error("Monitor Error:", err);
    }
}

// สั่งให้ทำงานทุกๆ 2 วินาที
setInterval(smartRoleCheck, 2000);
