/* ชื่อผู้ใช้ที่ Login อยู่ (ใช้บันทึกประวัติ) */
const currentUser = getCurrentUser();
const currentUsername = (currentUser && (currentUser.id || currentUser.email)) || "Unknown";

/* =====================================================
    FOOTPRINT OPTIONS DATA (กำหนดรายการ Footprint แยกตามประเภท)
===================================================== */
const footprintOptions = {
    "Resistor": [
        { code: "01", name: "SMD" },
        { code: "02", name: "AXIAL" },
        { code: "03", name: "Trimpot" }
    ],
    "Capacitor": [
        { code: "01", name: "SMD" },
        { code: "02", name: "AXIAL" },
        { code: "03", name: "RADIAL" }
    ],
    "Inductor": [
        { code: "01", name: "SMD" },
        { code: "02", name: "AXIAL" },
        { code: "03", name: "Drum Core" }
    ],
    "Diode": [
        { code: "01", name: "DO" },
        { code: "02", name: "SMA" }
    ],
    "IC": [
        { code: "01", name: "DIP" },
        { code: "02", name: "SOIC" },
        { code: "03", name: "QFP" },
        { code: "04", name: "TSSOP" }
    ],
    "LED": [
        { code: "01", name: "3mm Through-Hole" },
        { code: "02", name: "5mm Through-Hole" },
        { code: "03", name: "SMD 5050" }
    ],
    "Transistor": [
        { code: "01", name: "TO-92" },
        { code: "02", name: "TO-220" },
        { code: "03", name: "SOT-32" },
        { code: "04", name: "SMD" }
    ],
    "Module": [
        { code: "01", name: "Standard Module" },
        { code: "02", name: "Shield / Board" }
    ]
};

/* =====================================================
    DEVICE TYPE / DETAIL OPTIONS DATA (กำหนดรหัสเลขและรายละเอียด แยกตาม Type)
===================================================== */
const deviceTypeOptions = {
    "Resistor": [
        { code: "01", name: "Carbon Film" },
        { code: "02", name: "Metal Film" },
        { code: "03", name: "Wirewound" },
        { code: "04", name: "Trimpot" },
        { code: "05", name: "SMD" }
    ],
    "Capacitor": [
        { code: "01", name: "Ceramic" },
        { code: "02", name: "Electrolytic" },
        { code: "03", name: "Film / Mylar" },
        { code: "04", name: "SMD" },
        { code: "05", name: "Tantalum" }
    ],
    "Inductor": [
        { code: "01", name: "Chip Inductor" },
        { code: "02", name: "Axial Inductor" },
        { code: "03", name: "SMD inductor" },
        { code: "04", name: "Power Inductor" }
    ],
    "Diode": [
        { code: "01", name: "Rectifier" },
        { code: "02", name: "Zener" },
        { code: "03", name: "Photo" },
        { code: "04", name: "Schottky" },
        { code: "05", name: "Switching Diode / Signal Diode" },
        { code: "06", name: "Bridge" }
    ],
    "IC": [
        { code: "01", name: "Microcontroller" },
        { code: "02", name: "Voltage Regulator" },
        { code: "03", name: "Op-Amp" },
        { code: "04", name: "Analog Ic" },
        { code: "05", name: "Digital IC" }
    ],
    "LED": [
        { code: "01", name: "Red LED" },
        { code: "02", name: "Orange LED" },
        { code: "03", name: "Green LED" },
        { code: "04", name: "Blue LED" },
        { code: "05", name: "White LED" },
        { code: "06", name: "Yellow LED" },
        { code: "07", name: "RGB LED" }
    ],
    "Transistor": [
        { code: "01", name: "NPN" },
        { code: "02", name: "PNP" },
        { code: "03", name: "JFET" },
        { code: "04", name: "MOSFET N-Channel" },
        { code: "05", name: "MOSFET P-Channel" }
    ],
    "Module": [
        { code: "01", name: "Sensor Module" },
        { code: "02", name: "Relay Module" },
        { code: "03", name: "Communication Module" },
        { code: "04", name: "Motor Module" },    
        { code: "05", name: "Power Module" },
        { code: "06", name: "-" }
    ]
};

/* =====================================================
    TYPE MAPPING (แปลง Type เป็นรหัสตัวย่อหลัก)
===================================================== */
const typeCodeMapping = {
    "LED": "LED",
    "Transistor": "TR",
    "Resistor": "RES",
    "Capacitor": "CAP",
    "IC": "IC",
    "Inductor": "IND",
    "Diode": "DIO",
    "Module": "MOD"
};

