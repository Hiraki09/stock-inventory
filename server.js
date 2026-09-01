const express = require('express');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// DATABASE
// ==========================================
const dbPath = path.join(__dirname, 'data.db');
const db = new DatabaseSync(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
        product_id  TEXT PRIMARY KEY,
        type        TEXT,
        footprint   TEXT,
        device_type TEXT,
        cost        TEXT,
        durability  TEXT,
        quantity    INTEGER NOT NULL DEFAULT 0,
        updated_at  TEXT
    );

    CREATE TABLE IF NOT EXISTS history (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        action     TEXT,
        product_id TEXT,
        time       TEXT,
        user       TEXT
    );

    CREATE TABLE IF NOT EXISTS deleted_items (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp     TEXT,
        user          TEXT,
        deleted_line  TEXT
    );
`);

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json());

// ==========================================
// FUNCTION: วันที่และเวลา
// ==========================================
function getCurrentDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ==========================================
// FUNCTION: บันทึกประวัติลงตาราง history
// ==========================================
function addHistory(action, productId, user = 'Unknown') {
    const time = getCurrentDateTime();
    try {
        db.prepare(
            'INSERT INTO history (action, product_id, time, user) VALUES (?, ?, ?, ?)'
        ).run(action, productId, time, user);
        console.log(`[HISTORY] ${action} | ${productId} | ${user}`);
    } catch (err) {
        console.error('ไม่สามารถบันทึกประวัติ:', err.message);
    }
}

// ==========================================
// FUNCTION: แปลงแถว inventory เป็นบรรทัดข้อความแบบเดิม
// ==========================================
function formatInventoryLine(row) {
    return `${row.product_id} | ${row.type} | ${row.footprint} | ${row.device_type} | ${row.cost} | ${row.durability} | ${row.quantity} | ${row.updated_at}`;
}

function formatHistoryLine(row) {
    return `${row.action} | ${row.product_id} | ${row.time} |${row.user}|`;
}

// ==========================================
// MIGRATE: นำเข้าข้อมูลจากไฟล์ .txt เดิม (ทำครั้งเดียวตอนฐานข้อมูลว่าง)
// ==========================================
function migrateLegacyFilesIfNeeded() {
    const invCount = db.prepare('SELECT COUNT(*) AS c FROM inventory').get().c;
    if (invCount === 0) {
        const legacyPath = path.join(__dirname, 'inventory.txt');
        if (fs.existsSync(legacyPath)) {
            const lines = fs.readFileSync(legacyPath, 'utf8')
                .split(/\r?\n/)
                .filter(l => l.trim());

            const insert = db.prepare(`
                INSERT OR IGNORE INTO inventory
                (product_id, type, footprint, device_type, cost, durability, quantity, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            let n = 0;
            for (const line of lines) {
                const c = line.split('|').map(s => s.trim());
                if (c.length < 8 || !c[0]) continue;
                insert.run(c[0], c[1] || '-', c[2] || '-', c[3] || '-', c[4] || '-', c[5] || '-', parseInt(c[6]) || 0, c[7] || getCurrentDateTime());
                n++;
            }
            console.log(`[MIGRATE] นำเข้า ${n} รายการจาก inventory.txt`);
        }
    }

    const histCount = db.prepare('SELECT COUNT(*) AS c FROM history').get().c;
    if (histCount === 0) {
        const legacyPath = path.join(__dirname, 'history.txt');
        if (fs.existsSync(legacyPath)) {
            const lines = fs.readFileSync(legacyPath, 'utf8')
                .split(/\r?\n/)
                .filter(l => l.trim());

            const insert = db.prepare(
                'INSERT INTO history (action, product_id, time, user) VALUES (?, ?, ?, ?)'
            );

            let n = 0;
            for (const line of lines) {
                // รูปแบบเดิม: ACTION | PRODUCT-ID | TIME |USER|
                const m = line.match(/^(.*?)\|(.*?)\|(.*?)\|(.*?)\|$/);
                if (m) {
                    insert.run(m[1].trim(), m[2].trim(), m[3].trim(), m[4].trim());
                    n++;
                }
            }
            console.log(`[MIGRATE] นำเข้า ${n} รายการจาก history.txt`);
        }
    }

    const delCount = db.prepare('SELECT COUNT(*) AS c FROM deleted_items').get().c;
    if (delCount === 0) {
        const legacyPath = path.join(__dirname, 'delete.txt');
        if (fs.existsSync(legacyPath)) {
            const lines = fs.readFileSync(legacyPath, 'utf8')
                .split(/\r?\n/)
                .filter(l => l.trim());

            const insert = db.prepare(
                'INSERT INTO deleted_items (timestamp, user, deleted_line) VALUES (?, ?, ?)'
            );

            let n = 0;
            for (const line of lines) {
                insert.run(getCurrentDateTime(), 'legacy-import', line.trim());
                n++;
            }
            console.log(`[MIGRATE] นำเข้า ${n} รายการจาก delete.txt`);
        }
    }
}

