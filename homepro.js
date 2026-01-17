import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(supabaseUrl, supabaseKey);

const userId = localStorage.getItem("userid");

const imgEl = document.getElementById("profileImage");
const nameEl = document.getElementById("profileName");
const emailEl = document.getElementById("profileEmail");

if (!userId) {
    document.querySelector(".profile-btn").style.display = "none";
} else {
    loadProfile();
}

async function loadProfile() {
    const { data, error } = await supabase
        .from("users")
        .select("name, surname, email, imgprofile")
        .eq("userid", userId)
        .single();

    if (error) {
        console.error(error);
        return;
    }
    nameEl.textContent = `${data.name} ${data.surname}`;
    emailEl.textContent = data.email;
    imgEl.src = data.imgprofile || "img/default-profile.png";
    imgEl.alt = "Profile";
}
