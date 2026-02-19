import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- [ส่วนที่ 1] ตัวแปร Global ---
let globalHistoryData = [];
let currentPage = 1;

// Config การแบ่งหน้า
const normalDatesPerPage = 3; // วันปกติให้โชว์ 3 วันต่อหน้า
const heavyDayThreshold = 4;  // ถ้าวันไหนซื้อ >= 4 ชิ้น ให้แยกเป็นหน้าเดียว

let currentSortOrder = 'desc'; 

function calcExpireDate(purchaseDate, serviceLife) {
    const d = new Date(purchaseDate);
    d.setDate(d.getDate() + Number(serviceLife));
    return d.toLocaleDateString("en-GB"); 
}

function getDaysRemaining(purchaseDate, serviceLife) {
    const d = new Date(purchaseDate);
    d.setDate(d.getDate() + Number(serviceLife));
    d.setHours(23, 59, 59, 999);
    
    const today = new Date();
    const diffTime = d - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return days >= 0 ? days : 0;
}

function isPackageActive(purchaseDate, serviceLife) {
    if (!serviceLife) return false;
    const expireDate = new Date(purchaseDate);
    expireDate.setDate(expireDate.getDate() + Number(serviceLife));
    expireDate.setHours(23, 59, 59, 999);
    const now = new Date();
    return now <= expireDate;
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
                purchase_id,
                purchase_date,
                payment_method,
                purchase_detail (
                    price_logs (price),
                    internet_packages (package_name, max_speed, service_life),
                    entertainment_services (service_name, service_life)
                )
            `)
            .eq("id", userId)
            .order("purchase_date", { ascending: false });

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
        const sortSelect = document.getElementById("sortOrder");
        if(sortSelect) {
            sortSelect.addEventListener("change", function() {
                currentSortOrder = this.value;
                currentPage = 1;
                renderBillingHistory(globalHistoryData);
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

    // 1. จัดกลุ่มข้อมูลตามวัน
    const groupedData = {};
    data.forEach(item => {
        const rawDate = new Date(item.purchase_date);
        const dateKey = rawDate.toISOString().split('T')[0];
        if (!groupedData[dateKey]) groupedData[dateKey] = [];
        groupedData[dateKey].push(item);
    });

    // 2. เรียงลำดับวันที่
    const sortedDates = Object.keys(groupedData).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return currentSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // ✅ Logic การแบ่งหน้าตามเงื่อนไขพิเศษ
    let pages = [];
    let currentBatch = [];

    sortedDates.forEach(dateKey => {
        // นับจำนวนสินค้าในวันนี้
        let dailyItemCount = 0;
        if (groupedData[dateKey]) {
            groupedData[dateKey].forEach(h => {
                if (h.purchase_detail) dailyItemCount += h.purchase_detail.length;
            });
        }

        if (dailyItemCount >= heavyDayThreshold) {
            // [เงื่อนไข 1]: ถ้าวันนี้ซื้อ >= 4 ชิ้น ให้แยกเป็นหน้าเดียว
            if (currentBatch.length > 0) {
                pages.push(currentBatch);
                currentBatch = [];
            }
            pages.push([dateKey]);

        } else {
            // [เงื่อนไข 2]: วันปกติ รวมกันได้สูงสุด 3 วัน (normalDatesPerPage)
            currentBatch.push(dateKey);

            if (currentBatch.length >= normalDatesPerPage) {
                pages.push(currentBatch);
                currentBatch = [];
            }
        }
    });

    if (currentBatch.length > 0) {
        pages.push(currentBatch);
    }

    const totalPages = pages.length;
    if (currentPage > totalPages) currentPage = 1;
    if (currentPage < 1) currentPage = 1;

    const datesToShow = pages[currentPage - 1] || [];

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
                <td colspan="2" style="text-align: right; padding: 10px 15px;">Daily Total :</td>
                <td style="padding: 10px 15px; color: #ff4646; text-shadow: 0px 0px 1px #333; display: flex; align-items: center; justify-content: flex-end; gap: 15px;">
                    ${dailyTotal.toLocaleString()} THB
                    <button onclick="downloadDailyReceipt('${dateKey}')" 
                            style="background-color: #fdef2e; color: #333; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        ⬇ Daily PDF
                    </button>
                </td>
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

// --- [ส่วนที่ 5] PDF Daily Receipt Generator ---
// --- [ส่วนที่ 5] PDF Daily Receipt Generator (พิมพ์ลง PDF โดยตรง) ---
window.downloadDailyReceipt = function(dateKey) {
    // 1. ดึงข้อมูล User
    const userStr = localStorage.getItem("user");
    let userName = "Valued Customer";
    let userEmail = "N/A";
    
    if (userStr) {
        try {
            const userObj = JSON.parse(userStr);
            userName = (userObj.name || "") + " " + (userObj.surname || "");
            if (userName.trim() === "") userName = "Valued Customer";
            userEmail = userObj.email || "N/A";
        } catch(e) {}
    }

    // 2. ดึงและกรองข้อมูลของวันนั้น
    const dayData = globalHistoryData.filter(item => {
        return new Date(item.purchase_date).toISOString().split('T')[0] === dateKey;
    });

    if (dayData.length === 0) return;

    const displayDate = new Date(dateKey).toLocaleDateString("en-GB", {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    const receiptNo = "INV-" + dateKey.replace(/-/g, "");
    
    // 3. เตรียมข้อมูลใส่ตาราง (เพิ่ม Payment)
    let tableData = [];
    let grandTotal = 0;

    dayData.forEach(historyItem => {
        // ดึงวิธีจ่ายเงินของรายการนั้นๆ
        const pMethod = historyItem.payment_method || 'N/A';

        if (historyItem.purchase_detail) {
            historyItem.purchase_detail.forEach(detail => {
                let name = "-", price = 0;
                if (detail.internet_packages) name = detail.internet_packages.package_name;
                else if (detail.entertainment_services) name = detail.entertainment_services.service_name;
                if (detail.price_logs) price = detail.price_logs.price;

                grandTotal += price;
                
                // ✅ เพิ่ม pMethod เข้าไปเป็นคอลัมน์ที่ 2 ของตารางใน PDF
                tableData.push([name, pMethod, Number(price).toLocaleString() + " THB"]);
            });
        }
    });

    // ==========================================
    // 4. เริ่มต้นสร้าง PDF และพิมพ์ข้อความลงไปตรงๆ
    // ==========================================
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); 

    // ตั้งค่าฟอนต์
    doc.setFont("helvetica");

    // --- ส่วนหัว (Header) ---
    doc.setFontSize(28);
    doc.setTextColor(26, 26, 26);
    doc.text("NETSIM", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Network Service Provider Co., Ltd.", 105, 27, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(40, 167, 69); // สีเขียว
    doc.text("DAILY RECEIPT / TAX INVOICE", 105, 38, { align: "center" });

    // วาดเส้นคั่น
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 45, 195, 45);

    // --- ข้อมูลลูกค้า (ซ้าย) ---
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("BILLED TO:", 15, 55);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(userName, 15, 62);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Email: " + userEmail, 15, 68);

    // --- ข้อมูลบิล (ขวา) ---
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Receipt No: " + receiptNo, 130, 55);
    doc.text("Date: " + displayDate, 130, 62);
    // (เอา Payment ตรงมุมขวาบนออก เพราะย้ายมาอยู่ในตารางแล้วจะได้ไม่ซ้ำซ้อน)

    // --- ✅ วาดตารางใหม่ (มี 3 คอลัมน์) ---
    doc.autoTable({
        startY: 75, 
        head: [['Description', 'Payment Method', 'Amount']], // ✅ เพิ่มหัวตาราง
        body: tableData, 
        theme: 'striped',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 11 },
        bodyStyles: { fontSize: 11 },
        columnStyles: {
            0: { cellWidth: 90 }, // ความกว้างช่องชื่อแพ็กเกจ
            1: { halign: 'center' }, // ✅ ช่อง Payment ให้จัดกึ่งกลาง
            2: { halign: 'right' }   // ช่องราคาจัดชิดขวา
        }
    });

    // --- สรุปยอดรวม (ต่อจากตาราง) ---
    let finalY = doc.lastAutoTable.finalY + 15; 
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Total Paid: ", 145, finalY);
    
    doc.setTextColor(220, 184, 0); // สีเหลืองทอง
    doc.setFont("helvetica", "bold");
    doc.text(grandTotal.toLocaleString() + " THB", 195, finalY, { align: "right" });

    // --- Footer ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for choosing NETSIM!", 105, 275, { align: "center" });
    doc.text("This is a computer-generated receipt and requires no signature.", 105, 281, { align: "center" });

    // 5. สั่งดาวน์โหลด
    doc.save(`NETSIM_Daily_Receipt_${receiptNo}.pdf`);
};

init();
