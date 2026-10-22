let inventoryItems = [];
let selectedDrawerFilter = "";

async function loadInventoryData() {
    try {
        const response = await fetch('/inventory.txt?v=' + Date.now());
        if (!response.ok) throw new Error("Failed to load inventory data");
        const textData = await response.text();

        inventoryItems = [];
        let lines = textData.trim().split("\n");

        lines.forEach(line => {
            if (!line.trim()) return;
            let cols = line.split("|").map(c => c.trim());
            
            while (cols.length < 9) {
                cols.push('-');
            }

            inventoryItems.push({
                id: cols[0],
                type: cols[1],
                detail: cols[3] !== '-' ? cols[3] : cols[2],
                qty: cols[6],
                drawer: cols[8] || 'R11'
            });
        });

        filterItems();
    } catch (err) {
        console.error("Error loading inventory:", err);
        document.getElementById("itemList").innerHTML = `<div style="color:#ff716d; text-align:center; padding:20px;">Failed to load data from Database</div>`;
    }
}

function renderList(items) {
    const listContainer = document.getElementById('itemList');
    listContainer.innerHTML = '';
    
    if (items.length === 0) {
        listContainer.innerHTML = '<div style="color:#64748b; text-align:center; padding:20px;">No items found in this drawer</div>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div class="list-item-title">${escapeHtml(item.id)} - ${escapeHtml(item.detail)}</div>
            <div class="list-item-sub">Type: ${escapeHtml(item.type)} | Qty: ${escapeHtml(item.qty)} | Drawer: <b>${escapeHtml(item.drawer)}</b></div>
        `;
        div.onclick = () => selectItem(item, div);
        listContainer.appendChild(div);
    });
}

function selectItem(item, element) {
    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.drawer').forEach(el => el.classList.remove('highlighted'));

    element.classList.add('active');

    const targetDrawer = document.querySelector(`.drawer[data-drawer="${item.drawer}"]`);
    if (targetDrawer) {
        targetDrawer.classList.add('highlighted');
        document.getElementById('statusText').innerHTML = `Highlighting: <b>${escapeHtml(item.id)}</b> at drawer <span style="color:#38bdf8">${escapeHtml(item.drawer)}</span>`;
    }
}

function filterByDrawer(drawerName) {
    selectedDrawerFilter = drawerName;
    
    document.querySelectorAll('.drawer').forEach(el => el.classList.remove('highlighted'));
    const targetDrawer = document.querySelector(`.drawer[data-drawer="${drawerName}"]`);
    if (targetDrawer) {
        targetDrawer.classList.add('highlighted');
    }

    document.getElementById('statusText').innerHTML = `Showing items in drawer: <span style="color:#38bdf8">${drawerName}</span>`;
    filterItems();
}

function resetDrawerFilter() {
    selectedDrawerFilter = "";
    document.querySelectorAll('.drawer').forEach(el => el.classList.remove('highlighted'));
    document.getElementById('statusText').innerHTML = `Click a drawer to filter items or click an item to highlight`;
    filterItems();
}

function filterItems() {
    const kw = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = inventoryItems.filter(i => {
        if (selectedDrawerFilter && i.drawer.toLowerCase() !== selectedDrawerFilter.toLowerCase()) {
            return false;
        }
        const matchKeyword = !kw || 
            i.id.toLowerCase().includes(kw) || 
            i.type.toLowerCase().includes(kw) || 
            i.detail.toLowerCase().includes(kw) ||
            i.drawer.toLowerCase().includes(kw);

        return matchKeyword;
    });

    renderList(filtered);
}

loadInventoryData();
