const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// DATABASE (PostgreSQL / Supabase)
// ==========================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // จำเป็นสำหรับ Supabase
});

async function initDatabase() {
    // เพิ่มตาราง users สำหรับเก็บข้อมูลบัญชีผู้ใช้งาน
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id    TEXT PRIMARY KEY,
            email    TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    `);

    // ตารางเก็บสถานะการล็อกอินปัจจุบัน (ป้องกันล็อกอินซ้ำ)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS active_sessions (
            email TEXT PRIMARY KEY,
            login_time TEXT
        );
    `);

    await pool.query(`
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
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS history (
            id          SERIAL PRIMARY KEY,
            action      TEXT,
            product_id  TEXT,
            time        TEXT,
            "user"      TEXT
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS deleted_items (
            id              SERIAL PRIMARY KEY,
            timestamp       TEXT,
            "user"          TEXT,
            deleted_line    TEXT
        );
    `);

    // เคลียร์สถานะค้างทั้งหมดตอนเริ่มระบบใหม่ ป้องกันกรณีเซิร์ฟเวอร์รีสตาร์ท
    await pool.query('DELETE FROM active_sessions');

    console.log('[DB] ตาราง users, active_sessions, inventory, history, deleted_items พร้อมใช้งาน');
}

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
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
async function addHistory(action, productId, user = 'Unknown') {
    const time = getCurrentDateTime();
    try {
        await pool.query(
            'INSERT INTO history (action, product_id, time, "user") VALUES ($1, $2, $3, $4)',
            [action, productId, time, user]
        );
        console.log(`[HISTORY] ${action} | ${productId} | ${user}`);
    } catch (err) {
        console.error('ไม่สามารถบันทึกประวัติ:', err.message);
    }
}

// ==========================================
// FUNCTION: แปลงแถวเป็นบรรทัดข้อความแบบเดิม
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
async function migrateLegacyFilesIfNeeded() {
    const invCountResult = await pool.query('SELECT COUNT(*) AS c FROM inventory');
    const invCount = parseInt(invCountResult.rows[0].c);

    if (invCount === 0) {
        const legacyPath = path.join(__dirname, 'inventory.txt');
        if (fs.existsSync(legacyPath)) {
            const lines = fs.readFileSync(legacyPath, 'utf8')
                .split(/\r?\n/)
                .filter(l => l.trim());

            let n = 0;
            for (const line of lines) {
                const c = line.split('|').map(s => s.trim());
                if (c.length < 8 || !c[0]) continue;

                await pool.query(`
                    INSERT INTO inventory
                    (product_id, type, footprint, device_type, cost, durability, quantity, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (product_id) DO NOTHING
                `, [c[0], c[1] || '-', c[2] || '-', c[3] || '-', c[4] || '-', c[5] || '-', parseInt(c[6]) || 0, c[7] || getCurrentDateTime()]);
                n++;
            }
            console.log(`[MIGRATE] นำเข้า ${n} รายการจาก inventory.txt`);
        }
    }

    const histCountResult = await pool.query('SELECT COUNT(*) AS c FROM history');
    const histCount = parseInt(histCountResult.rows[0].c);

    if (histCount === 0) {
        const legacyPath = path.join(__dirname, 'history.txt');
        if (fs.existsSync(legacyPath)) {
            const lines = fs.readFileSync(legacyPath, 'utf8')
                .split(/\r?\n/)
                .filter(l => l.trim());

            let n = 0;
            for (const line of lines) {
                const m = line.match(/^(.*?)\|(.*?)\|(.*?)\|(.*?)\|$/);
                if (m) {
                    await pool.query(
                        'INSERT INTO history (action, product_id, time, "user") VALUES ($1, $2, $3, $4)',
                        [m[1].trim(), m[2].trim(), m[3].trim(), m[4].trim()]
                    );
                    n++;
                }
            }
            console.log(`[MIGRATE] นำเข้า ${n} รายการจาก history.txt`);
        }
    }
}

// ==========================================
// VIRTUAL TEXT ROUTES
// ==========================================
app.get('/inventory.txt', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory ORDER BY product_id ASC');
        const text = result.rows.map(formatInventoryLine).join('\n') + (result.rows.length ? '\n' : '');
        res.type('text/plain').send(text);
    } catch (err) {
        console.error(err);
        res.status(500).send('');
    }
});

