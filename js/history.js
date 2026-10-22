/* ผู้ใช้ที่ Login อยู่ (มาจาก js/layout.js) */
const currentUserObj = getCurrentUser();

// กำหนดรายชื่อบัญชีแอดมินและรหัสผ่านของแต่ละคน (สามารถเพิ่มรายชื่อและเปลี่ยนรหัสผ่านได้ที่นี่)
const ADMIN_ACCOUNTS = [
    { email: "admin@cbv.com", password: "admin3120654" },
    { email: "faa@cbv.com", password: "thepthut" },
    // ตัวอย่างการเพิ่มแอดมินคนอื่นๆ เพิ่มเติม:
    // { email: "manager@cbv.com", password: "managerpass123" }
];

let historyData = [];
let currentPage = 1;
let rowsPerPage = 10;
let filteredData = [];

document.addEventListener("DOMContentLoaded", () => {
    const userEmailLower = currentUserObj && currentUserObj.email ? currentUserObj.email.toLowerCase() : "";

    // ตรวจสอบว่าอีเมลของผู้ใช้ตรงกับรายชื่อแอดมินที่ตั้งไว้หรือไม่
    const currentAdmin = ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === userEmailLower);

    if (!currentUserObj || !currentAdmin) {
        alert("หน้านี้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น!");
        window.location.href = "main.HTML";
        return;
    }

    if (sessionStorage.getItem('historyUnlocked') === 'true') {
        document.getElementById('historyAuthModal').classList.remove('show');
        initAdminPage();
    } else {
        document.getElementById('historyAuthModal').classList.add('show');
        document.getElementById('historyPasswordInput').focus();
    }
});

function verifyAdminPassword() {
    const enteredPassword = document.getElementById('historyPasswordInput').value;
    const userEmailLower = currentUserObj && currentUserObj.email ? currentUserObj.email.toLowerCase() : "";
    
    // ค้นหารหัสผ่านที่ตรงกับอีเมลของแอดมินที่กำลัง Login อยู่
    const currentAdmin = ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === userEmailLower);

    if (currentAdmin && currentAdmin.password === enteredPassword) {
        sessionStorage.setItem('historyUnlocked', 'true');
        document.getElementById('historyAuthModal').classList.remove('show');
        initAdminPage();
    } else {
        alert('รหัสผ่าน Admin ไม่ถูกต้อง!');
        document.getElementById('historyPasswordInput').value = '';
        document.getElementById('historyPasswordInput').focus();
    }
}

function initAdminPage() {
    loadHistory();
    loadActiveUsers();
    setInterval(loadActiveUsers, 5000);
}

async function loadActiveUsers() {
    try {
        const res = await fetch('/api/active-users');
        const data = await res.json();
        const container = document.getElementById('activeUsersContainer');
        if (!data.success || !data.users || data.users.length === 0) {
            container.innerHTML = '<div style="color: #64748b; font-size: 13px; text-align: center; padding: 10px;">No active users found.</div>';
            return;
        }
        container.innerHTML = "";
        data.users.forEach(u => {
            const row = document.createElement('div');
            row.className = 'active-user-row';
            row.innerHTML = `<span>${escapeHtml(u.email)}</span> ${u.email.toLowerCase() !== currentUserObj.email.toLowerCase() ? `<button class="kick-btn" onclick="kickUser('${u.email}')">Kick</button>` : '<span style="font-size:11px; color:#3b82f6;">(You)</span>'}`;
            container.appendChild(row);
        });
    } catch (e) {
        console.error(e);
    }
}

async function kickUser(email) {
    if (!confirm(`Are you sure you want to kick ${email}?`)) return;
    try {
        const res = await fetch('/api/kick-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, adminEmail: currentUserObj.email, by: currentUserObj.id })
        });
        const result = await res.json();
        if (result.success) loadActiveUsers();
        else alert(result.message);
    } catch (e) {
        alert('Failed to kick user');
    }
}

async function kickAllUsers() {
    if (!confirm('Are you sure you want to kick all other users?')) return;
    try {
        const res = await fetch('/api/kick-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminEmail: currentUserObj.email, by: currentUserObj.id })
        });
        const result = await res.json();
        if (result.success) loadActiveUsers();
        else alert(result.message);
    } catch (e) {
        alert('Failed to kick users');
    }
}

async function clearHistoryLogs() {
    if (!confirm('⚠️ Are you sure you want to clear all history logs?')) return;
    try {
        const res = await fetch('/api/clear-history', { method: 'POST' });
        const result = await res.json();
        if (result.success) {
            alert('History logs cleared successfully.');
            loadHistory();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (e) {
        alert('Connection error');
    }
}

async function clearAllInventory() {
    if (!confirm('🚨 WARNING: This will delete ALL inventory items permanently! Proceed?')) return;
    try {
        const res = await fetch('/api/inventory/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: currentUserObj.id })
        });
        const result = await res.json();
        if (result.success) {
            alert('All inventory items have been cleared.');
            loadHistory();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (e) {
        alert('Connection error');
    }
}

async function loadHistory() {
    try {
        const response = await fetch("history.txt?time=" + Date.now());
        const text = await response.text();
        historyData = [];
        text.split(/\r?\n/).forEach(line => {
            line = line.trim();
            if (!line) return;
            const parts = line.split("|");
            if (parts.length < 4) return;
            historyData.push({
                action: parts[0].trim(),
                productID: parts[1].trim(),
                date: parts[2].trim(),
                user: parts[3].trim().replace(/^\||\|$/g, '')
            });
        });

        historyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        filteredData = [...historyData];
        displayHistory();
    } catch (error) {
        console.error(error);
    }
}

function displayHistory() {
    const body = document.getElementById("historyBody");
    const empty = document.getElementById("emptyMessage");
    body.innerHTML = "";
    if (filteredData.length === 0) {
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";
    
    const start = (currentPage - 1) * rowsPerPage;
    const paginated = filteredData.slice(start, start + rowsPerPage);

    paginated.forEach(item => {
        let actionClass = "action-default";
        const act = (item.action || "").toUpperCase();
        if (act === "ADD") actionClass = "action-add";
        else if (act === "EDIT") actionClass = "action-edit";
        else if (act === "DELETE") actionClass = "action-delete";
        else if (act === "LOGIN") actionClass = "action-login";
        else if (act === "LOGOUT") actionClass = "action-logout";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><span class="action-badge ${actionClass}">${escapeHtml(item.action)}</span></td>
            <td class="product-id">${escapeHtml(item.productID)}</td>
            <td class="date">${escapeHtml(item.date)}</td>
            <td class="user-col">${escapeHtml(item.user)}</td>
        `;
        body.appendChild(row);
    });
}

document.getElementById("searchInput").addEventListener("input", function() {
    const kw = this.value.toLowerCase();
    filteredData = historyData.filter(i => i.action.toLowerCase().includes(kw) || i.productID.toLowerCase().includes(kw) || i.date.toLowerCase().includes(kw) || i.user.toLowerCase().includes(kw));
    currentPage = 1;
    displayHistory();
});

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}