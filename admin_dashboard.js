const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let editingUserId = null;
let allUsersData = []; 
let currentPage = 1;
const rowsPerPage = 10;

// --- ส่วนที่เพิ่ม: ตัวแปรสำหรับแบ่งหน้าใน History Modal ---
let currentHistoryGrouped = {}; 
let historyPage = 1;
const historyDatesPerPage = 2; // แสดงผลทีละ 2 วันต่อหน้า

window.onload = loadUsers;

async function loadUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error("Error loading users:", error);
        return;
    }
    allUsersData = users;
    renderTable(users);
}

function isHAD() {
    const user = JSON.parse(localStorage.getItem("user"));
    return user && user.role === "HAD";
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
        try {
            const userObj = JSON.parse(userStored);
            myRole = userObj.role;
        } catch (e) {
            console.error("Error parsing user data");
        }
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

window.viewHistory = async function(userId, email) {
    document.getElementById("historyUserEmail").innerText = "User: " + email;
    
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
        .order("purchase_date", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    currentHistoryGrouped = {};
    history.forEach(h => {
        const rawDate = new Date(h.purchase_date);
        const dateKey = rawDate.toISOString().split('T')[0];
        if (!currentHistoryGrouped[dateKey]) currentHistoryGrouped[dateKey] = [];
        currentHistoryGrouped[dateKey].push(h);
    });

    historyPage = 1; 
    renderHistoryTable(); 
    document.getElementById("historyModal").style.display = "block";
}

function renderHistoryTable() {
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";

    const sortedDates = Object.keys(currentHistoryGrouped).sort((a, b) => new Date(b) - new Date(a));
    const totalPages = Math.ceil(sortedDates.length / historyDatesPerPage);

    if (sortedDates.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding: 20px;'>No purchase history found.</td></tr>";
        return;
    }

    const startIndex = (historyPage - 1) * historyDatesPerPage;
    const datesToShow = sortedDates.slice(startIndex, startIndex + historyDatesPerPage);

    datesToShow.forEach(dateKey => {
        const itemsInDate = currentHistoryGrouped[dateKey];
        const displayDate = new Date(dateKey).toLocaleDateString("en-GB", {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        tbody.innerHTML += `
            <tr class="ad-H">
                <td colspan="3" class="a" >${displayDate}</td>
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
                <td colspan="2" style="text-align: right; padding: 10px;">Total:</td>
                <td style="padding: 10px; color: #ff4646;">${dailyTotal.toLocaleString()} THB</td>
            </tr>
        `;
    });

    // --- ส่วนจัดการ Pagination ใน Modal ให้เป๊ะตามตารางหลัก ---
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

// ฟังก์ชันสร้างปุ่มตัวเลขใน Modal (ถอดแบบ setupPagination มาเป๊ะๆ)
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
