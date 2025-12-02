// ============================================
// CINECHORD ADMIN PANEL - ENHANCED VERSION
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

// Qlobal dəyişənlər
let worksChart, categoryChart;
let currentPage = 0;
const pageSize = 20;
let searchTimeout;
let selectedItems = [];

// ============================================
// 1. KÖMƏKÇİ FUNKSİYALAR (UTILS)
// ============================================

// Şəkil URL-ni düzgün formata salır
function getImageUrl(url) {
    if (!url) return 'https://via.placeholder.com/400x225/6366f1/ffffff?text=No+Image';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? `${BASE_URL}${url}` : `${UPLOADS_URL}${url}`;
}

// Tarixi formatlayır
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
// 2. TOKEN EXPIRY CHECK
// ============================================

function checkTokenExpiry() {
    const token = localStorage.getItem('jwt_token');
    if(!token) return;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // milliseconds
        const now = Date.now();
        const timeLeft = exp - now;
        
        // 5 dəqiqə qalıbsa xəbərdarlıq
        if(timeLeft < 5 * 60 * 1000 && timeLeft > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sessiya Bitir',
                text: 'Zəhmət olmasa yenidən giriş edin',
                timer: 3000,
                toast: true,
                position: 'top-end',
                showConfirmButton: false
            });
        }
    } catch(e) {
        console.warn('Token parse error:', e);
    }
}

// Hər 1 dəqiqədə yoxla
setInterval(checkTokenExpiry, 60000);

// ============================================
// 3. AUTHENTICATION & FETCH
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
        
        // Token expiry check başlat
        checkTokenExpiry();
    }
}

