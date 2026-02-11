// ตั้งค่า Supabase สำหรับ Monitor โดยเฉพาะ
const MONITOR_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const MONITOR_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

// สร้าง Client แยก เพื่อไม่ให้ตีกับ script ตัวอื่นในหน้าเว็บ
const monitorClient = window.supabase.createClient(MONITOR_URL, MONITOR_KEY);

// ฟังก์ชันตรวจสอบ Role
async function checkUserRole() {
    try {
        const localUser = localStorage.getItem("user");
        if (!localUser) return; // ถ้ายังไม่ Login ก็ไม่ต้องทำอะไร

        const currentUser = JSON.parse(localUser);

        // ดึง Role ล่าสุดจาก Database
        const { data, error } = await monitorClient
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single();

        // ถ้ามี Error (เช่น เน็ตหลุดชั่วคราว) ให้ข้ามไปก่อน อย่าเพิ่ง Logout
        if (error || !data) return;

        // เปรียบเทียบ Role: ถ้าใน DB ไม่ตรงกับในเครื่อง -> ดีดออกทันที
        if (data.role !== currentUser.role) {
            console.log("Role changed! Force logout...");
            alert("สิทธิ์การใช้งานของคุณถูกเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่");
            
            localStorage.clear(); // ล้างข้อมูลทุกอย่าง
            window.location.href = "login.html"; // ดีดกลับหน้า Login
        }

    } catch (err) {
        console.error("Auth Monitor Error:", err);
    }
}

// สั่งให้ตรวจสอบทุกๆ 2 วินาที (2000 ms)
setInterval(checkUserRole, 2000);

// ตรวจสอบทันที 1 ครั้งเมื่อโหลดไฟล์นี้เสร็จ
checkUserRole();
