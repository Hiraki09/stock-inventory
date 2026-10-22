/* ================= GLOBAL VARIABLES ================= */
let allRowsData = [];
let filteredData = [];
let currentPage = 1;
let rowsPerPage = 10;
const DELETE_PASSCODE = "312065";
let targetDeleteId = null; 
let currentEditOldId = null; 

// Footprint database with code and name
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
        { code: "03", name: "SMD" }
    ],
    "Module": [
        { code: "01", name: "Standard Module" },
        { code: "02", name: "Shield / Board" }
    ]
};

// Device Type database with code and name
const deviceTypeOptions = {
    "Resistor": [
        { code: "01", name: "Carbon Film" },
        { code: "02", name: "Metal Film" },
        { code: "03", name: "Wirewound" },
        { code: "04", name: "SMD" }
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
        { code: "04", name: "Analog IC" },
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
        { code: "05", name: "Power Module" }
    ]
};

/* ================= CHANGE ROWS PER PAGE ================= */
function changeRowsPerPage() {
    let selectElement = document.getElementById("rowsPerPageSelect");
    rowsPerPage = parseInt(selectElement.value, 10);
    currentPage = 1;
    renderTable();
}

/* ================= INITIAL LOAD ================= */
document.addEventListener(
    "DOMContentLoaded",
    function() {
        loadInventory();
    }
);

