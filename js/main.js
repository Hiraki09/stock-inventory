/* =====================================================
SEARCH REDIRECT TO INVENTORY
===================================================== */
const searchInput = document.getElementById("globalSearchInput");
if (searchInput) {
    searchInput.addEventListener("click", function() {
        window.location.href = "Inventory.html";
    });
}

/* ================= LOAD INVENTORY FROM inventory.txt ================= */

async function loadInventory() {
    const table = document.getElementById("recentInventory");

    // กำหนดรายการ Type ที่ต้องการแสดงผลตามโจทย์
    const predefinedTypes = ["LED", "TRANSISTOR", "RESISTOR", "CAPACITOR", "IC", "INDUCTOR", "DIODE", "MODULE"];
    const typeCounts = {};
    predefinedTypes.forEach(t => typeCounts[t] = 0);

    try {
        const response = await fetch("inventory.txt?v=" + Date.now(), {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Cannot load inventory.txt");
        }

        const text = await response.text();

        const lines = text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line !== "");

        table.innerHTML = "";

        let totalItems = 0;
        let lowStockItems = 0;
        let totalQuantitySum = 0;
        let displayedCount = 0;

        let historyLogs = [];

        try {
            const historyResponse = await fetch(
                "history.txt?v=" + Date.now(),
                {
                    cache: "no-store"
                }
            );

            if (historyResponse.ok) {
                const historyText = await historyResponse.text();

                historyLogs = historyText
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(line => line !== "");
            }
        } catch (historyError) {
            console.warn("Cannot load history.txt:", historyError);
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const data = line
                .split("|")
                .map(value => value.trim());

            if (data.length < 8) continue;

            const productId = data[0];
            const deviceType = (data[1] || "").toUpperCase();
            const quantityText = data[6];
            const addedDate = data[7];

            const quantity = parseInt(quantityText, 10) || 0;

            totalItems++;
            totalQuantitySum += quantity;

            // รวมจำนวนชิ้นตาม Type (ถ้าตรงกับกลุ่มที่กำหนด หรือจะเพิ่มเข้าไปอัตโนมัติก็ได้)
            if (typeCounts[deviceType] !== undefined) {
                typeCounts[deviceType] += quantity;
            } else {
                // หากมี Type นอกเหนือจากที่กำหนด ให้จัดเข้ากลุ่มอื่นหรือเก็บเพิ่ม
                typeCounts[deviceType] = (typeCounts[deviceType] || 0) + quantity;
            }

            const isLow = quantity <= 3;

            if (isLow) {
                lowStockItems++;
            }

            // แสดงเฉพาะรายการที่ Low Stock เท่านั้นในตาราง
            if (!isLow) {
                continue;
            }

            let movementAction = "ADD";
            let movementTime = addedDate;

            for (let h = historyLogs.length - 1; h >= 0; h--) {
                const historyData = historyLogs[h]
                    .split("|")
                    .map(value => value.trim());

                const historyAction = historyData[0];
                const historyId = historyData[1];
                const historyTime = historyData[2];

                if (historyId === productId) {
                    movementAction = historyAction;
                    movementTime = historyTime || addedDate;
                    break;
                }
            }

            let actionClass = "action-default";

            if (movementAction === "ADD") {
                actionClass = "action-add";
            } else if (movementAction === "EDIT") {
                actionClass = "action-edit";
            } else if (movementAction === "DELETE") {
                actionClass = "action-delete";
            }

            const formattedQty = quantity.toLocaleString("en-US");

            const row = document.createElement("tr");

            row.innerHTML = `
                <td style="color:#6e9dff; font-weight:600;">
                    ${escapeHtml(productId)}
                </td>

                <td>
                    ${escapeHtml(data[1])}
                </td>

                <td>
                    <span class="action-badge ${actionClass}">
                        ${escapeHtml(movementAction)}
                    </span>
                </td>

                <td class="qty-text ${isLow ? "low" : ""}">
                    ${formattedQty}
                    ${isLow ? '<span class="low-tag">(LOW)</span>' : ""}
                </td>

                <td>
                    <span class="status ${isLow ? "delayed" : "completed"}">
                        ${isLow ? "Low Stock" : "Completed"}
                    </span>
                </td>

                <td style="color:#7e8999;">
                    ${escapeHtml(movementTime)}
                </td>
            `;

            table.appendChild(row);

            displayedCount++;
        }

        document.getElementById("totalItemsCount").innerText =
            totalItems.toLocaleString();

        document.getElementById("lowStockCount").innerText =
            lowStockItems.toLocaleString();

        document.getElementById("totalQuantityCount").innerText =
            totalQuantitySum.toLocaleString();

        if (table.children.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;color:#8995a7;">
                        ✅ No low stock items right now
                    </td>
                </tr>
            `;
        }

        // อัปเดตกราฟแท่งและกราฟวงกลมเปอร์เซ็นต์
        renderCharts(typeCounts, totalQuantitySum);

    } catch (error) {
        console.error(error);

        table.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;color:#ff716d;">
                    Cannot read inventory.txt
                    <br>
                    <small>
                        Open this site through a local server
                    </small>
                </td>
            </tr>
        `;
    }
}

/* ================= RENDER CHARTS ================= */
function renderCharts(typeCounts, totalSum) {
    const barChartContainer = document.getElementById("stockBarChart");
    const donutChartElement = document.getElementById("donutChartElement");
    const donutLegend = document.getElementById("donutLegend");

    barChartContainer.innerHTML = "";
    donutLegend.innerHTML = "";

    const keys = Object.keys(typeCounts);
    const maxVal = Math.max(...Object.values(typeCounts), 1);

    // สีสำหรับแต่ละ Type
    const colors = [
        "#3b82f6", "#10b981", "#f59e0b", "#ef4444", 
        "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#64748b"
    ];

    let conicGradientStops = [];
    let accumulatedAngle = 0;

    keys.forEach((key, index) => {
        const count = typeCounts[key];
        const color = colors[index % colors.length];

        // 1. สร้างกราฟแท่ง (Bar Chart)
        const heightPercent = Math.max((count / maxVal) * 100, 4); // อย่างน้อย 4% ให้เห็นแท่ง

        const group = document.createElement("div");
        group.className = "bar-group";
        group.innerHTML = `
            <div class="bar-value">${count}</div>
            <div class="bar" style="height: ${heightPercent}%; background: ${color};" title="${key}: ${count} pcs"></div>
            <div class="bar-label" title="${key}">${key}</div>
        `;
        barChartContainer.appendChild(group);

        // 2. คำนวณเปอร์เซ็นต์สำหรับกราฟวงกลม (Donut Chart เต็ม 100%)
        const percentage = totalSum > 0 ? (count / totalSum) * 100 : 0;
        const angleSpan = totalSum > 0 ? (count / totalSum) * 360 : 0;

        const startAngle = accumulatedAngle;
        const endAngle = accumulatedAngle + angleSpan;
        conicGradientStops.push(`${color} ${startAngle}deg ${endAngle}deg`);
        accumulatedAngle = endAngle;

        // เพิ่ม Legend ของวงกลม
        if (count > 0) {
            const legendItem = document.createElement("div");
            legendItem.className = "legend-item";
            legendItem.innerHTML = `
                <div><span class="legend-color" style="background: ${color};"></span>${key}</div>
                <div><b>${percentage.toFixed(1)}%</b> (${count})</div>
            `;
            donutLegend.appendChild(legendItem);
        }
    });

    // อัปเดตสีกราฟวงกลมแบบ conic-gradient ครบ 100%
    if (totalSum > 0 && conicGradientStops.length > 0) {
        donutChartElement.style.background = `conic-gradient(${conicGradientStops.join(", ")})`;
    } else {
        donutChartElement.style.background = `conic-gradient(#263548 0deg 360deg)`;
    }
}

/* ================= REAL-TIME DATE & TIME ================= */

function updateDateTime() {
    const now = new Date();

    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    document.getElementById("currentDate").textContent =
        `${day}/${month}/${year}`;

    document.getElementById("currentTime").textContent =
        `${hours}:${minutes}:${seconds}`;
}

updateDateTime();
setInterval(updateDateTime, 1000);

/* ================= LOAD LIVE LOGS ================= */

async function loadLiveLogs() {
    const logsContainer = document.getElementById("liveLogs");

    try {
        const response = await fetch(
            "/api/history?v=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("Cannot load history");
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "History API Error");
        }

        const logs = result.logs || [];

        logsContainer.innerHTML = "";

        if (logs.length === 0) {
            logsContainer.innerHTML = `
                <div class="log">
                    No activity
                    <div class="log-time">--</div>
                </div>
            `;
            return;
        }

        const latestLogs = logs.slice(-5).reverse();

        latestLogs.forEach(line => {
            const data = line
                .split("|")
                .map(value => value.trim());

            const action = data[0] || "-";
            const productId = data[1] || "-";
            const time = data[2] || "-";

            const log = document.createElement("div");
            log.className = "log";

            let actionClass = "action-default";

            if (action === "ADD") {
                actionClass = "action-add";
            } else if (action === "EDIT") {
                actionClass = "action-edit";
            } else if (action === "DELETE") {
                actionClass = "action-delete";
            }

            log.innerHTML = `
                <div>
                    <strong>ID: ${escapeHtml(productId)}</strong>

                    <span class="action-badge ${actionClass}">
                        ${escapeHtml(action)}
                    </span>

                    <div class="log-time">
                        ${escapeHtml(time)}
                    </div>
                </div>
            `;

            logsContainer.appendChild(log);
        });

    } catch (error) {
        console.error("Live Logs Error:", error);

        logsContainer.innerHTML = `
            <div class="log">
                Cannot load activity logs
                <div class="log-time">--</div>
            </div>
        `;
    }
}

loadInventory();
loadLiveLogs();

setInterval(loadLiveLogs, 2000);
