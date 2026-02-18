const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let editingUserId = null;
let userToDeleteId = null; // ✅ ตัวแปรเก็บ ID คนที่จะถูกลบ
let allUsersData = []; 
let currentPage = 1;
const rowsPerPage = 10;

// --- ตัวแปรสำหรับ History Modal ---
let allHistoryData = [];      
let currentHistoryGrouped = {}; 
let historyPage = 1;

const historyNormalDatesPerPage = 3; 
const historyHeavyDayThreshold = 4;  
let currentHistorySort = 'desc'; 

window.onload = function() {
    createDeleteModalHTML(); // ✅ สร้าง Popup HTML อัตโนมัติเมื่อโหลดหน้า
    loadUsers();
};

// ✅ ฟังก์ชันสร้าง Popup HTML สำหรับยืนยันการลบ (ไม่ต้องแก้ไฟล์ HTML)
function createDeleteModalHTML() {
    if (!document.getElementById("deleteConfirmModal")) {
        const modalHTML = `
            <div id="deleteConfirmModal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6);">
                <div class="modal-content" style="background-color: #fff; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 90%; max-width: 400px; border-radius: 10px; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <div style="margin-bottom: 20px;">
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h2 style="color: #333; margin-top: 10px;">Delete User?</h2>
                        <p id="deleteConfirmMsg" style="color: #666; font-size: 14px; margin-top: 10px;">Are you sure?</p>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 15px;">
                        <button onclick="closeDeleteModal()" style="padding: 10px 20px; border: 1px solid #ccc; background: #f8f9fa; color: #333; border-radius: 5px; cursor: pointer; font-weight: bold;">Cancel</button>
                        <button onclick="confirmDeleteUser()" style="padding: 10px 20px; border: none; background: #dc3545; color: white; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);">Yes, Delete</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

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

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">User not found</td></tr>`;
        return; 
    }

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
         let deleteBtn = "";

         // ✅ ปรับปรุง: ปุ่ม Delete เรียก openDeleteModal แทน
         if (myRole === 'HAD' && user.id !== myId) {
             roleBtn = `<button class="action-btn btn-edit" onclick="openRoleModal('${user.id}', '${user.role}')">Edit Role</button>`;
             deleteBtn = `<button class="action-btn" onclick="openDeleteModal('${user.id}', '${user.email}')" style="margin-left: 5px; background-color: #dc3545; color: white;">Delete</button>`;
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
                    ${deleteBtn}
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
// ✅ NEW: Logic สำหรับ Popup Delete Modal
// ===========================================
window.openDeleteModal = function(id, email) {
    userToDeleteId = id; // เก็บ ID ที่จะลบไว้ในตัวแปร Global
    const msg = document.getElementById("deleteConfirmMsg");
    if (msg) {
        msg.innerHTML = `You are about to delete user: <br><b>${email}</b><br><br><span style="color:red; font-size: 12px;">This action cannot be undone!</span>`;
    }
    document.getElementById("deleteConfirmModal").style.display = "block";
}

window.closeDeleteModal = function() {
    document.getElementById("deleteConfirmModal").style.display = "none";
    userToDeleteId = null; // เคลียร์ ID
}

window.confirmDeleteUser = async function() {
    if (!userToDeleteId) return;

    // เปลี่ยนปุ่มเป็น Loading...
    const modalContent = document.querySelector("#deleteConfirmModal .modal-content");
    const originalContent = modalContent.innerHTML;
    modalContent.innerHTML = `<div style="padding: 40px;">Processing...</div>`;

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDeleteId);

    if (error) {
        alert("Error deleting user: " + error.message);
        modalContent.innerHTML = originalContent; // คืนค่าเดิมถ้า Error
        closeDeleteModal();
    } else {
        // ลบสำเร็จ
        closeDeleteModal();
        
        // คืนค่า Content ของ Modal (เผื่อกดลบคนอื่นต่อ)
        modalContent.innerHTML = originalContent;
        
        // โหลดตารางใหม่
        loadUsers(); 
        
    }
}

// ... (Functions อื่นๆ คงเดิม: viewHistory, History Modal Logic, Role Modal) ...
// (ส่วน History และ Role ให้คงโค้ดเดิมไว้ด้านล่างนี้ หรือ Copy จากโค้ดก่อนหน้ามาใส่ได้เลยครับ)
window.viewHistory = async function(userId, email) {
    document.getElementById("historyUserEmail").innerText = "User: " + email;
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
    filterHistoryByDate(); 
    document.getElementById("historyModal").style.display = "block";
}

window.filterHistoryByDate = function() {
    const selectedDate = document.getElementById("historyDateFilter").value;
    let filteredData = allHistoryData;
    if (selectedDate) {
        filteredData = allHistoryData.filter(h => {
            const itemDate = new Date(h.purchase_date).toISOString().split('T')[0];
            return itemDate === selectedDate;
        });
    }
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

function renderHistoryTable() {
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";
    const sortedDates = Object.keys(currentHistoryGrouped).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return currentHistorySort === 'desc' ? dateB - dateA : dateA - dateB;
    });

    let pages = [];
    let currentBatch = [];
    sortedDates.forEach(dateKey => {
        let dailyItemCount = 0;
        if (currentHistoryGrouped[dateKey]) {
            currentHistoryGrouped[dateKey].forEach(h => {
                if(h.purchase_detail) dailyItemCount += h.purchase_detail.length;
            });
        }
        if (dailyItemCount >= historyHeavyDayThreshold) {
            if (currentBatch.length > 0) { pages.push(currentBatch); currentBatch = []; }
            pages.push([dateKey]); 
        } else {
            currentBatch.push(dateKey);
            if (currentBatch.length >= historyNormalDatesPerPage) { pages.push(currentBatch); currentBatch = []; }
        }
    });
    if (currentBatch.length > 0) pages.push(currentBatch);

    const totalPages = pages.length;
    if (sortedDates.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding: 20px;'>No purchase history found.</td></tr>";
        document.getElementById("historyPagination").innerHTML = "";
        return;
    }
    if (historyPage > totalPages) historyPage = 1;
    const datesToShow = pages[historyPage - 1] || [];

    datesToShow.forEach(dateKey => {
        const itemsInDate = currentHistoryGrouped[dateKey];
        const displayDate = new Date(dateKey).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' });
        tbody.innerHTML += `<tr class="ad-H"><td colspan="3" class="a" color: #333; font-weight: bold; padding: 10px;">${displayDate}</td></tr>`;
        let dailyTotal = 0;
        itemsInDate.forEach(h => {
            if(h.purchase_detail && h.purchase_detail.length > 0) {
                h.purchase_detail.forEach(d => {
                    const price = d.price_logs ? Number(d.price_logs.price) : 0;
                    let itemName = d.internet_packages ? d.internet_packages.package_name : (d.entertainment_services ? d.entertainment_services.service_name : "Unknown");
                    let type = d.internet_packages ? "Internet" : "Service";
                    dailyTotal += price;
                    tbody.innerHTML += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px 10px 10px 30px;">${itemName}</td><td style="padding: 10px;">${type}</td><td style="padding: 10px; font-weight: bold;">${price.toLocaleString()} THB</td></tr>`;
                });
            }
        });
        tbody.innerHTML += `<tr style="background: rgba(0,0,0,0.03); font-weight: bold; border-bottom: 2px solid #ddd;"><td colspan="2" style="text-align: right; padding: 10px;">Daily Total:</td><td style="padding: 10px; color: #d97706;">${dailyTotal.toLocaleString()} THB</td></tr>`;
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
    if (totalPages > 1) { setupHistoryPagination(totalPages, historyPaginationDiv); }
}

function setupHistoryPagination(totalPages, container) {
    const prevBtn = document.createElement("button"); prevBtn.innerText = "❮"; prevBtn.className = "page-btn"; prevBtn.disabled = historyPage === 1;
    prevBtn.onclick = () => { historyPage--; renderHistoryTable(); }; container.appendChild(prevBtn);
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button"); btn.innerText = i; btn.className = `page-btn ${i === historyPage ? 'active' : ''}`;
        btn.onclick = () => { historyPage = i; renderHistoryTable(); }; container.appendChild(btn);
    }
    const nextBtn = document.createElement("button"); nextBtn.innerText = "❯"; nextBtn.className = "page-btn"; nextBtn.disabled = historyPage === totalPages;
    nextBtn.onclick = () => { historyPage++; renderHistoryTable(); }; container.appendChild(nextBtn);
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
    saveBtn.innerText = "Saving..."; saveBtn.disabled = true;
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', editingUserId);
    saveBtn.innerText = "Save"; saveBtn.disabled = false;
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

// ✅ ปรับปรุง: กดข้างนอกเพื่อปิด Modal ได้ทุกตัว
window.onclick = function(event) {
    const roleModal = document.getElementById("roleModal");
    const historyModal = document.getElementById("historyModal");
    const deleteModal = document.getElementById("deleteConfirmModal");
    if (event.target == roleModal) closeRoleModal();
    if (event.target == historyModal) closeHistoryModal();
    if (event.target == deleteModal) closeDeleteModal();
}