/* =====================================================
    UPDATE FOOTPRINT & DEVICE TYPE DROPDOWNS
===================================================== */
function onTypeChange() {
    const typeSelect = document.getElementById("type");
    const footprintContainer = document.getElementById("footprintContainer");
    const deviceTypeContainer = document.getElementById("deviceTypeContainer");
    const selectedType = typeSelect.value;

    // อัปเดต Dropdown Footprint
    footprintContainer.innerHTML = `
        <label>FOOTPRINT</label>
        <select id="footprint" class="form-control" onchange="generateProductID()" required>
            <option value="">Select Footprint...</option>
        </select>
    `;

    if (selectedType && footprintOptions[selectedType]) {
        const footprintSelect = document.getElementById("footprint");
        footprintOptions[selectedType].forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.code; 
            opt.textContent = `${item.code} - ${item.name}`;
            footprintSelect.appendChild(opt);
        });
    }

    // อัปเดต Dropdown Device Type / Detail เป็นเลขรหัส
    deviceTypeContainer.innerHTML = `
        <label>DEVICE TYPE / DETAIL</label>
        <select id="deviceType" class="form-control" onchange="generateProductID()" required>
            <option value="">Select Device Type / Detail...</option>
        </select>
    `;

    if (selectedType && deviceTypeOptions[selectedType]) {
        const deviceTypeSelect = document.getElementById("deviceType");
        deviceTypeOptions[selectedType].forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.code; // ใช้รหัสเลขเป็นค่า Value
            opt.textContent = `${item.code} - ${item.name}`;
            deviceTypeSelect.appendChild(opt);
        });
    }

    generateProductID();
}

/* ================= GENERATE PRODUCT ID ================= */
function generateProductID() {
    const type = document.getElementById("type").value;
    const footprintElem = document.getElementById("footprint");
    const footprintCode = footprintElem ? footprintElem.value : "";
    
    const deviceTypeElem = document.getElementById("deviceType");
    const deviceTypeCode = (deviceTypeElem && deviceTypeElem.value) ? deviceTypeElem.value : "";

    const cost = document.getElementById("cost").value.trim();
    const durability = document.getElementById("durability").value.trim();

    // ดึงตัวย่อสั้นๆ ตาม Type ที่เลือก
    const typePrefix = typeCodeMapping[type] || "RES";

    // รูปแบบ Product ID จะรวมรหัสตัวย่อประเภท + Footprint + รหัส Device Type
    let parts = [
        typePrefix + (footprintCode || "00") + (deviceTypeCode || "00")
    ];

    if (cost) parts.push(cost.replace(/\s+/g, ''));
    if (durability) parts.push(durability.replace(/\s+/g, ''));

    document.getElementById("productId").value = parts.join('');
}

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

async function saveProduct(event) {
    event.preventDefault();

    const productId = document.getElementById("productId").value;
    const type = document.getElementById("type").value;
    
    const footprintSelect = document.getElementById("footprint");
    let footprintName = "";
    if (footprintSelect && footprintSelect.selectedIndex > 0) {
        const selectedOptionText = footprintSelect.options[footprintSelect.selectedIndex].text;
        footprintName = selectedOptionText.substring(selectedOptionText.indexOf("-") + 2).trim();
    }

    const deviceTypeSelect = document.getElementById("deviceType");
    let deviceTypeName = "";
    if (deviceTypeSelect && deviceTypeSelect.selectedIndex > 0) {
        const selectedOptionText = deviceTypeSelect.options[deviceTypeSelect.selectedIndex].text;
        deviceTypeName = selectedOptionText.substring(selectedOptionText.indexOf("-") + 2).trim();
    }

    const cost = document.getElementById("cost").value;
    const durability = document.getElementById("durability").value;
    const location = document.getElementById("location").value; // ดึงค่าช่องตู้ลิ้นชัก
    const quantity = document.getElementById("quantity").value;
    const timeFormatted = getCurrentDateTime();

    // รูปแบบการจัดเก็บข้อมูลแบบมีช่องตู้ location ต่อท้าย (ตำแหน่งที่ 9)
    const lineData = `${productId} | ${type} | ${footprintName} | ${deviceTypeName} | ${cost} | ${durability} | ${quantity} | ${timeFormatted} | ${location}`;

    try {
        const response = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                line: lineData,
                location: location, // ส่งค่า location แยกไปให้ server ด้วย
                user: currentUsername 
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(`บันทึกข้อมูลสำเร็จโดยผู้ใช้: ${currentUsername}\nPRODUCT ID: ${productId}\nตำแหน่งตู้: ${location}`);
            document.getElementById("addEquipmentForm").reset();
            onTypeChange();
        } else {
            alert("เกิดข้อผิดพลาดในการบันทึก: " + (result.error || result.message));
        }

    } catch (err) {
        console.error(err);
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเปิด Node.js Server อยู่หรือไม่");
    }
}

