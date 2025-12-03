/* ============================================================
   CineChord About - Main JavaScript
   Version: 2.0 - ARCHIVE PATTERN REFACTORED
   Description: Professional about page with complete features
   Author: Kamil
   ============================================================ */

(function() {
    'use strict';

    /* ============================================================
       1. CONFIGURATION & CONSTANTS
       ============================================================ */
    
    const CONFIG = {
        BACKEND_URL: 'https://cinechord-admin-production.up.railway.app',
        ENDPOINTS: {
            ABOUT: '/api/about/getAbout'
        },
        STATIC_VIDEO_URL: '/videos/Showreel.mp4',
        SCROLL_THRESHOLD: 50,
        LOGO_ENTRY_DELAY: 500,
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        RESIZE_DEBOUNCE: 250
    };

    const API_URLS = {
        ABOUT: `${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.ABOUT}`
    };

    const FALLBACK_DATA = {
        mainTitle: "OUR STORY",
        subTitle: "We are passionate filmmakers dedicated to bringing stories to life through the power of cinema.",
        whoWeAreText: "CINE CHORD is a collective of creative professionals specializing in cinematic storytelling. With years of experience in film production, we combine technical expertise with artistic vision to create compelling visual narratives that resonate with audiences.",
        ourMissionText: "Our mission is to elevate the art of filmmaking by delivering high-quality productions that exceed expectations. We believe in the power of storytelling to inspire, educate, and entertain, and we're committed to bringing your vision to the screen with professionalism and creativity.",
        ourApproachText: "We take a collaborative approach to every project, working closely with our clients to understand their goals and bring their ideas to life. From concept development to final delivery, we ensure every frame meets our high standards of excellence.",
        email: "info@cinechord.az",
        phone: "+994 50 123 45 67",
        address: "Baku, Azerbaijan"
    };

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const elements = {
        pageTransition: document.querySelector('.page-transition'),
        centerLogo: document.querySelector('.center-logo'),
        header: document.querySelector('.header'),
        scrollContainer: document.querySelector('.content-section') || window,
        aboutVideo: document.getElementById('about-video'),
        mainTitle: document.getElementById('main-title'),
        subtitle: document.getElementById('subtitle'),
        whoWeAre: document.getElementById('who-we-are'),
        ourMission: document.getElementById('our-mission'),
        ourApproach: document.getElementById('our-approach'),
        emailLink: document.getElementById('email-link'),
        phoneLink: document.getElementById('phone-link'),
        address: document.getElementById('address')
    };

    /* ============================================================
       3. STATE VARIABLES
       ============================================================ */
    
    let lastScrollTop = 0;
    let isTransitioning = false;

    /* ============================================================
       4. UTILITY FUNCTIONS
       ============================================================ */
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el && text) {
            el.textContent = text;
        }
    }

    function setRollingText(id, text) {
        const el = document.getElementById(id);
        if (el && text) {
            const upper = text.toUpperCase();
            el.setAttribute('data-text', upper);
            const span = el.querySelector('span');
            if (span) span.textContent = upper;
        }
    }

    /* ============================================================
       5. PAGE TRANSITION SYSTEM
       ============================================================ */
    
    function initPageTransition() {
        if (!elements.pageTransition) return;
        
        // Səhifə yükləndikdən sonra qara ekran yuxarı sürüşür
        setTimeout(() => {
            elements.pageTransition.classList.add('page-loaded');
        }, CONFIG.PAGE_LOAD_DELAY);
        
    }

    function navigateWithTransition(href) {
        if (isTransitioning) {
            return;
        }
        
        isTransitioning = true;
        
        if (elements.pageTransition) {
            // page-loaded silmək qara ekranı aşağı endirir
            elements.pageTransition.classList.remove('page-loaded');
        }
        
        // Qara ekran tam endikdən sonra navigate et
        setTimeout(() => {
            window.location.href = href;
        }, CONFIG.NAVIGATION_DELAY);
        
        // Fallback
        setTimeout(() => {
            if (!document.hidden) {
                window.location.href = href;
            }
        }, CONFIG.FALLBACK_DELAY);
    }

    /* ============================================================
       6. MOBILE NAVIGATION & HAMBURGER
       ============================================================ */
    
    function initMobileMenu() {
        const hamburger = document.createElement('div');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        hamburger.setAttribute('aria-label', 'Toggle menu');
        hamburger.setAttribute('role', 'button');
        
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
       7. SCROLL EFFECTS
       ============================================================ */
    
    function handleScroll(e) {
        const currentScroll = (elements.scrollContainer === window) 
            ? window.scrollY 
            : e.target.scrollTop;

        // Header hide/show
        if (currentScroll > lastScrollTop && currentScroll > CONFIG.SCROLL_THRESHOLD) {
            if (elements.header) elements.header.style.transform = 'translateY(-100%)';
        } else {
            if (elements.header) elements.header.style.transform = 'translateY(0)';
        }

        // Logo hide/show
        if (currentScroll > CONFIG.SCROLL_THRESHOLD) {
            if (elements.centerLogo) elements.centerLogo.classList.add('scroll-hidden');
        } else {
            if (elements.centerLogo) elements.centerLogo.classList.remove('scroll-hidden');
        }
        
        lastScrollTop = currentScroll;
    }

    function initScrollEffects() {
        if (window.innerWidth <= 768) {
            const debouncedScroll = debounce(handleScroll, 10);
            elements.scrollContainer.addEventListener('scroll', debouncedScroll, { passive: true });
        } else {
            elements.scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        }
        
    }

    /* ============================================================
       8. SCROLL REVEAL (INTERSECTION OBSERVER)
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

        document.querySelectorAll('.reveal-item').forEach((el) => {
            observer.observe(el);
        });
        
    }

    /* ============================================================
       9. NAVIGATION & SCRAMBLE EFFECT
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

        // Scramble effect (Desktop only)
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
                            if (index < iteration) return originalText[index];
                            return letters[Math.floor(Math.random() * letters.length)];
                        }).join("");
                        if (iteration >= originalText.length) clearInterval(interval);
                        iteration += 1 / 3;
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
       10. DATA LOADING FROM BACKEND
       ============================================================ */
    
    async function fetchAboutData() {
        try {
            
            const response = await fetch(API_URLS.ABOUT, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data;
            
        } catch (error) {
            return FALLBACK_DATA;
        }
    }

    async function loadAboutData() {
        try {
            // 1. Video (always static)
            if (elements.aboutVideo) {
                elements.aboutVideo.src = CONFIG.STATIC_VIDEO_URL;
                elements.aboutVideo.load();
            }

            // 2. Fetch API data
            const aboutData = await fetchAboutData();

            // 3. Populate content
            setRollingText('main-title', aboutData.mainTitle || FALLBACK_DATA.mainTitle);
            setText('subtitle', aboutData.subTitle || FALLBACK_DATA.subTitle);
            setText('who-we-are', aboutData.whoWeAreText || FALLBACK_DATA.whoWeAreText);
            setText('our-mission', aboutData.ourMissionText || FALLBACK_DATA.ourMissionText);
            setText('our-approach', aboutData.ourApproachText || FALLBACK_DATA.ourApproachText);

            // 4. Email
            const emailData = aboutData.email || FALLBACK_DATA.email;
            if (elements.emailLink && emailData) {
                const emailUpper = emailData.toUpperCase();
                elements.emailLink.href = `mailto:${emailData}`;
                elements.emailLink.setAttribute('data-text', emailUpper);
                const span = elements.emailLink.querySelector('span');
                if (span) span.textContent = emailUpper;
            }

            // 5. Phone
            const phoneData = aboutData.phone || FALLBACK_DATA.phone;
            if (elements.phoneLink && phoneData) {
                elements.phoneLink.href = `tel:${phoneData.replace(/\s/g, '')}`;
                elements.phoneLink.setAttribute('data-text', phoneData);
                const span = elements.phoneLink.querySelector('span');
                if (span) span.textContent = phoneData;
            }

            // 6. Address
            const addressData = aboutData.address || FALLBACK_DATA.address;
            if (addressData) {
                setText('address', addressData.toUpperCase());
            }


        } catch (err) {
            
            // Fallback
            setRollingText('main-title', FALLBACK_DATA.mainTitle);
            setText('subtitle', FALLBACK_DATA.subTitle);
            setText('who-we-are', FALLBACK_DATA.whoWeAreText);
            setText('our-mission', FALLBACK_DATA.ourMissionText);
            setText('our-approach', FALLBACK_DATA.ourApproachText);
        }
    }

    /* ============================================================
       11. TOUCH OPTIMIZATION
       ============================================================ */
    
    function initTouchOptimization() {
        if ('ontouchstart' in window) {
            document.querySelectorAll('.nav-btn, .social-link').forEach(el => {
                el.addEventListener('touchstart', function() {
                    this.style.transform = 'scale(0.95)';
                }, { passive: true });
                
                el.addEventListener('touchend', function() {
                    this.style.transform = '';
                }, { passive: true });
            });
        }

        // Mobile video optimization
        if (window.innerWidth <= 768 && elements.aboutVideo) {
            elements.aboutVideo.setAttribute('preload', 'metadata');
        }
        
    }

    /* ============================================================
       12. LOGO ENTRY ANIMATION
       ============================================================ */
    
    function initLogoAnimation() {
        setTimeout(() => {
            if (elements.centerLogo) elements.centerLogo.classList.add('entry-done');
        }, CONFIG.LOGO_ENTRY_DELAY);
    }

    /* ============================================================
       13. INITIALIZATION
       ============================================================ */
    
    function init() {
        
        initPageTransition();
        initMobileMenu();
        initScrollEffects();
        initScrollReveal();
        initNavigation();
        initTouchOptimization();
        initLogoAnimation();
        loadAboutData();
        
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();