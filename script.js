// ============================================================
// GLOBAL VARIABLES & FUNCTIONS (MÜTLƏQ İŞLƏMƏSİ ÜÇÜN)
// ============================================================
window.CONFIG = {
    videos: ['videos/Showreel.mp4', 'videos/ABB TamGenc Card.mp4', 'videos/Bakcell 099.mp4', 'videos/Yaz furseti kampaniyasi!.mp4', 'videos/Yeni dovr.mp4'],
    titles: ['SHOWREEL', 'ABB TAM GENC', 'BAKCELL 099', 'ABB YAZ FÜRSƏTİ', 'BAKCELL YENİ DÖVR']
};
window.currentIndex = 0;

// Bu funksiya HTML-dəki onclick tərəfindən birbaşa çağırılır
window.openMainVideo = function() {
    console.log("Play Button FORCE clicked!");
    const previewContainer = document.getElementById('previewContainer');
    const previewVideo = document.getElementById('previewVideo');
    const videoLoading = document.querySelector('.video-loading');
    const previewTitle = document.getElementById('previewTitle');

    if (previewContainer && previewVideo) {
        if(videoLoading) videoLoading.style.display = 'block';
        
        // Use Global Index
        previewVideo.src = window.CONFIG.videos[window.currentIndex];
        if(previewTitle) previewTitle.textContent = window.CONFIG.titles[window.currentIndex];
        
        previewContainer.classList.remove('is-paused');
        previewContainer.classList.add('active');
        document.body.style.overflow = 'hidden';

        const playPromise = previewVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                if(videoLoading) videoLoading.style.display = 'none';
            }).catch(error => {
                console.log("Autoplay prevented:", error);
                if(videoLoading) videoLoading.style.display = 'none';
            });
        }
    }
};