app.get('/history.txt', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM history ORDER BY id ASC');
        const text = result.rows.map(formatHistoryLine).join('\n') + (result.rows.length ? '\n' : '');
        res.type('text/plain').send(text);
    } catch (err) {
        console.error(err);
        res.status(500).send('');
    }
});

// ==========================================
// ROUTE: หน้าแรกและรองรับตัวพิมพ์เล็ก/ใหญ่
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Login.HTML'));
});

app.get(['/login.html', '/Login.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'Login.HTML'));
});

app.get(['/main.html', '/Main.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'main.HTML'));
});

app.get(['/inventory.html', '/Inventory.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'Inventory.HTML'));
});

app.get(['/add.html', '/Add.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'ADD.HTML'));
});

app.get(['/history.html', '/History.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'history.HTML'));
});

app.get(['/setting.html', '/Setting.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'setting.html'));
});

// ==========================================
// STATIC FILES
// ==========================================
app.use(express.static(__dirname));

// ============================================================
// API LOGIN (ตรวจสอบผู้ใช้และป้องกันการล็อกอินซ้ำจากฐานข้อมูล)
// ============================================================
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    try {
        const cleanEmail = email.trim().toLowerCase();
        const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);

        if (result.rows.length === 0) {
            return res.json({ success: false, message: 'Invalid E-mail or Password' });
        }

        const user = result.rows[0];

        if (user.password !== password) {
            return res.json({ success: false, message: 'Invalid E-mail or Password' });
        }

        // ตรวจสอบว่าบัญชีนี้กำลังออนไลน์อยู่หรือไม่
        const activeCheck = await pool.query('SELECT * FROM active_sessions WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
        if (activeCheck.rows.length > 0) {
            return res.json({ success: false, message: 'This account is already being used from another device!' });
        }

        // บันทึกสถานะว่ากำลังออนไลน์ลงฐานข้อมูล
        const currentTime = getCurrentDateTime();
        await pool.query(
            'INSERT INTO active_sessions (email, login_time) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET login_time = $2',
            [cleanEmail, currentTime]
        );

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
});

