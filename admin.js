// ============================================
// CINECHORD ADMIN PANEL - TAM VƏ YENİLƏNMİŞ JS
// ============================================

// ✅ URL TƏNZİMLƏMƏLƏRİ
// 1. Lokalda işləyərkən bunu açıq saxlayın:
const BASE_URL = "http://localhost:8080"; 

// 2. Serverə (Railway) yükləyəndə yuxarıdakını şərhə alıb, bunu açın:
// const BASE_URL = "https://cinechord-admin-production.up.railway.app";

const UPLOADS_URL = `${BASE_URL}/uploads/`;

// ✅ API Endpoints
const API = {
    LOGIN: `${BASE_URL}/api/auth/login`,
    WORKS: `${BASE_URL}/admin/works`,
    SERVICES: `${BASE_URL}/admin/services`,
    CONTACTS: `${BASE_URL}/admin/contacts`,
    ABOUT: `${BASE_URL}/api/about`
};

// Qlobal Dəyişənlər
let worksChart, categoryChart;
let currentPage = 0;
const pageSize = 20;
let searchTimeout;
let selectedItems = [];

// ============================================
// 1. KÖMƏKÇİ FUNKSİYALAR (UTILS)
// ============================================

function getImageUrl(url) {
    // Etibarlı placeholder servisi
    if (!url) return 'https://placehold.co/400x225/6366f1/ffffff?text=No+Image';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? `${BASE_URL}${url}` : `${UPLOADS_URL}${url}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
}

// Token müddətini yoxla
function checkTokenExpiry() {
    const token = localStorage.getItem('jwt_token');
    if(!token) return;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        if(exp < Date.now()) {
            console.warn("Token vaxtı bitdi");
            logout();
        }
    } catch(e) { console.warn('Token parse error:', e); }
}
setInterval(checkTokenExpiry, 60000); // Hər dəqiqə yoxla

// ============================================
// 2. AUTHENTICATION & FETCH
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

async function authFetch(url, options = {}) {
    if(!options.headers) options.headers = {};
    if(!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    
    const token = localStorage.getItem('jwt_token');
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(url, options);
        if(res.status === 401 || res.status === 403) { 
            logout();
            return null;
        }
        return res;
    } catch (error) {
        console.error("Fetch Error:", error);
        Swal.fire('Əlaqə Xətası', 'Serverlə əlaqə qurmaq olmur', 'error');
        return null;
    }
}

// LOGIN
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
                localStorage.setItem('jwt_token', token);
                location.reload(); 
            }
        } else { 
            Swal.fire('Giriş Xətası', 'İstifadəçi adı və ya şifrə yanlışdır', 'error'); 
        }
    } catch(err) { 
        Swal.fire('Xəta', 'Server cavab vermir', 'error'); 
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
    
    const view = document.getElementById(`view-${page}`);
    const navItem = document.querySelector(`[data-page="${page}"]`);
    
    if (view) view.classList.add('active');
    if (navItem) navItem.classList.add('active');

    if(page === 'dashboard') loadDashboard();
    if(page === 'works') loadWorks();
    if(page === 'services') loadServices();
    if(page === 'messages') loadMessages();
    if(page === 'about') loadAbout();
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const page = item.getAttribute('data-page');
        if (page) {
            e.preventDefault();
            navigateTo(page);
        }
    });
});

// ============================================
// 4. DASHBOARD
// ============================================

async function loadDashboard() {
    try {
        // İşlər
        const worksRes = await authFetch(`${API.WORKS}/getAllWorks?size=100&t=${Date.now()}`);
        const worksData = worksRes && worksRes.ok ? await worksRes.json() : { content: [] };
        
        // Xidmətlər
        const servicesRes = await authFetch(`${API.SERVICES}/getAll?t=${Date.now()}`);
        const services = servicesRes && servicesRes.ok ? await servicesRes.json() : [];

        // Mesajlar
        const messagesRes = await authFetch(`${API.CONTACTS}/allMessages?t=${Date.now()}`);
        const messages = messagesRes && messagesRes.ok ? await messagesRes.json() : [];

        updateStats(worksData.content?.length || 0, services.length, messages);
        initCharts(worksData.content || []);

    } catch (error) {
        console.error('Dashboard Error:', error);
    }
}

function updateStats(worksCount, servicesCount, messages) {
    const unreadCount = Array.isArray(messages) ? messages.filter(m => !m.isRead).length : 0;
    
    document.getElementById('totalWorks').textContent = worksCount;
    document.getElementById('totalServices').textContent = servicesCount;
    document.getElementById('totalMessages').textContent = unreadCount;
    
    document.getElementById('worksCount').textContent = worksCount;
    document.getElementById('servicesCount').textContent = servicesCount;
    document.getElementById('messagesCount').textContent = unreadCount;
}

function initCharts(works) {
    const ctx = document.getElementById('worksChart');
    if (ctx) {
        if (worksChart) worksChart.destroy();
        
        // Sadə qrafik nümunəsi
        const labels = works.slice(0, 7).map(w => w.title.substring(0, 10));
        const data = works.slice(0, 7).map(() => Math.floor(Math.random() * 10) + 1);

        worksChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    label: 'Yeni İşlər',
                    data: data.length ? data : [0],
                    borderColor: '#6366f1',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }
}

// ============================================
// 5. WORKS (PORTFOLIO)
// ============================================

async function loadWorks(page = 0) {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Yüklənir...</p></div>';

    try {
        // Cache busting üçün timestamp əlavə etdik
        const res = await authFetch(`${API.WORKS}/getAllWorks?page=${page}&size=${pageSize}&sort=id,desc&t=${Date.now()}`);
        
        if(!res || !res.ok) throw new Error("Yüklənmə xətası");
        
        const data = await res.json();
        const works = data.content || [];
        currentPage = page;
        
        if (works.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-film"></i><h3>Hələ heç bir iş yoxdur</h3></div>`;
            renderPagination(0, 0);
            return;
        }
        
        grid.innerHTML = '';
        works.forEach(w => {
            grid.innerHTML += `
                <div class="work-card">
                    <div class="work-select">
                        <input type="checkbox" class="bulk-checkbox" data-id="${w.id}" onchange="toggleBulkSelect(${w.id})">
                    </div>
                    <img src="${getImageUrl(w.imagePath || w.imageUrl)}" class="work-image" alt="${w.title}">
                    <div class="work-body">
                        <h3 class="work-title">${w.title}</h3>
                        <div class="work-meta">
                            <span class="work-category">${w.category}</span>
                            ${w.isFeatured ? '<i class="fas fa-star text-warning" title="Featured"></i>' : ''}
                        </div>
                        <div class="work-actions">
                            <button class="btn-edit" onclick='editWork(${JSON.stringify(w).replace(/'/g, "&apos;")})'>
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="deleteWork(${w.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        renderPagination(data.totalPages || 1, page);

    } catch(e) { 
        console.error(e);
        grid.innerHTML = `<div class="empty-state">Xəta baş verdi</div>`;
    }
}

function renderPagination(totalPages, current) {
    let html = '<div class="pagination">';
    for (let i = 0; i < totalPages; i++) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadWorks(${i})">${i + 1}</button>`;
    }
    html += '</div>';
    document.getElementById('pagination').innerHTML = html;
}

