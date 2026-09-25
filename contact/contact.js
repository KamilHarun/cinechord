/* ============================================================
    CineChord Contact - Main JavaScript
    Version: Final Fixed - Hero Translation + Menu + Contact Info
   ============================================================ */

(function() {
    'use strict';

    /* ============================================================
        1. CONFIGURATION & CONSTANTS
       ============================================================ */
    
    const CONFIG = {
        BACKEND_URL: 'https://cinechord-admin-production.up.railway.app',
        ENDPOINTS: {
            CONTACT: '/api/createMessage',
            ABOUT: '/api/about'
        },
        SCROLL_THRESHOLD: 50,
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        BUTTON_RESET_DELAY: 3000
    };

    const API_URLS = {
        CONTACT: `${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.CONTACT}`,
        ABOUT: `${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.ABOUT}`
    };

    const BUTTON_STATES = {
        DEFAULT: 'SEND MESSAGE',
        SENDING: 'SENDING...',
        SUCCESS: 'MESSAGE SENT!',
        ERROR: 'ERROR! TRY AGAIN'
    };

    // Global dəyişənlər
    window.translations = null;
    window.currentLang = localStorage.getItem('selectedLang') || 'en';

    /* ============================================================
        2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const elements = {
        pageTransition: document.querySelector('.page-transition'),
        contactForm: document.getElementById('contactForm'),
        nameInput: document.getElementById('name'),
        emailInput: document.getElementById('email'),
        messageInput: document.getElementById('message'),
        newsletterCheckbox: document.getElementById('newsletter'),
        textareas: document.querySelectorAll('.textarea-mode'),
        hamburger: document.getElementById('hamburgerBtn'),
        mobileMenu: document.getElementById('mobileMenu'),
        overlay: document.getElementById('mobileMenuOverlay'),
    };

    /* ============================================================
        3. GLOBAL CONTACT INFO UPDATER
       ============================================================ */

    async function updateGlobalContactInfo() {
        try {
            const response = await fetch(`${API_URLS.ABOUT}?lang=${window.currentLang}`);
            
            if (!response.ok) return;

            const data = await response.json();

            // --- 1. EMAIL FIX ---
            if (data.email) {
                document.querySelectorAll('.global-email').forEach(el => {
                    el.href = `mailto:${data.email}`;
                    
                    const span = el.querySelector('span');
                    
                    if (span) {
                        span.textContent = data.email;
                        if (span.hasAttribute('data-text')) {
                            span.setAttribute('data-text', data.email);
                        }
                    } else {
                        el.textContent = data.email;
                    }

                    if (el.hasAttribute('data-text')) {
                        el.setAttribute('data-text', data.email);
                    }
                });
            }

            // --- 2. PHONE FIX ---
            if (data.phone) {
                const cleanPhone = data.phone.replace(/\s+/g, '');
                
                document.querySelectorAll('.global-phone').forEach(el => {
                    el.href = `tel:${cleanPhone}`;
                    
                    const span = el.querySelector('span');
                    if (span) {
                        span.textContent = data.phone;
                        if (span.hasAttribute('data-text')) {
                            span.setAttribute('data-text', data.phone);
                        }
                    } else {
                        el.textContent = data.phone;
                    }

                    if (el.hasAttribute('data-text')) {
                        el.setAttribute('data-text', data.phone);
                    }
                });
            }

            // --- 3. ADDRESS FIX ---
            if (data.address || data.addressAz) {
                const address = (window.currentLang === 'az' && data.addressAz) ? data.addressAz : data.address;
                
                document.querySelectorAll('.global-address').forEach(el => {
                    el.textContent = address;
                });
                
                const footerAddressContainer = document.querySelector('.footer-col .footer-content');
                if (footerAddressContainer && !footerAddressContainer.querySelector('a')) {
                     const lines = address.split(','); 
                     footerAddressContainer.innerHTML = lines.map(line => `<p class="footer-text">${line.trim()}</p>`).join('');
                }
            }

        } catch (error) {
            console.error("Contact Info Update Error:", error);
        }
    }

    /* ============================================================
        4. UTILITY FUNCTIONS
       ============================================================ */
    
    function updateButtonState(state) {
        if (!elements.contactForm) return;
        
        const btnTextContainer = elements.contactForm.querySelector('.rolling-text-btn');
        if (!btnTextContainer) return;
        
        let displayText = state;
        if (window.translations && window.translations[window.currentLang]) {
            const t = window.translations[window.currentLang];
            if (state === BUTTON_STATES.DEFAULT && (t.send_message || t.form_send)) {
                displayText = t.send_message || t.form_send;
            }
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
        5. PAGE TRANSITION & NAVIGATION
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
        6. MOBILE MENU
       ============================================================ */

    function initMobileMenu() {
        const { hamburger, mobileMenu, overlay } = elements;
        
        if (!hamburger || !mobileMenu) return;

        function toggleMenu() {
            const isActive = hamburger.classList.contains('active');
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
            
            // ✅ FIX: Hamburger text-i dinamik seç
            const hamburgerText = document.querySelector('.hamburger-text');
            if (hamburgerText && window.translations && window.translations[window.currentLang]) {
                const t = window.translations[window.currentLang];
                hamburgerText.textContent = isActive ? t.menu : t.close;
            } else if (hamburgerText) {
                hamburgerText.textContent = isActive ? 'MENU' : 'CLOSE';
            }
            
            if (!isActive) {
                document.body.style.overflow = 'hidden';
                document.body.style.paddingRight = scrollbarWidth + 'px';
            } else {
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        }

        hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });

        if (overlay) {
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                toggleMenu();
            });
        }
        
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
                setTimeout(() => navigateWithTransition(href), 100); 
            });
        });
    }

    /* ============================================================
       7. TRANSLATION SYSTEM
       ============================================================ */

