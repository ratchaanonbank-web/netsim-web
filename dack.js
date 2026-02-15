/* ================= Theme Toggle Logic ================= */

// 1. ฟังก์ชันตรวจสอบและเริ่มธีมทันที (ไม่ต้องรอ DOMContentLoaded ในส่วนของ class)
(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    // ถ้าเคยเซฟ dark ไว้ หรือถ้ายังไม่เคยเซฟแต่ในเครื่องตั้งค่า dark mode ไว้อยู่แล้ว
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
    }
})();

// 2. อัปเดตไอคอนปุ่มเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggleBtn');
    if (btn && document.body.classList.contains('dark-mode')) {
        btn.innerHTML = '☀️'; // ถ้าเป็น Dark Mode ให้โชว์ปุ่มพระอาทิตย์
    }
});

// 3. ฟังก์ชันสลับธีม (เรียกจากปุ่ม HTML)
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const btn = document.getElementById('themeToggleBtn');

    // บันทึกลง LocalStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // เปลี่ยนไอคอน
    if(btn) btn.innerHTML = isDark ? '☀️' : '🌙';
}
