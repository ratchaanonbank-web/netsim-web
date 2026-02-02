import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function init() {
    const userId = localStorage.getItem("id");
    if (!userId) { window.location.replace("login.html"); return; }

    try {
        const { data: history, error } = await supabase
            .from("purchase_history")
            .select(`
                purchase_date,
                purchase_detail!fk_purchase_single_link (
                    price_logs (price),
                    internet_packages (package_name, max_speed),
                    entertainment_services (service_name)
                )
            `)
            .eq("id", userId)
            .order("purchase_date", { ascending: false });

        if (error) throw error;

        const listBody = document.getElementById("billing-list");
        const activeDiv = document.getElementById("active-package");

        // ... (ส่วนการดึงข้อมูลคงเดิม) ...

if (history && history.length > 0) {
    // 1. ส่วนตารางประวัติ (Billing History)
    listBody.innerHTML = history.map(item => {
        const detail = item.purchase_detail?.[0];
        if (!detail) return ""; 
        const name = detail.internet_packages?.package_name || detail.entertainment_services?.service_name || "Unknown";
        return `
            <tr>
                <td>${new Date(item.purchase_date).toLocaleDateString('th-TH')}</td>
                <td>${name}</td>
                <td class="price-col">${detail.price_logs?.price || 0} THB</td> 
                <td><span class="status-success">SUCCESS</span></td>
            </tr>`;
    }).join("");

    // 2. ส่วน My Usage แยกบน-ล่าง
    const netItems = history.filter(item => item.purchase_detail?.[0]?.internet_packages);
    const streamItems = history.filter(item => item.purchase_detail?.[0]?.entertainment_services);

    let finalHTML = "";
    
    // ส่วน Internet (บน)
    if (netItems.length > 0) {
        finalHTML += `<h4 class="usage-title net">Broadband Services</h4>`;
        finalHTML += netItems.map(item => {
            const d = item.purchase_detail[0].internet_packages;
            return `
                <div class="usage-item net-card">
                    <div class="info">
                        <h3>${d.package_name}</h3>
                        <p>High-Speed Connection</p>
                    </div>
                    <div class="metrics">
                        <div class="value-group">
                            <span class="value">${d.max_speed}</span>
                            <span class="unit">Mbps</span>
                        </div>
                        <div class="status-badge">ACTIVE</div>
                    </div>
                </div>`;
        }).join("");
    }

    // ส่วน Streaming (ล่าง)
    if (streamItems.length > 0) {
        finalHTML += `<h4 class="usage-title stream">Entertainment & Streaming</h4>`;
        finalHTML += streamItems.map(item => {
            const d = item.purchase_detail[0].entertainment_services;
            return `
                <div class="usage-item stream-card">
                    <div class="info">
                        <h3>${d.service_name}</h3>
                        <p>Premium Subscription</p>
                    </div>
                    <div class="metrics">
                        <div class="value-group">
                            <span class="value">PREMIUM</span>
                        </div>
                        <div class="status-badge">ACTIVE</div>
                    </div>
                </div>`;
        }).join("");
    }
    activeDiv.innerHTML = finalHTML;
}
    } catch (err) { console.error(err); }
}
init();