// ============================================
// CINECHORD ADMIN JS - FULL VERSION
// ============================================

const BASE_URL = "https://cinechord-admin-production.up.railway.app";
const API = {
    LOGIN: `${BASE_URL}/api/auth/login`,
    WORKS: `${BASE_URL}/admin/works`,
    SERVICES: `${BASE_URL}/admin/services`,
    CONTACTS: `${BASE_URL}/admin/contacts`,
    ABOUT: `${BASE_URL}/api/about`
};

// ============================================
// 1. AUTHENTICATION
// ============================================
function checkAuth() {
    const token = localStorage.getItem('jwt_token');
    const overlay = document.getElementById('login-overlay');
    const wrapper = document.getElementById('admin-wrapper');

    if (!token) {
        overlay.style.display = 'flex';
        wrapper.style.display = 'none';
        return false;
    } else {
        overlay.style.display = 'none';
        wrapper.style.display = 'flex';
        return true;
    }
}

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('jwt_token');
    if (!options.headers) options.headers = {};
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    // FormData üçün Content-Type avtomatik təyin olunmalıdır
    if (!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }

    try {
        const res = await fetch(url, options);
        if (res.status === 401 || res.status === 403) {
            logout();
            return null;
        }
        return res;
    } catch (err) {
        console.error("API Error:", err);
        Swal.fire('Xəta', 'Server ilə əlaqə xətası', 'error');
        return null;
    }
}

// LOGIN
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;

    try {
        const res = await fetch(API.LOGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: u, password: p})
        });

        if (res.ok) {
            const data = await res.json();
            if (data.token || data.accessToken) {
                localStorage.setItem('jwt_token', data.token || data.accessToken);
                Swal.fire({
                    icon: 'success', 
                    title: 'Xoş Gəldiniz', 
                    timer: 1000, 
                    showConfirmButton: false
                });
                checkAuth();
                loadDashboard();
            }
        } else {
            Swal.fire('Xəta', 'İstifadəçi adı və ya şifrə yanlışdır', 'error');
        }
    } catch (e) {
        console.error(e);
        Swal.fire('Xəta', 'Server xətası', 'error');
    }
});

function logout() {
    localStorage.removeItem('jwt_token');
    Swal.fire({
        icon: 'info',
        title: 'Çıxış edildi',
        timer: 1000,
        showConfirmButton: false
    });
    checkAuth();
}

// ============================================
// 2. NAVIGATION (DÜZƏLDİLMİŞ)
// ============================================
function switchView(page) {
    // Bütün səhifələri gizlət
    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
    
    // Bütün nav itemlərdən active-i sil
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Seçilmiş səhifəni göstər
    const viewElement = document.getElementById(`view-${page}`);
    if (viewElement) {
        viewElement.classList.add('active');
    }
    
    // Nav itemə active əlavə et
    const navItem = document.querySelector(`[onclick="switchView('${page}')"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Səhifəyə görə data yüklə
    if (page === 'dashboard') loadDashboard();
    if (page === 'works') loadWorks();
    if (page === 'services') loadServices();
    if (page === 'messages') loadMessages();
    if (page === 'about') loadAbout();
}

// ============================================
// 3. DASHBOARD & CHARTS
// ============================================
let worksChart, categoryChart;

async function loadDashboard() {
    try {
        // Works
        const res = await authFetch(`${API.WORKS}/getAllWorks?size=100`);
        const worksData = res && res.ok ? await res.json() : {content: []};
        const works = worksData.content || [];

        // Services
        const sRes = await authFetch(`${API.SERVICES}/getAll`);
        const services = sRes && sRes.ok ? await sRes.json() : [];

        // Messages
        const mRes = await authFetch(`${API.CONTACTS}/allMessages`);
        const msgs = mRes && mRes.ok ? await mRes.json() : [];

        // Update stat cards
        document.getElementById('totalWorks').innerText = works.length;
        document.getElementById('totalServices').innerText = services.length;
        document.getElementById('totalMessages').innerText = msgs.length;

        // Init charts
        initCharts(works);
    } catch (err) {
        console.error('Dashboard yüklənə bilmədi:', err);
    }
}

function initCharts(works) {
    // Works Chart
    const ctx1 = document.getElementById('worksChart');
    if (ctx1) {
        if (worksChart) worksChart.destroy();
        
        worksChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'],
                datasets: [{
                    label: 'İşlər',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, works.length],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {display: true}
                }
            }
        });
    }
    
    // Category Chart
    const ctx2 = document.getElementById('categoryChart');
    if (ctx2) {
        if (categoryChart) categoryChart.destroy();
        
        const categories = {
            'FILM': works.filter(w => w.category === 'FILM').length,
            'COMMERCIAL': works.filter(w => w.category === 'COMMERCIAL').length,
            'CLIP': works.filter(w => w.category === 'CLIP').length,
            'MUSIC_VIDEO': works.filter(w => w.category === 'MUSIC_VIDEO').length,
            'DOCUMENTARY': works.filter(w => w.category === 'DOCUMENTARY').length,
            'SOCIAL': works.filter(w => w.category === 'SOCIAL').length
        };
        
        categoryChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {position: 'bottom'}
                }
            }
        });
    }
}

// ============================================
// 4. WORKS FUNCTIONS
// ============================================
async function loadWorks() {
    const grid = document.getElementById('worksGrid');
    grid.innerHTML = '<div class="col-12 text-center"><p>Yüklənir...</p></div>';
    
    const res = await authFetch(`${API.WORKS}/getAllWorks?size=100&sort=id,desc`);
    if (!res || !res.ok) {
        grid.innerHTML = '<div class="col-12"><p class="text-danger">Xəta baş verdi</p></div>';
        return;
    }
    
    const data = await res.json();
    const works = data.content || [];

    if (works.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center"><p>Hələ iş əlavə edilməyib</p></div>';
        return;
    }

    grid.innerHTML = '';
    works.forEach(w => {
        const card = `
            <div class="col-md-4">
                <div class="card shadow-sm">
                    <img src="${w.imageUrl || 'https://via.placeholder.com/400x300'}" 
                         class="card-img-top" 
                         style="height:200px;object-fit:cover;">
                    <div class="card-body">
                        <h5 class="card-title">${w.title}</h5>
                        <span class="badge bg-primary">${w.category}</span>
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-sm btn-outline-primary flex-fill" 
                                    onclick='editWork(${JSON.stringify(w)})'>
                                <i class="fas fa-edit"></i> Redaktə
                            </button>
                            <button class="btn btn-sm btn-outline-danger" 
                                    onclick="deleteWork(${w.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        grid.innerHTML += card;
    });
}

