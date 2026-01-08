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
// WORKS - TAM FUNKSİYAL
// ============================================

async function loadWorks(page = 0) {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Yüklənir...</p></div>';

    try {
        const res = await authFetch(`${API.WORKS}/getAllWorks?page=${page}&size=${pageSize}&sort=id,desc&t=${Date.now()}`);
        
        if(!res || !res.ok) throw new Error("Yüklənmə xətası");
        
        const data = await res.json();
        const works = data.content || [];
        currentPage = page;
        
        worksDataCache = works;
        
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
                    <div class="work-image-wrapper">
                        <img src="${getImageUrl(w.imagePath || w.imageUrl || w.thumbnailUrl)}" class="work-image" alt="${w.title}">
                    </div>
                    <div class="work-body">
                        <h3 class="work-title">${w.title}</h3>
                        <div class="work-meta">
                            <span class="work-category">${w.category}</span>
                            ${w.isFeatured || w.featured ? '<i class="fas fa-star text-warning" title="Featured"></i>' : ''}
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

function renderPagination(totalPages, current) {
    let html = '';
    for (let i = 0; i < totalPages; i++) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadWorks(${i})">${i + 1}</button>`;
    }
    const pag = document.getElementById('pagination');
    if (pag) pag.innerHTML = html;
}

function openWorkModal() {
    const form = document.getElementById('workForm');
    if (form) form.reset();
    
    const workId = document.getElementById('workId');
    if (workId) workId.value = '';
    
    // Default dəyərlər
    const setChecked = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.checked = value;
    };
    
    setChecked('wActive', true);
    setChecked('wShowInGallery', true);
    setChecked('wFeatured', false);
    
    const sortOrder = document.getElementById('wSortOrder');
    if (sortOrder) sortOrder.value = 0;
    
    // Preview təmizlə
    ['videoFilePreview', 'previewFilePreview', 'thumbnailPreview'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    
    const modalEl = document.getElementById('workModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
}

function editWorkById(id) {
    const w = worksDataCache.find(work => work.id === id);
    if (!w) {
        Swal.fire('Xəta', 'Məlumat tapılmadı!', 'error');
        return;
    }
    
    // Helper - həm köhnə həm yeni ID-lərlə işləyir
    const setValue = (ids, value) => {
        const idList = Array.isArray(ids) ? ids : [ids];
        for (const id of idList) {
            const el = document.getElementById(id);
            if (el) {
                el.value = value || '';
                break;
            }
        }
    };
    
    const setChecked = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.checked = value || false;
    };
    
    const form = document.getElementById('workForm');
    if (form) form.reset();

    // ƏSAS MƏLUMATLAR
    setValue('workId', w.id);
    setValue('wTitle', w.title);
    setValue('wSlug', w.slug);
    setValue('wClient', w.clientName);
    setValue('wCategory', w.category);
    setValue('wDescription', w.description);
    
    // MEDIA
    setValue('wVideoUrl', w.videoUrl);
    setValue('wPreviewVideoUrl', w.previewVideoUrl);
    setValue('wThumbnailUrl', w.thumbnailUrl);
    
    // ARCHIVE DETALLAR
    setValue('wLocation', w.location);
    setValue('wAgency', w.agency);
    setValue(['wProductionYear', 'wYear'], w.productionYear); // Həm wProductionYear həm wYear
    
    // PARAMETRLƏR
    setValue('wSortOrder', w.sortOrder || 0);
    setChecked('wFeatured', w.featured || w.isFeatured);
    setChecked('wActive', w.active !== false);
    setChecked('wShowInGallery', w.showInGallery !== false);
    
    const modalEl = document.getElementById('workModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
}

async function submitWork() {
    // Helper funksiyalar - NULL-SAFE
    const getValue = (ids, defaultValue = '') => {
        const idList = Array.isArray(ids) ? ids : [ids];
        for (const id of idList) {
            const el = document.getElementById(id);
            if (el && el.value) return el.value;
        }
        return defaultValue;
    };
    
    const getChecked = (id, defaultValue = false) => {
        const el = document.getElementById(id);
        return el ? el.checked : defaultValue;
    };
    
    const getFile = (id) => {
        const el = document.getElementById(id);
        return el && el.files && el.files[0] ? el.files[0] : null;
    };

    const id = getValue('workId');
    const fd = new FormData();
    
    // ƏSAS MƏLUMATLAR (REQUIRED)
    const title = getValue('wTitle');
    const category = getValue('wCategory');

    if(!title || !category) {
        Swal.fire('Diqqət', 'Başlıq və Kateqoriya mütləqdir!', 'warning');
        return;
    }

    fd.append('title', title);
    fd.append('category', category);
    
    // OPTIONAL FIELDS
    fd.append('clientName', getValue('wClient'));
    fd.append('slug', getValue('wSlug'));
    fd.append('description', getValue('wDescription'));
    
    // ARCHIVE DETALLAR
    fd.append('agency', getValue('wAgency'));
    fd.append('location', getValue('wLocation'));
    fd.append('productionYear', getValue(['wProductionYear', 'wYear'])); // Həm köhnə həm yeni ID
    
    // PARAMETRLƏR
    fd.append('sortOrder', getValue('wSortOrder', '0'));
    fd.append('featured', getChecked('wFeatured', false));
    fd.append('active', getChecked('wActive', true));
    fd.append('showInGallery', getChecked('wShowInGallery', true));
    
    // 🔥 ANA VIDEO FAYLI
    const videoFile = getFile('wVideoFile');
    if (videoFile) {
        fd.append('videoFile', videoFile);
        console.log('✅ Ana video:', videoFile.name, '-', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');
    }
    
    // VIDEO URL
    const videoUrl = getValue('wVideoUrl');
    if (videoUrl) {
        fd.append('videoUrl', videoUrl);
        console.log('✅ Video URL:', videoUrl);
    }
    
    // 🔥 PREVIEW VIDEO FAYLI
    const previewFile = getFile('wPreview');
    if (previewFile) {
        fd.append('previewVideoFile', previewFile);
        console.log('✅ Preview video:', previewFile.name);
    }
    
    // PREVIEW VIDEO URL
    const previewVideoUrl = getValue('wPreviewVideoUrl');
    if (previewVideoUrl) {
        fd.append('previewVideoUrl', previewVideoUrl);
    }
    
    // 🔥 THUMBNAIL FAYLI
    const thumbnailFile = getFile('wImage');
    if (thumbnailFile) {
        fd.append('imageFile', thumbnailFile);
        console.log('✅ Thumbnail:', thumbnailFile.name);
    }
    
    // THUMBNAIL URL
    const thumbnailUrl = getValue('wThumbnailUrl');
    if (thumbnailUrl) {
        fd.append('thumbnailUrl', thumbnailUrl);
    }

    // VERİFİKASİYA: Ən azı video və ya URL
    if (!videoFile && !videoUrl) {
        Swal.fire({
            icon: 'warning',
            title: 'Video Yoxdur',
            text: 'Ən azı Ana Video faylı VƏ YA Video URL daxil edin!',
            confirmButtonText: 'Başa düşdüm'
        });
        return;
    }

    Swal.fire({
        title: 'Yüklənir...',
        html: '<div class="spinner-border text-primary" role="status"></div><p class="mt-3">Video yüklənir...</p>',
        allowOutsideClick: false,
        showConfirmButton: false
    });
    
    try {
        let url = id ? `${API.WORKS}/updateWork/${id}` : `${API.WORKS}/createWork`;
        let method = id ? 'PUT' : 'POST';

        const xhr = new XMLHttpRequest();
        const token = localStorage.getItem('jwt_token');
        
        xhr.open(method, url);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                const loadedMB = (e.loaded / 1024 / 1024).toFixed(2);
                const totalMB = (e.total / 1024 / 1024).toFixed(2);
                
                Swal.update({
                    html: `
                        <div style="padding: 20px;">
                            <div class="progress" style="height: 30px;">
                                <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                                     style="width: ${percent}%; font-size: 16px; line-height: 30px;">
                                    ${percent}%
                                </div>
                            </div>
                            <p class="mt-3 mb-0">${loadedMB} MB / ${totalMB} MB</p>
                            <small class="text-muted">Böyük fayllarda bir neçə dəqiqə çəkə bilər</small>
                        </div>
                    `
                });
            }
        });

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                Swal.fire({
                    icon: 'success',
                    title: 'Uğurlu!',
                    text: id ? 'İş yeniləndi!' : 'Yeni iş əlavə edildi!',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                const modalEl = document.getElementById('workModal');
                if (modalEl) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }
                
                if (typeof loadWorks === 'function') loadWorks(currentPage || 0);
                if (typeof loadDashboard === 'function') loadDashboard();
            } else {
                let errorMsg = 'Server xətası';
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    errorMsg = errorData.message || errorData.error || errorMsg;
                } catch (e) {}
                
                Swal.fire({
                    icon: 'error',
                    title: 'Xəta!',
                    text: `${errorMsg} (HTTP ${xhr.status})`,
                    footer: 'Backend loglarını yoxlayın'
                });
            }
        };

        xhr.onerror = () => {
            Swal.fire({
                icon: 'error',
                title: 'Şəbəkə Xətası!',
                text: 'İnternet bağlantısını yoxlayın'
            });
        };
        
        xhr.ontimeout = () => {
            Swal.fire({
                icon: 'error',
                title: 'Timeout!',
                text: 'Video çox böyükdür və ya internet zəifdir'
            });
        };
        
        xhr.timeout = 300000; // 5 dəqiqə
        xhr.send(fd);

    } catch(e) { 
        console.error('Submit error:', e);
        Swal.fire({
            icon: 'error',
            title: 'JavaScript Xətası!',
            text: e.message || 'Bilinməyən xəta'
        });
    }
}

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
            const res = await authFetch(`${API.WORKS}/deleteWork/${id}`, { method: 'DELETE' });
            if (res && res.ok) {
                Swal.fire('Silindi', '', 'success');
                loadWorks(currentPage);
                if (typeof loadDashboard === 'function') loadDashboard();
            } else {
                Swal.fire('Xəta', 'Silmək mümkün olmadı.', 'error');
            }
        } catch (e) {
            Swal.fire('Xəta', 'Sistem xətası', 'error');
        }
    }
}

