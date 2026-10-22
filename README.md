# Component Inventory Tracker

ระบบจัดการสต็อกอุปกรณ์อิเล็กทรอนิกส์ (Node.js + Express + PostgreSQL)

## เริ่มใช้งาน

```bash
npm install
DATABASE_URL=postgres://... npm start
```

แล้วเปิด http://localhost:3000

## โครงสร้างไฟล์

```
├── server.js            เซิร์ฟเวอร์ + API + ฐานข้อมูล
├── Login.HTML           หน้า Login
├── main.HTML            Dashboard
├── Inventory.HTML       รายการสินค้า (แก้ไข/ลบ)
├── ADD.HTML             เพิ่มสินค้า
├── location.html        ค้นหาตำแหน่งในตู้
├── history.HTML         ประวัติ + เครื่องมือแอดมิน
├── setting.html         ตั้งค่า (ธีม, โหมดมือถือ, ออกจากระบบ)
├── css/
│   ├── common.css       สไตล์ที่ทุกหน้าใช้ร่วมกัน (เมนูด้านข้าง, โหมดสว่าง, โหมดมือถือ)
│   └── <ชื่อหน้า>.css    สไตล์เฉพาะของหน้านั้น
└── js/
    ├── layout.js        เมนูด้านข้าง + เช็ก Login + ธีม (ใช้ทุกหน้ายกเว้น Login)
    ├── i18n.js          ปุ่มสลับภาษา EN / ไทย
    └── <ชื่อหน้า>.js     โค้ดเฉพาะของหน้านั้น
```

ชื่อไฟล์ใน `css/` และ `js/` ตรงกับหน้า: `main`, `inventory`, `add`, `location`, `history`, `setting`, `login`

## อยากแก้อะไร แก้ที่ไหน

| อยากแก้ | ไฟล์ |
|---|---|
| เพิ่ม/ลบ/เปลี่ยนชื่อเมนูด้านข้าง | `js/layout.js` → `MENU_ITEMS` |
| หน้าตาเมนูด้านข้าง | `css/common.css` |
| หน้าตาของหน้าใดหน้าหนึ่ง | `css/<ชื่อหน้า>.css` |
| การทำงานของหน้าใดหน้าหนึ่ง | `js/<ชื่อหน้า>.js` |
| ข้อความภาษาไทย | `js/i18n.js` → `DICT` |
| API / ฐานข้อมูล | `server.js` |

## เพิ่มหน้าใหม่

1. สร้าง `newpage.html`, `css/newpage.css`, `js/newpage.js`
2. ใส่ใน HTML ตามแบบนี้

```html
<head>
    ...
    <link rel="stylesheet" href="css/common.css">
    <link rel="stylesheet" href="css/newpage.css">
</head>
<body>

<script src="js/layout.js" data-page="newpage"></script>

<div class="main">
    ... เนื้อหาของหน้า ...
</div>

<script src="js/newpage.js"></script>
<script src="js/i18n.js"></script>
</body>
```

3. เพิ่มเมนูใน `MENU_ITEMS` ของ `js/layout.js` โดยให้ `page` ตรงกับ `data-page`
4. ถ้าต้องการ URL ตัวเล็ก/ตัวใหญ่แบบหน้าอื่น เพิ่ม route ใน `server.js`

## ฟังก์ชันกลางจาก `js/layout.js`

ใช้ได้ในไฟล์ `js/<ชื่อหน้า>.js` ทุกไฟล์ ไม่ต้องเขียนซ้ำ

- `getCurrentUser()` คืนข้อมูลผู้ใช้ที่ Login อยู่ เช่น `{ id, email }`
- `escapeHtml(text)` กันโค้ด HTML แปลกปลอมก่อนใส่ `innerHTML`
- `toggleSidebar()` ซ่อน/แสดงเมนู (ปุ่ม ☰)
