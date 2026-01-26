import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const userId = localStorage.getItem("temp_user_id");
const isAlreadyLoggedIn = localStorage.getItem("user");

if (isAlreadyLoggedIn) {
    window.location.replace("home.html");
}

if (!userId) {
    window.location.replace("login.html");
}

const otpInput = document.getElementById("otp");
const confirmBtn = document.getElementById("confirmOtpBtn");
const resendBtn = document.getElementById("resendBtn");
const errorMsg = document.getElementById("errorMsg");
const phoneText = document.getElementById("phoneText");

const tempPhone = localStorage.getItem("temp_phone");
if (phoneText && tempPhone) phoneText.innerText = tempPhone;

function toggleError(isError, message = "") {
    if (isError) {
        otpInput.classList.add("input-error");
        errorMsg.innerText = message;
    } else {
        otpInput.classList.remove("input-error");
        errorMsg.innerText = "";
    }
}

confirmBtn.addEventListener("click", async () => {
    const inputOtp = otpInput.value.trim();
    toggleError(false);

    if (!inputOtp) {
        toggleError(true, "Please enter OTP code.");
        return;
    }

    const { data: otpData, error: otpError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("id", userId)
        .eq("is_used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (otpError || !otpData || otpData.otp_code !== inputOtp) {
        toggleError(true, "Invalid OTP code. Please try again.");
        return;
    }

    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (profile) {
        // เก็บข้อมูล User จริง
        localStorage.setItem("id", profile.id);
        localStorage.setItem("user", JSON.stringify({
            name: profile.name,
            surname: profile.surname,
            phone_number: profile.phonenumber,
            email: profile.email
        }));

        // --- [หัวใจสำคัญ] ---
        // ล้างค่าชั่วคราวทิ้งทันที เพื่อไม่ให้ URL เดิมใช้งานได้อีก
        localStorage.removeItem("temp_user_id");
        localStorage.removeItem("temp_phone");

        await supabase.from("otp_codes").update({ is_used: true }).eq("otp_id", otpData.otp_id);

        // ใช้ replace เพื่อไม่ให้กดย้อนกลับมาได้
        window.location.replace("home.html");
    }
});

// ... ส่วน resendBtn และ startTimer คงเดิม ...

resendBtn.addEventListener("click", async () => {
    if (!tempPhone) return;

    resendBtn.disabled = true;
    resendBtn.innerText = "Sending...";

    const { error } = await supabase.functions.invoke('send-sms', {
        body: { phoneNumber: tempPhone }
    });

    if (error) {
        toggleError(true, "Failed to resend code.");
        resendBtn.disabled = false;
        resendBtn.innerText = "Resend OTP";
    } else {
        startTimer(60);
    }
});

function startTimer(seconds) {
    let timeLeft = seconds;
    const timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            resendBtn.innerText = "Resend OTP";
            resendBtn.disabled = false;
        } else {
            resendBtn.innerText = `Resend in (${timeLeft}s)`;
            timeLeft--;
        }
    }, 1000);
}