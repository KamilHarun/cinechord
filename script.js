/* ============================================================
   CineChord Index - Main JavaScript
   Version: 5.3 - MOBILE AUTOPLAY OVERLAY FIX
   ============================================================ */

const SHOWREEL_VIDEO_URL = "https://res.cloudinary.com/dinncr6hs/video/upload/CineChord_Showreel_1_1_y9lq3g.mp4";

// Global video configuration
window.CONFIG = {
    videos: [
        SHOWREEL_VIDEO_URL,
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
    let currentVideoEl = null;
    let videoShouldPlay = false;

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

        const hamburgerTextEl = document.querySelector('.hamburger-text');
        if (hamburgerTextEl) {
            const isMenuOpen = hamburger && hamburger.classList.contains('active');
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

        const playTexts = document.querySelectorAll('.play-text');
        playTexts.forEach(el => {
            el.textContent = t.play;
            el.setAttribute('data-text', t.play);
        });

        const exploreText = document.querySelector('.explore-text');
        if (exploreText) {
            exploreText.textContent = t.explore;
        }

        const loaderAuthorSpan = document.querySelector('.loader-author span');
        if (loaderAuthorSpan) {
            loaderAuthorSpan.textContent = t.designed_by;
        }

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
       8. MOBILE MENU
       ============================================================ */

    function toggleMenu() {
        if (!hamburger || !mobileMenu) return;

        const isActive = hamburger.classList.contains('active');
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        const langSelector = document.getElementById('langSelector');
        if (langSelector) langSelector.classList.remove('active');
        
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        
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
                        videoShouldPlay = true; 
                        revealSite(); 
                    }
                });
            }
        });
    }

   function revealSite(isPageTransition = false) {
        if (typeof gsap === 'undefined') return;
        
        const mainTl = gsap.timeline({
            onStart: () => {
                if (window.startHeroVideo) {
                    window.startHeroVideo();
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
       10. VIDEO AUTOPLAY - MOBİL OVERLAY FİX
       ============================================================ */
    
    function initVideoAutoplay() {
        if (!currentVideoEl) return;
        
        const video = currentVideoEl;
        
        // Məcburi atributlar
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;
        video.preload = 'auto'; // ƏLAVƏ
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('preload', 'auto'); // ƏLAVƏ
        
        video.removeAttribute('controls');
        video.controls = false;
        
        // Pointer events söndür - MOBİL OVERLAY BLOKLU
        video.style.pointerEvents = 'none'; // ƏLAVƏ
        
        function attemptPlay() {
            if (!videoShouldPlay) return;
            
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Video started successfully');
                }).catch(error => {
                    console.warn("Autoplay failed:", error);
                    
                    const playOnInteraction = () => {
                        video.play().then(() => {
                            console.log('Video started after interaction');
                        });
                    };
                    
                    ['click', 'touchstart', 'touchend', 'keydown'].forEach(ev => 
                        document.addEventListener(ev, playOnInteraction, { once: true, passive: true })
                    );
                });
            }
        }
        
        window.startHeroVideo = attemptPlay;
        
        video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            attemptPlay();
        }, { once: true });
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && video.paused && videoShouldPlay) {
                attemptPlay();
            }
        });

        video.addEventListener('pause', () => {
            if (!document.hidden && video.currentTime > 0 && videoShouldPlay) {
                setTimeout(() => attemptPlay(), 100);
            }
        });
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
       13. VIDEO SLIDER - MOBİL AUTOPLAY FİX
       ============================================================ */
    
    function initVideoSlider() {
        if (!elements.videoContainer) return;
        
        elements.videoContainer.querySelectorAll('video.hero-bg').forEach(v => v.remove());

        const firstVideo = document.createElement('video');
        firstVideo.id = 'heroBgVideo';
        firstVideo.className = 'hero-bg';
        
        // MƏCBUR atributlar - mobil üçün kritik
        firstVideo.muted = true;
        firstVideo.loop = true;
        firstVideo.playsInline = true;
        firstVideo.autoplay = true;
        firstVideo.preload = 'auto'; // ƏLAVƏ
        firstVideo.setAttribute('muted', '');
        firstVideo.setAttribute('playsinline', 'true');
        firstVideo.setAttribute('webkit-playsinline', 'true');
        firstVideo.setAttribute('preload', 'auto'); // ƏLAVƏ
        
        // Pointer events söndür - MOBİL OVERLAY İNTERACTİON BLOKLU
        firstVideo.style.pointerEvents = 'none'; // ƏLAVƏ
        
        firstVideo.src = window.CONFIG.videos[window.currentIndex];
        
        const overlay = document.querySelector('.hero-overlay');
        if (overlay) {
            elements.videoContainer.insertBefore(firstVideo, overlay);
        } else {
            elements.videoContainer.appendChild(firstVideo);
        }
        
        currentVideoEl = firstVideo;

        // AGGRESSİV AUTOPLAY MEXANİZMİ - YAXŞILAŞDIRILMIŞ
        const forcePlay = () => {
            const playPromise = firstVideo.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn('Autoplay blocked, waiting for interaction:', err);
                    
                    const startOnTouch = () => {
                        firstVideo.play();
                        ['click', 'touchstart', 'touchend'].forEach(ev => 
                            document.removeEventListener(ev, startOnTouch)
                        );
                    };
                    
                    ['click', 'touchstart', 'touchend'].forEach(ev => 
                        document.addEventListener(ev, startOnTouch, { once: true, passive: true })
                    );
                });
            }
        };

        // ƏLAVƏ EVENT LİSTENERLƏR - ÇOXLU TETRİK POINT
        firstVideo.addEventListener('loadedmetadata', forcePlay);
        firstVideo.addEventListener('loadeddata', forcePlay);
        firstVideo.addEventListener('canplay', forcePlay);
        firstVideo.addEventListener('canplaythrough', forcePlay);
        
        // 1 saniyə sonra yenidən cəhd
        setTimeout(forcePlay, 1000);
        
        // 2 saniyə sonra son cəhd
        setTimeout(forcePlay, 2000);

        // UI Yeniləmə
        function updateInfoUI(index = window.currentIndex) {
            const total = String(window.CONFIG.videos.length).padStart(2, '0');
            const current = String(index + 1).padStart(2, '0');
            if (elements.projectCounter) elements.projectCounter.textContent = `${current} — ${total}`;
            if (elements.projectName) elements.projectName.textContent = window.CONFIG.titles[index];
        }

        updateInfoUI();

        if (elements.nextBtn) elements.nextBtn.onclick = () => changeVideo('next');
        if (elements.prevBtn) elements.prevBtn.onclick = () => changeVideo('prev');
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