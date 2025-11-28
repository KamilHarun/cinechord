document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. API & GLOBAL VARS
    // ============================================================
    const API_BASE_URL = "http://localhost:8080"; 
    const API_WORKS = `${API_BASE_URL}/admin/works/getAllWorks`; 
    const UPLOADS_URL = `${API_BASE_URL}/uploads/`; 
    const container = document.getElementById('dynamic-projects-grid');
    const pageTransition = document.querySelector('.page-transition');
    
    const categoryMap = { 
        'FILM': 'films', 'COMMERCIAL': 'commercial', 'CLIP': 'clips',
        'MUSIC_VIDEO': 'clips', 'DOCUMENTARY': 'films', 'SOCIAL': 'commercial'
    };

    // DOM Modal elementləri
    const previewContainer = document.getElementById('previewContainer');
    const previewVideo = document.getElementById('previewVideo');
    const previewTitleEl = document.getElementById('previewTitle');
    const closePreview = document.getElementById('closePreview'); 
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const modalPlayContainer = document.getElementById('modalPlayBtnContainer');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressPlayed = document.getElementById('progressPlayed');
    const currentTimeEl = document.getElementById('currentTime');
    const durationTimeEl = document.getElementById('durationTime');
    const volumeSlider = document.getElementById('volumeSlider');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const speedBtn = document.getElementById('speedBtn');

    // **Mouse Hərəkətsizliyi (Inactivity Timer)**
    let activityTimeout = null;
    const INACTIVITY_DELAY = 2000; // 2 saniyə

    // Aktiv Navigasiyanı Təyin Etmək (Orijinal Məntiq)
    const currentPath = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-btn');
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        
        if (linkPath === currentPath) {
             link.classList.add('active');
        } else {
             if (currentPath === "" && linkPath === "index.html") {
                 link.classList.add('active');
             }
        }
    });

    // ============================================================
    // 1. FLASH FIX & PAGE TRANSITION (Orijinal Məntiq)
    // ============================================================
    if (pageTransition) {
        setTimeout(() => {
            pageTransition.classList.add('page-loaded'); 
        }, 100);
    }

    // ============================================================
    // 2. NAVBAR & LOGO SCROLL LOGIC (Orijinal Məntiq)
    // ============================================================
    let lastScroll = 0;
    const navbar = document.querySelector('.header');
    const logo = document.querySelector('.center-logo');

    setTimeout(() => { if (logo) logo.classList.add('entry-done'); }, 200);

    function handleScroll() {
        const currentScroll = window.scrollY;
        if (currentScroll > lastScroll && currentScroll > 50) {
            if (navbar) navbar.style.transform = 'translateY(-100%)';
        } else {
            if (navbar) navbar.style.transform = 'translateY(0)';
        }
        if (currentScroll > 50) {
            if (logo) logo.classList.add('scroll-hidden');
        } else {
            if (logo) logo.classList.remove('scroll-hidden');
        }
        lastScroll = currentScroll;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ============================================================
    // 3. SCROLL REVEAL (OBSERVER) (Orijinal Məntiq)
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
    // 4. PAGE TRANSITION LOGIC & SCRAMBLE (NAVIGASYON) (Orijinal Məntiq)
    // ============================================================
    
    function navigateWithTransition(href) {
        if (pageTransition) {
            pageTransition.classList.remove('page-loaded'); 
            pageTransition.style.transition = 'none';
            pageTransition.classList.add('active');
        }
        setTimeout(() => { window.location.href = href; }, 600);
    }

    document.querySelectorAll('.nav-btn, .footer-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            const linkPath = href.split('/').pop();
            const currentPath = window.location.pathname.split('/').pop();
            if (!href || href === '#' || linkPath === currentPath) return;
            e.preventDefault();
            navigateWithTransition(href);
        });
    });

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

    document.querySelectorAll('.nav-btn').forEach(btn => {
        const originalText = btn.getAttribute('data-text');
        if (!originalText) return;
        const navText = btn.querySelector('.nav-text');
        if (!navText) return;

        btn.addEventListener('mouseenter', function() {
            if (this.classList.contains('active')) return;
            applyScrambleEffect(btn, navText, originalText);
        });
        
        btn.addEventListener('mouseleave', function() {
            if (this.classList.contains('active')) return;
            clearInterval(btn.interval);
            navText.innerText = originalText;
        });
    });

    // ============================================================
    // 5. LOAD WORKS (Dynamic Grid) (Orijinal Məntiq)
    // ============================================================
    
    function cleanUrlPath(url) {
        if (url && typeof url === 'string') {
            if (url.startsWith('/uploads/')) return url.substring('/uploads/'.length); 
            if (!url.startsWith('http') && url.includes('.')) return url;
        }
        return url;
    }

    async function loadDynamicWorks() {
        if(!container) return;
        try {
            const response = await fetch(API_WORKS);
            if (!response.ok) throw new Error('Network response was not ok');
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
                    if (!videoSrc.startsWith('http')) videoSrc = UPLOADS_URL + videoSrc;
                }
                if (imageSrc) {
                    imageSrc = cleanUrlPath(imageSrc);
                    if (!imageSrc.startsWith('http')) imageSrc = UPLOADS_URL + imageSrc;
                }
                const categoryClass = categoryMap[work.category] || 'other';
                
                const workHTML = `
                    <div class="project-card reveal-item" 
                        data-category="${categoryClass}" 
                        data-video-src="${videoSrc}" 
                        data-title="${work.title}"
                        style="transition-delay: ${index * 0.05}s;">
                        <div class="project-image-container">
                            <video muted loop playsinline class="project-video" preload="metadata" poster="${imageSrc || ''}">
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
        }
    }

    // Filter Logic
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

    function attachHoverEffects() {
        document.querySelectorAll('.project-card').forEach(card => {
            const video = card.querySelector('video');
            if (video) {
                card.addEventListener('mouseenter', () => video.play().catch(()=>{}));
                card.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
            }
        });
    }

    // ============================================================
    // 6. VIDEO MODAL LOGIC (YENİLƏNMİŞ VƏ DÜZGÜN MƏNTİQ)
    // ============================================================
    
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function handleUserActivity() {
        // Hərəkət olanda user-inactive sinifini sil (Kontrollar görünür)
        previewContainer.classList.remove('user-inactive');
        clearTimeout(activityTimeout);
        
        if (!previewVideo.paused) {
            // Video oynayırsa 2 saniyəlik timer başlat
            activityTimeout = setTimeout(() => {
                previewContainer.classList.add('user-inactive');
            }, INACTIVITY_DELAY);
        }
    }

    function openModal(videoSrc, title) {
        if (!videoSrc) {
            console.warn("Video URL is missing for this project.");
            return;
        }
        
        // Başlıq Mask/Reveal effekti üçün data-text əlavə et
        previewTitleEl.textContent = title;
        previewTitleEl.setAttribute('data-text', title);
        
        previewVideo.src = videoSrc;
        
        setTimeout(() => {
            previewContainer.style.display = 'flex';
            setTimeout(() => {
                previewContainer.classList.add('active');
                previewContainer.classList.add('is-paused');
                document.body.style.overflow = 'hidden';
                
                previewVideo.onloadedmetadata = function() {
                    durationTimeEl.textContent = formatTime(previewVideo.duration);
                    // Mərkəzi düymənin UI-ni modal açıldıqda ilkinləşdir
                    if (modalPlayContainer) {
                         const modalPlayText = modalPlayContainer.querySelector('.play-text');
                         if(modalPlayText) {
                            modalPlayText.setAttribute('data-text', 'PLAY');
                            modalPlayText.innerText = 'PLAY'; 
                         }
                    }
                };
            }, 10);
        }, 10);
    }
    
    function closeVideoPreview() {
        previewContainer.classList.remove('active');
        previewContainer.classList.add('is-paused');
        previewContainer.classList.remove('user-inactive'); 
        clearTimeout(activityTimeout);
        document.body.style.overflow = 'auto';
        
        // Mask/Reveal üçün data-text silinir
        if(previewTitleEl) previewTitleEl.removeAttribute('data-text');

        setTimeout(() => {
            previewVideo.pause();
            previewVideo.currentTime = 0;
            previewVideo.src = '';
            durationTimeEl.textContent = '0:00'; // Reset time display
        }, 500);
    }

    function updatePlayButtonUI() {
        const modalPlayText = modalPlayContainer ? modalPlayContainer.querySelector('.play-text') : null;
        
        if (previewVideo.paused) {
            // PAUSE VƏZİYYƏTİ
            if(playIcon) playIcon.style.display = 'block';
            if(pauseIcon) pauseIcon.style.display = 'none';
            previewContainer.classList.add('is-paused');
            
            // Pause olanda kontrol elementləri görünməlidir
            previewContainer.classList.remove('user-inactive'); 
            clearTimeout(activityTimeout);
            
            if(modalPlayText) {
                modalPlayText.setAttribute('data-text', 'PLAY');
                if(modalPlayText.innerText !== "PLAY") applyScrambleEffect(modalPlayContainer, modalPlayText, "PLAY");
            }
        } else {
            // PLAY VƏZİYYƏTİ
            if(playIcon) playIcon.style.display = 'none';
            if(pauseIcon) pauseIcon.style.display = 'block';
            previewContainer.classList.remove('is-paused');
            
            // Play başlayanda dərhal activity handler-i başlat
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


    // ** Event Listenerlər **
    document.addEventListener('click', (e) => {
        // Kart üzərindəki fullscreen düyməsi
        if (e.target.classList.contains('fullscreen-btn')) {
            const videoSrc = e.target.getAttribute('data-video-src');
            const title = e.target.getAttribute('data-title');
            e.preventDefault();
            openModal(videoSrc, title);
        }
        
        // Kiçik Play/Pause düyməsi
        if (e.target.closest('#playPauseBtn')) {
            togglePlay(e);
        }
    });

    // Mouse hərəkəti/Interaksiya eventləri
    if (previewContainer) {
        previewContainer.addEventListener('mousemove', handleUserActivity);
        previewContainer.addEventListener('click', handleUserActivity);
        previewContainer.addEventListener('touchstart', handleUserActivity);
    }
    
    // Modalın daxili kontrol eventləri
    if (previewVideo) {
        previewVideo.onclick = togglePlay;
        previewVideo.addEventListener('play', updatePlayButtonUI);
        previewVideo.addEventListener('pause', updatePlayButtonUI);
        previewVideo.addEventListener('loadedmetadata', updatePlayButtonUI); 
        
        previewVideo.addEventListener('timeupdate', () => {
            const percent = (previewVideo.currentTime / previewVideo.duration) * 100;
            if(progressPlayed) progressPlayed.style.width = percent + '%';
            if(currentTimeEl) currentTimeEl.textContent = formatTime(previewVideo.currentTime);
        });

        previewVideo.addEventListener('ended', () => {
            previewVideo.pause();
            previewVideo.currentTime = 0;
        }); 
    }
    
    if(closePreview) closePreview.onclick = closeVideoPreview;

    // Mərkəzi Play/Pause Düyməsi
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
    
    // Nəzarət düymələrinin funksiyaları
    if(progressBarContainer) progressBarContainer.addEventListener('click', (e) => {
        const rect = progressBarContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = progressBarContainer.clientWidth;
        const percentage = clickX / width;
        previewVideo.currentTime = previewVideo.duration * percentage;
        handleUserActivity(); 
    });
    
    if(volumeSlider) volumeSlider.oninput = function(e) { 
        e.stopPropagation(); 
        previewVideo.volume = e.target.value / 100; 
        handleUserActivity();
    };
    
    if(rewindBtn) rewindBtn.onclick = (e) => { e.stopPropagation(); previewVideo.currentTime -= 5; handleUserActivity(); };
    if(forwardBtn) forwardBtn.onclick = (e) => { e.stopPropagation(); previewVideo.currentTime += 5; handleUserActivity(); };
    
    if(fullscreenBtn) fullscreenBtn.onclick = (e) => {
        e.stopPropagation();
        if(document.fullscreenElement) document.exitFullscreen();
        else if(previewVideo.requestFullscreen) previewVideo.requestFullscreen();
        handleUserActivity();
    };
    
    if (speedBtn) speedBtn.addEventListener('click', () => {
        let newSpeed = previewVideo.playbackRate + 0.25;
        if (newSpeed > 2) newSpeed = 0.5; 
        previewVideo.playbackRate = newSpeed;
        speedBtn.textContent = `${newSpeed}x`;
        handleUserActivity();
    });

    // Klaviatura qısayolları
     document.addEventListener('keydown', (e) => {
        if(previewContainer.classList.contains('active')) {
            if(e.key === 'Escape') closeVideoPreview();
            if(e.key === ' ') { e.preventDefault(); togglePlay(); }
            if(e.key === 'ArrowLeft') { previewVideo.currentTime -= 5; handleUserActivity(); }
            if(e.key === 'ArrowRight') { previewVideo.currentTime += 5; handleUserActivity(); }
        }
    });

    // Yükləməni başlat
    loadDynamicWorks();
});