/* ================= LOAD INVENTORY ================= */
function loadInventory() {
    fetch('/inventory.txt?v=' + Date.now())
        .then(response => {
            if (!response.ok)
                throw new Error("Cannot fetch inventory.txt");
            return response.text();
        })
        .then(data => {
            parseInventoryData(data);
        })
        .catch(error => {
            console.error("Error loading file:", error);
            document.getElementById("inventoryTable").innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; color:#ff716d;">
                        Failed to load inventory.txt
                    </td>
                </tr>`;
        });
}

/* ================= PARSE INVENTORY ================= */
function parseInventoryData(textData) {
    allRowsData = [];
    let lines = textData.trim().split("\n");

    lines.forEach(line => { 
        if (!line.trim()) return;

        let cols = line.split("|").map(c => c.trim());

        while (cols.length < 9) {
            if (cols.length === 7) {
                let dt = cols[6];
                cols[6] = dt; 
                cols.push('R11');
            } else {
                cols.push('-');
            }
        }

        allRowsData.push(cols);
    });

    searchInventory();
}

/* ================= REFRESH ================= */
function refreshPage() {
    loadInventory();
}

/* ================= DELETE (OPEN MODAL) ================= */
function deleteItem(button) {
    let row = button.closest("tr");
    targetDeleteId = row.cells[0].innerText.trim();

    document.getElementById("deleteModalText").innerText = `Are you sure you want to delete ${targetDeleteId}?\nPlease enter your password to confirm:`;
    document.getElementById("deletePasscodeInput").value = "";
    
    document.getElementById("deleteModal").style.display = "flex";
    document.getElementById("deletePasscodeInput").focus();
}

function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
    targetDeleteId = null;
}

/* ================= CONFIRM DELETE ================= */
async function confirmDeleteItem() {
    let inputCode = document.getElementById("deletePasscodeInput").value;

    if (inputCode === DELETE_PASSCODE) {
        if (!targetDeleteId) return;

        try {
            let currentUsername = "Unknown";
            const loggedInUserStr = localStorage.getItem("loggedInUser");
            if (loggedInUserStr) {
                try {
                    let userObj = JSON.parse(loggedInUserStr);
                    currentUsername = userObj.id || userObj.username || "Unknown";
                } catch (e) {
                    currentUsername = loggedInUserStr;
                }
            }

            let response = await fetch(
                '/api/delete-item',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: targetDeleteId,
                        user: currentUsername
                    })
                }
            );

            let result = await response.json();

            if (result.success) {
                alert(result.message);
                closeDeleteModal();
                loadInventory();
            } else {
                alert("Error: " + result.message);
            }
        } catch (err) {
            alert(
                "Could not connect to the server! " +
                "Please make sure node server.js is running."
            );
        }
    } else {
        alert("Incorrect password! Item was not deleted.");
        document.getElementById("deletePasscodeInput").value = "";
        document.getElementById("deletePasscodeInput").focus();
    }
}

/* ================= UPDATE DROPDOWN OPTIONS BASED ON TYPE ================= */
function updateTypeDropdowns(selectedDeviceType = "", selectedFootprint = "") {
    let type = document.getElementById("editType").value;
    let deviceTypeSelect = document.getElementById("editDeviceType");
    let footprintSelect = document.getElementById("editFootprint");

    deviceTypeSelect.innerHTML = '<option value="">Select Device Type...</option>';
    footprintSelect.innerHTML = '<option value="">Select Footprint...</option>';

    if (deviceTypeOptions[type]) {
        deviceTypeOptions[type].forEach(item => {
            let opt = document.createElement("option");
            opt.value = item.name; 
            opt.text = `${item.code} - ${item.name}`;
            deviceTypeSelect.appendChild(opt);
        });
    }

    if (footprintOptions[type]) {
        footprintOptions[type].forEach(item => {
            let opt = document.createElement("option");
            opt.value = item.name;
            opt.text = `${item.code} - ${item.name}`;
            footprintSelect.appendChild(opt);
        });
    }

    if (selectedDeviceType) {
        setDropdownCustomValue("editDeviceType", selectedDeviceType);
    }
    if (selectedFootprint) {
        setDropdownCustomValue("editFootprint", selectedFootprint);
    }

    generateProductId();
}

/* ================= HELPER FOR DROPDOWN VALUES ================= */
function setDropdownCustomValue(selectId, value) {
    let select = document.getElementById(selectId);
    let found = false;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase() === value.toLowerCase()) {
            select.selectedIndex = i;
            found = true;
            break;
        }
    }
    if (!found && value && value !== '-') {
        let opt = document.createElement('option');
        opt.value = value;
        opt.text = value;
        select.add(opt);
        select.value = value;
    }
}

/* ================= FIND CODE HELPERS ================= */
function getFootprintCode(type, footprintName) {
    if (!footprintOptions[type]) return footprintName;
    let found = footprintOptions[type].find(item => item.name.toLowerCase() === footprintName.toLowerCase());
    return found ? found.code : footprintName;
}

function getDeviceTypeCode(type, deviceTypeName) {
    if (!deviceTypeOptions[type]) return deviceTypeName;
    let found = deviceTypeOptions[type].find(item => item.name.toLowerCase() === deviceTypeName.toLowerCase());
    return found ? found.code : deviceTypeName;
}

/* ================= GENERATE PRODUCT ID AUTOMATICALLY ================= */
function generateProductId() {
    let type = document.getElementById("editType").value.trim();
    let footprintName = document.getElementById("editFootprint").value.trim();
    let deviceTypeName = document.getElementById("editDeviceType").value.trim();
    let costSpec = document.getElementById("editCostSpec").value.trim();
    let durability = document.getElementById("editDurability").value.trim();

    let prefix = "ITEM";
    if (type === "LED") prefix = "LED";
    else if (type === "Transistor") prefix = "TR";
    else if (type === "Resistor") prefix = "RES";
    else if (type === "Capacitor") prefix = "CAP";
    else if (type === "IC") prefix = "IC";
    else if (type === "Inductor") prefix = "IND";
    else if (type === "Diode") prefix = "DI";
    else if (type === "Module") prefix = "MOD";

    let footprintCode = getFootprintCode(type, footprintName);
    let deviceTypeCode = getDeviceTypeCode(type, deviceTypeName);

    let rawParts = [prefix, footprintCode, deviceTypeCode, costSpec, durability];
    let cleanedParts = rawParts.filter(p => p && p !== '-').map(p => p.replace(/\s+/g, ''));
    
    let newId = cleanedParts.join("");
    
    document.getElementById("editId").value = newId;
}

/* ================= EDIT ITEM (MODAL) ================= */
function editItem(button) {
    let row = button.closest("tr");
    
    let originalId = row.cells[0].innerText.trim();
    currentEditOldId = originalId; 

    document.getElementById("editId").value = originalId;
    
    let currentType = row.cells[1].innerText.trim();
    let currentFootprint = row.cells[2].innerText.trim();
    let currentDeviceType = row.cells[3].innerText.trim();
    let currentLocation = row.cells[7].innerText.trim();

    setDropdownCustomValue("editType", currentType);
    updateTypeDropdowns(currentDeviceType, currentFootprint);
    
    document.getElementById("editCostSpec").value = row.cells[4].innerText.trim();
    document.getElementById("editDurability").value = row.cells[5].innerText.trim();
    
    let qtyText = row.cells[6].innerText.replace(/,/g, '').replace('(LOW)', '').trim();
    document.getElementById("editQuantity").value = qtyText;

    setDropdownCustomValue("editLocation", currentLocation || "R11");

    document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
    currentEditOldId = null;
}

/* ================= SAVE EDITED ITEM ================= */
async function saveEditedItem() {
    let newId = document.getElementById("editId").value.trim();
    let type = document.getElementById("editType").value;
    let footprint = document.getElementById("editFootprint").value;
    let deviceType = document.getElementById("editDeviceType").value;
    let costSpec = document.getElementById("editCostSpec").value;
    let durability = document.getElementById("editDurability").value;
    let quantity = document.getElementById("editQuantity").value;
    let location = document.getElementById("editLocation").value || "R11";

    if (!newId || !type || !quantity) {
        alert("Please fill in Type and Quantity so the system can generate a Product ID.");
        return;
    }

    let newLine = `${newId} | ${type} | ${footprint || '-'} | ${deviceType || '-'} | ${costSpec || '-'} | ${durability || '-'} | ${quantity} | ${getCurrentDateTimeString()} | ${location}`;

    try {
        let currentUsername = "Unknown";
        const loggedInUserStr = localStorage.getItem("loggedInUser");
        if (loggedInUserStr) {
            try {
                let userObj = JSON.parse(loggedInUserStr);
                currentUsername = userObj.id || userObj.username || "Unknown";
            } catch (e) {
                currentUsername = loggedInUserStr;
            }
        }

        let response = await fetch('/api/edit-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                oldId: currentEditOldId, 
                line: newLine,           
                user: currentUsername
            })
        });

        let result = await response.json();

        if (result.success) {
            alert(result.message);
            closeEditModal();
            loadInventory();
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        alert("Could not connect to the server! Please make sure node server.js is running.");
    }
}

function getCurrentDateTimeString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/* ================= RENDER TABLE ================= */
function renderTable() {
    let tbody = document.getElementById("inventoryTable");
    tbody.innerHTML = "";

    let totalItems = filteredData.length;
    let totalPages = Math.ceil(totalItems / rowsPerPage) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    let start = (currentPage - 1) * rowsPerPage;
    let end = start + rowsPerPage;
    let pageItems = filteredData.slice(start, end);

    pageItems.forEach(cols => {
        let [
            id,
            type,
            footprint,
            devCategory,
            devValue,
            resistance,
            qtyStr,
            dateStr,
            location
        ] = cols;

        let qtyNum = parseInt(qtyStr, 10) || 0;
        let formattedQty = qtyNum.toLocaleString('en-US');
        let isLow = qtyNum <= 3;

        let displayDate = dateStr
            ? dateStr.replace(' ', '<br>')
            : '-';

        let tr = document.createElement("tr");

        tr.innerHTML = `
            <td class="product-id">${escapeHtml(id || '-')}</td>
            <td>${escapeHtml(type || '-')}</td>
            <td>${escapeHtml(footprint || '-')}</td>
            <td>${escapeHtml(devCategory || '-')}</td>
            <td>${escapeHtml(devValue || '-')}</td>
            <td>${escapeHtml(resistance || '-')}</td>
            <td class="quantity ${isLow ? 'low' : ''}">
                ${formattedQty}
                ${isLow ? '<span class="low-text">(LOW)</span>' : ''}
            </td>
            <td><b style="color: #38bdf8;">${escapeHtml(location || 'R11')}</b></td>
            <td class="date">${displayDate}</td>
            <td>
                <span class="edit" onclick="editItem(this)">EDIT</span>
                <span class="delete" onclick="deleteItem(this)">🗑</span>
            </td>
        `;

        tbody.appendChild(tr);
    });

    let showingStart = totalItems === 0 ? 0 : start + 1;
    let showingEnd = Math.min(end, totalItems);

    document.getElementById("showingCount").innerText =
        `Showing ${showingStart} to ${showingEnd} of ${totalItems} items`;

    renderPagination(totalPages);
}

/* ================= PAGINATION ================= */
function renderPagination(totalPages) {
    let container = document.getElementById("paginationControls");
    container.innerHTML = "";

    let firstBtn = document.createElement("button");
    firstBtn.className = "page";
    firstBtn.innerText = "«";
    firstBtn.disabled = currentPage === 1;
    firstBtn.onclick = () => {
        currentPage = 1;
        renderTable();
    };
    container.appendChild(firstBtn);

    let prevBtn = document.createElement("button");
    prevBtn.className = "page";
    prevBtn.innerText = "‹";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        currentPage--;
        renderTable();
    };
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        let pageBtn = document.createElement("button");
        pageBtn.className = `page ${i === currentPage ? 'active' : ''}`;
        pageBtn.innerText = i;
        pageBtn.onclick = () => {
            currentPage = i;
            renderTable();
        };
        container.appendChild(pageBtn);
    }

    let nextBtn = document.createElement("button");
    nextBtn.className = "page";
    nextBtn.innerText = "›";
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.onclick = () => {
        currentPage++;
        renderTable();
    };
    container.appendChild(nextBtn);

    let lastBtn = document.createElement("button");
    lastBtn.className = "page";
    lastBtn.innerText = "»";
    lastBtn.disabled = currentPage === totalPages || totalPages === 0;
    lastBtn.onclick = () => {
        currentPage = totalPages;
        renderTable();
    };
    container.appendChild(lastBtn);
}

/* ================= SEARCH + TYPE FILTER ================= */
function searchInventory() {
    let query = document.getElementById("search").value.toLowerCase().trim();
    let typeValue = document.getElementById("typeFilter").value.toLowerCase();

    filteredData = allRowsData.filter(cols => {
        if (typeValue && (cols[1] || "").toLowerCase() !== typeValue) {
            return false;
        }

        if (!query) return true;

        let productId = (cols[0] || "").toLowerCase();   // Product ID
        let type = (cols[1] || "").toLowerCase();          // Type
        let footprint = (cols[2] || "").toLowerCase();     // Footprint
        let deviceType = (cols[3] || "").toLowerCase();    // Device Type
        let equipmentCost = (cols[4] || "").toLowerCase(); // Equipment Cost
        let durability = (cols[5] || "").toLowerCase();    // Durability
        let location = (cols[8] || "").toLowerCase();      // Location

        return productId.includes(query) || 
               equipmentCost.includes(query) || 
               type.includes(query) || 
               footprint.includes(query) || 
               deviceType.includes(query) || 
               durability.includes(query) ||
               location.includes(query);
    });

    currentPage = 1;
    renderTable();
}

/* ================= ADD ITEM ================= */
function addItem() {
    window.location.href = "ADD.html";
}
