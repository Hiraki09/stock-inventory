/* =====================================================================
   js/layout.js — ส่วนที่ทุกหน้าใช้ร่วมกัน (ยกเว้นหน้า Login)

   วิธีใช้: วางเป็นบรรทัดแรกหลัง <body> ของทุกหน้า แล้วบอกว่าเป็นหน้าไหน
       <script src="js/layout.js" data-page="inventory"></script>

   ไฟล์นี้ทำให้:
   1. ใส่ธีม (มืด/สว่าง), โหมดมือถือ, สถานะซ่อนเมนู ตั้งแต่เปิดหน้า
   2. ถ้ายังไม่ได้ Login → ส่งกลับไปหน้า Login
   3. สร้างเมนูด้านข้าง (sidebar) พร้อมชื่อ/อีเมลผู้ใช้
   4. มีฟังก์ชันกลางให้ทุกหน้าเรียกใช้: getCurrentUser(), escapeHtml(), toggleSidebar()

   ★ อยากเพิ่ม/ลบ/เปลี่ยนชื่อเมนู → แก้ MENU_ITEMS ที่เดียว ทุกหน้าเปลี่ยนตาม
   ★ หน้าตาของเมนูอยู่ใน css/common.css
   ===================================================================== */

var MENU_ITEMS = [
    { page: 'main',      href: 'main.HTML',      icon: '▦',  label: 'Dashboard' },
    { page: 'inventory', href: 'Inventory.html', icon: '◇',  label: 'Inventory' },
    { page: 'add',       href: 'ADD.html',       icon: '▥',  label: 'Add Product' },
    { page: 'location',  href: 'location.html',  icon: '📍', label: 'Location Finder' },
    { page: 'history',   href: 'history.html',   icon: '▤',  label: 'History' },
    { page: 'setting',   href: 'setting.html',   icon: '⚙',  label: 'Settings' }
];

/* ---------- ฟังก์ชันกลาง ---------- */

/* ข้อมูลผู้ใช้ที่ Login อยู่ เช่น { id: "admin", email: "admin@cbv.com" } หรือ null */
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('loggedInUser'));
    } catch (error) {
        return null;
    }
}

/* กันโค้ด HTML แปลกปลอมเวลาเอาข้อความไปใส่ innerHTML */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ปุ่ม ☰ ซ่อน/แสดงเมนู (จำค่าไว้ข้ามหน้า) */
function toggleSidebar() {
    document.body.classList.toggle('sidebar-hidden');
    localStorage.setItem('sidebarHidden', document.body.classList.contains('sidebar-hidden') ? '1' : '0');
}

/* ---------- ทำงานทันทีตอนโหลดหน้า ---------- */
(function () {
    var script = document.currentScript;
    var activePage = script ? script.getAttribute('data-page') : '';

    /* 1) ธีม / โหมดมือถือ / ซ่อนเมนู */
    if (localStorage.getItem('sidebarHidden') === '1') {
        document.body.classList.add('sidebar-hidden');
    }
    if (localStorage.getItem('mobileMode') === 'enabled') {
        document.body.classList.add('mobile-view-mode');
    }
    if ((localStorage.getItem('appTheme') || 'dark') === 'light') {
        document.body.classList.add('light-mode');
    }

    /* 2) ต้อง Login ก่อน */
    var user = getCurrentUser();
    if (!localStorage.getItem('loggedInUser')) {
        window.location.href = 'Login.HTML';
    } else if (!user) {
        console.error('Invalid login data');
        localStorage.removeItem('loggedInUser');
        window.location.href = 'Login.HTML';
    }

    /* 3) สร้างเมนูด้านข้าง */
    var links = MENU_ITEMS.map(function (item) {
        var active = item.page === activePage ? ' class="active"' : '';
        return '<a href="' + item.href + '"' + active + '>' +
            '<span class="icon">' + item.icon + '</span> ' + item.label + '</a>';
    }).join('');

    var userName = user ? escapeHtml(user.id || user.email) : 'Loading...';
    var userEmail = user ? escapeHtml(user.email || '') : 'Loading...';

    var html =
        '<div class="sidebar">' +
            '<div class="logo">' +
                '<h1>COMPONENT</h1>' +
                '<p>INVENTORY TRACKER</p>' +
            '</div>' +
            '<div class="menu">' + links + '</div>' +
            '<div class="user">' +
                '<div class="user-name" id="currentUserName">● &nbsp;' + userName + '</div>' +
                '<div class="user-email" id="currentUserEmail">' + userEmail + '</div>' +
            '</div>' +
        '</div>';

    if (script) script.insertAdjacentHTML('afterend', html);
})();
