import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  messageBox.textContent = "";

  if (!email) {
    messageBox.textContent = "Please enter your email";
    messageBox.style.color = "red";
    return;
  }

  // 🔄 แสดง popup โหลด
  showLoading();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://my-netsim.vercel.app/reset-password.html",
  });

  if (error) {
    popupOverlay.classList.add("hidden");
    messageBox.textContent = error.message;
    messageBox.style.color = "red";
  } else {
    // ✅ ส่งสำเร็จ
    showSuccess();
  }
});
