// ============================================
// CINECHORD ADMIN PANEL - FINAL PRODUCTION
// ============================================

// ✅ Backend Linki
const BASE_URL = "https://cinechord-admin-production.up.railway.app";
const UPLOADS_URL = `${BASE_URL}/uploads/`;

// ✅ API Endpoints
const API = {
    LOGIN: `${BASE_URL}/api/auth/login`,
    WORKS: `${BASE_URL}/admin/works`,
    SERVICES: `${BASE_URL}/admin/services`,
    CONTACTS: `${BASE_URL}/admin/contacts`,
    ABOUT: `${BASE_URL}/api/about`
};

// Qlobal dəyişənlər (Chart.js üçün)
let worksChart, categoryChart;
let isAuthChecking = false; // Təkrar yoxlama problemini həll edir

// ============================================
// 1. KÖMƏKÇİ FUNKSİYALAR (UTILS)
// ============================================

// Şəkil URL-ni düzgün formata salır
function getImageUrl(url) {
    if (!url) return 'https://via.placeholder.com/400x225/6366f1/ffffff?text=No+Image';
    if (url.startsWith('http')) return url;
    // '/' ilə başlayırsa base url əlavə et, yoxsa uploads qovluğuna yönəlt
    return url.startsWith('/') ? `${BASE_URL}${url}` : `${UPLOADS_URL}${url}`;
}

// Tarixi formatlayır (Məs: "2 saat əvvəl" və ya "12.05.2024")
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'İndi';
    if (minutes < 60) return `${minutes} dəqiqə əvvəl`;
    if (hours < 24) return `${hours} saat əvvəl`;
    if (days < 7) return `${days} gün əvvəl`;
    return date.toLocaleDateString('az-AZ');
}

// ============================================
// 2. AUTHENTICATION & FETCH (ƏSAS HİSSƏ)
// ============================================

// Login olub-olmadığını yoxlayır
function checkAuth() {
    if (isAuthChecking) return false; // Təkrar çağırılmanın qarşısını alır
    
    const token = localStorage.getItem('jwt_token');
    
    if(!token) {
        // Token yoxdursa Login ekranını göstər
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('admin-wrapper').style.display = 'none';
        return false;
    } else {
        // Token varsa Admin panelini aç
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('admin-wrapper').style.display = 'flex';
        return true;
    }
}

// ✅ TƏKMİLLƏŞDİRİLMİŞ FETCH FUNKSİYASI
// Tokeni hər dəfə yaddaşdan oxuyur (köhnə user problemini həll edir)
async function authFetch(url, options = {}) {
    if(!options.headers) options.headers = {};
    
    // FormData deyilsə JSON kimi göndər
    if(!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    
    // Tokeni "o an" oxuyuruq
    const currentToken = localStorage.getItem('jwt_token');
    if (currentToken) {
        options.headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
        const res = await fetch(url, options);

        // İcazə xətası (401/403)
        if(res.status === 401 || res.status === 403) { 
            console.warn(`Auth Xətası: ${res.status} - ${url}`);
            logout(); // Çıxış ver
            return null; // Kodun davam etməsini dayandır
        }

        return res;
    } catch (error) {
        console.error("Fetch Error:", error);
        return null;
    }
}

// LOGIN FORM SUBMIT
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
            // Backend-dən gələn token açarı (token və ya accessToken)
            const token = data.token || data.accessToken;
            
            if(token) {
                localStorage.setItem('jwt_token', token);
                
                await Swal.fire({
                    icon: 'success', 
                    title: 'Xoş Gəldiniz!', 
                    timer: 1500, 
                    showConfirmButton: false
                });

                // ✅ Səhifəni reload etmək əvəzinə, UI-ı dəyişirik
                document.getElementById('login-overlay').style.display = 'none';
                document.getElementById('admin-wrapper').style.display = 'flex';
                
                // Dashboard-a yönləndir və yüklə
                navigateTo('dashboard');
                loadDashboard();
            }
        } else { 
            Swal.fire('Giriş Xətası', 'İstifadəçi adı və ya şifrə yanlışdır', 'error'); 
        }
    } catch(err) { 
        console.error(err);
        Swal.fire('Xəta', 'Serverlə əlaqə qurmaq mümkün olmadı', 'error'); 
    }
});

// LOGOUT
function logout() { 
    localStorage.removeItem('jwt_token');
    
    // UI-ı dəyişirik (reload etmirik)
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('admin-wrapper').style.display = 'none';
    
    // Formu təmizləyirik
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').reset();
    }
}