// --- DELETE WORK (FIXED) ---
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
        try {
            // URL Strukturu: /admin/works/deleteWork/{id}
            const res = await authFetch(`${API.WORKS}/deleteWork/${id}`, { method: 'DELETE' });
            
            if (res && res.ok) {
                Swal.fire('Silindi', '', 'success');
                loadWorks(currentPage);
                loadDashboard();
            } else {
                Swal.fire('Xəta', 'Silmək mümkün olmadı. Server xətası.', 'error');
            }
        } catch (e) {
            Swal.fire('Xəta', 'Sistem xətası', 'error');
        }
    }
}

// --- MODAL & FORM ---
function openWorkModal() {
    document.getElementById('workForm').reset();
    document.getElementById('workId').value = ''; 
    document.getElementById('imagePreviewContainer')?.remove();
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

function editWork(w) {
    document.getElementById('workForm').reset();
    document.getElementById('imagePreviewContainer')?.remove();

    // Dəyərləri doldur
    document.getElementById('workId').value = w.id;
    document.getElementById('wTitle').value = w.title;
    document.getElementById('wClient').value = w.clientName || '';
    document.getElementById('wCategory').value = w.category;
    
    // Yeni Sahələr
    document.getElementById('wSlug').value = w.slug || '';
    document.getElementById('wAgency').value = w.agency || '';
    document.getElementById('wLocation').value = w.location || '';
    document.getElementById('wYear').value = w.productionYear || '';
    document.getElementById('wFeatured').checked = w.isFeatured || false;

    document.getElementById('wVideoUrl').value = w.videoUrl || '';
    document.getElementById('wDescription').value = w.description || '';
    
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

// --- SUBMIT WORK (BÜTÜN SAHƏLƏR) ---
async function submitWork() {
    const id = document.getElementById('workId').value;
    const fd = new FormData();
    
    const title = document.getElementById('wTitle').value;
    const category = document.getElementById('wCategory').value;

    if(!title || !category) {
        Swal.fire('Diqqət', 'Başlıq və Kateqoriya mütləqdir!', 'warning');
        return;
    }

    // Əsas DTO Sahələri
    fd.append('title', title);
    fd.append('category', category);
    fd.append('clientName', document.getElementById('wClient').value);
    fd.append('slug', document.getElementById('wSlug').value);
    fd.append('agency', document.getElementById('wAgency').value);
    fd.append('location', document.getElementById('wLocation').value);
    fd.append('productionYear', document.getElementById('wYear').value);
    fd.append('isFeatured', document.getElementById('wFeatured').checked);
    fd.append('videoUrl', document.getElementById('wVideoUrl').value);
    fd.append('description', document.getElementById('wDescription').value);

    // Fayllar
    const img = document.getElementById('wImage').files[0];
    if(img) fd.append('imageFile', img); 
    
    const vid = document.getElementById('wPreview').files[0];
    if(vid) fd.append('previewVideoFile', vid); 

    // Progress Bar UI
    Swal.fire({
        title: 'Yüklənir...',
        html: '<div class="upload-progress"><div class="progress-bar" id="uploadProgressBar" style="width: 0%"></div></div>',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    
    try {
        let url = id ? `${API.WORKS}/${id}` : `${API.WORKS}/createWork`;
        let method = id ? 'PUT' : 'POST';

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                const pb = document.getElementById('uploadProgressBar');
                if(pb) pb.style.width = percent + '%';
            }
        });

        const token = localStorage.getItem('jwt_token');
        xhr.open(method, url);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                Swal.fire('Uğurlu!', 'Əməliyyat tamamlandı', 'success');
                bootstrap.Modal.getInstance(document.getElementById('workModal')).hide();
                loadWorks(currentPage); 
                loadDashboard();
            } else {
                Swal.fire('Xəta', `Server xətası: ${xhr.status}`, 'error');
            }
        };

        xhr.onerror = () => Swal.fire('Xəta', 'Şəbəkə xətası', 'error');
        xhr.send(fd);

    } catch(e) { Swal.fire('Xəta', e.message, 'error'); }
}

