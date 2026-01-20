import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
const messageBox = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageBox.textContent = "";

  if (!emailInput) {
    console.error("Email input not found");
    return;
  }

  const email = emailInput.value.trim();

  if (!email) {
    messageBox.textContent = "Please enter your email";
    messageBox.style.color = "red";
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://my-netsim.vercel.app/reset-password.html",
  });

  if (error) {
    messageBox.textContent = error.message;
    messageBox.style.color = "red";
  } else {
    messageBox.textContent = "Reset link sent to your email";
    messageBox.style.color = "green";
  }
});