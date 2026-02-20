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

    // Global translations object
    window.translations = null;
    window.currentLang = 'en';

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
       4. TRANSLATION SYSTEM
       ============================================================ */

    async function loadTranslations() {
        try {
            const response = await fetch('../lang/services.json');
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
                    "our_services": "Our Services",
                    "lets_chat": "LET'S CHAT",
                    "contact_btn": "CONTACT",
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
                    "our_services": "Xidmətlərimiz",
                    "lets_chat": "GƏLİN SÖHBƏT EDƏK",
                    "contact_btn": "ƏLAQƏ",
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

        // Services Title
        const servicesTitle = document.querySelector('.services-title');
        if (servicesTitle) {
            const key = servicesTitle.getAttribute('data-key');
            if (key && t[key]) {
                const span = servicesTitle.querySelector('span');
                if (span) span.textContent = t[key];
                servicesTitle.setAttribute('data-text', t[key]);
            }
        }

        // Chat Title
        const chatTitle = document.querySelector('.chat-title');
        if (chatTitle) {
            const key = chatTitle.getAttribute('data-key');
            if (key && t[key]) {
                chatTitle.textContent = t[key];
            }
        }

        // Contact Button
        const contactBtn = document.querySelector('.chat-cta-button');
        if (contactBtn) {
            const key = contactBtn.getAttribute('data-key');
            if (key && t[key]) {
                contactBtn.innerHTML = t[key] + ' <i class="fas fa-long-arrow-alt-right"></i>';
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
       5. GLOBE LANGUAGE SELECTOR
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
                
                // API verilerini yeniden yükle (dil değiştiğinde)
                fetchAndRenderServices(lang);
                
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

// API verilerini sakla
let cachedServicesData = null;

async function fetchAndRenderServices(lang = 'en') {
    const container = elements.servicesContainer;
    if (!container) return;

    try {
        const langParam = lang === 'az' ? 'az' : 'en';
        const url = `${API_SERVICES}?lang=${langParam}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const services = data.content ? data.content : data;
        cachedServicesData = services;
        
        if (!services || services.length === 0) {
            const noServicesMsg = lang === 'az' ? 'Xidmətlər mövcud deyil.' : 'No services available.';
            container.innerHTML = `<p style="text-align:center; padding: 100px; color: rgba(255,255,255,0.5);">${noServicesMsg}</p>`;
            return;
        }

        renderServices(services, lang);
        
    } catch (error) {
        console.error('Xidmətlər yüklənərkən xəta:', error);
        
        if (cachedServicesData) {
            renderServices(cachedServicesData, lang);
        } else {
            const errorMsg = lang === 'az' ? 'Xidmətlər hazırda mövcud deyil.' : 'Services are currently unavailable.';
            container.innerHTML = `
                <p style="text-align:center; padding: 100px; color: #FF8C00;">
                    ${errorMsg}<br>
                    <small style="color: rgba(255,255,255,0.4);">API: ${API_SERVICES}</small><br>
                    <small style="color: rgba(255,255,255,0.4);">Error: ${error.message}</small>
                </p>
            `;
        }
    }
}

function renderServices(services, lang = 'en') {
    const container = elements.servicesContainer;
    if (!container) return;
    
    const isAz = lang === 'az'; 

    let htmlContent = '';
    
    services.forEach((service, index) => {
        let videoSrc = service.videoUrl || '';
        if (videoSrc) {
            videoSrc = cleanUrlPath(videoSrc);
            
            // Köhnə Cloudinary cloud-ı yeni ilə əvəz et
            if (videoSrc.includes('res.cloudinary.com/dinncr6hs')) {
                videoSrc = videoSrc.replace('res.cloudinary.com/dinncr6hs', 'res.cloudinary.com/dwybvusv6');
            }
            
            if (!videoSrc.startsWith('http')) {
                videoSrc = UPLOADS_URL + videoSrc;
            }
        }
        
        const bulletPoints = service.bulletPoints || [];
        const processSteps = service.processSteps || [];
        const title = service.title || '';
        const description = service.description || '';
        
        const bulletListHtml = bulletPoints && Array.isArray(bulletPoints)
            ? bulletPoints.map(item => `<li>${item}</li>`).join('')
            : '';
        
        const processStepsHtml = processSteps && Array.isArray(processSteps)
            ? processSteps.map((item, i) => `<li>${i + 1}. ${item}</li>`).join('')
            : '';
        
        const titleText = (title || '').toUpperCase();

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
                    <p class="description">${description || ''}</p>
                    ${bulletListHtml ? `<ul class="bullet-list">${bulletListHtml}</ul>` : ''}
                    ${bulletListHtml && processStepsHtml ? '<div class="divider"></div>' : ''}
                    ${processStepsHtml ? `<ol class="numbered-list">${processStepsHtml}</ol>` : ''}
                    <a href="../contact/" class="cta-button">
                        ${isAz ? 'ƏLAQƏ' : 'CONTACT'} <i class="fas fa-long-arrow-alt-right"></i>
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
    initVideoAutoplay();
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
        9. INITIALIZATION
        ============================================================ */
    
    async function init() {
        // Translation ve API çağrılarını paralel başlat
        const currentLang = localStorage.getItem('selectedLang') || 'en';
        const translationsPromise = loadTranslations();
        const apiPromise = fetchAndRenderServices(currentLang);
        
        // Translation yüklenmesini bekle (çünkü initLanguageSelector için gerekli)
        await translationsPromise;
        
        initPageTransition();
        initLanguageSelector();
        initMobileMenu();
        initVideoAutoplay(); // Video autoplay'i başlat
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
        
        // API yüklemesini bekle (hata olursa fallback gösterilecek)
        await apiPromise;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ============================================================
   GLOBAL CONTACT INFO UPDATER (Footer & Contact Page)
   ============================================================ */

async function updateGlobalContactInfo() {
    try {
        // 1. Admin paneldəki About məlumatlarını gətiririk
        // QEYD: URL-i öz server ünvanına uyğun yoxla
        const baseUrl = "https://cinechord-admin-production.up.railway.app"; 
        const response = await fetch(`${baseUrl}/api/about?lang=en`);

        if (!response.ok) {
            console.error("Məlumat tapılmadı");
            return;
        }

        const data = await response.json();

        // 2. Bütün səhifədəki Emailləri tapıb yeniləyirik
        if (data.email) {
            const emailElements = document.querySelectorAll('.global-email');
            emailElements.forEach(el => {
                el.textContent = data.email;
                el.href = `mailto:${data.email}`;
            });
        }

        // 3. Bütün səhifədəki Telefon nömrələrini tapıb yeniləyirik
        if (data.phone) {
            const phoneElements = document.querySelectorAll('.global-phone');
            phoneElements.forEach(el => {
                el.textContent = data.phone;
                // tel: linki üçün boşluqları silirik (+994 50... -> +99450...)
                const cleanPhone = data.phone.replace(/\s+/g, '');
                el.href = `tel:${cleanPhone}`;
            });
        }

        // 4. Bütün səhifədəki Ünvanları tapıb yeniləyirik
        if (data.address) {
            const addressElements = document.querySelectorAll('.global-address');
            addressElements.forEach(el => {
                el.textContent = data.address;
            });
        }

    } catch (error) {
        console.error("Əlaqə məlumatları yenilənərkən xəta:", error);
    }
}

// Səhifə tam yüklənəndə funksiyanı işə sal
document.addEventListener('DOMContentLoaded', () => {
    updateGlobalContactInfo();
});

})();