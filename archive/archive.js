(function() {
    'use strict';

    // ============================================================
    // 0. API & GLOBAL VARS
    // ============================================================
    const BACKEND_URL = "https://cinechord-admin-production.up.railway.app";
    const API_ARCHIVE = `${BACKEND_URL}/api/archive`;
    const UPLOADS_URL = `${BACKEND_URL}/uploads/`;

    const tableBody = document.querySelector('.archive-table tbody');
    const pageTransition = document.querySelector('.page-transition');
    const header = document.querySelector('.header');
    const logo = document.querySelector('.center-logo');

    // Modal DOM elements
    const previewContainer = document.getElementById('previewContainer');
    const previewVideo = document.getElementById('previewVideo');
    const previewTitleEl = document.getElementById('previewTitle');
    const previewMeta = document.getElementById('previewMeta');
    const closePreview = document.getElementById('closePreview');
    const modalPlayContainer = document.getElementById('modalPlayBtnContainer');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressPlayed = document.getElementById('progressPlayed');
    const currentTimeEl = document.getElementById('currentTime');
    const durationTimeEl = document.getElementById('durationTime');
    const volumeSlider = document.getElementById('volumeSlider');
    const progressSlider = document.getElementById('progressSlider');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const skipBackBtn = document.getElementById('skipBackBtn');
    const skipForwardBtn = document.getElementById('skipForwardBtn');
    const speedBtn = document.getElementById('speedBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // Mouse Inactivity Timer
    let activityTimeout = null;
    const INACTIVITY_DELAY = 2000;

    // Category mapping
    const categoryMap = {
        'FILM': 'FILM',
        'COMMERCIAL': 'COMMERCIAL',
        'CLIP': 'CLIP',
        'MUSIC_VIDEO': 'MUSIC VIDEO',
        'DOCUMENTARY': 'DOCUMENTARY',
        'SOCIAL': 'SOCIAL'
    };

    // ============================================================
    // 1. PAGE LOAD & TRANSITION LOGIC
    // ============================================================

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
    // 2. NAVBAR & LOGO SCROLL LOGIC
    // ============================================================

    let lastScroll = 0;

    setTimeout(() => { if (logo) logo.classList.add('entry-done'); }, 200);

    function handleScroll() {
        const currentScroll = window.scrollY;

        // Header hide/show
        if (header) {
            header.style.transform = (currentScroll > lastScroll && currentScroll > 50) ? 'translateY(-100%)' : 'translateY(0)';
        }

        // Logo hide/show
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

    // ============================================================
    // 4. SCRAMBLE EFFECT & NAVIGATION
    // ============================================================

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

    document.querySelectorAll('.nav-btn, .footer-link').forEach(btn => {
        const href = btn.getAttribute('href');
        const isExternal = href && !href.startsWith('#') && !href.startsWith('..');

        if (btn.classList.contains('nav-btn')) {
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
    // 5. LOAD ARCHIVE DATA
    // ============================================================

    function cleanUrlPath(url) {
        if (url && typeof url === 'string') {
            if (url.startsWith('http')) return url;
            if (url.startsWith('/uploads/')) return url.substring('/uploads/'.length);
            if (!url.startsWith('/') && url.includes('.')) return url;
        }
        return url;
    }

    async function loadArchiveData() {
        if (!tableBody) return;

        try {
            const response = await fetch(API_ARCHIVE);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }

            const data = await response.json();
            const works = data.content ? data.content : data;
            tableBody.innerHTML = '';

            if (works.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" style="color:white; text-align:center; padding:60px; opacity:0.5;">No archive data found.</td></tr>';
                return;
            }

            works.forEach((work, index) => {
                let videoSrc = work.previewVideoUrl || work.videoUrl;

                if (videoSrc) {
                    videoSrc = cleanUrlPath(videoSrc);
                    if (!videoSrc.startsWith('http')) {
                        videoSrc = UPLOADS_URL + videoSrc;
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

                tableBody.appendChild(row);
            });

            const newRows = tableBody.querySelectorAll('tr');
            newRows.forEach(row => observer.observe(row));

            attachTableRowEffects();

        } catch (error) {
            console.error("Error loading archive:", error);
            tableBody.innerHTML = `
                <tr><td colspan="7" style="color:red; text-align:center; padding:60px;">
                    API connection failed. Please check the backend server connection.
                </td></tr>
            `;
        }
    }

    // ============================================================
    // 6. TABLE ROW EFFECTS & SCRAMBLE
    // ============================================================

    function attachTableRowEffects() {
        document.querySelectorAll('.archive-table tbody tr').forEach(row => {
            row.addEventListener('click', function() {
                const videoSrc = this.getAttribute('data-video-src');
                const title = this.getAttribute('data-title');
                const client = this.getAttribute('data-client');
                const category = this.getAttribute('data-category');
                const year = this.getAttribute('data-year');

                if (!videoSrc || videoSrc === '') return;
                openModal(videoSrc, title, client, category, year);
            });

            // Scramble effect on hover
            row.addEventListener('mouseenter', function() {
                const cells = this.querySelectorAll('td:not(.number-col)');
                const originalTexts = {};

                cells.forEach(cell => {
                    originalTexts[cell.className] = cell.textContent;
                });

                cells.forEach(cell => {
                    const originalText = originalTexts[cell.className];
                    let iteration = 0;
                    const interval = setInterval(() => {
                        let newText = '';
                        for (let i = 0; i < originalText.length; i++) {
                            if (i < iteration) {
                                newText += originalText[i];
                            } else {
                                newText += letters[Math.floor(Math.random() * letters.length)];
                            }
                        }
                        cell.textContent = newText;
                        iteration += 1 / 2.5;
                        if (iteration >= originalText.length) {
                            clearInterval(interval);
                            cell.textContent = originalText;
                        }
                    }, 30);

                    cell.dataset.scrambleInterval = interval;
                });
            });

            row.addEventListener('mouseleave', function() {
                const cells = this.querySelectorAll('td:not(.number-col)');
                cells.forEach(cell => {
                    if (cell.dataset.scrambleInterval) {
                        clearInterval(parseInt(cell.dataset.scrambleInterval));
                    }
                });
            });
        });
    }

    // ============================================================
    // 7. VIDEO MODAL LOGIC
    // ============================================================

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function handleUserActivity() {
        if (!previewContainer) return;
        previewContainer.classList.remove('user-inactive');
        clearTimeout(activityTimeout);

        if (previewVideo && !previewVideo.paused) {
            activityTimeout = setTimeout(() => {
                previewContainer.classList.add('user-inactive');
            }, INACTIVITY_DELAY);
        }
    }

    function openModal(videoSrc, title, client, category, year) {
        if (!videoSrc) return;

        if (previewTitleEl) {
            previewTitleEl.textContent = `${client} - ${title}`;
            previewTitleEl.setAttribute('data-text', `${client} - ${title}`);
        }

        if (previewMeta) {
            previewMeta.textContent = `${category} • ${year}`;
        }

        previewVideo.src = videoSrc;

        setTimeout(() => {
            previewContainer.style.display = 'flex';
            setTimeout(() => {
                previewContainer.classList.add('active');
                previewContainer.classList.add('is-paused');
                document.body.style.overflow = 'hidden';

                previewVideo.onloadedmetadata = function() {
                    if (durationTimeEl) durationTimeEl.textContent = formatTime(previewVideo.duration);
                    const modalPlayText = modalPlayContainer ? modalPlayContainer.querySelector('.play-text') : null;
                    if (modalPlayText) {
                        modalPlayText.setAttribute('data-text', 'PLAY');
                        modalPlayText.innerText = 'PLAY';
                    }
                };
            }, 10);
        }, 10);
    }

    function closeVideoPreview() {
        if (!previewContainer) return;
        previewContainer.classList.remove('active');
        previewContainer.classList.add('is-paused');
        previewContainer.classList.remove('user-inactive');
        clearTimeout(activityTimeout);
        document.body.style.overflow = 'auto';

        setTimeout(() => {
            previewVideo.pause();
            previewVideo.currentTime = 0;
            previewVideo.removeAttribute('src');
            if (durationTimeEl) durationTimeEl.textContent = '0:00';
            previewContainer.style.display = 'none';
        }, 500);
    }

    function updatePlayButtonUI() {
        const modalPlayText = modalPlayContainer ? modalPlayContainer.querySelector('.play-text') : null;

        if (previewVideo.paused) {
            if (modalPlayText) applyScrambleEffect(modalPlayContainer, modalPlayText, "PLAY");
            previewContainer.classList.add('is-paused');
            previewContainer.classList.remove('user-inactive');
            clearTimeout(activityTimeout);
        } else {
            if (modalPlayText) applyScrambleEffect(modalPlayContainer, modalPlayText, "PAUSE");
            previewContainer.classList.remove('is-paused');
            handleUserActivity();
        }
    }

    function togglePlay(e) {
        if (e) e.stopPropagation();
        previewVideo.paused ? previewVideo.play() : previewVideo.pause();
    }

    // Event Listeners
    document.addEventListener('click', (e) => {
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
            if (progressPlayed) progressPlayed.style.width = percent + '%';
            if (currentTimeEl) currentTimeEl.textContent = formatTime(previewVideo.currentTime);
        });
    }

    if (closePreview) closePreview.onclick = closeVideoPreview;

    if (progressBarContainer) {
        progressBarContainer.addEventListener('click', (e) => {
            const rect = progressBarContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = progressBarContainer.clientWidth;
            const percentage = clickX / width;
            previewVideo.currentTime = previewVideo.duration * percentage;
            handleUserActivity();
        });
    }

    if (volumeSlider) {
        volumeSlider.oninput = function(e) {
            previewVideo.volume = e.target.value / 100;
            handleUserActivity();
        };
    }

    if (skipBackBtn) {
        skipBackBtn.onclick = () => {
            previewVideo.currentTime -= 10;
            handleUserActivity();
        };
    }

    if (skipForwardBtn) {
        skipForwardBtn.onclick = () => {
            previewVideo.currentTime += 10;
            handleUserActivity();
        };
    }

    if (progressSlider) {
        progressSlider.addEventListener('input', (e) => {
            const time = (e.target.value / 100) * previewVideo.duration;
            previewVideo.currentTime = time;
            handleUserActivity();
        });
    }

    if (speedBtn) {
        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
        let currentSpeedIndex = 2;
        speedBtn.addEventListener('click', () => {
            currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
            const newSpeed = speeds[currentSpeedIndex];
            previewVideo.playbackRate = newSpeed;
            speedBtn.textContent = `${newSpeed}x`;
            handleUserActivity();
        });
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (previewVideo.requestFullscreen) {
                previewVideo.requestFullscreen().catch(err => {
                    console.log('Fullscreen request failed:', err);
                });
            }
            handleUserActivity();
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (previewContainer && previewContainer.classList.contains('active')) {
            if (e.key === 'Escape') closeVideoPreview();
            if (e.key === ' ') { e.preventDefault(); togglePlay(); }
            if (e.key === 'ArrowLeft') { previewVideo.currentTime -= 5; handleUserActivity(); }
            if (e.key === 'ArrowRight') { previewVideo.currentTime += 5; handleUserActivity(); }
        }
    });

    // ============================================================
    // 8. MOBILE MENU
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
    // 9. INITIALIZATION
    // ============================================================

    function init() {
        loadArchiveData();

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