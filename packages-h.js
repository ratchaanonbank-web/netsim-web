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

/* ================= Check ซื้อซ้ำ ================= */
async function hasPurchased(itemId, type) {
    const userId = localStorage.getItem("id");
    if (!userId) return false;

    let query = supabase
        .from("purchase_detail")
        .select(`
            detail_id,
            purchase_history!inner(id)
        `)
        .eq("purchase_history.id", userId);

    if (type === "internet") {
        query = query.eq("package_id", itemId);
    } else {
        query = query.eq("service_id", itemId);
    }

    const { data, error } = await query;
    if (error) {
        console.error(error);
        return false;
    }

    return data.length > 0;
}

/* ================= Open Purchase ================= */
/* ================= Check สถานะการใช้งานตามวันหมดอายุ ================= */
/* ================= Check usage status based on expiration date ================= */
async function getPackageStatus(itemId, type) {
    const userId = localStorage.getItem("id");
    if (!userId) return { isActive: false };

    // Fetch the latest purchase record for this item
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

    // 1. If never purchased or no data found -> Allow purchase
    if (error || !data || data.length === 0) {
        return { isActive: false };
    }

    const lastPurchase = data[0];
    const purchaseDate = new Date(lastPurchase.purchase_history.purchase_date);
    const serviceLife = type === "internet" 
        ? lastPurchase.internet_packages?.service_life 
        : lastPurchase.entertainment_services?.service_life;

    // 2. Calculate expiration date (Purchase date + Service life)
    const expireDate = new Date(purchaseDate);
    expireDate.setDate(expireDate.getDate() + serviceLife);
    
    // Set expiration time to the end of that day (23:59:59)
    expireDate.setHours(23, 59, 59, 999);
    
    const now = new Date();

    // 3. Compare current time with expiration date
    if (now > expireDate) {
        // If current time is past expiration -> Can repurchase
        return { isActive: false };
    } else {
        // If not yet expired -> Restrict repurchase
        return {
            isActive: true,
            expireDate: expireDate.toLocaleDateString("en-GB")
        };
    }
}

/* ================= Open Purchase (ส่วนที่เรียกใช้) ================= */
/* ================= Open Purchase Modal ================= */
window.openPurchaseModal = async function (id, name, price, type, priceId) {
    const user = localStorage.getItem("user");
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    // Check expiration status
    const status = await getPackageStatus(id, type);
    
    if (status.isActive) {
        // Notify user if the package is still active
        showAlert(`Your ${name} package is still active.\nIt will expire on: ${status.expireDate}\nPlease wait until it expires before purchasing again.`);
        return;
    }

    // If expired or new (isActive: false), open the modal normally
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
/* ================= แก้ไขฟังก์ชัน handlePurchase ใน packages-h.js ================= */
async function handlePurchase(itemId, price, type, existingPriceId) {
    const userId = localStorage.getItem("id");
    if (!userId) return;

    // 1. ดึงค่าที่ผู้ใช้เลือกจาก Select Box
    const selectedPayment = document.getElementById('paymentMethodSelect').value;

    const purchaseId = "PH" + Math.floor(1000 + Math.random() * 9000);
    const detailId = "D" + Math.floor(1000 + Math.random() * 9000);

    try {
        // 2. บันทึกลงตาราง purchase_history โดยใช้ค่า selectedPayment
        const { error: hErr } = await supabase
            .from("purchase_history")
            .insert({
                purchase_id: purchaseId,
                id: userId,
                purchase_date: new Date().toISOString().split('T')[0], // ใช้ YYYY-MM-DD ตามรูป
                payment_method: selectedPayment // <--- ใช้ค่าที่เลือกจากหน้าจอ
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
        showAlert("เกิดข้อผิดพลาดในการทำรายการ: " + e.message);
    }
}

document.addEventListener("DOMContentLoaded", loadAllData);
