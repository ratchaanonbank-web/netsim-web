import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔹 ใส่ค่าจริงของคุณ
const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("loginForm");
const result = document.getElementById("result");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const phone = document.getElementById("phone").value;

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", phone)
        .single();

    if (error || !data) {
        result.style.color = "red";
        result.textContent = "❌ Phone number not found";
        return;
    }

    result.style.color = "green";
    result.textContent = `✅ Welcome ${data.name} ${data.surname}`;
    localStorage.setItem("user", JSON.stringify(data));
    // ตัวอย่าง redirect
    window.location.href = "home.html";
});