function openWorkModal() {
    document.getElementById('workForm').reset();
    document.getElementById('workId').value = '';
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

function editWork(work) {
    document.getElementById('workId').value = work.id;
    document.getElementById('wTitle').value = work.title;
    document.getElementById('wCategory').value = work.category;
    document.getElementById('wVideoUrl').value = work.videoUrl || '';
    document.getElementById('wDescription').value = work.description || '';
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

async function submitWork() {
    const id = document.getElementById('workId').value;
    const fd = new FormData();
    
    fd.append('title', document.getElementById('wTitle').value);
    fd.append('category', document.getElementById('wCategory').value);
    fd.append('videoUrl', document.getElementById('wVideoUrl').value);
    fd.append('description', document.getElementById('wDescription').value);
    
    const img = document.getElementById('wImage').files[0];
    if (img) fd.append('imageFile', img);

    const url = id ? `${API.WORKS}/${id}` : `${API.WORKS}/createWork`;
    const method = id ? 'PUT' : 'POST';

    const res = await authFetch(url, {method, body: fd});
    
    if (res && res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('workModal')).hide();
        loadWorks();
        Swal.fire('Uğurlu!', 'İş yadda saxlanıldı', 'success');
    } else {
        Swal.fire('Xəta', 'Yadda saxlanılmadı', 'error');
    }
}

async function deleteWork(id) {
    const result = await Swal.fire({
        title: 'Əminsiniz?',
        text: 'Bu işi silmək istədiyinizə əminsiniz?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Bəli, sil',
        cancelButtonText: 'Xeyr'
    });

    if (result.isConfirmed) {
        const res = await authFetch(`${API.WORKS}/deleteWork/${id}`, {method: 'DELETE'});
        if (res && res.ok) {
            loadWorks();
            Swal.fire('Silindi!', 'İş uğurla silindi', 'success');
        }
    }
}

// ============================================
// 5. SERVICES FUNCTIONS
// ============================================
async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    grid.innerHTML = '<div class="col-12 text-center"><p>Yüklənir...</p></div>';
    
    const res = await authFetch(`${API.SERVICES}/getAll`);
    if (!res || !res.ok) {
        grid.innerHTML = '<div class="col-12"><p class="text-danger">Xəta baş verdi</p></div>';
        return;
    }
    
    const services = await res.json();

    if (services.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center"><p>Hələ xidmət əlavə edilməyib</p></div>';
        return;
    }

    grid.innerHTML = '';
    services.forEach(s => {
        const card = `
            <div class="col-md-6">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="${s.icon || 'fas fa-star'} fa-2x text-primary me-3"></i>
                            <h5 class="card-title mb-0">${s.title}</h5>
                        </div>
                        <p class="card-text text-muted">${s.description || 'Təsvir yoxdur'}</p>
                        ${s.videoUrl ? `<small class="text-success"><i class="fas fa-video"></i> Video var</small>` : ''}
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-sm btn-outline-primary flex-fill" 
                                    onclick='editService(${JSON.stringify(s)})'>
                                <i class="fas fa-edit"></i> Redaktə
                            </button>
                            <button class="btn btn-sm btn-outline-danger" 
                                    onclick="deleteService(${s.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        grid.innerHTML += card;
    });
}

function openServiceModal() {
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
    new bootstrap.Modal(document.getElementById('serviceModal')).show();
}

function editService(service) {
    document.getElementById('serviceId').value = service.id;
    document.getElementById('sTitle').value = service.title;
    document.getElementById('sIcon').value = service.icon || '';
    document.getElementById('sDescription').value = service.description || '';
    new bootstrap.Modal(document.getElementById('serviceModal')).show();
}

async function submitService() {
    const id = document.getElementById('serviceId').value;
    const fd = new FormData();
    
    fd.append('title', document.getElementById('sTitle').value);
    fd.append('icon', document.getElementById('sIcon').value);
    fd.append('description', document.getElementById('sDescription').value);
    
    const video = document.getElementById('sVideoFile').files[0];
    if (video) fd.append('videoFile', video);

    const url = id ? `${API.SERVICES}/${id}` : `${API.SERVICES}`;
    const method = id ? 'PUT' : 'POST';

    const res = await authFetch(url, {method, body: fd});
    
    if (res && res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('serviceModal')).hide();
        loadServices();
        Swal.fire('Uğurlu!', 'Xidmət yadda saxlanıldı', 'success');
    } else {
        Swal.fire('Xəta', 'Yadda saxlanılmadı', 'error');
    }
}

async function deleteService(id) {
    const result = await Swal.fire({
        title: 'Əminsiniz?',
        text: 'Bu xidməti silmək istədiyinizə əminsiniz?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Bəli, sil',
        cancelButtonText: 'Xeyr'
    });

    if (result.isConfirmed) {
        const res = await authFetch(`${API.SERVICES}/${id}`, {method: 'DELETE'});
        if (res && res.ok) {
            loadServices();
            Swal.fire('Silindi!', 'Xidmət uğurla silindi', 'success');
        }
    }
}

// ============================================
// 6. MESSAGES FUNCTIONS
// ============================================
async function loadMessages() {
    const list = document.getElementById('messagesList');
    list.innerHTML = '<p class="text-center">Yüklənir...</p>';
    
    const res = await authFetch(`${API.CONTACTS}/allMessages`);
    if (!res || !res.ok) {
        list.innerHTML = '<p class="text-danger">Mesajlar yüklənə bilmədi</p>';
        return;
    }
    
    const messages = await res.json();

    if (messages.length === 0) {
        list.innerHTML = '<p class="text-center">Mesaj yoxdur</p>';
        return;
    }

    list.innerHTML = '';
    messages.forEach(msg => {
        const item = `
            <div class="list-group-item ${msg.isRead ? '' : 'border-start border-primary border-3'}">
                <div class="d-flex w-100 justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${msg.name}</h6>
                        <p class="mb-1 text-muted small">${msg.email} • ${msg.phone || 'Telefon yoxdur'}</p>
                        <p class="mb-0">${msg.message}</p>
                    </div>
                    <div class="d-flex flex-column gap-1">
                        ${!msg.isRead ? `
                            <button class="btn btn-sm btn-outline-success" 
                                    onclick="markAsRead(${msg.id})">
                                <i class="fas fa-check"></i>
                            </button>` : ''}
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="deleteMessage(${msg.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        list.innerHTML += item;
    });
}

