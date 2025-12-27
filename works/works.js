(function() {
    'use strict';

    // ============================================================
    // 0. GLOBAL DƏYİŞƏNLƏR & ELEMENTLƏR
    // ============================================================
    const BACKEND_URL = "https://cinechord-admin-production.up.railway.app";
    const API_WORKS = `${BACKEND_URL}/api/works`;
    const UPLOADS_URL = `${BACKEND_URL}/uploads/`;
    const SHOWREEL_VIDEO_URL = "https://res.cloudinary.com/dinncr6hs/video/upload/Works_Showreel_epbwt0.mp4";    
    
    // Əsas elementlər
    const container = document.getElementById('dynamic-projects-grid');
    const loadingScreen = document.querySelector('.loading-screen');
    const pageTransition = document.querySelector('.page-transition');
    
    // Menu Elementlər
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileMenuOverlay');
    const hamburgerText = document.querySelector('.hamburger-text');
    const navBtns = document.querySelectorAll('.nav-btn');
    const centerLogo = document.querySelector('.center-logo');

    // Kateqoriyalar
    const categoryMap = { 
        'FILM': 'films', 'COMMERCIAL': 'commercial', 'CLIP': 'clips',
        'MUSIC_VIDEO': 'clips', 'DOCUMENTARY': 'films', 'SOCIAL': 'commercial'
    };

    // Video Modal Elementləri
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
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    let activityTimeout = null;
    const INACTIVITY_DELAY = 2000;

    // Global translations object
    window.translations = null;
    window.currentLang = 'en';

    // ============================================================
    // 1. PAGE LOAD & TRANSITION
    // ============================================================
    
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 100);
    }

    if (pageTransition) {
        setTimeout(() => {
            pageTransition.classList.add('page-loaded'); 
        }, 100);
    }

    // ============================================================
    // 2. HERO VIDEO INIT (Arxa fon videosu üçün)
    // ============================================================
    function initHeroVideo() {
        const heroBg = document.querySelector('.hero-bg');
        if (!heroBg) {
            console.warn('hero-bg element not found');
            return;
        }
        
        const video = document.createElement('video');
        video.src = SHOWREEL_VIDEO_URL;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.style.position = "absolute";
        video.style.top = "0";
        video.style.left = "0";
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        video.style.zIndex = "-1";
        
        video.addEventListener('error', (e) => {
            console.error('Hero video loading error:', e, video.error);
        });
        
        video.play().catch((error) => {
            console.warn('Hero video autoplay failed:', error);
        });
        
        heroBg.appendChild(video);
    }

    // ============================================================
    // 3. TRANSLATION SYSTEM
    // ============================================================

    async function loadTranslations() {
        try {
            const response = await fetch('../lang/works.json');
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
                    "works": "WORKS",
                    "scroll": "Scroll",
                    "all": "ALL",
                    "films": "FILMS",
                    "commercial": "COMMERCIAL",
                    "clips": "CLIPS",
                    "play": "PLAY",
                    "view_all_works": "VIEW ALL WORKS",
                    "open_archive": "OPEN ARCHIVE",
                    "address": "ADDRESS",
                    "get_in_touch": "GET IN TOUCH",
                    "follow_us": "FOLLOW US"
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
                    "works": "İŞLƏR",
                    "scroll": "Sürüşdür",
                    "all": "HAMISI",
                    "films": "FİLMLƏR",
                    "commercial": "REKLAM",
                    "clips": "KLİPLƏR",
                    "play": "BAŞLAT",
                    "view_all_works": "BÜTÜN İŞLƏRƏ BAX",
                    "open_archive": "ARXİVİ AÇ",
                    "address": "ÜNVAN",
                    "get_in_touch": "ƏLAQƏ SAXLAYIN",
                    "follow_us": "BİZİ İZLƏYİN"
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
        if (hamburgerText) {
            const isMenuOpen = hamburger && hamburger.classList.contains('active');
            hamburgerText.textContent = isMenuOpen ? t.close : t.menu;
        }

        // Navigation Buttons
        navBtns.forEach(btn => {
            const navText = btn.querySelector('.nav-text');
            const key = btn.getAttribute('data-key');
            
            if (key && t[key]) {
                if (navText) navText.textContent = t[key];
                btn.setAttribute('data-text', t[key]);
            }
        });

        // Works Title
        const worksTitle = document.querySelector('.title-main');
        if (worksTitle) {
            const key = worksTitle.getAttribute('data-key');
            if (key && t[key]) {
                const span = worksTitle.querySelector('span');
                if (span) span.textContent = t[key];
                worksTitle.setAttribute('data-text', t[key]);
            }
        }

        // Scroll Text
        const scrollText = document.querySelector('.arrow-text');
        if (scrollText) {
            const key = scrollText.getAttribute('data-key');
            if (key && t[key]) {
                scrollText.textContent = t[key];
            }
        }

        // Category Buttons
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            const key = btn.getAttribute('data-key');
            if (key && t[key]) {
                btn.textContent = t[key];
            }
        });

        // Play Button
        const playTexts = document.querySelectorAll('.play-text');
        playTexts.forEach(el => {
            if (t.play) {
                el.textContent = t.play;
                el.setAttribute('data-text', t.play);
            }
        });

        // Footer CTA Text
        const ctaText = document.querySelector('.cta-text');
        if (ctaText) {
            const key = ctaText.getAttribute('data-key');
            if (key && t[key]) {
                const span = ctaText.querySelector('span');
                if (span) span.textContent = t[key];
                ctaText.setAttribute('data-text', t[key]);
            }
        }

        // Footer CTA Button
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            const key = ctaButton.getAttribute('data-key');
            if (key && t[key]) {
                ctaButton.textContent = t[key];
            }
        }

        // Footer Labels
        const footerLabels = document.querySelectorAll('.footer-label');
        footerLabels.forEach(label => {
            const key = label.getAttribute('data-key');
            if (key && t[key]) {
                label.textContent = t[key];
            }
        });

        // Apply font class
        if (lang === 'az') {
            document.body.classList.add('lang-az');
            document.documentElement.setAttribute('lang', 'az');
        } else {
            document.body.classList.remove('lang-az');
            document.documentElement.setAttribute('lang', 'en');
        }

        // Contact info yenilə
        updateGlobalContactInfo();

        console.log('Translations applied for:', lang);
    }

    // ============================================================
    // 4. LANGUAGE SELECTOR
    // ============================================================

    function initLanguageSelector() {
        const langSelector = document.getElementById('langSelector');
        const langGlobeBtn = document.getElementById('langGlobeBtn');
        const langDropdown = document.getElementById('langDropdown');
        const langOptions = document.querySelectorAll('.lang-option');
        const currentLangText = document.getElementById('currentLangText');
        
        console.log('initLanguageSelector called');
        console.log('langSelector:', langSelector);
        console.log('langGlobeBtn:', langGlobeBtn);
        
        if (!langSelector || !langGlobeBtn) {
            console.log('Language selector elements not found!');
            return;
        }
        
        // LocalStorage-dən dil seçimini yüklə
        const savedLang = localStorage.getItem('selectedLang') || 'en';
        window.currentLang = savedLang;
        
        // Seçilmiş dili tətbiq et
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
        
        // Globe düyməsinə klik - dropdown aç/bağla
        langGlobeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Globe button clicked!');
            langSelector.classList.toggle('active');
            console.log('langSelector.classList:', langSelector.classList.toString());
        });
        
        // Dil seçimlərinə klik
        langOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = this.dataset.lang;
                console.log('Language option clicked:', lang);
                
                // Əgər artıq aktivdirsə, sadəcə dropdown-u bağla
                if (this.classList.contains('active')) {
                    langSelector.classList.remove('active');
                    return;
                }
                
                // Aktiv classını dəyiş
                langOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                // Current lang text-i yenilə
                if (currentLangText) {
                    currentLangText.textContent = lang.toUpperCase();
                }
                
                // LocalStorage-ə yadda saxla
                localStorage.setItem('selectedLang', lang);
                
                // Tərcümələri tətbiq et
                applyTranslations(lang);
                
                // Dropdown-u bağla
                setTimeout(() => {
                    langSelector.classList.remove('active');
                }, 200);
                
                // Event göndər
                document.dispatchEvent(new CustomEvent('languageChanged', { 
                    detail: { language: lang } 
                }));
                
                console.log('Language changed to:', lang);
            });
        });
        
        // Xaricdə klik - dropdown-u bağla
        document.addEventListener('click', function(e) {
            if (langSelector && !langSelector.contains(e.target)) {
                langSelector.classList.remove('active');
            }
        });
        
        // ESC düyməsi - dropdown-u bağla
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && langSelector.classList.contains('active')) {
                langSelector.classList.remove('active');
            }
        });
        
        console.log('Language selector initialized successfully');
    }

    // ============================================================
    // 5. MENU SİSTEMİ (Mobil Menyu)
    // ============================================================

    function toggleMenu() {
        if (!hamburger || !mobileMenu) return;

        const isActive = hamburger.classList.contains('active');
        
        // Scrollbar genişliyini hesabla (Jump probleminin həlli)
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        
        if (hamburgerText) {
            if (window.translations && window.translations[window.currentLang]) {
                const t = window.translations[window.currentLang];
                hamburgerText.textContent = isActive ? t.menu : t.close;
            } else {
                hamburgerText.textContent = isActive ? 'MENU' : 'CLOSE';
            }
        }
        
        // Scrollbar compensation 
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

    if (hamburger) {
        hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            toggleMenu();
        });
    }

    // ESC düyməsi
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (previewContainer && previewContainer.classList.contains('active')) {
                closeVideoPreview();
                return;
            }
            if (hamburger && hamburger.classList.contains('active')) {
                toggleMenu();
            }
        }
    });

    // Menu linkləri
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

            if (pageTransition) {
                pageTransition.classList.remove('page-loaded');
            }

            setTimeout(() => {
                window.location.href = href;
            }, 600);
        });
    });

