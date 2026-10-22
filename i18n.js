/* =====================================================================
   i18n.js — ปุ่มสลับภาษา EN / ไทย (ไฟล์แยก ไม่ต้องแก้โค้ดเดิมของแต่ละหน้า)

   วิธีใช้: ใส่บรรทัดนี้ก่อน </body> ของทุกหน้า
       <script src="i18n.js"></script>

   หลักการ:
   - หน้าเว็บยังเขียนเป็นภาษาอังกฤษเหมือนเดิม ไฟล์นี้จะแปลข้อความบนหน้า
     เป็นไทยตอนผู้ใช้เลือก "ไทย" และคืนค่าเดิมเมื่อเลือก "EN"
   - ข้อความที่ JavaScript สร้างทีหลัง (ตาราง, สถานะ, alert, confirm)
     ถูกแปลอัตโนมัติด้วย MutationObserver และการครอบ alert/confirm
   - ข้อมูลจริงในตาราง (Product ID, ชื่ออุปกรณ์, ตำแหน่ง, "(LOW)") ไม่ถูกแปล
     เพราะโค้ดบางหน้าอ่านข้อความเหล่านี้กลับไปใช้
   - อยากเพิ่มคำแปล: เพิ่มใน DICT ด้านล่าง (คีย์ = ข้อความอังกฤษตรงตามหน้าเว็บ)
   - ไม่อยากให้ส่วนไหนถูกแปล: ใส่ attribute translate="no" ที่ element นั้น
   - ภาษาที่เลือกจำไว้ใน localStorage คีย์ "appLang"
   ===================================================================== */