function toggleBulkSelect(id) {
    const checkbox = document.querySelector(`.bulk-checkbox[data-id="${id}"]`);
    if (checkbox && checkbox.checked) {
        selectedItems.push(id);
    } else {
        selectedItems = selectedItems.filter(item => item !== id);
    }
    
    const bar = document.getElementById('bulkActionsBar');
    if(bar) {
        bar.style.display = selectedItems.length > 0 ? 'flex' : 'none';
        const count = bar.querySelector('.bulk-count');
        if (count) count.textContent = `${selectedItems.length} iş seçildi`;
    }
}

function clearBulkSelection() {
    selectedItems = [];
    document.querySelectorAll('.bulk-checkbox').forEach(cb => cb.checked = false);
    const bar = document.getElementById('bulkActionsBar');
    if (bar) bar.style.display = 'none';
}

function searchWorks() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
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

console.log('🚀 WORKS MODULE - VİDEO YÜKLƏMƏ İLƏ YÜKLƏNDI!');
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
   CINECHORD ADMIN - ABOUT SECTION (FIXED & SECURE)
   ============================================================ */

/**
 * 1. MƏLUMATLARIN YÜKLƏNMƏSİ
 * Backend-dən gələn datanı HTML sahələrinə doldurur.
 */
async function loadAbout() {
    try {
        console.log('About məlumatları yüklənir...');
        // Cache probleminin qarşısını almaq üçün timestamp istifadə edirik
        const res = await authFetch(`${API.ABOUT}/getAbout?lang=en&t=${Date.now()}`);
        
        if(!res || !res.ok) {
            console.error("Backend-dən About datası gəlmədi");
            return;
        }
        
        const data = await res.json();
        console.log('Serverdən gələn data:', data);
        
        // HTML ID-ləri ilə Backend Response DTO sahələrini eşləşdiririk
        const fields = {
            'aMainTitle': data.mainTitle,
            'aMainTitleAz': data.mainTitleAz,
            'aSubTitle': data.subTitle,
            'aSubTitleAz': data.subTitleAz,
            'aWhyTitle': data.whyTitle,
            'aWhyTitleAz': data.whyTitleAz,
            'aWhyDesc': data.whyDescription,
            'aWhyDescAz': data.whyDescriptionAz,
            // Hidden sahələr (əgər HTML-də id-ləri varsa)
            'who-we-are': data.whoWeAreText,
            'our-mission': data.ourMissionText,
            'our-approach': data.ourApproachText,
            'address': data.address,
            'email-link': data.email,
            'phone-link': data.phone
        };

        // Sahələri tək-tək doldururuq (əgər element mövcuddursa)
        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) {
                // Əgər sahə input və ya textarea-dırsa .value, deyilsə .textContent istifadə et
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = value || '';
                } else {
                    el.textContent = value || '';
                }
            }
        }

        // Media önizləməni yükləyirik
        loadWhyMediaPreview(data); 
        
        // Komanda üzvlərini yükləyirik
        loadTeamMembers();

    } catch(error) {
        console.error('About Yükləmə Xətası:', error);
    }
}

