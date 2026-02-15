const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const id = localStorage.getItem("id");

const nameInput = document.getElementById("name");
const surnameInput = document.getElementById("surname");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const imgInput = document.getElementById("imgprofile");
const preview = document.getElementById("profilePreview");

async function loadProfile() {
    const { data } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

    if (!data) return;

    nameInput.value = data.name;
    surnameInput.value = data.surname;
    phoneInput.value = data.phonenumber;
    emailInput.value = data.email;
    imgInput.value = data.imgprofile || "";
    preview.src = data.imgprofile || "img/P.png";
}

loadProfile();

imgInput.addEventListener("input", () => {
    preview.src = imgInput.value || "img/P.png";
});

document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const { error } = await supabaseClient
        .from("users")
        .update({
            name: nameInput.value.trim(),
            surname: surnameInput.value.trim(),
            phonenumber: phoneInput.value.trim(),
            imgprofile: imgInput.value.trim()
        })
        .eq("id", id);

    if (error) {
        alert("Update failed");
        return;
    }
    window.location.href = "profile.html";
});
