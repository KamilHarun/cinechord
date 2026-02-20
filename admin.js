// ============================================
// CINECHORD ADMIN PANEL - COMPLETE & FIXED
// ============================================

const BASE_URL = "https://cinechord-admin-production.up.railway.app";
const UPLOADS_URL = `${BASE_URL}/uploads/`;

const API = {
    LOGIN: `${BASE_URL}/api/auth/login`,
    WORKS: `${BASE_URL}/admin/works`,
    SERVICES: `${BASE_URL}/admin/services`,
    CONTACTS: `${BASE_URL}/admin/contact`,
    ABOUT: `${BASE_URL}/admin/about`
};

let worksChart, categoryChart;
let currentPage = 0;
const pageSize = 20;
let searchTimeout;
let selectedItems = [];
let worksDataCache = [];
let servicesDataCache = [];
let teamMembersCache = [];

// ============================================
// UTILS
// ============================================

function getImageUrl(url) {
    if (!url) return 'https://placehold.co/400x225/8b5cf6/ffffff?text=No+Image';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? `${BASE_URL}${url}` : `${UPLOADS_URL}${url}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
}

function checkTokenExpiry() {
    const token = localStorage.getItem('jwt_token');
    if(!token) return;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        if(exp < Date.now()) logout();
    } catch(e) {}
}
setInterval(checkTokenExpiry, 60000);

// ============================================
// AUTH
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
        Swal.fire('Əlaqə Xətası', 'Serverlə əlaqə qurmaq olmur', 'error');
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
// NAVIGATION
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
// DASHBOARD
// ============================================

async function loadDashboard() {
    try {
        const worksRes = await authFetch(`${API.WORKS}/getAllWorks?size=100&t=${Date.now()}`);
        const worksData = worksRes && worksRes.ok ? await worksRes.json() : { content: [] };
        
        const servicesRes = await authFetch(`${API.SERVICES}/getAll?t=${Date.now()}`);
        const services = servicesRes && servicesRes.ok ? await servicesRes.json() : [];

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

        const labels = works.slice(0, 7).map(w => w.title.substring(0, 10));
        const data = works.slice(0, 7).map(() => Math.floor(Math.random() * 10) + 1);

        worksChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    label: 'Yeni İşlər',
                    data: data.length ? data : [0],
                    borderColor: '#8b5cf6',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }]
            },
            options: { 
                responsive: true, 
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(139, 92, 246, 0.1)' } },
                    y: { grid: { color: 'rgba(139, 92, 246, 0.1)' } }
                }
            }
        });
    }
}

// ============================================
// WORKS - R2 DƏSTƏKLİ TAM VERSİYA (OPTIMIZED)
// ============================================

// Sabitlər
const R2_PUBLIC_URL = "https://pub-0ed548450bc549689ffc7fc01f88afae.r2.dev";
let wDataCache = [];
let wCurrentPage = 0;
const wPageSize = 10;
let wSelectedItems = [];
let wSearchTimeout;

// 1. İŞLƏRİ YÜKLƏMƏK VƏ EKRANDA GÖSTƏRMƏK
async function loadWorks(page = 0) {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Yüklənir...</p></div>';

    try {
        const res = await authFetch(`${API.WORKS}/getAllWorks?page=${page}&size=${wPageSize}&sort=id,desc&t=${Date.now()}`);
        if(!res || !res.ok) throw new Error("Yüklənmə xətası");
        
        const data = await res.json();
        const works = data.content || [];
        wCurrentPage = page;
        wDataCache = works;
        
        if (works.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-film"></i><h3>Hələ heç bir iş yoxdur</h3></div>`;
            renderPagination(0, 0);
            return;
        }
        
        grid.innerHTML = '';
        works.forEach(w => {
            const imageSrc = w.thumbnailUrl && w.thumbnailUrl !== 'null' 
                ? w.thumbnailUrl 
                : 'https://placehold.co/600x400/1a1a1a/FFF?text=Video+Yoxdur';
            
            grid.innerHTML += `
                <div class="work-card" data-id="${w.id}">
                    <div class="work-select">
                        <input type="checkbox" class="bulk-checkbox" data-id="${w.id}" onchange="toggleBulkSelect(${w.id})">
                    </div>
                    <div class="work-image-wrapper">
                        <img src="${imageSrc}" class="work-image" alt="" style="object-fit: cover;">
                        ${w.videoUrl ? `<video src="${w.videoUrl}" class="work-preview-video" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>` : ''}
                    </div>
                    <div class="work-body">
                        <h3 class="work-title">${w.title}</h3>
                        <div class="work-meta">
                            <span class="work-category">${w.category}</span>
                            ${w.featured ? '<i class="fas fa-star text-warning" title="Featured"></i>' : ''}
                        </div>
                        <div class="work-actions">
                            <button class="btn-edit" onclick='editWorkById(${w.id})'>
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

// 2. MODAL AÇILMASI
function openWorkModal() {
    const form = document.getElementById('workForm');
    if (form) form.reset();
    document.getElementById('workId').value = '';
    
    const setChecked = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.checked = value;
    };
    
    setChecked('wActive', true);
    setChecked('wShowInGallery', true);
    setChecked('wFeatured', false);
    if(document.getElementById('wSortOrder')) document.getElementById('wSortOrder').value = 0;
    
    const modalEl = document.getElementById('workModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
}

// 3. MƏLUMATLARIN BACKEND-Ə GÖNDƏRİLMƏSİ (R2 İNTEGRASİYALI)
async function submitWork() {
    const getValue = (ids, def = '') => {
        const idList = Array.isArray(ids) ? ids : [ids];
        for (const id of idList) {
            const el = document.getElementById(id);
            if (el && el.value) return el.value;
        }
        return def;
    };
    
    const getChecked = (id, def = false) => {
        const el = document.getElementById(id);
        return el ? el.checked : def;
    };

    const id = getValue('workId');
    const title = getValue('wTitle');
    const category = getValue('wCategory');

    if(!title || !category) {
        Swal.fire('Diqqət', 'Başlıq və Kateqoriya mütləqdir!', 'warning');
        return;
    }

    const videoFileInput = document.getElementById('wVideoFile');
    const hasVideoFile = videoFileInput && videoFileInput.files[0];

    // Yükləmə bildirişini açırıq
    Swal.fire({
        title: 'Hazırlanır...',
        html: '<div id="uploadStatus" style="font-weight:bold; margin-bottom:10px;">Proses başlayır...</div>' +
              '<div class="progress" style="height: 25px;">' +
              '<div id="upProgress" class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%">0%</div>' +
              '</div>',
        allowOutsideClick: false,
        showConfirmButton: false
    });

    try {
        let finalVideoUrl = getValue('wVideoUrl');

        // A) ƏGƏR YENİ VİDEO FAYLI VARSA - BİRBAŞA R2-YƏ YÜKLƏYİRİK
        if (hasVideoFile) {
            const file = videoFileInput.files[0];
            document.getElementById('uploadStatus').innerText = 'Cloudflare R2-yə yüklənir...';

            // 1. Backend-dən bilet (Presigned URL) alırıq
            const urlParams = new URLSearchParams({ fileName: file.name, contentType: file.type });
            const authRes = await fetch(`${BASE_URL}/api/r2/get-upload-url?${urlParams}`, {                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
            });
            
            if (!authRes.ok) throw new Error("Yükləmə icazəsi alınmadı");
            const { uploadUrl, fileKey } = await authRes.json();

            // 2. XMLHttpRequest ilə R2-yə yükləyirik
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        const bar = document.getElementById('upProgress');
                        if(bar) { bar.style.width = percent + '%'; bar.textContent = percent + '%'; }
                    }
                };

                xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error("R2-yə yüklənə bilmədi")));
                xhr.onerror = () => reject(new Error("Şəbəkə xətası"));
                xhr.send(file);
            });
            
            finalVideoUrl = `${R2_PUBLIC_URL}/videos/${fileKey}`;
        }

        // B) MƏLUMATLARIN BAZAYA YAZILMASI
        document.getElementById('uploadStatus').innerText = 'Bazaya qeyd edilir...';
        
        const fd = new FormData();
        fd.append('title', title);
        fd.append('category', category);
        fd.append('clientName', getValue('wClient'));
        fd.append('description', getValue('wDescription'));
        fd.append('location', getValue('wLocation'));
        fd.append('agency', getValue('wAgency'));
        fd.append('productionYear', getValue(['wProductionYear', 'wYear']));
        fd.append('sortOrder', getValue('wSortOrder', '0'));
        fd.append('featured', getChecked('wFeatured'));
        fd.append('active', getChecked('wActive'));
        fd.append('showInGallery', getChecked('wShowInGallery'));
        fd.append('videoUrl', finalVideoUrl);

        const url = id ? `${API.WORKS}/updateWork/${id}` : `${API.WORKS}/createWork`;
        const method = id ? (id ? 'PUT' : 'POST') : 'POST';

        // Fetch API ilə bazaya göndəririk
        const res = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` },
            body: fd
        });

        if (res.ok) {
            Swal.fire('Uğurlu!', 'İş yadda saxlanıldı.', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('workModal'));
            if (modal) modal.hide();
            loadWorks(wCurrentPage);
        } else {
            throw new Error("Server məlumatı qəbul etmədi");
        }

    } catch(e) { 
        console.error(e);
        Swal.fire('Xəta!', e.message || 'Xəta baş verdi', 'error');
    }
}

