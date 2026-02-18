const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let editingUserId = null;
let allUsersData = []; 
let currentPage = 1;
const rowsPerPage = 10;

// --- ตัวแปรสำหรับ History Modal ---
let allHistoryData = [];      
let currentHistoryGrouped = {}; 
let historyPage = 1;

// ✅ Config การแบ่งหน้า (Hybrid Logic)
const historyNormalDatesPerPage = 3; // วันปกติให้โชว์ 3 วันต่อหน้า
const historyHeavyDayThreshold = 4;  // ถ้าวันไหนซื้อ >= 4 ชิ้น ให้แยกเป็นหน้าเดียว

let currentHistorySort = 'desc'; 

window.onload = loadUsers;

async function loadUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: false });

    if (error) { console.error("Error loading users:", error); return; }
    allUsersData = users;
    renderTable(users);
}

function renderTable(users) {
    const tbody = document.getElementById("userTableBody");
    const paginationDiv = document.getElementById("pagination");
    tbody.innerHTML = "";
    if (paginationDiv) paginationDiv.innerHTML = "";

    const totalPages = Math.ceil(users.length / rowsPerPage);
    if (currentPage > totalPages) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const usersToShow = users.slice(startIndex, endIndex);

    const userStored = localStorage.getItem("user");
    const myId = localStorage.getItem("id"); 
    let myRole = "";
    if (userStored) {
        try { const userObj = JSON.parse(userStored); myRole = userObj.role; } catch (e) {}
    }

    usersToShow.forEach(user => {
         let badgeClass = "badge-user";
         if (user.role === 'admin') badgeClass = "badge-admin";
         if (user.role === 'HAD') badgeClass = "badge-had";

         let roleBtn = "";
         if (myRole === 'HAD' && user.id !== myId) {
             roleBtn = `<button class="action-btn btn-edit" onclick="openRoleModal('${user.id}', '${user.role}')">Edit Role</button>`;
         }

         const fullName = (user.name || '') + " " + (user.surname || '');
         const displayName = fullName.trim() === "" ? "-" : fullName;
         const phone = user.phonenumber || user.phone_number || '-';
         
         const row = `
            <tr>
                <td>${user.email}</td>
                <td>${displayName}</td>
                <td>${phone}</td>
                <td><span class="badge ${badgeClass}">${user.role.toUpperCase()}</span></td>
                <td>
                    <button class="action-btn btn-view" onclick="viewHistory('${user.id}', '${user.email}')">View Bill</button>
                    ${roleBtn}
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    if (paginationDiv && totalPages > 1) {
        setupPagination(totalPages, paginationDiv, users);
    }
}

function setupPagination(totalPages, container, currentDataList) {
    const prevBtn = document.createElement("button");
    prevBtn.innerText = "❮";
    prevBtn.className = "page-btn";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { currentPage--; renderTable(currentDataList); };
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.onclick = () => { currentPage = i; renderTable(currentDataList); };
        container.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.innerText = "❯";
    nextBtn.className = "page-btn";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { currentPage++; renderTable(currentDataList); };
    container.appendChild(nextBtn);
}


// ===========================================
// ✅ ส่วนจัดการ History Modal (Logic Hybrid)
// ===========================================

window.viewHistory = async function(userId, email) {
    document.getElementById("historyUserEmail").innerText = "User: " + email;
    
    // รีเซ็ตค่า Input
    const dateInput = document.getElementById("historyDateFilter");
    const sortSelect = document.getElementById("historySort");
    if (dateInput) dateInput.value = ""; 
    if (sortSelect) sortSelect.value = "desc";
    currentHistorySort = "desc";

    const { data: history, error } = await supabase
        .from("purchase_history")
        .select(`
            purchase_date,
            purchase_detail (
                price_logs (price),
                internet_packages (package_name),
                entertainment_services (service_name)
            )
        `)
        .eq("id", userId) 
        .order("purchase_date", { ascending: true });

    if (error) { console.error(error); return; }

    allHistoryData = history || [];
    filterHistoryByDate(); // เรียกฟังก์ชันกรองและแสดงผล
    
    document.getElementById("historyModal").style.display = "block";
}

// ฟังก์ชันกรองข้อมูลตามวันที่
window.filterHistoryByDate = function() {
    const selectedDate = document.getElementById("historyDateFilter").value;
    
    let filteredData = allHistoryData;
    if (selectedDate) {
        filteredData = allHistoryData.filter(h => {
            const itemDate = new Date(h.purchase_date).toISOString().split('T')[0];
            return itemDate === selectedDate;
        });
    }

    // จัดกลุ่มข้อมูล
    currentHistoryGrouped = {};
    filteredData.forEach(h => {
        const rawDate = new Date(h.purchase_date);
        const dateKey = rawDate.toISOString().split('T')[0];
        if (!currentHistoryGrouped[dateKey]) currentHistoryGrouped[dateKey] = [];
        currentHistoryGrouped[dateKey].push(h);
    });

    historyPage = 1;
    renderHistoryTable();
}

window.resetHistoryFilter = function() {
    document.getElementById("historyDateFilter").value = "";
    filterHistoryByDate();
}

window.setHistorySort = function(sortValue) {
    currentHistorySort = sortValue;
    historyPage = 1;
    renderHistoryTable();
}

// ✅ Render History แบบ Hybrid (แยกวันเยอะ / รวมวันน้อย)
function renderHistoryTable() {
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";

    // เรียงลำดับวันที่
    const sortedDates = Object.keys(currentHistoryGrouped).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return currentHistorySort === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // --- Logic แบ่งหน้าแบบ Hybrid ---
    let pages = [];
    let currentBatch = [];

    sortedDates.forEach(dateKey => {
        // นับจำนวนสินค้าในวันนี้
        let dailyItemCount = 0;
        if (currentHistoryGrouped[dateKey]) {
            currentHistoryGrouped[dateKey].forEach(h => {
                if(h.purchase_detail) dailyItemCount += h.purchase_detail.length;
            });
        }

        if (dailyItemCount >= historyHeavyDayThreshold) {
            // [เงื่อนไข 1]: ถ้าวันนี้ซื้อ >= 4 ชิ้น ให้แยกเป็นหน้าเดียว
            if (currentBatch.length > 0) {
                pages.push(currentBatch);
                currentBatch = [];
            }
            pages.push([dateKey]); // แยกหน้านี้เดี่ยวๆ

        } else {
            // [เงื่อนไข 2]: วันปกติ (< 4 ชิ้น) รวมกันได้สูงสุด 3 วัน
            currentBatch.push(dateKey);
            if (currentBatch.length >= historyNormalDatesPerPage) {
                pages.push(currentBatch);
                currentBatch = [];
            }
        }
    });

    // เก็บเศษที่เหลือ
    if (currentBatch.length > 0) pages.push(currentBatch);

    const totalPages = pages.length;
    
    if (sortedDates.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding: 20px;'>No purchase history found.</td></tr>";
        document.getElementById("historyPagination").innerHTML = "";
        return;
    }

    if (historyPage > totalPages) historyPage = 1;

    // ดึงวันที่ที่จะแสดงในหน้านี้
    const datesToShow = pages[historyPage - 1] || [];

    datesToShow.forEach(dateKey => {
        const itemsInDate = currentHistoryGrouped[dateKey];
        const displayDate = new Date(dateKey).toLocaleDateString("en-GB", {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        tbody.innerHTML += `
            <tr class="ad-H">
                <td colspan="3" class="a" color: #333; font-weight: bold; padding: 10px;">${displayDate}</td>
            </tr>
        `;

        let dailyTotal = 0;
        itemsInDate.forEach(h => {
            if(h.purchase_detail && h.purchase_detail.length > 0) {
                h.purchase_detail.forEach(d => {
                    const price = d.price_logs ? Number(d.price_logs.price) : 0;
                    let itemName = "Unknown";
                    let type = "-";
                    if (d.internet_packages) { itemName = d.internet_packages.package_name; type = "Internet"; }
                    else if (d.entertainment_services) { itemName = d.entertainment_services.service_name; type = "Service"; }
                    
                    dailyTotal += price;

                    tbody.innerHTML += `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px 10px 10px 30px;">${itemName}</td>
                            <td style="padding: 10px;">${type}</td>
                            <td style="padding: 10px; font-weight: bold;">${price.toLocaleString()} THB</td>
                        </tr>
                    `;
                });
            }
        });
        tbody.innerHTML += `
            <tr style="background: rgba(0,0,0,0.03); font-weight: bold; border-bottom: 2px solid #ddd;">
                <td colspan="2" style="text-align: right; padding: 10px;">Daily Total:</td>
                <td style="padding: 10px; color: #d97706;">${dailyTotal.toLocaleString()} THB</td>
            </tr>
        `;
    });

    let historyPaginationDiv = document.getElementById("historyPagination");
    if (!historyPaginationDiv) {
        historyPaginationDiv = document.createElement("div");
        historyPaginationDiv.id = "historyPagination";
        historyPaginationDiv.className = "pagination-container";
        historyPaginationDiv.style.margin = "20px 0";
        document.querySelector("#historyModal .modal-content").insertBefore(historyPaginationDiv, document.querySelector("#historyModal .modal-footer"));
    }
    
    historyPaginationDiv.innerHTML = "";
    if (totalPages > 1) {
        setupHistoryPagination(totalPages, historyPaginationDiv);
    }
}

function setupHistoryPagination(totalPages, container) {
    const prevBtn = document.createElement("button");
    prevBtn.innerText = "❮";
    prevBtn.className = "page-btn";
    prevBtn.disabled = historyPage === 1;
    prevBtn.onclick = () => { historyPage--; renderHistoryTable(); };
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = `page-btn ${i === historyPage ? 'active' : ''}`;
        btn.onclick = () => { historyPage = i; renderHistoryTable(); };
        container.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.innerText = "❯";
    nextBtn.className = "page-btn";
    nextBtn.disabled = historyPage === totalPages;
    nextBtn.onclick = () => { historyPage++; renderHistoryTable(); };
    container.appendChild(nextBtn);
}

window.closeHistoryModal = function() { document.getElementById("historyModal").style.display = "none"; }
window.openRoleModal = function(userId, currentRole) {
    editingUserId = userId; 
    const select = document.getElementById("roleSelect");
    if (select) select.value = currentRole; 
    document.getElementById("roleModal").style.display = "block"; 
}
window.closeRoleModal = function() { document.getElementById("roleModal").style.display = "none"; editingUserId = null; }
window.saveRoleChange = async function() {
    if (!editingUserId) return;
    const newRole = document.getElementById("roleSelect").value;
    const saveBtn = document.querySelector("#roleModal .btn-edit");
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', editingUserId);
    saveBtn.innerText = "Save";
    saveBtn.disabled = false;
    if (error) { alert("Error updating role: " + error.message); } 
    else { closeRoleModal(); loadUsers(); }
}

document.getElementById("searchInput").addEventListener("keyup", function() {
    const value = this.value.toLowerCase();
    const filtered = allUsersData.filter(user => {
        const text = (user.email + (user.name||'') + (user.surname||'') + user.role).toLowerCase();
        return text.includes(value);
    });
    currentPage = 1;
    renderTable(filtered);
});

window.onclick = function(event) {
    const roleModal = document.getElementById("roleModal");
    const historyModal = document.getElementById("historyModal");
    if (event.target == roleModal) closeRoleModal();
    if (event.target == historyModal) closeHistoryModal();
}

