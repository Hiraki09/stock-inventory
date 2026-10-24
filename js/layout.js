/* =====================================================================
   js/layout.js
   ส่วนที่ทุกหน้าใช้ร่วมกัน ยกเว้นหน้า Login

   วิธีใช้:
   <script src="js/layout.js" data-page="inventory"></script>

   หน้าที่:
   1. โหลดธีมและสถานะ Sidebar
   2. ตรวจสอบ Login
   3. สร้าง Sidebar และข้อมูลผู้ใช้
   4. รองรับ Mobile Touch Gesture
   ===================================================================== */

var MENU_ITEMS = [
    {
        page: 'main',
        href: 'main.HTML',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<rect x="3" y="3" width="7" height="9" rx="1.5"></rect>' +
              '<rect x="14" y="3" width="7" height="5" rx="1.5"></rect>' +
              '<rect x="14" y="12" width="7" height="9" rx="1.5"></rect>' +
              '<rect x="3" y="16" width="7" height="5" rx="1.5"></rect></svg>',
        label: 'Dashboard'
    },
    {
        page: 'inventory',
        href: 'Inventory.html',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M21 8l-9-5-9 5 9 5 9-5z"></path>' +
              '<path d="M3 8v8l9 5 9-5V8"></path>' +
              '<path d="M12 13v8"></path></svg>',
        label: 'Inventory'
    },
    {
        page: 'add',
        href: 'ADD.html',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<circle cx="12" cy="12" r="9"></circle>' +
              '<path d="M12 8v8M8 12h8"></path></svg>',
        label: 'Add Product'
    },
    {
        page: 'location',
        href: 'location.html',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"></path>' +
              '<circle cx="12" cy="10" r="3"></circle></svg>',
        label: 'Location Finder'
    },
    {
        page: 'history',
        href: 'history.html',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.7L3 8"></path>' +
              '<path d="M3 3v5h5"></path>' +
              '<path d="M12 7v5l3 2"></path></svg>',
        label: 'History'
    },
    {
        page: 'setting',
        href: 'setting.html',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"></path>' +
              '<circle cx="12" cy="12" r="3"></circle></svg>',
        label: 'Settings'
    }
];

/* ---------- ฟังก์ชันกลาง ---------- */

function isMobileScreen() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function openSidebar() {
    document.body.classList.add('sidebar-open');
}

function closeSidebar() {
    document.body.classList.remove('sidebar-open');
}

/* อ่านข้อมูลผู้ใช้ที่ Login อยู่ */
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('loggedInUser'));
    } catch (error) {
        return null;
    }
}

/* ป้องกัน HTML แปลกปลอม */
function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ปุ่มเปิด/ปิด Sidebar */
function toggleSidebar() {
    if (isMobileScreen()) {
        document.body.classList.toggle('sidebar-open');
        return;
    }

    document.body.classList.toggle('sidebar-hidden');

    localStorage.setItem(
        'sidebarHidden',
        document.body.classList.contains('sidebar-hidden')
            ? '1'
            : '0'
    );
}

/* ---------- เริ่มทำงานเมื่อโหลดหน้า ---------- */

(function () {
    var script = document.currentScript;

    var activePage = script
        ? script.getAttribute('data-page')
        : '';

    /* 1. กำหนดธีมเริ่มต้น */

    var savedTheme = localStorage.getItem('appTheme');

    /*
       ถ้ายังไม่เคยเลือกธีม ให้เริ่มด้วย Light Mode
       ถ้าเคยเลือก Dark Mode ให้คงค่าเดิม
    */
    if (savedTheme === null) {
        savedTheme = 'light';
        localStorage.setItem('appTheme', 'light');
    }

    document.body.classList.toggle(
        'light-mode',
        savedTheme === 'light'
    );

    /* 2. โหลดสถานะ Sidebar */

    if (
        localStorage.getItem('sidebarHidden') === '1' &&
        !isMobileScreen()
    ) {
        document.body.classList.add('sidebar-hidden');
    }

    /* ล้างค่าโหมดมือถือเก่าที่ไม่ใช้แล้ว */
    localStorage.removeItem('mobileMode');

    /* 3. ตรวจสอบ Login */

    var user = getCurrentUser();

    if (!localStorage.getItem('loggedInUser')) {
        window.location.href = 'Login.HTML';
        return;
    }

    if (!user || typeof user !== 'object') {
        console.error('Invalid login data');

        localStorage.removeItem('loggedInUser');

        window.location.href = 'Login.HTML';
        return;
    }

    /* 4. สร้างเมนู Sidebar */

    var links = MENU_ITEMS.map(function (item) {
        var active = item.page === activePage
            ? ' class="active"'
            : '';

        return (
            '<a href="' + item.href + '"' + active + '>' +
                '<span class="icon">' +
                    item.icon +
                '</span>' +
                '<span>' +
                    escapeHtml(item.label) +
                '</span>' +
            '</a>'
        );
    }).join('');

    /* 5. ข้อมูลผู้ใช้ */

    var userName = escapeHtml(
        user.id || user.email || 'User'
    );

    var userEmail = escapeHtml(
        user.email || ''
    );

    /* 6. สร้าง Sidebar */

    var html =
        '<div class="sidebar">' +

            '<div class="logo">' +
                '<h1>COMPONENT</h1>' +
                '<p>INVENTORY TRACKER</p>' +
            '</div>' +

            '<div class="menu">' +
                links +
            '</div>' +

            '<div class="user">' +
                '<div class="user-avatar">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
                        '<circle cx="12" cy="8.5" r="4"></circle>' +
                        '<path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5z"></path>' +
                    '</svg>' +
                    '<span class="status-dot"></span>' +
                '</div>' +
                '<div class="user-name" id="currentUserName">' +
                    userName +
                '</div>' +

                '<div class="user-email" id="currentUserEmail">' +
                    userEmail +
                '</div>' +
            '</div>' +

        '</div>';

    html +=
        '<div class="sidebar-backdrop" ' +
        'onclick="closeSidebar()"></div>';

    if (script) {
        script.insertAdjacentHTML('afterend', html);
    }

    /* 7. รองรับการปัดหน้าจอบนมือถือ */

    var EDGE = 30;
    var DISTANCE = 60;

    var startX = null;
    var startY = 0;

    document.addEventListener(
        'touchstart',
        function (e) {
            if (!isMobileScreen() || e.touches.length !== 1) {
                return;
            }

            var x = e.touches[0].clientX;

            var isOpen = document.body.classList.contains(
                'sidebar-open'
            );

            startX = (isOpen || x <= EDGE) ? x : null;

            startY = e.touches[0].clientY;
        },
        { passive: true }
    );

    document.addEventListener(
        'touchend',
        function (e) {
            if (startX === null) {
                return;
            }

            var dx = e.changedTouches[0].clientX - startX;

            var dy = e.changedTouches[0].clientY - startY;

            startX = null;

            /* ไม่ทำงานหากเป็นการปัดขึ้นหรือลง */
            if (
                Math.abs(dx) < DISTANCE ||
                Math.abs(dx) < Math.abs(dy)
            ) {
                return;
            }

            if (dx > 0) {
                openSidebar();
            } else {
                closeSidebar();
            }
        },
        { passive: true }
    );

    /* 8. ปรับ Sidebar เมื่อขนาดหน้าจอเปลี่ยน */

    window.matchMedia('(max-width: 768px)')
        .addEventListener('change', function (e) {

            closeSidebar();

            var hidden =
                localStorage.getItem('sidebarHidden') === '1' &&
                !e.matches;

            document.body.classList.toggle(
                'sidebar-hidden',
                hidden
            );
        });

})();