// ============================================
// 3. NAVIGATION (SƏHİFƏLƏR ARASI KEÇİD)
// ============================================

function navigateTo(page) {
    // Aktiv klasları təmizlə
    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Yeni səhifəni aktiv et
    const pageView = document.getElementById(`view-${page}`);
    const navItem = document.querySelector(`[data-page="${page}"]`);
    
    if (pageView) pageView.classList.add('active');
    if (navItem) navItem.classList.add('active');

    // Müvafiq funksiyanı çağır
    if(page === 'dashboard') loadDashboard();
    if(page === 'works') loadWorks();
    if(page === 'services') loadServices();
    if(page === 'messages') loadMessages();
    if(page === 'about') loadAbout();
}

// Menyu klikləri
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        if (page) navigateTo(page);
    });
});

// ============================================
// 4. DASHBOARD (STATİSTİKA)
// ============================================

async function loadDashboard() {
    try {
        // 1. İşlər (Works) - size=100 edirik ki, statistika düz olsun
        const worksRes = await authFetch(`${API.WORKS}/getAllWorks?size=100`);
        // Null və ya xəta gələrsə boş array götür
        const worksData = (worksRes && worksRes.ok) ? await worksRes.json() : { content: [] };
        const works = worksData.content || [];

        // 2. Xidmətlər (Services)
        const servicesRes = await authFetch(`${API.SERVICES}/getAll`);
        const services = (servicesRes && servicesRes.ok) ? await servicesRes.json() : [];

        // 3. Mesajlar
        let messages = [];
        const messagesRes = await authFetch(`${API.CONTACTS}/allMessages`);
        if (messagesRes && messagesRes.ok) {
            messages = await messagesRes.json();
        }

        // Statistikaları UI-da göstər
        updateStats(works.length, services.length, messages);
        initCharts(works);
        loadActivity(works);

    } catch (error) {
        console.error('Dashboard Load Error:', error);
    }
}

function updateStats(worksCount, servicesCount, messages) {
    // Ümumi saylar
    if(document.getElementById('totalWorks')) document.getElementById('totalWorks').textContent = worksCount;
    if(document.getElementById('totalServices')) document.getElementById('totalServices').textContent = servicesCount;
    
    // Oxunmamış mesajlar
    const unreadCount = Array.isArray(messages) ? messages.filter(m => !(m.isRead || m.read)).length : 0;
    if(document.getElementById('totalMessages')) document.getElementById('totalMessages').textContent = unreadCount;
    
    // Kartlardakı kiçik saylar
    if(document.getElementById('worksCount')) document.getElementById('worksCount').textContent = worksCount;
    if(document.getElementById('servicesCount')) document.getElementById('servicesCount').textContent = servicesCount;
    if(document.getElementById('messagesCount')) document.getElementById('messagesCount').textContent = unreadCount;
}

// Qrafiklər (Chart.js)
function initCharts(works) {
    const worksCtx = document.getElementById('worksChart');
    if (worksCtx) {
        if (worksChart) worksChart.destroy();
        
        const last7Days = [];
        const workCounts = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push(date.toLocaleDateString('az-AZ', { weekday: 'short' }));
            
            // Həmin gün yaradılan işləri say
            const count = works.filter(w => {
                if (!w.createdAt) return false;
                return new Date(w.createdAt).toDateString() === date.toDateString();
            }).length;
            workCounts.push(count);
        }
        
        worksChart = new Chart(worksCtx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Yeni İşlər',
                    data: workCounts,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }
        });
    }

    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        if (categoryChart) categoryChart.destroy();
        const categories = {};
        works.forEach(w => {
            const cat = w.category || 'Digər';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

// Son Aktivliklər
function loadActivity(works) {
    const list = document.getElementById('activityList');
    if (!list) return;
    
    // Ən son yüklənən 5 iş
    const recentWorks = works.sort((a,b) => b.id - a.id).slice(0, 5);
    
    if (recentWorks.length === 0) {
        list.innerHTML = '<div class="activity-item">Hələ aktivlik yoxdur</div>';
        return;
    }

    list.innerHTML = recentWorks.map(w => `
        <div class="activity-item">
            <div class="activity-icon" style="background: #6366f1"><i class="fas fa-film"></i></div>
            <div class="activity-info">
                <div class="activity-title">"${w.title}" işi əlavə edildi</div>
                <div class="activity-time">${formatDate(w.createdAt)}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// 5. WORKS (İŞLƏR) - CRUD
// ============================================

async function loadWorks() {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;

    try {
        // Backend Pageable qaytarır.
        const res = await authFetch(`${API.WORKS}/getAllWorks?size=100&sort=id,desc`);
        
        // JSON parse xətası olmasın deyə yoxlayırıq
        if(!res || !res.ok) {
            grid.innerHTML = `<div class="empty-state"><h3>Məlumat yüklənmədi</h3></div>`;
            return;
        }
        
        const data = await res.json();
        // Page strukturuna görə content götürürük
        const works = data.content || []; 
        
        if (works.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-film"></i><h3>Hələ heç bir iş yoxdur</h3><p>Yeni iş əlavə etmək üçün düyməni sıxın</p></div>`;
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
                    <div class="work-meta">
                        <div class="work-client"><i class="fas fa-user"></i> ${w.clientName || 'Müştəri yoxdur'}</div>
                        <span class="work-category">${w.category}</span>
                    </div>
                    <div class="work-actions">
                        <button class="btn-edit" onclick='editWork(${JSON.stringify(w).replace(/'/g, "&apos;")})'><i class="fas fa-edit"></i> Redaktə</button>
                        <button class="btn-delete" onclick="deleteWork(${w.id})"><i class="fas fa-trash"></i> Sil</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch(e) { 
        console.error('Works Load Error:', e);
        grid.innerHTML = `<div class="empty-state">Xəta baş verdi</div>`;
    }
}

