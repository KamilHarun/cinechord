document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. API KONFİQURASİYASI (PROXY UPDATED)
    // ============================================================
    
    // BACKEND_URL artıq lazım deyil (Proxy istifadə olunur)
    const BACKEND_URL = ""; 
    
    // API birbaşa eyni domaindən çağırılır (/api/...)
    // Diqqət: Sizin kodunuzda '/admin/works/getAllWorks' idi, amma Proxy '/api' ilə başlayır.
    // Ona görə '/api/admin/works/getAllWorks' olmalıdır.
    const API_WORKS = "/api/admin/works/getAllWorks"; 
    
    // Uploads qovluğu da eyni domaindən
    const UPLOADS_URL = "/uploads/"; 
    
    // Backend Enum-larını Frontend-ə çevirmək
    const categoryTypeMap = { 
        'FILM': 'FILM', 
        'COMMERCIAL': 'COMMERCIAL', 
        'CLIP': 'CLIP',
        'MUSIC_VIDEO': 'MUSIC VIDEO',
        'DOCUMENTARY': 'DOCUMENTARY',
        'SOCIAL': 'SOCIAL'
    };

    // HTML Elementləri
    const tableBody = document.querySelector('.archive-table tbody');
    const previewContainer = document.getElementById('previewContainer');
    const videoEl = document.getElementById('previewVideo');
    const titleEl = document.getElementById('previewTitle');
    const metaEl = document.getElementById('previewMeta');
    const loadingEl = document.querySelector('.video-loading');
    const closeBtn = document.getElementById('closePreview');

    // ============================================================
    // 1. FLASH FIX & PAGE TRANSITION
    // ============================================================
    const pageTransition = document.querySelector('.page-transition');
    if (pageTransition) {
        setTimeout(() => {
             pageTransition.classList.add('page-loaded'); 
        }, 100);
    }

    // ============================================================
    // 2. KÖMƏKÇİ FUNKSİYALAR
    // ============================================================
    
    // URL-i təmizləmək
    function cleanUrlPath(url) {
        if (!url || typeof url !== 'string') return url;
        return url.replace(/^\/uploads\//, ''); 
    }

    // Tam video URL-i əldə etmək (PROXY UYĞUNLAŞDIRILDI)
    function getFullVideoUrl(videoUrl) {
        if (!videoUrl) return null;
        let url = videoUrl.trim();
        
        // Artıq BACKEND_URL yoxdur, birbaşa '/' istifadə edirik
        if (url.startsWith('/uploads/')) {
            return url; // Eyni domaindədir
        } else if (url.startsWith('uploads/')) {
            return '/' + url;
        } else if (!url.startsWith('http')) {
            return UPLOADS_URL + url;
        }
        return url;
    }

    // ============================================================
    // 3. BACKEND-DƏN İŞLƏRİ YÜKLƏMƏK
    // ============================================================
    async function loadArchiveData() {
        if (!tableBody) return;

        try {
            // Proxy vasitəsilə sorğu göndərilir
            const response = await fetch(API_WORKS);
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            const works = data.content ? data.content : data;

            // Table-ı təmizlə
            tableBody.innerHTML = '';

            if (works.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 60px 20px; opacity: 0.5;">
                            Hələ ki, arxivdə iş yoxdur
                        </td>
                    </tr>
                `;
                return;
            }

            // Hər bir işi table-ə əlavə et
            works.forEach((work, index) => {
                const videoUrl = getFullVideoUrl(work.videoUrl);
                const previewUrl = getFullVideoUrl(work.previewVideoUrl);
                
                // Video URL prioritet: previewVideoUrl > videoUrl
                const videoSrc = previewUrl || videoUrl || '';
                
                const row = document.createElement('tr');
                row.setAttribute('data-video', videoSrc);
                row.setAttribute('data-title', work.title || '');
                row.setAttribute('data-client', work.clientName || '');
                row.setAttribute('data-category', work.category || '');
                row.setAttribute('data-year', work.productionYear || '');
                
                const categoryDisplay = categoryTypeMap[work.category] || work.category;
                
                row.innerHTML = `
                    <td class="number-col">${String(index + 1).padStart(2, '0')}</td>
                    <td class="client-col" data-original="${work.clientName || '-'}">${work.clientName || '-'}</td>
                    <td class="title-col" data-original="${work.title}">${work.title}</td>
                    <td class="type-col" data-original="${categoryDisplay}">${categoryDisplay}</td>
                    <td class="location-col" data-original="${work.location || '-'}">${work.location || '-'}</td>
                    <td class="agency-col" data-original="${work.agency || '-'}">${work.agency || '-'}</td>
                    <td class="year-col" data-original="${work.productionYear || '-'}">${work.productionYear || '-'}</td>
                `;
                
                tableBody.appendChild(row);
            });

            // Animasiyaları və effektləri aktivləşdir
            initTableAnimations();
            attachTableRowEffects();

        } catch (error) {
            console.error('❌ Archive yüklənmə xətası:', error);
        }
    }

    // ============================================================
    // 4. TABLE ANİMASİYALARI
    // ============================================================
    function initTableAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 50);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.archive-table tbody tr').forEach(row => {
            observer.observe(row);
        });
    }

    // ============================================================
    // 5. TABLE ROW EFFEKTLƏRİ (Hover Scramble + Click)
    // ============================================================
    function attachTableRowEffects() {
        const rows = document.querySelectorAll('.archive-table tbody tr');

        rows.forEach(row => {
            // Hər cell-də span-larla mətn bölünməsi (scramble effect üçün)
            const cells = row.querySelectorAll('td:not(.number-col)');
            cells.forEach(cell => {
                const originalText = cell.getAttribute('data-original') || cell.textContent;
                cell.setAttribute('data-original', originalText);
                cell.innerHTML = originalText.split('').map(char => 
                    char === ' ' ? ' ' : `<span>${char}</span>`
                ).join('');
            });

            // HOVER: Scramble effect
            row.addEventListener('mouseenter', function() {
                const hoverCells = this.querySelectorAll('td:not(.number-col)');
                const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                const preserveChars = 'ƏəŞşÜüİıÖöĞğÇç ';
                
                hoverCells.forEach(cell => {
                    const spans = cell.querySelectorAll('span');
                    const originalText = cell.getAttribute('data-original') || '';
                    
                    let iteration = 0;
                    const interval = setInterval(() => {
                        spans.forEach((span, index) => {
                            const originalChar = originalText[index];
                            if (index < iteration) {
                                span.textContent = originalChar;
                            } else if (preserveChars.includes(originalChar)) {
                                span.textContent = originalChar;
                            } else {
                                span.textContent = letters[Math.floor(Math.random() * letters.length)];
                            }
                        });
                        
                        iteration += 1/2.5;
                        
                        if (iteration >= originalText.length) {
                            clearInterval(interval);
                        }
                    }, 30);
                });
            });

            // CLICK: Video açmaq
            row.addEventListener('click', function() {
                const videoSrc = this.getAttribute('data-video');
                const title = this.getAttribute('data-title');
                const client = this.getAttribute('data-client');
                const category = this.getAttribute('data-category');
                const year = this.getAttribute('data-year');

                if (!videoSrc || videoSrc === '') return;

                openVideoPreview(videoSrc, title, client, category, year);
            });
        });
    }

    // ============================================================
    // 6. VİDEO PLAYER (MODAL)
    // ============================================================
    function openVideoPreview(videoUrl, title, client, category, year) {
        if (!previewContainer || !videoEl || !titleEl || !metaEl) return;

        if (loadingEl) loadingEl.style.display = 'block';

        videoEl.src = videoUrl;
        
        titleEl.textContent = `${client} - ${title}`;
        metaEl.textContent = `${categoryTypeMap[category] || category} • ${year}`;

        const speedBtn = document.getElementById('speedBtn');
        if (speedBtn) {
            speedBtn.textContent = '1x';
            videoEl.playbackRate = 1;
        }

        videoEl.oncanplay = function() {
            if (loadingEl) loadingEl.style.display = 'none';
        };

        videoEl.onerror = function() {
            if (loadingEl) loadingEl.style.display = 'none';
            console.error('Video yüklənmə xətası:', videoUrl);
        };

        setTimeout(() => {
            previewContainer.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            videoEl.play().catch(err => {
                console.log('Autoplay prevented:', err);
            });
        }, 10);
    }

    function closeVideoPreview() {
        if (!previewContainer || !videoEl) return;

        previewContainer.classList.remove('active');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            videoEl.pause();
            videoEl.currentTime = 0;
            videoEl.src = '';
        }, 600);
    }

    // ============================================================
    // 7. VİDEO KONTROLLARI
    // ============================================================
    function initVideoControls() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        
        function updatePlayPauseButton() {
            if (videoEl.paused) {
                if(playIcon) playIcon.style.display = 'block';
                if(pauseIcon) pauseIcon.style.display = 'none';
            } else {
                if(playIcon) playIcon.style.display = 'none';
                if(pauseIcon) pauseIcon.style.display = 'block';
            }
        }
        
        videoEl.addEventListener('play', updatePlayPauseButton);
        videoEl.addEventListener('pause', updatePlayPauseButton);
    }
    initVideoControls();

    if (closeBtn) closeBtn.addEventListener('click', closeVideoPreview);
    if (previewContainer) {
        previewContainer.addEventListener('click', function(e) {
            if (e.target === this) closeVideoPreview();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && previewContainer && previewContainer.classList.contains('active')) {
            closeVideoPreview();
        }
    });

    // ============================================================
    // 8. NAVİGASİYA MƏNTİQİ
    // ============================================================
    function navigateWithTransition(href) {
        if (pageTransition) {
             pageTransition.classList.remove('page-loaded'); 
             pageTransition.style.transition = 'none';
             pageTransition.classList.add('active');
        }
        setTimeout(() => { window.location.href = href; }, 600);
    }

    document.querySelectorAll('.nav-btn, .footer-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            if (!href || href === '#') return;
            
            if (!href.startsWith('#')) {
                e.preventDefault();
                navigateWithTransition(href);
            }
        });
    });

    // Nav Scramble
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-@#$%&*';
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const originalText = btn.getAttribute('data-text');
        if (!originalText) return;
        
        const navText = btn.querySelector('.nav-text');
        if (!navText) return;
        
        navText.innerHTML = originalText.split('').map(char => `<span>${char}</span>`).join('');
        
        let interval = null;
        btn.addEventListener('mouseenter', function() {
            if (this.classList.contains('active')) return;
            
            let iteration = 0;
            const spans = navText.querySelectorAll('span');
            clearInterval(interval);
            
            interval = setInterval(() => {
                spans.forEach((span, index) => {
                    if (index < iteration) {
                        span.textContent = originalText[index];
                    } else {
                        span.textContent = letters[Math.floor(Math.random() * letters.length)];
                    }
                });
                iteration += 0.33;
                if (iteration >= originalText.length) clearInterval(interval);
            }, 50);
        });
        
        btn.addEventListener('mouseleave', function() {
            if (this.classList.contains('active')) return;
            clearInterval(interval);
            const spans = navText.querySelectorAll('span');
            spans.forEach((span, index) => span.textContent = originalText[index]);
        });
    });

    // Backend-dən datanı yüklə
    loadArchiveData();
});