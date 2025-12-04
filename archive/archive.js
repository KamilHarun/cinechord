(function() {
    'use strict';

    /* ============================================================
       1. CONFIGURATION & CONSTANTS
       ============================================================ */
    const getBackendUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080';
        }
        return 'https://cinechord-admin-production.up.railway.app';
    };

    const CONFIG = {
        BACKEND_URL: getBackendUrl(),
        ENDPOINTS: {
            ARCHIVE: '/api/archive'
        },
        RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000,
        REQUEST_TIMEOUT: 10000,
        SCROLL_THROTTLE: 16,
        NAVBAR_HIDE_THRESHOLD: 200,
        LOGO_HIDE_THRESHOLD: 100,
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        RESIZE_DEBOUNCE: 250,
        INACTIVITY_DELAY: 2000
    };

    console.log('🔌 Backend URL:', CONFIG.BACKEND_URL);

    const API_URLS = {
        ARCHIVE: `${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.ARCHIVE}`,
        UPLOADS: `${CONFIG.BACKEND_URL}/uploads/`
    };

    const CATEGORY_MAP = {
        'FILM': 'FILM',
        'COMMERCIAL': 'COMMERCIAL',
        'CLIP': 'CLIP',
        'MUSIC_VIDEO': 'MUSIC VIDEO',
        'DOCUMENTARY': 'DOCUMENTARY',
        'SOCIAL': 'SOCIAL'
    };

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    const elements = {
        tableBody: document.querySelector('.archive-table tbody'),
        previewContainer: document.getElementById('previewContainer'),
        videoElement: document.getElementById('previewVideo'),
        previewTitle: document.getElementById('previewTitle'),
        previewMeta: document.getElementById('previewMeta'),
        videoLoading: document.querySelector('.video-loading'),
        closeButton: document.getElementById('closePreview'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        playIcon: document.getElementById('playIcon'),
        pauseIcon: document.getElementById('pauseIcon'),
        skipBackBtn: document.getElementById('skipBackBtn'),
        skipForwardBtn: document.getElementById('skipForwardBtn'),
        volumeSlider: document.getElementById('volumeSlider'),
        speedBtn: document.getElementById('speedBtn'),
        fullscreenBtn: document.getElementById('fullscreenBtn'),
        progressSlider: document.getElementById('progressSlider'),
        progressPlayed: document.getElementById('progressPlayed'),
        currentTimeDisplay: document.getElementById('currentTime'),
        durationTimeDisplay: document.getElementById('durationTime'),
        pageTransition: document.querySelector('.page-transition'),
        progressBarTop: document.querySelector('.progress-bar-top'),
        centerLogo: document.querySelector('.center-logo'),
        header: document.querySelector('.header'),
        modalPlayContainer: document.getElementById('modalPlayBtnContainer')
    };

    let lastScrollTop = 0;
    let isTransitioning = false;
    let activityTimeout = null;

    /* ============================================================
       3. UTILITY FUNCTIONS
       ============================================================ */
    function throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = new Date().getTime();
            if (now - lastCall < delay) return;
            lastCall = now;
            return func(...args);
        };
    }

    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function cleanUrlPath(url) {
        if (!url || typeof url !== 'string') return url;
        if (url.startsWith('http')) return url;
        return url.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
    }

    function getFullVideoUrl(videoUrl) {
        if (!videoUrl) return null;
        const url = videoUrl.trim();
        if (url.startsWith('http')) return url;
        const cleanedUrl = cleanUrlPath(url);
        return API_URLS.UPLOADS + cleanedUrl;
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function fetchWithTimeout(url, options = {}, timeout = CONFIG.REQUEST_TIMEOUT) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }

    async function retryFetch(fetchFn, attempts = CONFIG.RETRY_ATTEMPTS) {
        let lastError;
        for (let i = 0; i < attempts; i++) {
            try {
                return await fetchFn();
            } catch (error) {
                lastError = error;
                if (i < attempts - 1) {
                    const delay = CONFIG.RETRY_DELAY * Math.pow(2, i);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }

    /* ============================================================
       4. MOBILE NAVIGATION & HAMBURGER
       ============================================================ */
    function initMobileMenu() {
        const hamburger = document.createElement('div');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        hamburger.setAttribute('aria-label', 'Toggle menu');
        
        if (elements.header) {
            elements.header.appendChild(hamburger);
        }

        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            mobileMenu.appendChild(btn.cloneNode(true));
        });
        
        document.body.appendChild(overlay);
        document.body.appendChild(mobileMenu);

        function toggleMenu() {
            const isActive = hamburger.classList.contains('active');
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = isActive ? '' : 'hidden';
        }

        hamburger.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
        mobileMenu.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav-btn') || e.target.closest('.nav-btn')) {
                toggleMenu();
            }
        });

        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 768 && hamburger.classList.contains('active')) {
                    toggleMenu();
                }
            }, CONFIG.RESIZE_DEBOUNCE);
        });
    }

    /* ============================================================
       5. SCROLL EFFECTS
       ============================================================ */
    function updateScrollProgress() {
        if (!elements.progressBarTop) return;
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        elements.progressBarTop.style.width = Math.min(scrolled, 100) + '%';
    }

    function handleLogoScroll() {
        if (!elements.centerLogo) return;
        const scrollTop = window.pageYOffset;
        if (scrollTop > CONFIG.LOGO_HIDE_THRESHOLD) {
            elements.centerLogo.classList.add('scroll-hidden');
        } else {
            elements.centerLogo.classList.remove('scroll-hidden');
        }
    }

    function handleNavbarScroll() {
        if (!elements.header) return;
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            elements.header.style.transform = 'translateY(0)';
            lastScrollTop = currentScroll;
            return;
        }
        
        if (currentScroll > lastScrollTop && currentScroll > CONFIG.NAVBAR_HIDE_THRESHOLD) {
            elements.header.style.transform = 'translateY(-100%)';
        } else {
            elements.header.style.transform = 'translateY(0)';
        }
        lastScrollTop = currentScroll;
    }

    const handleScroll = throttle(() => {
        updateScrollProgress();
        handleLogoScroll();
        handleNavbarScroll();
    }, CONFIG.SCROLL_THROTTLE);

    function initScrollEffects() {
        window.addEventListener('scroll', handleScroll, { passive: true });
        updateScrollProgress();
        handleLogoScroll();
        handleNavbarScroll();
    }

    /* ============================================================
       6. PAGE TRANSITION SYSTEM
       ============================================================ */
    function initPageTransition() {
        if (!elements.pageTransition) return;
        
        setTimeout(() => {
            elements.pageTransition.classList.add('page-loaded');
        }, CONFIG.PAGE_LOAD_DELAY);
    }

    function navigateWithTransition(href) {
        if (isTransitioning) return;
        
        isTransitioning = true;
        
        if (elements.pageTransition) {
            elements.pageTransition.classList.remove('page-loaded');
        }
        
        setTimeout(() => {
            window.location.href = href;
        }, CONFIG.NAVIGATION_DELAY);
        
        setTimeout(() => {
            if (!document.hidden) {
                window.location.href = href;
            }
        }, CONFIG.FALLBACK_DELAY);
    }

    /* ============================================================
       7. DATA LOADING FROM BACKEND
       ============================================================ */
    async function loadArchiveData() {
        if (!elements.tableBody) return;

        elements.tableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="7" style="text-align: center; padding: 60px 20px; opacity: 0; animation: fadeIn 0.3s ease forwards;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #FFA500; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div style="margin-top: 15px; font-size: 13px;">Məlumatlar yüklənir...</div>
                </td>
            </tr>
        `;

        try {
            const response = await retryFetch(() => 
                fetchWithTimeout(API_URLS.ARCHIVE, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
            );

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const data = await response.json();
            const works = Array.isArray(data) ? data : (data.content || []);

            const loadingRow = elements.tableBody.querySelector('.loading-row');
            if (loadingRow) {
                loadingRow.style.opacity = '0';
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            elements.tableBody.innerHTML = '';

            if (works.length === 0) {
                elements.tableBody.innerHTML = `
                    <tr style="animation: fadeIn 0.5s ease;">
                        <td colspan="7" style="text-align: center; padding: 60px 20px; opacity: 0.5;">
                            <div style="font-size: 48px; margin-bottom: 15px;">📁</div>
                            <div style="font-size: 14px;">Hələ ki, arxivdə iş yoxdur</div>
                        </td>
                    </tr>
                `;
                return;
            }

            const batchSize = 10;
            let currentIndex = 0;

            function processBatch() {
                const batch = works.slice(currentIndex, currentIndex + batchSize);
                
                batch.forEach((work, index) => {
                    const globalIndex = currentIndex + index;
                    const videoUrl = getFullVideoUrl(work.previewVideoUrl || work.videoUrl);
                    const videoSrc = videoUrl || '';
                    
                    const row = document.createElement('tr');
                    row.setAttribute('data-video', videoSrc);
                    row.setAttribute('data-title', work.title || '');
                    row.setAttribute('data-client', work.clientName || '');
                    row.setAttribute('data-category', work.category || '');
                    row.setAttribute('data-year', work.productionYear || '');
                    
                    const categoryDisplay = CATEGORY_MAP[work.category] || work.category || '-';
                    
                    row.innerHTML = `
                        <td class="number-col">${String(globalIndex + 1).padStart(2, '0')}</td>
                        <td class="client-col" data-original="${work.clientName || '-'}">${work.clientName || '-'}</td>
                        <td class="title-col" data-original="${work.title || 'Untitled'}">${work.title || 'Untitled'}</td>
                        <td class="type-col" data-original="${categoryDisplay}">${categoryDisplay}</td>
                        <td class="location-col" data-original="${work.location || '-'}">${work.location || '-'}</td>
                        <td class="agency-col" data-original="${work.agency || '-'}">${work.agency || '-'}</td>
                        <td class="year-col" data-original="${work.productionYear || '-'}">${work.productionYear || '-'}</td>
                    `;
                    
                    elements.tableBody.appendChild(row);
                });
                
                currentIndex += batchSize;
                
                if (currentIndex < works.length) {
                    requestAnimationFrame(processBatch);
                } else {
                    initTableAnimations();
                    attachTableRowEffects();
                    console.log(`✅ Archive loaded successfully`);
                }
            }
            
            requestAnimationFrame(processBatch);

        } catch (error) {
            console.error('Archive load error:', error);
            elements.tableBody.innerHTML = `
                <tr style="animation: fadeIn 0.5s ease;">
                    <td colspan="7" style="text-align: center; padding: 60px 20px;">
                        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                        <div style="color: #FFA500; margin-bottom: 10px; font-size: 16px; font-weight: 600;">Xəta baş verdi</div>
                        <div style="opacity: 0.6; font-size: 12px; margin-bottom: 20px;">
                            ${error.message === 'Request timeout' 
                                ? 'Server cavab vermək üçün çox uzun müddət tələb edir.'
                                : 'Serverə qoşulma uğursuz oldu.'}
                        </div>
                        <button onclick="location.reload()" style="padding: 12px 24px; background: #FFA500; border: none; border-radius: 25px; color: #000; cursor: pointer; font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; letter-spacing: 1px;">
                            🔄 YENİDƏN YÜKLƏ
                        </button>
                    </td>
                </tr>
            `;
        }
    }

    /* ============================================================
       8. SCROLL REVEAL (INTERSECTION OBSERVER)
       ============================================================ */
    function initTableAnimations() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.archive-table tbody tr').forEach(row => {
            observer.observe(row);
        });
    }

    /* ============================================================
       9. TABLE ROW EFFECTS & SCRAMBLE
       ============================================================ */
    function attachTableRowEffects() {
        const rows = document.querySelectorAll('.archive-table tbody tr');
        const scrambleLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        rows.forEach(row => {
            const cells = row.querySelectorAll('td:not(.number-col)');
            cells.forEach(cell => {
                const originalText = cell.getAttribute('data-original') || cell.textContent;
                cell.setAttribute('data-original', originalText);
            });

            row.addEventListener('mouseenter', function() {
                const hoverCells = this.querySelectorAll('td:not(.number-col)');
                hoverCells.forEach(cell => {
                    const originalText = cell.getAttribute('data-original') || '';
                    let iteration = 0;
                    const interval = setInterval(() => {
                        let newText = '';
                        for (let i = 0; i < originalText.length; i++) {
                            if (i < iteration) {
                                newText += originalText[i];
                            } else {
                                newText += scrambleLetters[Math.floor(Math.random() * scrambleLetters.length)];
                            }
                        }
                        cell.textContent = newText;
                        iteration += 1 / 2.5;
                        if (iteration >= originalText.length) {
                            clearInterval(interval);
                            cell.textContent = originalText;
                        }
                    }, 30);
                    cell.dataset.scrambleInterval = interval;
                });
            });

            row.addEventListener('mouseleave', function() {
                const cells = this.querySelectorAll('td:not(.number-col)');
                cells.forEach(cell => {
                    if (cell.dataset.scrambleInterval) {
                        clearInterval(parseInt(cell.dataset.scrambleInterval));
                    }
                    cell.textContent = cell.getAttribute('data-original') || '';
                });
            });

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

    /* ============================================================
       10. USER INACTIVITY DETECTION
       ============================================================ */
    function handleUserActivity() {
        if (!elements.previewContainer) return;
        elements.previewContainer.classList.remove('user-inactive');
        clearTimeout(activityTimeout);
        
        if (elements.videoElement && !elements.videoElement.paused) {
            activityTimeout = setTimeout(() => {
                elements.previewContainer.classList.add('user-inactive');
            }, CONFIG.INACTIVITY_DELAY);
        }
    }

    /* ============================================================
       11. VIDEO PREVIEW MODAL
       ============================================================ */
    function openVideoPreview(videoUrl, title, client, category, year) {
        if (!elements.previewContainer || !elements.videoElement) return;

        if (elements.videoLoading) {
            elements.videoLoading.style.display = 'block';
        }

        elements.videoElement.src = videoUrl;
        
        if (elements.previewTitle) {
            elements.previewTitle.textContent = `${client} - ${title}`;
            elements.previewTitle.setAttribute('data-text', `${client} - ${title}`);
        }
        
        if (elements.previewMeta) {
            const categoryDisplay = CATEGORY_MAP[category] || category;
            elements.previewMeta.textContent = `${categoryDisplay} • ${year}`;
        }

        if (elements.speedBtn) {
            elements.speedBtn.textContent = '1x';
            elements.videoElement.playbackRate = 1;
        }

        elements.videoElement.oncanplay = function() {
            if (elements.videoLoading) {
                elements.videoLoading.style.display = 'none';
            }
        };

        setTimeout(() => {
            elements.previewContainer.classList.add('active');
            elements.previewContainer.classList.add('is-paused');
            document.body.style.overflow = 'hidden';
        }, 10);
    }

    function closeVideoPreview() {
        if (!elements.previewContainer || !elements.videoElement) return;
        elements.previewContainer.classList.remove('active');
        elements.previewContainer.classList.add('is-paused');
        elements.previewContainer.classList.remove('user-inactive');
        clearTimeout(activityTimeout);
        document.body.style.overflow = '';
        
        setTimeout(() => {
            elements.videoElement.pause();
            elements.videoElement.currentTime = 0;
            elements.videoElement.src = '';
        }, 500);
    }

    /* ============================================================
       12. VIDEO PLAYER CONTROLS
       ============================================================ */
    function initVideoControls() {
        if (!elements.videoElement) return;

        if (elements.playPauseBtn) {
            elements.playPauseBtn.addEventListener('click', () => {
                if (elements.videoElement.paused) {
                    elements.videoElement.play();
                } else {
                    elements.videoElement.pause();
                }
            });
        }

        if (elements.skipBackBtn) {
            elements.skipBackBtn.addEventListener('click', () => {
                elements.videoElement.currentTime = Math.max(0, elements.videoElement.currentTime - 10);
                handleUserActivity();
            });
        }

        if (elements.skipForwardBtn) {
            elements.skipForwardBtn.addEventListener('click', () => {
                elements.videoElement.currentTime = Math.min(
                    elements.videoElement.duration,
                    elements.videoElement.currentTime + 10
                );
                handleUserActivity();
            });
        }

        if (elements.volumeSlider) {
            elements.volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                elements.videoElement.volume = volume;
                handleUserActivity();
            });
        }

        if (elements.speedBtn) {
            const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
            let currentSpeedIndex = 2;
            elements.speedBtn.addEventListener('click', () => {
                currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
                const newSpeed = speeds[currentSpeedIndex];
                elements.videoElement.playbackRate = newSpeed;
                elements.speedBtn.textContent = `${newSpeed}x`;
            });
        }

        if (elements.fullscreenBtn) {
            elements.fullscreenBtn.addEventListener('click', () => {
                if (elements.videoElement.requestFullscreen) {
                    elements.videoElement.requestFullscreen();
                }
            });
        }

        if (elements.progressSlider) {
            elements.progressSlider.addEventListener('input', (e) => {
                const time = (e.target.value / 100) * elements.videoElement.duration;
                elements.videoElement.currentTime = time;
                handleUserActivity();
            });
        }

        elements.videoElement.addEventListener('play', updatePlayPauseButton);
        elements.videoElement.addEventListener('pause', updatePlayPauseButton);
        elements.videoElement.addEventListener('timeupdate', updateProgress);
        elements.videoElement.addEventListener('loadedmetadata', updateDuration);
    }

    function updatePlayPauseButton() {
        if (!elements.videoElement) return;
        if (elements.videoElement.paused) {
            if (elements.playIcon) elements.playIcon.style.display = 'block';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'none';
            elements.previewContainer.classList.add('is-paused');
            clearTimeout(activityTimeout);
        } else {
            if (elements.playIcon) elements.playIcon.style.display = 'none';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'block';
            elements.previewContainer.classList.remove('is-paused');
            handleUserActivity();
        }
    }

    function updateProgress() {
        if (!elements.videoElement || !elements.progressSlider) return;
        const progress = (elements.videoElement.currentTime / elements.videoElement.duration) * 100;
        elements.progressSlider.value = progress || 0;
        if (elements.progressPlayed) {
            elements.progressPlayed.style.width = `${progress}%`;
        }
        if (elements.currentTimeDisplay) {
            elements.currentTimeDisplay.textContent = formatTime(elements.videoElement.currentTime);
        }
    }

    function updateDuration() {
        if (!elements.videoElement || !elements.durationTimeDisplay) return;
        elements.durationTimeDisplay.textContent = formatTime(elements.videoElement.duration);
    }

    /* ============================================================
       13. NAVIGATION & SCRAMBLE
       ============================================================ */
    function setupNavButtons() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const href = btn.getAttribute('href');
                if (!href || href === '#' || href.startsWith('#')) return;
                if (href === window.location.pathname.split('/').pop()) return;
                e.preventDefault();
                navigateWithTransition(href);
            });
        });
    }

    function initNavigation() {
        setupNavButtons();
        setTimeout(setupNavButtons, 100);

        if (window.innerWidth > 768) {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            document.querySelectorAll('.nav-btn').forEach(btn => {
                const originalText = btn.getAttribute('data-text');
                if (!originalText) return;
                const navText = btn.querySelector('.nav-text');
                if (!navText) return;

                btn.addEventListener('mouseenter', function() {
                    if (this.classList.contains('active')) return;
                    let iteration = 0;
                    let interval = setInterval(() => {
                        navText.innerText = originalText.split("").map((letter, index) => {
                            if(index < iteration) return originalText[index];
                            return letters[Math.floor(Math.random() * letters.length)];
                        }).join("");
                        if(iteration >= originalText.length) clearInterval(interval);
                        iteration += 1/3;
                    }, 30);
                });
                
                btn.addEventListener('mouseleave', function() {
                    if (this.classList.contains('active')) return;
                    navText.innerText = originalText;
                });
            });
        }
    }

    /* ============================================================
       14. KEYBOARD SHORTCUTS
       ============================================================ */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!elements.previewContainer?.classList.contains('active')) return;
            const handledKeys = ['Space', 'ArrowLeft', 'ArrowRight', 'KeyF', 'Escape'];
            if (handledKeys.includes(e.code)) e.preventDefault();

            switch(e.code) {
                case 'Space':
                    if (elements.videoElement.paused) {
                        elements.videoElement.play();
                    } else {
                        elements.videoElement.pause();
                    }
                    break;
                case 'ArrowLeft':
                    elements.videoElement.currentTime = Math.max(0, elements.videoElement.currentTime - 5);
                    handleUserActivity();
                    break;
                case 'ArrowRight':
                    elements.videoElement.currentTime = Math.min(
                        elements.videoElement.duration,
                        elements.videoElement.currentTime + 5
                    );
                    handleUserActivity();
                    break;
                case 'KeyF':
                    if (elements.videoElement.requestFullscreen) {
                        elements.videoElement.requestFullscreen();
                    }
                    break;
                case 'Escape':
                    closeVideoPreview();
                    break;
            }
        });
    }

    /* ============================================================
       15. EVENT LISTENERS
       ============================================================ */
    function initEventListeners() {
        if (elements.closeButton) {
            elements.closeButton.addEventListener('click', closeVideoPreview);
        }

        if (elements.previewContainer) {
            ['mousemove', 'click', 'touchstart'].forEach(event => {
                elements.previewContainer.addEventListener(event, handleUserActivity);
            });
            
            elements.previewContainer.addEventListener('click', (e) => {
                if (e.target === elements.previewContainer) {
                    closeVideoPreview();
                }
            });
        }

        if (elements.modalPlayContainer) {
            elements.modalPlayContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                if (elements.videoElement.paused) {
                    elements.videoElement.play();
                } else {
                    elements.videoElement.pause();
                }
            });
        }
    }

    /* ============================================================
       16. LOGO ENTRY ANIMATION
       ============================================================ */
    function initLogoAnimation() {
        setTimeout(() => { 
            if (elements.centerLogo) elements.centerLogo.classList.add('entry-done'); 
        }, 500);
    }

    /* ============================================================
       17. INITIALIZATION
       ============================================================ */
    function init() {
        initPageTransition();
        initScrollEffects();
        initMobileMenu();
        initNavigation();
        initVideoControls();
        initKeyboardShortcuts();
        initEventListeners();
        initLogoAnimation();
        loadArchiveData();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();