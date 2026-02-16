const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

/* ================= Popup Alert ================= */
function showAlert(message) {
    const modal = document.getElementById("alertModal");
    const msg = document.getElementById("alertMessage");
    if (!modal || !msg) return;

    msg.innerText = message;
    modal.style.display = "block";
}

window.closeAlert = function () {
    const modal = document.getElementById("alertModal");
    if (modal) modal.style.display = "none";
};

/* ================= Load All ================= */
async function loadAllData() {
    await Promise.all([
        loadInternetPackages(),
        loadEntertainmentServices()
    ]);
}

/* ================= Internet Packages ================= */
async function loadInternetPackages() {
    const { data: packages, error } = await supabase
        .from("internet_packages")
        .select(`*, internet_usage_policy(*)`);

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
        const policy = pkg.internet_usage_policy;
        let policyText = policy?.policy_type === "Unlimited" ? "Unlimited" : `${policy?.data_limit} GB`;

        html += `
            <div class="card">
                <h3>${pkg.package_name}</h3>
                <p><strong>Speed:</strong> ${pkg.max_speed} Mbps</p>
                <p><strong>Duration:</strong> ${pkg.service_life} Days</p>
                <p><strong>Policy:</strong> ${policyText}</p>
                <p class="price">${price} THB</p>
                <button onclick="openPurchaseModal(
                    '${pkg.package_id}',
                    '${pkg.package_name}',
                    '${price}',
                    'internet',
                    '${priceId}'
                )">Buy Package</button>
            </div>
        `;
    }

    container.innerHTML = html;
}

/* ================= Entertainment ================= */
async function loadEntertainmentServices() {
    const { data: services, error } = await supabase
        .from("entertainment_services")
        .select("*");

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
                <p><strong>Duration:</strong> ${svc.service_life} Days</p>
                <p class="price">${price} THB</p>
                <button onclick="openPurchaseModal(
                    '${svc.service_id}',
                    '${svc.service_name}',
                    '${price}',
                    'service',
                    '${priceId}'
                )">Subscribe</button>
            </div>
        `;
    }

    container.innerHTML = html;
}

/* ================= Check สถานะการใช้งาน (ACTIVE / EXPIRED) ================= */
async function getPackageStatus(itemId, type) {
    const userId = localStorage.getItem("id");
    if (!userId) return { isActive: false };

    // ดึงประวัติการซื้อล่าสุดของไอเทมนี้
    const { data, error } = await supabase
        .from("purchase_detail")
        .select(`
            purchase_history!inner(purchase_date, id),
            internet_packages(service_life),
            entertainment_services(service_life)
        `)
        .eq("purchase_history.id", userId)
        .eq(type === "internet" ? "package_id" : "service_id", itemId)
        .order("purchase_history(purchase_date)", { ascending: false })
        .limit(1);

    // 1. ถ้าไม่เคยซื้อเลย หรือไม่พบข้อมูล -> ให้ซื้อได้
    if (error || !data || data.length === 0) {
        return { isActive: false };
    }

    const lastPurchase = data[0];
    const purchaseDate = new Date(lastPurchase.purchase_history.purchase_date);
    const serviceLife = type === "internet" 
        ? lastPurchase.internet_packages?.service_life 
        : lastPurchase.entertainment_services?.service_life;

    if (!serviceLife) return { isActive: false };

    // 2. คำนวณวันหมดอายุ (วันที่ซื้อ + จำนวนวันของแพ็กเกจ)
    const expireDate = new Date(purchaseDate);
    expireDate.setDate(expireDate.getDate() + serviceLife);
    
    // ตั้งเวลาหมดอายุเป็นสิ้นสุดวันนั้น (23:59:59) เพื่อให้สอดคล้องกับหน้า Usage
    expireDate.setHours(23, 59, 59, 999);
    
    const now = new Date();

    // 3. ตรวจสอบสถานะปัจจุบันเทียบกับเวลาจริง
    if (now > expireDate) {
        // ถ้าเวลาปัจจุบันเลยวันหมดอายุไปแล้ว -> ซื้อใหม่ได้
        return { isActive: false };
    } else {
        // ถ้ายังไม่ถึงวันหมดอายุ -> ห้ามซื้อซ้ำ
        return {
            isActive: true,
            expireDate: expireDate.toLocaleDateString("en-GB")
        };
    }
}

/* ================= Open Purchase Modal ================= */
window.openPurchaseModal = async function (id, name, price, type, priceId) {
    const user = localStorage.getItem("user");
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    // ตรวจสอบสถานะวันหมดอายุ
    const status = await getPackageStatus(id, type);
    
    if (status.isActive) {
        // แจ้งเตือนภาษาอังกฤษ
        showAlert(`Your ${name} package is still active.\nIt will expire on: ${status.expireDate}\nPlease wait until it expires before purchasing again.`);
        return;
    }

    // ถ้าหมดอายุแล้ว หรือไม่เคยซื้อ ให้เปิด Modal
    const modal = document.getElementById("purchaseModal");
    const details = document.getElementById("modalDetails");

    details.innerHTML = `
        <div style="text-align:left;">
            <p><strong>Package:</strong> ${name}</p>
            <p><strong>Price:</strong>
                <span style="color:#dcb800;font-weight:bold;">
                    ${price} THB
                </span>
            </p>
        </div>
    `;

    modal.style.display = "block";

    document.getElementById("confirmPurchaseBtn").onclick = async () => {
        await handlePurchase(id, price, type, priceId);
        modal.style.display = "none";
    };
};

window.closePurchaseModal = function () {
    const modal = document.getElementById("purchaseModal");
    if (modal) modal.style.display = "none";
};

/* ================= Handle Purchase ================= */
async function handlePurchase(itemId, price, type, existingPriceId) {
    const userId = localStorage.getItem("id");
    if (!userId) return;

    // 1. ดึงค่าที่ผู้ใช้เลือกจาก Select Box
    const selectedPayment = document.getElementById('paymentMethodSelect').value;

    const purchaseId = "PH" + Math.floor(1000 + Math.random() * 9000);
    const detailId = "D" + Math.floor(1000 + Math.random() * 9000);

    try {
        // 2. บันทึกลงตาราง purchase_history
        const { error: hErr } = await supabase
            .from("purchase_history")
            .insert({
                purchase_id: purchaseId,
                id: userId,
                purchase_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                payment_method: selectedPayment
            });

        if (hErr) throw hErr;

        // 3. บันทึกรายละเอียดลง purchase_detail
        const { error: dErr } = await supabase
            .from("purchase_detail")
            .insert({
                detail_id: detailId,
                purchase_id: purchaseId,
                price_id: existingPriceId,
                package_id: type === "internet" ? itemId : null,
                service_id: type === "service" ? itemId : null
            });

        if (dErr) throw dErr;

        window.location.href = "usage.html";

    } catch (e) {
        console.error(e);
        showAlert("Transaction Error: " + e.message);
    }
}

document.addEventListener("DOMContentLoaded", loadAllData);