/**
 * 2. MƏLUMATLARI YADDA SAXLA
 * Yazıların "itməməsi" üçün bütün sahələri AboutRequestDto-ya uyğun göndərir.
 */
async function submitAbout() {
    const fd = new FormData();
    
    // Backend-dəki AboutRequestDto field adları ilə tam eyni olmalıdır
    const aboutData = {
        mainTitle: document.getElementById('aMainTitle')?.value || '',
        mainTitleAz: document.getElementById('aMainTitleAz')?.value || '',
        subTitle: document.getElementById('aSubTitle')?.value || '',
        subTitleAz: document.getElementById('aSubTitleAz')?.value || '',
        
        // Bu hissə Why CineChord bölməsindəki yazıları bazaya göndərir
        whyTitle: document.getElementById('aWhyTitle')?.value || '',
        whyTitleAz: document.getElementById('aWhyTitleAz')?.value || '',
        whyDescription: document.getElementById('aWhyDesc')?.value || '',
        whyDescriptionAz: document.getElementById('aWhyDescAz')?.value || '',

        // Digər vacib field-lər (boş getməməsi üçün default dəyərlər)
        whoWeAreText: document.getElementById('who-we-are')?.value || '',
        whoWeAreTextAz: '',
        ourMissionText: document.getElementById('our-mission')?.value || '',
        ourMissionTextAz: '',
        ourApproachText: document.getElementById('our-approach')?.value || '',
        ourApproachTextAz: '',
        address: 'Baku, Azerbaijan',
        addressAz: 'Bakı, Azərbaycan',
        email: 'info@cinechord.az',
        phone: '+994 50 233 04 54'
    };

    // Bütün datanı FormData-ya əlavə edirik
    Object.keys(aboutData).forEach(key => {
        fd.append(key, aboutData[key]);
    });

    Swal.fire({ 
        title: 'Məlumatlar yadda saxlanılır...', 
        text: 'Zəhmət olmasa gözləyin',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading() 
    });

    try {
        const res = await authFetch(`${API.ABOUT}/updateAbout`, { 
            method: 'PUT', // Backend @PutMapping gözləyir
            body: fd 
        });
        
        if (res && res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Uğurlu!',
                text: 'Məlumatlar bazada uğurla yeniləndi',
                timer: 2000
            });
            // Yadda saxladıqdan sonra datanı yenidən yükləyirik ki, hər şeyin qaydasında olduğunu görək
            setTimeout(loadAbout, 500);
        } else {
            const errData = await res.json().catch(() => ({}));
            Swal.fire('Xəta', errData.message || 'Məlumatları saxlamaq mümkün olmadı', 'error');
        }
    } catch(e) {
        console.error('Submit About Error:', e);
        Swal.fire('Xəta', 'Bağlantı xətası baş verdi', 'error');
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