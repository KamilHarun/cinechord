/* ============================================================
   CineChord Contact - Main JavaScript
   Version: 2.1 - MOBILE MENU FIX
   Description: Professional contact page with form submission
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
            CONTACT: '/api/createMessage'
        },
        SCROLL_THRESHOLD: 50,
        LOGO_ENTRY_DELAY: 500,
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        RESIZE_DEBOUNCE: 250,
        BUTTON_RESET_DELAY: 3000
    };

    const API_URLS = {
        CONTACT: `${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.CONTACT}`
    };

    const BUTTON_STATES = {
        DEFAULT: 'SEND MESSAGE',
        SENDING: 'SENDING...',
        SUCCESS: 'MESSAGE SENT!',
        ERROR: 'ERROR! TRY AGAIN'
    };

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const elements = {
        pageTransition: document.querySelector('.page-transition'),
        centerLogo: document.querySelector('.center-logo'),
        header: document.querySelector('.header'),
        progressBar: document.querySelector('.progress-bar-top'),
        contactForm: document.getElementById('contactForm'),
        nameInput: document.getElementById('name'),
        emailInput: document.getElementById('email'),
        messageInput: document.getElementById('message'),
        newsletterCheckbox: document.getElementById('newsletter'),
        textareas: document.querySelectorAll('.textarea-mode')
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

    function updateButtonState(state) {
        if (!elements.contactForm) return;
        
        const btnTextContainer = elements.contactForm.querySelector('.rolling-text-btn');
        if (!btnTextContainer) return;
        
        const visibleSpan = btnTextContainer.querySelector('span');
        if (visibleSpan) {
            visibleSpan.textContent = state;
        }
        btnTextContainer.setAttribute('data-text', state);
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
       6. MOBILE NAVIGATION & HAMBURGER (DÜZƏLDİLMİŞ)
       ============================================================ */
    
    function initMobileMenu() {
        // HTML-də mövcud olan elementləri siniflərinə görə seçirik
        const hamburger = document.querySelector('.hamburger');
        const mobileMenu = document.querySelector('.mobile-menu');
        const overlay = document.querySelector('.mobile-menu-overlay');

        // Əgər elementlər tapılmasa, funksiyanı dayandır
        if (!hamburger || !mobileMenu || !overlay) {
            console.warn("Mobile menu elements not found in HTML.");
            return;
        }

        function toggleMenu() {
            const isActive = hamburger.classList.contains('active');
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            // Menyu açılanda body scroll-u bloklanır (CSS-dəki .menu-open sinfi istifadə edilir).
            document.body.classList.toggle('menu-open', !isActive);
        }

        // 1. Hamburgerə klik hadisəsini əlavə edirik
        hamburger.addEventListener('click', toggleMenu);
        
        // 2. Overlay-ə klik hadisəsini əlavə edirik
        overlay.addEventListener('click', toggleMenu);
        
        // 3. Menyu içindəki linklərə klik hadisəsini əlavə edirik
        mobileMenu.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                // Keçid olarsa (və # yoxdursa) menyunu bağla və səhifəni dəyiş
                if (href && href !== '#') {
                    e.preventDefault();
                    toggleMenu();
                    setTimeout(() => navigateWithTransition(href), 100); 
                } else {
                    // Yalnız #dirsə, menyunu bağla
                    toggleMenu();
                }
            });
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
    
    function handleScroll() {
        const currentScroll = window.scrollY;

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

    function updateProgressBar() {
        if (!elements.progressBar) return;
        
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = scrollTop / docHeight;
        elements.progressBar.style.width = (scrollPercent * 100) + '%';
    }

    function initScrollEffects() {
        const scrollHandler = () => {
            handleScroll();
            updateProgressBar();
        };

        if (window.innerWidth <= 768) {
            const debouncedScroll = debounce(scrollHandler, 10);
            window.addEventListener('scroll', debouncedScroll, { passive: true });
        } else {
            window.addEventListener('scroll', scrollHandler, { passive: true });
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
       10. TEXTAREA AUTO RESIZE
       ============================================================ */
    
    function initTextareaResize() {
        elements.textareas.forEach(textarea => {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        });
        
    }

    function resetTextareas() {
        elements.textareas.forEach(textarea => {
            textarea.style.height = 'auto';
        });
    }

    /* ============================================================
       11. FORM SUBMISSION
       ============================================================ */
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Loading state
        updateButtonState(BUTTON_STATES.SENDING);
        
        const formData = {
            name: elements.nameInput?.value || '',
            email: elements.emailInput?.value || '',
            message: elements.messageInput?.value || '',
            subject: "Saytdan Müraciət",
            newsletter: elements.newsletterCheckbox?.checked || false
        };

        try {
            const response = await fetch(API_URLS.CONTACT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Success
                updateButtonState(BUTTON_STATES.SUCCESS);
                elements.contactForm.reset();
                resetTextareas();
                
            } else {
                const errorData = await response.text();
                throw new Error(`Server response failed: ${response.status}`);
            }
        } catch (error) {
            updateButtonState(BUTTON_STATES.ERROR);
        }

        // Reset button after delay
        setTimeout(() => {
            updateButtonState(BUTTON_STATES.DEFAULT);
        }, CONFIG.BUTTON_RESET_DELAY);
    }

    function initFormSubmission() {
        if (!elements.contactForm) return;
        
        elements.contactForm.addEventListener('submit', handleFormSubmit);
        
    }

    /* ============================================================
       12. TOUCH OPTIMIZATION
       ============================================================ */
    
    function initTouchOptimization() {
        if ('ontouchstart' in window) {
            document.querySelectorAll('.nav-btn, .send-btn-container, .rolling-link').forEach(el => {
                el.addEventListener('touchstart', function() {
                    this.style.transform = 'scale(0.95)';
                }, { passive: true });
                
                el.addEventListener('touchend', function() {
                    this.style.transform = '';
                }, { passive: true });
            });
        }
        
    }

    /* ============================================================
       13. LOGO ENTRY ANIMATION
       ============================================================ */
    
    function initLogoAnimation() {
        setTimeout(() => {
            if (elements.centerLogo) elements.centerLogo.classList.add('entry-done');
        }, CONFIG.LOGO_ENTRY_DELAY);
    }

    /* ============================================================
       14. INITIALIZATION
       ============================================================ */
    
    function init() {
        
        initPageTransition();
        initMobileMenu();
        initScrollEffects();
        initScrollReveal();
        initNavigation();
        initTextareaResize();
        initFormSubmission();
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