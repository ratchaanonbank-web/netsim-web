import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let globalHistoryData = [];

// ฟังก์ชันคำนวณวันหมดอายุ (dd/mm/yyyy)
function calcExpireDate(purchaseDate, serviceLife) {
    const d = new Date(purchaseDate);
    d.setDate(d.getDate() + serviceLife);
    return d.toLocaleDateString("en-GB"); 
}

// ฟังก์ชันคำนวณวันคงเหลือ
function getDaysRemaining(purchaseDate, serviceLife) {
    const d = new Date(purchaseDate);
    d.setDate(d.getDate() + serviceLife);
    const today = new Date();
    const diffTime = d - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function init() {
    let userId = localStorage.getItem("id");
    if (!userId) {
        const userStored = localStorage.getItem("user");
        if (userStored) {
            try { userId = JSON.parse(userStored).id; localStorage.setItem("id", userId); } 
            catch (e) {}
        }
    }
    if (!userId) { window.location.replace("login.html"); return; }

    try {
        const { data: history, error } = await supabase
            .from("purchase_history")
            .select(`
                purchase_date,
                purchase_detail (
                    price_logs (price),
                    internet_packages (package_name, max_speed, service_life),
                    entertainment_services (service_name, service_life)
                )
            `)
            .eq("id", userId)
            // --- จุดสำคัญ 1: ต้องเป็น true เพื่อให้ของใหม่ไปอยู่ท้ายสุด ---
            .order("purchase_date", { ascending: true });

        if (error) throw error;

        globalHistoryData = history;
        renderActivePackages(history);
        renderBillingHistory(history);

        const dateFilter = document.getElementById("dateFilter");
        if(dateFilter) {
            dateFilter.addEventListener("change", function() {
                filterHistoryByDate(this.value);
            });
        }

    } catch (err) { console.error("Error:", err); }
}

function renderActivePackages(history) {
    const activeDiv = document.getElementById("active-package");
    if(!activeDiv) return;
    activeDiv.innerHTML = "";
    
    let netItems = [], streamItems = [];
    let hasActive = false;

    // ข้อมูล history เรียงจาก เก่า -> ใหม่ อยู่แล้วตาม Query
    history.forEach(item => {
        if (item.purchase_detail) {
            item.purchase_detail.forEach(detail => {
                let name = "-", serviceLife = 0, speed = "-";
                let isNet = false;
                if (detail.internet_packages) {
                    name = detail.internet_packages.package_name;
                    serviceLife = detail.internet_packages.service_life;
                    speed = detail.internet_packages.max_speed;
                    isNet = true;
                } else if (detail.entertainment_services) {
                    name = detail.entertainment_services.service_name;
                    serviceLife = detail.entertainment_services.service_life;
                }
                const daysLeft = getDaysRemaining(item.purchase_date, serviceLife);
                if (daysLeft > 0) {
                    hasActive = true;
                    // push ใส่ array ตามลำดับ (เก่าเข้าก่อน ใหม่เข้าหลัง)
                    if (isNet) netItems.push({ ...item, daysLeft, speed, name, serviceLife }); 
                    else streamItems.push({ ...item, daysLeft, name, serviceLife });
                }
            });
        }
    });

    if (!hasActive) {
        activeDiv.innerHTML = `<p style="text-align:center; color:#999; width:100%;">No active packages.</p>`;
    } else {
        let finalHTML = "";
        if (netItems.length > 0) {
            finalHTML += `<h4 class="usage-title net">Internet Packages</h4>`;
            // map แสดงผล จะแสดงจาก บน(เก่า) -> ล่าง(ใหม่)
            finalHTML += netItems.map(item => createActiveCardHTML(item, true)).join("");
        }
        if (streamItems.length > 0) {
            finalHTML += `<h4 class="usage-title stream">Entertainment</h4>`;
            finalHTML += streamItems.map(item => createActiveCardHTML(item, false)).join("");
        }
        activeDiv.innerHTML = finalHTML;
    }
}

function createActiveCardHTML(item, isNet) {
    const expireDate = calcExpireDate(item.purchase_date, item.serviceLife);
    const borderStyle = isNet ? "" : "border-top-color: #a855f7;";
    const subTitle = isNet ? `Speed ${item.speed} Mbps` : "Premium Subscription";
    return `
        <div class="card-no-padding" style="margin-bottom: 20px; ${borderStyle}">
            <div class="usage-item">
                <div class="info">
                    <h3>${item.name}</h3>
                    <p>${subTitle}</p>
                    <p style="font-size:0.9rem; margin-top:5px; color:#94a3b8;">Expires: ${expireDate}</p>
                </div>
                <div class="metrics">
                    <div class="value-group"><div class="value">${item.daysLeft}</div><div class="unit">Days Left</div></div>
                    <div class="status-badge" >ACTIVE</div>
                </div>
            </div>
        </div>`;
}

function renderBillingHistory(data) {
    const tbody = document.getElementById("billing-table-body");
    if(!tbody) return;
    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:20px;'>No history found.</td></tr>";
        return;
    }

    const groupedData = {};
    data.forEach(item => {
        const rawDate = new Date(item.purchase_date);
        const dateKey = rawDate.toISOString().split('T')[0];
        if (!groupedData[dateKey]) groupedData[dateKey] = [];
        groupedData[dateKey].push(item);
    });

    // --- จุดสำคัญ 2: เรียงวันที่ a - b (น้อยไปมาก = เก่าไปใหม่) ---
    // ผลลัพธ์: วันที่เก่าสุดอยู่บนสุด -> วันที่ล่าสุดอยู่ล่างสุด
    const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));

    sortedDates.forEach(dateKey => {
        const itemsInDate = groupedData[dateKey];
        
        const displayDate = new Date(dateKey).toLocaleDateString("en-GB", {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        tbody.innerHTML += `
            <tr class="date-group-header">
                <td colspan="3">${displayDate}</td>
            </tr>
        `;

        itemsInDate.forEach(historyItem => {
            if (historyItem.purchase_detail) {
                historyItem.purchase_detail.forEach(detail => {
                    let name = "-", type = "-", price = 0;

                    if (detail.internet_packages) {
                        name = detail.internet_packages.package_name;
                        type = "Internet";
                    } else if (detail.entertainment_services) {
                        name = detail.entertainment_services.service_name;
                        type = "Entertainment";
                    }
                    if (detail.price_logs) price = detail.price_logs.price;

                    tbody.innerHTML += `
                        <tr class="bill-item-row">
                            <td class="bill-item-name">${name}</td>
                            <td>${type}</td>
                            <td class="bill-price-col">${price.toLocaleString()} THB</td>
                        </tr>
                    `;
                });
            }
        });
    });
}

window.filterHistoryByDate = function(selectedDate) {
    if (!selectedDate) {
        renderBillingHistory(globalHistoryData);
        return;
    }
    const filtered = globalHistoryData.filter(item => {
        const itemDate = new Date(item.purchase_date).toISOString().split('T')[0];
        return itemDate === selectedDate;
    });
    renderBillingHistory(filtered);
}

window.resetDateFilter = function() {
    document.getElementById("dateFilter").value = "";
    renderBillingHistory(globalHistoryData);
}

init();