// Bulk & Search Functions
function toggleBulkSelect(id) {
    const checkbox = document.querySelector(`.bulk-checkbox[data-id="${id}"]`);
    if (checkbox.checked) selectedItems.push(id);
    else selectedItems = selectedItems.filter(item => item !== id);
    
    const bar = document.getElementById('bulkActionsBar');
    if(bar) {
        if(selectedItems.length > 0) {
            bar.style.display = 'flex';
            bar.querySelector('.bulk-count').textContent = `${selectedItems.length} iş seçildi`;
        } else {
            bar.style.display = 'none';
        }
    }
}

function clearBulkSelection() {
    selectedItems = [];
    document.querySelectorAll('.bulk-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('bulkActionsBar').style.display = 'none';
}

function searchWorks() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const term = document.getElementById('workSearch').value.toLowerCase();
        document.querySelectorAll('.work-card').forEach(card => {
            const title = card.querySelector('.work-title').textContent.toLowerCase();
            card.style.display = title.includes(term) ? '' : 'none';
        });
    }, 300);
}

function filterWorks() {
    const cat = document.getElementById('categoryFilter').value;
    document.querySelectorAll('.work-card').forEach(card => {
        const wCat = card.querySelector('.work-category').textContent;
        card.style.display = (!cat || wCat === cat) ? '' : 'none';
    });
}

// ============================================
// 6. SERVICES (XİDMƏTLƏR)
// ============================================

