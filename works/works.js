(function() {
    'use strict';

    // ============================================================
    // 0. GLOBAL DƏYİŞƏNLƏR & ELEMENTLƏR
    // ============================================================
    const BACKEND_URL = "https://cinechord-admin-production.up.railway.app";
    const API_WORKS = `${BACKEND_URL}/api/works`;
    const UPLOADS_URL = `${BACKEND_URL}/uploads/`;
    
    // Əsas elementlər
    const container = document.getElementById('dynamic-projects-grid');
    const loadingScreen = document.querySelector('.loading-screen');
    const pageTransition = document.querySelector('.page-transition');
    
    // Menu Elementlər
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const hamburgerText = document.querySelector('.hamburger-text');
    const navBtns = document.querySelectorAll('.nav-btn');
    const centerLogo = document.querySelector('.center-logo');

    // Kateqoriyalar
    const categoryMap = { 
        'FILM': 'films', 'COMMERCIAL': 'commercial', 'CLIP': 'clips',
        'MUSIC_VIDEO': 'clips', 'DOCUMENTARY': 'films', 'SOCIAL': 'commercial'
    };

    // Video Modal Elementləri
    const previewContainer = document.getElementById('previewContainer');
    const previewVideo = document.getElementById('previewVideo');
    const previewTitleEl = document.getElementById('previewTitle');
    const closePreview = document.getElementById('closePreview'); 
    const modalPlayContainer = document.getElementById('modalPlayBtnContainer');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressPlayed = document.getElementById('progressPlayed');
    const currentTimeEl = document.getElementById('currentTime');
    const durationTimeEl = document.getElementById('durationTime');
    const volumeSlider = document.getElementById('volumeSlider');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    let activityTimeout = null;
    const INACTIVITY_DELAY = 2000;

    // ============================================================
    // 1. PAGE LOAD & TRANSITION
    // ============================================================
    
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 100);
    }

    if (pageTransition) {
        setTimeout(() => {
            pageTransition.classList.add('page-loaded'); 
        }, 100);
    }

    // ============================================================
    // 2. MENU SİSTEMİ (Mobil Menyu) - FIX: JUMP PROBLEMİ HƏLLİ
    // ============================================================

    function toggleMenu() {
        if (!hamburger || !mobileMenu) return;

        const isActive = hamburger.classList.contains('active');
        
        // Scrollbar genişliyini hesabla
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        
        if (hamburgerText) {
            hamburgerText.textContent = isActive ? 'MENU' : 'CLOSE';
        }
        
        // FIX: Scrollbar compensation - Jump problemini həll edir
        if (!isActive) {
            // Menu açılır
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = scrollbarWidth + 'px';
            // Fixed elementləri də kompensasiya et
            if (hamburger) hamburger.style.paddingRight = scrollbarWidth + 'px';
            if (centerLogo) centerLogo.style.paddingRight = scrollbarWidth + 'px';
        } else {
            // Menu bağlanır
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            if (hamburger) hamburger.style.paddingRight = '';
            if (centerLogo) centerLogo.style.paddingRight = '';
        }
    }

    if (hamburger) {
        hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            toggleMenu();
        });
    }

    // FIX 2: ESC düyməsi - Əvvəl video modal, sonra menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Əvvəl video modal yoxla
            if (previewContainer && previewContainer.classList.contains('active')) {
                closeVideoPreview();
                return;
            }
            // Sonra menu
            if (hamburger && hamburger.classList.contains('active')) {
                toggleMenu();
            }
        }
    });

    // MENU LİNKLƏRİ - XÜSUSİ EVENT
    navBtns.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (!href || href === '#' || this.classList.contains('active')) {
                e.preventDefault();
                if (href !== '#') toggleMenu();
                return;
            }

            e.preventDefault();
            toggleMenu(); 

            if (pageTransition) {
                pageTransition.classList.remove('page-loaded');
            }

            setTimeout(() => {
                window.location.href = href;
            }, 600);
        });
    });

    // ============================================================
    // 3. WORKS API & GRID
    // ============================================================
    
    function cleanUrlPath(url) {
        if (url && typeof url === 'string') {
            if (url.startsWith('http')) return url;
            if (url.startsWith('/uploads/')) return url.substring('/uploads/'.length);
            if (!url.startsWith('/') && url.includes('.')) return url;
        }
        return url;
    }

    async function loadDynamicWorks() {
        if(!container) return;
        
        try {
            const response = await fetch(API_WORKS);
            if (!response.ok) throw new Error('API Error');
            
            const data = await response.json();
            const works = data.content ? data.content : data;
            container.innerHTML = ''; 

            if(works.length === 0) {
                container.innerHTML = '<p style="color:white; text-align:center;">No works found.</p>';
                return;
            }

            works.forEach((work, index) => {
                let videoSrc = work.previewVideoUrl || work.videoUrl;
                let imageSrc = work.imageUrl;
                
                if (videoSrc) {
                    videoSrc = cleanUrlPath(videoSrc);
                    if (!videoSrc.startsWith('http')) videoSrc = UPLOADS_URL + videoSrc;
                }
                if (imageSrc) {
                    imageSrc = cleanUrlPath(imageSrc);
                    if (!imageSrc.startsWith('http')) imageSrc = UPLOADS_URL + imageSrc;
                }
                
                const categoryClass = categoryMap[work.category] || 'other';
                
                const workHTML = `
                    <div class="project-card reveal-item" 
                        data-category="${categoryClass}" 
                        data-video-src="${videoSrc}" 
                        data-title="${work.title}"
                        style="transition-delay: ${index * 0.05}s;">
                        <div class="project-image-container">
                            <video muted loop playsinline class="project-video" preload="none"
                                poster="${imageSrc || ''}" data-video-src="${videoSrc}"
                                onloadeddata="this.style.opacity='1'" style="opacity: 1;">
                            </video>
                            <div class="card-overlay"></div>
                            <div class="card-info">
                                <h3 class="card-title">${work.title}</h3>
                                <p style="font-size: 12px; opacity: 0.7;">${work.clientName || ''}</p>
                            </div>
                        </div>
                        <button class="fullscreen-btn" data-video-src="${videoSrc}" data-title="${work.title}"></button>
                    </div>
                `;
                container.innerHTML += workHTML;
            });
            
            const newCards = container.querySelectorAll('.project-card');
            newCards.forEach(card => observer.observe(card));

            attachHoverEffects();
            
        } catch (error) {
            console.error("API Error:", error);
        }
    }

    function attachHoverEffects() {
        document.querySelectorAll('.project-card').forEach(card => {
            const video = card.querySelector('video');
            if (!video) return;

            let isVideoLoaded = false;

            card.addEventListener('mouseenter', () => {
                if (!isVideoLoaded) {
                    const videoSrc = video.getAttribute('data-video-src');
                    if (videoSrc) {
                        video.src = videoSrc;
                        video.load();
                        isVideoLoaded = true;
                    }
                }
                video.play().catch(() => {});
            });

            card.addEventListener('mouseleave', () => { 
                video.pause(); 
                video.currentTime = 0; 
            });
        });
    }

    window.filterWorks = function(category, btn) {
        if(btn) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        const cards = document.querySelectorAll('.project-card');
        cards.forEach(card => {
            const cardCat = card.getAttribute('data-category');
            if (category === 'all' || cardCat === category) {
                card.style.display = 'block';
                setTimeout(() => card.classList.add('active'), 50); 
            } else {
                card.style.display = 'none';
                card.classList.remove('active');
            }
        });
    };

    // ============================================================
    // 4. SCROLL REVEAL
    // ============================================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.hero-left-title, .hero-right-content, .scroll-down-arrow, .category-section, .main-footer').forEach(el => {
        el.classList.add('reveal-item');
        observer.observe(el);
    });

    // ============================================================
    // 5. VIDEO MODAL
    // ============================================================
    
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function handleUserActivity() {
        if(!previewContainer) return;
        previewContainer.classList.remove('user-inactive');
        clearTimeout(activityTimeout);
        if (previewVideo && !previewVideo.paused) {
            activityTimeout = setTimeout(() => {
                previewContainer.classList.add('user-inactive');
            }, INACTIVITY_DELAY);
        }
    }

    function openModal(videoSrc, title) {
        if (!videoSrc) return;
        if(previewTitleEl) previewTitleEl.textContent = title;
        
        previewContainer.style.display = 'flex';
        setTimeout(() => {
            previewContainer.classList.add('active');
        }, 10);
        
        previewContainer.classList.add('is-paused');
        document.body.style.overflow = 'hidden';

        previewVideo.src = videoSrc;
        previewVideo.load();
    }

    function closeVideoPreview() {
        if(!previewContainer) return;
        previewContainer.classList.remove('active');
        previewContainer.classList.add('is-paused');
        previewContainer.classList.remove('user-inactive');
        document.body.style.overflow = 'auto';

        setTimeout(() => {
            previewVideo.pause();
            previewVideo.currentTime = 0;
            previewVideo.removeAttribute('src');
            previewContainer.style.display = 'none';
        }, 500);
    }

    function togglePlay(e) {
        if(e) e.stopPropagation();
        previewVideo.paused ? previewVideo.play() : previewVideo.pause();
    }

    function updatePlayButtonUI() {
        const modalPlayText = modalPlayContainer ? modalPlayContainer.querySelector('.play-text') : null;
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        
        if (previewVideo.paused) {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if(modalPlayText) modalPlayText.textContent = 'PLAY';
            previewContainer.classList.add('is-paused');
            previewContainer.classList.remove('user-inactive');
        } else {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if(modalPlayText) modalPlayText.textContent = 'PAUSE';
            previewContainer.classList.remove('is-paused');
            handleUserActivity();
        }
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('.fullscreen-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.fullscreen-btn');
            openModal(btn.getAttribute('data-video-src'), btn.getAttribute('data-title'));
        }
        if (e.target.closest('#playPauseBtn') || e.target.closest('#modalPlayBtnContainer')) {
             e.stopPropagation();
             togglePlay();
        }
    });

    if (previewVideo) {
        previewVideo.addEventListener('click', togglePlay);
        previewVideo.addEventListener('play', updatePlayButtonUI);
        previewVideo.addEventListener('pause', updatePlayButtonUI);
        previewVideo.addEventListener('timeupdate', () => {
            const percent = (previewVideo.currentTime / previewVideo.duration) * 100;
            if(progressPlayed) progressPlayed.style.width = percent + '%';
            if(currentTimeEl) currentTimeEl.textContent = formatTime(previewVideo.currentTime);
        });
        previewVideo.addEventListener('loadedmetadata', () => {
             if(durationTimeEl) durationTimeEl.textContent = formatTime(previewVideo.duration);
        });
    }

    if(closePreview) closePreview.onclick = closeVideoPreview;

    if(progressBarContainer) progressBarContainer.addEventListener('click', (e) => {
        const rect = progressBarContainer.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / progressBarContainer.clientWidth;
        previewVideo.currentTime = previewVideo.duration * percent;
    });

    if (previewContainer) {
        ['mousemove', 'click'].forEach(evt => previewContainer.addEventListener(evt, handleUserActivity));
    }

    // ============================================================
    // FIX 3: REWIND / FORWARD BUTTONS
    // ============================================================
    if (rewindBtn) {
        rewindBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (previewVideo) {
                previewVideo.currentTime = Math.max(0, previewVideo.currentTime - 5);
            }
        });
    }

    if (forwardBtn) {
        forwardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (previewVideo) {
                previewVideo.currentTime = Math.min(previewVideo.duration || 0, previewVideo.currentTime + 5);
            }
        });
    }

    // ============================================================
    // FIX 4: VOLUME SLIDER
    // ============================================================
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (previewVideo) {
                previewVideo.volume = e.target.value / 100;
            }
        });
        
        // İlkin volume dəyərini sync et
        if (previewVideo) {
            volumeSlider.value = previewVideo.volume * 100;
        }
    }

    // ============================================================
    // BONUS: FULLSCREEN BUTTON
    // ============================================================
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (previewContainer) {
                previewContainer.requestFullscreen().catch(err => {
                    console.log('Fullscreen error:', err);
                });
            }
        });
    }

    // ============================================================
    // 6. GLOBAL NAVİQASİYA
    // ============================================================
    
    function setupNavLinks() {
        const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])');
        
        internalLinks.forEach(link => {
            // Mobil Menunun içindəki linklərə toxunmuruq
            if (link.closest('.mobile-menu')) return;

            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href.startsWith('mailto') || href.startsWith('tel')) return;
                
                e.preventDefault();
                
                if (pageTransition) {
                    pageTransition.classList.remove('page-loaded');
                }
                
                setTimeout(() => {
                    window.location.href = href;
                }, 600);
            });
        });
    }

    // ============================================================
    // 7. INIT
    // ============================================================
    
    function init() {
        loadDynamicWorks();
        setupNavLinks();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();