// 4. DÜZƏLİŞ ETMƏK
function editWorkById(id) {
    const w = wDataCache.find(work => work.id === id);
    if (!w) return;
    
    const setValue = (ids, val) => {
        const idList = Array.isArray(ids) ? ids : [ids];
        for (const i of idList) {
            const el = document.getElementById(i);
            if (el) { el.value = val || ''; break; }
        }
    };
    
    setValue('workId', w.id);
    setValue('wTitle', w.title);
    setValue('wClient', w.clientName);
    setValue('wCategory', w.category);
    setValue('wDescription', w.description);
    setValue('wVideoUrl', w.videoUrl);
    setValue('wLocation', w.location);
    setValue('wAgency', w.agency);
    setValue(['wProductionYear', 'wYear'], w.productionYear);
    setValue('wSortOrder', w.sortOrder || 0);

    const setChecked = (id, val) => { if(document.getElementById(id)) document.getElementById(id).checked = val; };
    setChecked('wFeatured', w.featured);
    setChecked('wActive', w.active);
    setChecked('wShowInGallery', w.showInGallery);
    
    const modalEl = document.getElementById('workModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
}

// 5. SİLMƏK
async function deleteWork(id) {
    const r = await Swal.fire({
        title: 'Silinsin?',
        text: "Bu iş və ona bağlı video bazadan silinəcək.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Bəli, sil!'
    });
    if(r.isConfirmed) {
        const res = await authFetch(`${API.WORKS}/deleteWork/${id}`, { method: 'DELETE' });
        if (res.ok) { loadWorks(wCurrentPage); Swal.fire('Silindi', '', 'success'); }
    }
}

// 6. PAGINATION VƏ DİGƏR KÖMƏKÇİLƏR
function renderPagination(totalPages, current) {
    let html = '';
    for (let i = 0; i < totalPages; i++) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadWorks(${i})">${i + 1}</button>`;
    }
    const pag = document.getElementById('pagination');
    if (pag) pag.innerHTML = html;
}

