/* ============================================================
   CineChord Archive - Main JavaScript
   Version: 6.5 - SCRAMBLE EFFECT BUG FIXED
   ============================================================ */

(function() {
    'use strict';

    /* ============================================================
       1. CONFIGURATION & CONSTANTS
       ============================================================ */
    
    const CONFIG = {
        BACKEND_URL: 'https://cinechord-admin-production.up.railway.app',
        UPLOADS_URL: 'https://cinechord-admin-production.up.railway.app/uploads/',
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        INACTIVITY_DELAY: 2000
    };

    const API_URLS = {
        ARCHIVE: `${CONFIG.BACKEND_URL}/api/archive`
    };

    const categoryMap = {
        'FILM': 'FILM', 'COMMERCIAL': 'COMMERCIAL', 'CLIP': 'CLIP',
        'MUSIC_VIDEO': 'MUSIC VIDEO', 'DOCUMENTARY': 'DOCUMENTARY', 'SOCIAL': 'SOCIAL'
    };

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const pageTransition = document.querySelector('.page-transition');
    
    const elements = {
        centerLogo: document.querySelector('.center-logo'),
        tableBody: document.querySelector('.archive-table tbody'),
        // Video Modal
        previewContainer: document.getElementById('previewContainer'),
        previewVideo: document.getElementById('previewVideo'),
        previewTitleEl: document.getElementById('previewTitle'),
        closePreview: document.getElementById('closePreview'),
        modalPlayContainer: document.getElementById('modalPlayBtnContainer'),
        progressBarContainer: document.getElementById('progressBarContainer'),
        progressPlayed: document.getElementById('progressPlayed'),
        currentTimeEl: document.getElementById('currentTime'),
        durationTimeEl: document.getElementById('durationTime'),
        volumeSlider: document.getElementById('volumeSlider'),
        rewindBtn: document.getElementById('rewindBtn'),
        forwardBtn: document.getElementById('forwardBtn'),
        speedBtn: document.getElementById('speedBtn'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        playIcon: document.getElementById('playIcon'),
        pauseIcon: document.getElementById('pauseIcon'),
        fullscreenBtn: document.getElementById('fullscreenBtn')
    };

    /* ============================================================
       3. STATE VARIABLES
       ============================================================ */
    
    let activityTimeout = null;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Global translations object
    window.translations = null;
    window.currentLang = 'en';

    /* ============================================================
       4. PAGE TRANSITION SYSTEM
       ============================================================ */
    
    function initPageTransition() {
        if (!pageTransition) return;
        
        setTimeout(() => {
            pageTransition.classList.add('page-loaded');
        }, CONFIG.PAGE_LOAD_DELAY);
    }

    function navigateWithTransition(href) {
        if (!href) return;
        
        if (href.startsWith('mailto') || href.startsWith('tel')) {
            window.location.href = href;
            return;
        }
        
        if (pageTransition) {
            pageTransition.classList.remove('page-loaded');
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
       5. LOGO CLICK - AYRICA HANDLE
       ============================================================ */

    function initLogoClick() {
        const logo = document.querySelector('.center-logo');
        
        if (!logo) {
            console.warn('Logo element tapılmadı!');
            return;
        }

        logo.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const href = this.getAttribute('href');
            
            if (!href) {
                navigateWithTransition('../');
                return;
            }
            
            navigateWithTransition(href);
        });

        logo.addEventListener('touchend', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href') || '../';
            navigateWithTransition(href);
        }, { passive: false });
    }

    /* ============================================================
       5. TRANSLATION SYSTEM
       ============================================================ */

    async function loadTranslations() {
        try {
            const response = await fetch('../lang/archive.json');
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
                    "archive_title": "ARCHIVE",
                    "play": "PLAY",
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
                    "archive_title": "ARXİV",
                    "play": "BAŞLAT",
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
        const hamburgerTextEl = document.querySelector('.hamburger-text');
        if (hamburgerTextEl) {
            const hamburgerBtn = document.getElementById('hamburgerBtn');
            const isMenuOpen = hamburgerBtn && hamburgerBtn.classList.contains('active');
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

        // Archive Title
        const archiveTitle = document.querySelector('.archive-title');
        if (archiveTitle) {
            const key = archiveTitle.getAttribute('data-key');
            if (key && t[key]) {
                archiveTitle.textContent = t[key];
            }
        }

        // Play Button
        const playTexts = document.querySelectorAll('.play-text');
        playTexts.forEach(el => {
            if (t.play) {
                el.textContent = t.play;
                el.setAttribute('data-text', t.play);
            }
        });

        // Footer Labels
        const footerLabels = document.querySelectorAll('.footer-label');
        footerLabels.forEach(label => {
            const key = label.getAttribute('data-key');
            if (key && t[key]) {
                label.textContent = t[key];
            }
        });

        // Table Headers
        const tableHeaders = document.querySelectorAll('.archive-table th[data-key]');
        tableHeaders.forEach(header => {
            const key = header.getAttribute('data-key');
            if (key && t[key]) {
                header.textContent = t[key];
            }
        });

        // Archive Subtitle
        const archiveSubtitle = document.querySelector('.archive-subtitle');
        if (archiveSubtitle) {
            const fullFilmSpan = archiveSubtitle.querySelector('span[data-key="full_film_available"]');
            const shootMessageLink = archiveSubtitle.querySelector('a[data-key="shoot_message"]');
            
            if (fullFilmSpan && t.full_film_available) {
                fullFilmSpan.textContent = t.full_film_available;
            }
            
            if (shootMessageLink && t.shoot_message) {
                shootMessageLink.textContent = t.shoot_message;
            }
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
       6. GLOBE LANGUAGE SELECTOR
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
        
        // Seçilmiş dili tətbiq et (translations zaten yüklenmiş olmalı)
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
       6. MOBILE MENU
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
                if (window.translations && window.translations[window.currentLang]) {
                    const t = window.translations[window.currentLang];
                    hamburgerText.textContent = isActive ? t.menu : t.close;
                } else {
                    hamburgerText.textContent = isActive ? 'MENU' : 'CLOSE';
                }
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

        function handleHamburgerClick(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        }

        hamburger.addEventListener('click', handleHamburgerClick);
        
        hamburger.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        }, { passive: false });

        document.addEventListener('click', function(e) {
            if (e.target.id === 'hamburgerBtn' || e.target.closest('#hamburgerBtn')) {
                if (!e.defaultPrevented) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu();
                }
            }
        }, true);

        if (overlay) {
            overlay.addEventListener('click', function(e) {
                e.preventDefault();
                toggleMenu();
            });
        }

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
       7. SCROLL REVEAL (INTERSECTION OBSERVER)
       ============================================================ */
    
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

    function initScrollReveal() {
        document.querySelectorAll('.reveal-item').forEach((el) => {
            observer.observe(el);
        });
    }

    /* ============================================================
       8. UTILITY FUNCTIONS
       ============================================================ */

    function cleanUrlPath(url) {
        if (url && typeof url === 'string') {
            if (url.startsWith('http')) return url;
            if (url.startsWith('/uploads/')) return url.substring('/uploads/'.length);
            if (!url.startsWith('/') && url.includes('.')) return url;
        }
        return url;
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

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
       9. LOAD ARCHIVE DATA
       ============================================================ */

    async function loadArchiveData() {
        if (!elements.tableBody) return;

        try {
            const response = await fetch(API_URLS.ARCHIVE);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }

            const data = await response.json();
            const works = data.content ? data.content : data;
            elements.tableBody.innerHTML = '';

            if (works.length === 0) {
                elements.tableBody.innerHTML = '<tr><td colspan="7" style="color:white; text-align:center; padding:60px; opacity:0.5;">No archive data found.</td></tr>';
                return;
            }

            works.forEach((work, index) => {
                let videoSrc = work.previewVideoUrl || work.videoUrl;

                if (videoSrc) {
                    videoSrc = cleanUrlPath(videoSrc);
                    if (!videoSrc.startsWith('http')) {
                        videoSrc = CONFIG.UPLOADS_URL + videoSrc;
                    }
                }

                const categoryDisplay = categoryMap[work.category] || work.category || '-';

                const row = document.createElement('tr');
                row.setAttribute('data-video-src', videoSrc);
                row.setAttribute('data-title', work.title || '');
                row.setAttribute('data-client', work.clientName || '');
                row.setAttribute('data-category', categoryDisplay);
                row.setAttribute('data-year', work.productionYear || '');
                row.style.transitionDelay = `${index * 0.05}s`;

                row.innerHTML = `
                    <td class="number-col">${String(index + 1).padStart(2, '0')}</td>
                    <td class="client-col">${work.clientName || '-'}</td>
                    <td class="title-col">${work.title || 'Untitled'}</td>
                    <td class="type-col">${categoryDisplay}</td>
                    <td class="location-col">${work.location || '-'}</td>
                    <td class="agency-col">${work.agency || '-'}</td>
                    <td class="year-col">${work.productionYear || '-'}</td>
                `;

                elements.tableBody.appendChild(row);
            });

            const newRows = elements.tableBody.querySelectorAll('tr');
            newRows.forEach(row => observer.observe(row));

            attachTableRowEffects();

        } catch (error) {
            console.error("Error loading archive:", error);
            elements.tableBody.innerHTML = `
                <tr><td colspan="7" style="color:red; text-align:center; padding:60px;">
                    API connection failed. Please check the backend server connection.
                </td></tr>
            `;
        }
    }

    /* ============================================================
       10. TABLE ROW EFFECTS - SCRAMBLE BUG FIXED
       ============================================================ */

    function attachTableRowEffects() {
        document.querySelectorAll('.archive-table tbody tr').forEach(row => {
            
            // Row click - video modal aç
            row.addEventListener('click', function() {
                const videoSrc = this.getAttribute('data-video-src');
                const title = this.getAttribute('data-title');
                const client = this.getAttribute('data-client');

                if (!videoSrc || videoSrc === '') return;
                openModal(videoSrc, `${client} - ${title}`);
            });

            // ===== SCRAMBLE EFFECT - DÜZƏLDİLMİŞ VERSİYA =====
            row.addEventListener('mouseenter', function() {
                const cells = this.querySelectorAll('td:not(.number-col)');
                
                cells.forEach(cell => {
                    // Əvvəlki interval varsa, onu clear et
                    if (cell._scrambleInterval) {
                        clearInterval(cell._scrambleInterval);
                        cell._scrambleInterval = null;
                    }
                    
                    // Orijinal mətni YALNIZ ilk dəfə saxla
                    // Əgər artıq saxlanılıbsa, onu istifadə et
                    if (!cell.dataset.originalText) {
                        cell.dataset.originalText = cell.textContent;
                    }
                    
                    const originalText = cell.dataset.originalText;
                    let iteration = 0;
                    
                    cell._scrambleInterval = setInterval(() => {
                        let newText = '';
                        for (let i = 0; i < originalText.length; i++) {
                            if (i < iteration) {
                                newText += originalText[i];
                            } else {
                                newText += letters[Math.floor(Math.random() * letters.length)];
                            }
                        }
                        cell.textContent = newText;
                        iteration += 1 / 3.5;
                        
                        if (iteration >= originalText.length) {
                            clearInterval(cell._scrambleInterval);
                            cell._scrambleInterval = null;
                            cell.textContent = originalText; // Mütləq orijinalı qoy
                        }
                    }, 30);
                });
            });

            row.addEventListener('mouseleave', function() {
                const cells = this.querySelectorAll('td:not(.number-col)');
                
                cells.forEach(cell => {
                    // İntervalı dayandır
                    if (cell._scrambleInterval) {
                        clearInterval(cell._scrambleInterval);
                        cell._scrambleInterval = null;
                    }
                    
                    // VACİB: Orijinal mətni bərpa et!
                    if (cell.dataset.originalText) {
                        cell.textContent = cell.dataset.originalText;
                    }
                });
            });
        });
    }

    /* ============================================================
       11. VIDEO MODAL LOGIC
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

    function openModal(videoSrc, title) {
        if (!videoSrc) return;

        if (elements.previewTitleEl) {
            elements.previewTitleEl.textContent = title;
            elements.previewTitleEl.setAttribute('data-text', title);
        }

        elements.previewContainer.style.display = 'flex';
        elements.previewContainer.classList.add('active');
        elements.previewContainer.classList.add('is-paused');
        document.body.style.overflow = 'hidden';

        elements.previewVideo.src = videoSrc;
        elements.previewVideo.load();
        
        elements.previewVideo.onloadedmetadata = function() {
            if (elements.durationTimeEl) elements.durationTimeEl.textContent = formatTime(elements.previewVideo.duration);
            const modalPlayText = elements.modalPlayContainer ? elements.modalPlayContainer.querySelector('.play-text') : null;
            if (modalPlayText) {
                modalPlayText.setAttribute('data-text', 'PLAY');
                modalPlayText.innerText = 'PLAY';
            }
        };
    }

    function closeVideoPreview() {
        if (!elements.previewContainer) return;
        elements.previewContainer.classList.remove('active');
        elements.previewContainer.classList.add('is-paused');
        elements.previewContainer.classList.remove('user-inactive');
        clearTimeout(activityTimeout);
        document.body.style.overflow = 'auto';

        setTimeout(() => {
            elements.previewVideo.pause();
            elements.previewVideo.currentTime = 0;
            elements.previewVideo.removeAttribute('src');
            if (elements.durationTimeEl) elements.durationTimeEl.textContent = '0:00';
            elements.previewContainer.style.display = 'none';
        }, 500);
    }

    function updatePlayButtonUI() {
        const modalPlayText = elements.modalPlayContainer ? elements.modalPlayContainer.querySelector('.play-text') : null;

        if (elements.previewVideo.paused) {
            if (elements.playIcon) elements.playIcon.style.display = 'block';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'none';
            if (modalPlayText) applyScrambleEffect(elements.modalPlayContainer, modalPlayText, "PLAY");
            elements.previewContainer.classList.add('is-paused');
            elements.previewContainer.classList.remove('user-inactive');
            clearTimeout(activityTimeout);
        } else {
            if (elements.playIcon) elements.playIcon.style.display = 'none';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'block';
            if (modalPlayText) applyScrambleEffect(elements.modalPlayContainer, modalPlayText, "PAUSE");
            elements.previewContainer.classList.remove('is-paused');
            handleUserActivity();
        }
    }

    function togglePlay(e) {
        if (e) e.stopPropagation();
        elements.previewVideo.paused ? elements.previewVideo.play() : elements.previewVideo.pause();
    }

    function initVideoModal() {
        if (!elements.previewContainer || !elements.previewVideo) return;

        document.addEventListener('click', (e) => {
            if (e.target.closest('#playPauseBtn') || e.target.closest('#modalPlayBtnContainer')) {
                e.stopPropagation();
                togglePlay();
            }
        });

        ['mousemove', 'click', 'touchstart'].forEach(event => {
            elements.previewContainer.addEventListener(event, handleUserActivity);
        });

        elements.previewVideo.addEventListener('click', togglePlay);
        elements.previewVideo.addEventListener('play', updatePlayButtonUI);
        elements.previewVideo.addEventListener('pause', updatePlayButtonUI);
        elements.previewVideo.addEventListener('ended', () => {
            elements.previewVideo.pause();
            elements.previewVideo.currentTime = 0;
        });

        elements.previewVideo.addEventListener('timeupdate', () => {
            const percent = (elements.previewVideo.currentTime / elements.previewVideo.duration) * 100;
            if (elements.progressPlayed) elements.progressPlayed.style.width = percent + '%';
            if (elements.currentTimeEl) elements.currentTimeEl.textContent = formatTime(elements.previewVideo.currentTime);
        });

        if (elements.closePreview) elements.closePreview.onclick = closeVideoPreview;

        if (elements.progressBarContainer) {
            elements.progressBarContainer.addEventListener('click', (e) => {
                const rect = elements.progressBarContainer.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const width = elements.progressBarContainer.clientWidth;
                const percentage = clickX / width;
                elements.previewVideo.currentTime = elements.previewVideo.duration * percentage;
                handleUserActivity();
            });
        }

        if (elements.volumeSlider) {
            elements.volumeSlider.oninput = function(e) {
                elements.previewVideo.volume = e.target.value / 100;
                handleUserActivity();
            };
        }

        if (elements.rewindBtn) {
            elements.rewindBtn.onclick = () => {
                elements.previewVideo.currentTime -= 5;
                handleUserActivity();
            };
        }

        if (elements.forwardBtn) {
            elements.forwardBtn.onclick = () => {
                elements.previewVideo.currentTime += 5;
                handleUserActivity();
            };
        }

        if (elements.fullscreenBtn) {
            elements.fullscreenBtn.onclick = () => {
                if (elements.previewVideo.requestFullscreen) {
                    elements.previewVideo.requestFullscreen();
                } else if (elements.previewVideo.webkitRequestFullscreen) {
                    elements.previewVideo.webkitRequestFullscreen();
                }
            };
        }

        document.addEventListener('keydown', (e) => {
            if (elements.previewContainer && elements.previewContainer.classList.contains('active')) {
                if (e.key === ' ') { e.preventDefault(); togglePlay(); }
                if (e.key === 'ArrowLeft') { elements.previewVideo.currentTime -= 5; handleUserActivity(); }
                if (e.key === 'ArrowRight') { elements.previewVideo.currentTime += 5; handleUserActivity(); }
            }
        });
    }

    /* ============================================================
       12. DİGƏR LİNKLƏR (Logo xaric)
       ============================================================ */
    
    function setupOtherLinks() {
        const internalLinks = document.querySelectorAll('a:not([href^="#"]):not([target="_blank"]):not(.center-logo)');
        
        internalLinks.forEach(link => {
            if (link.closest('.mobile-menu')) return;

            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (!href) return;
                if (href.startsWith('mailto') || href.startsWith('tel')) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                navigateWithTransition(href);
            });
        });
    }

    /* ============================================================
       13. INITIALIZATION
       ============================================================ */
    
    async function init() {
        await loadTranslations();
        initPageTransition();
        initLogoClick();
        initLanguageSelector();
        initMobileMenu();
        initScrollReveal();
        initVideoModal();
        loadArchiveData();
        setupOtherLinks();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    async function init() {
    // ... digər funksiyaların (loadTranslations, initPageTransition və s.)
    
    loadContactDetails(); // <--- BUNU ƏLAVƏ ET Kİ, SƏHİFƏ AÇILANDA MƏLUMAT GƏLSİN
}

/* ============================================================
   GLOBAL CONTACT INFO UPDATER (Footer & Contact Page)
   ============================================================ */

async function updateGlobalContactInfo() {
    try {
        // 1. Admin paneldəki About məlumatlarını gətiririk
        // QEYD: URL-i öz server ünvanına uyğun yoxla
        const baseUrl = "https://cinechord-admin-production.up.railway.app"; 
        const response = await fetch(`${baseUrl}/api/about?lang=en`);

        if (!response.ok) {
            console.error("Məlumat tapılmadı");
            return;
        }

        const data = await response.json();

        // 2. Bütün səhifədəki Emailləri tapıb yeniləyirik
        if (data.email) {
            const emailElements = document.querySelectorAll('.global-email');
            emailElements.forEach(el => {
                el.textContent = data.email;
                el.href = `mailto:${data.email}`;
            });
        }

        // 3. Bütün səhifədəki Telefon nömrələrini tapıb yeniləyirik
        if (data.phone) {
            const phoneElements = document.querySelectorAll('.global-phone');
            phoneElements.forEach(el => {
                el.textContent = data.phone;
                // tel: linki üçün boşluqları silirik (+994 50... -> +99450...)
                const cleanPhone = data.phone.replace(/\s+/g, '');
                el.href = `tel:${cleanPhone}`;
            });
        }

        // 4. Bütün səhifədəki Ünvanları tapıb yeniləyirik
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

// Səhifə tam yüklənəndə funksiyanı işə sal
document.addEventListener('DOMContentLoaded', () => {
    updateGlobalContactInfo();
});

})();