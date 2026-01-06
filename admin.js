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
// WORKS
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
                        <img src="${getImageUrl(w.imagePath || w.imageUrl)}" class="work-image" alt="${w.title}">
                    </div>
                    <div class="work-body">
                        <h3 class="work-title">${w.title}</h3>
                        <div class="work-meta">
                            <span class="work-category">${w.category}</span>
                            ${w.isFeatured ? '<i class="fas fa-star text-warning" title="Featured"></i>' : ''}
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
    document.getElementById('pagination').innerHTML = html;
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
                loadDashboard();
            } else {
                Swal.fire('Xəta', 'Silmək mümkün olmadı.', 'error');
            }
        } catch (e) {
            Swal.fire('Xəta', 'Sistem xətası', 'error');
        }
    }
}

function openWorkModal() {
    document.getElementById('workForm').reset();
    document.getElementById('workId').value = ''; 
    document.getElementById('imagePreviewContainer')?.remove();
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

function editWorkById(id) {
    const w = worksDataCache.find(work => work.id === id);
    if (!w) {
        Swal.fire('Xəta', 'Məlumat tapılmadı!', 'error');
        return;
    }
    
    document.getElementById('workForm').reset();
    document.getElementById('imagePreviewContainer')?.remove();

    document.getElementById('workId').value = w.id;
    document.getElementById('wTitle').value = w.title;
    document.getElementById('wClient').value = w.clientName || '';
    document.getElementById('wCategory').value = w.category;
    document.getElementById('wSlug').value = w.slug || '';
    document.getElementById('wAgency').value = w.agency || '';
    document.getElementById('wLocation').value = w.location || '';
    document.getElementById('wYear').value = w.productionYear || '';
    document.getElementById('wFeatured').checked = w.isFeatured || false;
    document.getElementById('wVideoUrl').value = w.videoUrl || '';
    document.getElementById('wDescription').value = w.description || '';
    
    new bootstrap.Modal(document.getElementById('workModal')).show();
}

async function submitWork() {
    const id = document.getElementById('workId').value;
    const fd = new FormData();
    
    const title = document.getElementById('wTitle').value;
    const category = document.getElementById('wCategory').value;

    if(!title || !category) {
        Swal.fire('Diqqət', 'Başlıq və Kateqoriya mütləqdir!', 'warning');
        return;
    }

    fd.append('title', title);
    fd.append('category', category);
    fd.append('clientName', document.getElementById('wClient').value);
    fd.append('slug', document.getElementById('wSlug').value);
    fd.append('agency', document.getElementById('wAgency').value);
    fd.append('location', document.getElementById('wLocation').value);
    fd.append('productionYear', document.getElementById('wYear').value);
    fd.append('isFeatured', document.getElementById('wFeatured').checked ? 'true' : 'false');
    fd.append('videoUrl', document.getElementById('wVideoUrl').value);
    fd.append('description', document.getElementById('wDescription').value);

    const img = document.getElementById('wImage').files[0];
    if(img) fd.append('imageFile', img); 
    
    const vid = document.getElementById('wPreview').files[0];
    if(vid) fd.append('previewVideoFile', vid); 

    Swal.fire({
        title: 'Yüklənir...',
        html: 'Zəhmət olmasa gözləyin...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    
    try {
        let url = id ? `${API.WORKS}/updateWork/${id}` : `${API.WORKS}/createWork`;
        let method = id ? 'PUT' : 'POST';

        const xhr = new XMLHttpRequest();
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

    } catch(e) { 
        Swal.fire('Xəta', e.message, 'error'); 
    }
}

function toggleBulkSelect(id) {
    const checkbox = document.querySelector(`.bulk-checkbox[data-id="${id}"]`);
    if (checkbox.checked) selectedItems.push(id);
    else selectedItems = selectedItems.filter(item => item !== id);
    
    const bar = document.getElementById('bulkActionsBar');
    if(bar) {
        bar.style.display = selectedItems.length > 0 ? 'flex' : 'none';
        bar.querySelector('.bulk-count').textContent = `${selectedItems.length} iş seçildi`;
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
// SERVICES
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
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
    document.getElementById('serviceModalLabel').textContent = 'Yeni Xidmət';
    
    new bootstrap.Modal(document.getElementById('serviceModal')).show();
}

function editServiceById(id) {
    const s = servicesDataCache.find(item => item.id === id);
    if (!s) {
        Swal.fire('Xəta', 'Məlumat tapılmadı!', 'error');
        return;
    }

    const modalLabel = document.getElementById('serviceModalLabel');
    if (modalLabel) modalLabel.innerText = "Xidməti Redaktə Et";

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
    if (bulletPoints) bulletPoints.value = Array.isArray(s.bulletPoints) ? s.bulletPoints.join('\n') : '';

    const bulletPointsAz = document.getElementById('sBulletPointsAz');
    if (bulletPointsAz) bulletPointsAz.value = Array.isArray(s.bulletPointsAz) ? s.bulletPointsAz.join('\n') : '';

    const modalEl = document.getElementById('serviceModal');
    if (modalEl) {
        const modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
}

async function submitService() {
    const id = document.getElementById('serviceId').value;
    const fd = new FormData();
    
    const title = document.getElementById('sTitle').value;
    const titleAz = document.getElementById('sTitleAz').value || title;
    const desc = document.getElementById('sDesc').value;
    const descAz = document.getElementById('sDescAz').value || desc;
    
    if(!title) {
        Swal.fire('Diqqət', 'Başlıq mütləqdir', 'warning');
        return;
    }

    fd.append('title', title);
    fd.append('titleAz', titleAz);
    fd.append('description', desc);
    fd.append('descriptionAz', descAz);
    
    const bulletInput = document.getElementById('sBulletPoints').value;
    const bulletPoints = bulletInput.split('\n').filter(line => line.trim() !== '');
    bulletPoints.forEach(point => fd.append('bulletPoints', point.trim()));
    
    const bulletInputAz = document.getElementById('sBulletPointsAz').value;
    const bulletPointsAz = bulletInputAz.split('\n').filter(line => line.trim() !== '');
    bulletPointsAz.forEach(point => fd.append('bulletPointsAz', point.trim()));
    
    const videoFile = document.getElementById('sVideoFile');
    if(videoFile && videoFile.files[0]) {
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

// ============================================
// CINECHORD ADMIN - ABOUT SECTION (COMPLETE FIXED)
// ============================================

/**
 * 1. MƏLUMATLARIN YÜKLƏNMƏSİ
 * Həm ümumi mətnləri, həm də komanda üzvlərini gətirir.
 */
async function loadAbout() {
    try {
        console.log('About məlumatları yüklənir...');
        const res = await authFetch(`${API.ABOUT}/getAbout?t=${Date.now()}`);
        if(!res || !res.ok) throw new Error("Backend-dən About datası gəlmədi");
        
        const data = await res.json();
        
        // HTML ID-ləri ilə Java Data obyektini eşləşdiririk
        const fields = {
            'aMainTitle': data.mainTitle,
            'aMainTitleAz': data.mainTitleAz,
            'aSubTitle': data.subTitle,
            'aSubTitleAz': data.subTitleAz,
            'aWhyTitle': data.whyTitle || data.whoWeAreText, // Sənin bazanda hansı addadırsa bura düşəcək
            'aWhyTitleAz': data.whyTitleAz || data.whoWeAreTextAz,
            'aWhyDesc': data.whyDesc || data.ourMissionText,
            'aWhyDescAz': data.whyDescAz || data.ourMissionTextAz
        };

        // Sahələri doldururuq
        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        }

        // Media önizləməni yükləyirik
        loadWhyMediaPreview(data); 
        // Komandanı yükləyirik
        loadTeamMembers();

    } catch(error) {
        console.error('About Error:', error);
        // Səhifə ilk dəfə boşdursa xəta verməsin deyə Swal-ı bağlaya bilərsən
    }
}

/**
 * 2. ANA MƏLUMATLARI YADDA SAXLA (Text Fields)
 */
async function submitAbout() {
    const fd = new FormData();
    const aboutData = {
        mainTitle: document.getElementById('aMainTitle')?.value || '',
        mainTitleAz: document.getElementById('aMainTitleAz')?.value || '',
        subTitle: document.getElementById('aSubTitle')?.value || '',
        subTitleAz: document.getElementById('aSubTitleAz')?.value || '',
        whyTitle: document.getElementById('aWhyTitle')?.value || '',
        whyTitleAz: document.getElementById('aWhyTitleAz')?.value || '',
        whyDesc: document.getElementById('aWhyDesc')?.value || '',
        whyDescAz: document.getElementById('aWhyDescAz')?.value || ''
    };

    Object.keys(aboutData).forEach(key => fd.append(key, aboutData[key]));

    Swal.fire({ title: 'Yadda saxlanılır...', didOpen: () => Swal.showLoading() });

    try {
        const res = await authFetch(`${API.ABOUT}/updateAbout`, { 
            method: 'PUT', 
            body: fd 
        });
        if (res.ok) {
            Swal.fire('Uğurlu!', 'Mətn məlumatları yeniləndi', 'success');
            loadAbout();
        }
    } catch(e) {
        Swal.fire('Xəta', 'Məlumat göndərilmədi: ' + e.message, 'error');
    }
}

/**
 * 3. WHY CINECHORD MEDIA YÜKLƏ (Şəkil və ya Video)
 */
async function uploadWhyMedia() {
    const typeInput = document.getElementById('aWhyMediaType'); // select box
    const fileInput = document.getElementById('aWhyMediaFile'); // file input
    const file = fileInput.files[0];

    if (!file) { 
        Swal.fire('Xəta', 'Zəhmət olmasa fayl seçin', 'warning'); 
        return; 
    }

    const fd = new FormData();
    fd.append('whyMediaFile', file);
    fd.append('whyMediaType', typeInput?.value || 'image');

    Swal.fire({ title: 'Media yüklənir...', didOpen: () => Swal.showLoading() });

    try {
        const res = await authFetch(`${API.ABOUT}/why-media`, { method: 'POST', body: fd });
        if (res.ok) {
            Swal.fire('Uğurlu!', 'Media faylı yeniləndi', 'success');
            fileInput.value = ''; // Inputu təmizlə
            loadAbout();
        }
    } catch (e) { 
        Swal.fire('Xəta', 'Media yüklənmədi', 'error'); 
    }
}

/**
 * 4. MEDIA PREVIEW (Admin panelində görsənməsi üçün)
 */
function loadWhyMediaPreview(data) {
    const previewDiv = document.getElementById('whyMediaPreview');
    if (!previewDiv) return;

    const mediaUrl = data.whyCinechordMediaUrl || data.whyMediaUrl;
    if (!mediaUrl) {
        previewDiv.innerHTML = '<span class="text-muted">Media yoxdur</span>';
        return;
    }

    const fullUrl = getImageUrl(mediaUrl);
    const isVideo = data.whyCinechordMediaType === 'video' || fullUrl.toLowerCase().endsWith('.mp4');

    if (isVideo) {
        previewDiv.innerHTML = `<video width="100%" height="150" controls style="border-radius:8px;"><source src="${fullUrl}"></video>`;
    } else {
        previewDiv.innerHTML = `<img src="${fullUrl}" style="max-height:150px; border-radius:8px; width:auto; max-width:100%;">`;
    }
}

/**
 * 5. KOMANDA ÜZVLƏRİ SİYAHISI
 */
async function loadTeamMembers() {
    const list = document.getElementById('teamMembersGrid');
    if (!list) return;

    try {
        const res = await authFetch(`${API.ABOUT}/team?t=${Date.now()}`);
        if (res.ok) {
            const members = await res.json();
            list.innerHTML = members.map(m => `
                <div class="col-md-4 mb-3">
                    <div class="card bg-dark border-secondary">
                        <img src="${getImageUrl(m.imagePath)}" class="card-img-top" style="height:120px; object-fit:cover;">
                        <div class="card-body p-2 text-center">
                            <h6 class="text-white small mb-1">${m.name}</h6>
                            <p class="text-info" style="font-size:11px;">${m.roleAz || m.role}</p>
                            <button class="btn btn-sm btn-danger w-100" onclick="deleteTeamMember(${m.id})">
                                <i class="fas fa-trash"></i> Sil
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) { console.error("Team loading error:", e); }
}

/**
 * 6. YENİ KOMANDA ÜZVÜ ƏLAVƏ ETMƏ
 */
async function submitTeamMember() {
    const fd = new FormData();
    const name = document.getElementById('tName')?.value;
    const role = document.getElementById('tRole')?.value;
    const img = document.getElementById('tImage')?.files[0];

    if (!name || !role) { 
        Swal.fire('Xəta', 'Ad və Vəzifə mütləqdir', 'warning'); 
        return; 
    }

    fd.append('name', name);
    fd.append('nameAz', document.getElementById('tNameAz')?.value || name);
    fd.append('role', role);
    fd.append('roleAz', document.getElementById('tRoleAz')?.value || role);
    fd.append('bio', document.getElementById('tBio')?.value || '');
    fd.append('bioAz', document.getElementById('tBioAz')?.value || '');
    fd.append('order', document.getElementById('tOrder')?.value || 0);
    if(img) fd.append('imageFile', img);

    try {
        const res = await authFetch(`${API.ABOUT}/team`, { method: 'POST', body: fd });
        if (res.ok) {
            Swal.fire('Uğurlu!', 'Üzv əlavə edildi', 'success');
            loadTeamMembers();
            const modalEl = document.getElementById('teamModal');
            bootstrap.Modal.getInstance(modalEl).hide();
        }
    } catch (e) { Swal.fire('Xəta', 'Sistem xətası: ' + e.message, 'error'); }
}

/**
 * 7. KOMANDA ÜZVÜ SİLMƏ
 */
async function deleteTeamMember(id) {
    const confirmation = await Swal.fire({
        title: 'Silinsin?',
        text: "Bu üzv komandadan həmişəlik silinəcək!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Bəli, sil!',
        cancelButtonText: 'Ləğv et'
    });

    if (confirmation.isConfirmed) {
        const res = await authFetch(`${API.ABOUT}/team/${id}`, { method: 'DELETE' });
        if (res.ok) { 
            Swal.fire('Silindi!', '', 'success'); 
            loadTeamMembers(); 
        }
    }
}

// Globala çıxarırıq ki, HTML-dən əlçatan olsun
window.loadAbout = loadAbout;
window.submitAbout = submitAbout;
window.uploadWhyMedia = uploadWhyMedia;
window.submitTeamMember = submitTeamMember;
window.deleteTeamMember = deleteTeamMember;
window.openTeamModal = () => {
    const form = document.getElementById('teamForm');
    if(form) form.reset();
    new bootstrap.Modal(document.getElementById('teamModal')).show();
};
// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Hash-ə görə səhifəni aç (məs: index.html#works)
    const hash = location.hash.replace('#', '');
    if (hash) navigateTo(hash);
});