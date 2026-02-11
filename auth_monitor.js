/* ================= REAL-TIME ROLE MONITOR ================= */
// 1. ตั้งค่า Supabase (ถ้าในไฟล์นี้ยังไม่มีการประกาศ)
const MONITOR_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const MONITOR_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

// ตรวจสอบว่ามีตัวแปร supabase หรือยัง ถ้ายังให้สร้างใหม่
const monitorClient = window.supabase ? window.supabase.createClient(MONITOR_URL, MONITOR_KEY) : null;

if (monitorClient) {
    const localUser = localStorage.getItem("user");
    
    if (localUser) {
        const currentUser = JSON.parse(localUser);

        // A. ตรวจสอบทันทีเมื่อโหลดหน้า (ป้องกันเคสเปลี่ยนตอนปิดเว็บไปแล้ว)
        checkCurrentRole(currentUser.id, currentUser.role);

        // B. เฝ้าดูการเปลี่ยนแปลงแบบ Real-time (Subscription)
        monitorClient
            .channel('public:users')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'users', 
                filter: `id=eq.${currentUser.id}` 
            }, (payload) => {
                console.log('User update received:', payload);
                const newRole = payload.new.role;
                
                // ถ้า Role ใหม่ ไม่ตรงกับที่เก็บไว้ -> Logout ทันที
                if (newRole !== currentUser.role) {
                    alert("สิทธิ์การใช้งานของคุณถูกเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่");
                    handleForceLogout();
                }
            })
            .subscribe();
    }
}

// ฟังก์ชันตรวจสอบ Role ล่าสุดจาก DB
async function checkCurrentRole(userId, currentRole) {
    const { data, error } = await monitorClient
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    if (!error && data) {
        if (data.role !== currentRole) {
            alert("สิทธิ์การใช้งานของคุณถูกเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่");
            handleForceLogout();
        }
    }
}

// ฟังก์ชันสั่ง Logout
function handleForceLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("id"); // ลบ ID ด้วยถ้ามี
    window.location.href = "login.html";
}
