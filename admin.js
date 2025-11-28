// ============================================
// CINECHORD ADMIN PANEL - REAL WORKING VERSION
// Backend endpoints düzgün işləyir!
// ============================================

const BASE_URL = "http://localhost:8080";
const API = {
    LOGIN: `${BASE_URL}/api/auth/login`,
    WORKS: `${BASE_URL}/admin/works`,
    SERVICES: `${BASE_URL}/admin/services`,
    CONTACTS: `${BASE_URL}/admin/contacts`,
    ABOUT: `${BASE_URL}/api/about`
};
const UPLOADS_URL = `${BASE_URL}/uploads/`;

let token = localStorage.getItem('jwt_token');
let worksChart, categoryChart;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function cleanUrlPath(url) {
    if (!url || typeof url !== 'string') return url;
    return url.replace(/^\/uploads\//, ''); 
}

function getFullVideoUrl(videoUrl) {
    if (!videoUrl) return null;
    let url = videoUrl.trim();
    if (url.startsWith('/uploads/')) return BASE_URL + url;
    if (url.startsWith('uploads/')) return BASE_URL + '/' + url;
    if (!url.startsWith('http')) return UPLOADS_URL + url;
    return url;
}

function formatDate(dateString) {
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
// AUTHENTICATION
// ============================================

function checkAuth() {
    if(!token) {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('admin-wrapper').style.display = 'none';
    } else {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('admin-wrapper').style.display = 'flex';
        navigateTo('dashboard');
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
            token = data.token || data.accessToken;
            localStorage.setItem('jwt_token', token);
            Swal.fire({icon: 'success', title: 'Xoş Gəldiniz!', timer: 1500, showConfirmButton: false});
            checkAuth();
        } else { 
            Swal.fire('Xəta', 'Giriş məlumatları yanlışdır', 'error'); 
        }
    } catch(err) { 
        Swal.fire('Xəta', 'Server xətası', 'error'); 
    }
});

function logout() { 
    Swal.fire({
        title: 'Çıxış etmək istədiyinizdən əminsiniz?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Bəli, çıx',
        cancelButtonText: 'Xeyr'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('jwt_token');
            location.reload();
        }
    });
}

async function authFetch(url, options = {}) {
    if(!options.headers) options.headers = {};
    if(!(options.body instanceof FormData)) 
        options.headers['Content-Type'] = 'application/json';
    options.headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, options);
    if(res.status === 401) { logout(); return; }
    return res;
}

// ============================================
// NAVIGATION
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

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            if (page) navigateTo(page);
        });
    });
    
    // About save button
    const saveAboutBtn = document.getElementById('saveAboutBtn');
    if (saveAboutBtn) {
        saveAboutBtn.addEventListener('click', saveAboutData);
    }
});

// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {
    try {
        const worksRes = await authFetch(`${API.WORKS}/getAllWorks`);
        const worksData = await worksRes.json();
        const works = Array.isArray(worksData) ? worksData : (worksData.content || []);

        const servicesRes = await authFetch(`${API.SERVICES}/getAll`);
        const servicesData = await servicesRes.json();
        const services = Array.isArray(servicesData) ? servicesData : [];

        // ✅ Messages - use correct backend URL
        let messages = [];
        try {
            const messagesRes = await authFetch(`${API.CONTACTS}/allMessages`);
            if (messagesRes && messagesRes.ok) {
                const messagesData = await messagesRes.json();
                messages = Array.isArray(messagesData) ? messagesData : [];
            }
        } catch (e) {
            // Silent fail
        }

        updateStats(works, services, messages);
        initCharts(works);
        loadActivity(works, services, messages);
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

function updateStats(works, services, messages) {
    document.getElementById('totalWorks').textContent = works.length;
    document.getElementById('totalServices').textContent = services.length;
    
    // ✅ Count unread messages properly
    const unreadCount = messages.filter(m => !(m.isRead || m.read)).length;
    document.getElementById('totalMessages').textContent = unreadCount;
    
    document.getElementById('worksCount').textContent = works.length;
    document.getElementById('servicesCount').textContent = services.length;
    document.getElementById('messagesCount').textContent = unreadCount;
}

function initCharts(works) {
    // LINE CHART - Real data
    const worksCtx = document.getElementById('worksChart');
    if (worksCtx) {
        if (worksChart) worksChart.destroy();
        
        const last7Days = [];
        const workCounts = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('az-AZ', { weekday: 'short' });
            last7Days.push(dayName);
            
            const dayCount = works.filter(w => {
                if (!w.createdAt) return false;
                const workDate = new Date(w.createdAt);
                return workDate.toDateString() === date.toDateString();
            }).length;
            
            workCounts.push(dayCount);
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
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // DOUGHNUT CHART - Real data
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        if (categoryChart) categoryChart.destroy();
        
        const categories = {};
        works.forEach(w => {
            const cat = w.category || 'OTHER';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        
        if (Object.keys(categories).length === 0) {
            categories['Məlumat yoxdur'] = 1;
        }
        
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 15, usePointStyle: true }
                    }
                }
            }
        });
    }
}

