import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const registerForm = document.getElementById("registerForm");
const result = document.getElementById("result");

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = document.getElementById("name").value;
    const surname = document.getElementById("surname").value;
    const phone = document.getElementById("phone").value;

    try {
        const { data: existing } = await supabase
            .from("users")
            .select("phone_number")
            .eq("phone_number", phone)
            .maybeSingle();

        if (existing) {
            result.style.color = "red";
            result.textContent = "❌ This phone number is already registered.";
            return;
        }
        const randomUserId = Math.floor(10000 + Math.random() * 90000);

        const { error } = await supabase
            .from("users")
            .insert([
                { 
                    user_id: randomUserId,   
                    name: name, 
                    surname: surname, 
                    phone_number: phone 
                }
            ]);

        if (error) throw error;

        result.style.color = "green";
        result.textContent = "✅ Registration successful! Redirecting to login...";
        
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (err) {
        console.error("Registration Error:", err.message);
        result.style.color = "red";
        result.textContent = "❌ Error: " + err.message;
    }
});
