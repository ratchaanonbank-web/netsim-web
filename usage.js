import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- [ส่วนที่ 1] ตัวแปร Global ---
let globalHistoryData = [];
let currentPage = 1;
const datesPerPage = 2; // โชว์ทีละ 2 วัน

// ฟังก์ชันคำนวณวันหมดอายุ (dd/mm/yyyy)
function calcExpireDate(purchaseDate, serviceLife) {
    const d = new Date(purchaseDate);
    d.setDate(d.getDate() + Number(serviceLife)); // แปลง serviceLife เป็นตัวเลขเพื่อความชัวร์
    return d.toLocaleDateString("en-GB"); 
}

// ฟังก์ชันคำนวณวันคงเหลือ (แก้ไขให้นับถึงสิ้นวัน)
function getDaysRemaining(purchaseDate, serviceLife) {
    const d = new Date(purchaseDate);
    d.setDate(d.getDate() + Number(serviceLife));
    d.setHours(23, 59, 59, 999); // ✅ ตั้งเวลานับถึงสิ้นวัน
    
    const today = new Date();
    const diffTime = d - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return days >= 0 ? days : 0; // ไม่คืนค่าติดลบ
}

// ฟังก์ชันเช็คสถานะ Active
function isPackageActive(purchaseDate, serviceLife) {
    if (!serviceLife) return false;
    const expireDate = new Date(purchaseDate);
    expireDate.setDate(expireDate.getDate() + Number(serviceLife));
    
    // ตั้งเวลาหมดอายุเป็นสิ้นสุดวันนั้น (23:59:59)
    expireDate.setHours(23, 59, 59, 999);
    
    const now = new Date();
    return now <= expireDate; // ✅ ใช้ <= เพื่อให้รวมวินาทีสุดท้าย
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

// ✅ ปรับปรุงฟังก์ชันแสดง Active Packages
function renderActivePackages(history) {
    const activeDiv = document.getElementById("active-package");
    if(!activeDiv) return;
    activeDiv.innerHTML = "";
    
    let netItems = [], streamItems = [];
    let hasActive = false;

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

                // ✅ ใช้ isPackageActive ตัดสินใจว่าจะโชว์หรือไม่ (แทนการใช้ daysLeft > 0 แบบเดิม)
                if (isPackageActive(item.purchase_date, serviceLife)) {
                    hasActive = true;
                    const daysLeft = getDaysRemaining(item.purchase_date, serviceLife);
                    
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
    
    // เปลี่ยนสีป้าย ACTIVE ถ้าเหลือน้อยกว่า 1 วัน
      
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
                    <div class="status-badge">ACTIVE</div>
                </div>
            </div>
        </div>`;
}

// --- [ส่วนที่ 2] Billing History ---
function renderBillingHistory(data) {
    const tbody = document.getElementById("billing-table-body");
    const paginationDiv = document.getElementById("pagination");
    if(!tbody) return;
    
    tbody.innerHTML = "";
    if (paginationDiv) paginationDiv.innerHTML = "";

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

    // เรียงวันที่ล่าสุดขึ้นก่อน (Active Package มักจะอยู่ล่าสุด) หรือ เก่าไปใหม่ตามที่คุณต้องการ
    // ถ้าต้องการ เก่า -> ใหม่ ใช้ a - b
    // ถ้าต้องการ ใหม่ -> เก่า ใช้ b - a
    const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a)); // ปรับเป็น ใหม่ -> เก่า ให้ดูง่ายขึ้น

    const totalPages = Math.ceil(sortedDates.length / datesPerPage);
    if (currentPage > totalPages) currentPage = 1;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * datesPerPage;
    const endIndex = startIndex + datesPerPage;
    const datesToShow = sortedDates.slice(startIndex, endIndex);

    datesToShow.forEach(dateKey => {
        const itemsInDate = groupedData[dateKey];
        const displayDate = new Date(dateKey).toLocaleDateString("en-GB", {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        tbody.innerHTML += `
            <tr class="date-group-header">
                <td colspan="3">${displayDate}</td>
            </tr>
        `;

        let dailyTotal = 0; 

        itemsInDate.forEach(historyItem => {
            if (historyItem.purchase_detail) {
                historyItem.purchase_detail.forEach(detail => {
                    let name = "-", type = "-", price = 0, serviceLife = 0;

                    if (detail.internet_packages) {
                        name = detail.internet_packages.package_name;
                        serviceLife = detail.internet_packages.service_life; 
                        type = "Internet";
                    } else if (detail.entertainment_services) {
                        name = detail.entertainment_services.service_name;
                        serviceLife = detail.entertainment_services.service_life;
                        type = "Entertainment";
                    }
                    if (detail.price_logs) price = detail.price_logs.price;

                    const isActive = isPackageActive(historyItem.purchase_date, serviceLife);
                    const statusBadge = isActive 
                        ? `<span style="background:#28a745; color:white; padding:2px 8px; border-radius:10px; font-size:11px; margin-left:8px; font-weight:bold;">ACTIVE</span>` 
                        : "";

                    dailyTotal += price; 

                    tbody.innerHTML += `
                        <tr class="bill-item-row">
                            <td class="bill-item-name">${name} ${statusBadge}</td>
                            <td>${type}</td>
                            <td class="bill-price-col">${price.toLocaleString()} THB</td>
                        </tr>
                    `;
                });
            }
        });

        tbody.innerHTML += `
            <tr style="background-color: rgba(0,0,0,0.02); font-weight: bold; border-top: 1px dashed #ccc;">
                <td colspan="2" style="text-align: right; padding: 10px 15px;">Total :</td>
                <td style="padding: 10px 15px; color: #ff4646; text-shadow: 0px 0px 1px #333;">${dailyTotal.toLocaleString()} THB</td>
            </tr>
            <tr style="height: 10px; border:none;"></tr> `;
    });

    if (paginationDiv && totalPages > 1) {
        setupUsagePagination(totalPages, paginationDiv, data);
    }
}

// --- [ส่วนที่ 3] ปุ่ม Pagination ---
function setupUsagePagination(totalPages, container, currentDataList) {
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "❮";
    prevBtn.className = "page-btn";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderBillingHistory(currentDataList);
        }
    };
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.onclick = () => {
            currentPage = i;
            renderBillingHistory(currentDataList);
        };
        container.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "❯";
    nextBtn.className = "page-btn";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderBillingHistory(currentDataList);
        }
    };
    container.appendChild(nextBtn);
}

// --- [ส่วนที่ 4] Filter ---
window.filterHistoryByDate = function(selectedDate) {
    currentPage = 1; 
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
    currentPage = 1; 
    document.getElementById("dateFilter").value = "";
    renderBillingHistory(globalHistoryData);
}

init();
