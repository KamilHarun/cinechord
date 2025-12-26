/* ============================================================
   CineChord About - Main JavaScript
   Version: 7.2 - VIDEO & DYNAMIC CONTACT INFO ADDED
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
        RETRY_DELAY: 1000,
        REQUEST_TIMEOUT: 10000
    };

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const elements = {
        pageTransition: document.querySelector('.page-transition'),
        progressBarTop: document.querySelector('.progress-bar-top'),
        centerLogo: document.querySelector('.center-logo'),
        
        hamburger: document.getElementById('hamburgerBtn'),
        mobileMenu: document.getElementById('mobileMenu'),
        overlay: document.getElementById('mobileMenuOverlay'),
        navBtns: document.querySelectorAll('.nav-btn'),
        
        contentSection: document.querySelector('.content-section'),
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

    let isTransitioning = false;

    /* ============================================================
       3. UTILITY FUNCTIONS
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
       5. MENU SYSTEM
       ============================================================ */
    
    function initMenuSystem() {
        if (!elements.hamburger || !elements.mobileMenu) return;

        const hamburgerText = elements.hamburger.querySelector('.hamburger-text');

        function toggleMenu() {
            const isActive = elements.hamburger.classList.contains('active');
            
            elements.hamburger.classList.toggle('active');
            elements.mobileMenu.classList.toggle('active');
            if (elements.overlay) elements.overlay.classList.toggle('active');
            
            if (hamburgerText && window.translations && window.translations[window.currentLang]) {
                const t = window.translations[window.currentLang];
                hamburgerText.textContent = isActive ? t.menu : t.close;
            } else if (hamburgerText) {
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
       7. TRANSLATION SYSTEM
       ============================================================ */

    async function loadTranslations() {
        try {
            const response = await fetch('../lang/about.json');
            if (!response.ok) throw new Error('Translation file not found');
            window.translations = await response.json();
            console.log('Translations loaded:', window.translations);
            return window.translations;
        } catch (error) {
            console.error('Error loading translations:', error);
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
                    "who_we_are": "WHO WE ARE",
                    "our_mission": "OUR MISSION",
                    "our_approach": "OUR APPROACH",
                    "email": "EMAIL",
                    "address": "ADDRESS",
                    "phone": "PHONE"
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
                    "who_we_are": "BİZ KİMİK",
                    "our_mission": "MİSSİYAMIZ",
                    "our_approach": "YANAŞMAMIZ",
                    "email": "E-POÇT",
                    "address": "ÜNVAN",
                    "phone": "TELEFON"
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

        const hamburgerTextEl = document.querySelector('.hamburger-text');
        if (hamburgerTextEl) {
            const hamburgerBtn = document.getElementById('hamburgerBtn');
            const isMenuOpen = hamburgerBtn && hamburgerBtn.classList.contains('active');
            hamburgerTextEl.textContent = isMenuOpen ? t.close : t.menu;
        }

        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const navText = btn.querySelector('.nav-text');
            const key = btn.getAttribute('data-key');
            
            if (key && t[key]) {
                if (navText) navText.textContent = t[key];
                btn.setAttribute('data-text', t[key]);
            }
        });

       const blockTitles = document.querySelectorAll('.block-title, .hero-rolling-text');
        blockTitles.forEach(title => {
            const key = title.getAttribute('data-key');
            if (key && t[key]) {
                const span = title.querySelector('span');
                if (span) {
                    span.textContent = t[key];
                } else {
                    title.textContent = t[key];
                }
                title.setAttribute('data-text', t[key]); // Narıncı hover qatı üçün
            }
        });

        const labels = document.querySelectorAll('.label-small');
        labels.forEach(label => {
            const key = label.getAttribute('data-key');
            if (key && t[key]) {
                label.textContent = t[key];
            }
        });

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
       8. GLOBE LANGUAGE SELECTOR
       ============================================================ */

    function initLanguageSelector() {
        const langSelector = document.getElementById('langSelector');
        const langGlobeBtn = document.getElementById('langGlobeBtn');
        const langOptions = document.querySelectorAll('.lang-option');
        const currentLangText = document.getElementById('currentLangText');
        
        if (!langSelector || !langGlobeBtn) return;
        
        const savedLang = localStorage.getItem('selectedLang') || 'en';
        window.currentLang = savedLang;
        
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
                
                if (currentLangText) {
                    currentLangText.textContent = lang.toUpperCase();
                }
                
                localStorage.setItem('selectedLang', lang);
                applyTranslations(lang);
                loadDynamicContent(lang);
                
                setTimeout(() => {
                    langSelector.classList.remove('active');
                }, 200);
                
                document.dispatchEvent(new CustomEvent('languageChanged', { 
                    detail: { language: lang } 
                }));
                
                console.log('Language changed to:', lang);
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!langSelector.contains(e.target)) {
                langSelector.classList.remove('active');
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && langSelector.classList.contains('active')) {
                langSelector.classList.remove('active');
            }
        });
    }

    /* ============================================================
       9. COMPLEX VIDEO HANDLING
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

        console.log('Loading fallback static video');
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
       10. DYNAMIC CONTENT LOADING (API + Fallback)
       ============================================================ */
    
    let cachedApiData = null;

   async function loadDynamicContent(lang = 'en') {
    // API-dan cavab gələnə qədər ehtiyat mətni dərhal göstər
    showFallbackContent(lang); 
    
    try {
        const langParam = lang === 'az' ? 'az' : 'en';
        const url = `${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.ABOUT}?lang=${langParam}`;
        
        const response = await retryFetch(() => 
            fetchWithTimeout(url, { method: 'GET' })
        );
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const apiData = await response.json();
        cachedApiData = apiData;
        processApiData(apiData, lang);
        
    } catch (error) {
        console.error('API error:', error);
        if (cachedApiData) {
            processApiData(cachedApiData, lang);
        }
        // Xəta halında onsuz da yuxarıda fallback çağırıldığı üçün ekran boş qalmayacaq
    }
}

    function processApiData(data, lang = 'en') {
        function formatText(text) {
            if (!text) return '';
            return text.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
        }
        
        const content = {
            mainTitle: data.mainTitle || "OUR STORY",
            subTitle: data.subTitle || "We are passionate filmmakers dedicated to cinematic storytelling",
            whoWeAreText: formatText(data.whoWeAreText || ''),
            ourMissionText: formatText(data.ourMissionText || ''),
            ourApproachText: formatText(data.ourApproachText || ''),
            email: data.email || "hello@cinechord.com",
            phone: data.phone || "+994 50 123 45 67",
            address: data.address || "BAKU, AZERBAIJAN",
            videoUrl: data.videoUrl || null
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
        
        // VIDEO YÜKLƏNMƏSI
        if (content.videoUrl && elements.aboutVideo) {
            console.log('Loading video from API:', content.videoUrl);
            elements.aboutVideo.src = content.videoUrl;
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
        } else if (elements.aboutVideo) {
            loadStaticVideo();
        }
    }

    function showFallbackContent(lang = 'en') {
        const isAz = lang === 'az';
        const fallback = {
            mainTitle: isAz ? "BİZİM HEKAYƏMİZ" : "OUR STORY",
            subTitle: isAz ? "Biz kinematik hekayəçilikə həsr olunmuş ehtiraslı film yaradıcılarıyıq." : "We are passionate filmmakers dedicated to cinematic storytelling.",
            whoWeAreText: isAz ? "CineChord vizual hekayəçilik və film istehsalı üzrə ixtisaslaşmış yaradıcı studiyadır." : "CineChord is a creative studio specializing in visual storytelling and film production.",
            ourMissionText: isAz ? "Missiyamız ideyaları güclü vizual təcrübələrə çevirməkdir." : "Our mission is to transform ideas into powerful visual experiences.",
            ourApproachText: isAz ? "Biz hər layihəyə yaradıcılıq və texniki mükemməlliklə yanaşırıq." : "We approach every project with creativity and technical excellence.",
            email: "hello@cinechord.com",
            phone: "+994 50 123 45 67",
            address: isAz ? "BAKI, AZƏRBAYCAN" : "BAKU, AZERBAIJAN",
            videoUrl: null
        };
        populateContent(fallback);
    }

    /* ============================================================
       11. SCROLL REVEAL ANIMATIONS
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
       12. GLOBAL NAVİQASİYA
       ============================================================ */

    function setupNavLinks() {
        const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])');
        
        internalLinks.forEach(link => {
            if (link.closest('.mobile-menu')) return;

            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href.startsWith('mailto') || href.startsWith('tel')) return;
                
                e.preventDefault();
                navigateWithTransition(href);
            });
        });
    }

    /* ============================================================
       13. INITIALIZATION
       ============================================================ */
    
   async function init() {
        const currentLang = localStorage.getItem('selectedLang') || 'en';
        
        // Öncə tərcümələri tam yükləyirik
        await loadTranslations();
        
        // Sonra tətbiq edirik
        applyTranslations(currentLang);
        
        // Digər funksiyaları başladırıq
        initPageTransition();
        initLanguageSelector();
        initMenuSystem();
        initLogoAnimation();
        initScrollEffects();
        initRevealAnimations();
        setupNavLinks();
        
        // Ən sonda databazadan gələn dinamik kontenti yükləyirik
        await loadDynamicContent(currentLang);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    

})();