// ============================================================
// 1. ADD PRODUCT
// ============================================================
app.post('/save', async (req, res) => {
    const data = req.body;

    if (!data || !data.line) {
        return res.status(400).json({ success: false, error: 'No data found to be saved.' });
    }

    const newParts = data.line.trim().split('|').map(p => p.trim());
    const productId = newParts[0];
    const newQuantity = parseInt(newParts[6]) || 0;
    const currentDateTime = getCurrentDateTime();
    const username = data.user || 'Unknown';

    if (!productId) {
        return res.status(400).json({ success: false, error: 'ไม่พบ Product ID' });
    }

    try {
        const existingResult = await pool.query(
            'SELECT quantity FROM inventory WHERE product_id = $1',
            [productId]
        );

        if (existingResult.rows.length > 0) {
            const existing = existingResult.rows[0];
            const totalQuantity = (existing.quantity || 0) + newQuantity;

            await pool.query(
                'UPDATE inventory SET quantity = $1, updated_at = $2 WHERE product_id = $3',
                [totalQuantity, currentDateTime, productId]
            );

            await addHistory('EDIT', productId, username);
            res.json({ success: true, message: `อัปเดตจำนวนสินค้า ${productId} สำเร็จ (รวมยอดเดิม)` });
        } else {
            await pool.query(`
                INSERT INTO inventory
                (product_id, type, footprint, device_type, cost, durability, quantity, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [productId, newParts[1] || '-', newParts[2] || '-', newParts[3] || '-', newParts[4] || '-', newParts[5] || '-', newQuantity, currentDateTime]);

            await addHistory('ADD', productId, username);
            res.json({ success: true, message: `เพิ่มสินค้า ${productId} สำเร็จ` });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// 2. DELETE PRODUCT
// ============================================================
app.post('/api/delete-item', async (req, res) => {
    const targetId = req.body.id;
    const username = req.body.user || 'Unknown';

    if (!targetId) {
        return res.status(400).json({ success: false, message: 'ไม่พบ Product ID' });
    }

    try {
        const rowResult = await pool.query('SELECT * FROM inventory WHERE product_id = $1', [targetId]);

        if (rowResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: `ไม่พบ Product ID: ${targetId}` });
        }

        const row = rowResult.rows[0];

        await pool.query('DELETE FROM inventory WHERE product_id = $1', [targetId]);

        const deleteLog = `[${getCurrentDateTime()}] | User: ${username} | ${formatInventoryLine(row)}`;
        await pool.query(
            'INSERT INTO deleted_items (timestamp, "user", deleted_line) VALUES ($1, $2, $3)',
            [getCurrentDateTime(), username, deleteLog]
        );

        await addHistory('DELETE', targetId, username);
        res.json({ success: true, message: `ลบสินค้า ${targetId} สำเร็จ` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'ลบสินค้าไม่สำเร็จ' });
    }
});

// ============================================================
// 3. EDIT PRODUCT
// ============================================================
app.post('/api/edit-item', async (req, res) => {
    const oldId = req.body.oldId;
    const newLine = req.body.line;
    const username = req.body.user || 'Unknown';

    if (!oldId || !newLine) {
        return res.status(400).json({ success: false, message: 'ข้อมูล EDIT ไม่ครบ' });
    }

    const newParts = newLine.split('|').map(c => c.trim());
    const newId = newParts[0];
    const editingQuantity = parseInt(newParts[6]) || 0;
    const currentDateTime = getCurrentDateTime();

    if (!newId) {
        return res.status(400).json({ success: false, message: 'ไม่พบ Product ID ใหม่' });
    }

    try {
        const oldRowResult = await pool.query('SELECT * FROM inventory WHERE product_id = $1', [oldId]);

        if (oldRowResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: `ไม่พบ Product ID เดิม: ${oldId}` });
        }

        await pool.query('DELETE FROM inventory WHERE product_id = $1', [oldId]);

        const conflictResult = await pool.query('SELECT * FROM inventory WHERE product_id = $1', [newId]);

        if (conflictResult.rows.length > 0) {
            const conflictRow = conflictResult.rows[0];
            const totalQty = (conflictRow.quantity || 0) + editingQuantity;
            await pool.query(
                'UPDATE inventory SET quantity = $1, updated_at = $2 WHERE product_id = $3',
                [totalQty, currentDateTime, newId]
            );
        } else {
            await pool.query(`
                INSERT INTO inventory
                (product_id, type, footprint, device_type, cost, durability, quantity, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [newId, newParts[1] || '-', newParts[2] || '-', newParts[3] || '-', newParts[4] || '-', newParts[5] || '-', editingQuantity, currentDateTime]);
        }

        await addHistory('EDIT', newId, username);
        res.json({ success: true, message: `แก้ไขสินค้า ${newId} สำเร็จ` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'บันทึก EDIT ไม่สำเร็จ' });
    }
});

// ============================================================
// 4. API อ่าน HISTORY
// ============================================================
app.get('/api/history', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM history ORDER BY id ASC');
        const logs = result.rows.map(formatHistoryLine);
        res.json({ success: true, logs: logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'อ่านประวัติไม่ได้' });
    }
});

// ============================================================
// 5. API สำหรับบันทึกประวัติ LOGIN / LOGOUT และเคลียร์สถานะออนไลน์
// ============================================================
app.post('/api/history/add', async (req, res) => {
    const { user, email, action } = req.body;
    const username = user || 'Unknown';
    const actionType = action || 'LOGIN';
    const targetEmail = email || '';

    try {
        await addHistory(actionType, '-', username);

        // ถ้าเป็นการ LOGOUT ให้ลบสถานะออกจากตาราง active_sessions เพื่อปลดล็อกให้เข้าใช้งานใหม่ได้
        if (actionType === 'LOGOUT' && targetEmail) {
            await pool.query('DELETE FROM active_sessions WHERE LOWER(email) = LOWER($1)', [targetEmail.trim()]);
        }

        res.json({ success: true, message: 'บันทึกประวัติเซสชันสำเร็จ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'บันทึกประวัติไม่สำเร็จ' });
    }
});

// ==========================================
// START SERVER
// ==========================================
async function startServer() {
    try {
        await initDatabase();
        await migrateLegacyFilesIfNeeded();

        app.listen(PORT, () => {
            console.log('==========================================');
            console.log('Component Inventory Server (PostgreSQL)');
            console.log('==========================================');
            console.log(`Server:    http://localhost:${PORT}`);
            console.log(`Login:     http://localhost:${PORT}/Login.HTML`);
            console.log(`Dashboard: http://localhost:${PORT}/main.HTML`);
            console.log('==========================================');
        });
    } catch (err) {
        console.error('ไม่สามารถเริ่ม server ได้:', err.message);
        process.exit(1);
    }
}

startServer();