migrateLegacyFilesIfNeeded();


// ============================================================
// VIRTUAL TEXT ROUTES (ให้ frontend เดิมทำงานได้โดยไม่ต้องแก้)
// ต้องประกาศก่อน express.static เพื่อไม่ให้ไฟล์ .txt เก่าบัง route นี้
// ============================================================
app.get('/inventory.txt', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM inventory ORDER BY rowid ASC').all();
        const text = rows.map(formatInventoryLine).join('\n') + (rows.length ? '\n' : '');
        res.type('text/plain').send(text);
    } catch (err) {
        console.error(err);
        res.status(500).send('');
    }
});

app.get('/history.txt', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM history ORDER BY id ASC').all();
        const text = rows.map(formatHistoryLine).join('\n') + (rows.length ? '\n' : '');
        res.type('text/plain').send(text);
    } catch (err) {
        console.error(err);
        res.status(500).send('');
    }
});

// ==========================================
// STATIC FILES (HTML/CSS/JS)
// ==========================================
app.use(express.static(__dirname));


// ============================================================
// 1. ADD PRODUCT (ตรวจสอบซ้ำ, บวกจำนวน, อัปเดตเวลาล่าสุด)
// ============================================================
app.post('/save', (req, res) => {
    const data = req.body;

    if (!data || !data.line) {
        return res.status(400).json({
            success: false,
            error: 'ไม่พบข้อมูลที่จะบันทึก'
        });
    }

    const newParts = data.line.trim().split('|').map(p => p.trim());
    const productId = newParts[0];
    const newQuantity = parseInt(newParts[6]) || 0;
    const currentDateTime = getCurrentDateTime();
    const username = data.user || 'Unknown';

    if (!productId) {
        return res.status(400).json({
            success: false,
            error: 'ไม่พบ Product ID'
        });
    }

    try {
        const existing = db.prepare('SELECT quantity FROM inventory WHERE product_id = ?').get(productId);

        if (existing) {
            const totalQuantity = (existing.quantity || 0) + newQuantity;

            db.prepare('UPDATE inventory SET quantity = ?, updated_at = ? WHERE product_id = ?')
                .run(totalQuantity, currentDateTime, productId);

            addHistory('EDIT', productId, username);
            console.log(`[UPDATE/ADD] Summed quantity for ${productId} by ${username}`);

            res.json({
                success: true,
                message: `อัปเดตจำนวนสินค้า ${productId} สำเร็จ (รวมยอดเดิม)`
            });
        } else {
            db.prepare(`
                INSERT INTO inventory
                (product_id, type, footprint, device_type, cost, durability, quantity, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(productId, newParts[1] || '-', newParts[2] || '-', newParts[3] || '-', newParts[4] || '-', newParts[5] || '-', newQuantity, currentDateTime);

            addHistory('ADD', productId, username);
            console.log(`[ADD] New item ${productId} by ${username}`);

            res.json({
                success: true,
                message: `เพิ่มสินค้า ${productId} สำเร็จ`
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});


// ============================================================
// 2. DELETE PRODUCT
// ============================================================
app.post('/api/delete-item', (req, res) => {
    const targetId = req.body.id;
    const username = req.body.user || 'Unknown';

    if (!targetId) {
        return res.status(400).json({
            success: false,
            message: 'ไม่พบ Product ID'
        });
    }

    try {
        const row = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(targetId);

        if (!row) {
            return res.status(404).json({
                success: false,
                message: `ไม่พบ Product ID: ${targetId}`
            });
        }

        db.prepare('DELETE FROM inventory WHERE product_id = ?').run(targetId);

        const deleteLog = `[${getCurrentDateTime()}] | User: ${username} | ${formatInventoryLine(row)}`;
        db.prepare('INSERT INTO deleted_items (timestamp, user, deleted_line) VALUES (?, ?, ?)')
            .run(getCurrentDateTime(), username, deleteLog);

        addHistory('DELETE', targetId, username);
        console.log(`[DELETE] ${targetId} by ${username}`);

        res.json({
            success: true,
            message: `ลบสินค้า ${targetId} สำเร็จ`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'ลบสินค้าไม่สำเร็จ'
        });
    }
});


// ============================================================
// 3. EDIT PRODUCT (แก้ไขและตรวจสอบ ID ซ้ำเพื่อบวกจำนวนรวมกัน)
// ============================================================
app.post('/api/edit-item', (req, res) => {
    const oldId = req.body.oldId;
    const newLine = req.body.line;
    const username = req.body.user || 'Unknown';

    if (!oldId || !newLine) {
        return res.status(400).json({
            success: false,
            message: 'ข้อมูล EDIT ไม่ครบ'
        });
    }

    const newParts = newLine.split('|').map(c => c.trim());
    const newId = newParts[0];
    const editingQuantity = parseInt(newParts[6]) || 0;
    const currentDateTime = getCurrentDateTime();

    if (!newId) {
        return res.status(400).json({
            success: false,
            message: 'ไม่พบ Product ID ใหม่'
        });
    }

    try {
        const oldRow = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(oldId);

        if (!oldRow) {
            return res.status(404).json({
                success: false,
                message: `ไม่พบ Product ID เดิม: ${oldId}`
            });
        }

        db.prepare('DELETE FROM inventory WHERE product_id = ?').run(oldId);

        const conflictRow = db.prepare('SELECT * FROM inventory WHERE product_id = ?').get(newId);

        if (conflictRow) {
            const totalQty = (conflictRow.quantity || 0) + editingQuantity;
            db.prepare('UPDATE inventory SET quantity = ?, updated_at = ? WHERE product_id = ?')
                .run(totalQty, currentDateTime, newId);
        } else {
            db.prepare(`
                INSERT INTO inventory
                (product_id, type, footprint, device_type, cost, durability, quantity, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(newId, newParts[1] || '-', newParts[2] || '-', newParts[3] || '-', newParts[4] || '-', newParts[5] || '-', editingQuantity, currentDateTime);
        }

        addHistory('EDIT', newId, username);
        console.log(`[EDIT] ${oldId} -> ${newId} by ${username}`);

        res.json({
            success: true,
            message: `แก้ไขสินค้า ${newId} สำเร็จ`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'บันทึก EDIT ไม่สำเร็จ'
        });
    }
});


// ============================================================
// 4. API อ่าน HISTORY
// ============================================================
app.get('/api/history', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM history ORDER BY id ASC').all();
        const logs = rows.map(formatHistoryLine);

        res.json({
            success: true,
            logs: logs
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'อ่านประวัติไม่ได้'
        });
    }
});