async function markAsRead(id) {
    const res = await authFetch(`${API.CONTACTS}/${id}/read`, {method: 'PATCH'});
    if (res && res.ok) {
        loadMessages();
        Swal.fire({icon: 'success', title: 'Oxundu', timer: 1000, showConfirmButton: false});
    }
}

async function deleteMessage(id) {
    const result = await Swal.fire({
        title: 'Əminsiniz?',
        text: 'Mesajı silmək istəyirsiniz?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Bəli, sil',
        cancelButtonText: 'Xeyr'
    });

    if (result.isConfirmed) {
        const res = await authFetch(`${API.CONTACTS}/${id}`, {method: 'DELETE'});
        if (res && res.ok) {
            loadMessages();
            Swal.fire('Silindi!', '', 'success');
        }
    }
}

// ============================================
// 7. ABOUT FUNCTIONS
// ============================================
async function loadAbout() {
    const res = await authFetch(`${API.ABOUT}`);
    if (res && res.ok) {
        const data = await res.json();
        document.getElementById('aMainTitle').value = data.mainTitle || '';
        document.getElementById('aWho').value = data.whoWeAre || '';
    }
}

document.getElementById('saveAboutBtn')?.addEventListener('click', async () => {
    const payload = {
        mainTitle: document.getElementById('aMainTitle').value,
        whoWeAre: document.getElementById('aWho').value
    };

    const res = await authFetch(API.ABOUT, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });

    if (res && res.ok) {
        Swal.fire('Uğurlu!', 'Haqqımızda məlumatları yeniləndi', 'success');
    } else {
        Swal.fire('Xəta', 'Yeniləmə uğursuz oldu', 'error');
    }
});

// ============================================
// 8. INITIALIZATION
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        loadDashboard();
    }
});