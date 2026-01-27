// ====== owner.js (FULL FIXED) ======

// Helper: Format Rupiah
const fmt = (num) => "Rp " + num.toLocaleString('id-ID');

// Helper: Ambil Data Transaksi
function getTransactions() {
    const stored = localStorage.getItem('stigma_transactions');
    return stored ? JSON.parse(stored) : [];
}

// Helper: Ambil Data Produk (Untuk Cek Kategori)
function getProducts() {
    const stored = localStorage.getItem('stigma_products_v5');
    if (!stored) {
        // Data Default minimal agar tidak error jika localStorage kosong
        return [
            { id: 1, name: "Stigma Aren Latte", category: "coffee" },
            { id: 2, name: "Croissant", category: "pastry" }
        ];
    }
    return JSON.parse(stored);
}

// 1. NAVIGASI VIEW
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.className = "nav-item w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-xl transition text-left text-gray-300";
    });

    const viewTarget = document.getElementById(`view-${viewName}`);
    if (viewTarget) viewTarget.classList.remove('hidden');

    const activeBtn = document.getElementById(`btn-${viewName}`);
    if (activeBtn) {
        activeBtn.className = "nav-item w-full flex items-center gap-3 px-4 py-3 bg-stigma-green text-white rounded-xl transition text-left shadow-lg";
    }

    // Refresh Data Sesuai Halaman
    if (viewName === 'dashboard') calculateStats();
    if (viewName === 'inventory') renderInventory();
    if (viewName === 'reports') renderReports();
}

// 2. LOGIKA DASHBOARD & STATISTIK REAL-TIME
function calculateStats() {
    const trxs = getTransactions();
    let income = 0;

    // Hitung Total Pemasukan
    trxs.forEach(t => income += t.total);

    // Hitung Pengeluaran (Contoh statis, bisa dikembangkan nanti)
    let expense = 500000;
    let profit = income - expense;

    // Render Angka ke Kartu
    const elIn = document.getElementById('val-in');
    const elOut = document.getElementById('val-out');
    const elProf = document.getElementById('val-profit');

    if (elIn) elIn.innerText = fmt(income);
    if (elOut) elOut.innerText = fmt(expense);
    if (elProf) {
        elProf.innerText = fmt(profit);
        elProf.className = profit >= 0 ? "text-3xl font-bold text-blue-600" : "text-3xl font-bold text-red-500";
    }

    // UPDATE GRAFIK
    updateLineChart(trxs);      // Grafik Garis (Pendapatan)
    updateCategoryChart(trxs);  // Grafik Donat (Kategori) --> INI YANG BARU
}

// --- A. Update Grafik Garis (Pendapatan) ---
function updateLineChart(trxs) {
    const ctx = document.getElementById('chartFlow');
    if (!ctx) return;

    // Ambil 10 transaksi terakhir
    const dataPoints = trxs.slice(-10);

    if (window.lineChartInstance) window.lineChartInstance.destroy();

    window.lineChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: dataPoints.map(t => t.time),
            datasets: [{
                label: 'Pemasukan',
                data: dataPoints.map(t => t.total),
                borderColor: '#2A5C35',
                backgroundColor: 'rgba(42, 92, 53, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#2A5C35'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                x: { grid: { display: false } }
            }
        }
    });
}

// --- B. Update Grafik Donat (Kategori Terlaris) ---
function updateCategoryChart(trxs) {
    const ctx = document.getElementById('chartRatio');
    if (!ctx) return;

    // 1. Siapkan Counter
    let counts = { coffee: 0, 'non-coffee': 0, pastry: 0, other: 0 };
    const products = getProducts(); // Ambil DB Produk untuk cek kategori berdasarkan nama

    // 2. Loop Semua Transaksi
    trxs.forEach(t => {
        // String item format: "Nama Barang (1), Nama Lain (2)"
        // Kita pecah string ini
        const itemStrings = t.items.split(', ');

        itemStrings.forEach(str => {
            // Regex untuk ambil Nama dan Qty. Contoh: "Kopi Gayo (2)"
            // LastIndexOf '(' digunakan untuk memisah nama dan qty
            const splitIndex = str.lastIndexOf(' (');

            if (splitIndex !== -1) {
                const productName = str.substring(0, splitIndex).trim(); // "Kopi Gayo"
                const qtyStr = str.substring(splitIndex + 2, str.length - 1); // "2"
                const qty = parseInt(qtyStr) || 1;

                // Cari kategori produk ini di database
                const product = products.find(p => p.name === productName);

                if (product && counts[product.category] !== undefined) {
                    counts[product.category] += qty;
                } else {
                    counts.other += qty;
                }
            }
        });
    });

    // 3. Update Chart
    if (window.doughnutChartInstance) window.doughnutChartInstance.destroy();

    window.doughnutChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Coffee', 'Non-Coffee', 'Pastry'],
            datasets: [{
                data: [counts.coffee, counts['non-coffee'], counts.pastry],
                backgroundColor: ['#2A5C35', '#EAB308', '#9CA3AF'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            }
        }
    });
}