// Modal açmaq (Yaratmaq)
function openWorkModal() {
    document.getElementById('workForm').reset();
    document.getElementById('workId').value = ''; 
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

// Modal açmaq (Redaktə)
function editWork(w) {
    document.getElementById('workId').value = w.id;
    document.getElementById('wTitle').value = w.title;
    document.getElementById('wClient').value = w.clientName || '';
    document.getElementById('wCategory').value = w.category;
    document.getElementById('wVideoUrl').value = w.videoUrl || '';
    document.getElementById('wDescription').value = w.description || '';
    
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

// İşi Yadda Saxla (Create / Update)
async function submitWork() {
    const id = document.getElementById('workId').value;
    const fd = new FormData();
    
    // DTO sahələri
    fd.append('title', document.getElementById('wTitle').value);
    fd.append('clientName', document.getElementById('wClient').value);
    fd.append('category', document.getElementById('wCategory').value);
    fd.append('videoUrl', document.getElementById('wVideoUrl').value);
    fd.append('description', document.getElementById('wDescription').value);
    fd.append('isFeatured', false); 

    // Fayllar
    const img = document.getElementById('wImage').files[0];
    if(img) fd.append('imageFile', img); 
    
    const vid = document.getElementById('wPreview').files[0];
    if(vid) fd.append('previewVideoFile', vid); 

    Swal.fire({title: 'Yüklənir...', didOpen: () => Swal.showLoading()});
    
    try {
        let url, method;
        if (id) {
            // Update: PUT /admin/works/{id}
            url = `${API.WORKS}/${id}`;
            method = 'PUT';
        } else {
            // Create: POST /admin/works/createWork
            url = `${API.WORKS}/createWork`;
            method = 'POST';
        }

        const res = await authFetch(url, { method: method, body: fd });
        
        if(res && res.ok) {
            Swal.fire('Uğurlu!', 'Əməliyyat tamamlandı', 'success');
            bootstrap.Modal.getInstance(document.getElementById('workModal')).hide();
            loadWorks(); 
            loadDashboard(); 
        } else { 
            const errorText = res ? await res.text() : 'Naməlum xəta';
            Swal.fire('Xəta', errorText, 'error'); 
        }
    } catch(e) { 
        Swal.fire('Xəta', e.message, 'error'); 
    }
}

// İşi Sil
async function deleteWork(id) {
    const r = await Swal.fire({
        title: 'Silinsin?', 
        text: "Bu əməliyyat geri qaytarıla bilməz!", 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonText: 'Bəli, Sil', 
        cancelButtonText: 'Ləğv'
    });
    
    if(r.isConfirmed) {
        // Delete: DELETE /admin/works/deleteWork/{id}
        const res = await authFetch(`${API.WORKS}/deleteWork/${id}`, { method: 'DELETE' });
        
        if (res && res.ok) {
            Swal.fire('Silindi', '', 'success');
            loadWorks();
            loadDashboard();
        } else {
            Swal.fire('Xəta', 'Silmək mümkün olmadı', 'error');
        }
    }
}

// Axtarış funksiyası (Client-side)
function searchWorks() {
    const searchTerm = document.getElementById('workSearch').value.toLowerCase();
    document.querySelectorAll('.work-card').forEach(card => {
        const title = card.querySelector('.work-title').textContent.toLowerCase();
        const client = card.querySelector('.work-client').textContent.toLowerCase();
        card.style.display = (title.includes(searchTerm) || client.includes(searchTerm)) ? '' : 'none';
    });
}

// Filtr funksiyası (Client-side)
function filterWorks() {
    const category = document.getElementById('categoryFilter').value;
    document.querySelectorAll('.work-card').forEach(card => {
        const workCategory = card.querySelector('.work-category').textContent;
        card.style.display = (!category || workCategory === category) ? '' : 'none';
    });
}

// ============================================
// 6. SERVICES (XİDMƏTLƏR)
// ============================================

async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    try {
        const res = await authFetch(`${API.SERVICES}/getAll`);
        if(!res || !res.ok) return;

        const services = await res.json();
        
        grid.innerHTML = services.length === 0 ? '<div class="empty-state">Xidmət yoxdur</div>' : '';
        
        services.forEach(s => {
            const hasVideo = s.videoUrl && s.videoUrl.trim();
            grid.innerHTML += `
                <div class="service-card">
                    <div style="width:56px;height:56px;background:rgba(99,102,241,0.1);border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem">
                        <i class="${s.iconClass || 'fas fa-star'}" style="font-size:1.5rem;color:#6366f1"></i>
                    </div>
                    <h3>${s.title}</h3>
                    <p class="text-muted">${(s.description || '').substring(0,100)}...</p>
                    <div style="margin-bottom:1rem">
                        ${hasVideo ? '<span class="badge bg-success-light text-success">Video var</span>' : '<span class="badge bg-secondary-light text-secondary">Video yoxdur</span>'}
                    </div>
                    <div class="service-actions" style="display:flex;gap:10px">
                        <button class="btn btn-sm btn-light text-primary" onclick='editService(${JSON.stringify(s).replace(/'/g,"&apos;")})' style="flex:1">Redaktə</button>
                        <button class="btn btn-sm btn-light text-danger" onclick="deleteService(${s.id})" style="flex:1">Sil</button>
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
        
        if(res && res.ok) {
            Swal.fire('Uğurlu!', 'Xidmət yadda saxlanıldı', 'success');
            bootstrap.Modal.getInstance(document.getElementById('serviceModal')).hide();
            loadServices(); loadDashboard();
        } else { Swal.fire('Xəta', 'Xəta baş verdi', 'error'); }
    } catch(e) { Swal.fire('Xəta', e.message, 'error'); }
}

async function deleteService(id) {
    const r = await Swal.fire({title: 'Silinsin?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sil'});
    if(r.isConfirmed) {
        const res = await authFetch(`${API.SERVICES}/${id}`, { method: 'DELETE' });
        if(res && res.ok) {
            Swal.fire('Silindi!', '', 'success');
            loadServices();
            loadDashboard();
        } else {
             Swal.fire('Xəta', 'Silmək mümkün olmadı', 'error');
        }
    }
}

// ============================================
// 7. MESSAGES (ƏLAQƏ)
// ============================================

async function loadMessages() {
    const list = document.getElementById('messagesList');
    if (!list) return;
    list.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Yüklənir...</div>';
    
    try {
        const res = await authFetch(`${API.CONTACTS}/allMessages`);
        if(!res || !res.ok) {
            list.innerHTML = `<div class="text-center p-4">Yüklənmə Xətası</div>`;
            return;
        }
        
        const messages = await res.json();
        if (!Array.isArray(messages) || messages.length === 0) {
            list.innerHTML = `<div class="text-center p-4 text-muted">Heç bir mesaj yoxdur</div>`;
            return;
        }
        
        messages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        
        list.innerHTML = '';
        messages.forEach(m => {
            const isRead = m.isRead || m.read || false;
            const bgClass = isRead ? 'bg-light' : 'bg-white border-primary';
            
            list.innerHTML += `
                <div class="d-flex align-items-center gap-3 p-3 mb-2 rounded shadow-sm ${bgClass}" style="cursor:pointer; ${!isRead ? 'border-left: 4px solid #6366f1;' : ''}" 
                    onclick="viewMessage(${m.id}, '${(m.name || '').replace(/'/g, "\\'")}', '${(m.email || '').replace(/'/g, "\\'")}', '${(m.message || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}')">
                    
                    <div class="rounded-circle d-flex align-items-center justify-content-center text-white" 
                        style="width:40px;height:40px;background:${isRead ? '#94a3b8' : '#6366f1'}">
                        <i class="fas fa-envelope${isRead ? '-open' : ''}"></i>
                    </div>
                    
                    <div class="flex-grow-1 overflow-hidden">
                        <div class="fw-bold text-dark">${m.name || 'Adsız'}</div>
                        <div class="small text-muted text-truncate">${(m.message || '').substring(0,60)}...</div>
                    </div>
                    
                    <div class="text-end" style="min-width: 80px;">
                        <div class="small text-muted">${formatDate(m.sentAt)}</div>
                        <button class="btn btn-sm text-danger p-0 mt-1" onclick="event.stopPropagation();deleteMessage(${m.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
    } catch(e) { console.error(e); }
}

async function viewMessage(id, name, email, message) {
    await Swal.fire({
        title: `<strong>${name}</strong>`,
        html: `
            <div class="text-start">
                <p class="text-muted mb-2"><i class="fas fa-envelope"></i> ${email}</p>
                <div class="p-3 bg-light rounded">${message}</div>
            </div>
        `,
        confirmButtonText: 'Bağla'
    });
    
    try { 
        await authFetch(`${API.CONTACTS}/${id}/read`, { method: 'PATCH' }); 
        loadMessages(); 
        loadDashboard();
    } catch (e) {}
}

async function deleteMessage(id) {
    const r = await Swal.fire({title: 'Mesaj silinsin?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sil'});
    if(r.isConfirmed) {
        await authFetch(`${API.CONTACTS}/${id}`, { method: 'DELETE' });
        loadMessages();
        loadDashboard();
    }
}

// ============================================
// 8. ABOUT (HAQQIMIZDA)
// ============================================

async function loadAbout() {
    try {
        const res = await fetch(`${API.ABOUT}/getAbout`);
        if(!res.ok) return;
        const data = await res.json();
        
        document.getElementById('aMainTitle').value = data.mainTitle || '';
        document.getElementById('aSubTitle').value = data.subTitle || '';
        document.getElementById('aWho').value = data.whoWeAreText || '';
        document.getElementById('aMission').value = data.ourMissionText || '';
        document.getElementById('aApproach').value = data.ourApproachText || '';
        document.getElementById('aEmail').value = data.email || '';
        document.getElementById('aPhone').value = data.phone || '';
        document.getElementById('aAddress').value = data.address || '';
    } catch(e) { console.error(e); }
}

document.getElementById('saveAboutBtn')?.addEventListener('click', async () => {
    const fd = new FormData();
    fd.append('mainTitle', document.getElementById('aMainTitle').value);
    fd.append('subTitle', document.getElementById('aSubTitle').value);
    fd.append('whoWeAreText', document.getElementById('aWho').value);
    fd.append('ourMissionText', document.getElementById('aMission').value);
    fd.append('ourApproachText', document.getElementById('aApproach').value);
    fd.append('email', document.getElementById('aEmail').value);
    fd.append('phone', document.getElementById('aPhone').value);
    fd.append('address', document.getElementById('aAddress').value);
    
    const video = document.getElementById('aVideoFile').files[0];
    if(video) fd.append('videoFile', video);
    
    Swal.fire({title: 'Yüklənir...', didOpen: () => Swal.showLoading()});
    try {
        const res = await authFetch(`${API.ABOUT}/updateAbout`, { method: 'PUT', body: fd });
        
        if(res && res.ok) {
            Swal.fire('Uğurlu!', 'Məlumatlar yeniləndi', 'success');
            document.getElementById('aVideoFile').value = ''; 
            loadAbout();
        } else { Swal.fire('Xəta', 'Yadda saxlamaq mümkün olmadı', 'error'); }
    } catch(e) { Swal.fire('Xəta', e.message, 'error'); }
});

// ============================================
// 9. BAŞLANĞIC (INIT)
// ============================================

// Dark Mode
const themeCheckbox = document.getElementById('themeCheckbox');
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeCheckbox) themeCheckbox.checked = true;
}
document.getElementById('themeToggleNav')?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

// Auth Yoxla və Başla
window.addEventListener('DOMContentLoaded', () => {
    isAuthChecking = true;
    const isAuthenticated = checkAuth();
    
    if (isAuthenticated) {
        // Login olubsa Dashboard-a yönləndir
        navigateTo('dashboard');
    }
    
    isAuthChecking = false;
});