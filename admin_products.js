const SUPABASE_URL = "https://mdwdzmkgehxwqotczmhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kd2R6bWtnZWh4d3FvdGN6bWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODg5MjksImV4cCI6MjA4MjA2NDkyOX0.lthMFiCQjq6ufGBkk0qs3nET6V3WTdprIZZQ4hM4R6M";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let netDataList = [];
let serviceDataList = [];

// 🔥 ตัวแปรควบคุม Pagination
const ITEMS_PER_PAGE = 5;
let currentNetPage = 1;
let currentServicePage = 1;

// บังคับสไตล์ตารางให้นิ่งผ่าน JS
const style = document.createElement('style');
document.head.appendChild(style);

window.onload = loadAllData;

function generateId(prefix) {
    return prefix + Math.floor(1000 + Math.random() * 9000);
}

async function loadAllData() {
    await fetchInternetPackages();
    await fetchServices();
}

async function fetchInternetPackages() {
    const { data, error } = await supabase
        .from('internet_packages')
        .select(`*, internet_usage_policy (*), price_logs (price, purchase_date)`);

    if (error) return console.error(error);
    netDataList = data;
    renderNetTable();
}

async function fetchServices() {
    const { data, error } = await supabase
        .from('entertainment_services')
        .select(`*, price_logs (price, purchase_date)`);

    if (error) return console.error(error);
    serviceDataList = data;
    renderServiceTable();
}

