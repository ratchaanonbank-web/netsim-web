import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
const emailError = document.getElementById("emailError");
const messageBox = document.getElementById("message");
const popupOverlay = document.getElementById("popupOverlay");
const popupLoading = document.getElementById("popupLoading");
const popupSuccess = document.getElementById("popupSuccess");

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

  const email = emailInput.value.trim();
    const emailError = emailError.value.trim();

  messageBox.textContent = "";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasError = false;

    clearError(emailInput);

  if (!emailRegex.test(email)) {
    showError(emailInput, "Invalid email");
    hasError = true;
  }
  if (error) {
     showError(error.message);
    hasError = true;
  }
    if (hasError) return;

  showLoading();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://my-netsim.vercel.app/reset-password.html",
  });

  if (error) {
    popupOverlay.classList.add("hidden");
    messageBox.textContent = error.message;
    messageBox.style.color = "red";
  } else {

    showSuccess();
  }
});
