document.addEventListener('DOMContentLoaded', function () {

    // ============================================================
    // 0. KONFIQURASIYA
    // ============================================================
    const API_BASE = 'https://cinechord-admin-production.up.railway.app';

    // Token yönetimi
    function getToken() {
        return localStorage.getItem('token');
    }

    function setToken(token) {
        localStorage.setItem('token', token);
    }

    function clearToken() {
        localStorage.removeItem('token');
    }

    // ============================================================
    // 1. LOGIN
    // ============================================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    setToken(data.token);
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Giriş uğursuz!');
                }
            } catch (error) {
                console.error('Login xətası:', error);
                alert('Xəta baş verdi!');
            }
        });
    }

    // ============================================================
    // 2. LOGOUT
    // ============================================================
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearToken();
            window.location.href = 'index.html';
        });
    }

    // ============================================================
    // 3. SERVISLƏR YÜKLƏ
    // ============================================================
    async function loadServices() {
        try {
            const response = await fetch(`${API_BASE}/admin/services/getAll`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });

            const services = await response.json();
            renderServices(services);
        } catch (error) {
            console.error('Servislər yüklənmədi:', error);
        }
    }

    function renderServices(services) {
        const container = document.getElementById('servicesList');
        if (!container) return;

        container.innerHTML = services.map(service => `
            <div class="service-item" id="service-${service.id}">
                <h3>${service.title}</h3>
                <p>${service.description || ''}</p>
                <button onclick="editService(${service.id})">Redaktə</button>
                <button onclick="deleteService(${service.id})">Sil</button>
            </div>
        `).join('');
    }

    // ============================================================
    // 4. SERVİSİ SİL
    // ============================================================
    window.deleteService = async function(id) {
        if (!confirm('Bu xidməti silmək istədiyinizdən əminsiniz?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/admin/services/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok || response.status === 204) {
                alert('Xidmət silindi!');
                const element = document.getElementById(`service-${id}`);
                if (element) {
                    element.remove();
                }
            } else {
                alert('Xəta baş verdi!');
            }
        } catch (error) {
            console.error('Silmə xətası:', error);
            alert('Xidmət silinərkən xəta baş verdi!');
        }
    }

    // ============================================================
    // 5. SERVİS YARATMA
    // ============================================================
    const createServiceForm = document.getElementById('createServiceForm');
    if (createServiceForm) {
        createServiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(createServiceForm);

            try {
                const response = await fetch(`${API_BASE}/admin/services`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                    body: formData
                });

                if (response.ok) {
                    alert('Xidmət yaradıldı!');
                    createServiceForm.reset();
                    loadServices();
                } else {
                    alert('Xəta baş verdi!');
                }
            } catch (error) {
                console.error('Yaratma xətası:', error);
                alert('Xidmət yaradılarkən xəta!');
            }
        });
    }

    // ============================================================
    // 6. SERVİS YENİLƏMƏ
    // ============================================================
    window.editService = async function(id) {
        try {
            const response = await fetch(`${API_BASE}/admin/services/getAll`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const services = await response.json();
            const service = services.find(s => s.id === id);

            if (!service) {
                alert('Xidmət tapılmadı!');
                return;
            }

            const newTitle = prompt('Yeni başlıq:', service.title);
            if (!newTitle) return;

            const formData = new FormData();
            formData.append('title', newTitle);
            formData.append('description', service.description || '');

            const updateResponse = await fetch(`${API_BASE}/admin/services/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: formData
            });

            if (updateResponse.ok) {
                alert('Yeniləndi!');
                loadServices();
            } else {
                alert('Xəta!');
            }
        } catch (error) {
            console.error('Edit xətası:', error);
        }
    }

    // ============================================================
    // 7. İLKİN YÜKLƏMƏ
    // ============================================================
    if (document.getElementById('servicesList')) {
        loadServices();
    }
});