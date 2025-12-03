/* ============================================================
   CineChord Service - Main JavaScript
   Version: 2.0 - ARCHIVE PATTERN REFACTORED
   Description: Professional service page with complete features
   Author: Kamil
   ============================================================ */

(function() {
    'use strict';

    /* ============================================================
       1. CONFIGURATION & CONSTANTS
       ============================================================ */
    
    const CONFIG = {
        SCROLL_THRESHOLD: 50,
        LOGO_ENTRY_DELAY: 200,
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        RESIZE_DEBOUNCE: 250,
        VIDEO_OBSERVE_THRESHOLD: 0.25,
        VIDEO_ROOT_MARGIN: '100px'
    };

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const elements = {
        pageTransition: document.querySelector('.page-transition'),
        centerLogo: document.querySelector('.center-logo'),
        header: document.querySelector('.header'),
        progressBar: document.querySelector('.progress-bar-top'),
        chatSection: document.querySelector('.chat-section'),
        videos: document.querySelectorAll('video'),
        revealItems: document.querySelectorAll('.reveal-item'),
        pageWrappers: document.querySelectorAll('.page-wrapper')
    };

    /* ============================================================
       3. STATE VARIABLES
       ============================================================ */
    
    let lastScrollTop = 0;
    let isTransitioning = false;
    let ticking = false;

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
        
        // Stop all videos
        elements.videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
        });
        
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
    
    function updateScroll(currentScroll) {
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
        ticking = false;
    }

    function handleScroll() {
        const currentScroll = window.scrollY;
        
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateScroll(currentScroll);
            });
            ticking = true;
        }
    }

    function initScrollEffects() {
        window.addEventListener('scroll', handleScroll, { passive: true });
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

        // Observe reveal items
        elements.revealItems.forEach(el => observer.observe(el));
        
        // Observe page wrappers
        elements.pageWrappers.forEach(el => {
            el.classList.add('reveal-item');
            observer.observe(el);
        });
        
        // Observe chat section
        if (elements.chatSection) {
            observer.observe(elements.chatSection);
        }
        
    }

    /* ============================================================
       9. VIDEO LAZY LOADING
       ============================================================ */
    
    function initVideoLazyLoad() {
        const videoObserverOptions = {
            threshold: CONFIG.VIDEO_OBSERVE_THRESHOLD,
            rootMargin: CONFIG.VIDEO_ROOT_MARGIN
        };

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    const videoSrc = video.getAttribute('data-src');
                    
                    if (videoSrc && !video.src) {
                        
                        video.style.background = 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)';
                        video.src = videoSrc;
                        video.load();
                        
                        video.addEventListener('loadeddata', () => {
                            video.style.background = '#000';
                            video.play().catch(err => {
                            });
                        });
                        
                        video.addEventListener('error', () => {
                            video.style.background = '#1a1a1a';
                        });
                    }
                    
                    videoObserver.unobserve(video);
                }
            });
        }, videoObserverOptions);

        document.querySelectorAll('video[data-src]').forEach(video => {
            videoObserver.observe(video);
        });
        
    }

    /* ============================================================
       10. NAVIGATION & SCRAMBLE EFFECT
       ============================================================ */
    
    function setupNavButtons() {
        document.querySelectorAll('.nav-btn, .footer-link, .chat-cta-button, .cta-button').forEach(btn => {
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
       11. TOUCH OPTIMIZATION
       ============================================================ */
    
    function initTouchOptimization() {
        if ('ontouchstart' in window) {
            document.querySelectorAll('.nav-btn, .cta-button, .chat-cta-button, .social-icon-btn').forEach(el => {
                el.addEventListener('touchstart', function() {
                    this.style.transform = 'scale(0.95)';
                }, { passive: true });
                
                el.addEventListener('touchend', function() {
                    this.style.transform = '';
                }, { passive: true });
            });
        }

        // Mobile video optimization
        if (window.innerWidth <= 768) {
            elements.videos.forEach(video => {
                video.setAttribute('preload', 'metadata');
            });
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
        initVideoLazyLoad();
        initNavigation();
        initTouchOptimization();
        initLogoAnimation();
        
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();