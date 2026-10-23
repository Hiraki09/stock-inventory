
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
        icon: '⌂',
        label: 'Dashboard'
    },
    {
        page: 'inventory',
        href: 'Inventory.html',
        icon: '📦',
        label: 'Inventory'
    },
    {
        page: 'add',
        href: 'ADD.html',
        icon: '＋',
        label: 'Add Product'
    },
    {
        page: 'location',
        href: 'location.html',
        icon: '◎',
        label: 'Location Finder'
    },
    {
        page: 'history',
        href: 'history.html',
        icon: '🕒',
        label: 'History'
    },
    {
        page: 'setting',
        href: 'setting.html',
        icon: '⚙',
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
                '<div class="user-name" id="currentUserName">' +
                    '● &nbsp;' + userName +
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
