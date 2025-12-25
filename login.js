import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("loginForm");
const result = document.getElementById("result");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Login attempt started...");

    const phone = document.getElementById("phone").value;

    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("phone_number", phone)
            .maybeSingle(); 

        if (error) throw error;

        if (!data) {
            result.style.color = "red";
            result.textContent = "❌ Phone number not found";
            return;
        }

        localStorage.setItem("user", JSON.stringify(data));
        
        result.style.color = "green";
        result.textContent = `✅ Welcome ${data.name}`;
        
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1000);

    } catch (err) {
        console.error("Error:", err.message);
        result.style.color = "red";
        result.textContent = "❌ Error: " + err.message;
    }
});
