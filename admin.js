// ============================================
// CINECHORD ADMIN JS - PRODUCTION
// ============================================

const BASE_URL = "https://cinechord-admin-production.up.railway.app";
const API = {
    LOGIN: `${BASE_URL}/api/auth/login`,
    WORKS: `${BASE_URL}/admin/works`,
    SERVICES: `${BASE_URL}/admin/services`,
    CONTACTS: `${BASE_URL}/admin/contacts`,
    ABOUT: `${BASE_URL}/api/about`
};

// 1. AUTHENTICATION
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
    if (!(options.body instanceof FormData)) options.headers['Content-Type'] = 'application/json';

    try {
        const res = await fetch(url, options);
        if (res.status === 401 || res.status === 403) {
            logout();
            return null;
        }
        return res;
    } catch (err) {
        console.error("API Error:", err);
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
                Swal.fire({icon: 'success', title: 'Xoş Gəldiniz', timer: 1000, showConfirmButton: false});
                checkAuth();
                loadDashboard();
            }
        } else {
            Swal.fire('Xəta', 'Giriş məlumatları yanlışdır', 'error');
        }
    } catch (e) {
        console.error(e);
        Swal.fire('Xəta', 'Server xətası', 'error');
    }
});

function logout() {
    localStorage.removeItem('jwt_token');
    checkAuth();
}

// NAVIGATION
function navigateTo(page) {
    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${page}`)?.classList.add('active');
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    if (page === 'dashboard') loadDashboard();
    if (page === 'works') loadWorks();
    if (page === 'services') loadServices();
    if (page === 'messages') loadMessages();
    if (page === 'about') loadAbout();
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(item.getAttribute('data-page'));
    });
});

// DASHBOARD & CHARTS
let worksChart, categoryChart;

async function loadDashboard() {
    const res = await authFetch(`${API.WORKS}/getAllWorks?size=100`);
    const worksData = res && res.ok ? await res.json() : {content: []};
    const works = worksData.content || [];

    const sRes = await authFetch(`${API.SERVICES}/getAll`);
    const services = sRes && sRes.ok ? await sRes.json() : [];

    const mRes = await authFetch(`${API.CONTACTS}/allMessages`);
    const msgs = mRes && mRes.ok ? await mRes.json() : [];

    // Update Counts
    document.getElementById('totalWorks').innerText = works.length;
    document.getElementById('totalServices').innerText = services.length;
    document.getElementById('totalMessages').innerText = msgs.length;
    document.getElementById('worksCount').innerText = works.length;
    document.getElementById('servicesCount').innerText = services.length;
    document.getElementById('messagesCount').innerText = msgs.length;

    initCharts(works);
}

function initCharts(works) {
    const ctx1 = document.getElementById('worksChart');
    if (ctx1) {
        if (worksChart) worksChart.destroy();
        // Sadə data nümunəsi
        worksChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{label: 'İşlər', data: [0, 0, 0, 0, 0, 0, works.length], borderColor: '#6366f1', tension: 0.4}]
            }
        });
    }
    
    const ctx2 = document.getElementById('categoryChart');
    if (ctx2) {
        if (categoryChart) categoryChart.destroy();
        categoryChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Film', 'Commercial', 'Clip'],
                datasets: [{data: [works.filter(w=>w.category==='FILM').length, works.filter(w=>w.category==='COMMERCIAL').length, works.filter(w=>w.category==='CLIP').length], backgroundColor: ['#6366f1', '#ec4899', '#f59e0b']}]
            }
        });
    }
}

// WORKS FUNCTIONS
async function loadWorks() {
    const grid = document.getElementById('worksGrid');
    grid.innerHTML = '<p class="text-center">Yüklənir...</p>';
    const res = await authFetch(`${API.WORKS}/getAllWorks?size=100&sort=id,desc`);
    const data = res && res.ok ? await res.json() : {content: []};
    const works = data.content || [];

    grid.innerHTML = works.length ? '' : '<p class="text-center">İş yoxdur</p>';
    works.forEach(w => {
        grid.innerHTML += `
            <div class="work-card">
                <img src="${w.imageUrl || 'https://via.placeholder.com/300'}" class="work-image" style="width:100%;height:200px;object-fit:cover">
                <div class="work-body p-3">
                    <h5>${w.title}</h5>
                    <div class="d-flex justify-content-between mt-3">
                        <button class="btn btn-sm btn-light text-primary" onclick='editWork(${JSON.stringify(w)})'>Redaktə</button>
                        <button class="btn btn-sm btn-light text-danger" onclick="deleteWork(${w.id})">Sil</button>
                    </div>
                </div>
            </div>`;
    });
}

function openWorkModal() {
    document.getElementById('workForm').reset();
    document.getElementById('workId').value = '';
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

function editWork(w) {
    document.getElementById('workId').value = w.id;
    document.getElementById('wTitle').value = w.title;
    document.getElementById('wCategory').value = w.category;
    document.getElementById('wVideoUrl').value = w.videoUrl;
    document.getElementById('wDescription').value = w.description;
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
    if(img) fd.append('imageFile', img);

    const url = id ? `${API.WORKS}/${id}` : `${API.WORKS}/createWork`;
    const method = id ? 'PUT' : 'POST';

    await authFetch(url, {method, body: fd});
    bootstrap.Modal.getInstance(document.getElementById('workModal')).hide();
    loadWorks();
    Swal.fire('Uğurlu', '', 'success');
}

async function deleteWork(id) {
    if(confirm('Silinsin?')) {
        await authFetch(`${API.WORKS}/deleteWork/${id}`, {method: 'DELETE'});
        loadWorks();
    }
}

// INIT
window.addEventListener('DOMContentLoaded', () => {
    if(checkAuth()) loadDashboard();
});