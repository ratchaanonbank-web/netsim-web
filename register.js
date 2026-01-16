import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("registerForm");

const nameInput = document.getElementById("name");
const surnameInput = document.getElementById("surname");
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

    const englishRegex = /^[A-Za-z]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    let hasError = false;

    [nameInput, surnameInput, phoneInput].forEach(clearError);

    if (!englishRegex.test(nameInput.value.trim())) {
        showError(nameInput, "Please enter English letters only");
        hasError = true;
    }

    if (!englishRegex.test(surnameInput.value.trim())) {
        showError(surnameInput, "Please enter English letters only");
        hasError = true;
    }

    if (!phoneRegex.test(phoneInput.value.trim())) {
        showError(phoneInput, "Please enter a 10-digit phone number");
        hasError = true;
    }

    if (hasError) return;

    try {
        const phone = phoneInput.value.trim();

        const { data: existing } = await supabase
            .from("users")
            .select("phone_number")
            .eq("phone_number", phone)
            .maybeSingle();

        if (existing) {
            showError(phoneInput, "This phone number is already registered");
            return;
        }

        const randomUserId = Math.floor(10000 + Math.random() * 90000);

        await supabase.from("users").insert([{
            user_id: randomUserId,
            name: nameInput.value.trim(),
            surname: surnameInput.value.trim(),
            phone_number: phone
        }]);

        window.location.href = "login.html";

    } catch (err) {
        showError(phoneInput, "Something went wrong. Please try again");
    }
});
