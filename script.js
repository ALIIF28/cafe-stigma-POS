// ====== script.js (POS SYSTEM - BARISTA) ======

// 1. FUNGSI LOAD PRODUK & SINKRONISASI DATABASE
function loadProducts() {
    try {
        // Coba ambil data dari penyimpanan (Database Owner)
        const stored = localStorage.getItem('stigma_products_v5');

        // JIKA DATABASE KOSONG (Belum ada input dari Owner), GUNAKAN DATA BAWAAN INI:
        if (!stored) {
            const defaults = [
                // --- Kategori: Coffee ---
                { id: 1, name: "Stigma Aren Latte", price: 28000, stock: 50, category: "coffee", img: "resource/img_aren_latte.jpg" },
                { id: 2, name: "V60 Gayo Wine", price: 32000, stock: 15, category: "coffee", img: "resource/img_coffee_black.png" },
                { id: 3, name: "Cappuccino", price: 25000, stock: 30, category: "coffee", img: "resource/img_cappuccino.jpg" },
                { id: 4, name: "Caramel Macchiato", price: 30000, stock: 25, category: "coffee", img: "resource/img_caramel_macchiato.jpg" },

                // --- Kategori: Non-Coffee ---
                { id: 10, name: "Matcha Fusion", price: 29000, stock: 40, category: "non-coffee", img: "resource/img_matcha.png" },
                { id: 11, name: "Red Velvet Latte", price: 27000, stock: 35, category: "non-coffee", img: "resource/img_red_velvet.png" },
                { id: 12, name: "Lychee Tea", price: 18000, stock: 50, category: "non-coffee", img: "resource/img_lychee_tea.jpg" },
                { id: 13, name: "Chocolate Signature", price: 26000, stock: 45, category: "non-coffee", img: "resource/img_chocolate.png" },

                // --- Kategori: Pastry & Snack ---
                { id: 20, name: "Croissant Almond", price: 22000, stock: 20, category: "pastry", img: "resource/img_croissant.jpg" },
                { id: 21, name: "Choco Muffin", price: 18000, stock: 15, category: "pastry", img: "resource/img_muffin.jpg" },
                { id: 22, name: "French Fries", price: 20000, stock: 30, category: "pastry", img: "resource/img_fries.jpg" },
                { id: 23, name: "Mix Platter", price: 35000, stock: 10, category: "pastry", img: "resource/img_mix_platter.jpg" }
            ];

            // Simpan ke LocalStorage agar Owner juga bisa melihat/mengedit ini
            localStorage.setItem('stigma_products_v5', JSON.stringify(defaults));
            return defaults;
        }

        const allItems = JSON.parse(stored);
        // Filter: Tampilkan semua KECUALI bahan baku (raw)
        return allItems.filter(item => item.category !== 'raw');

    } catch (error) {
        console.error("Gagal memuat produk:", error);
        return [];
    }
}

// 2. CONFIG APP
const app = {
    products: loadProducts(),
    cart: [],
    history: [],
    currentTotal: 0
};

// ====== DOM ELEMENTS ======
const productGrid = document.getElementById('productGrid');
const cartContainer = document.getElementById('cartContainer');
const emptyCartState = document.getElementById('emptyCartState');
const searchInput = document.getElementById('searchInput');
const btnCheckout = document.getElementById('btnCheckout');
const btnCloseModal = document.getElementById('btnCloseModal');

// ====== RENDER UI PRODUK ======
function renderProducts(items) {
    if (!productGrid) return;
    productGrid.innerHTML = '';

    if (items.length === 0) {
        productGrid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10">Tidak ada menu tersedia untuk kategori ini.</p>';
        return;
    }

    items.forEach(product => {
        // Cek Stok
        const isOut = product.stock <= 0;
        const opacityClass = isOut ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer group";

        const imgUrl = product.img && product.img.length > 5 ? product.img : "resource/placeholder.png";

        const div = document.createElement('div');
        div.className = `bg-white rounded-2xl p-4 shadow-sm border border-transparent hover:shadow-xl transition-all duration-300 relative overflow-hidden ${opacityClass}`;

        div.innerHTML = `
            <div class="h-36 w-full rounded-xl bg-gray-100 mb-4 overflow-hidden relative">
                <img src="${imgUrl}" onerror="this.src='resource/placeholder.png'" class="w-full h-full object-cover ${!isOut ? 'group-hover:scale-110 transition duration-700' : ''}">
                ${!isOut ? `
                <div class="absolute bottom-2 right-2 bg-white text-stigma-green p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition">
                    <i class="ri-add-line font-bold"></i>
                </div>` : ''}
                ${isOut ? `<div class="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg tracking-widest">HABIS</div>` : ''}
            </div>
            <h3 class="font-bold text-stigma-dark text-base truncate">${product.name}</h3>
            <div class="flex justify-between items-center mt-2">
                <p class="text-stigma-green font-bold">Rp ${product.price.toLocaleString('id-ID')}</p>
                <span class="text-xs ${product.stock < 10 ? 'text-red-500 font-bold animate-pulse' : 'text-gray-400'}">
                    Stok: ${product.stock}
                </span>
            </div>
        `;

        if (!isOut) {
            div.addEventListener('click', () => addToCart(product.id));
        }
        productGrid.appendChild(div);
    });
}

