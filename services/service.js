(function() {
    'use strict';

    /* ============================================================
        1. CONFIGURATION & API
        ============================================================ */
    
    // BACKEND URL
    const BACKEND_URL = "https://cinechord-admin-production.up.railway.app";
    const API_SERVICES = `${BACKEND_URL}/api/service`;
    const UPLOADS_URL = `${BACKEND_URL}/uploads/`;
    
    const CONFIG = {
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        VIDEO_OBSERVE_THRESHOLD: 0.25,
        VIDEO_ROOT_MARGIN: '100px'
    };

    /* ============================================================
        2. DOM ELEMENT REFERENCES
        ============================================================ */
    
    const elements = {
        pageTransition: document.querySelector('.page-transition'),
        centerLogo: document.querySelector('.center-logo'),
        progressBar: document.querySelector('.progress-bar-top'),
        chatSection: document.querySelector('.chat-section'),
        servicesContainer: document.getElementById('services-list-container'),
        
        // Menu Elementləri
        hamburger: document.getElementById('hamburgerBtn'),
        hamburgerText: document.querySelector('.hamburger-text'),
        mobileMenu: document.getElementById('mobileMenu'),
        overlay: document.getElementById('mobileMenuOverlay'),
    };

    /* ============================================================
        3. PAGE TRANSITION SYSTEM
        ============================================================ */
    
    function initPageTransition() {
        if (!elements.pageTransition) return;
        
        setTimeout(() => {
            elements.pageTransition.classList.add('page-loaded');
        }, CONFIG.PAGE_LOAD_DELAY);
    }

    function navigateWithTransition(href) {
        if (href.startsWith('mailto') || href.startsWith('tel')) {
            window.location.href = href;
            return;
        }

        if (!elements.pageTransition || !elements.pageTransition.classList.contains('page-loaded')) return; 

        document.querySelectorAll('video').forEach(video => {
            video.pause();
            video.currentTime = 0;
        });
        
        elements.pageTransition.classList.remove('page-loaded');
        
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
        4. MOBILE MENU - FIX: JUMP PROBLEMİ HƏLLİ
        ============================================================ */

    function toggleMenu() {
        const { hamburger, mobileMenu, overlay, hamburgerText, centerLogo } = elements;
        if (!hamburger || !mobileMenu) return;

        const isActive = hamburger.classList.contains('active');
        
        // FIX: Scrollbar genişliyini hesabla
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

    function initMobileMenu() {
        const { hamburger, overlay, mobileMenu } = elements;
        
        if (hamburger) {
            hamburger.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleMenu();
            });
        }

        if (overlay) {
            overlay.addEventListener('click', function(e) {
                e.preventDefault();
                toggleMenu();
            });
        }

        // ESC düyməsi
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && hamburger && hamburger.classList.contains('active')) {
                toggleMenu();
            }
        });
        
        // Mobil Menyudan Keçid Məntiqi:
        const navLinks = mobileMenu ? mobileMenu.querySelectorAll('.nav-btn') : [];
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (!href || href === '#' || this.classList.contains('active')) {
                    e.preventDefault();
                    if (href !== '#') toggleMenu();
                    return;
                }

                e.preventDefault(); 
                toggleMenu();
                
                setTimeout(() => {
                    navigateWithTransition(href);
                }, 100);
            });
        });
    }

    /* ============================================================
        5. GLOBAL NAVİQASİYA (Menyu xaricindəki linklər)
        ============================================================ */
    
    function setupNavButtons() {
        const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])');
        
        internalLinks.forEach(link => {
            if (link.closest('.mobile-menu')) return;

            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href.startsWith('mailto') || href.startsWith('tel')) return;
                
                const currentPath = window.location.pathname.replace(/\/$/, '');
                const targetPath = href ? href.replace(/\.\./g, '').replace(/\/$/, '') : '';
                
                if (currentPath === targetPath || (currentPath === '/service' && targetPath === '/')) {
                    return;
                }
                
                e.preventDefault();
                navigateWithTransition(href);
            });
        });
    }

    /* ============================================================
        6. SCROLL REVEAL (Intersection Observer)
        ============================================================ */
    
    function initScrollReveal() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
        
        if (elements.chatSection) {
            observer.observe(elements.chatSection);
        }
    }

    /* ============================================================
        7. VIDEO AUTOPLAY - Mobil uyumlu (Home sayfasındaki gibi)
        ============================================================ */
    
    function initVideoAutoplay() {
        const videos = document.querySelectorAll('video');
        
        videos.forEach(video => {
            // Video ayarlarını garanti altına al
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.setAttribute('x-webkit-airplay', 'allow');
            
            // Controls'u kaldır (ekstra Play butonu görünmesin)
            video.removeAttribute('controls');
            video.controls = false;
            
            // Autoplay için birden fazla yöntem dene
            function attemptPlay() {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn("Autoplay failed:", error);
                        // Kullanıcı etkileşimi sonrası tekrar dene
                        const interactionEvents = ['click', 'touchstart', 'scroll', 'touchend'];
                        const tryPlayOnce = () => {
                            video.play().catch(() => {});
                            interactionEvents.forEach(type => {
                                document.removeEventListener(type, tryPlayOnce);
                            });
                        };
                        interactionEvents.forEach(type => {
                            document.addEventListener(type, tryPlayOnce, { once: true, passive: true });
                        });
                    });
                }
            }
            
            // Video yüklendiğinde oynat
            if (video.readyState >= 3) {
                attemptPlay();
            } else {
                video.addEventListener('loadeddata', attemptPlay, { once: true });
                video.addEventListener('canplay', attemptPlay, { once: true });
                video.addEventListener('loadedmetadata', attemptPlay, { once: true });
            }
            
            // Sayfa görünür olduğunda oynat
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && video.paused) {
                    attemptPlay();
                }
            });
            
            // Video duraklarsa tekrar oynat
            video.addEventListener('pause', () => {
                if (!document.hidden && video.currentTime > 0) {
                    setTimeout(() => attemptPlay(), 100);
                }
            });
        });
    }
    
    function initVideoLazyLoad() {
        const videoObserverOptions = {
            threshold: CONFIG.VIDEO_OBSERVE_THRESHOLD,
            rootMargin: CONFIG.VIDEO_ROOT_MARGIN
        };

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    video.play().catch(() => {});
                } else {
                    entry.target.pause();
                }
            });
        }, videoObserverOptions);

        document.querySelectorAll('video').forEach(video => {
            videoObserver.observe(video);
        });
    }

    /* ============================================================
        8. DİNAMİK SERVİS YÜKLƏMƏSİ
        ============================================================ */

    function cleanUrlPath(url) {
        if (url && typeof url === 'string') {
            if (url.startsWith('http')) return url;
            if (url.startsWith('/uploads/')) return url.substring('/uploads/'.length);
        }
        return url;
    }

    async function fetchAndRenderServices() {
        const container = elements.servicesContainer;
        if (!container) return;

        try {
            const response = await fetch(API_SERVICES);
            if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
            
            const data = await response.json();
            const services = data.content ? data.content : data;
            
            if (!services || services.length === 0) {
                container.innerHTML = '<p style="text-align:center; padding: 100px; color: rgba(255,255,255,0.5);">No services available.</p>';
                return;
            }
            
            let htmlContent = '';
            
            services.forEach((service, index) => {
                let videoSrc = service.videoUrl || '';
                if (videoSrc) {
                    videoSrc = cleanUrlPath(videoSrc);
                    if (!videoSrc.startsWith('http')) {
                        videoSrc = UPLOADS_URL + videoSrc;
                    }
                }
                
                const bulletListHtml = service.bulletPoints && Array.isArray(service.bulletPoints)
                    ? service.bulletPoints.map(item => `<li>${item}</li>`).join('')
                    : '';
                
                const processStepsHtml = service.processSteps && Array.isArray(service.processSteps)
                    ? service.processSteps.map((item, i) => `<li>${i + 1}. ${item}</li>`).join('')
                    : '';
                
                const titleText = (service.title || '').toUpperCase();

                const mediaColumn = `
                    <div class="media-column">
                        <div class="media-container">
                            <div class="media-frame">
                                <video class="media-content" 
                                    muted loop playsinline preload="auto"
                                    src="${videoSrc}"> 
                                </video>
                            </div>
                        </div>
                    </div>
                `;
                
                const contentColumn = `
                    <div class="content-column">
                        <div class="content-wrapper">
                            <div class="service-header">
                                <div class="icon-container">
                                    <i class="${service.iconClass || 'fas fa-cogs'}"></i>
                                </div>
                                <h2 class="service-title" data-text="${titleText}">
                                    <span>${titleText}</span>
                                </h2>
                            </div>
                            <p class="description">${service.description || ''}</p>
                            ${bulletListHtml ? `<ul class="bullet-list">${bulletListHtml}</ul>` : ''}
                            ${bulletListHtml && processStepsHtml ? '<div class="divider"></div>' : ''}
                            ${processStepsHtml ? `<ol class="numbered-list">${processStepsHtml}</ol>` : ''}
                            <a href="../contact/" class="cta-button">
                                CONTACT <i class="fas fa-long-arrow-alt-right"></i>
                            </a>
                        </div>
                    </div>
                `;
                
                if (index % 2 === 0) {
                    htmlContent += `<section class="page-wrapper reveal-item">${mediaColumn}${contentColumn}</section>`;
                } else { 
                    htmlContent += `<section class="page-wrapper reveal-item">${contentColumn}${mediaColumn}</section>`;
                }
            });

            container.innerHTML = htmlContent;
            
            initScrollReveal();
            initVideoLazyLoad();
            initVideoAutoplay(); // Yeni yüklenen videolar için autoplay
            
        } catch (error) {
            console.error('Xidmətlər yüklənərkən xəta:', error);
            container.innerHTML = `
                <p style="text-align:center; padding: 100px; color: #FF8C00;">
                    Xidmətlər hazırda mövcud deyil.<br>
                    <small style="color: rgba(255,255,255,0.4);">API: ${API_SERVICES}</small>
                </p>
            `;
        }
    }

    /* ============================================================
        9. INITIALIZATION
        ============================================================ */
    
    function init() {
        initPageTransition();
        initMobileMenu();
        initVideoAutoplay(); // Video autoplay'i başlat
        fetchAndRenderServices(); 
        setupNavButtons(); 
        
        if (elements.chatSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });
            observer.observe(elements.chatSection);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();