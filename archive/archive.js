// archive.js - Backend ilə Bağlantılı Dinamik Archive

document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. API KONFİQURASİYASI
    // ============================================================
    const API_BASE_URL = "http://localhost:8080"; 
    const API_WORKS = `${API_BASE_URL}/admin/works/getAllWorks`; 
    const UPLOADS_URL = `${API_BASE_URL}/uploads/`; 
    
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
    // 1. KÖMƏKÇİ FUNKSİYALAR
    // ============================================================
    
    // URL-i təmizləmək
    function cleanUrlPath(url) {
        if (!url || typeof url !== 'string') return url;
        return url.replace(/^\/uploads\//, ''); 
    }

    // Tam video URL-i əldə etmək
    function getFullVideoUrl(videoUrl) {
        if (!videoUrl) return null;
        let url = videoUrl.trim();
        if (url.startsWith('/uploads/')) {
            return API_BASE_URL + url;
        } else if (url.startsWith('uploads/')) {
            return API_BASE_URL + '/' + url;
        } else if (!url.startsWith('http')) {
            return UPLOADS_URL + url;
        }
        return url;
    }

    // ============================================================
    // 2. BACKEND-DƏN İŞLƏRİ YÜKLƏMƏK
    // ============================================================
    async function loadArchiveData() {
        if (!tableBody) {
            console.error('Table body element tapılmadı');
            return;
        }

        try {
            console.log('📡 Archive data yüklənir...');
            
            const response = await fetch(API_WORKS);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            const works = data.content ? data.content : data;

            console.log('✅ Backend-dən gələn data:', works);

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

            console.log('✅ Archive table yaradıldı:', works.length, 'iş');

        } catch (error) {
            console.error('❌ Archive yüklənmə xətası:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 60px 20px; color: #EF4444;">
                        Serverlə əlaqə xətası. Zəhmət olmasa yenidən cəhd edin.
                    </td>
                </tr>
            `;
        }
    }

    // ============================================================
    // 3. TABLE ANİMASİYALARI
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
    // 4. TABLE ROW EFFEKTLƏRİ (Hover Scramble + Click)
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

                if (!videoSrc || videoSrc === '') {
                    console.warn('Video source yoxdur');
                    return;
                }

                openVideoPreview(videoSrc, title, client, category, year);
            });
        });
    }

    // ============================================================
    // 5. VİDEO PLAYER (MODAL)
    // ============================================================
    function openVideoPreview(videoUrl, title, client, category, year) {
        if (!previewContainer || !videoEl || !titleEl || !metaEl) {
            console.error('Video player elementləri tapılmadı');
            return;
        }

        // Loading göstər
        if (loadingEl) loadingEl.style.display = 'block';

        // Video source-u təyin et
        videoEl.src = videoUrl;
        
        // Info məlumatları
        titleEl.textContent = `${client} - ${title}`;
        metaEl.textContent = `${categoryTypeMap[category] || category} • ${year}`;

        // Reset custom controls
        const speedBtn = document.getElementById('speedBtn');
        if (speedBtn) {
            speedBtn.textContent = '1x';
            videoEl.playbackRate = 1;
        }

        // Loading-i gizlət
        videoEl.oncanplay = function() {
            if (loadingEl) loadingEl.style.display = 'none';
        };

        // Xəta işlətmə
        videoEl.onerror = function() {
            if (loadingEl) loadingEl.style.display = 'none';
            console.error('Video yüklənmə xətası:', videoUrl);
        };

        // Modal-ı aç
        setTimeout(() => {
            previewContainer.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Auto-play
            videoEl.play().catch(err => {
                console.log('Autoplay prevented:', err);
            });
        }, 10);
    }

    function closeVideoPreview() {
        if (!previewContainer || !videoEl) return;

        previewContainer.classList.remove('active');
        document.body.style.overflow = '';
        
        // Video-nu dayandır və sıfırla
        setTimeout(() => {
            videoEl.pause();
            videoEl.currentTime = 0;
            videoEl.src = '';
        }, 600);
    }

    // ============================================================
    // 6. VİDEO PLAYER KONTROLLAR
    // ============================================================
    function initVideoControls() {
        const customControls = document.getElementById('customControls');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        const skipBackBtn = document.getElementById('skipBackBtn');
        const skipForwardBtn = document.getElementById('skipForwardBtn');
        const progressSlider = document.getElementById('progressSlider');
        const progressPlayed = document.getElementById('progressPlayed');
        const progressBuffered = document.getElementById('progressBuffered');
        const currentTimeEl = document.getElementById('currentTime');
        const durationTimeEl = document.getElementById('durationTime');
        const muteBtn = document.getElementById('muteBtn');
        const volumeIcon = document.getElementById('volumeIcon');
        const muteIcon = document.getElementById('muteIcon');
        const volumeSlider = document.getElementById('volumeSlider');
        const speedBtn = document.getElementById('speedBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
        let currentSpeedIndex = 2;

        // Format time
        function formatTime(seconds) {
            if (isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        // Update play/pause button
        function updatePlayPauseButton() {
            if (videoEl.paused) {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            } else {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            }
        }

        // Update progress
        function updateProgress() {
            const percent = (videoEl.currentTime / videoEl.duration) * 100;
            progressPlayed.style.width = percent + '%';
            progressSlider.value = percent;
            currentTimeEl.textContent = formatTime(videoEl.currentTime);
        }

        // Update buffer
        function updateBuffer() {
            if (videoEl.buffered.length > 0) {
                const bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1);
                const percent = (bufferedEnd / videoEl.duration) * 100;
                progressBuffered.style.width = percent + '%';
            }
        }

        // Update duration
        function updateDuration() {
            durationTimeEl.textContent = formatTime(videoEl.duration);
        }

        // Update volume UI
        function updateVolumeUI() {
            const muted = videoEl.muted || videoEl.volume === 0;
            volumeIcon.style.display = muted ? 'none' : 'block';
            muteIcon.style.display = muted ? 'block' : 'none';
            volumeSlider.value = muted ? 0 : videoEl.volume * 100;
        }

        // Event listeners
        videoEl.addEventListener('timeupdate', updateProgress);
        videoEl.addEventListener('progress', updateBuffer);
        videoEl.addEventListener('loadedmetadata', updateDuration);
        videoEl.addEventListener('play', updatePlayPauseButton);
        videoEl.addEventListener('pause', updatePlayPauseButton);
        videoEl.addEventListener('volumechange', updateVolumeUI);

        // Play/Pause
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', function() {
                if (videoEl.paused) {
                    videoEl.play();
                } else {
                    videoEl.pause();
                }
            });
        }

        // Skip buttons
        if (skipBackBtn) {
            skipBackBtn.addEventListener('click', function() {
                videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
            });
        }

        if (skipForwardBtn) {
            skipForwardBtn.addEventListener('click', function() {
                videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + 10);
            });
        }

        // Progress slider
        if (progressSlider) {
            progressSlider.addEventListener('input', function() {
                const time = (this.value / 100) * videoEl.duration;
                videoEl.currentTime = time;
            });
        }

        // Mute button
        if (muteBtn) {
            muteBtn.addEventListener('click', function() {
                videoEl.muted = !videoEl.muted;
            });
        }

        // Volume slider
        if (volumeSlider) {
            volumeSlider.addEventListener('input', function() {
                videoEl.volume = this.value / 100;
                videoEl.muted = this.value == 0;
            });
        }

        // Speed button
        if (speedBtn) {
            speedBtn.addEventListener('click', function() {
                currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
                const speed = speeds[currentSpeedIndex];
                videoEl.playbackRate = speed;
                this.textContent = speed + 'x';
            });
        }

        // Fullscreen button
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', function() {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else if (videoEl.requestFullscreen) {
                    videoEl.requestFullscreen();
                } else if (videoEl.webkitRequestFullscreen) {
                    videoEl.webkitRequestFullscreen();
                }
            });
        }

        // Video click to toggle play/pause
        videoEl.addEventListener('click', function() {
            if (this.paused) {
                this.play();
            } else {
                this.pause();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (!previewContainer.classList.contains('active')) return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    if (videoEl.paused) {
                        videoEl.play();
                    } else {
                        videoEl.pause();
                    }
                    break;
                case 'ArrowLeft':
                    videoEl.currentTime -= 10;
                    break;
                case 'ArrowRight':
                    videoEl.currentTime += 10;
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    videoEl.volume = Math.min(1, videoEl.volume + 0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    videoEl.volume = Math.max(0, videoEl.volume - 0.1);
                    break;
                case 'f':
                case 'F':
                    if (videoEl.requestFullscreen) {
                        videoEl.requestFullscreen();
                    }
                    break;
                case 'm':
                case 'M':
                    videoEl.muted = !videoEl.muted;
                    break;
            }
        });
    }

    // ============================================================
    // 7. CLOSE MODAL EVENT
    // ============================================================
    if (closeBtn) {
        closeBtn.addEventListener('click', closeVideoPreview);
    }

    if (previewContainer) {
        previewContainer.addEventListener('click', function(e) {
            if (e.target === this) {
                closeVideoPreview();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && previewContainer && previewContainer.classList.contains('active')) {
            closeVideoPreview();
        }
    });

    // ============================================================
    // 8. DİGƏR FUNKSİYONALLIQ (Logo, Navbar, Progress Bar)
    // ============================================================
    
    // Center Logo Scroll Hide/Show
    (function() {
        const centerLogo = document.querySelector('.center-logo');
        if (!centerLogo) return;

        setTimeout(() => {
            centerLogo.classList.add('entry-done');
        }, 300);

        let lastScrollY = 0;
        let ticking = false;

        function updateLogoVisibility() {
            const currentScrollY = window.scrollY || window.pageYOffset;
            
            if (currentScrollY > 100) {
                centerLogo.classList.add('scroll-hidden');
            } else {
                centerLogo.classList.remove('scroll-hidden');
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(updateLogoVisibility);
                ticking = true;
            }
        }, { passive: true });

        updateLogoVisibility();
    })();

    // Navbar Hide/Show on Scroll
    (function() {
        const header = document.querySelector('.header');
        if (!header) return;

        let lastScroll = 0;

        function handleScroll() {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            
            if (currentScroll > lastScroll && currentScroll > 50) {
                header.classList.add('navbar-hide');
                header.classList.remove('navbar-show');
            } else {
                header.classList.remove('navbar-hide');
                header.classList.add('navbar-show');
            }
            
            lastScroll = currentScroll;
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        header.classList.add('navbar-show');
    })();

    // Progress Bar Top
    (function() {
        const progress = document.querySelector('.progress-bar-top');
        if (!progress) return;
        
        function updateProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progress.style.width = scrollPercent + '%';
        }
        
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    })();

    // ============================================================
    // 9. BAŞLANĞIC - DİNAMİK DATA YÜKLƏMƏK
    // ============================================================
    
    // Video kontrollarını işə sal
    initVideoControls();
    
    // Backend-dən archive data-nı yüklə
    loadArchiveData();

    console.log('✅ Archive page scripts loaded');
    console.log('✅ Backend ilə əlaqə quruldu');
    console.log('✅ Keyboard shortcuts: SPACE=play/pause, ←→=seek 10s, ↑↓=volume, F=fullscreen, M=mute');

    // ============================================================
    // 10. PAGE TRANSITION - WORKS KİMİ
    // ============================================================
    
    // Get current page
    function getCurrentPage() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'archive.html';
    }

    // Navigate with transition
    function navigateWithTransition(href) {
        const pageTransition = document.querySelector('.page-transition');
        
        if (pageTransition) {
            pageTransition.classList.add('active');
        }
        
        setTimeout(() => {
            window.location.href = href;
        }, 600);
    }

    // Nav buttons with animated transitions
    const navBtns = document.querySelectorAll('.nav-btn:not(.disabled)');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href) return;
            
            const currentPage = getCurrentPage();
            const targetPage = href.split('/').pop();
            
            if (targetPage === currentPage || 
                (targetPage === '' && currentPage === 'archive.html')) {
                e.preventDefault();
                return;
            }
            
            e.preventDefault();
            navigateWithTransition(href);
        });
    });

    // Set active state for current page
    const currentPage = window.location.pathname.split('/').pop() || 'archive.html';
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        const btnText = btn.getAttribute('data-text')?.toLowerCase();
        
        if (!btnText) return;
        
        if (currentPage.includes('archive') && btnText === 'archive') {
            btn.classList.add('active');
        }
    });

    // Scramble effect for nav buttons
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-@#$%&*';
    
    navButtons.forEach(btn => {
        const originalText = btn.getAttribute('data-text');
        if (!originalText) return;
        
        const navText = btn.querySelector('.nav-text');
        if (!navText) return;
        
        navText.innerHTML = originalText.split('').map(char => 
            `<span>${char}</span>`
        ).join('');
        
        let interval = null;
        
        btn.addEventListener('mouseenter', function() {
            if (this.classList.contains('disabled') || this.classList.contains('active')) return;
            
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
                
                if (iteration >= originalText.length) {
                    clearInterval(interval);
                }
            }, 50);
        });
        
        btn.addEventListener('mouseleave', function() {
            clearInterval(interval);
            
            const spans = navText.querySelectorAll('span');
            spans.forEach((span, index) => {
                span.textContent = originalText[index];
            });
        });
    });
});