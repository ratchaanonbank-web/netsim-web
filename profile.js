const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M"; // ใส่ key ของคุณ

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const id = localStorage.getItem("id");

if (!id) {
    alert("Please login");
    window.location.href = "login.html";
}

async function loadProfile() {
    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    document.getElementById("profileName").textContent =
        data.name + " " + data.surname;

    document.getElementById("profileEmail").textContent = data.email;

    document.getElementById("profilePhone").textContent =
        "Phone: " + data.phonenumber;

    document.getElementById("profileImage").src =
        data.imgprofile || "img/P.png";
}

loadProfile();
