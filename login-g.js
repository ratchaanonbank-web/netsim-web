import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("emailLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

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
    if (error && error.classList.contains("error-text")) error.remove();
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearError(emailInput);
    clearError(passwordInput);

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    let hasError = false;

    if (!email) {
        showError(emailInput, "Email is required");
        hasError = true;
    }

    if (!password) {
        showError(passwordInput, "Password is required");
        hasError = true;
    }

    if (hasError) return;

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();

    if (error || !data) {
        showError(passwordInput, "Email or password is incorrect");
        return;
    }

    // ✅ แก้ตรงนี้ (สำคัญมาก)
    localStorage.setItem("user", JSON.stringify(data));
    localStorage.setItem("userid", data.userid);

    window.location.href = "home.html";
});
