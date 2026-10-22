โครงสร้างโปรเจกต์ Component Inventory Tracker
Oct 23, 2026 · @เทพทัต
ภาพรวม
ระบบติดตามสต็อกอุปกรณ์อิเล็กทรอนิกส์ เป็นเว็บแอปที่มีเซิร์ฟเวอร์ Node.js + Express หนึ่งไฟล์ (server.js) เก็บข้อมูลใน PostgreSQL บน Supabase และมีหน้าเว็บ 7 หน้าที่เขียนด้วย HTML/CSS/JavaScript ล้วน ไม่ใช้เฟรมเวิร์ก
หลักการแยกไฟล์ตอนนี้มี 3 ข้อ:
• หนึ่งหน้า = สามไฟล์: ชื่อหน้า.html (โครงหน้า), css/ชื่อหน้า.css (หน้าตา), js/ชื่อหน้า.js (การทำงาน)
• ของที่ใช้ร่วมกันอยู่ที่เดียว: เมนูด้านข้าง การเช็ก Login และธีม อยู่ใน js/layout.js และ css/common.css
• ภาษาไทยแยกเป็นชั้นบน: หน้าเว็บเขียนเป็นภาษาอังกฤษ แล้ว js/i18n.js แปลเป็นไทยตอนผู้ใช้กดปุ่ม
แผนผังไฟล์
โปรเจกต์มีโฟลเดอร์ย่อยแค่ 2 โฟลเดอร์ คือ css/ และ js/ ไฟล์ HTML และ server.js อยู่ชั้นนอกสุด
stock-inventory/
├── server.js          เซิร์ฟเวอร์ + API + ฐานข้อมูล (591 บรรทัด)
├── package.json       รายชื่อแพ็กเกจ (express, cors, pg) และคำสั่ง npm start
├── README.md          สรุปสั้น ๆ ว่าแก้อะไรที่ไหน
├── logo.png           ไอคอนเว็บ
│
├── Login.HTML         หน้า Login
├── main.HTML          Dashboard
├── Inventory.HTML     รายการสินค้า
├── ADD.HTML           เพิ่มสินค้า
├── location.html      ค้นหาตำแหน่งในตู้
├── history.HTML       ประวัติ + เครื่องมือแอดมิน
├── setting.html       ตั้งค่า
│
├── css/
│   ├── common.css     ส่วนกลาง: เมนูด้านข้าง, โหมดสว่าง, โหมดมือถือ
│   ├── login.css      main.css      inventory.css   add.css
│   └── location.css   history.css   setting.css
│
└── js/
    ├── layout.js      ส่วนกลาง: สร้างเมนู, เช็ก Login, ธีม, ฟังก์ชันกลาง
    ├── i18n.js        ปุ่มเปลี่ยนภาษา EN / ไทย + คำแปล
    ├── login.js       main.js       inventory.js    add.js
    └── location.js    history.js    setting.js
