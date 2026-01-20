import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");

const popupOverlay = document.getElementById("popupOverlay");
const popupLoading = document.getElementById("popupLoading");
const popupSuccess = document.getElementById("popupSuccess");

/* ===== Popup ===== */
function showLoading() {
  popupOverlay.classList.remove("hidden");
  popupLoading.classList.remove("hidden");
  popupSuccess.classList.add("hidden");
}

function showSuccess() {
  popupLoading.classList.add("hidden");
  popupSuccess.classList.remove("hidden");
}

window.closePopup = function () {
  popupOverlay.classList.add("hidden");
};

/* ===== Error helpers ===== */
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

/* ===== Submit ===== */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  clearError(emailInput);

  // ❌ validate email
  if (!emailRegex.test(email)) {
    showError(emailInput, "Invalid email address");
    return;
  }

  showLoading();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://my-netsim.vercel.app/reset-password.html",
  });

  // ❌ Supabase error (เช่น 46 seconds)
  if (error) {
    popupOverlay.classList.add("hidden");
    showError(emailInput, error.message);
    return;
  }

  // ✅ success
  showSuccess();
});