async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="text-center p-5"><i class="fas fa-spinner fa-spin"></i> Yüklənir...</div>';
    
    try {
        const res = await authFetch(`${API.SERVICES}/getAll?t=${Date.now()}`);
        if(res && res.ok) {
            const services = await res.json();
            if(services.length === 0) {
                grid.innerHTML = '<div class="empty-state">Xidmət yoxdur</div>';
                return;
            }
            grid.innerHTML = services.map(s => `
                <div class="service-card">
                    <div style="margin-bottom:15px; width:50px; height:50px; background:rgba(99,102,241,0.1); border-radius:12px; display:flex; align-items:center; justify-content:center;">
                        <i class="${s.iconClass || 'fas fa-star'} fa-lg text-primary"></i>
                    </div>
                    <h4>${s.title}</h4>
                    <p class="text-muted small">${(s.description||'').substring(0,100)}...</p>
                    <button class="btn btn-sm btn-light text-danger mt-2" onclick='deleteService(${s.id})'>
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<div class="empty-state">Xidmətlər yüklənmədi</div>';
        }
    } catch(e) { console.error(e); }
}

function openServiceModal() {
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
    new bootstrap.Modal(document.getElementById('serviceModal')).show();
}

async function submitService() {
    const fd = new FormData();
    fd.append('title', document.getElementById('sTitle').value);
    fd.append('iconClass', document.getElementById('sIcon').value);
    fd.append('description', document.getElementById('sDesc').value);
    
    const video = document.getElementById('sVideoFile').files[0];
    if(video) fd.append('videoFile', video);
    
    Swal.fire({title: 'Yüklənir...', didOpen: () => Swal.showLoading()});
    
    const res = await authFetch(API.SERVICES, { method: 'POST', body: fd });
    if(res && res.ok) {
        Swal.fire('Uğurlu', 'Xidmət əlavə edildi', 'success');
        bootstrap.Modal.getInstance(document.getElementById('serviceModal')).hide();
        loadServices();
    } else {
        Swal.fire('Xəta', 'Xidmət əlavə edilmədi', 'error');
    }
}

async function deleteService(id) {
    if(confirm('Silinsin?')) {
        await authFetch(`${API.SERVICES}/${id}`, { method: 'DELETE' });
        loadServices();
        loadDashboard();
    }
}

// ============================================
// 7. MESSAGES (MESAJLAR)
// ============================================

async function loadMessages() {
    const list = document.getElementById('messagesList');
    if (!list) return;
    list.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Yüklənir...</div>';
    
    try {
        const res = await authFetch(`${API.CONTACTS}/allMessages?t=${Date.now()}`);
        if(!res || !res.ok) {
            list.innerHTML = `<div class="text-center p-4 text-danger">Yüklənmə Xətası</div>`;
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
            const safeName = (m.name || '').replace(/'/g, "\\'"); 
            const safeEmail = (m.email || '').replace(/'/g, "\\'");
            const safeMsg = (m.message || '').replace(/'/g, "\\'").replace(/\n/g, ' ');

            list.innerHTML += `
                <div class="d-flex align-items-center gap-3 p-3 mb-2 rounded shadow-sm bg-white border" 
                     style="cursor:pointer; border-left: 4px solid ${isRead ? '#cbd5e1' : '#6366f1'} !important;" 
                     onclick="viewMessage(${m.id}, '${safeName}', '${safeEmail}', '${safeMsg}')">
                    
                    <div class="rounded-circle d-flex align-items-center justify-content-center text-white" 
                        style="width:40px;height:40px;background:${isRead ? '#94a3b8' : '#6366f1'}">
                        <i class="fas fa-envelope${isRead ? '-open' : ''}"></i>
                    </div>
                    
                    <div class="flex-grow-1 overflow-hidden">
                        <div class="d-flex justify-content-between">
                            <span class="fw-bold text-dark">${m.name || 'Adsız'}</span>
                            <small class="text-muted">${formatDate(m.sentAt)}</small>
                        </div>
                        <div class="small text-muted text-truncate">${(m.message || '').substring(0,60)}...</div>
                    </div>
                    
                    <button class="btn btn-sm text-danger" onclick="event.stopPropagation();deleteMessage(${m.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
    } catch(e) { list.innerHTML = 'Xəta'; }
}

async function viewMessage(id, name, email, message) {
    await Swal.fire({
        title: `<strong>${name}</strong>`,
        html: `<div class="text-start"><p class="text-muted"><i class="fas fa-envelope"></i> ${email}</p><div class="p-3 bg-light rounded border">${message}</div></div>`,
        confirmButtonText: 'Bağla'
    });
    
    try { 
        await authFetch(`${API.CONTACTS}/${id}/read`, { method: 'PATCH' }); 
        loadMessages(); 
        loadDashboard();
    } catch (e) {}
}

async function deleteMessage(id) {
    const r = await Swal.fire({title: 'Silinsin?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sil'});
    if(r.isConfirmed) {
        // Backend strukturuna görə buranı dəyişin. Adətən: deleteMessage/{id}
        const res = await authFetch(`${API.CONTACTS}/deleteMessage/${id}`, { method: 'DELETE' });
        if(res && res.ok) {
            loadMessages();
            loadDashboard();
            Swal.fire('Silindi', '', 'success');
        } else {
            Swal.fire('Xəta', 'Silinmədi', 'error');
        }
    }
}

// ============================================
// 8. ABOUT (HAQQIMIZDA)
// ============================================

async function loadAbout() {
    try {
        const res = await authFetch(`${API.ABOUT}/getAbout?t=${Date.now()}`);
        if(!res || !res.ok) return;
        
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
            loadAbout();
        } else { Swal.fire('Xəta', 'Yadda saxlamaq olmadı', 'error'); }
    } catch(e) { Swal.fire('Xəta', e.message, 'error'); }
});

// ============================================
// 9. INIT (BAŞLANĞIC)
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

// App Start
checkAuth();