// ============================================
// CINECHORD ADMIN PANEL - COMPLETE & FIXED
// ============================================

const BASE_URL = "https://cinechord-admin-production.up.railway.app";
const UPLOADS_URL = `${BASE_URL}/uploads/`;
const R2_PUBLIC_URL = "https://pub-0ed548450bc549689ffc7fc01f88afae.r2.dev";

const API = {
    LOGIN: `${BASE_URL}/api/auth/login`,
    WORKS: `${BASE_URL}/admin/works`,
    SERVICES: `${BASE_URL}/admin/services`,
    CONTACTS: `${BASE_URL}/admin/contact`,
    ABOUT: `${BASE_URL}/admin/about`,
    BACKSTAGE: `${BASE_URL}/admin/backstage-item`
};

const VALID_PAGES = ['dashboard', 'works', 'backstage', 'services', 'messages', 'about'];

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
    if (!url || url === 'null') return 'https://placehold.co/400x225/8b5cf6/ffffff?text=No+Image';
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
    if (!token) return;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        if (exp < Date.now()) logout();
    } catch (e) {}
}
setInterval(checkTokenExpiry, 60000);

// Köhnə (mövcud) presigned-URL endpoint-i ilə R2-yə yükləmə (works, services, about üçün)
// Uğurlu olarsa fileKey qaytarır
async function r2LegacyUpload(fileName, file, onProgress) {
    const urlParams = new URLSearchParams({ fileName, contentType: file.type });

    const authRes = await fetch(`${BASE_URL}/api/r2/get-upload-url?${urlParams}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
    });
    if (!authRes.ok) throw new Error('Yükləmə icazəsi alınmadı');

    const { uploadUrl, fileKey } = await authRes.json();

    await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300)
            ? resolve()
            : reject(new Error(`R2-yə yüklənə bilmədi (${xhr.status})`));
        xhr.onerror = () => reject(new Error('Şəbəkə xətası'));
        xhr.send(file);
    });

    return fileKey;
}

// ============================================
// AUTH
// ============================================

function checkAuth() {
    checkTokenExpiry();   // vaxtı bitmişsə dərhal logout() edir

    const token = localStorage.getItem('jwt_token');
    if (!token) {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('admin-wrapper').style.display = 'none';
        return;
    }

    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('admin-wrapper').style.display = 'flex';
}

async function authFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('jwt_token');
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(url, options);
        if (res.status === 401 || res.status === 403) {
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            const token = data.token || data.accessToken;
            if (token) {
                localStorage.setItem('jwt_token', token);
                location.reload();
            }
        } else {
            Swal.fire('Giriş Xətası', 'İstifadəçi adı və ya şifrə yanlışdır', 'error');
        }
    } catch (err) {
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
    if (!VALID_PAGES.includes(page)) page = 'dashboard';

    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const view = document.getElementById(`view-${page}`);
    const navItem = document.querySelector(`[data-page="${page}"]`);

    if (view) view.classList.add('active');
    if (navItem) navItem.classList.add('active');

    // Səhifə yenilənəndə eyni bölmədə qalmaq üçün
    history.replaceState(null, '', '#' + page);

    if (page === 'dashboard') loadDashboard();
    if (page === 'works') loadWorks();
    if (page === 'backstage') loadBackstage();
    if (page === 'services') loadServices();
    if (page === 'messages') loadMessages();
    if (page === 'about') loadAbout();
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

        // Sidebar-dakı Backstage sayı
        try {
            const bsRes = await authFetch(`${API.BACKSTAGE}?t=${Date.now()}`);
            if (bsRes && bsRes.ok) {
                const bsItems = await bsRes.json();
                const badge = document.getElementById('backstageCount');
                if (badge && Array.isArray(bsItems)) badge.textContent = bsItems.length;
            }
        } catch (e) {
            console.warn('Backstage sayı alınmadı:', e);
        }

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
// WORKS - R2 DƏSTƏKLİ
// ============================================

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
        if (!res || !res.ok) throw new Error("Yüklənmə xətası");

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

    } catch (e) {
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
    if (document.getElementById('wSortOrder')) document.getElementById('wSortOrder').value = 0;

    const modalEl = document.getElementById('workModal');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// 3. YADDA SAXLA
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

    if (!title || !category) {
        Swal.fire('Diqqət', 'Başlıq və Kateqoriya mütləqdir!', 'warning');
        return;
    }

    const videoFileInput = document.getElementById('wVideoFile');
    const hasVideoFile = videoFileInput && videoFileInput.files[0];

    Swal.fire({
        title: 'Hazırlanır...',
        html: '<div id="uploadStatus" style="font-weight:bold; margin-bottom:10px;">Proses başlayır...</div>' +
              '<div class="progress" style="height: 25px;">' +
              '<div id="upProgress" class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%">0%</div>' +
              '</div>',
        allowOutsideClick: false,
        showConfirmButton: false
    });

    const setProgress = (percent) => {
        const bar = document.getElementById('upProgress');
        if (bar) { bar.style.width = percent + '%'; bar.textContent = percent + '%'; }
    };

    try {
        let finalVideoUrl = getValue('wVideoUrl');

        // A) YENİ VİDEO FAYLI VARSA: BİRBAŞA R2-YƏ
        if (hasVideoFile) {
            const file = videoFileInput.files[0];
            document.getElementById('uploadStatus').innerText = 'Cloudflare R2-yə yüklənir...';

            const fileKey = await r2LegacyUpload(`videos/${file.name}`, file, setProgress);
            finalVideoUrl = `${R2_PUBLIC_URL}/${fileKey}`;
        }

        // B) HOVER ŞƏKLİ
        const hoverImageInput = document.getElementById('wHoverImage');
        let finalHoverImageUrl = getValue('wHoverImageUrl');

        if (hoverImageInput && hoverImageInput.files[0]) {
            const file = hoverImageInput.files[0];
            document.getElementById('uploadStatus').innerText = 'Hover şəkli R2-yə yüklənir...';
            setProgress(0);

            const fileKey = await r2LegacyUpload(`hover/${Date.now()}_${file.name}`, file, setProgress);
            finalHoverImageUrl = `${R2_PUBLIC_URL}/${fileKey}`;
        }

        // C) BAZAYA YAZ
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
        fd.append('hoverImageUrl', finalHoverImageUrl || '');

        const url = id ? `${API.WORKS}/updateWork/${id}` : `${API.WORKS}/createWork`;

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

    } catch (e) {
        console.error(e);
        Swal.fire('Xəta!', e.message || 'Xəta baş verdi', 'error');
    }
}

// 4. DÜZƏLİŞ ETMƏK
function editWorkById(id) {
    const w = wDataCache.find(work => work.id === id);
    if (!w) return;

    ['wVideoFile', 'wPreview', 'wImage', 'wHoverImage'].forEach(fid => {
        const el = document.getElementById(fid);
        if (el) el.value = '';
    });

    const videoFilePrev = document.getElementById('videoFilePreview');
    if (videoFilePrev) videoFilePrev.textContent = '';
    const previewFilePrev = document.getElementById('previewFilePreview');
    if (previewFilePrev) previewFilePrev.textContent = '';
    const thumbPrev = document.getElementById('thumbnailPreview');
    if (thumbPrev) thumbPrev.innerHTML = '';
    const hoverPrev = document.getElementById('hoverImagePreview');
    if (hoverPrev) hoverPrev.innerHTML = '';

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
    setValue('wHoverImageUrl', w.hoverImageUrl);

    const setChecked = (cid, val) => { if (document.getElementById(cid)) document.getElementById(cid).checked = val; };
    setChecked('wFeatured', w.featured);
    setChecked('wActive', w.active);
    setChecked('wShowInGallery', w.showInGallery);

    if (hoverPrev && w.hoverImageUrl) {
        hoverPrev.innerHTML = `<img src="${w.hoverImageUrl}" style="max-height:100px; border-radius:6px; border:1px solid #444;" alt="Hover">`;
    }

    const modalEl = document.getElementById('workModal');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
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
    if (r.isConfirmed) {
        const res = await authFetch(`${API.WORKS}/deleteWork/${id}`, { method: 'DELETE' });
        if (res && res.ok) { loadWorks(wCurrentPage); Swal.fire('Silindi', '', 'success'); }
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
    if (bar) {
        bar.style.display = wSelectedItems.length > 0 ? 'flex' : 'none';
        const count = bar.querySelector('.bulk-count');
        if (count) count.textContent = `${wSelectedItems.length} seçildi`;
    }
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
// SERVICES
// ============================================

async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Yüklənir...</p></div>';

    try {
        const res = await authFetch(`${API.SERVICES}/getAll?t=${Date.now()}`);
        if (res && res.ok) {
            const services = await res.json();
            servicesDataCache = services;

            if (services.length === 0) {
                grid.innerHTML = '<div class="empty-state"><h3>Xidmət yoxdur</h3></div>';
                return;
            }
            grid.innerHTML = services.map(s => `
                <div class="service-card">
                    <div class="service-icon-box">
                        <i class="${s.iconClass || 'fas fa-star'}"></i>
                    </div>
                    <h4>${s.title}</h4>
                    <p>${(s.description || '').substring(0, 80)}...</p>
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
    } catch (e) {
        console.error("Yükləmə xətası:", e);
    }
}

