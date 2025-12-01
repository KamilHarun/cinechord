// ============================================
// CINECHORD ADMIN PANEL - PRODUCTION READY
// ============================================

// ✅ Railway Backend Linki
const BASE_URL = "https://cinechord-admin-production.up.railway.app";

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

        let messages = [];
        try {
            const messagesRes = await authFetch(`${API.CONTACTS}/allMessages`);
            if (messagesRes && messagesRes.ok) {
                const messagesData = await messagesRes.json();
                messages = Array.isArray(messagesData) ? messagesData : [];
            }
        } catch (e) { }

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
    const unreadCount = messages.filter(m => !(m.isRead || m.read)).length;
    document.getElementById('totalMessages').textContent = unreadCount;
    document.getElementById('worksCount').textContent = works.length;
    document.getElementById('servicesCount').textContent = services.length;
    document.getElementById('messagesCount').textContent = unreadCount;
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
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
            }
        });
    }

    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        if (categoryChart) categoryChart.destroy();
        const categories = {};
        works.forEach(w => {
            const cat = w.category || 'OTHER';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        if (Object.keys(categories).length === 0) categories['Məlumat yoxdur'] = 1;
        
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
                plugins: { legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } } }
            }
        });
    }
}

function loadActivity(works, services, messages) {
    const list = document.getElementById('activityList');
    if (!list) return;
    const activities = [];
    works.slice(0, 3).forEach(w => activities.push({
        icon: 'fa-film', color: '#6366f1', title: `"${w.title}" əlavə edildi`, time: formatDate(w.createdAt || new Date())
    }));
    
    if (activities.length === 0) {
        list.innerHTML = '<div class="activity-item"><div class="activity-info"><div class="activity-title">Hələ aktivlik yoxdur</div></div></div>';
        return;
    }
    list.innerHTML = activities.map(a => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${a.color}"><i class="fas ${a.icon}"></i></div>
            <div class="activity-info"><div class="activity-title">${a.title}</div><div class="activity-time">${a.time}</div></div>
        </div>
    `).join('');
}

// ============================================
// WORKS
// ============================================

async function loadWorks() {
    try {
        const res = await authFetch(`${API.WORKS}/getAllWorks`);
        const data = await res.json();
        const works = data.content || data;
        
        const grid = document.getElementById('worksGrid');
        if (!grid) return;
        
        if (!works || works.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-film"></i><h3>Hələ heç bir iş yoxdur</h3><p>Yeni iş əlavə etmək üçün "Yeni İş" düyməsinə klikləyin</p></div>`;
            return;
        }
        
        grid.innerHTML = '';
        works.forEach(w => {
            let imgUrl = cleanUrlPath(w.imageUrl || '');
            if(imgUrl && !imgUrl.startsWith('http')) imgUrl = `${UPLOADS_URL}${imgUrl}`;
            
            const card = document.createElement('div');
            card.className = 'work-card';
            card.innerHTML = `
                <img src="${imgUrl || 'https://via.placeholder.com/400x225/6366f1/ffffff?text=No+Image'}" class="work-image" alt="${w.title}" onerror="this.src='https://via.placeholder.com/400x225/6366f1/ffffff?text=${encodeURIComponent(w.title)}'">
                <div class="work-body">
                    <h3 class="work-title">${w.title}</h3>
                    <div class="work-meta">
                        <div class="work-client"><i class="fas fa-user"></i> ${w.clientName || 'N/A'}</div>
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
        console.error('loadWorks error:', e);
    }
}

function switchView(view) {
    const grid = document.getElementById('worksGrid');
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) btn.classList.add('active');
    });
    if (view === 'list') grid.classList.add('list-view');
    else grid.classList.remove('list-view');
}

function searchWorks() {
    const searchTerm = document.getElementById('workSearch').value.toLowerCase();
    document.querySelectorAll('.work-card').forEach(card => {
        const title = card.querySelector('.work-title').textContent.toLowerCase();
        const client = card.querySelector('.work-client').textContent.toLowerCase();
        card.style.display = (title.includes(searchTerm) || client.includes(searchTerm)) ? '' : 'none';
    });
}

function filterWorks() {
    const category = document.getElementById('categoryFilter').value;
    document.querySelectorAll('.work-card').forEach(card => {
        const workCategory = card.querySelector('.work-category').textContent;
        card.style.display = (!category || workCategory === category) ? '' : 'none';
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
            method: id ? 'PUT' : 'POST', body: fd 
        });
        if(res.ok) {
            Swal.fire('Uğurlu!', 'İş yadda saxlanıldı', 'success');
            bootstrap.Modal.getInstance(document.getElementById('workModal')).hide();
            loadWorks(); loadDashboard();
        } else { Swal.fire('Xəta', await res.text(), 'error'); }
    } catch(e) { Swal.fire('Xəta', e.message, 'error'); }
}

async function deleteWork(id) {
    const r = await Swal.fire({title: 'Silinsin?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sil', cancelButtonText: 'Ləğv'});
    if(r.isConfirmed) {
        await authFetch(`${API.WORKS}/deleteWork/${id}`, { method: 'DELETE' });
        Swal.fire('Silindi', '', 'success');
        loadWorks(); loadDashboard();
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
                    <div style="display:inline-flex;padding:0.5rem 0.875rem;border-radius:8px;font-size:0.8rem;font-weight:600;margin-bottom:1rem;background:${hasVideo?'rgba(16,185,129,0.1)':'rgba(148,163,184,0.1)'};color:${hasVideo?'#10b981':'#94a3b8'}">${hasVideo ? '✅ Video var' : '📹 Video yoxdur'}</div>
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
            method: id ? 'PUT' : 'POST', body: fd 
        });
        if(res.ok) {
            Swal.fire('Uğurlu!', 'Xidmət yadda saxlanıldı', 'success');
            bootstrap.Modal.getInstance(document.getElementById('serviceModal')).hide();
            loadServices(); loadDashboard();
        } else { Swal.fire('Xəta', await res.text(), 'error'); }
    } catch(e) { Swal.fire('Xəta', e.message, 'error'); }
}

async function deleteService(id) {
    const r = await Swal.fire({
        title: 'Bu xidməti silmək istədiyinizdən əminsiniz?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sil',
        cancelButtonText: 'Ləğv'
    });
    
    if(r.isConfirmed) {
        try {
            const response = await authFetch(`${API.SERVICES}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok || response.status === 204) {
                Swal.fire('Silindi!', 'Xidmət uğurla silindi', 'success');
                loadServices();
                loadDashboard();
            } else {
                Swal.fire('Xəta', 'Xidmət silinərkən xəta baş verdi', 'error');
            }
        } catch (error) {
            console.error('Silmə xətası:', error);
            Swal.fire('Xəta', 'Xidmət silinərkən xəta baş verdi', 'error');
        }
    }
}

