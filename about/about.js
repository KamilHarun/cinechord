/* ============================================================
   CineChord About - Main JavaScript
   Version: 9.0 - DYNAMIC WHY & TEAM SECTIONS
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
        
        langSelector: document.getElementById('langSelector'),
        langGlobeBtn: document.getElementById('langGlobeBtn'),
        langOptions: document.querySelectorAll('.lang-option'),
        currentLangText: document.getElementById('currentLangText'),
        
        contentSection: document.querySelector('.content-section'),
        aboutVideo: document.getElementById('about-video'),
        
        mainTitle: document.getElementById('main-title'),
        subtitle: document.getElementById('subtitle'),
        whoWeAre: document.getElementById('who-we-are'),
        ourMission: document.getElementById('our-mission'),
        ourApproach: document.getElementById('our-approach'),
        emailLink: document.getElementById('email-link'),
        phoneLink: document.getElementById('phone-link'),
        address: document.getElementById('address'),
        
        // Why CineChord Section
        whyLabel: document.getElementById('why-label'),
        whyMediaContainer: document.getElementById('why-media-container'),
        whyTitle: document.getElementById('why-title'),
        whyDescription1: document.getElementById('why-description-1'),
        whyDescription2: document.getElementById('why-description-2'),
        
        // Team Section
        teamGrid: document.getElementById('team-grid')
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

        elements.hamburger.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        };

        if (elements.overlay) {
            elements.overlay.onclick = function(e) {
                e.preventDefault();
                toggleMenu();
            };
        }

        elements.navBtns.forEach(link => {
            link.onclick = function(e) {
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
            };
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && elements.hamburger.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    /* ============================================================
       6. LOGO ANIMATION
       ============================================================ */
    
    function initLogoAnimation() {
        setTimeout(() => {
            if (elements.centerLogo) {
                elements.centerLogo.classList.add('entry-done');
            }
        }, CONFIG.LOGO_ENTRY_DELAY);
    }

   /* ============================================================
       7. TRANSLATION SYSTEM (LOCALIZED)
       ============================================================ */

    async function loadTranslations() {
        // Konsoldakı 404 xətasını silmək üçün fetch sorğusunu ləğv edirik
        // Məlumatları birbaşa JS obyektindən oxuyuruq
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
                "who_we_are": "WHY CINECHORD", 
                "meet_us": "MEET US"
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
                "who_we_are": "NİYƏ CINECHORD", 
                "meet_us": "KOMANDA"
            }
        };
        return window.translations;
    }

    function applyTranslations(lang) {
        if (!window.translations || !window.translations[lang]) return;

        const t = window.translations[lang];
        window.currentLang = lang;

        // Hamburger mətnini yenilə
        const hamburgerTextEl = document.querySelector('.hamburger-text');
        if (hamburgerTextEl) {
            const isMenuOpen = elements.hamburger && elements.hamburger.classList.contains('active');
            hamburgerTextEl.textContent = isMenuOpen ? t.close : t.menu;
        }

        // Naviqasiya düymələrini yenilə
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const navText = btn.querySelector('.nav-text');
            const key = btn.getAttribute('data-key');
            if (key && t[key]) {
                if (navText) navText.textContent = t[key];
                btn.setAttribute('data-text', t[key]);
            }
        });

        // Sidebar etiketlərini yenilə
        const blockTitles = document.querySelectorAll('.sidebar-label');
        blockTitles.forEach(title => {
            const key = title.getAttribute('data-key');
            if (key && t[key]) {
                title.textContent = t[key];
            }
        });

        // HTML lang atributunu və body klassını yenilə
        if (lang === 'az') {
            document.body.classList.add('lang-az');
            document.documentElement.setAttribute('lang', 'az');
        } else {
            document.body.classList.remove('lang-az');
            document.documentElement.setAttribute('lang', 'en');
        }
    }

    /* ============================================================
       8. GLOBE LANGUAGE SELECTOR
       ============================================================ */

    function initLanguageSelector() {
        if (!elements.langSelector || !elements.langGlobeBtn) return;
        
        const savedLang = localStorage.getItem('selectedLang') || 'en';
        window.currentLang = savedLang;
        
        applyTranslations(savedLang);
        
        elements.langOptions.forEach(option => {
            if (option.dataset.lang === savedLang) {
                option.classList.add('active');
                if (elements.currentLangText) elements.currentLangText.textContent = savedLang.toUpperCase();
            } else {
                option.classList.remove('active');
            }
        });
        
        elements.langGlobeBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            elements.langSelector.classList.toggle('active');
        };
        
        elements.langOptions.forEach(option => {
            option.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = option.dataset.lang;
                
                if (option.classList.contains('active')) {
                    elements.langSelector.classList.remove('active');
                    return;
                }
                
                elements.langOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                if (elements.currentLangText) elements.currentLangText.textContent = lang.toUpperCase();
                
                localStorage.setItem('selectedLang', lang);
                applyTranslations(lang);
                loadDynamicContent(lang);
                
                setTimeout(() => {
                    elements.langSelector.classList.remove('active');
                }, 200);
            };
        });
        
        document.addEventListener('click', (e) => {
            if (!elements.langSelector.contains(e.target)) {
                elements.langSelector.classList.remove('active');
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.langSelector.classList.contains('active')) {
                elements.langSelector.classList.remove('active');
            }
        });
    }

   /* ============================================================
       9. VIDEO HANDLING (DYNAMIC VERSION)
       ============================================================ */
    
    function forceVideoPlay() {
        if (!elements.aboutVideo) return;
        
        elements.aboutVideo.muted = true;
        elements.aboutVideo.playsInline = true;
        elements.aboutVideo.autoplay = true;
        
        const playPromise = elements.aboutVideo.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Brauzer avtomatik oxutmağa icazə verməsə, 500ms sonra yenidən cəhd et
                setTimeout(() => {
                    if (elements.aboutVideo) elements.aboutVideo.play().catch(() => {});
                }, 500);
            });
        }
    }

    // Bu funksiya artıq yalnız admin paneldən video gəlməyəndə işləyəcək
    function loadStaticVideo() {
        if (!elements.aboutVideo) return;

        // Əgər admin paneldən video yoxdursa və CONFIG-də statik video təyin edilibsə
        if (CONFIG.STATIC_VIDEO) {
            elements.aboutVideo.src = CONFIG.STATIC_VIDEO;
            elements.aboutVideo.load();
        } else {
            console.log("No video source provided (Admin or Static).");
            return;
        }

        elements.aboutVideo.addEventListener('loadeddata', function() {
            forceVideoPlay();
        }, { once: true });
    }

    // Video üçün ümumi dinləyicilər
    if (elements.aboutVideo) {
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
       10. DYNAMIC CONTENT LOADING (SECURE & DYNAMIC)
       ============================================================ */
    
    let cachedApiData = null;

    async function loadDynamicContent(lang = 'en') {
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
            if (cachedApiData) processApiData(cachedApiData, lang);
        }
    }

    function processApiData(data, lang = 'en') {
        function formatText(text) {
            if (!text) return '';
            return text.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
        }

        // URL-ləri HTTPS-ə çevirən köməkçi funksiya
        const ensureHttps = (url) => {
            if (!url) return null;
            return url.replace('http://', 'https://');
        };
        
        const content = {
            mainTitle: data.mainTitle || (lang === 'az' ? "HAQQIMIZDA" : "ABOUT US"),
            subTitle: data.subTitle || "",
            whoWeAreText: formatText(data.whoWeAreText || ''),
            ourMissionText: formatText(data.ourMissionText || ''),
            ourApproachText: formatText(data.ourApproachText || ''),
            email: data.email || "hello@cinechord.com",
            phone: data.phone || "+994 50 123 45 67",
            address: data.address || (lang === 'az' ? "BAKI, AZƏRBAYCAN" : "BAKU, AZERBAIJAN"),
            videoUrl: ensureHttps(data.videoUrl),
            
            // Why CineChord
            whyTitle: data.whyTitle || (lang === 'az' ? "VİZUAL HEKAYƏLƏRİ YARADIRIZ" : "WE CRAFT VISUAL STORIES"),
            whyDescription: data.whyDescription || "",
            whyMediaUrl: ensureHttps(data.whyMediaUrl),
            whyMediaType: data.whyMediaType || 'video',
            
            // Team
            teamMembers: data.teamMembers || []
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

        // 1. Main Title
        if (elements.mainTitle) {
            const span = elements.mainTitle.querySelector('span');
            if (span) {
                span.textContent = content.mainTitle;
            } else {
                elements.mainTitle.innerHTML = `<span>${content.mainTitle}</span>`;
            }
            elements.mainTitle.setAttribute('data-text', content.mainTitle);
        }
        
        // 2. Text Content
        safeUpdate(elements.subtitle, content.subTitle);
        safeUpdate(elements.whoWeAre, content.whoWeAreText, true);
        safeUpdate(elements.ourMission, content.ourMissionText, true);
        safeUpdate(elements.ourApproach, content.ourApproachText, true);
        safeUpdate(elements.address, content.address);

        // 3. Email & Phone
        if (elements.emailLink) {
            elements.emailLink.href = `mailto:${content.email}`;
            const eSpan = elements.emailLink.querySelector('span');
            if(eSpan) {
                eSpan.textContent = content.email;
                eSpan.setAttribute('data-text', content.email);
            }
        }

        if (elements.phoneLink) {
            elements.phoneLink.href = `tel:${content.phone.replace(/\s/g, '')}`;
            const pSpan = elements.phoneLink.querySelector('span');
            if(pSpan) {
                pSpan.textContent = content.phone;
                pSpan.setAttribute('data-text', content.phone);
            }
        }
        
        // 4. Hero Video Handling (Secure)
        if (content.videoUrl && elements.aboutVideo) {
            elements.aboutVideo.src = content.videoUrl;
            elements.aboutVideo.load();
            elements.aboutVideo.addEventListener('loadeddata', function() {
                if (typeof forceVideoPlay === 'function') forceVideoPlay();
            }, { once: true });
        } else if (elements.aboutVideo) {
            // Əgər dinamik video yoxdursa və CONFIG-də statik video varsa
            if (typeof loadStaticVideo === 'function') loadStaticVideo();
        }
        
        // 5. Why Section & Team
        populateWhySection(content);
        populateTeamMembers(content.teamMembers);
    }

    function populateWhySection(content) {
        // Başlıq varsa yazırıq
        if (elements.whyTitle) {
            elements.whyTitle.textContent = content.whyTitle;
        }
        
        // Təsvir mətni varsa
        if (content.whyDescription) {
            // 1. Mətni abzaslara bölürük (əgər admin paneldə enter vurulubsa)
            const parts = content.whyDescription.split('\n\n');
            
            if (parts.length > 1) {
                // Əgər admin paneldə qoşa Enter vurulubsa, olduğu kimi bölürük
                if (elements.whyDescription1) elements.whyDescription1.innerHTML = parts[0];
                if (elements.whyDescription2) elements.whyDescription2.innerHTML = parts[1];
            } else {
                // 2. Əgər tək parça mətnidirsə, onu avtomatik ortadan bölürük
                const fullText = content.whyDescription;
                const midPoint = Math.floor(fullText.length / 2);
                
                // Cümlənin ortasında kəsməmək üçün ən yaxın boşluğu tapırıq (ortadan geriyə doğru)
                const splitIndex = fullText.lastIndexOf(' ', midPoint);
                
                // Əgər boşluq tapılmasa (çox uzun söz olsa), məcburən ortadan böl
                const finalSplitIndex = splitIndex > 0 ? splitIndex : midPoint;
                
                const firstHalf = fullText.substring(0, finalSplitIndex);
                const secondHalf = fullText.substring(finalSplitIndex);

                if (elements.whyDescription1) elements.whyDescription1.innerHTML = firstHalf;
                if (elements.whyDescription2) elements.whyDescription2.innerHTML = secondHalf;
            }
        }
        
        // Media (Video/Şəkil) hissəsi
        if (elements.whyMediaContainer && content.whyMediaUrl) {
            if (content.whyMediaType === 'video') {
                elements.whyMediaContainer.innerHTML = `
                    <video autoplay muted loop playsinline class="side-video">
                        <source src="${content.whyMediaUrl}" type="video/mp4">
                    </video>
                `;
                 // Videonu məcbur oxutmaq üçün (brauzer bloklamasın deyə)
                const video = elements.whyMediaContainer.querySelector('video');
                if(video) {
                    video.play().catch(() => {
                        // Əgər ilk cəhd alınmasa, səssiz rejimdə bir daha yoxla
                        video.muted = true;
                        video.play();
                    });
                }
            } else {
                elements.whyMediaContainer.innerHTML = `
                    <img src="${content.whyMediaUrl}" alt="Why CineChord" class="side-video">
                `;
            }
        }
    }

    function populateTeamMembers(teamMembers) {
        if (!elements.teamGrid) return;
        
        // Şəkillərin HTTPS olmasını təmin edirik
        const teamHTML = (teamMembers && teamMembers.length > 0) 
            ? teamMembers.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map(member => `
                    <div class="chew-card reveal-item">
                        <div class="chew-img-box">
                            <img src="${(member.imageUrl || 'assets/images/default-avatar.jpg').replace('http://', 'https://')}" 
                                 alt="${member.name}" loading="lazy">
                        </div>
                        <div class="member-name">${member.name || ''}</div>
                        <div class="member-role">${member.role || ''}</div>
                        <div class="member-bio">${member.bio || ''}</div>
                    </div>
                `).join('')
            : '<p>Loading team...</p>';
        
        elements.teamGrid.innerHTML = teamHTML;
        // Animation logic (IntersectionObserver) stays same...
    }

    function showFallbackContent(lang = 'en') {
        const isAz = lang === 'az';
        const fallback = {
            mainTitle: isAz ? "HAQQIMIZDA" : "ABOUT US",
            subTitle: isAz ? "Biz kinematik hekayəçilikə həsr olunmuş ehtiraslı film yaradıcılarıyıq." : "We are passionate filmmakers dedicated to cinematic storytelling.",
            email: "hello@cinechord.com",
            phone: "+994 50 123 45 67",
            address: isAz ? "BAKI, AZƏRBAYCAN" : "BAKU, AZERBAIJAN",
            videoUrl: null,
            whyTitle: isAz ? "VİZUAL HEKAYƏLƏRİ YARADIRIZ" : "WE CRAFT VISUAL STORIES",
            whyMediaUrl: null,
            teamMembers: []
        };
        populateContent(fallback);
    }

    /* ============================================================
       11. SCROLL LOGIC
       ============================================================ */
    
    function initScrollLogic() {
        const updateProgress = () => {
            if (!elements.progressBarTop) return;
            const target = elements.contentSection || document.documentElement;
            const scrollTop = target.scrollTop || window.pageYOffset;
            const scrollHeight = target.scrollHeight - target.clientHeight;
            let scrolled = (scrollTop / scrollHeight) * 100;
            elements.progressBarTop.style.width = Math.min(scrolled, 100) + '%';
        };

        const revealElements = document.querySelectorAll('.reveal-item, .chew-card, .text-footer-block');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('active');
                    }, index * 100); 
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));

        const parallaxMedia = document.querySelectorAll('.side-video, .chew-img-box img');
        
        const applyParallax = () => {
            const target = elements.contentSection || window;
            const scrollY = target.scrollTop !== undefined ? target.scrollTop : window.scrollY;

            parallaxMedia.forEach(media => {
                const speed = 0.05;
                const rect = media.getBoundingClientRect();
                const visible = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (visible) {
                    const yPos = (window.innerHeight - rect.top) * speed;
                    media.style.transform = `scale(1.1) translateY(${yPos}px)`;
                }
            });
        };

        let lastScrollY = 0;
        let ticking = false;

        function handleScroll() {
            const target = elements.contentSection || window;
            const currentScrollY = target.scrollTop !== undefined ? target.scrollTop : window.scrollY;

            if (currentScrollY > 100 && currentScrollY > lastScrollY) {
                if (elements.centerLogo) elements.centerLogo.classList.add('hide-on-scroll');
                if (elements.hamburger) elements.hamburger.classList.add('hide-on-scroll');
                if (elements.langSelector) elements.langSelector.classList.add('hide-on-scroll');
            } else if (currentScrollY < lastScrollY || currentScrollY < 100) {
                if (elements.centerLogo) elements.centerLogo.classList.remove('hide-on-scroll');
                if (elements.hamburger) elements.hamburger.classList.remove('hide-on-scroll');
                if (elements.langSelector) elements.langSelector.classList.remove('hide-on-scroll');
            }
            
            lastScrollY = currentScrollY;
            updateProgress();
            applyParallax(); 
            ticking = false;
        }

        const scrollTarget = elements.contentSection || window;
        scrollTarget.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(handleScroll);
                ticking = true;
            }
        }, { passive: true });
    }

    /* ============================================================
       12. GLOBAL NAVIGATION LINKS
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
        
        await loadTranslations();
        applyTranslations(currentLang);
        
        initPageTransition();
        initLanguageSelector(); 
        initMenuSystem();       
        initLogoAnimation();
        initScrollLogic();      
        setupNavLinks();
        
        await loadDynamicContent(currentLang);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ============================================================
   14. DYNAMIC CONTACT LOADER
   ============================================================ */

function renderContactSection(data, lang) {
    const addressField = document.getElementById('dynamic-address');
    const emailField = document.getElementById('dynamic-email');
    const phoneField = document.getElementById('dynamic-phone');

    // 1. Adresi dilə görə set et (Entity: address / addressAz)
    if (addressField) {
        addressField.innerText = lang === 'az' ? (data.addressAz || "") : (data.address || "");
    }

    // 2. Email set et
    if (emailField) {
        emailField.innerText = data.email || "";
        emailField.href = `mailto:${data.email}`;
    }

    // 3. Telefon set et
    if (phoneField) {
        phoneField.innerText = data.phone || "";
    }
    
    // 4. Sosial linkləri set et (Əgər DB-dən gəlirsə)
    // Məsələn: if(data.instagramUrl) document.getElementById('link-instagram').href = data.instagramUrl;
}

    })();