// ====== LOGIKA KERANJANG (CART) & VALIDASI STOK ======
function addToCart(id) {
    const currentDb = loadProducts(); // Ambil stok terbaru
    const product = currentDb.find(p => p.id === id);

    if (!product) return;
    if (product.stock <= 0) { alert("Maaf, stok habis!"); return; }

    const existingItem = app.cart.find(item => item.id === id);
    const currentQtyInCart = existingItem ? existingItem.qty : 0;

    // CEK STOK SEBELUM TAMBAH
    if (currentQtyInCart + 1 > product.stock) {
        alert(`Stok tidak mencukupi! Hanya tersisa ${product.stock} porsi.`);
        return;
    }

    if (existingItem) {
        existingItem.qty++;
    } else {
        app.cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function updateQty(id, change) {
    const item = app.cart.find(i => i.id === id);
    if (!item) return;

    // Validasi saat tombol plus ditekan di cart
    if (change > 0) {
        const product = loadProducts().find(p => p.id === id);
        if (item.qty + 1 > product.stock) {
            alert("Mencapai batas stok tersedia!");
            return;
        }
    }

    item.qty += change;
    if (item.qty <= 0) {
        app.cart = app.cart.filter(i => i.id !== id);
    }
    updateCartUI();
}

function updateCartUI() {
    if (!cartContainer) return;

    if (app.cart.length === 0) {
        cartContainer.innerHTML = '';
        if (emptyCartState) {
            cartContainer.appendChild(emptyCartState);
            emptyCartState.style.display = 'flex';
        }
        updateTotals(0);
        return;
    }

    if (emptyCartState) emptyCartState.style.display = 'none';
    cartContainer.innerHTML = '';

    let subtotal = 0;

    app.cart.forEach(item => {
        const totalItemPrice = item.price * item.qty;
        subtotal += totalItemPrice;

        const div = document.createElement('div');
        div.className = "flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-[fadeIn_0.3s_ease-out]";

        div.innerHTML = `
            <img src="${item.img || 'resource/placeholder.png'}" onerror="this.src='resource/placeholder.png'" class="w-14 h-14 rounded-lg object-cover bg-gray-100">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-stigma-dark text-sm truncate">${item.name}</h4>
                <p class="text-xs text-gray-500">Rp ${item.price.toLocaleString('id-ID')}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
                <div class="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button class="btn-minus w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-white hover:text-red-500 rounded transition"><i class="ri-subtract-line"></i></button>
                    <span class="text-xs font-bold w-6 text-center">${item.qty}</span>
                    <button class="btn-plus w-6 h-6 flex items-center justify-center text-white bg-stigma-green hover:bg-stigma-dark rounded transition shadow-sm"><i class="ri-add-line"></i></button>
                </div>
                <span class="text-xs font-bold text-stigma-green">Rp ${totalItemPrice.toLocaleString('id-ID')}</span>
            </div>
        `;

        div.querySelector('.btn-minus').addEventListener('click', () => updateQty(item.id, -1));
        div.querySelector('.btn-plus').addEventListener('click', () => updateQty(item.id, 1));
        cartContainer.appendChild(div);
    });

    updateTotals(subtotal);
}

function updateTotals(subtotal) {
    const tax = subtotal * 0.10;
    const total = subtotal + tax;
    app.currentTotal = total;

    const ids = ['subtotalPrice', 'taxPrice', 'totalPrice', 'modalTotal'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = `Rp ${id.includes('total') ? total.toLocaleString('id-ID') : (id.includes('tax') ? tax : subtotal).toLocaleString('id-ID')}`;
    });
}

// ====== LOGIKA CHECKOUT & POTONG STOK ======
function showModal() {
    if (app.cart.length === 0) { alert("Keranjang masih kosong!"); return; }

    // Tampilkan Modal
    const modal = document.getElementById('successModal');
    const content = document.getElementById('modalContent');
    if (modal) {
        modal.classList.remove('hidden'); modal.classList.add('flex');
        setTimeout(() => { modal.classList.remove('opacity-0'); if (content) { content.classList.remove('scale-90'); content.classList.add('scale-100'); } }, 50);
    }

    const now = new Date();
    const trxData = {
        id: Math.floor(Math.random() * 1000000),
        date: now.toLocaleDateString('id-ID'),
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        items: app.cart.map(c => `${c.name} (${c.qty})`).join(', '),
        total: app.currentTotal
    };

    // --- PROSES POTONG STOK ---
    try {
        // 1. Ambil data Owner
        const ownerProducts = JSON.parse(localStorage.getItem('stigma_products_v5') || '[]');

        // 2. Kurangi stok
        app.cart.forEach(cartItem => {
            const idx = ownerProducts.findIndex(p => p.id === cartItem.id);
            if (idx !== -1) {
                ownerProducts[idx].stock -= cartItem.qty;
                if (ownerProducts[idx].stock < 0) ownerProducts[idx].stock = 0;
            }
        });

        // 3. Simpan update stok & transaksi
        localStorage.setItem('stigma_products_v5', JSON.stringify(ownerProducts));

        const allTrx = JSON.parse(localStorage.getItem('stigma_transactions') || '[]');
        allTrx.push(trxData);
        localStorage.setItem('stigma_transactions', JSON.stringify(allTrx));

        app.history.push(trxData);

    } catch (e) {
        console.error("Error Transaksi:", e);
    }
}

function closeModalAction() {
    const modal = document.getElementById('successModal');
    const content = document.getElementById('modalContent');

    if (modal && content) {
        modal.classList.add('opacity-0'); content.classList.remove('scale-100'); content.classList.add('scale-90');
        setTimeout(() => {
            modal.classList.add('hidden'); modal.classList.remove('flex');

            app.cart = [];
            updateCartUI();

            // Refresh agar stok baru terlihat
            app.products = loadProducts();
            renderProducts(app.products);

            const orderEl = document.getElementById('orderIdDisplay');
            if (orderEl) orderEl.innerText = `Order ID: #STG-${Math.floor(Math.random() * 9000) + 1000}`;
        }, 300);
    }
}

// ====== NAVIGASI ======
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.className = "nav-btn w-full h-12 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition flex items-center justify-center cursor-pointer");
    const activeBtn = document.getElementById(`nav-${viewName}`);
    if (activeBtn) activeBtn.className = "nav-btn w-full h-12 rounded-xl bg-stigma-green text-white shadow-lg flex items-center justify-center transition hover:scale-105 cursor-pointer";

    const cartSidebar = document.getElementById('cartSidebar');
    const searchWrapper = document.getElementById('searchWrapper');
    const pageTitle = document.getElementById('pageTitle');

    if (viewName === 'pos') {
        if (cartSidebar) { cartSidebar.classList.remove('hidden'); cartSidebar.style.width = '24rem'; }
        if (searchWrapper) searchWrapper.style.visibility = 'visible';
        if (pageTitle) pageTitle.innerText = "Menu Pesanan";
    } else {
        if (cartSidebar) { cartSidebar.style.width = '0'; setTimeout(() => cartSidebar.classList.add('hidden'), 300); }
        if (searchWrapper) searchWrapper.style.visibility = 'hidden';
        if (viewName === 'history') { if (pageTitle) pageTitle.innerText = "Riwayat Transaksi"; renderHistoryTable(); }
        else if (viewName === 'settings') { if (pageTitle) pageTitle.innerText = "Pengaturan"; }
    }
}