function loadActivity(works, services, messages) {
    const list = document.getElementById('activityList');
    if (!list) return;
    
    const activities = [];
    works.slice(0, 3).forEach(w => activities.push({
        icon: 'fa-film',
        color: '#6366f1',
        title: `"${w.title}" əlavə edildi`,
        time: formatDate(w.createdAt || new Date())
    }));
    
    if (activities.length === 0) {
        list.innerHTML = '<div class="activity-item"><div class="activity-info"><div class="activity-title">Hələ aktivlik yoxdur</div></div></div>';
        return;
    }
    
    list.innerHTML = activities.map(a => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${a.color}">
                <i class="fas ${a.icon}"></i>
            </div>
            <div class="activity-info">
                <div class="activity-title">${a.title}</div>
                <div class="activity-time">${a.time}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// WORKS - ORIJINAL KODUN DÜZ İŞLƏYƏN VERSİYASI
// ============================================

async function loadWorks() {
    try {
        const res = await authFetch(`${API.WORKS}/getAllWorks`);
        const data = await res.json();
        const works = data.content || data;
        
        const grid = document.getElementById('worksGrid');
        if (!grid) return;
        
        if (!works || works.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <h3>Hələ heç bir iş yoxdur</h3>
                    <p>Yeni iş əlavə etmək üçün "Yeni İş" düyməsinə klikləyin</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = '';
        
        works.forEach(w => {
            let imgUrl = cleanUrlPath(w.imageUrl || '');
            if(imgUrl && !imgUrl.startsWith('http')) {
                imgUrl = `${UPLOADS_URL}${imgUrl}`;
            }
            
            const card = document.createElement('div');
            card.className = 'work-card';
            card.innerHTML = `
                <img src="${imgUrl || 'https://via.placeholder.com/400x225/6366f1/ffffff?text=No+Image'}" 
                     class="work-image" 
                     alt="${w.title}"
                     onerror="this.src='https://via.placeholder.com/400x225/6366f1/ffffff?text=${encodeURIComponent(w.title)}'">
                <div class="work-body">
                    <h3 class="work-title">${w.title}</h3>
                    <div class="work-meta">
                        <div class="work-client">
                            <i class="fas fa-user"></i>
                            ${w.clientName || 'N/A'}
                        </div>
                        <span class="work-category">${w.category}</span>
                    </div>
                    <div class="work-actions">
                        <button class="btn-edit" onclick='editWork(${JSON.stringify(w).replace(/'/g, "&apos;")})'>
                            <i class="fas fa-edit"></i>
                            Redaktə
                        </button>
                        <button class="btn-delete" onclick="deleteWork(${w.id})">
                            <i class="fas fa-trash"></i>
                            Sil
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch(e) { 
        console.error('loadWorks error:', e);
        const grid = document.getElementById('worksGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>
                    <h3>Xəta baş verdi</h3>
                    <p>İşlər yüklənə bilmədi</p>
                </div>
            `;
        }
    }
}

// View switcher
function switchView(view) {
    const grid = document.getElementById('worksGrid');
    const btns = document.querySelectorAll('.view-btn');
    
    btns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
    
    if (view === 'list') {
        grid.classList.add('list-view');
    } else {
        grid.classList.remove('list-view');
    }
}

// Search works
function searchWorks() {
    const searchTerm = document.getElementById('workSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.work-card');
    
    cards.forEach(card => {
        const title = card.querySelector('.work-title').textContent.toLowerCase();
        const client = card.querySelector('.work-client').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || client.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Filter by category
function filterWorks() {
    const category = document.getElementById('categoryFilter').value;
    const cards = document.querySelectorAll('.work-card');
    
    cards.forEach(card => {
        const workCategory = card.querySelector('.work-category').textContent;
        
        if (!category || workCategory === category) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
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
        const res = await authFetch(id ? `${API.WORKS}/${id}` : `${API.WORKS}/createWork`, { 
            method: id ? 'PUT' : 'POST', 
            body: fd 
        });
        
        if(res.ok) {
            Swal.fire('Uğurlu!', 'İş yadda saxlanıldı', 'success');
            bootstrap.Modal.getInstance(document.getElementById('workModal')).hide();
            loadWorks();
            loadDashboard();
        } else { 
            Swal.fire('Xəta', await res.text(), 'error');
        }
    } catch(e) { 
        Swal.fire('Xəta', e.message, 'error'); 
    }
}

async function deleteWork(id) {
    const r = await Swal.fire({
        title: 'Silinsin?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sil',
        cancelButtonText: 'Ləğv'
    });
    
    if(r.isConfirmed) {
        await authFetch(`${API.WORKS}/deleteWork/${id}`, { method: 'DELETE' });
        Swal.fire('Silindi', '', 'success');
        loadWorks();
        loadDashboard();
    }
}

// ============================================
// SERVICES
// ============================================

async function loadServices() {
    try {
        const res = await authFetch(`${API.SERVICES}/getAll`);
        const services = await res.json();
        const grid = document.getElementById('servicesGrid');
        if (!grid) return;
        
        grid.innerHTML = services.length === 0 ? '<div style="grid-column:1/-1;text-align:center;padding:4rem">Boşdur</div>' : '';
        
        services.forEach(s => {
            const hasVideo = s.videoUrl && s.videoUrl.trim();
            grid.innerHTML += `
                <div class="service-card">
                    <div style="width:56px;height:56px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1));border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem">
                        <i class="${s.iconClass || 'fas fa-star'}" style="font-size:2rem;color:#6366f1"></i>
                    </div>
                    <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:0.75rem">${s.title}</h3>
                    <p style="color:#64748b;margin-bottom:1rem;flex:1">${(s.description || '').substring(0,120)}...</p>
                    <div style="display:inline-flex;padding:0.5rem 0.875rem;border-radius:8px;font-size:0.8rem;font-weight:600;margin-bottom:1rem;background:${hasVideo?'rgba(16,185,129,0.1)':'rgba(148,163,184,0.1)'};color:${hasVideo?'#10b981':'#94a3b8'}">
                        ${hasVideo ? '✅ Video var' : '📹 Video yoxdur'}
                    </div>
                    <div style="display:flex;gap:0.75rem;padding-top:1rem;border-top:1px solid #e2e8f0">
                        <button onclick='editService(${JSON.stringify(s).replace(/'/g,"&apos;")})' style="flex:1;background:rgba(99,102,241,0.1);color:#6366f1;padding:0.625rem;border:none;border-radius:8px;cursor:pointer;font-weight:600">Redaktə</button>
                        <button onclick="deleteService(${s.id})" style="flex:1;background:rgba(239,68,68,0.1);color:#ef4444;padding:0.625rem;border:none;border-radius:8px;cursor:pointer;font-weight:600">Sil</button>
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
        const res = await authFetch(id ? `${API.SERVICES}/${id}` : API.SERVICES, { 
            method: id ? 'PUT' : 'POST', 
            body: fd 
        });
        
        if(res.ok) {
            Swal.fire('Uğurlu!', 'Xidmət yadda saxlanıldı', 'success');
            bootstrap.Modal.getInstance(document.getElementById('serviceModal')).hide();
            loadServices();
            loadDashboard();
        } else { 
            Swal.fire('Xəta', await res.text(), 'error');
        }
    } catch(e) { 
        Swal.fire('Xəta', e.message, 'error'); 
    }
}

async function deleteService(id) {
    const r = await Swal.fire({
        title: 'Silinsin?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sil'
    });
    
    if(r.isConfirmed) {
        await authFetch(`${API.SERVICES}/delete/${id}`, { method: 'DELETE' });
        Swal.fire('Silindi', '', 'success');
        loadServices();
        loadDashboard();
    }
}

// ============================================
// MESSAGES - Backend hazır deyil, skip olunur
// ============================================

async function loadMessages() {
    const list = document.getElementById('messagesList');
    if (!list) return;
    
    // Show loading first
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:#64748b"><i class="fas fa-spinner fa-spin" style="font-size:2rem"></i><p style="margin-top:1rem">Yüklənir...</p></div>';
    
    try {
        // ✅ BACKEND URL: /admin/contacts/allMessages
        const res = await authFetch(`${API.CONTACTS}/allMessages`);
        
        if(!res || !res.ok) {
            list.innerHTML = `
                <div style="text-align:center;padding:3rem">
                    <i class="fas fa-server" style="font-size:3rem;color:#94a3b8;margin-bottom:1rem"></i>
                    <h4 style="color:#475569;margin-bottom:0.5rem">Mesajlar Yüklənmədi</h4>
                    <p style="color:#94a3b8;font-size:0.9rem;margin-bottom:1.5rem">Backend xətası: ${res?.status || 'Network error'}</p>
                    <button onclick="loadMessages()" style="background:#6366f1;color:white;padding:0.75rem 1.5rem;border:none;border-radius:8px;cursor:pointer;font-weight:600">
                        <i class="fas fa-sync"></i> Yenidən Yoxla
                    </button>
                </div>
            `;
            return;
        }
        
        const messages = await res.json();
        
        if (!Array.isArray(messages) || messages.length === 0) {
            list.innerHTML = `
                <div style="text-align:center;padding:4rem">
                    <i class="fas fa-envelope-open" style="font-size:4rem;opacity:0.2;margin-bottom:1rem"></i>
                    <h4 style="color:#475569">Hələ heç bir mesaj yoxdur</h4>
                    <p style="color:#94a3b8">Müştəri mesajları burada görünəcək</p>
                </div>
            `;
            return;
        }
        
        messages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        
        list.innerHTML = '';
        messages.forEach(m => {
            const isRead = m.isRead || m.read || false;
            const statusBg = isRead ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            const statusColor = isRead ? '#10b981' : '#ef4444';
            const statusText = isRead ? 'Oxunub' : 'Yeni';
            
            list.innerHTML += `
                <div style="padding:1.25rem;background:#f8fafc;border-radius:12px;margin-bottom:0.75rem;display:flex;align-items:center;gap:1rem;transition:all 0.2s;cursor:pointer" 
                     onmouseover="this.style.background='#f1f5f9'" 
                     onmouseout="this.style.background='#f8fafc'"
                     onclick="viewMessage(${m.id}, '${(m.name || '').replace(/'/g, "\\'")}', '${(m.email || '').replace(/'/g, "\\'")}', '${(m.message || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}')">
                    <div style="width:48px;height:48px;background:${statusBg};border-radius:12px;display:flex;align-items:center;justify-content:center;color:${statusColor}">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <div style="flex:1;min-width:0">
                        <div style="font-weight:700;color:#0f172a;margin-bottom:0.25rem">${m.name || 'Anonim'}</div>
                        <div style="font-size:0.875rem;color:#64748b;margin-bottom:0.25rem">${m.email || 'email yoxdur'}</div>
                        <div style="font-size:0.875rem;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(m.message || '').substring(0,80)}${m.message && m.message.length > 80 ? '...' : ''}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                        <span style="padding:0.375rem 0.75rem;background:${statusBg};color:${statusColor};border-radius:8px;font-size:0.75rem;font-weight:600;display:inline-block;margin-bottom:0.5rem">${statusText}</span>
                        <div style="font-size:0.75rem;color:#94a3b8">${formatDate(m.sentAt)}</div>
                    </div>
                    <button onclick="event.stopPropagation();deleteMessage(${m.id})" style="background:rgba(239,68,68,0.1);color:#ef4444;padding:0.5rem 1rem;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.2s" onmouseover="this.style.background='#ef4444';this.style.color='white'" onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444'">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            `;
        });
    } catch(e) {
        list.innerHTML = `
            <div style="text-align:center;padding:3rem">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:#f59e0b;margin-bottom:1rem;opacity:0.5"></i>
                <h4 style="color:#475569;margin-bottom:0.5rem">Backend Əlaqə Xətası</h4>
                <p style="color:#94a3b8;font-size:0.9rem;margin-bottom:1.5rem">${e.message}</p>
                <button onclick="loadMessages()" style="background:#6366f1;color:white;padding:0.75rem 1.5rem;border:none;border-radius:8px;cursor:pointer;font-weight:600">
                    <i class="fas fa-sync"></i> Yenidən Yoxla
                </button>
            </div>
        `;
    }
}

async function viewMessage(id, name, email, message) {
    await Swal.fire({
        title: `<strong>Mesaj: ${name}</strong>`,
        html: `
            <div style="text-align:left;padding:1rem">
                <p style="margin-bottom:1rem"><strong>Email:</strong> ${email}</p>
                <hr style="margin:1rem 0">
                <p style="line-height:1.6;color:#475569">${message}</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Bağla',
        width: 600,
        confirmButtonColor: '#6366f1'
    });
    
    try {
        // ✅ BACKEND URL: PATCH /admin/contacts/{id}/read
        const res = await authFetch(`${API.CONTACTS}/${id}/read`, { method: 'PATCH' });
        if (res && res.ok) {
            loadMessages();
            loadDashboard();
        }
    } catch (e) {
        // Silent fail
    }
}

async function deleteMessage(id) {
    const r = await Swal.fire({
        title: 'Mesaj silinsin?',
        text: 'Bu əməliyyatı geri qaytara bilməzsiniz',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Bəli, sil',
        cancelButtonText: 'Xeyr',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280'
    });
    
    if(r.isConfirmed) {
        try {
            // ✅ BACKEND URL: DELETE /admin/contacts/{id}
            const res = await authFetch(`${API.CONTACTS}/${id}`, { method: 'DELETE' });
            if (res && res.ok) {
                Swal.fire('Silindi!', 'Mesaj uğurla silindi', 'success');
                loadMessages();
                loadDashboard();
            } else {
                Swal.fire('Xəta', 'Silinmə zamanı xəta baş verdi', 'error');
            }
        } catch(e) {
            Swal.fire('Xəta', 'Backend əlaqə xətası', 'error');
        }
    }
}

// ============================================
// ABOUT
// ============================================

async function loadAbout() {
    try {
        const res = await authFetch(`${API.ABOUT}/getAbout`);
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

async function saveAboutData() {
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
        if(res.ok) {
            Swal.fire('Uğurlu!', 'Məlumatlar yadda saxlanıldı', 'success');
            document.getElementById('aVideoFile').value = '';
            loadAbout();
        } else {
            Swal.fire('Xəta', await res.text(), 'error');
        }
    } catch(e) {
        Swal.fire('Xəta', e.message, 'error');
    }
}

// ============================================
// THEME TOGGLE
// ============================================

const themeCheckbox = document.getElementById('themeCheckbox');
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeCheckbox) themeCheckbox.checked = true;
}

document.getElementById('themeToggleNav')?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (themeCheckbox) themeCheckbox.checked = isDark;
});

// ============================================
// INIT
// ============================================

checkAuth();