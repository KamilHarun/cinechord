/* ============================================================
   CineChord Index - Main JavaScript
   Version: 5.2 - VIDEO STARTS AFTER LOADING COMPLETE
   ============================================================ */

       const SHOWREEL_VIDEO_URL = "https://player.cloudinary.com/embed/?cloud_name=dinncr6hs&public_id=CineChord_Showreel_1_1_y9lq3g&profile=cld-default";


// Global video configuration
window.CONFIG = {
    videos: [
        'videos/CineChord_Showreel.mp4',
        'videos/ABB-TamGenc-Card.mp4',
        'videos/Bakcell-099.mp4',
        'videos/Yaz-furseti-kampaniyasi.mp4',
        'videos/Yeni-dovr.mp4'
    ],
    titles: ['SHOWREEL', 'ABB TAM GENC', 'BAKCELL 099', 'ABB YAZ FÜRSƏTİ', 'BAKCELL YENİ DÖVR']
};
window.currentIndex = 0;

// Global translations object
window.translations = null;
// Default olaraq həmişə İngilis dili
window.currentLang = 'en';

// Global function for main play button
window.openMainVideo = function() {
    const previewContainer = document.getElementById('previewContainer');
    const previewVideo = document.getElementById('previewVideo');
    const videoLoading = document.querySelector('.video-loading');
    const previewTitle = document.getElementById('previewTitle');

    if (previewContainer && previewVideo) {
        if (videoLoading) videoLoading.style.display = 'block';
        
        previewVideo.src = window.CONFIG.videos[window.currentIndex];
        if (previewTitle) previewTitle.textContent = window.CONFIG.titles[window.currentIndex];
        
        previewContainer.classList.remove('is-paused');
        previewContainer.classList.add('active');
        document.body.style.overflow = 'hidden';

        const playPromise = previewVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                if (videoLoading) videoLoading.style.display = 'none';
            }).catch(() => {
                if (videoLoading) videoLoading.style.display = 'none';
            });
        }
    }
};