function openServiceModal() {
    const form = document.getElementById('serviceForm');
    if (form) form.reset();

    const serviceId = document.getElementById('serviceId');
    if (serviceId) serviceId.value = '';

    const modalLabel = document.getElementById('serviceModalLabel');
    if (modalLabel) modalLabel.textContent = 'Yeni Xidmət';

    const modalEl = document.getElementById('serviceModal');
    if (modalEl) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
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

    const modalLabel = document.getElementById('serviceModalLabel');
    if (modalLabel) modalLabel.textContent = 'Xidməti Redaktə Et';

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

    const modalEl = document.getElementById('serviceModal');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

async function submitService() {
    const id = document.getElementById('serviceId')?.value;

    const title = document.getElementById('sTitle')?.value;
    const titleAz = document.getElementById('sTitleAz')?.value || title;
    const desc = document.getElementById('sDesc')?.value;
    const descAz = document.getElementById('sDescAz')?.value || desc;

    if (!title) {
        Swal.fire('Diqqət', 'Başlıq mütləqdir', 'warning');
        return;
    }

    Swal.fire({
        title: 'Yadda saxlanılır...',
        html: `
            <div id="serviceUploadStatus" style="font-weight:bold; margin-bottom:10px;">Proses başlayır...</div>
            <div class="progress" style="height:25px;">
                <div id="serviceUpProgress" class="progress-bar progress-bar-striped progress-bar-animated" style="width:0%">0%</div>
            </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false
    });

    try {
        // 1. FORM MƏLUMATLARI
        const fd = new FormData();
        fd.append('title', title);
        fd.append('titleAz', titleAz);
        fd.append('description', desc || '');
        fd.append('descriptionAz', descAz || '');

        (document.getElementById('sBulletPoints')?.value || '')
            .split('\n')
            .filter(line => line.trim() !== '')
            .forEach(point => fd.append('bulletPoints', point.trim()));

        (document.getElementById('sBulletPointsAz')?.value || '')
            .split('\n')
            .filter(line => line.trim() !== '')
            .forEach(point => fd.append('bulletPointsAz', point.trim()));

        // 2. MÖVCUD VIDEO URL
        let finalVideoUrl = '';
        if (id) {
            const existingService = servicesDataCache.find(s => String(s.id) === String(id));
            finalVideoUrl = existingService?.videoUrl || '';
        }

        // 3. YENİ VİDEO VARSA → R2
        const videoFile = document.getElementById('sVideoFile');
        if (videoFile?.files?.[0]) {
            const file = videoFile.files[0];
            const statusEl = document.getElementById('serviceUploadStatus');
            if (statusEl) statusEl.innerText = 'Cloudflare R2-yə yüklənir...';

            const fileKey = await r2LegacyUpload(`services/${Date.now()}_${file.name}`, file, (percent) => {
                const s = document.getElementById('serviceUploadStatus');
                const bar = document.getElementById('serviceUpProgress');
                if (s) s.innerText = `R2-yə yüklənir... ${percent}%`;
                if (bar) { bar.style.width = percent + '%'; bar.textContent = percent + '%'; }
            });

            finalVideoUrl = `${R2_PUBLIC_URL}/${fileKey}`;
        }

        fd.append('videoUrl', finalVideoUrl);
        if (id) fd.append('removeVideo', 'false');

        // 4. BACKEND-Ə YALNIZ URL GÖNDƏR
        const statusEl2 = document.getElementById('serviceUploadStatus');
        if (statusEl2) statusEl2.innerText = 'Bazaya qeyd edilir...';

        const url = id ? `${API.SERVICES}/${id}` : `${API.SERVICES}`;
        const res = await authFetch(url, { method: id ? 'PUT' : 'POST', body: fd });

        if (res && res.ok) {
            Swal.fire('Uğurlu!', id ? 'Xidmət yeniləndi.' : 'Xidmət yaradıldı.', 'success');

            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
            if (modalInstance) modalInstance.hide();

            loadServices();
            loadDashboard();
        } else {
            const errData = res ? await res.json().catch(() => ({})) : {};
            throw new Error(errData.message || 'Server xətası baş verdi');
        }

    } catch (e) {
        console.error('Service submit error:', e);
        Swal.fire('Xəta', e.message || 'Xəta baş verdi', 'error');
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

    if (r.isConfirmed) {
        try {
            const res = await authFetch(`${API.SERVICES}/${id}`, { method: 'DELETE' });

            if (res && res.ok) {
                Swal.fire('Silindi!', 'Xidmət silindi', 'success');
                loadServices();
                loadDashboard();
            } else {
                Swal.fire('Xəta', 'Silinmədi', 'error');
            }
        } catch (e) {
            Swal.fire('Xəta', e.message, 'error');
        }
    }
}

// ============================================
// MESSAGES
// ============================================

async function loadMessages() {
    const list = document.getElementById('messagesList');
    if (!list) return;
    list.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Yüklənir...</p></div>';

    try {
        const res = await authFetch(`${API.CONTACTS}/allMessages?t=${Date.now()}`);
        if (!res || !res.ok) {
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
    } catch (e) {
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

    if (r.isConfirmed) {
        try {
            const res = await authFetch(`${API.CONTACTS}/${id}`, { method: 'DELETE' });
            if (res && res.ok) {
                Swal.fire('Silindi!', 'Mesaj uğurla silindi.', 'success');
                loadMessages();
                loadDashboard();
            } else {
                Swal.fire('Xəta', 'Mesaj silinmədi.', 'error');
            }
        } catch (e) {
            Swal.fire('Xəta', 'Şəbəkə xətası baş verdi.', 'error');
        }
    }
}

// ============================================
// ABOUT SECTION
// ============================================

async function loadAbout() {
    try {
        const res = await authFetch(`${API.ABOUT}/getAbout?lang=en&t=${Date.now()}`);

        if (!res || !res.ok) {
            console.error("Backend-dən data gəlmədi");
            return;
        }

        const data = await res.json();

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

    } catch (error) {
        console.error('About Yükləmə Xətası:', error);
    }
}

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

        if (hasMediaFile) {
            const file = mediaFileInput.files[0];
            document.getElementById('uploadStatus').innerText = 'Media R2-yə yüklənir...';

            const ext = file.name.split('.').pop().toLowerCase();
            mediaType = ['mp4', 'mov', 'webm'].includes(ext) ? 'video' : 'image';

            const fileKey = await r2LegacyUpload(`about/${Date.now()}_${file.name}`, file, (percent) => {
                const bar = document.getElementById('upProgress');
                if (bar) { bar.style.width = percent + '%'; bar.textContent = percent + '%'; }
            });

            finalMediaUrl = `${R2_PUBLIC_URL}/${fileKey}`;
        }

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
    } catch (e) {
        console.error('Submit Error:', e);
        Swal.fire('Xəta', e.message, 'error');
    }
}

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

// ---------- Komanda üzvləri ----------

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
    if (form) form.reset();
    document.getElementById('teamId').value = '';
    document.querySelector('#teamModal .modal-title').textContent = 'Yeni Komanda Üzvü';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('teamModal')).show();
}

function editTeamMember(id) {
    const member = teamMembersCache.find(m => Number(m.id) === Number(id));
    if (!member) return;

    const modalEl = document.getElementById('teamModal');
    if (!modalEl) return;

    const titleEl = modalEl.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = 'Üzvü Redaktə Et';

    const teamId = document.getElementById('teamId');
    const name = document.getElementById('tName');
    const nameAz = document.getElementById('tNameAz');
    const role = document.getElementById('tRole');
    const roleAz = document.getElementById('tRoleAz');
    const bio = document.getElementById('tBio');
    const bioAz = document.getElementById('tBioAz');
    const order = document.getElementById('tOrder');

    if (teamId) teamId.value = member.id;
    if (name) name.value = member.name || '';
    if (nameAz) nameAz.value = member.nameAz || '';
    if (role) role.value = member.role || '';
    if (roleAz) roleAz.value = member.roleAz || '';
    if (bio) bio.value = member.bio || '';
    if (bioAz) bioAz.value = member.bioAz || '';
    if (order) order.value = member.displayOrder ?? 0;

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

async function submitTeamMember() {
    const teamId = document.getElementById('teamId')?.value || '';
    const fd = new FormData();

    const name = document.getElementById('tName')?.value?.trim() || '';
    const role = document.getElementById('tRole')?.value?.trim() || '';

    if (!name || !role) {
        Swal.fire('Xəbərdarlıq', 'Ad və Vəzifə sahələri boş qala bilməz', 'warning');
        return;
    }

    fd.append('name', name);
    fd.append('nameAz', document.getElementById('tNameAz')?.value?.trim() || name);
    fd.append('role', role);
    fd.append('roleAz', document.getElementById('tRoleAz')?.value?.trim() || role);
    fd.append('bio', document.getElementById('tBio')?.value?.trim() || '');
    fd.append('bioAz', document.getElementById('tBioAz')?.value?.trim() || '');
    fd.append('displayOrder', document.getElementById('tOrder')?.value || '0');

    const img = document.getElementById('tImage')?.files[0];
    if (img) fd.append('imageFile', img);

    Swal.fire({
        title: 'Yadda saxlanılır...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const url = teamId ? `${API.ABOUT}/team/${teamId}` : `${API.ABOUT}/team`;
        const method = teamId ? 'PUT' : 'POST';

        const res = await authFetch(url, { method, body: fd });

        if (res && res.ok) {
            Swal.fire(
                'Uğurlu!',
                teamId ? 'Komanda üzvü uğurla yeniləndi.' : 'Komanda üzvü uğurla əlavə edildi.',
                'success'
            );

            const modalEl = document.getElementById('teamModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }

            await loadTeamMembers();
        } else {
            let message = 'Məlumat yadda saxlanılmadı.';
            try {
                const data = await res.json();
                if (data?.message) message = data.message;
            } catch (e) {}

            Swal.fire('Xəta', message, 'error');
        }
    } catch (e) {
        console.error(e);
        Swal.fire('Xəta', 'Bağlantı xətası baş verdi.', 'error');
    }
}

async function deleteTeamMember(id) {
    const conf = await Swal.fire({
        title: 'Əminsiniz?',
        text: 'Bu komanda üzvü sistemdən silinəcək.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Bəli, sil!',
        cancelButtonText: 'Ləğv et'
    });

    if (!conf.isConfirmed) return;

    try {
        Swal.fire({
            title: 'Silinir...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const res = await authFetch(`${API.ABOUT}/team/${id}`, { method: 'DELETE' });

        if (res && res.ok) {
            await loadTeamMembers();
            Swal.fire('Silindi!', 'Komanda üzvü uğurla silindi.', 'success');
        } else {
            let message = 'Komanda üzvü silinmədi.';
            try {
                const data = await res.json();
                if (data?.message) message = data.message;
            } catch (e) {}

            Swal.fire('Xəta', message, 'error');
        }
    } catch (e) {
        console.error(e);
        Swal.fire('Xəta', 'Silinmə zamanı bağlantı xətası baş verdi.', 'error');
    }
}

// ============================================================
// BACKSTAGE: siyahı, yükləmə (R2), dərc, sıralama, silmə
// ============================================================

const BS_MAX_VIDEO = 2000 * 1024 * 1024;   // backend limiti ilə eyni olsun
const BS_MAX_POSTER   = 5 * 1024 * 1024;
const BS_VIDEO_TYPES  = ['video/mp4'];
const BS_POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

let bsCache = [];
let bsDragReady = false;
let bsPreviewUrl = null;
const bsState = { autoPoster: null };

// ---------- köməkçilər ----------

function bsEsc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function bsFmtSize(bytes) {
    return bytes >= 1048576
        ? (bytes / 1048576).toFixed(1) + ' MB'
        : Math.round(bytes / 1024) + ' KB';
}

// Backend tam link qaytarırsa onu, yoxsa key-dən link düzəldir
function bsMediaUrl(item, kind) {
    const direct = kind === 'video' ? item.video : item.poster;
    if (direct) return direct;
    const key = kind === 'video' ? item.videoKey : item.posterKey;
    return key ? `${R2_PUBLIC_URL}/${key}` : 'https://placehold.co/160x90/1a1a1a/FFF?text=No+Poster';
}

function bsNextSortOrder() {
    return bsCache.length ? Math.max(...bsCache.map(i => i.sortOrder ?? 0)) + 1 : 0;
}

async function bsErrorMessage(res, fallback) {
    try {
        const d = await res.json();
        return d.message || fallback;
    } catch (e) {
        return fallback;
    }
}

function bsToast(title, icon = 'success') {
    Swal.fire({ toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 1800 });
}

// ---------- siyahı ----------

async function loadBackstage() {
    const list = document.getElementById('bsList');
    if (!list) return;
    list.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Yüklənir...</p></div>';

    try {
        const res = await authFetch(`${API.BACKSTAGE}?t=${Date.now()}`);
        if (!res) return;
        if (!res.ok) throw new Error(await bsErrorMessage(res, 'Siyahı yüklənmədi'));

        const items = await res.json();
        bsCache = (Array.isArray(items) ? items : []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        const badge = document.getElementById('backstageCount');
        if (badge) badge.textContent = bsCache.length;

        if (!bsCache.length) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-clapperboard"></i><h3>Hələ heç bir video yoxdur</h3></div>';
            return;
        }

        list.innerHTML = bsCache.map(it => `
            <div class="bs-row" draggable="true" data-id="${bsEsc(it.id)}">
                <span class="bs-handle" title="Sürüşdür"><i class="fas fa-grip-vertical"></i></span>
                <img class="bs-thumb" src="${bsEsc(bsMediaUrl(it, 'poster'))}" alt="">
                <div class="bs-info">
                    <div class="bs-brand">${bsEsc(it.brand)}</div>
                    <div class="bs-title">${bsEsc(it.title)}</div>
                </div>
                <div class="form-check form-switch m-0 bs-switch">
                    <input class="form-check-input" type="checkbox" id="bsPub_${bsEsc(it.id)}" ${it.published ? 'checked' : ''}
                           onchange="bsTogglePublish('${bsEsc(it.id)}', this)">
                    <label class="form-check-label small" for="bsPub_${bsEsc(it.id)}">Dərc</label>
                </div>
                <button class="btn-edit" onclick="bsEdit('${bsEsc(it.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="bsDelete('${bsEsc(it.id)}')"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');

        bsInitDragSort(list);

    } catch (e) {
        console.error('Backstage yüklənmə xətası:', e);
        list.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h3>Xəta baş verdi</h3></div>';
    }
}

// ---------- dərc et / gizlət ----------

async function bsTogglePublish(id, checkbox) {
    const wanted = checkbox.checked;
    checkbox.disabled = true;
    try {
        const res = await authFetch(`${API.BACKSTAGE}/${id}/publish`, {
            method: 'PATCH',
            body: JSON.stringify({ published: wanted })
        });
        if (!res || !res.ok) throw new Error(res ? await bsErrorMessage(res, 'Status dəyişmədi') : 'Sessiya bitib');

        const item = bsCache.find(i => String(i.id) === String(id));
        if (item) item.published = wanted;
        bsToast(wanted ? 'Dərc olundu' : 'Gizlədildi');
    } catch (e) {
        checkbox.checked = !wanted;
        Swal.fire('Xəta', e.message, 'error');
    } finally {
        checkbox.disabled = false;
    }
}

// ---------- sürüşdürərək sıralama ----------

function bsDragAfter(container, y) {
    let closest = { offset: Number.NEGATIVE_INFINITY, el: null };
    container.querySelectorAll('.bs-row:not(.bs-dragging)').forEach(row => {
        const box = row.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) closest = { offset, el: row };
    });
    return closest.el;
}

function bsCurrentOrder(container) {
    return [...container.querySelectorAll('.bs-row')].map(r => r.dataset.id);
}

function bsInitDragSort(container) {
    if (bsDragReady) return;          // listener-lər yalnız bir dəfə bağlanır
    bsDragReady = true;

    let dragEl = null;
    let orderBefore = [];

    container.addEventListener('dragstart', e => {
        const row = e.target.closest('.bs-row');
        if (!row) return;
        dragEl = row;
        orderBefore = bsCurrentOrder(container);
        row.classList.add('bs-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', row.dataset.id);
    });

    container.addEventListener('dragover', e => {
        if (!dragEl) return;
        e.preventDefault();
        const after = bsDragAfter(container, e.clientY);
        if (after == null) container.appendChild(dragEl);
        else container.insertBefore(dragEl, after);
    });

    container.addEventListener('dragend', async () => {
        if (!dragEl) return;
        dragEl.classList.remove('bs-dragging');
        dragEl = null;

        const ids = bsCurrentOrder(container);
        if (ids.join() === orderBefore.join()) return;   // dəyişməyibsə sorğu göndərmə

        try {
            const res = await authFetch(`${API.BACKSTAGE}/reorder`, {
                method: 'PATCH',
                body: JSON.stringify({ ids })
            });
            if (!res || !res.ok) throw new Error(res ? await bsErrorMessage(res, 'Sıra saxlanmadı') : 'Sessiya bitib');
            bsToast('Sıra saxlanıldı');
            bsCache.sort((a, b) => ids.indexOf(String(a.id)) - ids.indexOf(String(b.id)));
        } catch (e) {
            Swal.fire('Xəta', e.message, 'error');
            loadBackstage();          // köhnə sıranı bərpa et
        }
    });
}

// ---------- modal ----------

function openBackstageModal() {
    document.getElementById('backstageForm').reset();
    document.getElementById('bsId').value = '';
    document.getElementById('bsModalLabel').textContent = 'Yeni Backstage';
    document.getElementById('bsVideoInfo').textContent = '';
    bsState.autoPoster = null;
    bsRefreshPosterPreview();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('backstageModal')).show();
}