// ============================================================
// 5. API สำหรับบันทึกประวัติ LOGIN / LOGOUT
// ============================================================
app.post('/api/history/add', (req, res) => {
    const { user, action } = req.body;
    const username = user || 'Unknown';
    const actionType = action || 'LOGIN';

    try {
        addHistory(actionType, '-', username);
        res.json({
            success: true,
            message: 'บันทึกประวัติเซสชันสำเร็จ'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'บันทึกประวัติไม่สำเร็จ'
        });
    }
});


// ============================================================
// 6. API RESET/CLEAR HISTORY
// ============================================================
app.post('/api/history/reset', (req, res) => {
    try {
        db.prepare('DELETE FROM history').run();
        console.log('[RESET] History logs cleared.');
        res.json({
            success: true,
            message: 'ล้างประวัติทั้งหมดสำเร็จ'
        });
    } catch (err) {
        console.error('ไม่สามารถเคลียร์ history ได้:', err.message);
        res.status(500).json({
            success: false,
            message: 'ไม่สามารถรีเซ็ตประวัติได้'
        });
    }
});


// ============================================================
// 7. API RESET/CLEAR INVENTORY
// ============================================================
app.post('/api/inventory/reset', (req, res) => {
    try {
        db.prepare('DELETE FROM inventory').run();
        console.log('[RESET] Inventory database cleared.');
        res.json({
            success: true,
            message: 'ลบข้อมูลสินค้าทั้งหมดสำเร็จ'
        });
    } catch (err) {
        console.error('ไม่สามารถเคลียร์ inventory ได้:', err.message);
        res.status(500).json({
            success: false,
            message: 'ไม่สามารถรีเซ็ตข้อมูลสินค้าได้'
        });
    }
});


// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('Component Inventory Server (SQLite)');
    console.log('==========================================');
    console.log(`Server:    http://localhost:${PORT}`);
    console.log(`Database:  ${dbPath}`);
    console.log(`Login:     http://localhost:${PORT}/Login.HTML`);
    console.log(`Dashboard: http://localhost:${PORT}/main.HTML`);
    console.log(`ADD:       http://localhost:${PORT}/ADD.HTML`);
    console.log(`Inventory: http://localhost:${PORT}/Inventory.HTML`);
    console.log(`Setting:   http://localhost:${PORT}/setting.html`);
    console.log('==========================================');
});