async function loadTranslations() {
    try {
        const response = await fetch('../lang/translation.json');
        if (!response.ok) throw new Error('Translation file not found');
        window.translations = await response.json();
        return window.translations;
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback translations
        window.translations = {
            "en": { 
                "menu": "MENU", 
                "close": "CLOSE", 
                "send_message": "SEND MESSAGE", 
                "sending": "SENDING...", 
                "message_sent": "MESSAGE SENT!", 
                "error": "ERROR! TRY AGAIN",
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
                "description": "We are always looking for new talent and exciting projects.\nLet's create something visual.",
                "email": "EMAIL",
                "phone": "PHONE",
                "address": "ADDRESS",
                "get_in_touch": "GET IN TOUCH",
                "follow_us": "FOLLOW US"
            },
            "az": { 
                "menu": "MENYU", 
                "close": "BAĞLA", 
                "send_message": "GÖNDƏRİN", 
                "sending": "GÖNDƏRİLİR...", 
                "message_sent": "MESAJ GÖNDƏRİLDİ!", 
                "error": "XƏTA! YENIDƏN CƏHD EDİN",
                "home": "ANA SƏHİFƏ",
                "work": "İŞLƏR",
                "service": "XİDMƏTLƏR",
                "archive": "ARXİV",
                "about": "HAQQIMIZDA",
                "contact": "ƏLAQƏ",
                "lets_work": "GƏLİN BİRLİKDƏ",
                "together": "İŞLƏYƏK",
                "name_label": "ADIN NEDİR?",
                "email_label": "E-POÇT ÜNVANı",
                "message_label": "LAYİHƏNİZ HAQQINDA",
                "newsletter": "Yeniliklərdən xəbərdar ol",
                "description": "Biz həmişə yeni istedadlar və maraqlı layihələr axtarırıq.\nGəlin birlikdə vizual bir şey yaradaq.",
                "email": "E-POÇT",
                "phone": "TELEFON",
                "address": "ÜNVAN",
                "get_in_touch": "ƏLAQƏ SAXLAYIN",
                "follow_us": "BİZİ İZLƏYİN"
            }
        };
        return window.translations;
    }
}

    function applyTranslations(lang) {
        if (!window.translations || !window.translations[lang]) return;

        const t = window.translations[lang];
        window.currentLang = lang;

        // ✅ FIX 1: Hamburger text-i dinamik seç
        const hamburgerText = document.querySelector('.hamburger-text');
        const hamburger = document.getElementById('hamburgerBtn');
        
        if (hamburgerText && hamburger) {
            const isMenuOpen = hamburger.classList.contains('active');
            hamburgerText.textContent = isMenuOpen ? t.close : t.menu;
        }

        // ✅ FIX 2: Bütün data-key elementlərini tərcümə et
        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.getAttribute('data-key');
            if (t[key]) {
                // ✅ HERO LINE (LET'S WORK)
                if (el.classList.contains('hero-line')) {
                    el.textContent = t[key];
                }
                // ✅ HERO ROLLING TEXT (TOGETHER)
                else if (el.classList.contains('hero-rolling-text')) {
                    const span = el.querySelector('span');
                    if (span) span.textContent = t[key];
                    el.setAttribute('data-text', t[key]);
                }
                // NAV BUTTON
                else if (el.classList.contains('nav-btn')) {
                    const navTextSpan = el.querySelector('.nav-text');
                    if (navTextSpan) {
                        navTextSpan.textContent = t[key];
                    }
                    el.setAttribute('data-text', t[key]);
                }
                // LABEL
                else if (el.tagName === 'LABEL') {
                    el.textContent = t[key];
                }
                // INPUT/TEXTAREA
                else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    // Placeholder üçün - boş buraxırıq
                }
                // DİGƏR ELEMENTLƏR
                else {
                    if (!el.classList.contains('rolling-link')) { 
                        el.innerHTML = t[key].replace(/\n/g, '<br>');
                    }
                }
            }
        });

        // Button state update
        const sendBtn = document.querySelector('.rolling-text-btn');
        if (sendBtn && (t.send_message || t.form_send)) {
            const txt = t.send_message || t.form_send;
            const span = sendBtn.querySelector('span');
            if (span) span.textContent = txt;
            sendBtn.setAttribute('data-text', txt);
        }

        // Lang class
        if (lang === 'az') {
            document.body.classList.add('lang-az');
            document.documentElement.setAttribute('lang', 'az');
        } else {
            document.body.classList.remove('lang-az');
            document.documentElement.setAttribute('lang', 'en');
        }
        
        // Contact info yenilə
        updateGlobalContactInfo();
    }

    /* ============================================================
       8. LANGUAGE SELECTOR
       ============================================================ */

    function initLanguageSelector() {
        const langSelector = document.getElementById('langSelector');
        const langGlobeBtn = document.getElementById('langGlobeBtn');
        const langOptions = document.querySelectorAll('.lang-option');
        const currentLangText = document.getElementById('currentLangText');
        
        if (!langSelector || !langGlobeBtn) return;
        
        const savedLang = localStorage.getItem('selectedLang') || 'en';
        window.currentLang = savedLang;
        
        // Initial load
        setTimeout(() => applyTranslations(savedLang), 100);
        
        if (currentLangText) currentLangText.textContent = savedLang.toUpperCase();
        
        langOptions.forEach(opt => {
            if (opt.dataset.lang === savedLang) opt.classList.add('active');
            else opt.classList.remove('active');
        });
        
        langGlobeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            langSelector.classList.toggle('active');
        });
        
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = option.dataset.lang;
                if (option.classList.contains('active')) {
                    langSelector.classList.remove('active');
                    return;
                }
                
                langOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                if (currentLangText) currentLangText.textContent = lang.toUpperCase();
                localStorage.setItem('selectedLang', lang);
                applyTranslations(lang);
                
                setTimeout(() => langSelector.classList.remove('active'), 200);
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!langSelector.contains(e.target)) langSelector.classList.remove('active');
        });
    }

    /* ============================================================
       9. SCROLL REVEAL & TEXTAREA
       ============================================================ */
    
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

        document.querySelectorAll('.reveal-item').forEach((el) => observer.observe(el));
    }

    function initTextareaResize() {
        elements.textareas.forEach(textarea => {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        });
    }

    /* ============================================================
       10. FORM SUBMISSION
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
                elements.textareas.forEach(t => t.style.height = 'auto');
            } else {
                throw new Error('Failed');
            }
        } catch (error) {
            console.error('Form error:', error);
            updateButtonState(BUTTON_STATES.ERROR);
        }

        setTimeout(() => updateButtonState(BUTTON_STATES.DEFAULT), CONFIG.BUTTON_RESET_DELAY);
    }

    function initFormSubmission() {
        if (!elements.contactForm) return;
        elements.contactForm.addEventListener('submit', handleFormSubmit);
    }

    /* ============================================================
       11. NAV LINKS SETUP
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
                
                if (currentPath === targetPath || (currentPath === 'contact' && targetPath === '')) return;
                
                e.preventDefault();
                navigateWithTransition(href);
            });
        });
    }

      /* ============================================================
   WORKS PAGE - SCROLL HIDE/SHOW ADDON
   ============================================================ */

