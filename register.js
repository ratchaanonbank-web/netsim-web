import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ===== Supabase ===== */
const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M"; // 🔒 ใส่ของคุณเอง
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ===== Form Elements ===== */
const form = document.getElementById("registerForm");

const nameInput = document.getElementById("name");
const surnameInput = document.getElementById("surname");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

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

/* ===== Error Helpers ===== */
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

/* ===== Register Submit ===== */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const surname = surnameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  const englishRegex = /^[A-Za-z]+$/;
  const phoneRegex = /^[0-9]{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^[A-Za-z0-9]+$/;

  let hasError = false;

  [
    nameInput,
    surnameInput,
    phoneInput,
    emailInput,
    passwordInput,
    confirmPasswordInput
  ].forEach(clearError);

  if (!englishRegex.test(name)) {
    showError(nameInput, "Name: English letters only");
    hasError = true;
  }

  if (!englishRegex.test(surname)) {
    showError(surnameInput, "Surname: English letters only");
    hasError = true;
  }

  if (!phoneRegex.test(phone)) {
    showError(phoneInput, "Phone must be 10 digits");
    hasError = true;
  }

  if (!emailRegex.test(email)) {
    showError(emailInput, "Invalid email");
    hasError = true;
  }

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

  /* ===== Check duplicate user ===== */
 const { data: emailCheck } = await supabase
  .from("users")
  .select("id")
  .eq("email", email)
  .maybeSingle();

if (emailCheck) {
  alert("Email already registered");
  return;
}


  /* ===== Insert User ===== */
// สมัคร Auth ก่อน
const { data, error: signUpError } = await supabase.auth.signUp({
  email,
  password
});

if (signUpError) {
  alert(signUpError.message);
  return;
}

const user = data.user;

if (!user) {
  alert("Register failed");
  return;
}


const { error } = await supabase.from("users").insert([
  {
    id: user.id,              // 🔑 ใช้ auth.users.id
    name,
    surname,
    phonenumber: phone,
    email,
    imgprofile: null
  }
]);

if (error) {
  console.error(error);
  alert("Register failed");
  return;
}

  window.location.href = "login.html";
});