function renderNetTable() {
    const tbody = document.getElementById('netTableBody');
    const paginationDiv = document.getElementById('netPagination');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (paginationDiv) paginationDiv.innerHTML = '';

    const totalPages = Math.ceil(netDataList.length / ITEMS_PER_PAGE);
    if (currentNetPage > totalPages) currentNetPage = totalPages || 1;
    if (currentNetPage < 1) currentNetPage = 1;

    const startIndex = (currentNetPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = netDataList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // วาดแถวข้อมูลจริง
    paginatedData.forEach(pkg => {
        let currentPrice = 0;
        if (pkg.price_logs && pkg.price_logs.length > 0) {
            const sortedPrices = pkg.price_logs.sort((a,b) => new Date(b.purchase_date) - new Date(a.purchase_date));
            currentPrice = sortedPrices[0].price;
        }
        const pol = pkg.internet_usage_policy;
        const limitStr = pol && pol.data_limit ? `${pol.data_limit}GB` : '∞';
        const policyStr = pol ? `${pol.policy_type} (${limitStr})` : 'N/A';

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td>${pkg.package_id}</td>
                <td style="font-weight: bold;">${pkg.package_name}</td>
                <td style="text-align: center;">${pkg.max_speed} Mbps</td>
                <td style="text-align: center;">${policyStr}</td>
                <td style="text-align: right; color:#28a745; font-weight:bold;">${currentPrice.toLocaleString()} THB</td>
                <td style="text-align: center;">
                    <button class="btn-yellow" onclick="editNetPackage('${pkg.package_id}')">Edit</button>
                </td>
            </tr>
        `;
    });

    // 💡 เติมแถวว่างเพื่อให้ตารางขนาดเท่าเดิมเสมอ
    const emptyRows = ITEMS_PER_PAGE - paginatedData.length;
    for (let i = 0; i < emptyRows; i++) {
        tbody.innerHTML += `<tr><td colspan="6" style="color: transparent;">&nbsp;</td></tr>`;
    }

    if (paginationDiv && totalPages > 1) {
        setupPagination(totalPages, currentNetPage, paginationDiv, (newPage) => {
            currentNetPage = newPage;
            renderNetTable();
        });
    }
}

function renderServiceTable() {
    const tbody = document.getElementById('serviceTableBody');
    const paginationDiv = document.getElementById('servicePagination');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (paginationDiv) paginationDiv.innerHTML = '';

    const totalPages = Math.ceil(serviceDataList.length / ITEMS_PER_PAGE);
    if (currentServicePage > totalPages) currentServicePage = totalPages || 1;
    if (currentServicePage < 1) currentServicePage = 1;

    const startIndex = (currentServicePage - 1) * ITEMS_PER_PAGE;
    const paginatedData = serviceDataList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    paginatedData.forEach(srv => {
        let currentPrice = 0;
        if (srv.price_logs && srv.price_logs.length > 0) {
            const sortedPrices = srv.price_logs.sort((a,b) => new Date(b.purchase_date) - new Date(a.purchase_date));
            currentPrice = sortedPrices[0].price;
        }

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td>${srv.service_id}</td>
                <td style="font-weight: bold;">${srv.service_name}</td>
                <td style="text-align: center;">${srv.service_type}</td>
                <td style="text-align: center;">${srv.service_life} Days</td>
                <td style="text-align: right; color:#28a745; font-weight:bold;">${currentPrice.toLocaleString()} THB</td>
                <td style="text-align: center;">
                    <button class="btn-yellow" onclick="editService('${srv.service_id}')">Edit</button>
                </td>
            </tr>
        `;
    });

    // 💡 เติมแถวว่างเพื่อให้ตารางขนาดเท่าเดิมเสมอ
    const emptyRows = ITEMS_PER_PAGE - paginatedData.length;
    for (let i = 0; i < emptyRows; i++) {
        tbody.innerHTML += `<tr><td colspan="6" style="color: transparent;">&nbsp;</td></tr>`;
    }

    if (paginationDiv && totalPages > 1) {
        setupPagination(totalPages, currentServicePage, paginationDiv, (newPage) => {
            currentServicePage = newPage;
            renderServiceTable();
        });
    }
}

function setupPagination(totalPages, currentPage, container, onPageChange) {
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "❮";
    prevBtn.className = "page-btn";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageChange(currentPage - 1);
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.onclick = () => onPageChange(i);
        container.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "❯";
    nextBtn.className = "page-btn";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => onPageChange(currentPage + 1);
    container.appendChild(nextBtn);
}

function closeModals() {
    document.getElementById('netModal').style.display = 'none';
    document.getElementById('serviceModal').style.display = 'none';
    document.getElementById('netForm').reset();
    document.getElementById('serviceForm').reset();
}

window.handlePolicyChange = function() {
    const type = document.getElementById('netPolType').value;
    const polIdField = document.getElementById('netPolId');
    const limitField = document.getElementById('netDataLimit');
    const speedField = document.getElementById('netSpeedAfter');

    if (type === 'Unlimited') {
        polIdField.value = 'IP001'; 
        
        limitField.value = 'Unlimited';
        limitField.readOnly = true;
        // 🟢 ใช้ตัวแปรสีจาก CSS แทนการระบุสีตรงๆ
        limitField.style.background = 'var(--border-color)'; 
        
        speedField.value = 'Unlimited';
        speedField.readOnly = true;
        speedField.style.background = 'var(--border-color)';

    } else if (type === 'FUP') {
        if(polIdField.value === 'IP001' || polIdField.value === '') polIdField.value = generateId('IP');
        
        limitField.value = '';
        limitField.readOnly = false;
        // 🟢 ล้างค่าเพื่อให้ใช้สีพื้นหลังปกติที่ตั้งไว้ใน CSS (ซึ่งรองรับ Dark Mode อยู่แล้ว)
        limitField.style.background = 'var(--input-bg)'; 
        
        speedField.value = '';
        speedField.readOnly = false;
        speedField.style.background = 'var(--input-bg)';

    } else if (type === 'Limited') {
        if(polIdField.value === 'IP001' || polIdField.value === '') polIdField.value = generateId('IP');
        
        limitField.value = '';
        limitField.readOnly = false;
        limitField.style.background = 'var(--input-bg)';
        
        speedField.value = '0';
        speedField.readOnly = true; 
        speedField.style.background = 'var(--border-color)';
    }
}

function openNetModal() {
    document.getElementById('netActionMode').value = 'add';
    document.getElementById('netModalTitle').innerText = 'Add Internet Package';
    document.getElementById('netPkgId').value = generateId('P');
    document.getElementById('netPriceId').value = generateId('PI');
    document.getElementById('netPolType').value = 'Unlimited';
    handlePolicyChange();
    document.getElementById('netModal').style.display = 'flex';
}

function openServiceModal() {
    document.getElementById('srvActionMode').value = 'add';
    document.getElementById('serviceModalTitle').innerText = 'Add Entertainment Service';
    document.getElementById('srvId').value = generateId('S');
    document.getElementById('srvPriceId').value = generateId('PI');
    document.getElementById('serviceModal').style.display = 'flex';
}

function editNetPackage(pkgId) {
    const pkg = netDataList.find(p => p.package_id === pkgId);
    if (!pkg) return;
    document.getElementById('netActionMode').value = 'edit';
    document.getElementById('netModalTitle').innerText = 'Edit Internet Package';
    document.getElementById('netPkgId').value = pkg.package_id;
    document.getElementById('netPkgName').value = pkg.package_name;
    document.getElementById('netSpeed').value = pkg.max_speed;
    document.getElementById('netLife').value = pkg.service_life;

    if (pkg.internet_usage_policy) {
        document.getElementById('netPolId').value = pkg.internet_usage_policy.policy_id;
        document.getElementById('netPolType').value = pkg.internet_usage_policy.policy_type;
        handlePolicyChange();
        const pType = pkg.internet_usage_policy.policy_type;
        if (pType === 'FUP') {
            document.getElementById('netDataLimit').value = pkg.internet_usage_policy.data_limit || '';
            document.getElementById('netSpeedAfter').value = pkg.internet_usage_policy.speed_after_limit || '';
        } else if (pType === 'Limited') {
            document.getElementById('netDataLimit').value = pkg.internet_usage_policy.data_limit || '';
        }
    }
    document.getElementById('netPriceId').value = generateId('PI'); 
    if (pkg.price_logs && pkg.price_logs.length > 0) {
        const sortedPrices = pkg.price_logs.sort((a,b) => new Date(b.purchase_date) - new Date(a.purchase_date));
        document.getElementById('netPrice').value = sortedPrices[0].price;
    }
    document.getElementById('netModal').style.display = 'flex';
}

function editService(srvId) {
    const srv = serviceDataList.find(s => s.service_id === srvId);
    if (!srv) return;
    document.getElementById('srvActionMode').value = 'edit';
    document.getElementById('serviceModalTitle').innerText = 'Edit Entertainment Service';
    document.getElementById('srvId').value = srv.service_id;
    document.getElementById('srvName').value = srv.service_name;
    document.getElementById('srvType').value = srv.service_type;
    document.getElementById('srvLife').value = srv.service_life;
    document.getElementById('srvPriceId').value = generateId('PI');
    if (srv.price_logs && srv.price_logs.length > 0) {
        const sortedPrices = srv.price_logs.sort((a,b) => new Date(b.purchase_date) - new Date(a.purchase_date));
        document.getElementById('srvPrice').value = sortedPrices[0].price;
    }
    document.getElementById('serviceModal').style.display = 'flex';
}

async function saveNetPackage(e) {
    e.preventDefault();
    const mode = document.getElementById('netActionMode').value;
    const pkgId = document.getElementById('netPkgId').value;
    const pkgName = document.getElementById('netPkgName').value;
    const maxSpeed = document.getElementById('netSpeed').value;
    const life = document.getElementById('netLife').value;
    const polId = document.getElementById('netPolId').value;
    const polType = document.getElementById('netPolType').value;
    const rawLimit = document.getElementById('netDataLimit').value;
    const rawSpeed = document.getElementById('netSpeedAfter').value;
    const dataLimit = (rawLimit === 'Unlimited' || rawLimit === '') ? null : Number(rawLimit);
    const speedAfter = (rawSpeed === 'Unlimited' || rawSpeed === '') ? null : Number(rawSpeed);
    const priceId = document.getElementById('netPriceId').value;
    const price = document.getElementById('netPrice').value;

    try {
        const policyData = { policy_id: polId, policy_type: polType, data_limit: dataLimit, speed_after_limit: speedAfter };
        await supabase.from('internet_usage_policy').upsert([policyData], { onConflict: 'policy_id' });
        const pkgData = { package_id: pkgId, package_name: pkgName, service_life: life, max_speed: maxSpeed, policy_id: polId };
        if (mode === 'add') await supabase.from('internet_packages').insert([pkgData]);
        else await supabase.from('internet_packages').update(pkgData).eq('package_id', pkgId);
        const dateToday = new Date().toISOString().split('T')[0];
        await supabase.from('price_logs').insert([{ price_id: priceId, package_id: pkgId, service_id: null, purchase_date: dateToday, price: price }]);
        alert("Internet Package saved successfully!");
        closeModals();
        await fetchInternetPackages();
    } catch (error) {
        console.error(error);
        alert("Error saving data.");
    }
}

async function saveService(e) {
    e.preventDefault();
    const mode = document.getElementById('srvActionMode').value;
    const srvId = document.getElementById('srvId').value;
    const srvName = document.getElementById('srvName').value;
    const srvType = document.getElementById('srvType').value;
    const srvLife = document.getElementById('srvLife').value;
    const priceId = document.getElementById('srvPriceId').value;
    const price = document.getElementById('srvPrice').value;

    try {
        const srvData = { service_id: srvId, service_name: srvName, service_type: srvType, service_life: srvLife };
        if (mode === 'add') await supabase.from('entertainment_services').insert([srvData]);
        else await supabase.from('entertainment_services').update(srvData).eq('service_id', srvId);
        const dateToday = new Date().toISOString().split('T')[0];
        await supabase.from('price_logs').insert([{ price_id: priceId, package_id: null, service_id: srvId, purchase_date: dateToday, price: price }]);
        alert("Entertainment Service saved successfully!");
        closeModals();
        await fetchServices();
    } catch (error) {
        console.error(error);
        alert("Error saving data.");
    }
}