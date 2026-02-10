const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let editingUserId = null;

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
    renderTable(users);
}

function isHAD() {
    const user = JSON.parse(localStorage.getItem("user"));
    return user && user.role === "HAD";
}

function renderTable(users) {
    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = "";

    const userStored = localStorage.getItem("user");
    // ดึง ID ของตัวเองจาก localStorage key "id" โดยตรง (ตามที่เคยแก้ให้)
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

    users.forEach(user => {
        let badgeClass = "badge-user";
        if (user.role === 'admin') badgeClass = "badge-admin";
        if (user.role === 'HAD') badgeClass = "badge-had";

        let roleBtn = "";
        // ปุ่ม Edit Role จะโชว์เฉพาะถ้าเราเป็น HAD และไม่ใช่ User ของตัวเอง
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
}

// --- ส่วนจัดการ History Modal (แก้ไขวันที่เป็น en-GB) ---
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

    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";

    if (!history || history.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding: 20px;'>No purchase history found.</td></tr>";
    } else {
        const groupedData = {};

        history.forEach(h => {
            const rawDate = new Date(h.purchase_date);
            const dateKey = rawDate.toISOString().split('T')[0];
            if (!groupedData[dateKey]) groupedData[dateKey] = [];
            groupedData[dateKey].push(h);
        });

        const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(dateKey => {
            const itemsInDate = groupedData[dateKey];
            
            // --- แก้ตรงนี้ครับ: เปลี่ยนเป็น en-GB เพื่อให้วันที่ขึ้นก่อน ---
            const displayDate = new Date(dateKey).toLocaleDateString("en-GB", {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            // -----------------------------------------------------

            tbody.innerHTML += `
                <tr style="background-color: #fffde7;">
                    <td colspan="3" style="padding: 15px; font-weight: bold; border-top: 2px solid #fdef2e; color: #333;">
                        ${displayDate}
                    </td>
                </tr>
            `;

            itemsInDate.forEach(h => {
                if(h.purchase_detail && h.purchase_detail.length > 0) {
                    h.purchase_detail.forEach(d => {
                        const price = d.price_logs ? d.price_logs.price : "0";
                        let itemName = "Unknown";
                        let type = "-";

                        if (d.internet_packages) {
                            itemName = d.internet_packages.package_name;
                            type = "Internet";
                        } else if (d.entertainment_services) {
                            itemName = d.entertainment_services.service_name;
                            type = "Service";
                        }

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
        });
    }

    document.getElementById("historyModal").style.display = "block";
}

window.closeHistoryModal = function() {
    document.getElementById("historyModal").style.display = "none";
}

window.openRoleModal = function(userId, currentRole) {
    editingUserId = userId; 
    const select = document.getElementById("roleSelect");
    if (select) select.value = currentRole; 
    document.getElementById("roleModal").style.display = "block"; 
}

window.closeRoleModal = function() {
    document.getElementById("roleModal").style.display = "none";
    editingUserId = null;
}

window.saveRoleChange = async function() {
    if (!editingUserId) return;

    const newRole = document.getElementById("roleSelect").value;
    const saveBtn = document.querySelector("#roleModal .btn-edit");
    
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', editingUserId);

    saveBtn.innerText = originalText;
    saveBtn.disabled = false;

    if (error) {
        alert("Error updating role: " + error.message);
    } else {
        closeRoleModal();
        loadUsers(); 
    }
}

// Search
document.getElementById("searchInput").addEventListener("keyup", function() {
    const value = this.value.toLowerCase();
    const rows = document.querySelectorAll("#userTableBody tr");
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(value) ? "" : "none";
    });
});

window.onclick = function(event) {
    const roleModal = document.getElementById("roleModal");
    const historyModal = document.getElementById("historyModal");
    if (event.target == roleModal) closeRoleModal();
    if (event.target == historyModal) closeHistoryModal();
}