// ============================================================
// 6. WORKS API & GRID - (Qara ekran problemi həll olunmuş versiya)
// ============================================================

// URL təmizləyən və birləşdirən köməkçi funksiya
function getFullMediaUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    let cleanPath = path;
    while (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
    }
    if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.substring(8);
    }
    return UPLOADS_URL + cleanPath;
}

async function loadDynamicWorks() {
    if (!container) return;

    try {
        const response = await fetch(API_WORKS);
        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        const works = data.content ? data.content : data;
        container.innerHTML = '';

        if (works.length === 0) {
            container.innerHTML = '<p style="color:white; text-align:center;">No works found.</p>';
            return;
        }

        works.forEach((work, index) => {
            const rawVideoPath = work.previewVideoUrl || work.videoUrl;
            const videoSrc = getFullMediaUrl(rawVideoPath);
            const categoryClass = categoryMap[work.category] || 'other';

            if (!videoSrc) return;

            // DƏYİŞİKLİK BURADADIR: src dərhal təyin olunur və #t=0.1 əlavə edilir
            const workHTML = `
                <div class="project-card reveal-item" 
                    data-category="${categoryClass}" 
                    data-video-src="${videoSrc}" 
                    data-title="${work.title}"
                    style="transition-delay: ${index * 0.05}s;">
                    <div class="project-image-container">
                        <video muted loop playsinline class="project-video" 
                            preload="metadata" 
                            src="${videoSrc}#t=0.1"> 
                        </video>
                        <div class="card-overlay"></div>
                        <div class="card-info">
                            <h3 class="card-title">${work.title}</h3>
                            <p style="font-size: 12px; opacity: 0.7;">${work.clientName || ''}</p>
                        </div>
                    </div>
                    <button class="fullscreen-btn" data-video-src="${videoSrc}" data-title="${work.title}"></button>
                </div>
            `;
            container.innerHTML += workHTML;
        });

        const newCards = container.querySelectorAll('.project-card');
        newCards.forEach(card => observer.observe(card));

        // Hover effektlərini aktivləşdiririk
        attachHoverEffects();

    } catch (error) {
        console.error("API Error:", error);
        container.innerHTML = '<p style="color:white; text-align:center;">Error loading works.</p>';
    }
}

