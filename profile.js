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
    console.log("Loading profile for ID:", id); // เช็คใน Console ว่า ID มาไหม
    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    if (data) {
        // อัปเดตทุกจุดที่มี ID นี้ (ป้องกันเรื่อง ID ซ้ำ)
        const nameElements = document.querySelectorAll("#profileName");
        nameElements.forEach(el => el.textContent = `${data.name} ${data.surname}`);

        const emailElements = document.querySelectorAll("#profileEmail");
        emailElements.forEach(el => el.textContent = data.email);

        const phoneElement = document.getElementById("profilePhone");
        if(phoneElement) phoneElement.innerHTML = `<strong>Phone:</strong> ${data.phonenumber || data.phone_number || '-'}`;

        const imgElements = document.querySelectorAll("#profileImage");
        imgElements.forEach(el => el.src = data.imgprofile || "img/P.png");
    }
}

// ห้ามลืมเรียกใช้งาน!
loadProfile();