function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    if (app.history.length === 0) { tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-400">Belum ada transaksi sesi ini.</td></tr>`; return; }
    tbody.innerHTML = '';
    app.history.slice().reverse().forEach(trx => {
        tbody.innerHTML += `<tr class="border-b border-gray-100 hover:bg-gray-50 transition"><td class="p-4 font-bold text-stigma-dark">${trx.id}</td><td class="p-4 text-gray-500">${trx.time}</td><td class="p-4 truncate max-w-xs text-gray-600">${trx.items}</td><td class="p-4 font-bold text-stigma-green">Rp ${trx.total.toLocaleString('id-ID')}</td><td class="p-4"><span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Sukses</span></td></tr>`;
    });
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
    renderProducts(app.products);
    const dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

    // Klik Kategori
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-btn').forEach(b => b.className = "cat-btn px-5 py-2 rounded-full bg-white text-gray-500 border border-gray-200 hover:border-stigma-green hover:text-stigma-green text-sm font-bold transition cursor-pointer");
            e.target.className = "cat-btn active px-5 py-2 rounded-full bg-stigma-green text-white text-sm font-bold shadow-lg transition cursor-pointer";
            const cat = e.target.dataset.cat;
            if (cat === 'all') renderProducts(app.products); else renderProducts(app.products.filter(p => p.category === cat));
        });
    });
    // Search
    if (searchInput) searchInput.addEventListener('keyup', (e) => {
        const keyword = e.target.value.toLowerCase();
        renderProducts(app.products.filter(p => p.name.toLowerCase().includes(keyword)));
    });
    // Modal
    if (btnCheckout) btnCheckout.addEventListener('click', showModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModalAction);
});