function toggleBulkSelect(id) {
    const cb = document.querySelector(`.bulk-checkbox[data-id="${id}"]`);
    if (cb && cb.checked) wSelectedItems.push(id);
    else wSelectedItems = wSelectedItems.filter(i => i !== id);
    const bar = document.getElementById('bulkActionsBar');
    if(bar) bar.style.display = wSelectedItems.length > 0 ? 'flex' : 'none';
}

function searchWorks() {
    clearTimeout(wSearchTimeout);
    wSearchTimeout = setTimeout(() => {
        const term = document.getElementById('workSearch')?.value.toLowerCase() || '';
        document.querySelectorAll('.work-card').forEach(card => {
            const title = card.querySelector('.work-title')?.textContent.toLowerCase() || '';
            card.style.display = title.includes(term) ? '' : 'none';
        });
    }, 300);
}

function filterWorks() {
    const cat = document.getElementById('categoryFilter')?.value || '';
    document.querySelectorAll('.work-card').forEach(card => {
        const wCat = card.querySelector('.work-category')?.textContent || '';
        card.style.display = (!cat || wCat === cat) ? '' : 'none';
    });
}
// ============================================
// SERVICES - TƏHLÜKƏSİZ VERSİYA
// ============================================

async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Yüklənir...</p></div>';
    
    try {
        const res = await authFetch(`${API.SERVICES}/getAll?t=${Date.now()}`);
        if(res && res.ok) {
            const services = await res.json();
            servicesDataCache = services;
            
            if(services.length === 0) {
                grid.innerHTML = '<div class="empty-state"><h3>Xidmət yoxdur</h3></div>';
                return;
            }
            grid.innerHTML = services.map(s => `
                <div class="service-card">
                    <div class="service-icon-box">
                        <i class="${s.iconClass || 'fas fa-star'}"></i>
                    </div>
                    <h4>${s.title}</h4>
                    <p>${(s.description||'').substring(0,80)}...</p>
                    <div class="service-actions">
                        <button class="btn-edit" onclick="editServiceById(${s.id})">
                            <i class="fas fa-edit"></i> Redaktə
                        </button>
                        <button class="btn-danger" onclick="deleteService(${s.id})">
                            <i class="fas fa-trash"></i> Sil
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) { 
        console.error("Yükləmə xətası:", e); 
    }
}

function openServiceModal() {
    // Form-u sıfırla
    const form = document.getElementById('serviceForm');
    if (form) form.reset();
    
    const serviceId = document.getElementById('serviceId');
    if (serviceId) serviceId.value = '';
    
    // Modal başlığını yenilə (NULL CHECK ilə!)
    const modalLabel = document.getElementById('serviceModalLabel');
    if (modalLabel) {
        modalLabel.textContent = 'Yeni Xidmət';
    }
    
    // Modal-ı aç
    const modalEl = document.getElementById('serviceModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } else {
        console.error('Service modal element tapılmadı!');
    }
}

function editServiceById(id) {
    const s = servicesDataCache.find(item => item.id === id);
    if (!s) {
        Swal.fire('Xəta', 'Məlumat tapılmadı!', 'error');
        return;
    }

    // Modal başlığını dəyiş
    const modalLabel = document.getElementById('serviceModalLabel');
    if (modalLabel) {
        modalLabel.textContent = 'Xidməti Redaktə Et';
    }

    // Sahələri doldur (NULL CHECK ilə!)
    const fields = {
        'serviceId': s.id,
        'sTitle': s.title,
        'sTitleAz': s.titleAz,
        'sDesc': s.description,
        'sDescAz': s.descriptionAz
    };

    for (const [fieldId, value] of Object.entries(fields)) {
        const el = document.getElementById(fieldId);
        if (el) el.value = value || '';
    }

    const bulletPoints = document.getElementById('sBulletPoints');
    if (bulletPoints) {
        bulletPoints.value = Array.isArray(s.bulletPoints) ? s.bulletPoints.join('\n') : '';
    }

    const bulletPointsAz = document.getElementById('sBulletPointsAz');
    if (bulletPointsAz) {
        bulletPointsAz.value = Array.isArray(s.bulletPointsAz) ? s.bulletPointsAz.join('\n') : '';
    }

    // Modal-ı aç
    const modalEl = document.getElementById('serviceModal');
    if (modalEl) {
        const modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
}

async function submitService() {
    const id = document.getElementById('serviceId')?.value;
    const fd = new FormData();
    
    const title = document.getElementById('sTitle')?.value;
    const titleAz = document.getElementById('sTitleAz')?.value || title;
    const desc = document.getElementById('sDesc')?.value;
    const descAz = document.getElementById('sDescAz')?.value || desc;
    
    if(!title) {
        Swal.fire('Diqqət', 'Başlıq mütləqdir', 'warning');
        return;
    }

    fd.append('title', title);
    fd.append('titleAz', titleAz);
    fd.append('description', desc);
    fd.append('descriptionAz', descAz);
    
    const bulletInput = document.getElementById('sBulletPoints')?.value || '';
    const bulletPoints = bulletInput.split('\n').filter(line => line.trim() !== '');
    bulletPoints.forEach(point => fd.append('bulletPoints', point.trim()));
    
    const bulletInputAz = document.getElementById('sBulletPointsAz')?.value || '';
    const bulletPointsAz = bulletInputAz.split('\n').filter(line => line.trim() !== '');
    bulletPointsAz.forEach(point => fd.append('bulletPointsAz', point.trim()));
    
    const videoFile = document.getElementById('sVideoFile');
    if(videoFile?.files?.[0]) {
        fd.append('videoFile', videoFile.files[0]);
    }

    if(id) fd.append('removeVideo', 'false'); 

    Swal.fire({
        title: 'Yadda saxlanılır...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    
    try {
        const url = id ? `${API.SERVICES}/${id}` : `${API.SERVICES}`;
        const method = id ? 'PUT' : 'POST';

        const res = await authFetch(url, { 
            method: method, 
            body: fd 
        });
        
        if(res && res.ok) {
            Swal.fire('Uğurlu!', id ? 'Xidmət yeniləndi.' : 'Xidmət yaradıldı.', 'success');
            
            const modalEl = document.getElementById('serviceModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if(modalInstance) modalInstance.hide();
            
            loadServices();
            loadDashboard();
        } else {
            const errData = await res.json().catch(() => ({}));
            Swal.fire('Xəta', errData.message || 'Server xətası baş verdi', 'error');
        }
    } catch (e) {
        console.error("Submit error:", e);
        Swal.fire('Xəta', 'Əlaqə kəsildi', 'error');
    }
}

async function deleteService(id) {
    const r = await Swal.fire({
        title: 'Xidmət silinsin?',
        text: 'Bu əməliyyat geri qaytarıla bilməz!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Bəli, sil',
        cancelButtonText: 'Ləğv'
    });
    
    if(r.isConfirmed) {
        try {
            const res = await authFetch(`${API.SERVICES}/${id}`, { method: 'DELETE' });
            
            if(res && res.ok) {
                Swal.fire('Silindi!', 'Xidmət silindi', 'success');
                loadServices();
                loadDashboard();
            } else {
                Swal.fire('Xəta', 'Silinmədi', 'error');
            }
        } catch(e) {
            Swal.fire('Xəta', e.message, 'error');
        }
    }
}

console.log('✅ Services module loaded with null-safety checks');


// ============================================
// MESSAGES
// ============================================

async function loadMessages() {
    const list = document.getElementById('messagesList');
    if (!list) return;
    list.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Yüklənir...</p></div>';
    
    try {
        const res = await authFetch(`${API.CONTACTS}/allMessages?t=${Date.now()}`);
        if(!res || !res.ok) {
            list.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>Yüklənmə Xətası</h3></div>`;
            return;
        }
        
        const messages = await res.json();
        if (!Array.isArray(messages) || messages.length === 0) {
            list.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><h3>Heç bir mesaj yoxdur</h3></div>`;
            return;
        }
        
        messages.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });
        
        list.innerHTML = '';
        messages.forEach(m => {
            if (!m.id) return;
            
            const messageId = m.id;
            const isRead = m.isRead || m.read || false;
            
            const safeName = (m.name || 'Adsız').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeEmail = (m.email || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeMsg = (m.message || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '<br>');
            
            const displayDate = formatDate(m.createdAt || m.sentAt);
            const preview = (m.message || '').substring(0, 50) + ((m.message?.length || 0) > 50 ? '...' : '');
            
            list.innerHTML += `
                <div class="message-item" onclick="viewMessage(${messageId}, '${safeName}', '${safeEmail}', '${safeMsg}')" style="${!isRead ? 'border-left: 3px solid #8b5cf6;' : ''}">
                    <div class="rounded-circle">
                        <i class="fas fa-envelope${isRead ? '-open' : ''}"></i>
                    </div>
                    <div class="message-content">
                        <div class="message-name">${safeName}</div>
                        <div class="message-preview">${preview}</div>
                    </div>
                    <div class="message-meta">
                        <span class="message-date">${displayDate}</span>
                        <span class="message-badge ${m.newsletter ? '' : 'inactive'}">${m.newsletter ? 'Newsletter' : 'No NL'}</span>
                    </div>
                    <button class="message-delete" onclick="event.stopPropagation();deleteMessage(${messageId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
    } catch(e) { 
        console.error('Mesajlar yüklənərkən xəta:', e);
        list.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>Xəta baş verdi</h3></div>';
    }
}

async function viewMessage(id, name, email, message) {
    const cleanMessage = message.replace(/<br>/g, '\n');
    
    await Swal.fire({
        title: name,
        html: `
            <div style="text-align:left;">
                <p style="color:#94a3b8;margin-bottom:1rem;font-size:0.9rem;">
                    <i class="fas fa-envelope" style="margin-right:0.5rem;color:#8b5cf6;"></i>${email}
                </p>
                <div style="background:rgba(139,92,246,0.1);padding:1rem;border-radius:10px;white-space:pre-wrap;max-height:250px;overflow-y:auto;font-size:0.95rem;line-height:1.6;">
                    ${cleanMessage}
                </div>
            </div>
        `,
        confirmButtonText: 'Bağla',
        confirmButtonColor: '#8b5cf6',
        width: '500px'
    });
    
    try { 
        await authFetch(`${API.CONTACTS}/${id}/read`, { method: 'PATCH' }); 
        loadMessages(); 
        loadDashboard();
    } catch (e) {
        console.error('Mesaj oxundu kimi qeyd edilərkən xəta:', e);
    }
}

async function deleteMessage(id) {
    if (!id || id <= 0) return;

    const r = await Swal.fire({
        title: 'Mesaj silinsin?',
        text: "Bu əməliyyat geri qaytarıla bilməz!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Bəli, sil!',
        cancelButtonText: 'Ləğv et'
    });
    
    if(r.isConfirmed) {
        try {
            const res = await authFetch(`${API.CONTACTS}/${id}`, { method: 'DELETE' }); 
            if(res && res.ok) {
                Swal.fire('Silindi!', 'Mesaj uğurla silindi.', 'success');
                loadMessages();
                loadDashboard();
            } else {
                Swal.fire('Xəta', 'Mesaj silinmədi.', 'error');
            }
        } catch(e) {
            Swal.fire('Xəta', 'Şəbəkə xətası baş verdi.', 'error');
        }
    }
}

/* ============================================================
   CINECHORD ADMIN - ABOUT SECTION (FULL & R2 INTEGRATED)
   ============================================================ */

// 1. SABİTLƏR VƏ GLOBAL DƏYİŞƏNLƏR
if (typeof R2_PUBLIC_URL === 'undefined') {
    window.R2_PUBLIC_URL = "https://pub-0ed548450bc549689ffc7fc01f88afae.r2.dev";
}

if (typeof teamMembersCache === 'undefined') {
    window.teamMembersCache = [];
}
/**
 * URL-ləri emal edən köməkçi funksiya.
 * Həm R2 linklərini, həm də köhnə lokal bazadakı faylları tanıyır.
 */
function getImageUrl(url) {
    if (!url || url === 'null') return 'https://via.placeholder.com/600x400/1a1a1a/FFF?text=Media+Yoxdur';
    if (url.startsWith('http')) return url; 
    return `${CONFIG.BACKEND_URL}/uploads/${url}`; 
}

/**
 * 2. MƏLUMATLARIN YÜKLƏNMƏSİ
 */
async function loadAbout() {
    try {
        console.log('About məlumatları yüklənir...');
        const res = await authFetch(`${API.ABOUT}/getAbout?lang=en&t=${Date.now()}`);
        
        if(!res || !res.ok) {
            console.error("Backend-dən data gəlmədi");
            return;
        }
        
        const data = await res.json();
        
        // Form elementlərini DTO sahələrinə görə doldururuq
        const fields = {
            'aMainTitle': data.mainTitle,
            'aMainTitleAz': data.mainTitleAz,
            'aSubTitle': data.subTitle,
            'aSubTitleAz': data.subTitleAz,
            'aWhyTitle': data.whyTitle,
            'aWhyTitleAz': data.whyTitleAz,
            'aWhyDesc': data.whyDescription,
            'aWhyDescAz': data.whyDescriptionAz,
            'who-we-are': data.whoWeAreText,
            'our-mission': data.ourMissionText,
            'our-approach': data.ourApproachText,
            'aEmail': data.email,
            'aPhone': data.phone,
            'aAddress': data.address,
            'aAddressAz': data.addressAz
        };

        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = value || '';
                } else {
                    el.textContent = value || '';
                }
            }
        }

        loadWhyMediaPreview(data); 
        loadTeamMembers();

    } catch(error) {
        console.error('About Yükləmə Xətası:', error);
    }
}

