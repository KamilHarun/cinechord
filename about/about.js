/* ============================================================
   CineChord About - Main JavaScript
   Version: 7.1 - FINAL FIX: Navigation Conflict Solved
   ============================================================ */

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
            ABOUT: '/api/about'
        },
        STATIC_VIDEO: '../videos/Showreel.mp4',
        
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        LOGO_ENTRY_DELAY: 500,
        
        SCROLL_THROTTLE: 16,
        RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000
    };

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const elements = {
        // Global
        pageTransition: document.querySelector('.page-transition'),
        progressBarTop: document.querySelector('.progress-bar-top'),
        centerLogo: document.querySelector('.center-logo'),
        
        // Menu Elements
        hamburger: document.getElementById('hamburgerBtn'),
        mobileMenu: document.getElementById('mobileMenu'),
        overlay: document.getElementById('mobileMenuOverlay'),
        navBtns: document.querySelectorAll('.nav-btn'),
        
        // Layout Sections
        contentSection: document.querySelector('.content-section'),
        
        // Video
        aboutVideo: document.getElementById('about-video'),
        
        // Dynamic Content Text Elements
        mainTitle: document.getElementById('main-title'),
        subtitle: document.getElementById('subtitle'),
        whoWeAre: document.getElementById('who-we-are'),
        ourMission: document.getElementById('our-mission'),
        ourApproach: document.getElementById('our-approach'),
        emailLink: document.getElementById('email-link'),
        phoneLink: document.getElementById('phone-link'),
        address: document.getElementById('address')
    };

    let isTransitioning = false;

    /* ============================================================
       3. UTILITY FUNCTIONS (Yardımçı funksiyalar)
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
       4. PAGE TRANSITION SYSTEM
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
       5. MENU SYSTEM (Mobile Menu - Navigasiyanı burası idarə edir)
       ============================================================ */
    
    function initMenuSystem() {
        if (!elements.hamburger || !elements.mobileMenu) return;

        const hamburgerText = elements.hamburger.querySelector('.hamburger-text');

        function toggleMenu() {
            const isActive = elements.hamburger.classList.contains('active');
            
            elements.hamburger.classList.toggle('active');
            elements.mobileMenu.classList.toggle('active');
            if (elements.overlay) elements.overlay.classList.toggle('active');
            
            if (hamburgerText) {
                hamburgerText.textContent = isActive ? 'MENU' : 'CLOSE';
            }
            
            document.body.style.overflow = isActive ? '' : 'hidden';
        }

        elements.hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });

        if (elements.overlay) {
            elements.overlay.addEventListener('click', (e) => {
                e.preventDefault();
                toggleMenu();
            });
        }

        // Mobil Menyu Linkləri (Sadece burası işləyir)
        elements.navBtns.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (!href || href === '#' || this.classList.contains('active')) {
                    e.preventDefault();
                    if(href !== '#') toggleMenu();
                    return;
                }

                e.preventDefault();
                toggleMenu();
                
                setTimeout(() => {
                    navigateWithTransition(href);
                }, 100);
            });
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && elements.hamburger.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    /* ============================================================
       6. LOGO ANIMATION & SCROLL EFFECTS
       ============================================================ */
    
    function initLogoAnimation() {
        setTimeout(() => {
            if (elements.centerLogo) {
                elements.centerLogo.classList.add('entry-done');
            }
        }, CONFIG.LOGO_ENTRY_DELAY);
    }

    function updateScrollProgress() {
        if (!elements.progressBarTop) return;
        
        const target = elements.contentSection || document.documentElement;
        
        const scrollTop = target.scrollTop || window.pageYOffset;
        const scrollHeight = target.scrollHeight - target.clientHeight;
        
        let scrolled = (scrollTop / scrollHeight) * 100;
        if (isNaN(scrolled)) scrolled = 0;
        
        elements.progressBarTop.style.width = Math.min(scrolled, 100) + '%';
    }

    const handleScroll = throttle(() => {
        updateScrollProgress();
    }, CONFIG.SCROLL_THROTTLE);

    function initScrollEffects() {
        if (elements.contentSection) {
            elements.contentSection.addEventListener('scroll', handleScroll, { passive: true });
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /* ============================================================
       7. COMPLEX VIDEO HANDLING
       ============================================================ */
    
    function forceVideoPlay() {
        if (!elements.aboutVideo) return;
        
        elements.aboutVideo.muted = true;
        elements.aboutVideo.playsInline = true;
        elements.aboutVideo.autoplay = true;
        
        const playPromise = elements.aboutVideo.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                setTimeout(() => {
                    elements.aboutVideo.play().catch(() => {});
                }, 500);
            });
        }
    }

    function loadStaticVideo() {
        if (!elements.aboutVideo) return;

        elements.aboutVideo.src = CONFIG.STATIC_VIDEO;
        elements.aboutVideo.muted = true;
        elements.aboutVideo.loop = true;
        elements.aboutVideo.playsInline = true;
        
        elements.aboutVideo.load();

        elements.aboutVideo.addEventListener('loadeddata', function() {
            forceVideoPlay();
        }, { once: true });

        elements.aboutVideo.addEventListener('pause', function() {
            if (!document.hidden) forceVideoPlay();
        });

        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && elements.aboutVideo) forceVideoPlay();
        });
        
        const interactionEvents = ['click', 'touchstart', 'scroll'];
        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, function initVideoOnInteraction() {
                forceVideoPlay();
                interactionEvents.forEach(type => {
                    document.removeEventListener(type, initVideoOnInteraction);
                });
            }, { once: true, passive: true });
        });
    }

    /* ============================================================
       8. DYNAMIC CONTENT LOADING (API + Fallback)
       ============================================================ */
    
    async function loadDynamicContent() {
        try {
            const response = await retryFetch(() => 
                fetchWithTimeout(`${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.ABOUT}`, { method: 'GET' })
            );
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const apiData = await response.json();
            processApiData(apiData);
            
        } catch (error) {
            showFallbackContent();
        }
    }

    function processApiData(data) {
        function formatText(text) {
            if (!text) return '';
            return text.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
        }
        
        const content = {
            mainTitle: data.mainTitle || "OUR STORY",
            subTitle: data.subTitle || "We are passionate filmmakers dedicated to cinematic storytelling",
            whoWeAreText: formatText(data.whoWeAreText),
            ourMissionText: formatText(data.ourMissionText),
            ourApproachText: formatText(data.ourApproachText),
            email: data.email || "hello@cinechord.com",
            phone: data.phone || "+994 50 123 45 67",
            address: data.address || "BAKU, AZERBAIJAN"
        };
        
        populateContent(content);
    }

    function populateContent(content) {
        const safeUpdate = (el, val, isHTML = false) => {
            if (el) {
                if (isHTML) el.innerHTML = val;
                else el.textContent = val;
            }
        };

        if (elements.mainTitle) {
            const span = elements.mainTitle.querySelector('span');
            if (span) span.textContent = content.mainTitle;
            elements.mainTitle.setAttribute('data-text', content.mainTitle);
        }
        
        safeUpdate(elements.subtitle, content.subTitle);
        
        safeUpdate(elements.whoWeAre, content.whoWeAreText, true);
        safeUpdate(elements.ourMission, content.ourMissionText, true);
        safeUpdate(elements.ourApproach, content.ourApproachText, true);
        
        safeUpdate(elements.address, content.address);

        if (elements.emailLink) {
            elements.emailLink.href = `mailto:${content.email}`;
            elements.emailLink.setAttribute('data-text', content.email);
            const span = elements.emailLink.querySelector('span');
            if(span) span.textContent = content.email;
        }

        if (elements.phoneLink) {
            elements.phoneLink.href = `tel:${content.phone.replace(/\s/g, '')}`;
            elements.phoneLink.setAttribute('data-text', content.phone);
            const span = elements.phoneLink.querySelector('span');
            if(span) span.textContent = content.phone;
        }
    }

    function showFallbackContent() {
        const fallback = {
            mainTitle: "OUR STORY",
            subTitle: "We are passionate filmmakers dedicated to cinematic storytelling.",
            whoWeAreText: "CineChord is a creative studio specializing in visual storytelling and film production.",
            ourMissionText: "Our mission is to transform ideas into powerful visual experiences.",
            ourApproachText: "We approach every project with creativity and technical excellence.",
            email: "hello@cinechord.com",
            phone: "+994 50 123 45 67",
            address: "BAKU, AZERBAIJAN"
        };
        populateContent(fallback);
    }

    /* ============================================================
       9. SCROLL REVEAL ANIMATIONS
       ============================================================ */
    
    function initRevealAnimations() {
        const revealElements = document.querySelectorAll('.reveal-item');
        
        if (revealElements.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });
        
        revealElements.forEach(el => observer.observe(el));
    }
    
    /* ============================================================
       10. GLOBAL NAVİQASİYA (FIX EDİLMİŞ - Logo və Footer üçün)
       ============================================================ */

    function setupNavLinks() {
        // Yalnız Mobil Menyuda OLMAYAN linkləri tapırıq
        const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])');
        
        internalLinks.forEach(link => {
            // VACİB FIX: Mobil menyu daxilindəki linklərə event əlavə etmirik.
            if (link.closest('.mobile-menu')) return;

            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Mailto və Tel linklərinə toxunma
                if (href.startsWith('mailto') || href.startsWith('tel')) return;
                
                e.preventDefault();
                navigateWithTransition(href);
            });
        });
    }

    /* ============================================================
       11. INITIALIZATION
       ============================================================ */
    
    function init() {
        initPageTransition();
        initMenuSystem();
        initLogoAnimation();
        loadStaticVideo();
        loadDynamicContent();
        initScrollEffects();
        initRevealAnimations();
        setupNavLinks(); // <--- Bütün səhifələrdə olduğu kimi əlavə edildi
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();