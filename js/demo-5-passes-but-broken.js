/* ตัวอย่าง CI #5: ผ่าน CI แต่ใช้งานจริงพัง
   ไวยากรณ์ถูก CI จึงขึ้น ✅ แต่ถ้าหน้าเว็บโหลดไฟล์นี้ จะ error ทันที
   - เรียกฟังก์ชันที่ไม่มีอยู่จริง (สะกดผิด: escapeHTML แทน escapeHtml)
   - อ้าง element ที่ไม่มีในหน้า → ได้ null แล้วพัง
   ใช้อธิบายว่า CI นี้ตรวจแค่ "เขียนถูกไวยากรณ์" ยังต้องเปิดเว็บลองเองด้วย */

function showUser(user) {
    const box = document.getElementById('userBoxThatDoesNotExist');
    box.innerHTML = escapeHTML(user.name);
}
