const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

// ตรวจสอบการโหลดไลบรารี
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadAllData() {
    // โหลดพร้อมกันเพื่อความเร็ว
    await Promise.all([
        loadInternetPackages(),
        loadEntertainmentServices()
    ]);
}

async function loadInternetPackages() {
    const { data: packages, error } = await supabase
        .from("internet_packages")
        .select(`
            package_id,
            package_name,
            service_life,
            max_speed,
            internet_usage_policy (
                policy_type,
                data_limit,
                speed_after_limit
            )
        `);

    if (error) {
        console.error("Pkg Error:", error);
        return;
    }

    const container = document.getElementById("internet-packages");
    if (!container) return;
    container.innerHTML = "Loading...";

    let html = "";
    for (const pkg of packages) {
        // ดึงราคาล่าสุดจาก price_logs
        const { data: priceData } = await supabase
            .from("price_logs")
            .select("price")
            .eq("package_id", pkg.package_id)
            .order("purchase_date", { ascending: false })
            .limit(1)
            .maybeSingle();

        const price = priceData ? priceData.price : "N/A";
        const policy = pkg.internet_usage_policy;
        let policyText = policy?.policy_type === "Unlimited" ? "Unlimited" : `${policy?.data_limit} GB`;

        html += `
            <div class="card">
                <h3>${pkg.package_name}</h3>
                <p><strong>Speed:</strong> ${pkg.max_speed} Mbps</p>
                <p><strong>Duration:</strong> ${pkg.service_life} Days</p>
                <p><strong>Policy:</strong> ${policyText}</p>
                <p class="price">${price} THB</p>
                <button onclick="location.href='login.html'">Buy Package</button>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function loadEntertainmentServices() {
    const { data: services, error } = await supabase
        .from("entertainment_services")
        .select("*");

    if (error) {
        console.error("Svc Error:", error);
        return;
    }

    const container = document.getElementById("entertainment-services");
    if (!container) return;
    container.innerHTML = "Loading...";

    let html = "";
    for (const svc of services) {
        const { data: priceData } = await supabase
            .from("price_logs")
            .select("price")
            .eq("service_id", svc.service_id)
            .order("purchase_date", { ascending: false })
            .limit(1)
            .maybeSingle();

        const price = priceData ? priceData.price : "N/A";
        let icon = svc.service_type === "Movie" ? "🎬" : svc.service_type === "Music" ? "🎵" : "🎮";

        html += `
            <div class="card">
                <h3>${icon} ${svc.service_name}</h3>
                <p><strong>Type:</strong> ${svc.service_type}</p>
                <p><strong>Duration:</strong> ${svc.service_life} Days</p>
                <p class="price">${price} THB</p>
                <button onclick="location.href='login.html'">Subscribe</button>
            </div>
        `;
    }
    container.innerHTML = html;
}

// เรียกใช้งานเมื่อโหลดหน้าเสร็จ

document.addEventListener("DOMContentLoaded", loadAllData);
