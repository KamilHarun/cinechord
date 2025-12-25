/* ============================================================
   CineChord Contact - Main JavaScript
   Version: 3.4 - FIXED TRANSLATION & MASK EFFECT
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
    window.currentLang = localStorage.getItem('selectedLang') || 'en';

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
            if (state === BUTTON_STATES.DEFAULT && t.form_send) displayText = t.form_send; // form_send açarını yoxlayır
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
       5. MOBILE MENU
       ============================================================ */

    function initMobileMenu() {
        const { hamburger, mobileMenu, overlay, hamburgerText, centerLogo } = elements;
        
        if (!hamburger || !mobileMenu) return;

        function toggleMenu() {
            const isActive = hamburger.classList.contains('active');
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
            
            // Menyu açılanda text dəyişimi applyTranslations funksiyasında idarə olunur,
            // amma burada da ani reaksiya üçün saxlayırıq
            if (hamburgerText) {
                const isAz = window.currentLang === 'az';
                if (isActive) {
                    hamburgerText.textContent = isAz ? 'MENYU' : 'MENU';
                } else {
                    hamburgerText.textContent = isAz ? 'BAĞLA' : 'CLOSE';
                }
            }
            
            if (!isActive) {
                document.body.style.overflow = 'hidden';
                document.body.style.paddingRight = scrollbarWidth + 'px';
                if (hamburger) hamburger.style.paddingRight = scrollbarWidth + 'px';
                if (centerLogo) centerLogo.style.paddingRight = scrollbarWidth + 'px';
            } else {
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                if (hamburger) hamburger.style.paddingRight = '';
                if (centerLogo) centerLogo.style.paddingRight = '';
            }
        }

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
                setTimeout(() => { navigateWithTransition(href); }, 100); 
            });
        });
    }

    /* ============================================================
       5. TRANSLATION SYSTEM (YENİLƏNMİŞ HİSSƏ)
       ============================================================ */

    async function loadTranslations() {
        try {
            // JSON faylının yolu dəqiq olmalıdır. 
            // Əgər faylın adı services.json-dursa, aşağıdakını dəyiş!
            const response = await fetch('../lang/contact.json'); 
            if (!response.ok) throw new Error('Translation file not found');
            window.translations = await response.json();
            
            // Yüklənən kimi tətbiq et
            applyTranslations(window.currentLang);
            
            return window.translations;
        } catch (error) {
            console.error('Error loading translations:', error);
            // Error olsa belə default textləri saxlamaq üçün heç nə etmirik
            // HTML-dəki default textlər görünəcək
        }
    }

    function applyTranslations(lang) {
        if (!window.translations || !window.translations[lang]) {
            console.warn('Translations not available for:', lang);
            return;
        }

        const t = window.translations[lang];
        window.currentLang = lang;
        localStorage.setItem('selectedLang', lang);

        // 1. FONT DÜZƏLİŞİ (AZ Dili üçün)
        if (lang === 'az') {
            document.body.classList.add('lang-az');
            document.documentElement.setAttribute('lang', 'az');
        } else {
            document.body.classList.remove('lang-az');
            document.documentElement.setAttribute('lang', 'en');
        }

        // 2. ELEMENTLƏRİN DƏYİŞDİRİLMƏSİ (UNIVERSAL MƏNTİQ)
        // Bütün data-key atributu olan elementləri tapırıq
        const elements = document.querySelectorAll('[data-key]');

        elements.forEach(el => {
            const key = el.getAttribute('data-key');
            
            // Əgər JSON-da bu açar varsa:
            if (t[key]) {
                
                // A) Əgər bu element "ROLLING/MASK" effekti olan elementdirsə
                // (Yəni "hero-rolling-text", "rolling-text-btn" klassları varsa VƏ YA data-text atributu varsa)
                if (el.classList.contains('hero-rolling-text') || 
                    el.classList.contains('rolling-text-btn') || 
                    el.classList.contains('rolling-link') ||
                    el.hasAttribute('data-text')) {
                    
                    // Span içindəki yazını dəyiş (görünən yazı)
                    const span = el.querySelector('span');
                    if (span) {
                        span.textContent = t[key];
                    } else {
                        el.textContent = t[key];
                    }

                    // CSS MASK EFFEKTİNİ DƏYİŞ (BU ƏN VACİBİDİR)
                    el.setAttribute('data-text', t[key]);
                }
                
                // B) FORM PLACEHOLDERLƏRİ
                else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                     // Placeholderi dəyişirik
                     el.placeholder = t[key];
                }
                
                // C) ADİ YAZILAR (Məs: hero-line, labels, paragraphs)
                else {
                    el.textContent = t[key];
                }
            }
        });

        // 3. XÜSUSİ HALLAR
        // Dil göstəricisi
        const currentLangText = document.getElementById('currentLangText');
        if (currentLangText) currentLangText.textContent = lang.toUpperCase();

        // Hamburger Text (Açıq/Bağlı vəziyyətə görə)
        const hamburgerTextEl = document.querySelector('.hamburger-text');
        if (hamburgerTextEl) {
            const hamburger = document.getElementById('hamburgerBtn');
            const isActive = hamburger && hamburger.classList.contains('active');
            if (isActive) {
                hamburgerTextEl.textContent = t.close || 'CLOSE';
            } else {
                hamburgerTextEl.textContent = t.menu || 'MENU';
            }
        }

        // Description (HTML teqləri ilə, məsələn <br>)
        const descriptionEl = document.querySelector('.info-description');
        if (descriptionEl) {
            const key = descriptionEl.getAttribute('data-key');
            if (key && t[key]) {
                descriptionEl.innerHTML = t[key]; // replace lazım deyil əgər JSON-da düz yazılıbsa
            }
        }

        console.log('Translations applied successfully for:', lang);
    }

    /* ============================================================
       6. GLOBE LANGUAGE SELECTOR
       ============================================================ */

    function initLanguageSelector() {
        const langSelector = document.getElementById('langSelector');
        const langGlobeBtn = document.getElementById('langGlobeBtn');
        const langOptions = document.querySelectorAll('.lang-option');
        
        if (!langSelector || !langGlobeBtn) return;
        
        // Mövcud dili UI-da göstər
        langOptions.forEach(opt => {
            if (opt.dataset.lang === window.currentLang) opt.classList.add('active');
            else opt.classList.remove('active');
        });
        
        // Globe düyməsinə klik
        langGlobeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            langSelector.classList.toggle('active');
        });
        
        // Dil seçimi
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = option.dataset.lang;
                if (option.classList.contains('active')) {
                    langSelector.classList.remove('active');
                    return;
                }
                
                // UI yenilə
                langOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Tərcüməni tətbiq et
                applyTranslations(lang);
                
                setTimeout(() => {
                    langSelector.classList.remove('active');
                }, 200);
            });
        });
        
        // Xaricə klik
        document.addEventListener('click', (e) => {
            if (!langSelector.contains(e.target)) {
                langSelector.classList.remove('active');
            }
        });
    }

    /* ============================================================
       7. SCROLL REVEAL
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
       8. TEXTAREA & FORM
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
       9. TOUCH OPTIMIZATION & NAVIGATION
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
       10. INITIALIZATION
       ============================================================ */
    
    async function init() {
        // Tərcümələr yükləndikdən sonra digər funksiyaları işə salmaq daha təhlükəsizdir
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