function bsEdit(id) {
    const item = bsCache.find(i => String(i.id) === String(id));
    if (!item) {
        Swal.fire('Xəta', 'Məlumat tapılmadı!', 'error');
        return;
    }

    document.getElementById('backstageForm').reset();
    document.getElementById('bsId').value = item.id;
    document.getElementById('bsModalLabel').textContent = 'Backstage Redaktəsi';
    document.getElementById('bsBrand').value = item.brand || '';
    document.getElementById('bsTitle').value = item.title || '';
    document.getElementById('bsPublished').checked = !!item.published;
    document.getElementById('bsVideoInfo').textContent = 'Yeni fayl seçməsən, mövcud video qalır';
    bsState.autoPoster = null;
    bsRefreshPosterPreview();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('backstageModal')).show();
}

function bsRefreshPosterPreview() {
    const box = document.getElementById('bsPosterPreview');
    if (!box) return;

    const posterFile = document.getElementById('bsPosterFile').files[0];
    const blob = posterFile || bsState.autoPoster;

    if (bsPreviewUrl) {
        URL.revokeObjectURL(bsPreviewUrl);
        bsPreviewUrl = null;
    }

    let src = '';
    let label = '';

    if (blob) {
        bsPreviewUrl = URL.createObjectURL(blob);
        src = bsPreviewUrl;
        label = posterFile ? 'Seçilmiş poster' : 'Videodan götürülən kadr';
    } else {
        const id = document.getElementById('bsId').value;
        const item = id ? bsCache.find(i => String(i.id) === id) : null;
        if (item) {
            src = bsMediaUrl(item, 'poster');
            label = 'Mövcud poster';
        }
    }

    box.innerHTML = src
        ? `<img src="${bsEsc(src)}" class="bs-poster-preview" alt=""><div class="small text-muted mt-1">${label}</div>`
        : '';
}