(function() {
    'use strict';

    /* ============================================================
       1. CONFIGURATION & CONSTANTS
       ============================================================ */
    
    const CONFIG = {
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        RESIZE_DEBOUNCE: 250,
        INACTIVITY_DELAY: 2000
    };

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const elements = {
        pageTransition: document.querySelector('.page-transition'),
        loadingScreen: document.querySelector('.loading-screen'),
        loaderContent: document.querySelector('.loader-content'),
        loaderFill: document.querySelector('.loader-bar-fill'),
        loaderText: document.querySelector('.loader-percentage'),
        loaderLogo: document.querySelector('.loader-logo'),
        loaderAuthor: document.querySelector('.loader-author'),
        centerLogo: document.querySelector('.center-logo'),
        videoContainer: document.getElementById('videoContainer'),
        heroBgVideo: document.getElementById('heroBgVideo'), 
        projectCounter: document.getElementById('projectCounter'),
        projectName: document.getElementById('projectName'),
        prevBtn: document.getElementById('prevVideoBtn'),
        nextBtn: document.getElementById('nextVideoBtn'),
        previewContainer: document.getElementById('previewContainer'),
        previewVideo: document.getElementById('previewVideo'),
        closePreview: document.getElementById('closePreview'),
        modalPlayContainer: document.getElementById('modalPlayBtnContainer'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        playIcon: document.getElementById('playIcon'),
        pauseIcon: document.getElementById('pauseIcon'),
        rewindBtn: document.getElementById('rewindBtn'),
        forwardBtn: document.getElementById('forwardBtn'),
        progressSlider: document.getElementById('progressSlider'),
        progressPlayed: document.getElementById('progressPlayed'),
        currentTimeEl: document.getElementById('currentTime'),
        durationTimeEl: document.getElementById('durationTime'),
        volumeSlider: document.getElementById('volumeSlider'),
        fullscreenBtn: document.getElementById('fullscreenBtn')
    };

    // Menu Elements
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const hamburgerText = document.querySelector('.hamburger-text');
    const navBtns = document.querySelectorAll('.nav-btn');
    const centerLogo = document.querySelector('.center-logo');

    const UI_ELEMENTS = [
        ".center-logo", 
        ".play-button-container", 
        ".right-floating-nav", 
        ".bottom-right-socials", 
        ".bottom-left-explore",
        ".lang-selector"
    ];

    /* ============================================================
       3. STATE VARIABLES
       ============================================================ */
    
    let isAnimating = false;
    let activityTimeout = null;
    let currentVideoEl = elements.heroBgVideo;
    let videoShouldPlay = false; // Flag videoyu nə vaxt başlatmaq üçün

    /* ============================================================
       4. UTILITY FUNCTIONS
       ============================================================ */
    
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    /* ============================================================
       5. TRANSLATION SYSTEM
       ============================================================ */

    async function loadTranslations() {
        try {
            const response = await fetch('lang/home.json');
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
                    "play": "PLAY",
                    "explore": "EXPLORE OUR WORKS",
                    "designed_by": "Designed By Harunov"
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
                    "play": "BAŞLAT",
                    "explore": "İŞLƏRİMİZİ KƏŞF EDİN",
                    "designed_by": "Dizayn: Harunov"
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

        // Play Button
        const playTexts = document.querySelectorAll('.play-text');
        playTexts.forEach(el => {
            el.textContent = t.play;
            el.setAttribute('data-text', t.play);
        });

        // Explore Button
        const exploreText = document.querySelector('.explore-text');
        if (exploreText) {
            exploreText.textContent = t.explore;
        }

        // Loader Author
        const loaderAuthorSpan = document.querySelector('.loader-author span');
        if (loaderAuthorSpan) {
            loaderAuthorSpan.textContent = t.designed_by;
        }

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
       6. PAGE TRANSITION SYSTEM
       ============================================================ */
    
    function initPageTransition() {
        if (!elements.pageTransition) return;
        
        setTimeout(() => {
            elements.pageTransition.classList.add('page-loaded');
        }, CONFIG.PAGE_LOAD_DELAY);
    }

    function navigateWithTransition(href) {
        if (!href) return;
        
        if (href.startsWith('mailto') || href.startsWith('tel')) {
            window.location.href = href;
            return;
        }

        if (elements.pageTransition) {
            elements.pageTransition.classList.remove('page-loaded');
        }
        
        document.querySelectorAll('video').forEach(v => v.pause());
        
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
       7. GLOBE LANGUAGE SELECTOR
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
        
        // Seçilmiş dili tətbiq et
        applyTranslations(savedLang);
        
        // UI-ı seçilmiş dilə uyğunlaşdır
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
                
                // LocalStorage-ə yadda saxla (istifadəçi manual dəyişdirdikdə)
                // Amma səhifə yenilənəndə yenə EN olacaq
                localStorage.setItem('selectedLang', lang);
                
                // Tərcümələri tətbiq et
                applyTranslations(lang);
                
                // Dropdown-u bağla
                setTimeout(() => {
                    langSelector.classList.remove('active');
                }, 200);
                
                // Event göndər (başqa komponentlər üçün)
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
       8. MOBILE MENU
       ============================================================ */

    function toggleMenu() {
        if (!hamburger || !mobileMenu) return;

        const isActive = hamburger.classList.contains('active');
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        // Dil dropdown-unu bağla
        const langSelector = document.getElementById('langSelector');
        if (langSelector) langSelector.classList.remove('active');
        
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        
        // Hamburger text-i dil sisteminə uyğun dəyiş
        if (hamburgerText && window.translations && window.translations[window.currentLang]) {
            const t = window.translations[window.currentLang];
            hamburgerText.textContent = isActive ? t.menu : t.close;
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

    function initMobileMenu() {
        if (!hamburger || !mobileMenu) {
            console.error('Menu elementləri tapılmadı!');
            return;
        }

        hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });

        if (overlay) {
            overlay.addEventListener('click', () => {
                toggleMenu();
            });
        }

        navBtns.forEach(link => {
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
                }, 200);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (elements.previewContainer && elements.previewContainer.classList.contains('active')) {
                    closeVideoPreview();
                    return;
                }
                if (hamburger.classList.contains('active')) {
                    toggleMenu();
                }
            }
        });
    }

    /* ============================================================
       9. GSAP ANIMATIONS
       ============================================================ */
    
    function initGSAP() {
        if (typeof gsap === 'undefined') return;
        
        gsap.set(".hero-section", { autoAlpha: 1 });
        gsap.set(UI_ELEMENTS, { y: 50, autoAlpha: 0 });
    }

    function runLoadingAnimation() {
        if (typeof gsap === 'undefined') {
            revealSite();
            return;
        }

        const tl = gsap.timeline();
        tl.fromTo(elements.loaderLogo, { scale: 0.8 }, { scale: 1, duration: 1, ease: "power2.out" }, 0)
          .to(elements.loaderAuthor, { opacity: 1, duration: 0.4 }, "-=0.8")
          .to(elements.loaderFill, {
            width: "100%",
            duration: 1.8,
            ease: "power2.inOut",
            onUpdate: function() {
                let prog = Math.round(this.progress() * 100);
                if (elements.loaderText) elements.loaderText.textContent = prog + "%";
            },
            onComplete: () => {
                gsap.to(elements.loadingScreen, {
                    y: "-100%",
                    duration: 1,
                    ease: "power4.inOut",
                    onComplete: () => {
                        if (elements.loadingScreen) elements.loadingScreen.style.display = "none";
                        revealSite();
                        // Loading bitdikdən SONRA videoyu başlat
                        videoShouldPlay = true;
                        if (window.startHeroVideo) {
                            setTimeout(() => window.startHeroVideo(), 300);
                        }
                    }
                });
            }
        });
    }

    function revealSite(isPageTransition = false) {
        if (typeof gsap === 'undefined') return;
        
        const mainTl = gsap.timeline({
            onComplete: () => {
                // Site reveal bitdikdən sonra videoyu başlat (page transition halında)
                if (isPageTransition) {
                    videoShouldPlay = true;
                    if (window.startHeroVideo) {
                        setTimeout(() => window.startHeroVideo(), 300);
                    }
                }
            }
        });
        
        if (isPageTransition && elements.loadingScreen) {
            mainTl.to(elements.loadingScreen, {
                y: "100%",
                duration: 0.9,
                ease: "expo.inOut"
            }, 0);
        }
        
        const startDelay = isPageTransition ? "-=0.7" : 0;

        mainTl.to(".center-logo", { y: 0, autoAlpha: 1, duration: 0.9, ease: "power2.out" }, startDelay);
        mainTl.to(".lang-selector", { y: 0, autoAlpha: 1, duration: 0.85, ease: "power2.out" }, startDelay + 0.05);
        mainTl.to(".play-button-container", { y: 0, autoAlpha: 1, duration: 0.95, ease: "power2.out" }, startDelay + 0.1);
        mainTl.to(".right-floating-nav", { y: 0, autoAlpha: 1, duration: 0.85, ease: "power2.out" }, startDelay + 0.15);
        mainTl.to(".bottom-right-socials", { y: 0, autoAlpha: 1, duration: 0.85, ease: "power2.out" }, startDelay + 0.2);
        mainTl.to(".bottom-left-explore", { y: 0, autoAlpha: 1, duration: 0.85, ease: "power2.out" }, startDelay + 0.25);
    }
    
    /* ============================================================
       10. VIDEO AUTOPLAY CHECK
       ============================================================ */
    
    function initVideoAutoplay() {
        if (!elements.heroBgVideo) return;
        
        const video = elements.heroBgVideo;
        
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x-webkit-airplay', 'allow');
        
        video.removeAttribute('controls');
        video.controls = false;
        
        // Video avtomatik başlamasın - load edilsin sadəcə
        video.pause();
        video.load();
        
        function attemptPlay() {
            // Yalnız loading bitib videoShouldPlay true olduqda başlasın
            if (!videoShouldPlay) return;
            
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay failed:", error);
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
        
        // Metadata yükləndikdə hazır ol amma başlatma
        video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded, waiting for loading screen to finish');
        }, { once: true });
        
        // Document visibility dəyişdikdə
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && video.paused && videoShouldPlay) {
                attemptPlay();
            }
        });
        
        // Video pause olduqda (əgər olmamalıdırsa)
        video.addEventListener('pause', () => {
            if (!document.hidden && video.currentTime > 0 && videoShouldPlay) {
                setTimeout(() => attemptPlay(), 100);
            }
        });
        
        // Public function - xaricdən çağırmaq üçün
        window.startHeroVideo = attemptPlay;
    }

    /* ============================================================
       11. LOADING SCREEN LOGIC
       ============================================================ */
    
    function initLoadingScreen() {
        const hasIntroShown = sessionStorage.getItem('introShown');

        if (hasIntroShown) {
            if (elements.loaderContent) {
                elements.loaderContent.style.display = "none";
                if (typeof gsap !== 'undefined') {
                    gsap.set(elements.loaderContent, { autoAlpha: 0 });
                }
            }
            if (elements.loadingScreen && typeof gsap !== 'undefined') {
                gsap.set(elements.loadingScreen, { y: "0%", display: "flex", opacity: 1 });
            }
            setTimeout(() => revealSite(true), 50);
        } else {
            sessionStorage.setItem('introShown', 'true');
            if (elements.loaderContent && typeof gsap !== 'undefined') {
                gsap.set(elements.loaderContent, { autoAlpha: 1, visibility: "visible" });
                gsap.set(elements.loaderLogo, { opacity: 1 });
                gsap.set(elements.loaderAuthor, { visibility: "visible" });
            }
            runLoadingAnimation();
        }
    }

    /* ============================================================
       12. NAVIGATION
       ============================================================ */
    
    function setupNavButtons() {
        const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])');
        
        internalLinks.forEach(link => {
            if (link.closest('.mobile-menu')) return;

            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (!href || href === '#') return;
                if (href.startsWith('mailto') || href.startsWith('tel')) return;
                
                e.preventDefault();
                navigateWithTransition(href);
            });
        });
    }

    function initNavigation() {
        setupNavButtons();
    }

    /* ============================================================
       13. VIDEO SLIDER 
       ============================================================ */
    
    function initVideoSlider() {
        if (!elements.videoContainer || !currentVideoEl) return;

        currentVideoEl.loop = true; 

        function changeVideo(direction) {
            if (isAnimating) return;
            isAnimating = true;

            if (direction === 'next') {
                window.currentIndex = (window.currentIndex + 1) % window.CONFIG.videos.length;
            } else {
                window.currentIndex = (window.currentIndex - 1 + window.CONFIG.videos.length) % window.CONFIG.videos.length;
            }

            const nextVideoEl = document.createElement('video');
            nextVideoEl.className = 'hero-bg';
            nextVideoEl.src = window.CONFIG.videos[window.currentIndex];
            nextVideoEl.autoplay = true;
            nextVideoEl.muted = true;
            nextVideoEl.loop = true; 
            nextVideoEl.playsInline = true;

            if (typeof gsap !== 'undefined') {
                gsap.set(nextVideoEl, { autoAlpha: 1 });
                elements.videoContainer.insertBefore(nextVideoEl, document.querySelector('.hero-overlay'));
                const startX = direction === 'next' ? "100%" : "-100%";
                const endXOld = direction === 'next' ? "-100%" : "100%";
                gsap.set(nextVideoEl, { x: startX });

                nextVideoEl.onloadeddata = () => {
                    const tl = gsap.timeline({
                        onComplete: () => {
                            if (currentVideoEl) currentVideoEl.remove();
                            currentVideoEl = nextVideoEl;
                            isAnimating = false;
                        }
                    });
                    tl.to(currentVideoEl, { x: endXOld, duration: 1.2, ease: "power3.inOut" }, 0)
                      .to(nextVideoEl, { x: "0%", duration: 1.2, ease: "power3.inOut" }, 0);
                    updateInfoUI(window.currentIndex);
                };
            } else {
                elements.videoContainer.insertBefore(nextVideoEl, document.querySelector('.hero-overlay'));
                if (currentVideoEl) currentVideoEl.remove();
                currentVideoEl = nextVideoEl;
                isAnimating = false;
                updateInfoUI(window.currentIndex);
            }
        }

        function updateInfoUI(index = window.currentIndex) {
            const total = String(window.CONFIG.videos.length).padStart(2, '0');
            const current = String(index + 1).padStart(2, '0');
            if (elements.projectCounter && elements.projectName) {
                if (typeof gsap !== 'undefined') {
                    gsap.fromTo([elements.projectCounter, elements.projectName], 
                        { y: 15, autoAlpha: 0 }, 
                        { y: 0, autoAlpha: 1, duration: 0.4 }
                    );
                }
                elements.projectCounter.textContent = `${current} — ${total}`;
                elements.projectName.textContent = window.CONFIG.titles[index];
            }
        }

        updateInfoUI();

        if (elements.nextBtn) elements.nextBtn.addEventListener('click', () => changeVideo('next'));
        if (elements.prevBtn) elements.prevBtn.addEventListener('click', () => changeVideo('prev'));
        
        document.addEventListener('keydown', (e) => {
            if (!elements.previewContainer || !elements.previewContainer.classList.contains('active')) {
                if (e.key === 'ArrowRight') changeVideo('next');
                if (e.key === 'ArrowLeft') changeVideo('prev');
            }
        });
    }

    /* ============================================================
       14. VIDEO MODAL
       ============================================================ */
    
    function handleUserActivity() {
        if (!elements.previewContainer) return;
        elements.previewContainer.classList.remove('user-inactive');
        clearTimeout(activityTimeout);
        
        if (elements.previewVideo && !elements.previewVideo.paused) {
            activityTimeout = setTimeout(() => {
                elements.previewContainer.classList.add('user-inactive');
            }, CONFIG.INACTIVITY_DELAY);
        }
    }

    function updatePlayButtonUI() {
        const modalPlayText = document.querySelector('#modalPlayBtnContainer .play-text');
        const t = window.translations ? window.translations[window.currentLang] : { play: 'PLAY' };
        
        if (elements.previewVideo.paused) {
            if (elements.playIcon) elements.playIcon.style.display = 'block';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'none';
            elements.previewContainer.classList.add('is-paused');
            elements.previewContainer.classList.remove('user-inactive');
            clearTimeout(activityTimeout);
            if (modalPlayText) {
                modalPlayText.textContent = t.play;
                modalPlayText.setAttribute('data-text', t.play);
            }
        } else {
            if (elements.playIcon) elements.playIcon.style.display = 'none';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'block';
            elements.previewContainer.classList.remove('is-paused');
            handleUserActivity();
            if (modalPlayText) {
                modalPlayText.textContent = 'PAUSE';
                modalPlayText.setAttribute('data-text', 'PAUSE');
            }
        }
    }

    function togglePlay(e) {
        if (e) e.stopPropagation();
        if (!elements.previewVideo) return;
        elements.previewVideo.paused ? elements.previewVideo.play() : elements.previewVideo.pause();
    }

    function closeVideoPreview() {
        if (!elements.previewContainer) return;
        
        elements.previewContainer.classList.remove('active');
        elements.previewContainer.classList.add('is-paused');
        
        if (!document.getElementById('mobileMenu')?.classList.contains('active')) {
            document.body.classList.remove('menu-open');
        } else {
            document.body.style.overflow = '';
        }
        
        setTimeout(() => {
            elements.previewVideo.pause();
            elements.previewVideo.currentTime = 0;
            elements.previewVideo.src = '';
            document.body.style.overflow = '';
        }, 500);
    }

    function initVideoModal() {
        if (!elements.previewContainer || !elements.previewVideo) return;

        elements.previewContainer.addEventListener('mousemove', handleUserActivity);
        elements.previewContainer.addEventListener('click', handleUserActivity);

        if (elements.playPauseBtn) elements.playPauseBtn.onclick = togglePlay;
        elements.previewVideo.onclick = togglePlay;

        if (elements.modalPlayContainer) {
            elements.modalPlayContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePlay();
            });
        }

        elements.previewVideo.addEventListener('play', updatePlayButtonUI);
        elements.previewVideo.addEventListener('pause', updatePlayButtonUI);

        elements.previewVideo.addEventListener('timeupdate', () => {
            const percent = (elements.previewVideo.currentTime / elements.previewVideo.duration) * 100;
            if (elements.progressPlayed) elements.progressPlayed.style.width = percent + '%';
            if (elements.progressSlider) elements.progressSlider.value = percent;
            if (elements.currentTimeEl) elements.currentTimeEl.textContent = formatTime(elements.previewVideo.currentTime);
        });

        elements.previewVideo.addEventListener('loadedmetadata', () => {
            if (elements.durationTimeEl) elements.durationTimeEl.textContent = formatTime(elements.previewVideo.duration);
        });

        if (elements.rewindBtn) elements.rewindBtn.onclick = (e) => { e.stopPropagation(); elements.previewVideo.currentTime -= 5; };
        if (elements.forwardBtn) elements.forwardBtn.onclick = (e) => { e.stopPropagation(); elements.previewVideo.currentTime += 5; };

        if (elements.progressSlider) {
            elements.progressSlider.oninput = function(e) {
                e.stopPropagation();
                elements.previewVideo.currentTime = (this.value / 100) * elements.previewVideo.duration;
            };
        }

        if (elements.volumeSlider) {
            elements.volumeSlider.oninput = function(e) {
                e.stopPropagation();
                elements.previewVideo.volume = this.value / 100;
            };
        }

        if (elements.fullscreenBtn) {
            elements.fullscreenBtn.onclick = (e) => {
                e.stopPropagation();
                if (document.fullscreenElement) document.exitFullscreen();
                else if (elements.previewVideo.requestFullscreen) elements.previewVideo.requestFullscreen();
            };
        }

        if (elements.closePreview) elements.closePreview.onclick = closeVideoPreview;

        document.addEventListener('keydown', (e) => {
            if (elements.previewContainer.classList.contains('active')) {
                if (e.key === ' ') { e.preventDefault(); togglePlay(); }
                if (e.key === 'ArrowLeft') elements.previewVideo.currentTime -= 5;
                if (e.key === 'ArrowRight') elements.previewVideo.currentTime += 5;
            }
        });
    }

    /* ============================================================
       15. PLAY BUTTON MOUSE FOLLOW EFFECT
       ============================================================ */

    function initPlayButtonFollow() {
        const playBtn = document.getElementById('mainPlayBtnContainer');
        const heroSection = document.querySelector('.hero-section');
        
        if (!playBtn || !heroSection) return;
        
        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        
        const maxMove = 15;
        const ease = 0.08;
        const activationRadius = 250;
        
        heroSection.addEventListener('mousemove', (e) => {
            const btnRect = playBtn.getBoundingClientRect();
            const btnCenterX = btnRect.left + btnRect.width / 2;
            const btnCenterY = btnRect.top + btnRect.height / 2;
            
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            const distance = Math.sqrt(
                Math.pow(mouseX - btnCenterX, 2) + 
                Math.pow(mouseY - btnCenterY, 2)
            );
            
            if (distance < activationRadius) {
                const strength = 1 - (distance / activationRadius);
                targetX = ((mouseX - btnCenterX) / activationRadius) * maxMove * strength;
                targetY = ((mouseY - btnCenterY) / activationRadius) * maxMove * strength;
            } else {
                targetX = 0;
                targetY = 0;
            }
        });
        
        heroSection.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
        });
        
        function animate() {
            currentX += (targetX - currentX) * ease;
            currentY += (targetY - currentY) * ease;
            
            playBtn.style.setProperty('--ring-x', `${currentX}px`);
            playBtn.style.setProperty('--ring-y', `${currentY}px`);
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }

    /* ============================================================
       16. INITIALIZATION
       ============================================================ */
    
    async function init() {
        // Əvvəlcə tərcümələri yüklə
        await loadTranslations();
        
        initGSAP();
        initPageTransition();
        initLanguageSelector();
        initMobileMenu();
        initLoadingScreen();
        initVideoAutoplay();
        initNavigation();
        initVideoSlider();
        initVideoModal();
        initPlayButtonFollow();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();