ชื่อไฟล์ใน css/ และ js/ ตรงกับชื่อหน้า เช่น หน้า Inventory ใช้ css/inventory.css คู่กับ js/inventory.js ส่วน node_modules/ เกิดจาก npm install และไม่ถูกเก็บใน Git
หน้าเว็บแต่ละหน้า
มี 7 หน้า ทุกหน้ายกเว้น Login ต้อง Login ก่อน และมีเมนูด้านข้างจาก js/layout.js ชื่อใน data-page คือชื่อที่ใช้บอก layout.js ว่าเป็นหน้าไหน
หน้า
ไฟล์ HTML
data-page
CSS / JS
ทำอะไร
ดึงข้อมูลจาก
Login
Login.HTML
ไม่มี (ไม่มีเมนู)
login.css / login.js
กรอกอีเมลและรหัสผ่าน แล้วเก็บผู้ใช้ไว้ใน localStorage
/api/login, /api/history/add
Dashboard
main.HTML
main
main.css / main.js
ตัวเลขสรุป, กราฟสต็อกตามประเภท, บันทึกล่าสุด, รายการใกล้หมด
/inventory.txt, /api/history
Inventory
Inventory.HTML
inventory
inventory.css / inventory.js
ตารางสินค้า ค้นหา กรอง แบ่งหน้า แก้ไข ลบ (ต้องใส่รหัสก่อนลบ)
/inventory.txt, /api/edit-item, /api/delete-item
Add Product
ADD.HTML
add
add.css / add.js
ฟอร์มเพิ่มสินค้า สร้าง Product ID อัตโนมัติ เลือกตำแหน่งลิ้นชัก
/save
Location Finder
location.html
location
location.css / location.js
แผนผังตู้ คลิกลิ้นชักเพื่อดูของข้างใน หรือคลิกของเพื่อไฮไลต์ลิ้นชัก
/inventory.txt
History
history.HTML
history
history.css / history.js
ประวัติการทำงาน, ผู้ใช้ที่ออนไลน์, บังคับออก, ล้างข้อมูล (เฉพาะแอดมิน + รหัสผ่าน)
/history.txt, /api/active-users, /api/kick-*, /api/clear-history, /api/inventory/reset
Settings
setting.html
setting
setting.css / setting.js
ธีมมืด/สว่าง, โหมดมือถือ, ออกจากระบบ
/api/history/add
URL ของแต่ละหน้าพิมพ์ได้ทั้งตัวเล็กและตัวใหญ่ เช่น /inventory.html และ /Inventory.html เพราะ server.js ตั้ง route ไว้ให้ ส่วนการตั้งค่าที่จำข้ามหน้าเก็บใน localStorage ได้แก่ loggedInUser, appTheme, mobileMode, sidebarHidden และ appLang
ไฟล์ส่วนกลาง
สามไฟล์นี้ถูกใช้ทุกหน้า แก้ที่เดียวแล้วเปลี่ยนทั้งเว็บ จึงควรทดสอบหลายหน้าหลังแก้
js/layout.js — เมนูและการตั้งค่าเริ่มต้น
วางเป็นบรรทัดแรกหลัง <body> พร้อมบอกชื่อหน้า เช่น <script src="js/layout.js" data-page="inventory"></script> ไฟล์นี้ทำ 4 อย่างตามลำดับ:
1. ใส่คลาสที่ <body> ตามค่าที่จำไว้: sidebar-hidden, mobile-view-mode, light-mode
2. ถ้ายังไม่ได้ Login หรือข้อมูลผู้ใช้เสีย ส่งกลับไปหน้า Login
3. สร้างเมนูด้านข้างจากรายการ MENU_ITEMS แล้วไฮไลต์เมนูที่ตรงกับ data-page
4. ใส่ชื่อและอีเมลผู้ใช้ในกล่องล่างของเมนู
ฟังก์ชันกลางที่ไฟล์ JS ของทุกหน้าเรียกใช้ได้:
ฟังก์ชัน
คืนค่า / ทำอะไร
getCurrentUser()
ข้อมูลผู้ใช้ที่ Login อยู่ เช่น { id, email } หรือ null
escapeHtml(text)
แปลงอักขระพิเศษก่อนใส่ innerHTML กันโค้ดแปลกปลอม
toggleSidebar()
ซ่อน/แสดงเมนู (ปุ่ม ☰) และจำค่าไว้
css/common.css — หน้าตาเมนู
เก็บสไตล์ที่เหมือนกันทุกหน้า ได้แก่ โลโก้, ลิงก์เมนู, กล่องผู้ใช้, สีโหมดสว่าง และโหมดจำลองมือถือ แต่ ตำแหน่งและขนาด ของเมนูกับเนื้อหา (.sidebar, .main) ยังอยู่ใน CSS ของแต่ละหน้า เพราะแต่ละหน้าจัดเลย์เอาต์ต่างกัน
js/i18n.js — เปลี่ยนภาษา
สร้างปุ่ม EN | ไทย แล้วแปลข้อความบนหน้าจากรายการ DICT (คำตรงตัว) และ PATTERNS (ข้อความที่มีตัวเลข เช่น "Showing 1 to 10 of 94 items") ข้อความที่ JavaScript สร้างทีหลังและกล่อง alert/confirm ก็ถูกแปลด้วย
ข้อมูลในตาราง เช่น Product ID, ชื่ออุปกรณ์ และ (LOW) จงใจไม่แปล เพราะ js/inventory.js อ่านข้อความเหล่านี้กลับไปใช้ตอนแก้ไขสินค้า ถ้าไม่อยากให้ส่วนไหนถูกแปล ใส่ translate="no" ที่ element นั้น
เกิดอะไรขึ้นตอนเปิดหน้า
เบราว์เซอร์อ่านไฟล์ HTML จากบนลงล่าง เมนูจาก js/layout.js จึงพร้อมก่อนที่ js/inventory.js จะทำงาน เพราะฉะนั้นไฟล์ JS ของหน้าเรียก getCurrentUser() หรือ escapeHtml() ได้เลย ส่วน js/i18n.js อยู่ท้ายสุด เพื่อให้เจอข้อความครบทุกส่วนก่อนแปล หน้าอื่นทำงานแบบเดียวกัน ต่างกันแค่ชื่อไฟล์ CSS/JS ของหน้า
เซิร์ฟเวอร์และ API
server.js ทำ 3 อย่าง: สร้างตารางในฐานข้อมูลตอนเริ่ม, ส่งไฟล์หน้าเว็บ (ทุกไฟล์ในโฟลเดอร์ รวม css/ และ js/) และให้บริการ API ด้านล่าง ฐานข้อมูลเชื่อมผ่านตัวแปร DATABASE_URL
API
Method
Path
ใช้ทำอะไร
หน้าที่เรียก
GET
/inventory.txt
สินค้าทั้งหมด เป็นข้อความบรรทัดละรายการ คั่นด้วย |
Dashboard, Inventory, Location
GET
/api/inventory
สินค้าทั้งหมด เป็น JSON
ยังไม่มีหน้าไหนเรียก
GET
/history.txt
ประวัติทั้งหมด เป็นข้อความ
History
GET
/api/history
ประวัติทั้งหมด เป็น JSON
Dashboard
POST
/api/login
ตรวจอีเมลและรหัสผ่าน, บันทึกผู้ใช้ที่ออนไลน์
Login
GET
/api/active-users
รายชื่อผู้ใช้ที่ออนไลน์
History
POST
/api/kick-user, /api/kick-all
บังคับผู้ใช้ออกจากระบบ
History
POST
/save
เพิ่มสินค้า (ถ้า Product ID ซ้ำจะบวกจำนวนเพิ่ม)
Add Product
POST
/api/edit-item
แก้ไขสินค้า
Inventory
POST
/api/delete-item
ลบสินค้า (เก็บสำเนาไว้ใน deleted_items)
Inventory
POST
/api/history/add
บันทึกประวัติ เช่น LOGIN, LOGOUT
Login, Settings
POST
/api/clear-history, /api/history/reset
ล้างประวัติ
History
POST
/api/inventory/reset
ลบสินค้าทั้งหมด
History
ตารางฐานข้อมูล
ตาราง
คอลัมน์
เก็บอะไร
users
id, email, password
บัญชีผู้ใช้
active_sessions
email, login_time
ใครกำลังออนไลน์
inventory
product_id, type, footprint, device_type, cost, durability, quantity, location, updated_at
สินค้าในคลัง (location ค่าเริ่มต้น R11)
history
id, action, product_id, time, user
ประวัติการทำงาน
deleted_items
id, timestamp, user, deleted_line
สำเนาสินค้าที่ถูกลบ
ตอนเริ่มเซิร์ฟเวอร์ ถ้าตารางยังว่างและมีไฟล์ inventory.txt หรือ history.txt แบบเก่าอยู่ในโฟลเดอร์ ระบบจะนำเข้าข้อมูลจากไฟล์ให้อัตโนมัติ
อยากแก้อะไร แก้ที่ไหน
อยากแก้
ไฟล์
ตรงไหน
เพิ่ม/ลบ/เปลี่ยนชื่อเมนู หรือไอคอน
js/layout.js
MENU_ITEMS ด้านบนไฟล์
หน้าตาเมนู (สี, ขนาดตัวอักษร, กล่องผู้ใช้)
css/common.css
กฎ .logo, .menu a, .user
ความกว้างเมนู หรือระยะเนื้อหา
css/<ชื่อหน้า>.css
กฎ .sidebar, .main (ต้องแก้ทุกหน้าที่ต้องการ)
หน้าตาของหน้าใดหน้าหนึ่ง
css/<ชื่อหน้า>.css

