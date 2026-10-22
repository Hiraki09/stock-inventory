/* ตัวอย่าง CI #1: ลืมปิดวงเล็บปีกกา
   ฟังก์ชันเปิด { แต่ไม่มี } ปิด → CI ต้องขึ้น ❌ */

function showTotal(items) {
    let total = 0;
    for (const item of items) {
        total += item.quantity;
    }
    return total;
