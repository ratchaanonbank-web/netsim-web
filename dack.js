/* ================= dack.js: Persistent Theme ================= */

// 🔥 1. สร้าง Style จำลองขึ้นมาเพื่อ "ปิด Transition ทั้งเว็บชั่วคราว"
const preventFlashStyle = document.createElement('style');
preventFlashStyle.textContent = `
    *, *::before, *::after {
        transition: none !important;
    }
`;
// ยัดลงไปใน <html> ทันทีตั้งแต่เบราว์เซอร์เริ่มอ่านไฟล์
document.documentElement.appendChild(preventFlashStyle);

// 2. ฟังก์ชันตรวจสอบและตั้งค่า Theme
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        if (document.body) document.body.classList.add('dark-mode');
    } else {
        document.documentElement.classList.remove('dark-mode');
        if (document.body) document.body.classList.remove('dark-mode');
    }

    // อัปเดตไอคอนปุ่ม (ถ้าปุ่มถูกเรนเดอร์แล้ว)
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(systemPrefersDark ? 'dark' : 'light');
    }
}

// รันทันที 1 รอบ สำหรับ <html>
initTheme();

// 🔥 3. ใช้ MutationObserver เฝ้ารอ <body> เกิดมาปุ๊บ ใส่สีดำปั๊บ! (สกัดการกระพริบขาว)
const observer = new MutationObserver(() => {
    if (document.body) {
        initTheme(); // ย้ำสีดำให้ body ทันที
        observer.disconnect(); // ใส่เสร็จแล้วก็เลิกเฝ้าดูได้เลย
    }
});
observer.observe(document.documentElement, { childList: true });

// 🔥 4. เมื่อโหลดโครงสร้างเว็บเสร็จ ค่อยเปิด Transition กลับมาให้สมูทเหมือนเดิม
document.addEventListener('DOMContentLoaded', () => {
    // อัปเดตปุ่มอีกรอบ เผื่อปุ่มเพิ่งโหลดเสร็จ
    initTheme(); 

    // บังคับให้เบราว์เซอร์รับรู้การวาดหน้าจอก่อน 1 เฟรม (Reflow) แล้วค่อยดึง Style ป้องกันแฟลชออก
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            preventFlashStyle.remove();
        });
    });
});

// ฟังก์ชันสำหรับกดปุ่มสลับโหมด
window.toggleTheme = function() {
    const isNowDark = document.documentElement.classList.contains('dark-mode');
    const newTheme = isNowDark ? 'light' : 'dark';
    
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}
