import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://mdwdzmkgehxwqotczmhh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M"
);

const form = document.getElementById("resetForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const messageBox = document.getElementById("message");

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
  if (error && error.classList.contains("error-text")) {
    error.remove();
  }
}


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();
  const passwordRegex = /^[A-Za-z0-9]+$/;
  let hasError = false;
  clearError(passwordInput);
  clearError(confirmPasswordInput);

  if (!passwordRegex.test(password)) {
    showError(passwordInput, "Password: a-z A-Z 0-9 only");
    hasError = true;
  }

  if (password.length < 6) {
    showError(passwordInput, "Password must be at least 6 characters");
    hasError = true;
  }

  if (password.length < 6) {
    showError(confirmPasswordInput, "Password must be at least 6 characters");
    hasError = true;
  }

  if (password !== confirmPassword) {
    showError(confirmPasswordInput, "Passwords do not match");
    hasError = true;
  }

  if (hasError) return;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    messageBox.textContent = error.message;
    messageBox.style.color = "red";
  } else {
    messageBox.textContent = "Password updated successfully";
    messageBox.style.color = "green";
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }
});
