/* ============================================================
   CineChord Index - Main JavaScript
   Version: 4.4 - HAMBURGER ICON FIX
   ============================================================ */

// Global video configuration
window.CONFIG = {
    videos: [
        'videos/Showreel.mp4',
        'videos/ABB-TamGenc-Card.mp4',
        'videos/Bakcell-099.mp4',
        'videos/Yaz-furseti-kampaniyasi.mp4',
        'videos/Yeni-dovr.mp4'
    ],
    titles: ['SHOWREEL', 'ABB TAM GENC', 'BAKCELL 099', 'ABB YAZ FÜRSƏTİ', 'BAKCELL YENİ DÖVR']
};
window.currentIndex = 0;

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
        header: document.querySelector('.header'),
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

    const UI_ELEMENTS = [
        ".center-logo", 
        ".play-button-container", 
        ".right-floating-nav", 
        ".bottom-right-socials", 
        ".bottom-left-explore"
    ];

    /* ============================================================
       3. STATE VARIABLES
       ============================================================ */
    
    let isAnimating = false;
    let activityTimeout = null;
    let currentVideoEl = elements.heroBgVideo;

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
       5. PAGE TRANSITION SYSTEM
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
       6. MOBILE MENU - HAMBURGER ICON FIX
       ============================================================ */

    function initMobileMenu() {
        const hamburger = document.getElementById('hamburgerBtn');
        const hamburgerText = hamburger?.querySelector('.hamburger-text');
        const mobileMenu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('mobileMenuOverlay');
        const centerLogo = document.querySelector('.center-logo');

        if (!hamburger || !mobileMenu) {
            console.error('Menu elementləri tapılmadı!');
            return;
        }

        function toggleMenu() {
            const isActive = hamburger.classList.contains('active');
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
            
            if (hamburgerText) {
                hamburgerText.textContent = isActive ? 'MENU' : 'CLOSE';
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

        // Event handler function
        function handleHamburgerClick(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        }

        // Click event
        hamburger.addEventListener('click', handleHamburgerClick);
        
        // Touch event - mobile üçün daha etibarlı
        hamburger.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        }, { passive: false });

        // Document səviyyəsində event delegation - child elementlərə basılanda da işləyir
        document.addEventListener('click', function(e) {
            // Hamburger və ya onun child-larına basılıbsa
            if (e.target.id === 'hamburgerBtn' || e.target.closest('#hamburgerBtn')) {
                // Artıq yuxarıdakı listener handle edib, amma əgər etməyibsə:
                if (!e.defaultPrevented) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu();
                }
            }
        }, true); // Capture phase-də tutmaq üçün

        if (overlay) {
            overlay.addEventListener('click', function(e) {
                e.preventDefault();
                toggleMenu();
            });
        }

        // Mobil Menyu Linkləri
        const navLinks = mobileMenu.querySelectorAll('.nav-btn');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const href = this.getAttribute('href');
                
                if (!href || href === '#' || this.classList.contains('active')) {
                    toggleMenu();
                    return;
                }

                toggleMenu();
                
                setTimeout(() => {
                    navigateWithTransition(href);
                }, 200);
            });
        });

        // ESC düyməsi - video modal prioriteti
        document.addEventListener('keydown', function(e) {
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
       7. GSAP ANIMATIONS
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
                    }
                });
            }
        });
    }

    function revealSite(isPageTransition = false) {
        if (typeof gsap === 'undefined') return;
        
        const mainTl = gsap.timeline();
        
        if (isPageTransition && elements.loadingScreen) {
            mainTl.to(elements.loadingScreen, {
                y: "100%",
                duration: 0.9,
                ease: "expo.inOut"
            }, 0);
        }
        
        const startDelay = isPageTransition ? "-=0.7" : 0;

        mainTl.to(".center-logo", { y: 0, autoAlpha: 1, duration: 0.9, ease: "power2.out" }, startDelay);
        mainTl.to(".play-button-container", { y: 0, autoAlpha: 1, duration: 0.95, ease: "power2.out" }, startDelay + 0.1);
        mainTl.to(".right-floating-nav", { y: 0, autoAlpha: 1, duration: 0.85, ease: "power2.out" }, startDelay + 0.15);
        mainTl.to(".bottom-right-socials", { y: 0, autoAlpha: 1, duration: 0.85, ease: "power2.out" }, startDelay + 0.2);
        mainTl.to(".bottom-left-explore", { y: 0, autoAlpha: 1, duration: 0.85, ease: "power2.out" }, startDelay + 0.25);
    }
    
    /* ============================================================
       8. VIDEO AUTOPLAY CHECK - Mobil uyumlu
       ============================================================ */
    function initVideoAutoplay() {
        if (!elements.heroBgVideo) return;
        
        const video = elements.heroBgVideo;
        
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
    }

    /* ============================================================
       9. LOADING SCREEN LOGIC
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
       10. NAVIGATION - Menyu xaricindəki linklər
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
       11. VIDEO SLIDER 
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
       12. VIDEO MODAL
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
        
        if (elements.previewVideo.paused) {
            if (elements.playIcon) elements.playIcon.style.display = 'block';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'none';
            elements.previewContainer.classList.add('is-paused');
            elements.previewContainer.classList.remove('user-inactive');
            clearTimeout(activityTimeout);
            if (modalPlayText) modalPlayText.textContent = 'PLAY';
        } else {
            if (elements.playIcon) elements.playIcon.style.display = 'none';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'block';
            elements.previewContainer.classList.remove('is-paused');
            handleUserActivity();
            if (modalPlayText) modalPlayText.textContent = 'PAUSE';
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

        // Video modal keyboard controls
        document.addEventListener('keydown', (e) => {
            if (elements.previewContainer.classList.contains('active')) {
                if (e.key === ' ') { e.preventDefault(); togglePlay(); }
                if (e.key === 'ArrowLeft') elements.previewVideo.currentTime -= 5;
                if (e.key === 'ArrowRight') elements.previewVideo.currentTime += 5;
            }
        });
    }

    /* ============================================================
       13. PLAY BUTTON MOUSE FOLLOW EFFECT
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
       14. INITIALIZATION
       ============================================================ */
    
    function init() {
        initGSAP();
        initPageTransition();
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