// Videonun ilk kadrını brauzerdə JPEG-ə çevirir (R2 bunu özü etmir)
function bsExtractFrame(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.src = url;

        const cleanup = () => URL.revokeObjectURL(url);

        video.onerror = () => { cleanup(); reject(new Error('Video oxunmadı')); };

        video.onloadedmetadata = () => {
            video.currentTime = Math.min(1, (video.duration || 1) * 0.1);
        };

        video.onseeked = () => {
            const scale = Math.min(1, 1280 / video.videoWidth);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(blob => {
                cleanup();
                if (!blob) return reject(new Error('Kadr çıxarılmadı'));
                resolve(new File([blob], 'poster.jpg', { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.85);
        };
    });
}

document.getElementById('bsVideoFile')?.addEventListener('change', async function () {
    const file = this.files[0];
    const info = document.getElementById('bsVideoInfo');
    bsState.autoPoster = null;

    if (!file) {
        info.textContent = '';
        bsRefreshPosterPreview();
        return;
    }

    if (!BS_VIDEO_TYPES.includes(file.type)) {
        Swal.fire('Diqqət', 'Yalnız MP4 video qəbul olunur', 'warning');
        this.value = '';
        info.textContent = '';
        return;
    }

    if (file.size > BS_MAX_VIDEO) {
        Swal.fire('Diqqət', `Video ${bsFmtSize(BS_MAX_VIDEO)}-dan böyük ola bilməz`, 'warning');
        this.value = '';
        info.textContent = '';
        return;
    }

    const base = `${file.name} (${bsFmtSize(file.size)})`;
    info.textContent = base;

    if (!document.getElementById('bsPosterFile').files[0]) {
        info.textContent = base + ' · poster hazırlanır...';
        try {
            bsState.autoPoster = await bsExtractFrame(file);
            info.textContent = base;
        } catch (e) {
            info.textContent = base + ' · avtomatik poster alınmadı, poster seçin';
        }
        bsRefreshPosterPreview();
    }
});

document.getElementById('bsPosterFile')?.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        if (!BS_POSTER_TYPES.includes(file.type)) {
            Swal.fire('Diqqət', 'Poster JPG, PNG və ya WEBP olmalıdır', 'warning');
            this.value = '';
        } else if (file.size > BS_MAX_POSTER) {
            Swal.fire('Diqqət', `Poster ${bsFmtSize(BS_MAX_POSTER)}-dan böyük ola bilməz`, 'warning');
            this.value = '';
        }
    }
    bsRefreshPosterPreview();
});

