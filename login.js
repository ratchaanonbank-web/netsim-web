import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const phoneInput = document.getElementById("phone");
    // ✅ ลบเฉพาะข้อมูลการ Login เดิม แต่เก็บค่า Theme ไว้
    localStorage.removeItem("user");
    localStorage.removeItem("id");
    sessionStorage.clear();

    function showError(input, message) {
        input.classList.add("input-error");
        let error = input.nextElementSibling;
        if (!error || !error.classList.contains("error-text")) {
            error = document.createElement("div");
            error.className = "error-text";
            input.after(error);
        }
        error.textContent = message;
    }

    function clearError(input) {
        input.classList.remove("input-error");
        const error = input.nextElementSibling;
        if (error && error.classList.contains("error-text")) {
            error.remove();
        }
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const phone = phoneInput.value.trim();
        clearError(phoneInput);

        // ตรวจสอบเบอร์โทร 10 หลัก
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            showError(phoneInput, "Please enter a 10-digit phone number");
            return;
        }

        try {
            const { data: user, error: userError } = await supabase
                .from("users")
                .select("*")
                .eq("phonenumber", phone)
                .maybeSingle();

            if (userError || !user) {
                showError(phoneInput, "Phone number not found in system");
                return;
            }

            const { error: funcError } = await supabase.functions.invoke('send-sms', {
                body: { phoneNumber: phone }
            });

            if (funcError) throw funcError;

            // เก็บค่าชั่วคราวเพื่อใช้ในหน้า OTP
            localStorage.setItem("temp_phone", phone);
            localStorage.setItem("temp_user_id", user.id);
            
            window.location.href = "otp.html";

        } catch (err) {
            console.error(err);
            showError(phoneInput, "System error: " + err.message);
        }
    });

    phoneInput.addEventListener("input", () => clearError(phoneInput));
});
