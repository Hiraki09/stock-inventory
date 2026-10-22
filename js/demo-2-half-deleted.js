/* ตัวอย่าง CI #2: ลบโค้ดขาดครึ่ง
   ลบหัวฟังก์ชันทิ้ง แต่ตัวฟังก์ชันกับ } ยังค้างอยู่ → CI ต้องขึ้น ❌ */

function openSidebar() {
    document.body.classList.add('sidebar-open');
}

    document.body.classList.remove('sidebar-open');
}