การทำงานของหน้าใดหน้าหนึ่ง
js/<ชื่อหน้า>.js

ข้อความภาษาไทย
js/i18n.js
DICT (เพิ่มคู่ "อังกฤษ": "ไทย")
ตำแหน่งปุ่มเปลี่ยนภาษา
js/i18n.js
ฟังก์ชัน buildSwitcher() และ injectStyles()
ประเภทอุปกรณ์, Footprint, Device Type
js/add.js และ js/inventory.js
footprintOptions, deviceTypeOptions (ต้องแก้ทั้งสองไฟล์ให้ตรงกัน)
ใครเป็นแอดมิน
js/history.js
ADMIN_EMAIL
API หรือฐานข้อมูล
server.js

เพิ่มหน้าใหม่
1. สร้าง 3 ไฟล์: newpage.html, css/newpage.css, js/newpage.js
2. ใน <head> ใส่ css/common.css ก่อน แล้วตามด้วย css/newpage.css
3. บรรทัดแรกหลัง <body> ใส่ <script src="js/layout.js" data-page="newpage"></script>
4. เนื้อหาหน้าอยู่ใน <div class="main"> ท้าย body ใส่ js/newpage.js แล้วตามด้วย js/i18n.js
5. เพิ่มเมนูใน MENU_ITEMS ให้ page ตรงกับ data-page
6. ถ้าต้องการให้พิมพ์ URL ตัวเล็ก/ใหญ่ได้ เพิ่ม route ใน server.js
รันบนเครื่อง
1. ครั้งแรก: npm install
2. ตั้งค่า DATABASE_URL เป็น connection string แบบ Session pooler ของ Supabase (แบบ db.xxx.supabase.co ใช้ไม่ได้กับเน็ต IPv4)
3. npm start แล้วเปิด http://localhost:3000
แก้ HTML/CSS/JS แล้วกด Ctrl+Shift+R ที่เบราว์เซอร์ได้เลย แต่ถ้าแก้ server.js ต้องหยุดด้วย Ctrl+C แล้ว npm start ใหม่
ข้อควรรู้และจุดที่ควรระวัง
ยังไม่สม่ำเสมอ (แก้ทีหลังได้)
• CSS แต่ละหน้าเขียนต่างกัน: ฟอนต์ (main/inventory ใช้ Segoe UI, หน้าอื่นใช้ชุด system font), ขนาดปุ่ม ☰ (44 หรือ 50 px) และหน้า Inventory วางเมนูแบบ flex ขณะที่หน้าอื่นใช้ position: fixed
• รายการประเภทอุปกรณ์ซ้ำ 2 ที่: footprintOptions และ deviceTypeOptions อยู่ทั้งใน js/add.js และ js/inventory.js ถ้าแก้ที่เดียว ข้อมูลจะไม่ตรงกัน
• ชื่อไฟล์ตัวเล็กตัวใหญ่ปนกัน: เช่น main.HTML กับ setting.html ทำงานได้เพราะ route ใน server.js แต่ถ้าย้ายไปโฮสต์อื่นอาจเจอลิงก์เสีย
• ข้อความบางจุดเป็นไทยอยู่แล้ว: เช่น alert ตอนบันทึกสินค้า และข้อความจากเซิร์ฟเวอร์ จะยังเป็นไทยแม้เลือก EN
ความปลอดภัย
• รหัสแอดมินและรหัสลบสินค้าอยู่ในไฟล์ JS ฝั่งหน้าเว็บ (js/history.js, js/inventory.js) ใครเปิด DevTools ก็เห็น ควรย้ายไปตรวจที่ server.js
• API ไม่ตรวจว่าใคร Login อยู่: การเช็กแอดมินและการเช็ก Login ทำที่หน้าเว็บอย่างเดียว ใครรู้ URL ของ API ก็เรียก /api/inventory/reset ได้ตรง ๆ
• รหัสผ่านในตาราง users ควรเข้ารหัส (เช่น bcrypt) ตอนนี้เก็บเป็นข้อความธรรมดา และ /api/login เทียบรหัสตรง ๆ
• express.static ส่งได้ทุกไฟล์ในโฟลเดอร์ รวม server.js และ package.json ถ้ามีไฟล์ลับวางไว้ในโฟลเดอร์นี้ จะถูกเปิดดูได้ ควรย้ายหน้าเว็บไปโฟลเดอร์ public/ ในอนาคต
• ห้ามใส่ DATABASE_URL ในโค้ดหรือ commit ขึ้น Git ให้ตั้งเป็นตัวแปรสภาพแวดล้อมเท่านั้น