// 3. LOGIKA INVENTORY
function renderInventory() {
    const products = getProducts();
    const tbody = document.getElementById('inventoryTableBody');
    const badgeEl = document.getElementById('totalItemsBadge');

    if (badgeEl) badgeEl.innerText = products.length + " Item";
    if (!tbody) return;

    tbody.innerHTML = '';

    products.forEach(item => {
        let badgeColor = "bg-gray-100 text-gray-600";
        if (item.category === 'raw') badgeColor = "bg-orange-100 text-orange-700";
        if (item.category === 'coffee') badgeColor = "bg-green-100 text-green-700";

        // Cek stok menipis
        let stockDisplay = `<span class="font-bold">${item.stock}</span>`;
        if (item.stock < 10) stockDisplay = `<span class="font-bold text-red-500 animate-pulse">${item.stock} (Low)</span>`;

        const row = `
            <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                <td class="p-4 font-bold text-stigma-dark">${item.name}</td>
                <td class="p-4"><span class="px-2 py-1 rounded text-xs font-bold uppercase ${badgeColor}">${item.category}</span></td>
                <td class="p-4 text-center">${stockDisplay}</td>
                <td class="p-4 text-gray-500">${item.price > 0 ? fmt(item.price) : '-'}</td>
                <td class="p-4 text-right">
                    <button onclick="deleteProduct(${item.id})" class="text-red-300 hover:text-red-500 p-2"><i class="ri-delete-bin-line"></i></button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function handleAdProduct(e) {
    e.preventDefault();
    const name = document.getElementById('inpName').value;
    const cat = document.getElementById('inpCat').value;
    const stock = parseInt(document.getElementById('inpStock').value);
    const price = parseInt(document.getElementById('inpPrice').value);

    const products = getProducts();
    products.push({ id: Date.now(), name, category: cat, stock, price });

    localStorage.setItem('stigma_products_v5', JSON.stringify(products));
    renderInventory();
    e.target.reset();
    alert("Produk berhasil ditambahkan!");
}

function deleteProduct(id) {
    if (confirm("Hapus item ini?")) {
        const products = getProducts().filter(p => p.id !== id);
        localStorage.setItem('stigma_products_v5', JSON.stringify(products));
        renderInventory();
    }
}

// 4. LOGIKA LAPORAN (REPORT)
function renderReports() {
    const trxs = getTransactions().reverse();
    const tbody = document.getElementById('reportTableBody');
    const totalEl = document.getElementById('reportTotalIncome');
    let totalIncome = 0;

    if (!tbody) return;
    tbody.innerHTML = '';

    if (trxs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-400 italic">Belum ada data transaksi.</td></tr>`;
        return;
    }

    trxs.forEach(t => {
        totalIncome += t.total;

        // Format Item List agar rapi (List 1, 2, 3)
        let rawItems = t.items.split(', ');
        let itemListHtml = '<ol class="list-decimal list-inside space-y-1">';
        rawItems.forEach(item => {
            itemListHtml += `<li class="text-xs leading-relaxed">${item.trim()}</li>`;
        });
        itemListHtml += '</ol>';

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 transition border-b border-gray-100 break-inside-avoid">
                <td class="p-4 text-gray-500 align-top">
                    <div class="font-bold text-stigma-dark">${t.date}</div>
                    <div class="text-xs mt-1">${t.time}</div>
                </td>
                <td class="p-4 font-mono text-xs text-gray-400 align-top">#${t.id}</td>
                <td class="p-4 text-sm text-gray-700 align-top">${itemListHtml}</td>
                <td class="p-4 align-top text-center"><span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Lunas</span></td>
                <td class="p-4 text-right font-bold text-stigma-dark align-top border-l border-dashed border-gray-200">${fmt(t.total)}</td>
            </tr>
        `;
    });

    if (totalEl) totalEl.innerText = fmt(totalIncome);
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    // Default load dashboard
    switchView('dashboard');
});