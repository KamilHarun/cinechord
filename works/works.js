document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 1. PAGE ENTRY (AÇILIŞ) - GSAP ANIMATION
    // ============================================================
    const pageContent = [
        ".header", ".hero-section", ".category-section", ".works-section", ".main-footer"
    ];

    // Başlanğıcda elementləri gizlədirik
    if (typeof gsap !== 'undefined') {
        gsap.set(pageContent, { y: 50, autoAlpha: 0 });
        
        // Açılış animasiyası
        setTimeout(() => {
            gsap.to(pageContent, {
                y: 0,
                autoAlpha: 1,
                duration: 1.2,
                stagger: 0.1,
                ease: "power3.out"
            });
            
            if (typeof ScrollTrigger !== 'undefined') {
                initScrollAnimations();
            }
        }, 100);
    }

    // ============================================================
    // 2. PAGE EXIT (ÇIXIŞ) - SERVICE PAGE STYLE
    // ============================================================
    function navigateWithTransition(href) {
        const pageTransition = document.querySelector('.page-transition');
        
        if (pageTransition) {
            // Service səhifəsindəki eyni CSS animasiyasını başladırıq
            pageTransition.classList.add('active');
        }
        
        // Service kodundakı kimi 600ms (0.6s) gözləyib keçirik
        setTimeout(() => {
            window.location.href = href;
        }, 600);
    }

    // Linklərə klik hadisəsi
    const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            // Eyni səhifə deyilsə, keçid animasiyasını işə sal
            if (href && !href.includes(window.location.pathname.split('/').pop())) {
                e.preventDefault();
                navigateWithTransition(href);
            }
        });
    });

    // ============================================================
    // 3. SCROLL ANIMATIONS (ScrollTrigger) & FILTER
    // ============================================================
    function initScrollAnimations() {
        gsap.registerPlugin(ScrollTrigger);
        
        // Kartların gəlişi
        ScrollTrigger.batch(".project-card", {
            start: "top 85%",
            onEnter: batch => gsap.to(batch, { 
                opacity: 1, 
                y: 0, 
                stagger: 0.15, 
                duration: 1.2, 
                ease: "power3.out", 
                overwrite: true 
            }),
            once: true
        });
    }

    // FILTER LOGIC
    const filterBtns = document.querySelectorAll('.category-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Active class dəyişimi
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-category');

            projectCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (category === 'all' || category === cardCategory) {
                    gsap.to(card, { autoAlpha: 1, display: "block", duration: 0.5 });
                } else {
                    gsap.to(card, { autoAlpha: 0, display: "none", duration: 0.5 });
                }
            });
            
            // ScrollTrigger-i yenilə ki, yerləri düzəlsin
            setTimeout(() => ScrollTrigger.refresh(), 500);
        });
    });

    // ============================================================
    // 4. UI LOGIC (Logo, Header, Scramble)
    // ============================================================
    
    // Logo Scroll Effect
    const centerLogo = document.querySelector('.center-logo');
    if (centerLogo) {
        setTimeout(() => centerLogo.classList.add('entry-done'), 300);
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) centerLogo.classList.add('scroll-hidden');
            else centerLogo.classList.remove('scroll-hidden');
        }, { passive: true });
    }

    // Header Scroll Effect
    const header = document.querySelector('.header');
    if (header) {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > lastScroll && currentScroll > 50) header.style.transform = 'translateY(-100%)';
            else header.style.transform = 'translateY(0)';
            lastScroll = currentScroll;
        }, { passive: true });
    }

    // Scramble Nav Effect
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("mouseenter", () => {
            if(btn.classList.contains('active')) return;
            const textSpan = btn.querySelector(".nav-text"); 
            const originalText = btn.getAttribute("data-text");
            if(textSpan && originalText) {
                let iteration = 0; clearInterval(btn.interval);
                btn.interval = setInterval(() => {
                    textSpan.innerText = originalText.split("").map((letter, index) => {
                        if(index < iteration) return originalText[index];
                        return letters[Math.floor(Math.random() * letters.length)];
                    }).join("");
                    if(iteration >= originalText.length) clearInterval(btn.interval);
                    iteration += 1 / 3;
                }, 30);
            }
        });
    });

    // ============================================================
    // 5. VIDEO PLAYER LOGIC
    // ============================================================
    const previewContainer = document.getElementById('previewContainer');
    const previewVideo = document.getElementById('previewVideo');
    const videoLoading = document.querySelector('.video-loading');
    const previewTitle = document.getElementById('previewTitle');
    const closePreview = document.getElementById('closePreview');
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
    const speedBtn = document.getElementById('speedBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

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
                }, 1000);
            }
        }
        previewContainer.addEventListener('mousemove', handleUserActivity);
        previewContainer.addEventListener('click', handleUserActivity);

        function updatePlayButtonUI() {
            if (previewVideo.paused) {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                previewContainer.classList.add('is-paused');
                previewContainer.classList.remove('user-inactive');
                clearTimeout(activityTimeout);
            } else {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                previewContainer.classList.remove('is-paused');
                handleUserActivity();
            }
        }

        function togglePlay(e) {
            if(e) e.stopPropagation();
            if (previewVideo.paused) previewVideo.play();
            else previewVideo.pause();
        }

        if(playPauseBtn) playPauseBtn.onclick = togglePlay;
        previewVideo.onclick = togglePlay;
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
        if(progressSlider) progressSlider.oninput = function(e) { e.stopPropagation(); previewVideo.currentTime = (this.value/100) * previewVideo.duration; };
        if(volumeSlider) volumeSlider.oninput = function(e) { e.stopPropagation(); previewVideo.volume = this.value / 100; };

        let currentSpeedIndex = 2; 
        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
        if(speedBtn) speedBtn.onclick = (e) => {
            e.stopPropagation();
            currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
            previewVideo.playbackRate = speeds[currentSpeedIndex];
            speedBtn.textContent = speeds[currentSpeedIndex] + 'x';
        };

        if(fullscreenBtn) fullscreenBtn.onclick = (e) => {
            e.stopPropagation();
            if(document.fullscreenElement) document.exitFullscreen();
            else if(previewVideo.requestFullscreen) previewVideo.requestFullscreen();
            else if(previewVideo.webkitRequestFullscreen) previewVideo.webkitRequestFullscreen();
        };

        // OPEN PLAYER
        document.querySelectorAll('.fullscreen-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                const card = this.closest('.project-card');
                const videoSource = card.querySelector('video source').getAttribute('src');
                const title = card.querySelector('.card-title').textContent;
                
                if (!videoSource) return;

                videoLoading.style.display = 'block';
                previewVideo.src = videoSource;
                previewTitle.textContent = title;
                
                currentSpeedIndex = 2;
                if(speedBtn) speedBtn.textContent = '1x';
                previewVideo.playbackRate = 1;
                previewContainer.classList.add('is-paused'); 
                updatePlayButtonUI();

                previewVideo.oncanplay = function() { videoLoading.style.display = 'none'; };
                setTimeout(() => {
                    previewContainer.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    previewVideo.play().catch(err => console.log('Autoplay prevented:', err));
                }, 10);
            });
        });

        // CLOSE PLAYER
        function closeVideoPreview() {
            previewContainer.classList.remove('active');
            previewContainer.classList.remove('is-paused');
            document.body.style.overflow = '';
            setTimeout(() => {
                previewVideo.pause();
                previewVideo.currentTime = 0;
                previewVideo.src = '';
            }, 600);
        }
        if(closePreview) closePreview.onclick = closeVideoPreview;
        previewContainer.onclick = (e) => { if(e.target === previewContainer) closeVideoPreview(); };

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