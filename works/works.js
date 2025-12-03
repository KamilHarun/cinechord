(function() {
    'use strict';

    // ============================================================
    // 0. API & GLOBAL VARS
    // ============================================================
    const BACKEND_URL = "https://cinechord-admin-production.up.railway.app";
    const API_WORKS = `${BACKEND_URL}/api/works`;
    const UPLOADS_URL = `${BACKEND_URL}/uploads/`;
    
    const container = document.getElementById('dynamic-projects-grid');
    const pageTransition = document.querySelector('.page-transition');
    const loadingScreen = document.querySelector('.loading-screen');
    const header = document.querySelector('.header');
    const logo = document.querySelector('.center-logo');

    const categoryMap = { 
        'FILM': 'films', 'COMMERCIAL': 'commercial', 'CLIP': 'clips',
        'MUSIC_VIDEO': 'clips', 'DOCUMENTARY': 'films', 'SOCIAL': 'commercial'
    };

    // DOM Modal elementləri
    const previewContainer = document.getElementById('previewContainer');
    const previewVideo = document.getElementById('previewVideo');
    const previewTitleEl = document.getElementById('previewTitle');
    const closePreview = document.getElementById('closePreview'); 
    const modalPlayContainer = document.getElementById('modalPlayBtnContainer');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressPlayed = document.getElementById('progressPlayed');
    const currentTimeEl = document.getElementById('currentTime');
    const durationTimeEl = document.getElementById('durationTime');
    const volumeSlider = document.getElementById('volumeSlider');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const speedBtn = document.getElementById('speedBtn');

    // **Mouse Hərəkətsizliyi (Inactivity Timer)**
    let activityTimeout = null;
    const INACTIVITY_DELAY = 2000; 

    // ============================================================
    // 1. PAGE LOAD & TRANSITION & LOADER MƏNTİQİ
    // ============================================================
    
    // YÜKLƏNMƏ EKRANINI TEZ GİZLƏT
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 100);
    }

    // PAGE TRANSITION - SLIDE EFFECT
    if (pageTransition) {
        setTimeout(() => {
            pageTransition.classList.add('page-loaded'); 
        }, 100);
    }

    function navigateWithTransition(href) {
        if (pageTransition) {
            pageTransition.classList.remove('page-loaded');
        }
        setTimeout(() => { window.location.href = href; }, 600);
    }
    
    // ============================================================
    // 2. NAVBAR & LOGO SCROLL MƏNTİQİ
    // ============================================================
    let lastScroll = 0;

    setTimeout(() => { if (logo) logo.classList.add('entry-done'); }, 200);

    function handleScroll() {
        const currentScroll = window.scrollY;
        
        // Header gizlətmə/göstərmə
        if (header) {
            header.style.transform = (currentScroll > lastScroll && currentScroll > 50) ? 'translateY(-100%)' : 'translateY(0)';
        }
        
        // Logo gizlətmə/göstərmə
        if (logo) {
            if (currentScroll > 50) {
                logo.classList.add('scroll-hidden');
            } else {
                logo.classList.remove('scroll-hidden');
            }
        }
        lastScroll = currentScroll;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ============================================================
    // 3. SCROLL REVEAL (Intersection Observer)
    // ============================================================
    const observerOptions = {
        threshold: 0.1, 
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

    document.querySelectorAll('.hero-left-title, .hero-right-content, .scroll-down-arrow, .category-section, .main-footer').forEach(el => {
            el.classList.add('reveal-item');
            observer.observe(el);
    });
    
    // ============================================================
    // 4. SCRAMBLE EFFECT VƏ NAVİQASİYA (TƏMİZLƏNİB)
    // ============================================================
    
    // Scramble məntiqi olduğu kimi saxlanıldı
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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

    document.querySelectorAll('.nav-btn, .footer-link').forEach(btn => {
        const href = btn.getAttribute('href');
        const isExternal = href && !href.startsWith('#') && !href.startsWith('..');

        if(btn.classList.contains('nav-btn')) {
            const originalText = btn.getAttribute('data-text');
            const navText = btn.querySelector('.nav-text');
            
            btn.addEventListener('mouseenter', function() {
                if (this.classList.contains('active')) return;
                applyScrambleEffect(btn, navText, originalText);
            });
            
            btn.addEventListener('mouseleave', function() {
                if (this.classList.contains('active')) return;
                clearInterval(btn.interval);
                navText.innerText = originalText;
            });
        }
        
        btn.addEventListener('click', (e) => {
            if (isExternal || href.startsWith('mailto') || href.startsWith('tel')) return; 
            if (!href || href === '#') { e.preventDefault(); return; }

            const linkPath = href.split('/').pop();
            const currentPath = window.location.pathname.split('/').pop();
            if (linkPath === currentPath) return; 

            e.preventDefault();
            navigateWithTransition(href);
        });
    });

    // ============================================================
    // 5. LOAD WORKS (Dynamic Grid)
    // ============================================================
    
    function cleanUrlPath(url) {
        if (url && typeof url === 'string') {
            if (url.startsWith('http')) return url;
            if (url.startsWith('/uploads/')) return url.substring('/uploads/'.length);
            if (!url.startsWith('/') && url.includes('.')) return url;
        }
        return url;
    }

    async function loadDynamicWorks() {
        if(!container) return;
        
        try {
            const response = await fetch(API_WORKS);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            
            const data = await response.json();
            const works = data.content ? data.content : data;
            container.innerHTML = ''; 

            if(works.length === 0) {
                container.innerHTML = '<p style="color:white; text-align:center; margin-top:50px">No works found.</p>';
                return;
            }

            works.forEach((work, index) => {
                let videoSrc = work.previewVideoUrl || work.videoUrl;
                let imageSrc = work.imageUrl;
                
                if (videoSrc) {
                    videoSrc = cleanUrlPath(videoSrc);
                    if (!videoSrc.startsWith('http')) {
                        videoSrc = UPLOADS_URL + videoSrc;
                    }
                }
                
                if (imageSrc) {
                    imageSrc = cleanUrlPath(imageSrc);
                    if (!imageSrc.startsWith('http')) {
                        imageSrc = UPLOADS_URL + imageSrc;
                    }
                }
                
                const categoryClass = categoryMap[work.category] || 'other';
                
                const workHTML = `
                    <div class="project-card reveal-item" 
                        data-category="${categoryClass}" 
                        data-video-src="${videoSrc}" 
                        data-title="${work.title}"
                        style="transition-delay: ${index * 0.05}s;">
                        <div class="project-image-container">
                            <video 
                                muted loop playsinline 
                                class="project-video" 
                                preload="metadata" 
                                poster="${imageSrc || ''}"
                            >
                                ${videoSrc ? `<source src="${videoSrc}" type="video/mp4">` : ''}
                            </video>
                            <div class="card-overlay"></div>
                            <div class="card-info">
                                <h3 class="card-title">${work.title}</h3>
                                <p style="font-size: 12px; opacity: 0.7; margin-top: 5px;">${work.clientName || ''}</p>
                            </div>
                        </div>
                        
                        <button class="fullscreen-btn" 
                            data-video-src="${videoSrc}" 
                            data-title="${work.title}" 
                            title="Fullscreen Preview">
                        </button>
                    </div>
                `;
                container.innerHTML += workHTML;
            });
            
            const newCards = container.querySelectorAll('.project-card');
            newCards.forEach(card => observer.observe(card));

            attachHoverEffects();
            
        } catch (error) {
            console.error("Error loading works:", error);
            container.innerHTML = `
                <p style="color:red; text-align:center; margin-top:50px;">
                    API connection failed. Please check the backend server connection.<br>
                    <small>Trying to connect to: ${API_WORKS}</small>
                </p>
            `;
        }
    }

    // Filter Logic - GLOBAL
    window.filterWorks = function(category, btn) {
        if(btn) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        const cards = document.querySelectorAll('.project-card');
        cards.forEach(card => {
            const cardCat = card.getAttribute('data-category');
            card.classList.remove('active'); 
            
            if (category === 'all' || cardCat === category) {
                card.style.display = 'block';
                setTimeout(() => card.classList.add('active'), 50); 
            } else {
                card.style.display = 'none';
            }
        });
    };

    /**
     * Works-dəki videolar üçün Hover effektini tətbiq edir.
     */
    function attachHoverEffects() {
        document.querySelectorAll('.project-card').forEach(card => {
            const video = card.querySelector('video');
            if (video) {
                card.addEventListener('mouseenter', () => {
                    if(video.readyState >= 2) { 
                        video.play().catch(()=>{});
                    } else {
                        video.load(); 
                        video.onloadedmetadata = () => video.play().catch(()=>{});
                    }
                });

                card.addEventListener('mouseleave', () => { 
                    video.pause(); 
                    video.currentTime = 0; 
                });
            }
        });
    }

    // ============================================================
    // 6. VIDEO MODAL LOGIC (TƏMİZLƏNİB)
    // ============================================================
    
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function handleUserActivity() {
        if(!previewContainer) return;
        previewContainer.classList.remove('user-inactive');
        clearTimeout(activityTimeout);
        
        if (previewVideo && !previewVideo.paused) {
            activityTimeout = setTimeout(() => {
                previewContainer.classList.add('user-inactive');
            }, INACTIVITY_DELAY);
        }
    }

    function openModal(videoSrc, title) {
        if (!videoSrc) return;
        
        if(previewTitleEl) {
            previewTitleEl.textContent = title;
            previewTitleEl.setAttribute('data-text', title);
        }
        
        previewVideo.src = videoSrc;
        
        setTimeout(() => {
            previewContainer.style.display = 'flex';
            setTimeout(() => {
                previewContainer.classList.add('active');
                previewContainer.classList.add('is-paused');
                document.body.style.overflow = 'hidden';
                
                previewVideo.onloadedmetadata = function() {
                    if(durationTimeEl) durationTimeEl.textContent = formatTime(previewVideo.duration);
                    const modalPlayText = modalPlayContainer ? modalPlayContainer.querySelector('.play-text') : null;
                    if(modalPlayText) {
                        modalPlayText.setAttribute('data-text', 'PLAY');
                        modalPlayText.innerText = 'PLAY'; 
                    }
                };
            }, 10);
        }, 10);
    }
    
    function closeVideoPreview() {
        if(!previewContainer) return;
        previewContainer.classList.remove('active');
        previewContainer.classList.add('is-paused');
        previewContainer.classList.remove('user-inactive'); 
        clearTimeout(activityTimeout);
        document.body.style.overflow = 'auto';

        setTimeout(() => {
            previewVideo.pause();
            previewVideo.currentTime = 0;
            previewVideo.removeAttribute('src');
            if(durationTimeEl) durationTimeEl.textContent = '0:00';
            previewContainer.style.display = 'none';
        }, 500);
    }

    function updatePlayButtonUI() {
        const modalPlayText = modalPlayContainer ? modalPlayContainer.querySelector('.play-text') : null;
        
        if (previewVideo.paused) {
            if(modalPlayText) applyScrambleEffect(modalPlayContainer, modalPlayText, "PLAY");
            previewContainer.classList.add('is-paused');
            previewContainer.classList.remove('user-inactive'); 
            clearTimeout(activityTimeout);
        } else {
            if(modalPlayText) applyScrambleEffect(modalPlayContainer, modalPlayText, "PAUSE");
            previewContainer.classList.remove('is-paused');
            handleUserActivity(); 
        }
    }

    function togglePlay(e) {
        if(e) e.stopPropagation();
        previewVideo.paused ? previewVideo.play() : previewVideo.pause();
    }


    // ** Event Listenerlər **
    document.addEventListener('click', (e) => {
        if (e.target.closest('.fullscreen-btn')) {
            const btn = e.target.closest('.fullscreen-btn');
            const videoSrc = btn.getAttribute('data-video-src');
            const title = btn.getAttribute('data-title');
            e.preventDefault();
            openModal(videoSrc, title);
        }
        
        if (e.target.closest('#playPauseBtn') || e.target.closest('#modalPlayBtnContainer')) {
             e.stopPropagation();
             togglePlay();
        }
    });

    if (previewContainer) {
        ['mousemove', 'click', 'touchstart'].forEach(event => {
            previewContainer.addEventListener(event, handleUserActivity);
        });
    }
    
    if (previewVideo) {
        previewVideo.addEventListener('click', togglePlay);
        previewVideo.addEventListener('play', updatePlayButtonUI);
        previewVideo.addEventListener('pause', updatePlayButtonUI);
        previewVideo.addEventListener('ended', () => {
            previewVideo.pause();
            previewVideo.currentTime = 0;
        }); 
        
        previewVideo.addEventListener('timeupdate', () => {
            const percent = (previewVideo.currentTime / previewVideo.duration) * 100;
            if(progressPlayed) progressPlayed.style.width = percent + '%';
            if(currentTimeEl) currentTimeEl.textContent = formatTime(previewVideo.currentTime);
        });
    }
    
    if(closePreview) closePreview.onclick = closeVideoPreview;
    
    if(progressBarContainer) progressBarContainer.addEventListener('click', (e) => {
        const rect = progressBarContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = progressBarContainer.clientWidth;
        const percentage = clickX / width;
        previewVideo.currentTime = previewVideo.duration * percentage;
        handleUserActivity(); 
    });
    
    if(volumeSlider) volumeSlider.oninput = function(e) { 
        previewVideo.volume = e.target.value / 100; 
        handleUserActivity();
    };
    
    if(rewindBtn) rewindBtn.onclick = () => { previewVideo.currentTime -= 5; handleUserActivity(); };
    if(forwardBtn) forwardBtn.onclick = () => { previewVideo.currentTime += 5; handleUserActivity(); };
    
    document.addEventListener('keydown', (e) => {
        if(previewContainer && previewContainer.classList.contains('active')) {
            if(e.key === 'Escape') closeVideoPreview();
            if(e.key === ' ') { e.preventDefault(); togglePlay(); }
            if(e.key === 'ArrowLeft') { previewVideo.currentTime -= 5; handleUserActivity(); }
            if(e.key === 'ArrowRight') { previewVideo.currentTime += 5; handleUserActivity(); }
        }
    });

    // ============================================================
    // 7. MOBILE MENU
    // ============================================================
    
    function initMobileMenu() {
        if (document.querySelector('.hamburger')) return;
        
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        hamburger.setAttribute('aria-label', 'Toggle menu');
        
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const clone = btn.cloneNode(true);
            mobileMenu.appendChild(clone);
        });
        
        document.body.appendChild(overlay);
        document.body.appendChild(mobileMenu);
        
        if (header) {
            header.appendChild(hamburger);
        }
        
        function toggleMenu() {
            const isActive = hamburger.classList.contains('active');
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = isActive ? '' : 'hidden';
        }
        
        hamburger.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
        
        mobileMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                toggleMenu();
            }
        });
        
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    // ============================================================
    // 8. INIT
    // ============================================================
    
    function init() {
        loadDynamicWorks();
        
        if (window.innerWidth <= 768) {
            initMobileMenu();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();