// ============================================================
// MAIN DOM LOGIC
// ============================================================
document.addEventListener('DOMContentLoaded', function() {

    // 1. SETUP & ELEMENTS
    const loadingScreen = document.querySelector('.loading-screen');
    const loaderContent = document.querySelector('.loader-content');
    const loaderFill = document.querySelector('.loader-bar-fill');
    const loaderText = document.querySelector('.loader-percentage');
    const loaderLogo = document.querySelector('.loader-logo');
    const loaderAuthor = document.querySelector('.loader-author');
    
    const uiElements = [
        ".header", ".center-logo", ".name-left", ".name-right",
        ".play-button-container", ".right-floating-nav", ".bottom-right-socials", ".bottom-left-copyright"
    ];

    if (typeof gsap !== 'undefined') {
        gsap.set(".hero-section", { autoAlpha: 1 });
        gsap.set(uiElements, { y: 50, autoAlpha: 0 });
    }

    // 2. LOGIC: FIRST LOAD vs RETURN
    const hasIntroShown = sessionStorage.getItem('introShown');

    if (hasIntroShown) {
        if(loaderContent) {
            loaderContent.style.display = "none";
            gsap.set(loaderContent, { autoAlpha: 0 });
        }
        if (loadingScreen) {
            gsap.set(loadingScreen, { y: "0%", display: "flex", opacity: 1 });
        }
        setTimeout(() => revealSite(true), 50);

    } else {
        sessionStorage.setItem('introShown', 'true');
        if(loaderContent) {
            gsap.set(loaderContent, { autoAlpha: 1, visibility: "visible" });
            gsap.set(loaderLogo, { opacity: 1 });
            gsap.set(loaderAuthor, { visibility: "visible" });
        }
        runLoadingAnimation();
    }

    // 3. LOADING ANIMATION
    function runLoadingAnimation() {
        if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline();
            tl.fromTo(loaderLogo, { scale: 0.8 }, { scale: 1, duration: 1.2, ease: "power2.out" }, 0)
              .to(loaderAuthor, { opacity: 1, duration: 0.5 }, "-=1")
              .to(loaderFill, {
                width: "100%", duration: 2.5, ease: "power2.inOut",
                onUpdate: function() {
                    let prog = Math.round(this.progress() * 100);
                    if(loaderText) loaderText.textContent = prog + "%";
                },
                onComplete: () => {
                    gsap.to(loadingScreen, {
                        y: "-100%", duration: 1.4, ease: "power4.inOut",
                        onComplete: () => {
                            if(loadingScreen) loadingScreen.style.display = "none";
                            revealSite();
                        }
                    });
                }
            });
        } else {
            revealSite();
        }
    }

    // 4. REVEAL SITE
    function revealSite(isPageTransition = false) {
        const mainTl = gsap.timeline();
        if (isPageTransition && loadingScreen) {
            mainTl.to(loadingScreen, {
                y: "100%", duration: 1.1, ease: "expo.inOut",
                onComplete: () => { loadingScreen.style.display = "none"; }
            });
        }
        const uiDelay = isPageTransition ? "-=0.9" : "-=0.5";
        mainTl.to(uiElements, {
            y: 0, autoAlpha: 1, duration: 1.0, stagger: 0.05, ease: "power2.out"
        }, uiDelay);
    }

    // 5. EXIT
    function navigateWithTransition(href) {
        const pageTransition = document.querySelector('.page-transition');
        if (pageTransition) {
            pageTransition.classList.add('active');
            setTimeout(() => { window.location.href = href; }, 600);
        } else if (loadingScreen) {
            loadingScreen.style.display = "flex";
            if(loaderContent) gsap.set(loaderContent, { autoAlpha: 0, visibility: "hidden" });
            gsap.fromTo(loadingScreen, 
                { y: "-100%" },
                { y: "0%", duration: 1.1, ease: "expo.inOut", onComplete: () => { window.location.href = href; } }
            );
        } else {
            window.location.href = href;
        }
    }
    const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && !href.includes(window.location.pathname.split('/').pop())) {
                e.preventDefault();
                navigateWithTransition(href);
            }
        });
    });

    // 6. VIDEO SLIDER & SCRAMBLE
    const videoContainer = document.getElementById('videoContainer');
    let currentVideoEl = document.getElementById('heroBgVideo');
    const projectCounter = document.getElementById('projectCounter');
    const projectName = document.getElementById('projectName');
    const prevBtn = document.getElementById('prevVideoBtn');
    const nextBtn = document.getElementById('nextVideoBtn');
    let isAnimating = false;

    if (currentVideoEl) {
        currentVideoEl.loop = false;
        currentVideoEl.onended = () => changeVideo('next');
    }

    function changeVideo(direction) {
        if (isAnimating) return;
        isAnimating = true;
        // Update global index
        if(direction === 'next') {
            window.currentIndex = (window.currentIndex + 1) % window.CONFIG.videos.length;
        } else {
            window.currentIndex = (window.currentIndex - 1 + window.CONFIG.videos.length) % window.CONFIG.videos.length;
        }
        
        const nextVideoEl = document.createElement('video');
        nextVideoEl.className = 'hero-bg'; nextVideoEl.src = window.CONFIG.videos[window.currentIndex];
        nextVideoEl.autoplay = true; nextVideoEl.muted = true; nextVideoEl.loop = false;
        nextVideoEl.playsInline = true;
        nextVideoEl.onended = () => changeVideo('next');

        if(typeof gsap !== 'undefined'){
            gsap.set(nextVideoEl, { autoAlpha: 1 });
            videoContainer.insertBefore(nextVideoEl, document.querySelector('.hero-overlay'));
            const startX = direction === 'next' ? "100%" : "-100%";
            const endXOld = direction === 'next' ? "-100%" : "100%";
            gsap.set(nextVideoEl, { x: startX });

            nextVideoEl.onloadeddata = () => {
                const tl = gsap.timeline({
                    onComplete: () => {
                        if(currentVideoEl) currentVideoEl.remove();
                        currentVideoEl = nextVideoEl;
                        isAnimating = false;
                    }
                });
                tl.to(currentVideoEl, { x: endXOld, duration: 1.2, ease: "power3.inOut" }, 0)
                  .to(nextVideoEl, { x: "0%", duration: 1.2, ease: "power3.inOut" }, 0);
                updateInfoUI(window.currentIndex);
            };
        }
    }

    function updateInfoUI(index = window.currentIndex) {
        const total = String(window.CONFIG.videos.length).padStart(2, '0');
        const current = String(index + 1).padStart(2, '0');
        if(projectCounter && projectName) {
            if(typeof gsap !== 'undefined') gsap.fromTo([projectCounter, projectName], { y: 15, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 });
            projectCounter.textContent = `${current} — ${total}`;
            projectName.textContent = window.CONFIG.titles[index];
        }
    }

    updateInfoUI(); // init

    if(nextBtn) nextBtn.addEventListener('click', () => changeVideo('next'));
    if(prevBtn) prevBtn.addEventListener('click', () => changeVideo('prev'));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') changeVideo('next');
        if (e.key === 'ArrowLeft') changeVideo('prev');
    });

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    function applyScrambleEffect(element, textElement, originalText) {
        let iteration = 0; clearInterval(element.interval);
        element.interval = setInterval(() => {
            textElement.innerText = originalText.split("").map((letter, index) => {
                if (index < iteration) return originalText[index];
                return letters[Math.floor(Math.random() * letters.length)];
            }).join("");
            if (iteration >= originalText.length) clearInterval(element.interval);
            iteration += 1 / 3;
        }, 30);
    }

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("mouseenter", () => {
            if(btn.classList.contains('active')) return;
            const textSpan = btn.querySelector(".nav-text"); const originalText = btn.getAttribute("data-text");
            if(textSpan && originalText) applyScrambleEffect(btn, textSpan, originalText);
        });
    });

    // 7. MODAL CONTROLS (Play button is handled via global function now)
    const previewContainer = document.getElementById('previewContainer');
    const previewVideo = document.getElementById('previewVideo');
    const closePreview = document.getElementById('closePreview');
    const modalPlayContainer = document.getElementById('modalPlayBtnContainer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const progressSlider = document.getElementById('progressSlider');
    const progressPlayed = document.getElementById('progressPlayed');
    const currentTimeEl = document.getElementById('currentTime');
    const durationTimeEl = document.getElementById('durationTime');
    const volumeSlider = document.getElementById('volumeSlider');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // Main Play Button Hover Effect (SCRAMBLE ONLY)
    const mainPlayBtn = document.getElementById('mainPlayBtnContainer');
    if (mainPlayBtn) {
        const playTextSpan = mainPlayBtn.querySelector('.play-text');
        mainPlayBtn.addEventListener("mouseenter", () => {
            applyScrambleEffect(mainPlayBtn, playTextSpan, "PLAY");
        });
        // Click handled by onclick attribute in HTML
    }

    if (previewContainer && previewVideo) {
        function formatTime(seconds) {
            if (isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        let activityTimeout;
        function handleUserActivity() {
            previewContainer.classList.remove('user-inactive');
            clearTimeout(activityTimeout);
            if (!previewVideo.paused) {
                activityTimeout = setTimeout(() => {
                    previewContainer.classList.add('user-inactive');
                }, 2000);
            }
        }

        previewContainer.addEventListener('mousemove', handleUserActivity);
        previewContainer.addEventListener('click', handleUserActivity);

        function updatePlayButtonUI() {
            const modalPlayText = modalPlayContainer ? modalPlayContainer.querySelector('.play-text') : null;
            
            if (previewVideo.paused) {
                if(playIcon) playIcon.style.display = 'block';
                if(pauseIcon) pauseIcon.style.display = 'none';
                previewContainer.classList.add('is-paused');
                previewContainer.classList.remove('user-inactive'); 
                clearTimeout(activityTimeout);
                
                if(modalPlayText) {
                    modalPlayText.setAttribute('data-text', 'PLAY');
                    if(modalPlayText.innerText !== "PLAY") applyScrambleEffect(modalPlayContainer, modalPlayText, "PLAY");
                }
            } else {
                if(playIcon) playIcon.style.display = 'none';
                if(pauseIcon) pauseIcon.style.display = 'block';
                previewContainer.classList.remove('is-paused');
                handleUserActivity();
                
                if(modalPlayText) {
                    modalPlayText.setAttribute('data-text', 'PAUSE');
                    if(modalPlayText.innerText !== "PAUSE") applyScrambleEffect(modalPlayContainer, modalPlayText, "PAUSE");
                }
            }
        }

        function togglePlay(e) {
            if(e) e.stopPropagation();
            if (previewVideo.paused) {
                previewVideo.play();
            } else {
                previewVideo.pause();
            }
        }

        if(playPauseBtn) playPauseBtn.onclick = togglePlay;
        previewVideo.onclick = togglePlay;
        
        if (modalPlayContainer) {
            modalPlayContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePlay();
            });
            const modalPlayTextSpan = modalPlayContainer.querySelector('.play-text');
            modalPlayContainer.addEventListener("mouseenter", () => {
                const currentText = previewVideo.paused ? "PLAY" : "PAUSE";
                applyScrambleEffect(modalPlayContainer, modalPlayTextSpan, currentText);
            });
        }

        previewVideo.addEventListener('play', updatePlayButtonUI);
        previewVideo.addEventListener('pause', updatePlayButtonUI);
        
        previewVideo.addEventListener('timeupdate', () => {
            const percent = (previewVideo.currentTime / previewVideo.duration) * 100;
            if(progressPlayed) progressPlayed.style.width = percent + '%';
            if(progressSlider) progressSlider.value = percent;
            if(currentTimeEl) currentTimeEl.textContent = formatTime(previewVideo.currentTime);
        });
        
        previewVideo.addEventListener('loadedmetadata', () => {
            if(durationTimeEl) durationTimeEl.textContent = formatTime(previewVideo.duration);
        });

        if(rewindBtn) rewindBtn.onclick = (e) => { e.stopPropagation(); previewVideo.currentTime -= 5; };
        if(forwardBtn) forwardBtn.onclick = (e) => { e.stopPropagation(); previewVideo.currentTime += 5; };
        
        if(progressSlider) progressSlider.oninput = function(e) { 
            e.stopPropagation(); 
            previewVideo.currentTime = (this.value/100) * previewVideo.duration; 
        };
        
        if(volumeSlider) volumeSlider.oninput = function(e) { 
            e.stopPropagation(); 
            previewVideo.volume = this.value / 100; 
        };
        
        if(fullscreenBtn) fullscreenBtn.onclick = (e) => {
            e.stopPropagation();
            if(document.fullscreenElement) document.exitFullscreen();
            else if(previewVideo.requestFullscreen) previewVideo.requestFullscreen();
        };

        function closeVideoPreview() {
            previewContainer.classList.remove('active');
            previewContainer.classList.add('is-paused');
            document.body.style.overflow = '';
            
            setTimeout(() => {
                previewVideo.pause();
                previewVideo.currentTime = 0;
                previewVideo.src = '';
            }, 500);
        }

        if(closePreview) closePreview.onclick = closeVideoPreview;
        
        document.addEventListener('keydown', (e) => {
            if(previewContainer.classList.contains('active')) {
                if(e.key === 'Escape') closeVideoPreview();
                if(e.key === ' ') { e.preventDefault(); togglePlay(); }
                if(e.key === 'ArrowLeft') previewVideo.currentTime -= 5;
                if(e.key === 'ArrowRight') previewVideo.currentTime += 5;
            }
        });
    }
});