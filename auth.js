// --- auth.js ---

// 1. DATABASE USER
const users = {
    owner: {
        username: "admin",
        password: "123",
        role: "owner",
        redirect: "owner.html"
    },
    barista: {
        username: "kasir",
        password: "123",
        role: "barista",
        redirect: "index.html" // <--- UBAH INI (sebelumnya barista.html)
    }
};

// 2. FUNGSI LOGIN
function handleLogin(event) {
    event.preventDefault(); 
    
    const userInput = document.getElementById('username').value;
    const passInput = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    let validUser = null;

    // Cek username & password
    if (userInput === users.owner.username && passInput === users.owner.password) {
        validUser = users.owner;
    } else if (userInput === users.barista.username && passInput === users.barista.password) {
        validUser = users.barista;
    }

    if (validUser) {
        // Simpan sesi
        localStorage.setItem('currentUser', JSON.stringify(validUser));
        
        // Redirect sesuai role
        window.location.href = validUser.redirect;
    } else {
        // Tampilkan error dan hapus class 'hidden'
        errorMsg.classList.remove('hidden');
        errorMsg.innerText = "Username atau Password salah!";
    }
}

// 3. FUNGSI CEK OTORISASI
function checkAuth(requiredRole) {
    const userSession = JSON.parse(localStorage.getItem('currentUser'));

    if (!userSession) {
        // Jika belum login, tendang ke login
        window.location.href = "login.html";
        return;
    }

    // Cek apakah role sesuai
    if (requiredRole && userSession.role !== requiredRole) {
        alert("Akses Ditolak! Anda bukan " + requiredRole);
        
        // Kembalikan ke halaman yang sesuai dengan hak aksesnya
        window.location.href = userSession.redirect; 
    }
}

// 4. FUNGSI LOGOUT
function logout() {
    if(confirm("Yakin ingin keluar?")) {
        localStorage.removeItem('currentUser');
        window.location.href = "login.html";
    }
}