// ✅ TƏKMİLLƏŞDİRİLMİŞ FETCH
async function authFetch(url, options = {}) {
    if(!options.headers) options.headers = {};
    
    if(!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    
    const currentToken = localStorage.getItem('jwt_token');
    if (currentToken) {
        options.headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
        const res = await fetch(url, options);

        // 404 - Tapılmadı
        if(res.status === 404) {
            Swal.fire('Tapılmadı', 'Axtardığınız məlumat mövcud deyil', 'error');
            return null;
        }

        // 500 - Server Xətası
        if(res.status === 500) {
            Swal.fire('Server Xətası', 'Daha sonra yenidən cəhd edin', 'error');
            return null;
        }

        // 401/403 - Auth xətası
        if(res.status === 401 || res.status === 403) { 
            console.warn(`Auth Xətası: ${res.status} - ${url}`);
            Swal.fire({
                icon: 'warning',
                title: 'Sessiya Bitdi',
                text: 'Zəhmət olmasa yenidən giriş edin',
                timer: 2000,
                showConfirmButton: false
            });
            logout();
            return null;
        }

        return res;
    } catch (error) {
        console.error("Fetch Error:", error);
        Swal.fire('Əlaqə Xətası', 'İnternet bağlantınızı yoxlayın', 'error');
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
            const token = data.token || data.accessToken;
            
            if(token) {
                localStorage.setItem('jwt_token', token);
                
                await Swal.fire({
                    icon: 'success', 
                    title: 'Xoş Gəldiniz!', 
                    timer: 1000, 
                    showConfirmButton: false
                });

                location.reload(); 
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
    location.reload();
}

// ============================================
// 4. NAVIGATION
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
// 5. DASHBOARD
// ============================================

async function loadDashboard() {
    try {
        // İşlər
        const worksRes = await authFetch(`${API.WORKS}/getAllWorks?size=100`);
        const worksData = (worksRes && worksRes.ok) ? await worksRes.json() : { content: [] };
        const works = worksData.content || [];

        // Xidmətlər
        const servicesRes = await authFetch(`${API.SERVICES}/getAll`);
        const services = (servicesRes && servicesRes.ok) ? await servicesRes.json() : [];

        // Mesajlar
        let messages = [];
        const messagesRes = await authFetch(`${API.CONTACTS}/allMessages`);
        if (messagesRes && messagesRes.ok) {
            messages = await messagesRes.json();
        }

        updateStats(works.length, services.length, messages);
        initCharts(works);
        loadActivity(works);

    } catch (error) {
        console.error('Dashboard Load Error:', error);
        Swal.fire('Xəta', 'Dashboard yüklənmədi', 'error');
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
        
        const last7Days = [];
        const workCounts = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push(date.toLocaleDateString('az-AZ', { weekday: 'short' }));
            
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

function loadActivity(works) {
    const list = document.getElementById('activityList');
    if (!list) return;
    
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
// 6. WORKS - WITH PAGINATION
// ============================================

async function loadWorks(page = 0) {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Yüklənir...</p></div>';

    try {
        const res = await authFetch(`${API.WORKS}/getAllWorks?page=${page}&size=${pageSize}&sort=id,desc`);
        
        if(!res || !res.ok) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Yükləmə xətası</h3><p>Məlumatları yükləmək mümkün olmadı</p></div>`;
            return;
        }
        
        const data = await res.json();
        const works = data.content || []; 
        currentPage = page;
        
        if (works.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-film"></i><h3>Hələ heç bir iş yoxdur</h3><p>Yeni iş əlavə etmək üçün düyməni sıxın</p></div>`;
            return;
        }
        
        grid.innerHTML = '';
        works.forEach(w => {
            const card = document.createElement('div');
            card.className = 'work-card';
            card.innerHTML = `
                <div class="work-select">
                    <input type="checkbox" class="bulk-checkbox" data-id="${w.id}" onchange="toggleBulkSelect(${w.id})">
                </div>
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

        // Pagination əlavə et
        renderPagination(data.totalPages || 1, page);

    } catch(e) { 
        console.error('Works Load Error:', e);
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Xəta baş verdi</h3></div>`;
        Swal.fire('Xəta', 'İşlər yüklənmədi: ' + e.message, 'error');
    }
}

// PAGINATION
function renderPagination(totalPages, currentPage) {
    let paginationContainer = document.getElementById('pagination');
    
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.className = 'pagination-container';
        document.getElementById('worksGrid').after(paginationContainer);
    }
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination">';
    
    // Previous button
    if (currentPage > 0) {
        html += `<button class="page-btn" onclick="loadWorks(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    }
    
    // Page numbers
    for (let i = 0; i < totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="page-btn active">${i + 1}</button>`;
        } else if (i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1) {
            html += `<button class="page-btn" onclick="loadWorks(${i})">${i + 1}</button>`;
        } else if (Math.abs(i - currentPage) === 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages - 1) {
        html += `<button class="page-btn" onclick="loadWorks(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    }
    
    html += '</div>';
    paginationContainer.innerHTML = html;
}

// BULK SELECTION
function toggleBulkSelect(id) {
    const checkbox = document.querySelector(`.bulk-checkbox[data-id="${id}"]`);
    
    if (checkbox.checked) {
        selectedItems.push(id);
    } else {
        selectedItems = selectedItems.filter(item => item !== id);
    }
    
    updateBulkActions();
}

function updateBulkActions() {
    let bulkBar = document.getElementById('bulkActionsBar');
    
    if (!bulkBar) {
        bulkBar = document.createElement('div');
        bulkBar.id = 'bulkActionsBar';
        bulkBar.className = 'bulk-actions-bar';
        document.querySelector('.filters-bar').after(bulkBar);
    }
    
    if (selectedItems.length > 0) {
        bulkBar.style.display = 'flex';
        bulkBar.innerHTML = `
            <span class="bulk-count">${selectedItems.length} iş seçildi</span>
            <button class="btn-danger" onclick="bulkDelete()">
                <i class="fas fa-trash"></i> Hamısını Sil
            </button>
            <button class="btn-secondary" onclick="clearBulkSelection()">
                <i class="fas fa-times"></i> Ləğv et
            </button>
        `;
    } else {
        bulkBar.style.display = 'none';
    }
}

function clearBulkSelection() {
    selectedItems = [];
    document.querySelectorAll('.bulk-checkbox').forEach(cb => cb.checked = false);
    updateBulkActions();
}

async function bulkDelete() {
    const result = await Swal.fire({
        title: `${selectedItems.length} iş silinsin?`,
        text: "Bu əməliyyat geri qaytarıla bilməz!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Bəli, Sil',
        cancelButtonText: 'Ləğv et'
    });
    
    if (result.isConfirmed) {
        Swal.fire({title: 'Silinir...', didOpen: () => Swal.showLoading()});
        
        try {
            await Promise.all(selectedItems.map(id => 
                authFetch(`${API.WORKS}/deleteWork/${id}`, { method: 'DELETE' })
            ));
            
            Swal.fire('Uğurlu!', `${selectedItems.length} iş silindi`, 'success');
            selectedItems = [];
            loadWorks(currentPage);
            loadDashboard();
        } catch(e) {
            Swal.fire('Xəta', 'Toplu silmə zamanı xəta baş verdi', 'error');
        }
    }
}

// MODAL
function openWorkModal() {
    document.getElementById('workForm').reset();
    document.getElementById('workId').value = ''; 
    
    // Preview təmizlə
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) previewContainer.remove();
    
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

// IMAGE PREVIEW
document.getElementById('wImage')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Köhnə preview sil
        const oldPreview = document.getElementById('imagePreviewContainer');
        if (oldPreview) oldPreview.remove();
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const container = document.createElement('div');
            container.id = 'imagePreviewContainer';
            container.style.cssText = 'margin-top: 10px; position: relative;';
            
            const preview = document.createElement('img');
            preview.src = e.target.result;
            preview.style.cssText = 'max-width: 200px; border-radius: 8px; border: 2px solid var(--border-color);';
            
            container.appendChild(preview);
            document.getElementById('wImage').parentElement.appendChild(container);
        };
        reader.readAsDataURL(file);
    }
});

// SUBMIT WITH PROGRESS
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

    // Progress bar ilə Swal
    Swal.fire({
        title: 'Yüklənir...',
        html: '<div class="upload-progress"><div class="progress-bar" id="uploadProgressBar" style="width: 0%; height: 4px; background: #6366f1; border-radius: 4px; transition: width 0.3s;"></div></div>',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    
    try {
        let url, method;
        if (id) {
            url = `${API.WORKS}/${id}`;
            method = 'PUT';
        } else {
            url = `${API.WORKS}/createWork`;
            method = 'POST';
        }

        // XMLHttpRequest ilə progress tracking
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                const progressBar = document.getElementById('uploadProgressBar');
                if (progressBar) {
                    progressBar.style.width = percent + '%';
                }
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
                Swal.fire('Xəta', 'Əməliyyat uğursuz oldu', 'error');
            }
        };

        xhr.onerror = function() {
            Swal.fire('Xəta', 'Şəbəkə xətası baş verdi', 'error');
        };

        xhr.send(fd);

    } catch(e) { 
        Swal.fire('Xəta', e.message, 'error'); 
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
        const res = await authFetch(`${API.WORKS}/deleteWork/${id}`, { method: 'DELETE' });
        
        if (res && res.ok) {
            Swal.fire('Silindi', '', 'success');
            loadWorks(currentPage);
            loadDashboard();
        } else {
            Swal.fire('Xəta', 'Silmək mümkün olmadı', 'error');
        }
    }
}

// SEARCH WITH DEBOUNCE
function searchWorks() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const term = document.getElementById('workSearch').value.toLowerCase();
        document.querySelectorAll('.work-card').forEach(card => {
            const title = card.querySelector('.work-title')?.textContent.toLowerCase() || '';
            const client = card.querySelector('.work-client')?.textContent.toLowerCase() || '';
            card.style.display = (title.includes(term) || client.includes(term)) ? '' : 'none';
        });
    }, 300);
}

function filterWorks() {
    const category = document.getElementById('categoryFilter').value;
    document.querySelectorAll('.work-card').forEach(card => {
        const workCategory = card.querySelector('.work-category')?.textContent || '';
        card.style.display = (!category || workCategory === category) ? '' : 'none';
    });
}

// ============================================
// 7. SERVICES
// ============================================

async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem;"></i></div>';

    try {
        const res = await authFetch(`${API.SERVICES}/getAll`);
        if(!res || !res.ok) {
            grid.innerHTML = '<div class="empty-state">Xidmətlər yüklənmədi</div>';
            return;
        }

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
    } catch(e) { 
        console.error(e);
        Swal.fire('Xəta', 'Xidmətlər yüklənmədi', 'error');
    }
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
// 8. MESSAGES
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
    } catch(e) { 
        console.error(e);
        Swal.fire('Xəta', 'Mesajlar yüklənmədi', 'error');
    }
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
// 9. ABOUT
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
    } catch(e) { 
        console.error(e);
        Swal.fire('Xəta', 'Haqqımızda məlumatları yüklənmədi', 'error');
    }
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
// 10. THEME & INIT
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

// Başla
checkAuth();