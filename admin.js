// ============================================
// CINECHORD ADMIN PANEL - FIXED & ROBUST
// ============================================

// ✅ Backend Linki
const BASE_URL = "https://cinechord-admin-production.up.railway.app";
const UPLOADS_URL = `${BASE_URL}/uploads/`;

const API = {
    LOGIN: `${BASE_URL}/api/auth/login`,
    WORKS: `${BASE_URL}/admin/works`,
    SERVICES: `${BASE_URL}/admin/services`,
    CONTACTS: `${BASE_URL}/admin/contacts`,
    ABOUT: `${BASE_URL}/api/about`
};

let worksChart, categoryChart;

// ============================================
// 1. UTILS
// ============================================

function getImageUrl(url) {
    if (!url) return 'https://via.placeholder.com/400x225/6366f1/ffffff?text=No+Image';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? `${BASE_URL}${url}` : `${UPLOADS_URL}${url}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ');
}

// ============================================
// 2. AUTH FETCH (GÜCLƏNDİRİLMİŞ)
// ============================================

function checkAuth() {
    const token = localStorage.getItem('jwt_token');
    if(!token) {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('admin-wrapper').style.display = 'none';
    } else {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('admin-wrapper').style.display = 'flex';
        if (!location.hash) navigateTo('dashboard');
    }
}

// ✅ BU FUNKSİYA XƏTALARI TUTUR VƏ JSON PARTLAMASININ QARŞISINI ALIR
async function authFetch(url, options = {}) {
    if(!options.headers) options.headers = {};
    
    if(!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    
    const token = localStorage.getItem('jwt_token');
    
    // DEBUG: Tokenin olub-olmadığını yoxlayaq
    if (!token) {
        console.warn("❌ Token yoxdur! Login səhifəsinə yönəldilir.");
        logout();
        return null;
    }

    options.headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(url, options);

        // Əgər status 200-299 arasında DEYİLSƏ
        if (!res.ok) {
            console.error(`❌ Server Xətası: ${res.status} - ${url}`);
            
            // 401 və ya 403 gəlibsə, deməli Token səhvdir
            if (res.status === 401 || res.status === 403) {
                console.warn("🔒 İcazə yoxdur (403/401). Çıxış edilir...");
                logout();
            }
            
            // Xəta olduqda NULL qaytarırıq ki, digər funksiyalar .json() edib partlamasın
            return null;
        }

        return res;
    } catch (error) {
        console.error("🌐 Şəbəkə Xətası:", error);
        return null;
    }
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;

    try {
        const res = await fetch(API.LOGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });

        if(res.ok) {
            const data = await res.json();
            const token = data.token || data.accessToken;
            
            if(token) {
                // Tokeni təmizləyib yenidən yazırıq
                localStorage.clear();
                localStorage.setItem('jwt_token', token);
                
                await Swal.fire({icon: 'success', title: 'Xoş Gəldiniz!', timer: 1000, showConfirmButton: false});
                location.reload(); 
            } else {
                Swal.fire('Xəta', 'Token gəlmədi', 'error');
            }
        } else { 
            Swal.fire('Giriş Xətası', 'Məlumatlar yanlışdır', 'error'); 
        }
    } catch(err) { 
        console.error(err);
        Swal.fire('Xəta', 'Server xətası', 'error'); 
    }
});

function logout() { 
    localStorage.removeItem('jwt_token');
    location.reload();
}

// ============================================
// 3. NAVIGATION
// ============================================

function navigateTo(page) {
    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const pageView = document.getElementById(`view-${page}`);
    const navItem = document.querySelector(`[data-page="${page}"]`);
    
    if (pageView) pageView.classList.add('active');
    if (navItem) navItem.classList.add('active');

    if(page === 'dashboard') loadDashboard();
    if(page === 'works') loadWorks();
    if(page === 'services') loadServices();
    if(page === 'messages') loadMessages();
    if(page === 'about') loadAbout();
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        if (page) navigateTo(page);
    });
});

// ============================================
// 4. DASHBOARD (FIXED)
// ============================================

async function loadDashboard() {
    try {
        // Works yüklə
        const worksRes = await authFetch(`${API.WORKS}/getAllWorks?size=100`);
        // Əgər authFetch NULL qaytarıbsa (yəni xəta olubsa), dayandır!
        if (!worksRes) return; 

        const worksData = await worksRes.json();
        const works = worksData.content || [];

        // Services yüklə
        const servicesRes = await authFetch(`${API.SERVICES}/getAll`);
        // NULL yoxlanışı
        const services = servicesRes ? await servicesRes.json() : [];

        // Messages yüklə
        let messages = [];
        const messagesRes = await authFetch(`${API.CONTACTS}/allMessages`);
        if (messagesRes) {
            messages = await messagesRes.json();
        }

        updateStats(works.length, services.length, messages);
        initCharts(works);
        loadActivity(works);

    } catch (error) {
        console.error('Dashboard Load Error:', error);
    }
}

function updateStats(worksCount, servicesCount, messages) {
    if(document.getElementById('totalWorks')) document.getElementById('totalWorks').textContent = worksCount;
    if(document.getElementById('totalServices')) document.getElementById('totalServices').textContent = servicesCount;
    
    const unreadCount = Array.isArray(messages) ? messages.filter(m => !(m.isRead || m.read)).length : 0;
    if(document.getElementById('totalMessages')) document.getElementById('totalMessages').textContent = unreadCount;
    
    if(document.getElementById('worksCount')) document.getElementById('worksCount').textContent = worksCount;
    if(document.getElementById('servicesCount')) document.getElementById('servicesCount').textContent = servicesCount;
    if(document.getElementById('messagesCount')) document.getElementById('messagesCount').textContent = unreadCount;
}

function initCharts(works) {
    const worksCtx = document.getElementById('worksChart');
    if (worksCtx) {
        if (worksChart) worksChart.destroy();
        // Sadələşdirilmiş Chart məlumatları
        worksChart = new Chart(worksCtx, {
            type: 'line',
            data: {
                labels: ['Bazar', 'B.ert', 'Ç.axş', 'Çərş', 'C.axş', 'Cümə', 'Şənbə'],
                datasets: [{
                    label: 'İşlər',
                    data: [0, 0, 0, 0, 0, 0, works.length], // Müvəqqəti dummy data
                    borderColor: '#6366f1',
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

function loadActivity(works) {
    const list = document.getElementById('activityList');
    if (!list) return;
    const recentWorks = works.slice(0, 5);
    
    if (recentWorks.length === 0) {
        list.innerHTML = '<div class="activity-item">Hələ aktivlik yoxdur</div>';
        return;
    }
    list.innerHTML = recentWorks.map(w => `
        <div class="activity-item">
            <div class="activity-icon" style="background: #6366f1"><i class="fas fa-film"></i></div>
            <div class="activity-info">
                <div class="activity-title">"${w.title}"</div>
                <div class="activity-time">${formatDate(w.createdAt)}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// 5. WORKS (FIXED)
// ============================================

async function loadWorks() {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;

    try {
        const res = await authFetch(`${API.WORKS}/getAllWorks?size=100&sort=id,desc`);
        
        // ✅ XƏTA YOXLANIŞI: Əgər res null-dırsa, heç nə etmə
        if(!res) {
            grid.innerHTML = `<div class="empty-state"><h3>Məlumat yüklənmədi (403)</h3></div>`;
            return;
        }
        
        const data = await res.json();
        const works = data.content || []; 
        
        if (works.length === 0) {
            grid.innerHTML = `<div class="empty-state"><h3>Hələ heç bir iş yoxdur</h3></div>`;
            return;
        }
        
        grid.innerHTML = '';
        works.forEach(w => {
            const card = document.createElement('div');
            card.className = 'work-card';
            card.innerHTML = `
                <img src="${getImageUrl(w.imageUrl)}" class="work-image" alt="${w.title}">
                <div class="work-body">
                    <h3 class="work-title">${w.title}</h3>
                    <div class="work-actions">
                        <button class="btn-edit" onclick='editWork(${JSON.stringify(w).replace(/'/g, "&apos;")})'>Redaktə</button>
                        <button class="btn-delete" onclick="deleteWork(${w.id})">Sil</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch(e) { console.error('Works error:', e); }
}

function openWorkModal() {
    document.getElementById('workForm').reset();
    document.getElementById('workId').value = ''; 
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

function editWork(w) {
    document.getElementById('workId').value = w.id;
    document.getElementById('wTitle').value = w.title;
    document.getElementById('wClient').value = w.clientName || '';
    document.getElementById('wCategory').value = w.category;
    document.getElementById('wVideoUrl').value = w.videoUrl || '';
    document.getElementById('wDescription').value = w.description || '';
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

async function submitWork() {
    const id = document.getElementById('workId').value;
    const fd = new FormData();
    fd.append('title', document.getElementById('wTitle').value);
    fd.append('clientName', document.getElementById('wClient').value);
    fd.append('category', document.getElementById('wCategory').value);
    fd.append('videoUrl', document.getElementById('wVideoUrl').value);
    fd.append('description', document.getElementById('wDescription').value);
    fd.append('isFeatured', false); 

    const img = document.getElementById('wImage').files[0];
    if(img) fd.append('imageFile', img); 
    const vid = document.getElementById('wPreview').files[0];
    if(vid) fd.append('previewVideoFile', vid); 

    Swal.fire({title: 'Yüklənir...', didOpen: () => Swal.showLoading()});
    
    try {
        let url = id ? `${API.WORKS}/${id}` : `${API.WORKS}/createWork`;
        let method = id ? 'PUT' : 'POST';

        const res = await authFetch(url, { method: method, body: fd });
        
        if(res) { // res null deyilsə
            Swal.fire('Uğurlu!', 'Tamamlandı', 'success');
            bootstrap.Modal.getInstance(document.getElementById('workModal')).hide();
            loadWorks(); 
            loadDashboard(); 
        } else {
             // Null gəlibsə deməli authFetch xətanı artıq tutub
             // Amma yenə də alert verə bilərik
             Swal.fire('Xəta', 'Əməliyyat uğursuz oldu', 'error');
        }
    } catch(e) { Swal.fire('Xəta', e.message, 'error'); }
}

async function deleteWork(id) {
    const r = await Swal.fire({title: 'Silinsin?', showCancelButton: true, confirmButtonText: 'Sil'});
    if(r.isConfirmed) {
        const res = await authFetch(`${API.WORKS}/deleteWork/${id}`, { method: 'DELETE' });
        if (res) {
            Swal.fire('Silindi', '', 'success');
            loadWorks();
            loadDashboard();
        }
    }
}

// ============================================
// 6. SERVICES (FIXED)
// ============================================

async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    try {
        const res = await authFetch(`${API.SERVICES}/getAll`);
        // ✅ XƏTA YOXLANIŞI
        if(!res) return;

        const services = await res.json();
        grid.innerHTML = services.length === 0 ? '<div class="empty-state">Xidmət yoxdur</div>' : '';
        
        services.forEach(s => {
            grid.innerHTML += `
                <div class="service-card">
                    <h3>${s.title}</h3>
                    <p>${(s.description || '').substring(0,50)}...</p>
                    <div style="display:flex;gap:10px;margin-top:10px">
                        <button onclick='editService(${JSON.stringify(s).replace(/'/g,"&apos;")})' class="btn-edit">Redaktə</button>
                        <button onclick="deleteService(${s.id})" class="btn-delete">Sil</button>
                    </div>
                </div>
            `;
        });
    } catch(e) { console.error(e); }
}

function openServiceModal() {
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
    new bootstrap.Modal(document.getElementById('serviceModal')).show();
}

function editService(s) {
    document.getElementById('serviceId').value = s.id;
    document.getElementById('sTitle').value = s.title;
    document.getElementById('sIcon').value = s.iconClass || '';
    document.getElementById('sDesc').value = s.description || '';
    new bootstrap.Modal(document.getElementById('serviceModal')).show();
}

async function submitService() {
    const id = document.getElementById('serviceId').value;
    const fd = new FormData();
    fd.append('title', document.getElementById('sTitle').value);
    fd.append('iconClass', document.getElementById('sIcon').value);
    fd.append('description', document.getElementById('sDesc').value);
    const video = document.getElementById('sVideoFile').files[0];
    if(video) fd.append('videoFile', video);
    
    Swal.fire({title: 'Yüklənir...', didOpen: () => Swal.showLoading()});
    try {
        const url = id ? `${API.SERVICES}/${id}` : API.SERVICES;
        const method = id ? 'PUT' : 'POST';
        const res = await authFetch(url, { method: method, body: fd });
        if(res) {
            Swal.fire('Uğurlu!', 'Saxlanıldı', 'success');
            bootstrap.Modal.getInstance(document.getElementById('serviceModal')).hide();
            loadServices(); loadDashboard();
        }
    } catch(e) { Swal.fire('Xəta', e.message, 'error'); }
}

async function deleteService(id) {
    const r = await Swal.fire({title: 'Silinsin?', showCancelButton: true, confirmButtonText: 'Sil'});
    if(r.isConfirmed) {
        const res = await authFetch(`${API.SERVICES}/${id}`, { method: 'DELETE' });
        if(res) {
            Swal.fire('Silindi!', '', 'success');
            loadServices(); loadDashboard();
        }
    }
}

// ============================================
// 7. MESSAGES
// ============================================

async function loadMessages() {
    const list = document.getElementById('messagesList');
    if (!list) return;
    
    try {
        const res = await authFetch(`${API.CONTACTS}/allMessages`);
        if(!res) {
            list.innerHTML = 'Xəta baş verdi';
            return;
        }
        
        const messages = await res.json();
        list.innerHTML = '';
        messages.forEach(m => {
            list.innerHTML += `
                <div style="padding:10px;border-bottom:1px solid #eee">
                    <b>${m.name}</b>: ${m.message} 
                    <button onclick="deleteMessage(${m.id})" style="color:red;float:right">Sil</button>
                </div>`;
        });
    } catch(e) { console.error(e); }
}

async function deleteMessage(id) {
    if(confirm('Silinsin?')) {
        await authFetch(`${API.CONTACTS}/${id}`, { method: 'DELETE' });
        loadMessages();
    }
}

// ============================================
// 8. ABOUT
// ============================================

async function loadAbout() {
    try {
        const res = await fetch(`${API.ABOUT}/getAbout`);
        if(!res.ok) return;
        const data = await res.json();
        document.getElementById('aMainTitle').value = data.mainTitle || '';
        // Digər sahələr...
    } catch(e) {}
}

document.getElementById('saveAboutBtn')?.addEventListener('click', async () => {
    // About save logic... eyni qalır
    // Sadəcə authFetch istifadə edin
});

// INIT
checkAuth();