// Scroll Hide/Show Funksionallığı
(function() {
    let lastScrollY = 0;
    let ticking = false;
    
    function handleScroll() {
        const currentScrollY = window.scrollY;
        
        const logo = document.querySelector('.center-logo');
        const hamburger = document.querySelector('.hamburger');
        const langSelector = document.querySelector('.lang-selector');
        
        // Scroll aşağı (100px-dən çox) - gizlə
        if (currentScrollY > 100 && currentScrollY > lastScrollY) {
            if (logo) logo.classList.add('hide-on-scroll');
            if (hamburger) hamburger.classList.add('hide-on-scroll');
            if (langSelector) langSelector.classList.add('hide-on-scroll');
        }
        // Scroll yuxarı və ya 100px-dən az - göstər
        else if (currentScrollY < lastScrollY || currentScrollY < 100) {
            if (logo) logo.classList.remove('hide-on-scroll');
            if (hamburger) hamburger.classList.remove('hide-on-scroll');
            if (langSelector) langSelector.classList.remove('hide-on-scroll');
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
    }
    
    function requestScrollTick() {
        if (!ticking) {
            window.requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }
    
    // Scroll event listener (performanslı)
    window.addEventListener('scroll', requestScrollTick, { passive: true });
    
    console.log('✅ Scroll hide/show initialized!');
})();


    /* ============================================================
       12. INITIALIZATION
       ============================================================ */
    
    async function init() {
        await loadTranslations();
        initPageTransition();
        initLanguageSelector();
        initMobileMenu();
        initScrollReveal();
        initTextareaResize();
        initFormSubmission();
        setupNavLinks();
        
        // Contact info yüklə
        updateGlobalContactInfo();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();