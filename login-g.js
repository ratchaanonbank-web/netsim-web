    import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

    const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    localStorage.clear();
    sessionStorage.clear();

    const form = document.getElementById("emailLoginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    /* ===== Eye Toggle (Font Awesome) ===== */
    window.togglePassword = function (inputId, iconEl) {
        const input = document.getElementById(inputId);

        if (input.type === "password") {
            input.type = "text";
            iconEl.classList.remove("fa-eye");
            iconEl.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            iconEl.classList.remove("fa-eye-slash");
            iconEl.classList.add("fa-eye");
        }
    };

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

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
            });

        if (error || !data) {
            showError(passwordInput, "Email or password is incorrect");
            return;
        }

        const userId = data.user.id;

        const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

        if (profileError || !profile) {
        showError(passwordInput, "Profile not found");
        return;
        }

    localStorage.setItem("user", JSON.stringify(profile));
    localStorage.setItem("id", profile.id);


        window.location.href = "/home";
    });
