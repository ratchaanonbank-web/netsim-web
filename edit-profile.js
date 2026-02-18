const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const id = localStorage.getItem("id");

const nameInput = document.getElementById("name");
const surnameInput = document.getElementById("surname");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const imgInput = document.getElementById("imgprofile"); // ตอนนี้เป็น input type="file"
const preview = document.getElementById("profilePreview");

// ตัวแปรสำหรับเก็บข้อมูลรูปภาพ (Base64) ที่จะส่งไป Database
let currentBase64Image = "";

async function loadProfile() {
    const { data } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

    if (!data) return;

    nameInput.value = data.name || "";
    surnameInput.value = data.surname || "";
    phoneInput.value = data.phonenumber || "";
    emailInput.value = data.email || "";
    
    // เก็บค่ารูปเดิมไว้ก่อน ถ้า user ไม่เปลี่ยนรูปใหม่ก็ใช้ค่าเดิมนี้
    currentBase64Image = data.imgprofile || "";
    preview.src = currentBase64Image || "img/P.png";
}

loadProfile();

// เมื่อมีการเลือกไฟล์รูปภาพ
imgInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        // จำกัดขนาดไฟล์ (ตัวอย่าง: ไม่เกิน 2MB เพื่อไม่ให้ Database หนักเกินไป)
        if (file.size > 2 * 1024 * 1024) {
            alert("File size must be less than 2MB");
            imgInput.value = ""; // clear input
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            // ได้ค่า Base64 มาแล้ว นำไปแสดงผลและเตรียมบันทึก
            currentBase64Image = e.target.result;
            preview.src = currentBase64Image;
        };
        reader.readAsDataURL(file); // แปลงไฟล์เป็น Base64 String
    }
});

document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const { error } = await supabaseClient
        .from("users")
        .update({
            name: nameInput.value.trim(),
            surname: surnameInput.value.trim(),
            phonenumber: phoneInput.value.trim(),
            imgprofile: currentBase64Image // ส่งค่า Base64 ไปบันทึก
        })
        .eq("id", id);

    if (error) {
        alert("Update failed: " + error.message);
        console.error(error);
    } else {
        window.location.href = "profile.html";
    }
});
