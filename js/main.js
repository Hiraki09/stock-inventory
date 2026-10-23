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

        // รวบรวมรายการที่เป็น Low Stock ทั้งหมดก่อน
        let lowStockRowsData = [];

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

            // รวมจำนวนชิ้นตาม Type
            if (typeCounts[deviceType] !== undefined) {
                typeCounts[deviceType] += quantity;
            } else {
                typeCounts[deviceType] = (typeCounts[deviceType] || 0) + quantity;
            }

            const isLow = quantity <= 3;

            if (isLow) {
                lowStockItems++;

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

                lowStockRowsData.push({
                    productId,
                    itemType: data[1],
                    quantity,
                    movementAction,
                    movementTime
                });
            }
        }

        // จำกัดให้แสดงผล Low Stock Items แค่ 15 รายการล่าสุด
        const limitedLowStock = lowStockRowsData.slice(-15).reverse();

        limitedLowStock.forEach(item => {
            let actionClass = "action-default";

            if (item.movementAction === "ADD") {
                actionClass = "action-add";
            } else if (item.movementAction === "EDIT") {
                actionClass = "action-edit";
            } else if (item.movementAction === "DELETE") {
                actionClass = "action-delete";
            }

            const formattedQty = item.quantity.toLocaleString("en-US");

            const row = document.createElement("tr");

            row.innerHTML = `
                <td style="color:#6e9dff; font-weight:600;">
                    ${escapeHtml(item.productId)}
                </td>

                <td>
                    ${escapeHtml(item.itemType)}
                </td>

                <td>
                    <span class="action-badge ${actionClass}">
                        ${escapeHtml(item.movementAction)}
                    </span>
                </td>

                <td class="qty-text low">
                    ${formattedQty}
                    <span class="low-tag">(LOW)</span>
                </td>

                <td>
                    <span class="status delayed">
                        Low Stock
                    </span>
                </td>

                <td style="color:#7e8999;">
                    ${escapeHtml(item.movementTime)}
                </td>
            `;

            table.appendChild(row);
        });

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

    const colors = [
        "#3b82f6", "#10b981", "#f59e0b", "#ef4444", 
        "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#64748b"
    ];

    let conicGradientStops = [];
    let accumulatedAngle = 0;

    keys.forEach((key, index) => {
        const count = typeCounts[key];
        const color = colors[index % colors.length];

        const heightPercent = Math.max((count / maxVal) * 100, 4);

        const group = document.createElement("div");
        group.className = "bar-group";
        group.innerHTML = `
            <div class="bar-value">${count}</div>
            <div class="bar" style="height: ${heightPercent}%; background: ${color};" title="${key}: ${count} pcs"></div>
            <div class="bar-label" title="${key}">${key}</div>
        `;
        barChartContainer.appendChild(group);

        const percentage = totalSum > 0 ? (count / totalSum) * 100 : 0;
        const angleSpan = totalSum > 0 ? (count / totalSum) * 360 : 0;

        const startAngle = accumulatedAngle;
        const endAngle = accumulatedAngle + angleSpan;
        conicGradientStops.push(`${color} ${startAngle}deg ${endAngle}deg`);
        accumulatedAngle = endAngle;

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

/* ================= LOAD LIVE LOGS (SHOW USER & STATUS) ================= */

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
            // ดึงชื่อ User จากฟิลด์ที่ 4 (index 3) ตามรูปแบบ history line ที่บันทึกไว้
            const user = data[3] ? data[3].replace(/^\||\|$/g, '') : "Unknown";

            const log = document.createElement("div");
            log.className = "log";

            let actionClass = "action-default";

            if (action === "ADD") {
                actionClass = "action-add";
            } else if (action === "EDIT") {
                actionClass = "action-edit";
            } else if (action === "DELETE") {
                actionClass = "action-delete";
            } else if (action === "LOGIN") {
                actionClass = "action-login";
            } else if (action === "LOGOUT") {
                actionClass = "action-logout";
            }

            log.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                    <div>
                        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 2px;">
                            User: <strong style="color: #f8fafc;">${escapeHtml(user)}</strong>
                        </div>
                        <div style="font-size: 13px; color: #cbd5e1;">
                            ID: <strong>${escapeHtml(productId)}</strong>
                        </div>
                    </div>
                    <div>
                        <span class="action-badge ${actionClass}">
                            ${escapeHtml(action)}
                        </span>
                    </div>
                </div>
                <div class="log-time" style="margin-top: 4px;">
                    ${escapeHtml(time)}
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