(function () {
    'use strict';

    var STORAGE_KEY = 'appLang';

    /* ---------- คำแปลแบบตรงตัว (EN → TH) ---------- */
    var DICT = {
        /* เมนู / ส่วนกลาง */
        'Dashboard': 'แดชบอร์ด',
        'Inventory': 'คลังสินค้า',
        'Add Product': 'เพิ่มสินค้า',
        'Location Finder': 'ค้นหาตำแหน่ง',
        'History': 'ประวัติ',
        'Settings': 'ตั้งค่า',
        'Loading...': 'กำลังโหลด...',
        '● Loading...': '● กำลังโหลด...',
        'Show/Hide Menu': 'แสดง/ซ่อนเมนู',
        'Cancel': 'ยกเลิก',
        'Delete': 'ลบ',
        'Rows per page:': 'แถวต่อหน้า:',
        'Search...': 'ค้นหา...',

        /* Login */
        'LOGIN': 'เข้าสู่ระบบ',
        'E-MAIL': 'อีเมล',
        'PASSWORD': 'รหัสผ่าน',
        'Enter your email': 'กรอกอีเมลของคุณ',
        'Enter your password': 'กรอกรหัสผ่านของคุณ',
        'Invalid E-mail or Password': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        'Cannot connect to server': 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
        'Login failed. Please try again.': 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่',
        'Login': 'เข้าสู่ระบบ',

        /* Dashboard */
        'Inventory overview and stock activity': 'ภาพรวมคลังสินค้าและความเคลื่อนไหวของสต็อก',
        'Total Items': 'จำนวนรายการทั้งหมด',
        'Low Stock': 'สินค้าใกล้หมด',
        'Total Quantity': 'จำนวนรวม',
        'Types': 'ประเภท',
        'Stock Quantity & Percentage by Type': 'จำนวนและสัดส่วนสต็อกตามประเภท',
        'Real-Time Date & Time': 'วันและเวลาปัจจุบัน',
        'Live Logs': 'บันทึกล่าสุด',
        'Low Stock Items': 'รายการสินค้าใกล้หมด',
        'TRACKING ID': 'รหัสติดตาม',
        'ITEM': 'รายการ',
        'MOVEMENT': 'ความเคลื่อนไหว',
        'QTY': 'จำนวน',
        'STATUS': 'สถานะ',
        'TIME': 'เวลา',
        'Loading inventory...': 'กำลังโหลดคลังสินค้า...',
        'Completed': 'เรียบร้อย',
        'Cannot load activity logs': 'โหลดบันทึกกิจกรรมไม่สำเร็จ',

        /* Inventory */
        'All components in stock': 'อุปกรณ์ทั้งหมดในสต็อก',
        '⟳ Refresh': '⟳ รีเฟรช',
        'Refresh the page': 'รีเฟรชหน้า',
        '＋ ADD Product': '＋ เพิ่มสินค้า',
        '⌕ Search by Product ID, Equipment Cost, Type...': '⌕ ค้นหาด้วยรหัสสินค้า, ค่าอุปกรณ์, ประเภท...',
        'TYPE (ALL)': 'ประเภท (ทั้งหมด)',
        'PRODUCT ID': 'รหัสสินค้า',
        'TYPE': 'ประเภท',
        'FOOTPRINT': 'ฟุตพริ้นท์',
        'DEVICE TYPE': 'ชนิดอุปกรณ์',
        'EQUIPMENT COST': 'ค่าอุปกรณ์',
        'DURABILITY': 'พิกัดทนได้',
        'QUANTITY': 'จำนวน',
        'LOCATION': 'ตำแหน่ง',
        'DATE': 'วันที่',
        'ACTIONS': 'จัดการ',
        'EDIT': 'แก้ไข',
        'Equipment Details': 'รายละเอียดอุปกรณ์',
        'PRODUCT ID (AUTO GENERATED)': 'รหัสสินค้า (สร้างอัตโนมัติ)',
        'DEVICE TYPE / DETAIL': 'ชนิดอุปกรณ์ / รายละเอียด',
        'EQUIPMENT COST / SPEC': 'ค่าอุปกรณ์ / สเปก',
        'DURABILITY / VOLTAGE': 'พิกัดทนได้ / แรงดัน',
        'LOCATION / DRAWER': 'ตำแหน่ง / ลิ้นชัก',
        'SAVE ITEM': 'บันทึกรายการ',
        'Select Type...': 'เลือกประเภท...',
        'Select Device Type...': 'เลือกชนิดอุปกรณ์...',
        'Select Footprint...': 'เลือกฟุตพริ้นท์...',
        'Please select Type first...': 'กรุณาเลือกประเภทก่อน...',
        'e.g. 10 kΩ, 4.7v': 'เช่น 10 kΩ, 4.7v',
        'e.g. +-0.25W, 40V / 200mA': 'เช่น +-0.25W, 40V / 200mA',
        'Confirm Deletion': 'ยืนยันการลบ',
        'Please enter your password to confirm deleting this item:': 'กรุณากรอกรหัสผ่านเพื่อยืนยันการลบรายการนี้:',
        'Please enter your password to confirm:': 'กรุณากรอกรหัสผ่านเพื่อยืนยัน:',
        'Enter Delete Passcode': 'กรอกรหัสยืนยันการลบ',
        'Incorrect password! Item was not deleted.': 'รหัสผ่านไม่ถูกต้อง! รายการยังไม่ถูกลบ',
        'Please fill in Type and Quantity so the system can generate a Product ID.': 'กรุณากรอกประเภทและจำนวน เพื่อให้ระบบสร้างรหัสสินค้า',
        'Could not connect to the server! Please make sure node server.js is running.': 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้! กรุณาตรวจสอบว่ารัน node server.js อยู่',
        'Could not connect to the server!': 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้!',
        'Please make sure node server.js is running.': 'กรุณาตรวจสอบว่ารัน node server.js อยู่',

        /* Add Product */
        'ADD PRODUCT': 'เพิ่มสินค้า',
        'Add new equipment component to inventory system': 'เพิ่มอุปกรณ์ใหม่เข้าสู่ระบบคลังสินค้า',
        'AUTO GENERATED...': 'สร้างอัตโนมัติ...',
        'DRAWER LOCATION (ตำแหน่งตู้)': 'ตำแหน่งตู้ / ลิ้นชัก',

        /* History */
        'History & Admin Management': 'ประวัติและการจัดการระบบ',
        'Activity logs and administrative control panel': 'บันทึกกิจกรรมและแผงควบคุมผู้ดูแลระบบ',
        'Active Users & Sessions': 'ผู้ใช้ที่ออนไลน์อยู่',
        'Kick All Others': 'บังคับผู้อื่นออกทั้งหมด',
        'Kick': 'บังคับออก',
        '(You)': '(คุณ)',
        'Database Actions': 'จัดการฐานข้อมูล',
        'Clear History Logs': 'ล้างประวัติทั้งหมด',
        'Clear All Inventory': 'ล้างคลังสินค้าทั้งหมด',
        'Search logs...': 'ค้นหาบันทึก...',
        'ACTION': 'การกระทำ',
        'USER': 'ผู้ใช้',
        'No history found.': 'ไม่พบประวัติ',
        'Admin Restricted Access': 'เฉพาะผู้ดูแลระบบ',
        'Please enter the Admin password to view the history and management tools.': 'กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อดูประวัติและเครื่องมือจัดการ',
        'Enter admin password': 'กรอกรหัสผ่านผู้ดูแลระบบ',
        'Go Back': 'ย้อนกลับ',
        'Verify & View': 'ยืนยันและเข้าดู',
        'Loading active users...': 'กำลังโหลดผู้ใช้ที่ออนไลน์...',
        'No active users found.': 'ไม่พบผู้ใช้ที่ออนไลน์',
        'Are you sure you want to kick all other users?': 'ต้องการบังคับผู้ใช้อื่นทั้งหมดออกจากระบบใช่ไหม?',
        'Failed to kick user': 'บังคับผู้ใช้ออกไม่สำเร็จ',
        'Failed to kick users': 'บังคับผู้ใช้ออกไม่สำเร็จ',
        '⚠️ Are you sure you want to clear all history logs?': '⚠️ ต้องการล้างประวัติทั้งหมดใช่ไหม?',
        'History logs cleared successfully.': 'ล้างประวัติเรียบร้อยแล้ว',
        '🚨 WARNING: This will delete ALL inventory items permanently! Proceed?': '🚨 คำเตือน: สินค้าทั้งหมดในคลังจะถูกลบถาวร! ดำเนินการต่อหรือไม่?',
        'All inventory items have been cleared.': 'ล้างคลังสินค้าทั้งหมดแล้ว',
        'Connection error': 'เชื่อมต่อผิดพลาด',
        'Failed to fetch active users': 'โหลดรายชื่อผู้ใช้ที่ออนไลน์ไม่สำเร็จ',

        /* Location Finder */
        'Interactive cabinet drawer visualizer': 'แผนผังลิ้นชักตู้แบบโต้ตอบ',
        'Click a drawer to filter items or click an item to highlight': 'คลิกลิ้นชักเพื่อกรองรายการ หรือคลิกรายการเพื่อไฮไลต์ตำแหน่ง',
        'Show All': 'แสดงทั้งหมด',
        'RESET': 'รีเซ็ต',
        'Loading from Database...': 'กำลังโหลดจากฐานข้อมูล...',
        '🔍 Search Product ID, Type...': '🔍 ค้นหารหัสสินค้า, ประเภท...',
        'Failed to load data from Database': 'โหลดข้อมูลจากฐานข้อมูลไม่สำเร็จ',
        'Failed to load data from database': 'โหลดข้อมูลจากฐานข้อมูลไม่สำเร็จ',
        'No items found in this drawer': 'ไม่พบรายการในลิ้นชักนี้',
        'Highlighting:': 'กำลังไฮไลต์:',
        'at drawer': 'ที่ลิ้นชัก',
        'Showing items in drawer:': 'รายการในลิ้นชัก:',
        'Cabinet Visualizer': 'แผนผังตู้',

        /* Settings */
        'Manage application preferences': 'จัดการการตั้งค่าแอปพลิเคชัน',
        'Appearance Theme': 'ธีมการแสดงผล',
        'Choose between dark and light appearance modes for the interface.': 'เลือกโหมดมืดหรือโหมดสว่างสำหรับหน้าจอ',
        'Dark Mode': 'โหมดมืด',
        'Light Mode': 'โหมดสว่าง',
        'Mobile View Mode': 'โหมดมุมมองมือถือ',
        'Simulate a mobile device screen layout for the interface.': 'จำลองการแสดงผลแบบหน้าจอมือถือ',
        'Account Session': 'เซสชันบัญชี',
        'Sign out from your current session on this device.': 'ออกจากระบบในอุปกรณ์นี้',
        'Log Out': 'ออกจากระบบ'
    };

    /* ---------- คำแปลแบบมีตัวแปร ---------- */
    var PATTERNS = [
        [/^Showing (\d+) to (\d+) of (\d+) items$/, 'แสดง $1 ถึง $2 จาก $3 รายการ'],
        [/^Showing (\d+) to (\d+) of (\d+) entries$/, 'แสดง $1 ถึง $2 จาก $3 รายการ'],
        [/^Showing (\d+) items?$/, 'แสดง $1 รายการ'],
        [/^Are you sure you want to delete (.+)\?$/, 'ต้องการลบ $1 ใช่ไหม?'],
        [/^Are you sure you want to kick (.+)\?$/, 'ต้องการบังคับ $1 ออกจากระบบใช่ไหม?'],
        [/^Type: (.*) \| Qty: (.*) \| Drawer:$/, 'ประเภท: $1 | จำนวน: $2 | ลิ้นชัก:'],
        [/^Error: (.*)$/, 'ข้อผิดพลาด: $1']
    ];

    /* ชื่อแท็บเบราว์เซอร์ เช่น "Dashboard - Component Inventory Tracker" */
    var TITLE_RE = /^(.+?) - (component inventory tracker)$/i;

    var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
    var ATTRS = ['placeholder', 'title', 'aria-label'];

    /* ---------- แปลข้อความหนึ่งก้อน (คืน null ถ้าไม่มีคำแปล) ---------- */
    function translateLine(text) {
        var key = text.replace(/\s+/g, ' ').trim();
        if (!key) return null;
        if (Object.prototype.hasOwnProperty.call(DICT, key)) return DICT[key];
        for (var i = 0; i < PATTERNS.length; i++) {
            if (PATTERNS[i][0].test(key)) {
                return key.replace(PATTERNS[i][0], function () {
                    var args = arguments, out = PATTERNS[i][1];
                    return out.replace(/\$(\d)/g, function (_, n) {
                        var v = args[+n];
                        /* แปลส่วนที่เป็นข้อความต่อได้ เช่น "Error: Connection error" */
                        return (v && DICT[v.trim()]) || v;
                    });
                });
            }
        }
        return null;
    }

    function translate(text) {
        if (text == null) return null;
        text = String(text);
        if (!/[A-Za-z]/.test(text)) return null;
        /* ข้อความหลายบรรทัด (alert/confirm) แปลทีละบรรทัด */
        if (text.indexOf('\n') !== -1) {
            var changed = false;
            var out = text.split('\n').map(function (line) {
                var t = translateLine(line);
                if (t !== null) { changed = true; return t; }
                return line;
            }).join('\n');
            return changed ? out : null;
        }
        var t = translateLine(text);
        if (t === null) return null;
        /* คงช่องว่างหน้า/หลังเดิมไว้ เพื่อไม่ให้ layout ขยับ */
        var lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
        return lead + t + trail;
    }

    /* ---------- เก็บค่าเดิมไว้คืนตอนสลับกลับ EN ---------- */
    var records = [];

    function shouldSkip(el) {
        for (var n = el; n && n !== document.body; n = n.parentNode) {
            if (n.nodeType !== 1) continue;
            if (SKIP_TAGS[n.tagName]) return true;
            if (n.getAttribute('translate') === 'no') return true;
            if (n.id === 'i18n-switcher') return true;
        }
        return false;
    }

    function translateTextNode(node) {
        var parent = node.parentNode;
        if (!parent || shouldSkip(parent)) return;
        var t = translate(node.nodeValue);
        if (t === null || t === node.nodeValue) return;
        records.push({ node: node, original: node.nodeValue, translated: t });
        node.nodeValue = t;
    }

    function translateAttrs(el) {
        if (el.nodeType !== 1 || shouldSkip(el)) return;
        for (var i = 0; i < ATTRS.length; i++) {
            var name = ATTRS[i], val = el.getAttribute(name);
            if (!val) continue;
            var t = translate(val);
            if (t === null || t === val) continue;
            records.push({ el: el, attr: name, original: val, translated: t });
            el.setAttribute(name, t);
        }
    }

    function translateTree(root) {
        if (!root) return;
        if (root.nodeType === 3) { translateTextNode(root); return; }
        if (root.nodeType !== 1 || shouldSkip(root)) return;
        translateAttrs(root);
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        var n, list = [];
        while ((n = walker.nextNode())) list.push(n);
        for (var i = 0; i < list.length; i++) {
            if (list[i].nodeType === 3) translateTextNode(list[i]);
            else translateAttrs(list[i]);
        }
    }

    var originalTitle = null;
    function translateTitle() {
        var cur = document.title;
        var m = cur.match(TITLE_RE);
        if (m && DICT[m[1]]) {
            if (originalTitle === null) originalTitle = cur;
            document.title = DICT[m[1]] + ' - ' + m[2];
        }
    }

    function revertAll() {
        observer.disconnect();
        for (var i = records.length - 1; i >= 0; i--) {
            var r = records[i];
            if (r.node) {
                /* คืนค่าเฉพาะที่ยังเป็นคำแปลของเรา (ถ้าโค้ดเพจเปลี่ยนไปแล้ว ไม่ไปยุ่ง) */
                if (r.node.nodeValue === r.translated) r.node.nodeValue = r.original;
            } else if (r.el.getAttribute(r.attr) === r.translated) {
                r.el.setAttribute(r.attr, r.original);
            }
        }
        records = [];
        if (originalTitle !== null) { document.title = originalTitle; originalTitle = null; }
    }

    /* ---------- ติดตามข้อความที่สคริปต์ของหน้าใส่เข้ามาทีหลัง ---------- */
    var observer = new MutationObserver(function (mutations) {
        if (currentLang !== 'th') return;
        observer.disconnect();
        for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.type === 'childList') {
                for (var j = 0; j < m.addedNodes.length; j++) translateTree(m.addedNodes[j]);
            } else if (m.type === 'characterData') {
                translateTextNode(m.target);
            } else if (m.type === 'attributes') {
                translateAttrs(m.target);
            }
        }
        /* ล้าง record ของ element ที่ถูกลบออกจากหน้าไปแล้ว กัน memory โต */
        if (records.length > 3000) {
            records = records.filter(function (r) { return (r.node || r.el).isConnected; });
        }
        translateTitle();
        observe();
    });

    function observe() {
        observer.observe(document.body, {
            childList: true, subtree: true, characterData: true,
            attributes: true, attributeFilter: ATTRS
        });
        var titleEl = document.querySelector('title');
        if (titleEl) observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    /* ---------- alert / confirm ---------- */
    var nativeAlert = window.alert, nativeConfirm = window.confirm;
    window.alert = function (msg) {
        var t = currentLang === 'th' ? translate(msg) : null;
        return nativeAlert.call(window, t === null ? msg : t);
    };
    window.confirm = function (msg) {
        var t = currentLang === 'th' ? translate(msg) : null;
        return nativeConfirm.call(window, t === null ? msg : t);
    };

    /* ---------- ปุ่มสลับภาษา ---------- */
    function injectStyles() {
        var css =
            '#i18n-switcher{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;' +
            'border:1px solid #243244;border-radius:999px;overflow:hidden;background:#09111d;' +
            'box-shadow:0 4px 14px rgba(0,0,0,.35);font-family:"Segoe UI",Tahoma,sans-serif}' +
            '#i18n-switcher button{border:0;background:transparent;color:#94a3b8;font-size:12px;' +
            'font-weight:600;letter-spacing:.5px;padding:7px 12px;cursor:pointer;line-height:1}' +
            '#i18n-switcher button:hover{color:#e2e8f0}' +
            '#i18n-switcher button.active{background:#00ff66;color:#06100b}' +
            'body.light-mode #i18n-switcher{background:#fff;border-color:#cbd5e1;box-shadow:0 4px 14px rgba(15,23,42,.12)}' +
            'body.light-mode #i18n-switcher button{color:#64748b}' +
            'body.light-mode #i18n-switcher button:hover{color:#0f172a}' +
            'body.light-mode #i18n-switcher button.active{background:#16a34a;color:#fff}' +
            '@media print{#i18n-switcher{display:none}}';
        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    function buildSwitcher() {
        var box = document.createElement('div');
        box.id = 'i18n-switcher';
        box.setAttribute('translate', 'no');
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', 'Language');
        [['en', 'EN'], ['th', 'ไทย']].forEach(function (pair) {
            var b = document.createElement('button');
            b.type = 'button';
            b.dataset.lang = pair[0];
            b.textContent = pair[1];
            b.addEventListener('click', function () { setLang(pair[0]); });
            box.appendChild(b);
        });
        document.body.appendChild(box);
    }

    function updateSwitcher() {
        var btns = document.querySelectorAll('#i18n-switcher button');
        for (var i = 0; i < btns.length; i++) {
            var on = btns[i].dataset.lang === currentLang;
            btns[i].classList.toggle('active', on);
            btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
    }

    var currentLang = 'en';

    function setLang(lang) {
        lang = lang === 'th' ? 'th' : 'en';
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
        if (lang === currentLang) { updateSwitcher(); return; }
        currentLang = lang;
        document.documentElement.lang = lang;
        if (lang === 'th') {
            observer.disconnect();
            translateTree(document.body);
            translateTitle();
            observe();
        } else {
            revertAll();
        }
        updateSwitcher();
    }

    function init() {
        injectStyles();
        buildSwitcher();
        var saved = 'en';
        try { saved = localStorage.getItem(STORAGE_KEY) || 'en'; } catch (e) { /* ignore */ }
        setLang(saved);
        updateSwitcher();
    }

    /* ให้โค้ดอื่นเรียกใช้ได้ถ้าต้องการ เช่น window.i18n.setLang('th') */
    window.i18n = { setLang: setLang, translate: translate, dict: DICT };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
