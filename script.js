/* ============================================================
   CineChord Index (Home) - Main JavaScript
   Version: 2.0 - ARCHIVE PATTERN + GSAP
   Description: Professional home page with video slider
   ============================================================ */

// Global video configuration
window.CONFIG = {
    videos: ['videos/Showreel.mp4', 'videos/ABB TamGenc Card.mp4', 'videos/Bakcell 099.mp4', 'videos/Yaz furseti kampaniyasi!.mp4', 'videos/Yeni dovr.mp4'],
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
        ".header", ".center-logo", ".name-left", ".name-right",
        ".play-button-container", ".right-floating-nav", ".bottom-right-socials", ".bottom-left-copyright"
    ];

    /* ============================================================
       3. STATE VARIABLES
       ============================================================ */
    
    let isTransitioning = false;
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

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    function applyScrambleEffect(element, textElement, originalText) {
        let iteration = 0;
        clearInterval(element.interval);
        element.interval = setInterval(() => {
            textElement.innerText = originalText.split("").map((letter, index) => {
                if (index < iteration) return originalText[index];
                return letters[Math.floor(Math.random() * letters.length)];
            }).join("");
            if (iteration >= originalText.length) clearInterval(element.interval);
            iteration += 1 / 3;
        }, 30);
    }

    /* ============================================================
       5. PAGE TRANSITION SYSTEM (SLIDE EFFECT)
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
       6. MOBILE NAVIGATION & HAMBURGER
       ============================================================ */
    
    function initMobileMenu() {
        const hamburger = document.createElement('div');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        hamburger.setAttribute('aria-label', 'Toggle menu');
        hamburger.setAttribute('role', 'button');
        
        if (elements.header) {
            elements.header.appendChild(hamburger);
        }

        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        
        document.querySelectorAll('.nav-left .nav-btn, .nav-right .nav-btn').forEach(btn => {
            const clone = btn.cloneNode(true);
            clone.style.animation = 'none';
            clone.style.opacity = '1';
            clone.style.visibility = 'visible';
            mobileMenu.appendChild(clone);
        });
        
        document.body.appendChild(overlay);
        document.body.appendChild(mobileMenu);

        function toggleMenu() {
            const isActive = hamburger.classList.contains('active');
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = isActive ? '' : 'hidden';
        }

        hamburger.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
        
        mobileMenu.addEventListener('click', function(e) {
            const btn = e.target.closest('.nav-btn');
            if (btn) {
                const href = btn.getAttribute('href');
                if (href && href !== '#' && !href.startsWith('#')) {
                    e.preventDefault();
                    toggleMenu();
                    setTimeout(() => navigateWithTransition(href), 100);
                }
            }
        });

        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 768 && hamburger.classList.contains('active')) {
                    toggleMenu();
                }
            }, CONFIG.RESIZE_DEBOUNCE);
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

        mainTl.to(".header", { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" }, startDelay);
        mainTl.to(".center-logo", { y: 0, autoAlpha: 1, duration: 0.9, ease: "power2.out" }, startDelay);
        mainTl.to(".name-left", { y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" }, startDelay + 0.05);
        mainTl.to(".name-right", { y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" }, startDelay + 0.1);
        mainTl.to(".play-button-container", { y: 0, autoAlpha: 1, duration: 0.95, ease: "power2.out" }, startDelay + 0.1);
        mainTl.to(".right-floating-nav", { y: 0, autoAlpha: 1, duration: 0.85, ease: "power2.out" }, startDelay + 0.15);
        mainTl.to(".bottom-right-socials", { y: 0, autoAlpha: 1, duration: 0.85, ease: "power2.out" }, startDelay + 0.2);
        mainTl.to(".bottom-left-copyright", { y: 0, autoAlpha: 1, duration: 0.85, ease: "power2.out" }, startDelay + 0.25);
    }

    /* ============================================================
       8. LOADING SCREEN LOGIC
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
       9. NAVIGATION & SCRAMBLE EFFECT
       ============================================================ */
    
    function setupNavButtons() {
        const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])');
        internalLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                const linkPath = href ? href.split('/').pop() : '';
                const currentPath = window.location.pathname.split('/').pop();
                
                if (!href || href === '#' || linkPath === currentPath) return;
                
                e.preventDefault();
                navigateWithTransition(href);
            });
        });
    }

    function initNavigation() {
        setupNavButtons();

        // Scramble effect
        document.querySelectorAll(".nav-btn").forEach(btn => {
            btn.addEventListener("mouseenter", () => {
                if (btn.classList.contains('active')) return;
                const textSpan = btn.querySelector(".nav-text");
                const originalText = btn.getAttribute("data-text");
                if (textSpan && originalText) applyScrambleEffect(btn, textSpan, originalText);
            });
        });

        // Main play button scramble
        const mainPlayBtn = document.getElementById('mainPlayBtnContainer');
        if (mainPlayBtn) {
            const playTextSpan = mainPlayBtn.querySelector('.play-text');
            mainPlayBtn.addEventListener("mouseenter", () => {
                if (playTextSpan) applyScrambleEffect(mainPlayBtn, playTextSpan, "PLAY");
            });
        }
    }

    /* ============================================================
       10. VIDEO SLIDER
       ============================================================ */
    
    function initVideoSlider() {
        if (!elements.videoContainer || !currentVideoEl) return;

        currentVideoEl.loop = false;
        currentVideoEl.onended = () => changeVideo('next');

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
            nextVideoEl.loop = false;
            nextVideoEl.playsInline = true;
            nextVideoEl.onended = () => changeVideo('next');

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
       11. VIDEO MODAL
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
        const modalPlayText = elements.modalPlayContainer ? elements.modalPlayContainer.querySelector('.play-text') : null;
        
        if (elements.previewVideo.paused) {
            if (elements.playIcon) elements.playIcon.style.display = 'block';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'none';
            elements.previewContainer.classList.add('is-paused');
            elements.previewContainer.classList.remove('user-inactive');
            clearTimeout(activityTimeout);
            
            if (modalPlayText && modalPlayText.innerText !== "PLAY") {
                applyScrambleEffect(elements.modalPlayContainer, modalPlayText, "PLAY");
            }
        } else {
            if (elements.playIcon) elements.playIcon.style.display = 'none';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'block';
            elements.previewContainer.classList.remove('is-paused');
            handleUserActivity();
            
            if (modalPlayText && modalPlayText.innerText !== "PAUSE") {
                applyScrambleEffect(elements.modalPlayContainer, modalPlayText, "PAUSE");
            }
        }
    }

    function togglePlay(e) {
        if (e) e.stopPropagation();
        if (!elements.previewVideo) return;
        
        if (elements.previewVideo.paused) {
            elements.previewVideo.play();
        } else {
            elements.previewVideo.pause();
        }
    }

    function closeVideoPreview() {
        if (!elements.previewContainer) return;
        
        elements.previewContainer.classList.remove('active');
        elements.previewContainer.classList.add('is-paused');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            elements.previewVideo.pause();
            elements.previewVideo.currentTime = 0;
            elements.previewVideo.src = '';
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
            
            const modalPlayTextSpan = elements.modalPlayContainer.querySelector('.play-text');
            elements.modalPlayContainer.addEventListener("mouseenter", () => {
                const currentText = elements.previewVideo.paused ? "PLAY" : "PAUSE";
                if (modalPlayTextSpan) applyScrambleEffect(elements.modalPlayContainer, modalPlayTextSpan, currentText);
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
                if (e.key === 'Escape') closeVideoPreview();
                if (e.key === ' ') { e.preventDefault(); togglePlay(); }
                if (e.key === 'ArrowLeft') elements.previewVideo.currentTime -= 5;
                if (e.key === 'ArrowRight') elements.previewVideo.currentTime += 5;
            }
        });
    }

    /* ============================================================
       12. INITIALIZATION
       ============================================================ */
    
    function init() {
        initGSAP();
        initPageTransition();
        initMobileMenu();
        initLoadingScreen();
        initNavigation();
        initVideoSlider();
        initVideoModal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();