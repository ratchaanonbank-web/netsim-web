import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://mdwdzmkgehxwqotczmhh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M"
);

const form = document.getElementById("resetForm");
const passwordInput = document.getElementById("password");
const messageBox = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = passwordInput.value.trim();
  if (password.length < 6) {
    messageBox.textContent = "Password must be at least 6 characters";
    messageBox.style.color = "red";
    return;
  }

  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    messageBox.textContent = error.message;
    messageBox.style.color = "red";
  } else {
    messageBox.textContent = "Password updated successfully";
    messageBox.style.color = "green";
    setTimeout(() => {
      window.location.href = "login-g.html";
    }, 1500);
  }
});

