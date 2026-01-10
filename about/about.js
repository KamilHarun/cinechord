/* ============================================================
   CineChord About - Main JavaScript
   Version: 10.0 - MOBILE TEAM LOADING FIXED
   ============================================================ */

(function() {
    'use strict';

    /* ============================================================
       1. CONFIGURATION & CONSTANTS
       ============================================================ */
    
    const getBackendUrl = () => {
        return 'https://cinechord-admin-production.up.railway.app';
    };
    
    const CONFIG = {
        BACKEND_URL: getBackendUrl(),
        ENDPOINTS: {
            ABOUT: '/api/about'
        },
        // STATIC_VIDEO: '../videos/Showreel.mp4',
        
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        LOGO_ENTRY_DELAY: 500,
        
        SCROLL_THROTTLE: 16,
        RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000,
        REQUEST_TIMEOUT: 30000
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

        const hamburgerTextEl = document.querySelector('.hamburger-text');
        if (hamburgerTextEl) {
            const isMenuOpen = elements.hamburger && elements.hamburger.classList.contains('active');
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

        const blockTitles = document.querySelectorAll('.sidebar-label');
        blockTitles.forEach(title => {
            const key = title.getAttribute('data-key');
            if (key && t[key]) {
                title.textContent = t[key];
            }
        });

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
                setTimeout(() => {
                    if (elements.aboutVideo) elements.aboutVideo.play().catch(() => {});
                }, 500);
            });
        }
    }

    function loadStaticVideo() {
        if (!elements.aboutVideo) return;

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
    // BURADAN SİLDİK! (Titrəməni yaradan budur)
    try {
        const langParam = lang === 'az' ? 'az' : 'en';
        const url = `${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.ABOUT}?lang=${langParam}`;
        
        const response = await retryFetch(() => 
            fetchWithTimeout(url, { method: 'GET' })
        );
        
        const apiData = await response.json();
        processApiData(apiData, lang);
        
    } catch (error) {
        console.error('❌ API error:', error);
        showFallbackContent(lang); // Yalnız xəta olanda köhnə sözləri göstər
    }
}

    function processApiData(data, lang = 'en') {
        console.log('🔧 processApiData called');
        console.log('📦 API data received:', data);
        
        function formatText(text) {
            if (!text) return '';
            return text.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
        }

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
        
        console.log('👥 Team members in content:', content.teamMembers.length);
        
        populateContent(content);
    }

    function populateContent(content) {
        console.log('🎨 populateContent called');
        console.log('👥 Team members to populate:', content.teamMembers?.length || 0);
        
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
            if (typeof loadStaticVideo === 'function') loadStaticVideo();
        }
        
        // 5. Why Section & Team
        populateWhySection(content);
        
        // CRITICAL: Ensure team members are populated
        console.log('🚀 Calling populateTeamMembers with', content.teamMembers?.length || 0, 'members');
        populateTeamMembers(content.teamMembers || []);
    }

    function populateWhySection(content) {
        // 1. Başlıq
        if (elements.whyTitle) {
            elements.whyTitle.textContent = content.whyTitle;
        }
        
        // 2. Description split
        if (content.whyDescription && elements.whyDescription1 && elements.whyDescription2) {
            
            const cleanText = content.whyDescription.trim();
            
            // Method 1: Double line break
            let parts = cleanText.split(/\n\n+|\r\n\r\n+|<br\s*\/?>\s*<br\s*\/?>/gi);
            
            if (parts.length >= 2 && parts[0].length > 10 && parts[1].length > 10) {
                elements.whyDescription1.innerHTML = parts[0].trim().replace(/\n/g, '<br>');
                elements.whyDescription2.innerHTML = parts[1].trim().replace(/\n/g, '<br>');
            } else {
                // Method 2: Single line break
                parts = cleanText.split(/\n+|\r\n+/);
                
                if (parts.length >= 2) {
                    const midIndex = Math.ceil(parts.length / 2);
                    const firstHalf = parts.slice(0, midIndex).join('<br>').trim();
                    const secondHalf = parts.slice(midIndex).join('<br>').trim();
                    
                    elements.whyDescription1.innerHTML = firstHalf;
                    elements.whyDescription2.innerHTML = secondHalf;
                } else {
                    // Method 3: Character-based split
                    const totalLength = cleanText.length;
                    
                    if (totalLength < 100) {
                        elements.whyDescription1.innerHTML = cleanText;
                        elements.whyDescription2.innerHTML = '';
                    } else {
                        const midPoint = Math.floor(totalLength / 2);
                        const breakChars = ['. ', '! ', '? ', ', ', '; ', ' '];
                        let splitIndex = midPoint;
                        
                        for (const breakChar of breakChars) {
                            const nearestBreak = cleanText.indexOf(breakChar, midPoint - 100);
                            if (nearestBreak > midPoint - 100 && nearestBreak < midPoint + 100) {
                                splitIndex = nearestBreak + breakChar.length;
                                break;
                            }
                        }
                        
                        if (splitIndex === midPoint) {
                            splitIndex = cleanText.lastIndexOf(' ', midPoint);
                            if (splitIndex === -1 || splitIndex < midPoint - 100) {
                                splitIndex = cleanText.indexOf(' ', midPoint);
                            }
                        }
                        
                        const firstHalf = cleanText.substring(0, splitIndex).trim();
                        const secondHalf = cleanText.substring(splitIndex).trim();
                        
                        elements.whyDescription1.innerHTML = firstHalf.replace(/\n/g, '<br>');
                        elements.whyDescription2.innerHTML = secondHalf.replace(/\n/g, '<br>');
                    }
                }
            }
        }
        
        // 3. Media (Video/Image)
        if (elements.whyMediaContainer && content.whyMediaUrl) {
            if (content.whyMediaType === 'video') {
                elements.whyMediaContainer.innerHTML = `
                    <video autoplay muted loop playsinline class="side-video">
                        <source src="${content.whyMediaUrl}" type="video/mp4">
                    </video>
                `;
                const video = elements.whyMediaContainer.querySelector('video');
                if (video) {
                    video.play().catch(() => {
                        setTimeout(() => video.play().catch(() => {}), 500);
                    });
                }
            } else {
                elements.whyMediaContainer.innerHTML = `
                    <img src="${content.whyMediaUrl}" alt="Why CineChord" class="side-video" style="object-fit: cover;">
                `;
            }
        } else if (elements.whyMediaContainer) {
            elements.whyMediaContainer.innerHTML = `<div class="placeholder-video-bg"></div>`;
        }
    }

    function populateTeamMembers(teamMembers) {
        console.log('🔍 populateTeamMembers called');
        console.log('📊 Team members data:', teamMembers);
        console.log('📍 Team grid element:', elements.teamGrid);
        
        if (!elements.teamGrid) {
            console.error('❌ Team grid element NOT FOUND!');
            return;
        }

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        console.log('📱 Is mobile:', isMobile);

        if (!teamMembers || !teamMembers.length) {
            console.warn('⚠️ No team members data available');
            elements.teamGrid.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px;">No team members available.</p>';
            return;
        }

        console.log('✅ Creating HTML for', teamMembers.length, 'team members');

      const teamHTML = teamMembers
        .map((member, index) => {
            // Əgər mobildirsə və ya localda gecikirsə, başdan 'active' klassı verə bilərsən
            const cardClass = isMobile ? 'chew-card active' : 'chew-card reveal-item';
            
            return `
                <div class="${cardClass}" data-member="${member.name}">
                    <div class="chew-img-box">
                        <img src="${(member.imageUrl || '').replace('http://', 'https://')}" alt="${member.name}">
                    </div>
                    <div class="member-name">${member.name}</div>
                    <div class="member-role">${member.role}</div>
                </div>
            `;
        }).join('');

        console.log('📝 Generated HTML length:', teamHTML.length);
        
        // HTML-i daxil edirik
        elements.teamGrid.innerHTML = teamHTML;
        
        console.log('✅ HTML inserted into team grid');
        console.log('👥 Cards in DOM:', elements.teamGrid.querySelectorAll('.chew-card').length);

        // Mobil üçün dərhal göstər
        if (isMobile) {
            console.log('📱 Mobile detected - activating cards immediately');
            
            const activateCards = () => {
                const cards = elements.teamGrid.querySelectorAll('.chew-card');
                console.log('🎯 Activating', cards.length, 'cards');
                cards.forEach((card, idx) => {
                    card.style.opacity = '1';
                    card.style.visibility = 'visible';
                    card.style.transform = 'none';
                    card.classList.add('active', 'force-visible');
                    console.log(`  ✓ Card ${idx + 1} activated:`, card.dataset.member);
                });
            };

            // Triple activation
            activateCards();
            setTimeout(activateCards, 50);
            setTimeout(activateCards, 200);
            
            return;
        }

        // Desktop üçün IntersectionObserver
        console.log('🖥️ Desktop detected - setting up IntersectionObserver');
        
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log('👁️ Card visible:', entry.target.dataset.member);
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '100px'
        });

        const cards = elements.teamGrid.querySelectorAll('.reveal-item');
        console.log('👀 Observing', cards.length, 'cards');
        cards.forEach(el => observer.observe(el));
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
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Element görünən kimi 'active' klassını veririk
                entry.target.classList.add('active');
                
                // Məcburi: Əgər blur hələ də getmirsə, inline olaraq silirik
                entry.target.style.filter = "blur(0)";
                entry.target.style.opacity = "1";
                
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1, // Elementin 10%-i görünən kimi animasiya başlasın
        rootMargin: '0px 0px -50px 0px' 
    });

    // Statik və dinamik gələn bütün elementləri müşahidə et
    document.querySelectorAll('.reveal-item, .chew-card').forEach(el => observer.observe(el));
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
       13. DYNAMIC CONTACT LOADER
       ============================================================ */

    function renderContactSection(data, lang) {
        const addressField = document.getElementById('dynamic-address');
        const emailField = document.getElementById('dynamic-email');
        const phoneField = document.getElementById('dynamic-phone');

        if (addressField) {
            addressField.innerText = lang === 'az' ? (data.addressAz || "") : (data.address || "");
        }

        if (emailField) {
            emailField.innerText = data.email || "";
            emailField.href = `mailto:${data.email}`;
        }

        if (phoneField) {
            phoneField.innerText = data.phone || "";
        }
    }

