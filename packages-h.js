const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadAllData() {
    await Promise.all([
        loadInternetPackages(),
        loadEntertainmentServices()
    ]);
}

// 1. โหลดข้อมูลพร้อมดึง price_id มาเตรียมไว้
async function loadInternetPackages() {
    const { data: packages, error } = await supabase.from("internet_packages").select(`*, internet_usage_policy(*)`);
    if (error) return;
    const container = document.getElementById("internet-packages");
    if (!container) return;
    
    let html = "";
    for (const pkg of packages) {
        const { data: priceData } = await supabase
            .from("price_logs")
            .select("price_id, price")
            .eq("package_id", pkg.package_id)
            .order("purchase_date", { ascending: false })
            .limit(1)
            .maybeSingle();

        const price = priceData ? priceData.price : "N/A";
        const priceId = priceData ? priceData.price_id : null;

        html += `
            <div class="card">
                <h3>${pkg.package_name}</h3>
                <p><strong>Speed:</strong> ${pkg.max_speed} Mbps</p>
                <p class="price">${price} THB</p>
                <button onclick="openPurchaseModal('${pkg.package_id}', '${pkg.package_name}', '${price}', 'internet', '${priceId}')">Buy Package</button>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function loadEntertainmentServices() {
    const { data: services, error } = await supabase.from("entertainment_services").select("*");
    if (error) return;
    const container = document.getElementById("entertainment-services");
    if (!container) return;

    let html = "";
    for (const svc of services) {
        const { data: priceData } = await supabase
            .from("price_logs")
            .select("price_id, price")
            .eq("service_id", svc.service_id)
            .order("purchase_date", { ascending: false })
            .limit(1)
            .maybeSingle();

        const price = priceData ? priceData.price : "N/A";
        const priceId = priceData ? priceData.price_id : null;

        html += `
            <div class="card">
                <h3>${svc.service_name}</h3>
                <p class="price">${price} THB</p>
                <button onclick="openPurchaseModal('${svc.service_id}', '${svc.service_name}', '${price}', 'service', '${priceId}')">Subscribe</button>
            </div>
        `;
    }
    container.innerHTML = html;
}

// 2. รับค่า priceId จากปุ่มมาเข้า Modal
window.openPurchaseModal = function(id, name, price, type, priceId) {
    const user = localStorage.getItem("user");
    if (!user) { window.location.replace("login.html"); return; }

    const modal = document.getElementById("purchaseModal");
    const details = document.getElementById("modalDetails");
    if (!modal || !details) return;

    details.innerHTML = `
        <div style="text-align: left;">
            <p><strong>Package:</strong> ${name}</p>
            <p><strong>Price:</strong> <span style="color: #dcb800; font-weight:bold;">${price} THB</span></p>  
        </div>
    `;

    modal.style.display = "block";

    // ส่งต่อ priceId ไปยังฟังก์ชัน handlePurchase
    document.getElementById("confirmPurchaseBtn").onclick = async () => {
        await handlePurchase(id, price, type, priceId);
        modal.style.display = "none";
    };
};

window.closePurchaseModal = function() {
    document.getElementById("purchaseModal").style.display = "none";
};

// 3. ฟังก์ชันสร้าง ID ของแต่ละตารางแล้วนำมาเชื่อมกัน
async function handlePurchase(itemId, price, type, existingPriceId) {
    const userId = localStorage.getItem("id");
    if (!userId) return;

    // สร้าง ID เฉพาะของแต่ละตาราง
    const purchaseId = "PH" + Math.floor(1000 + Math.random() * 9000); 
    const detailId = "D" + Math.floor(1000 + Math.random() * 9000);

    try {
        // ขั้นตอนที่ 1: บันทึกข้อมูลลง purchase_history (ตารางแม่)
        // ส่งแค่ข้อมูลภาพรวม ไม่ต้องส่ง detail_id แล้ว
        const { error: hErr } = await supabase.from("purchase_history").insert({
            purchase_id: purchaseId,
            id: userId,
            purchase_date: new Date().toISOString(),
            payment_method: 'Credit Card'
        });
        if (hErr) throw hErr; 

        // ขั้นตอนที่ 2: บันทึกข้อมูลลง purchase_detail (ตารางลูก)
        // ใช้ purchaseId เชื่อมกลับไปหาประวัติ และใช้ existingPriceId เชื่อมราคา
        const { error: dErr } = await supabase.from("purchase_detail").insert({
            detail_id: detailId,
            purchase_id: purchaseId,
            price_id: existingPriceId,
            package_id: type === 'internet' ? itemId : null,
            service_id: type === 'service' ? itemId : null
        });
        if (dErr) throw dErr;

        alert("สั่งซื้อสำเร็จ! รหัสอ้างอิง: " + purchaseId);
        window.location.href = "usage.html";

    } catch (e) {
        console.error("Database Error:", e);
        alert("เกิดข้อผิดพลาด: " + e.message);
    }
}

document.addEventListener("DOMContentLoaded", loadAllData);