// ---------- R2-yə yükləmə ----------

function bsShowProgress() {
    Swal.fire({
        title: 'Yadda saxlanılır...',
        html: '<div id="bsStatus" style="font-weight:bold; margin-bottom:10px;">Proses başlayır...</div>' +
              '<div class="progress" style="height:25px;">' +
              '<div id="bsProgress" class="progress-bar progress-bar-striped progress-bar-animated" style="width:0%">0%</div>' +
              '</div>',
        allowOutsideClick: false,
        showConfirmButton: false
    });
}

function bsSetProgress(text, percent) {
    const status = document.getElementById('bsStatus');
    const bar = document.getElementById('bsProgress');
    if (status && text) status.innerText = text;
    if (bar && percent != null) {
        bar.style.width = percent + '%';
        bar.textContent = percent + '%';
    }
}

function bsPutToR2(uploadUrl, file, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);   // presigned link ilə eyni olmalıdır

        xhr.upload.onprogress = e => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300)
            ? resolve()
            : reject(new Error(`R2 yükləmə xətası (${xhr.status})`));
        xhr.onerror = () => reject(new Error('Şəbəkə xətası (R2 CORS qaydasını yoxla)'));
        xhr.send(file);
    });
}

// 1) backend-dən presigned link al  2) faylı birbaşa R2-yə yüklə  3) key-i qaytar
async function bsUploadFile(kind, file, label) {
    const res = await authFetch(`${API.BACKSTAGE}/upload-url`, {
        method: 'POST',
        body: JSON.stringify({
            kind,                         // "VIDEO" | "POSTER"
            fileName: file.name,
            contentType: file.type,
            size: file.size
        })
    });
    if (!res) throw new Error('Sessiya bitib');
    if (!res.ok) throw new Error(await bsErrorMessage(res, 'Yükləmə icazəsi alınmadı'));

    const { uploadUrl, key } = await res.json();

    bsSetProgress(`${label} yüklənir...`, 0);
    await bsPutToR2(uploadUrl, file, p => bsSetProgress(`${label} yüklənir...`, p));
    return key;
}