/* ============================================================
   14. INITIALIZATION (THE FINAL & SECURE FIX)
   ============================================================ */
async function init() {
    console.log('🚀 Initializing About page...');
    const currentLang = localStorage.getItem('selectedLang') || 'en';
    
    await loadTranslations();
    applyTranslations(currentLang);
    initPageTransition();
    initLanguageSelector(); 
    initMenuSystem();       
    initLogoAnimation();
    setupNavLinks();

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // 1. Datanı GÖZLƏYİRİK (Bu mütləqdir)
    await loadDynamicContent(currentLang);
    
    // 2. Data gəldikdən sonra müşahidəni başlat (yalnız desktopda)
    if (!isMobile) {
        initScrollLogic(); 
    }

    // 3. QƏTİ SIĞORTA: Elementləri və Videonu ekrana çıxarırıq
    setTimeout(() => {
        console.log('⚡ Running final visibility check...');
        
        // Videonu məcburi başladırıq
        const video = document.getElementById('about-video');
        if (video) {
            video.style.opacity = "1";
            video.play().catch(() => console.log("Video auto-play blocked by browser"));
        }

        // Bütün gizli blokları (Rauf, Fidan və s.) məcburi açırıq
        document.querySelectorAll('.reveal-item, .chew-card, #main-title, .subtitle, .big-statement, .desc-text').forEach(el => {
            el.classList.add('active', 'content-ready');
            el.style.opacity = "1";
            el.style.visibility = "visible";
            el.style.filter = "none";
            el.style.transform = "none";
        });
    }, 800); // 800ms server gecikməsi üçün ideal vaxtdır

    console.log('✅ About page fully initialized!');
}

/* ============================================================
   15. EXECUTION & PERSISTENCE
   ============================================================ */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Geri qayıdanda datanın itməməsi üçün tək bir sığorta
window.onpageshow = function(event) {
    if (event.persisted) {
        // Keşdən gələndə səhifəni təzələyib təmiz data çəkirik
        window.location.reload();
    }
};
    /* ============================================================
       16. SCROLL HIDE/SHOW ADDON
       ============================================================ */

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
        
        window.addEventListener('scroll', requestScrollTick, { passive: true });
        
        console.log('✅ About page - Scroll hide/show initialized!');
    })();

})();