/* ================= dack.js: Persistent Theme ================= */

function applyTheme(theme) {
    const btn = document.getElementById('themeToggleBtn');
    
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        if (btn) btn.innerHTML = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        if (btn) btn.innerHTML = '🌙';
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // ถ้าเคยบันทึกไว้ (ไม่ว่า light หรือ dark) ให้ใช้ค่านั้นทันที
        applyTheme(savedTheme);
    } else {
        // ถ้าไม่เคยเข้าเว็บเลย ให้ดูตามระบบเครื่อง
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(systemPrefersDark ? 'dark' : 'light');
    }
}

window.toggleTheme = function() {
    const isNowDark = document.body.classList.contains('dark-mode');
    const newTheme = isNowDark ? 'light' : 'dark';
    
    // บันทึกฝังบอร์ด (LocalStorage)
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

// รันทันทีเพื่อให้จำค่าได้แม่นยำ
if (document.body) {
    initTheme();
} else {
    document.addEventListener('DOMContentLoaded', initTheme);
}