// ---------- yadda saxla ----------

async function submitBackstage() {
    const id = document.getElementById('bsId').value;
    const brand = document.getElementById('bsBrand').value.trim();
    const title = document.getElementById('bsTitle').value.trim();
    const published = document.getElementById('bsPublished').checked;
    const videoFile = document.getElementById('bsVideoFile').files[0] || null;
    const posterFile = document.getElementById('bsPosterFile').files[0] || bsState.autoPoster || null;
    const existing = id ? bsCache.find(i => String(i.id) === String(id)) : null;

    if (!brand || !title) {
        Swal.fire('Diqqət', 'Brend və Başlıq mütləqdir!', 'warning');
        return;
    }
    if (!existing && !videoFile) {
        Swal.fire('Diqqət', 'Video faylı seçin', 'warning');
        return;
    }
    if (!existing && !posterFile) {
        Swal.fire('Diqqət', 'Poster seçin (videodan avtomatik kadr alınmayıb)', 'warning');
        return;
    }

    bsShowProgress();

    try {
        let videoKey = existing?.videoKey;
        let posterKey = existing?.posterKey;

        if (videoFile)  videoKey  = await bsUploadFile('VIDEO', videoFile, 'Video');
        if (posterFile) posterKey = await bsUploadFile('POSTER', posterFile, 'Poster');

        if (!videoKey || !posterKey) {
            throw new Error('Video və ya poster açarı tapılmadı (admin cavabında videoKey/posterKey olmalıdır)');
        }

        bsSetProgress('Bazaya qeyd edilir...', 100);

        const body = {
            brand,
            title,
            videoKey,
            posterKey,
            published,
            sortOrder: existing ? existing.sortOrder : bsNextSortOrder()
        };

        const res = await authFetch(id ? `${API.BACKSTAGE}/${id}` : API.BACKSTAGE, {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(body)
        });

        if (!res) throw new Error('Sessiya bitib');
        if (!res.ok) throw new Error(await bsErrorMessage(res, 'Server məlumatı qəbul etmədi'));

        bootstrap.Modal.getInstance(document.getElementById('backstageModal'))?.hide();
        await Swal.fire('Uğurlu!', id ? 'Video yeniləndi.' : 'Video əlavə olundu.', 'success');
        loadBackstage();

    } catch (e) {
        console.error('Backstage submit error:', e);
        Swal.fire('Xəta!', e.message || 'Xəta baş verdi', 'error');
    }
}

// ---------- sil ----------

async function bsDelete(id) {
    const r = await Swal.fire({
        title: 'Silinsin?',
        text: 'Video və poster R2-dən də silinəcək. Geri qaytarmaq olmur.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Bəli, sil!',
        cancelButtonText: 'Ləğv et'
    });
    if (!r.isConfirmed) return;

    try {
        const res = await authFetch(`${API.BACKSTAGE}/${id}`, { method: 'DELETE' });
        if (!res || !res.ok) throw new Error(res ? await bsErrorMessage(res, 'Silinmədi') : 'Sessiya bitib');
        bsToast('Silindi');
        loadBackstage();
    } catch (e) {
        Swal.fire('Xəta', e.message, 'error');
    }
}

// ============================================
// INITIALIZATION (faylın ƏN SONUNDA olmalıdır)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    if (!localStorage.getItem('jwt_token')) return;

    const hash = location.hash.replace('#', '');
    navigateTo(VALID_PAGES.includes(hash) ? hash : 'dashboard');
});