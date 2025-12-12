/* ============================================================
    CineChord Contact - Main JavaScript
    Version: 3.3 - MENU JUMP FIX
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
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
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
        contactForm: document.getElementById('contactForm'),
        nameInput: document.getElementById('name'),
        emailInput: document.getElementById('email'),
        messageInput: document.getElementById('message'),
        newsletterCheckbox: document.getElementById('newsletter'),
        textareas: document.querySelectorAll('.textarea-mode'),

        // Menu Elementləri
        hamburger: document.getElementById('hamburgerBtn'),
        hamburgerText: document.querySelector('.hamburger-text'),
        mobileMenu: document.getElementById('mobileMenu'),
        overlay: document.getElementById('mobileMenuOverlay'),
    };

    /* ============================================================
        3. UTILITY FUNCTIONS
        ============================================================ */
    
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
        4. PAGE TRANSITION SYSTEM
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
        5. MOBILE MENU - FIX: JUMP PROBLEMİ HƏLLİ
        ============================================================ */

    function initMobileMenu() {
        const { hamburger, mobileMenu, overlay, hamburgerText, centerLogo } = elements;
        
        if (!hamburger || !mobileMenu) {
            console.error('Menu elementləri tapılmadı!');
            return;
        }

        function toggleMenu() {
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

        // Hamburger və Overlay üçün Event Listeners
        hamburger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });

        if (overlay) {
            overlay.addEventListener('click', function(e) {
                e.preventDefault();
                toggleMenu();
            });
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && hamburger.classList.contains('active')) {
                toggleMenu();
            }
        });

        // Mobil Menyu Linkləri üçün Xüsusi Məntiq
        const navLinks = mobileMenu.querySelectorAll('.nav-btn');
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
        6. SCROLL REVEAL (INTERSECTION OBSERVER)
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
        7. TEXTAREA AUTO RESIZE
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
        8. FORM SUBMISSION
        ============================================================ */
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        
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
                updateButtonState(BUTTON_STATES.SUCCESS);
                elements.contactForm.reset();
                resetTextareas();
            } else {
                throw new Error(`Server response failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            updateButtonState(BUTTON_STATES.ERROR);
        }

        setTimeout(() => {
            updateButtonState(BUTTON_STATES.DEFAULT);
        }, CONFIG.BUTTON_RESET_DELAY);
    }

    function initFormSubmission() {
        if (!elements.contactForm) return;
        elements.contactForm.addEventListener('submit', handleFormSubmit);
    }

    /* ============================================================
        9. TOUCH OPTIMIZATION
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
        10. GLOBAL NAVİQASİYA (Logo və Footer üçün)
        ============================================================ */

    function setupNavLinks() {
        const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])');
        
        internalLinks.forEach(link => {
            if (link.closest('.mobile-menu')) return;

            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href.startsWith('mailto') || href.startsWith('tel')) return;
                
                const currentPath = window.location.pathname.replace(/\/$/, '').split('/').pop();
                const targetPath = href ? href.replace(/\.\./g, '').replace(/\/$/, '').split('/').pop() : '';
                
                if (currentPath === targetPath || (currentPath === 'contact' && targetPath === '')) {
                    return;
                }
                
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
        initMobileMenu();
        initScrollReveal();
        initTextareaResize();
        initFormSubmission();
        initTouchOptimization();
        setupNavLinks();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();