/**
 * 3. ƏSAS MƏLUMATLARI YADDA SAXLA (R2 VİDEO YÜKLƏMƏ İLƏ)
 */
async function submitAbout() {
    const mediaFileInput = document.getElementById('aWhyMediaFile');
    const hasMediaFile = mediaFileInput && mediaFileInput.files[0];

    Swal.fire({
        title: 'Məlumatlar hazırlanır...',
        html: '<div id="uploadStatus" style="font-weight:bold; margin-bottom:10px;">Proses başlayır...</div>' +
              '<div class="progress" style="height: 25px;">' +
              '<div id="upProgress" class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%">0%</div>' +
              '</div>',
        allowOutsideClick: false,
        showConfirmButton: false
    });

    try {
        let finalMediaUrl = ""; 
        let mediaType = "image";

        // A) R2-YƏ YÜKLƏMƏ (Əgər yeni fayl seçilibsə)
        if (hasMediaFile) {
            const file = mediaFileInput.files[0];
            document.getElementById('uploadStatus').innerText = 'Media R2-yə yüklənir...';

            const ext = file.name.split('.').pop().toLowerCase();
            mediaType = ['mp4', 'mov', 'webm'].includes(ext) ? 'video' : 'image';

            // 1. Presigned URL almaq
            const urlParams = new URLSearchParams({ 
                fileName: `about/${Date.now()}_${file.name}`, 
                contentType: file.type 
            });
            
            const authRes = await fetch(`${BASE_URL}/api/r2/get-upload-url?${urlParams}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
            });
            
            if (!authRes.ok) throw new Error("R2 icazəsi alınmadı");
            const { uploadUrl, fileKey } = await authRes.json();

            // 2. Birbaşa Cloudflare-ə yükləmə
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        const bar = document.getElementById('upProgress');
                        if(bar) { bar.style.width = percent + '%'; bar.textContent = percent + '%'; }
                    }
                };

                xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error("R2-yə yükləmə xətası")));
                xhr.onerror = () => reject(new Error("Şəbəkə xətası"));
                xhr.send(file);
            });
            
            finalMediaUrl = `${R2_PUBLIC_URL}/videos/${fileKey}`;        }

        // B) MƏLUMATLARI BAZADA YENİLƏ
        document.getElementById('uploadStatus').innerText = 'Bazaya qeyd edilir...';
        
        const fd = new FormData();
        const aboutData = {
            mainTitle: document.getElementById('aMainTitle')?.value || '',
            mainTitleAz: document.getElementById('aMainTitleAz')?.value || '',
            subTitle: document.getElementById('aSubTitle')?.value || '',
            subTitleAz: document.getElementById('aSubTitleAz')?.value || '',
            whyTitle: document.getElementById('aWhyTitle')?.value || '',
            whyTitleAz: document.getElementById('aWhyTitleAz')?.value || '',
            whyDescription: document.getElementById('aWhyDesc')?.value || '',
            whyDescriptionAz: document.getElementById('aWhyDescAz')?.value || '',
            whoWeAreText: document.getElementById('who-we-are')?.value || '',
            ourMissionText: document.getElementById('our-mission')?.value || '',
            ourApproachText: document.getElementById('our-approach')?.value || '',
            whyMediaUrl: finalMediaUrl, 
            whyMediaType: mediaType,
             email: document.getElementById('aEmail')?.value || '',
    phone: document.getElementById('aPhone')?.value || '',
    address: document.getElementById('aAddress')?.value || '',
    addressAz: document.getElementById('aAddressAz')?.value || ''
        };

        Object.keys(aboutData).forEach(key => fd.append(key, aboutData[key]));

        const res = await authFetch(`${API.ABOUT}/updateAbout`, { method: 'PUT', body: fd });
        
        if (res && res.ok) {
            Swal.fire('Uğurlu!', 'Məlumatlar yeniləndi', 'success');
            loadAbout();
        } else {
            throw new Error("Backend xətası");
        }
    } catch(e) {
        console.error('Submit Error:', e);
        Swal.fire('Xəta', e.message, 'error');
    }
}

/**
 * 4. MEDIA PREVIEW (Frontend görüntüsü üçün)
 */
function loadWhyMediaPreview(data) {
    const previewDiv = document.getElementById('whyMediaPreview');
    if (!previewDiv) return;

    const mediaUrl = data.whyMediaUrl;
    const mediaType = data.whyMediaType;

    if (!mediaUrl || mediaUrl === 'null') {
        previewDiv.innerHTML = '<span class="text-muted italic">Media yoxdur</span>';
        return;
    }

    const fullUrl = getImageUrl(mediaUrl);
    
    if (mediaType === 'video' || fullUrl.toLowerCase().match(/\.(mp4|webm|mov)$/)) {
        previewDiv.innerHTML = `
            <video width="100%" height="220" controls style="border-radius:8px; background:#000; object-fit:cover;">
                <source src="${fullUrl}">
            </video>
        `;
    } else {
        previewDiv.innerHTML = `<img src="${fullUrl}" style="max-height:220px; border-radius:8px; width:auto; border:1px solid #333;" alt="Media">`;
    }
}

/**
 * 5. KOMANDA ÜZVLƏRİNİN İDARƏ OLUNMASI (CRUD)
 */
async function loadTeamMembers() {
    const list = document.getElementById('teamMembersGrid');
    if (!list) return;

    list.innerHTML = '<div class="col-12 text-center py-4"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

    try {
        const res = await authFetch(`${API.ABOUT}/team?lang=en&t=${Date.now()}`);
        if (!res || !res.ok) {
            list.innerHTML = '<div class="col-12 text-center text-muted">Məlumat tapılmadı.</div>';
            return;
        }
        
        const members = await res.json();
        teamMembersCache = members; 
        
        if (members.length === 0) {
            list.innerHTML = '<div class="col-12 text-center text-muted">Komanda üzvü yoxdur.</div>';
            return;
        }
        
        list.innerHTML = members.map(m => `
            <div class="col-md-4 mb-3">
                <div class="card bg-dark border-secondary h-100 shadow-sm">
                    <img src="${getImageUrl(m.imageUrl)}" 
                         class="card-img-top" 
                         style="height:200px; object-fit:cover; object-position:top;" 
                         alt="${m.name}"
                         onerror="this.src='https://via.placeholder.com/300x400?text=No+Photo'">
                    <div class="card-body p-3 text-center">
                        <h6 class="text-white mb-1">${m.name}</h6>
                        <p class="text-info mb-2 small">${m.role}</p>
                        <div class="btn-group w-100 mt-2">
                            <button class="btn btn-sm btn-outline-warning" onclick="editTeamMember(${m.id})">
                                <i class="fas fa-edit"></i> Redaktə
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteTeamMember(${m.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (e) { 
        console.error("Team loading error:", e);
        list.innerHTML = '<div class="col-12 text-center text-danger">Məlumat yüklənərkən xəta baş verdi.</div>';
    }
}

function openTeamModal() {
    const form = document.getElementById('teamForm');
    if(form) form.reset();
    document.getElementById('teamId').value = '';
    document.querySelector('#teamModal .modal-title').textContent = 'Yeni Komanda Üzvü';
    new bootstrap.Modal(document.getElementById('teamModal')).show();
}

function editTeamMember(id) {
    const member = teamMembersCache.find(m => m.id === id);
    if (!member) return;

    document.querySelector('#teamModal .modal-title').textContent = 'Üzvü Redaktə Et';
    document.getElementById('teamId').value = member.id;
    document.getElementById('tName').value = member.name || '';
    document.getElementById('tNameAz').value = member.nameAz || '';
    document.getElementById('tRole').value = member.role || '';
    document.getElementById('tRoleAz').value = member.roleAz || '';
    document.getElementById('tBio').value = member.bio || '';
    document.getElementById('tBioAz').value = member.bioAz || '';
    document.getElementById('tOrder').value = member.displayOrder || 0;

    new bootstrap.Modal(document.getElementById('teamModal')).show();
}

async function submitTeamMember() {
    const teamId = document.getElementById('teamId')?.value;
    const fd = new FormData();
    
    const name = document.getElementById('tName')?.value;
    const role = document.getElementById('tRole')?.value;

    if (!name || !role) { 
        Swal.fire('Xəbərdarlıq', 'Ad və Vəzifə sahələri boş qala bilməz', 'warning'); 
        return; 
    }

    fd.append('name', name);
    fd.append('nameAz', document.getElementById('tNameAz')?.value || name);
    fd.append('role', role);
    fd.append('roleAz', document.getElementById('tRoleAz')?.value || role);
    fd.append('bio', document.getElementById('tBio')?.value || '');
    fd.append('bioAz', document.getElementById('tBioAz')?.value || '');
    fd.append('displayOrder', document.getElementById('tOrder')?.value || 0);
    
    const img = document.getElementById('tImage')?.files[0];
    if (img) fd.append('imageFile', img);

    Swal.fire({ title: 'Yadda saxlanılır...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const url = teamId ? `${API.ABOUT}/team/${teamId}` : `${API.ABOUT}/team`;
        const method = teamId ? 'PUT' : 'POST';

        const res = await authFetch(url, { method: method, body: fd });
        
        if (res && res.ok) {
            Swal.fire('Uğurlu!', 'Əməliyyat tamamlandı', 'success');
            const modalEl = document.getElementById('teamModal');
            bootstrap.Modal.getInstance(modalEl).hide();
            loadTeamMembers();
        } else {
            Swal.fire('Xəta', 'Məlumat yadda saxlanılmadı', 'error');
        }
    } catch (e) { 
        Swal.fire('Xəta', 'Bağlantı xətası baş verdi', 'error'); 
    }
}

async function deleteTeamMember(id) {
    const conf = await Swal.fire({
        title: 'Əminsiniz?',
        text: "Bu komanda üzvü sistemdən silinəcək.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Bəli, sil!'
    });

    if (conf.isConfirmed) {
        try {
            const res = await authFetch(`${API.ABOUT}/team/${id}`, { method: 'DELETE' });
            if (res && res.ok) { 
                loadTeamMembers(); 
                Swal.fire('Silindi!', 'Komanda üzvü silindi.', 'success');
            }
        } catch (e) {
            Swal.fire('Xəta', 'Silinmə zamanı xəta baş verdi', 'error');
        }
    }
}
// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Hash-ə görə səhifəni aç (məs: index.html#works)
    const hash = location.hash.replace('#', '');
    if (hash) navigateTo(hash);
});