function attachHoverEffects() {
    document.querySelectorAll('.project-card').forEach(card => {
        const video = card.querySelector('video');
        if (!video) return;

        // Hover edəndə video başlasın
        card.addEventListener('mouseenter', () => {
            video.play().catch(error => {
                console.log("Play error:", error);
            });
        });

        // Hover-dən çıxanda video dayansın və yenidən ilk rəngli kadrda (0.1s) qalsın
        card.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0.1; 
        });
    });
}

    window.filterWorks = function(category, btn) {
        if(btn) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        const cards = document.querySelectorAll('.project-card');
        cards.forEach(card => {
            const cardCat = card.getAttribute('data-category');
            if (category === 'all' || cardCat === category) {
                card.style.display = 'block';
                setTimeout(() => card.classList.add('active'), 50); 
            } else {
                card.style.display = 'none';
                card.classList.remove('active');
            }
        });
    };

    // ============================================================
    // 7. SCROLL REVEAL
    // ============================================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.hero-left-title, .hero-right-content, .scroll-down-arrow, .category-section, .main-footer').forEach(el => {
        el.classList.add('reveal-item');
        observer.observe(el);
    });

    // ============================================================
    // 8. VIDEO MODAL
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
        if(previewTitleEl) previewTitleEl.textContent = title;
        
        previewContainer.style.display = 'flex';
        setTimeout(() => {
            previewContainer.classList.add('active');
        }, 10);
        
        previewContainer.classList.add('is-paused');
        document.body.style.overflow = 'hidden';

        previewVideo.src = videoSrc;
        previewVideo.load();
    }

    function closeVideoPreview() {
        if(!previewContainer) return;
        previewContainer.classList.remove('active');
        previewContainer.classList.add('is-paused');
        previewContainer.classList.remove('user-inactive');
        document.body.style.overflow = 'auto';

        setTimeout(() => {
            previewVideo.pause();
            previewVideo.currentTime = 0;
            previewVideo.removeAttribute('src');
            previewContainer.style.display = 'none';
        }, 500);
    }

    function togglePlay(e) {
        if(e) e.stopPropagation();
        previewVideo.paused ? previewVideo.play() : previewVideo.pause();
    }

    function updatePlayButtonUI() {
        const modalPlayText = modalPlayContainer ? modalPlayContainer.querySelector('.play-text') : null;
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        
        if (previewVideo.paused) {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if(modalPlayText) modalPlayText.textContent = 'PLAY';
            previewContainer.classList.add('is-paused');
            previewContainer.classList.remove('user-inactive');
        } else {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if(modalPlayText) modalPlayText.textContent = 'PAUSE';
            previewContainer.classList.remove('is-paused');
            handleUserActivity();
        }
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('.fullscreen-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.fullscreen-btn');
            openModal(btn.getAttribute('data-video-src'), btn.getAttribute('data-title'));
        }
        if (e.target.closest('#playPauseBtn') || e.target.closest('#modalPlayBtnContainer')) {
             e.stopPropagation();
             togglePlay();
        }
    });

    if (previewVideo) {
        previewVideo.addEventListener('click', togglePlay);
        previewVideo.addEventListener('play', updatePlayButtonUI);
        previewVideo.addEventListener('pause', updatePlayButtonUI);
        previewVideo.addEventListener('timeupdate', () => {
             if (previewVideo.duration) {
                const percent = (previewVideo.currentTime / previewVideo.duration) * 100;
                if(progressPlayed) progressPlayed.style.width = percent + '%';
                if(currentTimeEl) currentTimeEl.textContent = formatTime(previewVideo.currentTime);
            }
        });
        previewVideo.addEventListener('loadedmetadata', () => {
             if(durationTimeEl) durationTimeEl.textContent = formatTime(previewVideo.duration);
        });
    }

    if(closePreview) closePreview.onclick = closeVideoPreview;

    if(progressBarContainer) progressBarContainer.addEventListener('click', (e) => {
        const rect = progressBarContainer.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / progressBarContainer.clientWidth;
         if (previewVideo.duration) {
             previewVideo.currentTime = previewVideo.duration * percent;
         }
    });

    if (previewContainer) {
        ['mousemove', 'click'].forEach(evt => previewContainer.addEventListener(evt, handleUserActivity));
    }

    // REWIND / FORWARD BUTTONS
    if (rewindBtn) {
        rewindBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (previewVideo) {
                previewVideo.currentTime = Math.max(0, previewVideo.currentTime - 5);
            }
        });
    }

    if (forwardBtn) {
        forwardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (previewVideo) {
                previewVideo.currentTime = Math.min(previewVideo.duration || 0, previewVideo.currentTime + 5);
            }
        });
    }

    // VOLUME SLIDER
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (previewVideo) {
                previewVideo.volume = e.target.value / 100;
            }
        });
        
        if (previewVideo) {
            volumeSlider.value = previewVideo.volume * 100;
        }
    }

    // FULLSCREEN BUTTON
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (previewContainer) {
                previewContainer.requestFullscreen().catch(err => {
                    console.log('Fullscreen error:', err);
                });
            }
        });
    }

    // ============================================================
    // 9. GLOBAL NAVİQASİYA
    // ============================================================
    
    function setupNavLinks() {
        const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])');
        
        internalLinks.forEach(link => {
            if (link.closest('.mobile-menu')) return;

            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href.startsWith('mailto') || href.startsWith('tel')) return;
                
                e.preventDefault();
                
                if (pageTransition) {
                    pageTransition.classList.remove('page-loaded');
                }
                
                setTimeout(() => {
                    window.location.href = href;
                }, 600);
            });
        });
    }

    // ============================================================
    // 10. GLOBAL CONTACT INFO UPDATER
    // ============================================================
    
    async function updateGlobalContactInfo() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/about?lang=${window.currentLang}`);

            if (!response.ok) {
                console.error("Məlumat tapılmadı");
                return;
            }

            const data = await response.json();

            // Email yenilə
            if (data.email) {
                const emailElements = document.querySelectorAll('.global-email');
                emailElements.forEach(el => {
                    const span = el.querySelector('span');
                    if (span) {
                        span.textContent = data.email;
                        span.setAttribute('data-text', data.email);
                    } else {
                        el.textContent = data.email;
                    }
                    el.href = `mailto:${data.email}`;
                });
            }

            // Telefon yenilə
            if (data.phone) {
                const phoneElements = document.querySelectorAll('.global-phone');
                phoneElements.forEach(el => {
                    const span = el.querySelector('span');
                    if (span) {
                        span.textContent = data.phone;
                        span.setAttribute('data-text', data.phone);
                    } else {
                        el.textContent = data.phone;
                    }
                    const cleanPhone = data.phone.replace(/\s+/g, '');
                    el.href = `tel:${cleanPhone}`;
                });
            }

            // Ünvan yenilə
            if (data.address) {
                const addressElements = document.querySelectorAll('.global-address');
                addressElements.forEach(el => {
                    el.textContent = data.address;
                });
            }

        } catch (error) {
            console.error("Əlaqə məlumatları yenilənərkən xəta:", error);
        }
    }

    // ============================================================
    // 11. INIT - ✅ BİRLƏŞDİRİLMİŞ VƏ DÜZƏLDİLMİŞ
    // ============================================================
    
    async function init() {
        // Translations yüklə
        await loadTranslations();
        
        // Language selector başlat
        initLanguageSelector();
        
        // Hero video başlat (Cloudinary)
        initHeroVideo();
        
        // Works məlumatlarını yüklə
        loadDynamicWorks();
        
        // Naviqasiya linklərini qur
        setupNavLinks();
        
        // Contact məlumatlarını yüklə
        updateGlobalContactInfo();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();