import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("loginForm");
const phoneInput = document.getElementById("phone");

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
    let error = input.nextElementSibling;
    if (error && error.classList.contains("error-text")) {
        error.remove();
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearError(phoneInput);

    const phoneRegex = /^[0-9]{10}$/;
    const phone = phoneInput.value.trim();

    if (!phoneRegex.test(phone)) {
        showError(phoneInput, "Please enter a 10-digit phone number");
        return;
    }

    const { data } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", phone)
        .maybeSingle();

    if (!data) {
        showError(phoneInput, "Phone number not found");
        return;
    }

    localStorage.setItem("user", JSON.stringify(data));
    window.location.href = "home.html";
});
