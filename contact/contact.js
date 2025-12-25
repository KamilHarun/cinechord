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

    // Global translations object
    window.translations = null;
    window.currentLang = 'en';

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
        
        let displayText = state;
        // If translations are loaded, use translated text
        if (window.translations && window.translations[window.currentLang]) {
            const t = window.translations[window.currentLang];
            if (state === BUTTON_STATES.DEFAULT && t.send_message) displayText = t.send_message;
            else if (state === BUTTON_STATES.SENDING && t.sending) displayText = t.sending;
            else if (state === BUTTON_STATES.SUCCESS && t.message_sent) displayText = t.message_sent;
            else if (state === BUTTON_STATES.ERROR && t.error) displayText = t.error;
        }
        
        const visibleSpan = btnTextContainer.querySelector('span');
        if (visibleSpan) {
            visibleSpan.textContent = displayText;
        }
        btnTextContainer.setAttribute('data-text', displayText);
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
                if (window.translations && window.translations[window.currentLang]) {
                    const t = window.translations[window.currentLang];
                    hamburgerText.textContent = isActive ? t.menu : t.close;
                } else {
                    hamburgerText.textContent = isActive ? 'MENU' : 'CLOSE';
                }
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
       5. TRANSLATION SYSTEM
       ============================================================ */

    async function loadTranslations() {
        try {
            const response = await fetch('../lang/contact.json');
            if (!response.ok) throw new Error('Translation file not found');
            window.translations = await response.json();
            console.log('Translations loaded:', window.translations);
            return window.translations;
        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback translations
            window.translations = {
                "en": {
                    "menu": "MENU",
                    "close": "CLOSE",
                    "home": "HOME",
                    "work": "WORK",
                    "service": "SERVICE",
                    "archive": "ARCHIVE",
                    "about": "ABOUT",
                    "contact": "CONTACT",
                    "lets_work": "LET'S WORK",
                    "together": "TOGETHER",
                    "name_label": "WHAT'S YOUR NAME?",
                    "email_label": "EMAIL ADDRESS",
                    "message_label": "TELL US ABOUT YOUR PROJECT",
                    "newsletter": "Stay in the loop with updates",
                    "send_message": "SEND MESSAGE",
                    "sending": "SENDING...",
                    "message_sent": "MESSAGE SENT!",
                    "error": "ERROR! TRY AGAIN",
                    "email": "EMAIL",
                    "phone": "PHONE",
                    "description": "We are always looking for new talent and exciting projects. Let's create something visual.",
                    "address": "ADDRESS",
                    "get_in_touch": "GET IN TOUCH",
                    "follow_us": "FOLLOW US"
                },
                "az": {
                    "menu": "MENYU",
                    "close": "BAĞLA",
                    "home": "ANA SƏHİFƏ",
                    "work": "İŞLƏR",
                    "service": "XİDMƏTLƏR",
                    "archive": "ARXİV",
                    "about": "HAQQIMIZDA",
                    "contact": "ƏLAQƏ",
                    "lets_work": "GƏLİN İŞLƏYƏK",
                    "together": "BİRLİKDƏ",
                    "name_label": "ADINIZ NƏDİR?",
                    "email_label": "E-POÇT ÜNVANI",
                    "message_label": "LAYİHƏNİZ HAQQINDA BİZƏ MƏLUMAT VERİN",
                    "newsletter": "Yeniliklərdən xəbərdar olun",
                    "send_message": "MESAJ GÖNDƏR",
                    "sending": "GÖNDƏRİLİR...",
                    "message_sent": "MESAJ GÖNDƏRİLDİ!",
                    "error": "XƏTA! YENİDƏN CƏHD EDİN",
                    "email": "E-POÇT",
                    "phone": "TELEFON",
                    "description": "Həmişə yeni istedadlar və maraqlı layihələr axtarırıq. Gəlin görkəmli bir şey yaradaq.",
                    "address": "ÜNVAN",
                    "get_in_touch": "ƏLAQƏ SAXLAYIN",
                    "follow_us": "BİZİ İZLƏYİN"
                }
            };
            return window.translations;
        }
    }

    function applyTranslations(lang) {
        if (!window.translations || !window.translations[lang]) {
            console.warn('Translations not available for:', lang);
            return;
        }

        const t = window.translations[lang];
        window.currentLang = lang;

        // Hamburger Menu Text
        const hamburgerTextEl = document.querySelector('.hamburger-text');
        if (hamburgerTextEl) {
            const hamburger = document.getElementById('hamburgerBtn');
            const isMenuOpen = hamburger && hamburger.classList.contains('active');
            hamburgerTextEl.textContent = isMenuOpen ? t.close : t.menu;
        }

        // Navigation Buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const navText = btn.querySelector('.nav-text');
            const key = btn.getAttribute('data-key');
            
            if (key && t[key]) {
                if (navText) navText.textContent = t[key];
                btn.setAttribute('data-text', t[key]);
            }
        });

        // Hero Text
        const heroLine = document.querySelector('.hero-line');
        if (heroLine) {
            const key = heroLine.getAttribute('data-key');
            if (key && t[key]) {
                heroLine.textContent = t[key];
            }
        }

        const heroRollingText = document.querySelector('.hero-rolling-text');
        if (heroRollingText) {
            const key = heroRollingText.getAttribute('data-key');
            if (key && t[key]) {
                const span = heroRollingText.querySelector('span');
                if (span) span.textContent = t[key];
                heroRollingText.setAttribute('data-text', t[key]);
            }
        }

        // Form Labels
        const formLabels = document.querySelectorAll('.floating-label');
        formLabels.forEach(label => {
            const key = label.getAttribute('data-key');
            if (key && t[key]) {
                label.textContent = t[key];
            }
        });

        // Newsletter Label
        const newsletterLabel = document.querySelector('label[for="newsletter"]');
        if (newsletterLabel && t.newsletter) {
            newsletterLabel.textContent = t.newsletter;
        }

        // Button States (will be updated when button state changes)
        if (BUTTON_STATES) {
            BUTTON_STATES.DEFAULT = t.send_message || 'SEND MESSAGE';
            BUTTON_STATES.SENDING = t.sending || 'SENDING...';
            BUTTON_STATES.SUCCESS = t.message_sent || 'MESSAGE SENT!';
            BUTTON_STATES.ERROR = t.error || 'ERROR! TRY AGAIN';
        }

        // Send Button Text
        const sendButton = document.querySelector('.rolling-text-btn');
        if (sendButton && t.send_message) {
            const span = sendButton.querySelector('span');
            if (span) span.textContent = t.send_message;
            sendButton.setAttribute('data-text', t.send_message);
        }

        // Info Labels
        const infoLabels = document.querySelectorAll('.label-small');
        infoLabels.forEach(label => {
            const key = label.getAttribute('data-key');
            if (key && t[key]) {
                label.textContent = t[key];
            }
        });

        // Description Text
        const descriptionEl = document.querySelector('.info-description');
        if (descriptionEl) {
            const key = descriptionEl.getAttribute('data-key');
            if (key && t[key]) {
                descriptionEl.innerHTML = t[key].replace(/\n/g, '<br>');
            }
        }

        // Footer Labels
        const footerLabels = document.querySelectorAll('.footer-label');
        footerLabels.forEach(label => {
            const key = label.getAttribute('data-key');
            if (key && t[key]) {
                label.textContent = t[key];
            }
        });

        // Apply font class
        if (lang === 'az') {
            document.body.classList.add('lang-az');
            document.documentElement.setAttribute('lang', 'az');
        } else {
            document.body.classList.remove('lang-az');
            document.documentElement.setAttribute('lang', 'en');
        }

        console.log('Translations applied for:', lang);
    }

    /* ============================================================
       6. GLOBE LANGUAGE SELECTOR
       ============================================================ */

    function initLanguageSelector() {
        const langSelector = document.getElementById('langSelector');
        const langGlobeBtn = document.getElementById('langGlobeBtn');
        const langDropdown = document.getElementById('langDropdown');
        const langOptions = document.querySelectorAll('.lang-option');
        const currentLangText = document.getElementById('currentLangText');
        
        if (!langSelector || !langGlobeBtn) return;
        
        // LocalStorage-dən dil seçimini yüklə
        const savedLang = localStorage.getItem('selectedLang') || 'en';
        window.currentLang = savedLang;
        
        // Seçilmiş dili tətbiq et (translations zaten yüklenmiş olmalı)
        applyTranslations(savedLang);
        
        langOptions.forEach(option => {
            if (option.dataset.lang === savedLang) {
                option.classList.add('active');
                if (currentLangText) {
                    currentLangText.textContent = savedLang.toUpperCase();
                }
            } else {
                option.classList.remove('active');
            }
        });
        
        // Globe düyməsinə klik - dropdown aç/bağla
        langGlobeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            langSelector.classList.toggle('active');
        });
        
        // Dil seçimlərinə klik
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = option.dataset.lang;
                
                // Əgər artıq aktivdirsə, sadəcə dropdown-u bağla
                if (option.classList.contains('active')) {
                    langSelector.classList.remove('active');
                    return;
                }
                
                // Aktiv classını dəyiş
                langOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Current lang text-i yenilə
                if (currentLangText) {
                    currentLangText.textContent = lang.toUpperCase();
                }
                
                // LocalStorage-ə yadda saxla
                localStorage.setItem('selectedLang', lang);
                
                // Tərcümələri tətbiq et
                applyTranslations(lang);
                
                // Dropdown-u bağla
                setTimeout(() => {
                    langSelector.classList.remove('active');
                }, 200);
                
                // Event göndər
                document.dispatchEvent(new CustomEvent('languageChanged', { 
                    detail: { language: lang } 
                }));
                
                console.log('Language changed to:', lang);
            });
        });
        
        // Xaricdə klik - dropdown-u bağla
        document.addEventListener('click', (e) => {
            if (!langSelector.contains(e.target)) {
                langSelector.classList.remove('active');
            }
        });
        
        // ESC düyməsi - dropdown-u bağla
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && langSelector.classList.contains('active')) {
                langSelector.classList.remove('active');
            }
        });
    }

/* ============================================================
   BAŞLATMA - ÇOX ÖNƏMLİ! BU OLMADAN İŞLƏMƏZ!
   ============================================================ */

    /* ============================================================
        7. SCROLL REVEAL (INTERSECTION OBSERVER)
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
    
    async function init() {
        await loadTranslations();
        initPageTransition();
        initLanguageSelector();
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