// ============================================
// MESSAGES
// ============================================

async function loadMessages() {
    const list = document.getElementById('messagesList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:#64748b"><i class="fas fa-spinner fa-spin" style="font-size:2rem"></i><p style="margin-top:1rem">Yüklənir...</p></div>';
    
    try {
        const res = await authFetch(`${API.CONTACTS}/allMessages`);
        if(!res || !res.ok) {
            list.innerHTML = `<div style="text-align:center;padding:3rem"><h4>Mesajlar Yüklənmədi</h4><button onclick="loadMessages()">Yenidən Yoxla</button></div>`;
            return;
        }
        
        const messages = await res.json();
        if (!Array.isArray(messages) || messages.length === 0) {
            list.innerHTML = `<div style="text-align:center;padding:4rem"><h4>Hələ heç bir mesaj yoxdur</h4></div>`;
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
                <div style="padding:1.25rem;background:#f8fafc;border-radius:12px;margin-bottom:0.75rem;display:flex;align-items:center;gap:1rem;cursor:pointer" onclick="viewMessage(${m.id}, '${(m.name || '').replace(/'/g, "\\'")}', '${(m.email || '').replace(/'/g, "\\'")}', '${(m.message || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}')">
                    <div style="width:48px;height:48px;background:${statusBg};border-radius:12px;display:flex;align-items:center;justify-content:center;color:${statusColor}"><i class="fas fa-envelope"></i></div>
                    <div style="flex:1;min-width:0">
                        <div style="font-weight:700;color:#0f172a;margin-bottom:0.25rem">${m.name || 'Anonim'}</div>
                        <div style="font-size:0.875rem;color:#64748b;margin-bottom:0.25rem">${m.email || 'email yoxdur'}</div>
                        <div style="font-size:0.875rem;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(m.message || '').substring(0,80)}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                        <span style="padding:0.375rem 0.75rem;background:${statusBg};color:${statusColor};border-radius:8px;font-size:0.75rem;font-weight:600;display:inline-block;margin-bottom:0.5rem">${statusText}</span>
                        <div style="font-size:0.75rem;color:#94a3b8">${formatDate(m.sentAt)}</div>
                    </div>
                    <button onclick="event.stopPropagation();deleteMessage(${m.id})" style="background:rgba(239,68,68,0.1);color:#ef4444;padding:0.5rem 1rem;border:none;border-radius:8px;cursor:pointer;font-weight:600;"><i class="fas fa-trash"></i> Sil</button>
                </div>
            `;
        });
    } catch(e) { console.error(e); }
}

async function viewMessage(id, name, email, message) {
    await Swal.fire({
        title: `<strong>Mesaj: ${name}</strong>`,
        html: `<div style="text-align:left;padding:1rem"><p><strong>Email:</strong> ${email}</p><hr><p>${message}</p></div>`,
        icon: 'info', confirmButtonText: 'Bağla'
    });
    try { await authFetch(`${API.CONTACTS}/${id}/read`, { method: 'PATCH' }); loadMessages(); loadDashboard(); } catch (e) {}
}

async function deleteMessage(id) {
    const r = await Swal.fire({title: 'Mesaj silinsin?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sil'});
    if(r.isConfirmed) {
        await authFetch(`${API.CONTACTS}/${id}`, { method: 'DELETE' });
        loadMessages(); loadDashboard();
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
        } else { Swal.fire('Xəta', await res.text(), 'error'); }
    } catch(e) { Swal.fire('Xəta', e.message, 'error'); }
}
// ============================================
// THEME & INIT
// ============================================
const themeCheckbox = document.getElementById('themeCheckbox');
if (localStorage.getItem('theme') === 'dark') {
document.body.classList.add('dark-mode');
if (themeCheckbox) themeCheckbox.checked = true;
}
document.getElementById('themeToggleNav')?.addEventListener('click', () => {
document.body.classList.toggle('dark-mode');
localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});
checkAuth();