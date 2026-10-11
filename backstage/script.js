/* ================================================================
   CineChord — BEHIND THE SCENES / "REEL ARCHIVE"
   ================================================================
   DİNAMİK VERSİYA:
   - window.BTS_CLIPS backend-dəki /api/backstage (public, yalnız
     published=true item-lər) endpoint-indən fetch olunur.
   - Hero (#cineStage) daxilindəki .video-panel elementləri backend-dən
     gələn siyahıya görə JS tərəfindən dinamik yaradılır (buildStagePanels).
   - AUTO PLAY: videolar arasında hər 3 saniyədən bir avtomatik keçid.
     "BEHIND THE SCENE" yazısına heç vaxt qayıtmır.
   ================================================================ */

const BACKSTAGE_API_BASE = "https://cinechord-admin-production.up.railway.app";
const BACKSTAGE_API = `${BACKSTAGE_API_BASE}/api/backstage`;

(function () {

    'use strict';

    const prefersReducedMotion =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;


    /* ============================================================
       BACKEND-DƏN BACKSTAGE MƏLUMATLARINI YÜKLƏMƏK
       ============================================================ */

    const BTS_CACHE_KEY = 'btsItemsCache';

    function readCache() {
        try {
            const raw = localStorage.getItem(BTS_CACHE_KEY);
            const arr = raw ? JSON.parse(raw) : null;
            return Array.isArray(arr) && arr.length ? arr : null;
        } catch (e) {
            return null;
        }
    }

    async function fetchFresh() {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 10000);
        try {
            const res = await fetch(BACKSTAGE_API, { signal: ctrl.signal });
            if (!res.ok) {
                console.error('[CineChord] Backstage API xətası:', res.status);
                return null;
            }
            const items = await res.json();
            if (!Array.isArray(items)) return null;

            const sorted = items.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

            try { localStorage.setItem(BTS_CACHE_KEY, JSON.stringify(sorted)); } catch (e) {}

            return sorted;
        } catch (e) {
            console.error('[CineChord] Backstage fetch xətası:', e);
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    // Cache varsa dərhal onu qaytarır (səhifə gözləmir), eyni zamanda
    // arxa planda təzə data yüklənib cache-i yeniləyir (növbəti girişdə görünür).
    async function fetchBackstageItems() {
        const cached = readCache();
        const fresh = fetchFresh();
        if (cached) return cached;
        return (await fresh) || [];
    }

    function buildStagePanels(items) {

        const stage = document.getElementById('cineStage');
        if (!stage) return;

        stage.querySelectorAll('.video-panel').forEach(p => p.remove());

        if (!items.length) return;

        items.forEach((item, i) => {

            const panel = document.createElement('div');
            panel.className = 'video-panel';
            panel.dataset.panel = i;

            const brand = item.brand || '';
            const title = item.title || '';
            const posterUrl = item.posterUrl || '';
            const videoUrl = item.videoUrl || '';

            panel.innerHTML = `
                <div class="video-panel-inner">
                    <img
                        class="stage-video stage-video-bg"
                        src="${posterUrl}"
                        alt="Backstage Poster"
                        loading="${i === 0 ? 'eager' : 'lazy'}"
                    >

                    <img
                        class="stage-video stage-video-fg"
                        src="${posterUrl}"
                        alt="Backstage Poster"
                        loading="${i === 0 ? 'eager' : 'lazy'}"
                    >

                    <div class="poster-caption">
                        <span class="poster-brand" data-text="${brand}">${brand}</span>
                        <span class="poster-sub" data-text="cinechord">cinechord</span>
                    </div>

                    <a href="#" class="poster-play" data-text="play"
                       data-video="${videoUrl}" data-title="${title}"
                       aria-label="Play video">play</a>
                </div>
            `;

            stage.appendChild(panel);
        });
    }

    function buildClipsFromItems(items) {
        window.BTS_CLIPS = items.map((item) => ({
            title: item.title || '',
            category: (item.brand || 'other').toLowerCase().trim().replace(/\s+/g, '-'),
            video: item.videoUrl || '',
            poster: item.posterUrl || ''
        }));
    }


    /* ============================================================
       DİL (LANGUAGE) SİSTEMİ
       ============================================================ */

    window.currentLang = localStorage.getItem('selectedLang') || 'en';

    const BTS_TRANSLATIONS = {
        en: {
            menu: 'MENU',
            close: 'CLOSE',
            home: 'HOME',
            work: 'WORK',
            service: 'SERVICE',
            archive: 'ARCHIVE',
            backstage: 'BACKSTAGE',
            about: 'ABOUT',
            contact: 'CONTACT',
            scroll: 'SCROLL'
        },
        az: {
            menu: 'MENYU',
            close: 'BAĞLA',
            home: 'ANA SƏHİFƏ',
            work: 'İŞLƏR',
            service: 'XİDMƏTLƏR',
            archive: 'ARXİV',
            backstage: 'KULİS',
            about: 'HAQQIMIZDA',
            contact: 'ƏLAQƏ',
            scroll: 'AŞAĞI SÜRÜŞDÜR'
        }
    };

    function applyTranslations(lang) {

        const t = BTS_TRANSLATIONS[lang];
        if (!t) return;

        window.currentLang = lang;

        document.querySelectorAll('[data-key]').forEach((el) => {

            if (el.closest('#mobileMenu')) return;

            const key = el.getAttribute('data-key');
            if (!t[key]) return;

            el.textContent = t[key];
        });

        if (lang === 'az') {
            document.body.classList.add('lang-az');
            document.documentElement.setAttribute('lang', 'az');
        } else {
            document.body.classList.remove('lang-az');
            document.documentElement.setAttribute('lang', 'en');
        }
    }

    function initLanguageSelector() {

        const langSelector = document.getElementById('langSelector');
        const langGlobeBtn = document.getElementById('langGlobeBtn');
        const langOptions = document.querySelectorAll('.lang-option');
        const currentLangText = document.getElementById('currentLangText');

        if (!langSelector || !langGlobeBtn) return;

        const savedLang = localStorage.getItem('selectedLang') || 'en';
        window.currentLang = savedLang;

        applyTranslations(savedLang);

        if (currentLangText) currentLangText.textContent = savedLang.toUpperCase();

        langOptions.forEach((opt) => {
            if (opt.dataset.lang === savedLang) opt.classList.add('active');
            else opt.classList.remove('active');
        });

        langGlobeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            langSelector.classList.toggle('active');
        });

        langOptions.forEach((option) => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const lang = option.dataset.lang;

                if (option.classList.contains('active')) {
                    langSelector.classList.remove('active');
                    return;
                }

                langOptions.forEach((opt) => opt.classList.remove('active'));
                option.classList.add('active');

                if (currentLangText) currentLangText.textContent = lang.toUpperCase();
                localStorage.setItem('selectedLang', lang);
                applyTranslations(lang);

                setTimeout(() => langSelector.classList.remove('active'), 200);
            });
        });

        document.addEventListener('click', (e) => {
            if (!langSelector.contains(e.target)) langSelector.classList.remove('active');
        });
    }


    /* ============================================================
       COUNTDOWN INTRO
       ============================================================ */

    function runCountdown() {

        const screen = document.getElementById('countdownScreen');
        const numEl = document.getElementById('countdownNumber');
        const ring = document.getElementById('countdownRingFill');

        if (!screen || !numEl || !ring) {
            return finishCountdown();
        }

        const seen = sessionStorage.getItem('btsIntroShown');

        if (seen) {
            screen.style.display = 'none';
            return finishCountdown(true);
        }

        sessionStorage.setItem('btsIntroShown', 'true');

        let count = 1;
        numEl.textContent = count;

        const circumference = 339;

        function tick() {

            ring.style.strokeDashoffset = 0;

            requestAnimationFrame(() => {
                ring.style.transition = 'none';
                ring.style.strokeDashoffset = circumference;

                requestAnimationFrame(() => {
                    ring.style.transition = 'stroke-dashoffset .4s linear';
                    ring.style.strokeDashoffset = 0;
                });
            });

            setTimeout(() => {
                count--;

                if (count > 0) {
                    numEl.textContent = count;
                    tick();
                } else {
                    screen.classList.add('done');

                    setTimeout(() => {
                        screen.style.display = 'none';
                        finishCountdown();
                    }, 400);
                }
            }, 400);
        }

        tick();
    }


    function finishCountdown(skip) {

        document.querySelector('.page-transition')?.classList.add('page-loaded');

        revealHero();

        if (window.gsap) {
            gsap.to(['.logo-img', '.hamburger'], {
                opacity: 1,
                duration: .8,
                ease: 'power2.out',
                delay: skip ? 0 : .1
            });
        } else {
            const logo = document.querySelector('.logo-img');
            const hamburger = document.querySelector('.hamburger');
            if (logo) logo.style.opacity = 1;
            if (hamburger) hamburger.style.opacity = 1;
        }
    }


    function revealHero() {

        const title = document.getElementById('btsTitle');
        title?.classList.add('revealed');

        if (window.gsap) {
            gsap.to('.scroll-cue', {
                opacity: 1,
                y: 0,
                duration: .9,
                ease: 'power2.out',
                delay: .35
            });
        } else {
            const el = document.querySelector('.scroll-cue');
            if (el) {
                el.style.opacity = 1;
                el.style.transform = 'none';
            }
        }
    }


    /* ============================================================
       CINE STAGE — HERO VIDEO KEÇİDİ
       ============================================================
       DİQQƏT: Bu funksiya çağırılanda #cineStage daxilindəki
       .video-panel elementləri artıq DOM-da olmalıdır — init()
       içində buildStagePanels(items) həmişə initCineStage()-dən
       əvvəl işə düşür.
       ============================================================ */

    function initCineStage() {

        const stage = document.getElementById('cineStage');
        const panels = Array.from(document.querySelectorAll('.video-panel'));

        if (!stage || !panels.length) {
            return;
        }

        const SCROLL_PER_PANEL_RATIO = 0.9;

        let wrapper = null;
        let totalScrollNeeded = 0;

        function getScrollPerPanel() {
            return Math.max(window.innerHeight * SCROLL_PER_PANEL_RATIO, 400);
        }

        function ensureLayout() {

            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.id = 'cineStageWrapper';
                wrapper.style.position = 'relative';
                wrapper.style.width = '100%';

                stage.parentNode.insertBefore(wrapper, stage);
                wrapper.appendChild(stage);

                stage.style.position = 'sticky';
                stage.style.top = '0';
                stage.style.zIndex = '1';
            }

            totalScrollNeeded = getScrollPerPanel() * panels.length;
            wrapper.style.height = `${window.innerHeight + totalScrollNeeded}px`;
        }

        ensureLayout();

        function getCurrentProgress() {
            const rect = wrapper.getBoundingClientRect();
            return Math.min(totalScrollNeeded, Math.max(0, -rect.top));
        }

        function update() {

            const progressPx = getCurrentProgress();
            const perPanel = getScrollPerPanel();

            panels.forEach((panel, i) => {

                const panelStart = i * perPanel;
                const panelEnd = panelStart + perPanel;

                let t = (progressPx - panelStart) / (panelEnd - panelStart);
                t = Math.min(1, Math.max(0, t));

                const yPercent = 100 - (t * 100);
                panel.style.transform = `translateY(${yPercent}%)`;

                const inner = panel.querySelector('.video-panel-inner');
                if (inner) {
                    const scale = 1.15 - (t * 0.15);
                    inner.style.transform = `scale(${scale})`;
                }
            });
        }

        let ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                update();
                ticking = false;
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });

        let resizeTimeout = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                ensureLayout();
                update();
            }, 200);
        });

        update();

        let isAnimating = false;
        let animFrame = null;

        const BOUNDARY_EPS = 1;

        function getNextBoundaryDown(progress, perPanel) {
            const index = Math.floor((progress + BOUNDARY_EPS) / perPanel) + 1;
            return Math.min(totalScrollNeeded, index * perPanel);
        }

        function getNextBoundaryUp(progress, perPanel) {
            const index = Math.ceil((progress - BOUNDARY_EPS) / perPanel) - 1;
            return Math.max(0, index * perPanel);
        }

        function easeInOutCubic(t) {
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function animateScrollBy(deltaProgress, duration = 1100, onDone) {

            if (Math.abs(deltaProgress) < 0.5) {
                isAnimating = false;
                if (onDone) onDone();
                return;
            }

            isAnimating = true;

            const startY = window.scrollY;
            const targetY = startY + deltaProgress;
            const distance = targetY - startY;
            const startTime = performance.now();

            cancelAnimationFrame(animFrame);

            function step(now) {
                const t = Math.min(1, (now - startTime) / duration);
                window.scrollTo(0, startY + distance * easeInOutCubic(t));

                if (t < 1) {
                    animFrame = requestAnimationFrame(step);
                } else {
                    window.scrollTo(0, targetY);
                    isAnimating = false;
                    if (onDone) onDone();
                }
            }

            animFrame = requestAnimationFrame(step);
        }


        // ============================================================
        // AUTO PLAY — yalnız videolar arasında (title-a qayıtmır)
        // Panel k tam görünəndə progress = (k+1) * perPanel
        //   0            → BEHIND THE SCENE yazısı
        //   perPanel     → 1-ci video
        //   2*perPanel   → 2-ci video ...
        // Sonuncudan sonra 1-ci videoya qayıdır (0-a yox!)
        // ============================================================

        const AUTO_PLAY_HOLD = 3000;   // videonun ekranda qalma müddəti (ms)
        let autoPlayTimer = null;

        function stageInRange() {
            const rect = wrapper.getBoundingClientRect();
            return rect.top <= 1 && rect.top >= -totalScrollNeeded - 1;
        }

        function scheduleAutoPlay() {
            clearTimeout(autoPlayTimer);
            autoPlayTimer = setTimeout(autoPlayStep, AUTO_PLAY_HOLD);
        }

        function autoPlayStep() {

            const modal = document.getElementById('previewContainer');

            if (
                document.hidden ||
                isAnimating ||
                !stageInRange() ||
                document.body.classList.contains('menu-is-open') ||
                (modal && modal.classList.contains('active'))
            ) {
                scheduleAutoPlay();
                return;
            }

            const perPanel = getScrollPerPanel();
            const progress = getCurrentProgress();

            // hazırda hansı panel (0 = title, 1..N = videolar)
            const current = Math.round(progress / perPanel);

            const nextIndex = current >= panels.length ? 1 : current + 1;
            const target = nextIndex * perPanel;

            animateScrollBy(target - progress, 1100, scheduleAutoPlay);
        }

        // İstifadəçi əl ilə scroll/swipe edəndə sayğac sıfırlansın
        window.addEventListener('wheel', scheduleAutoPlay, { passive: true });
        stage.addEventListener('touchstart', scheduleAutoPlay, { passive: true });

        scheduleAutoPlay();


        function handleWheel(e) {

            // Menyu açıqdırsa hero scroll etməsin (təkəri menu.js idarə edir)
            if (document.body.classList.contains('menu-is-open')) return;

            const rect = wrapper.getBoundingClientRect();

            const inRange = rect.top <= 1 && rect.top >= -(totalScrollNeeded) - 1;

            if (!inRange) {
                return;
            }

            if (isAnimating) {
                e.preventDefault();
                return;
            }

            if (Math.abs(e.deltaY) < 1) return;

            const perPanel = getScrollPerPanel();
            const progress = getCurrentProgress();

            if (e.deltaY > 0) {

                if (progress >= totalScrollNeeded - BOUNDARY_EPS) {
                    return;
                }

                e.preventDefault();

                const target = getNextBoundaryDown(progress, perPanel);
                animateScrollBy(target - progress);

            } else {

                if (progress <= BOUNDARY_EPS) {
                    return;
                }

                e.preventDefault();

                const target = getNextBoundaryUp(progress, perPanel);
                animateScrollBy(target - progress);
            }
        }

        window.addEventListener('wheel', handleWheel, { passive: false });


        // ============================================================
        // MOBILE TOUCH SNAP
        // Native scrolling disabled while CineStage is active
        // ============================================================

        let touchStartY = 0;
        let touchActive = false;

        stage.addEventListener('touchstart', (e) => {

            if (!e.touches.length) return;

            const rect = wrapper.getBoundingClientRect();

            const inRange =
                rect.top <= 1 &&
                rect.top >= -(totalScrollNeeded) - 1;

            if (!inRange) {
                touchActive = false;
                return;
            }

            touchActive = true;
            touchStartY = e.touches[0].clientY;

        }, { passive: true });


        stage.addEventListener('touchmove', (e) => {

            if (!touchActive) return;

            // Telefonun native scroll-unu tam blokla
            e.preventDefault();

        }, { passive: false });


        stage.addEventListener('touchend', (e) => {

            if (!touchActive) return;

            touchActive = false;

            if (isAnimating) return;
            if (!e.changedTouches.length) return;

            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = touchStartY - touchEndY;

            // Kiçik hərəkətləri ignore et
            if (Math.abs(deltaY) < 40) return;

            const rect = wrapper.getBoundingClientRect();

            const inRange =
                rect.top <= 1 &&
                rect.top >= -(totalScrollNeeded) - 1;

            if (!inRange) return;

            const perPanel = getScrollPerPanel();
            const progress = getCurrentProgress();

            if (deltaY > 0) {

                // SWIPE UP → NEXT PANEL
                if (progress >= totalScrollNeeded - BOUNDARY_EPS) {
                    return;
                }

                const target = getNextBoundaryDown(progress, perPanel);
                animateScrollBy(target - progress);

            } else {

                // SWIPE DOWN → PREVIOUS PANEL
                if (progress <= BOUNDARY_EPS) {
                    return;
                }

                const target = getNextBoundaryUp(progress, perPanel);
                animateScrollBy(target - progress);
            }

        }, { passive: true });

    }


    /* ============================================================
       CUSTOM CURSOR
       ============================================================ */

    function initCursor() {

        const cursor = document.getElementById('cineCursor');

        if (!cursor || window.matchMedia('(hover: none)').matches) {
            return;
        }

        let mx = 0, my = 0, cx = 0, cy = 0;

        document.addEventListener('mousemove', (e) => {
            mx = e.clientX;
            my = e.clientY;
            cursor.classList.add('active');
        });

        (function loop() {
            cx += (mx - cx) * 0.18;
            cy += (my - cy) * 0.18;

            cursor.style.transform =
                `translate(${cx}px, ${cy}px) translate(-50%,-50%) scale(${cursor.classList.contains('active') ? 1 : 0})`;

            requestAnimationFrame(loop);
        })();

        document.querySelectorAll('.film-card').forEach(card => {
            card.addEventListener('mouseenter', () => cursor.classList.add('on-card'));
            card.addEventListener('mouseleave', () => cursor.classList.remove('on-card'));
        });
    }


    /* ============================================================
       FILM STRIP GALLERY
       ============================================================ */

    function buildGallery() {

        const strip = document.getElementById('reelTrack');
        if (!strip) return;

        const clips = window.BTS_CLIPS || [];

        if (!clips.length) {
            return;
        }

        clips.forEach((clip, i) => {

            const card = document.createElement('div');
            card.className = 'film-card';
            card.dataset.category = clip.category;
            card.dataset.index = i;

            card.innerHTML = `
                <div class="perf">${Array(10).fill('<span></span>').join('')}</div>

                <div class="film-frame">
                    <video muted loop playsinline preload="none" data-src="${clip.video}"></video>
                    <div class="frame-tint"></div>
                    <div class="frame-timecode">
                        <span class="rec-dot"></span>
                        CLIP ${String(i + 1).padStart(2, '0')}
                    </div>
                    <div class="frame-play"><i class="fa-solid fa-play"></i></div>
                </div>

                <div class="perf">${Array(10).fill('<span></span>').join('')}</div>

                <div class="film-caption">
                    <h3>${clip.title}</h3>
                    <span>${clip.category.toUpperCase()}</span>
                </div>
            `;

            strip.appendChild(card);

            const vid = card.querySelector('video');

            card.addEventListener('mouseenter', () => {
                if (!vid.src) vid.src = clip.video;
                vid.play().catch(() => {});
            });

            card.addEventListener('mouseleave', () => {
                vid.pause();
            });

            card.addEventListener('click', () => {
                openClip(i);
            });
        });

        observeCards();
    }


    function observeCards() {

        const cards = document.querySelectorAll('.film-card');

        if (!('IntersectionObserver' in window)) {
            cards.forEach(c => c.classList.add('revealed'));
            return;
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('revealed');
                    }, (entry.target.dataset.index % 3) * 100);

                    io.unobserve(entry.target);
                }
            });
        }, { threshold: .15 });

        cards.forEach(c => io.observe(c));
    }


    /* ============================================================
       HORIZONTAL SCROLL — REEL GALLERY
       ============================================================ */

    function initHorizontalScroll() {

        const pin = document.getElementById('reelPin');
        const track = document.getElementById('reelTrack');

        if (!pin || !track || !window.gsap || !window.ScrollTrigger) return;

        gsap.registerPlugin(ScrollTrigger);

        setTimeout(() => {

            const getTrackWidth = () => Math.max(
                0,
                track.scrollWidth - window.innerWidth + (window.innerWidth * 0.1)
            );

            gsap.to(track, {
                x: () => -getTrackWidth(),
                ease: 'none',
                scrollTrigger: {
                    trigger: pin,
                    pin: true,
                    scrub: 1,
                    start: 'center center',
                    end: () => '+=' + getTrackWidth(),
                    invalidateOnRefresh: true
                }
            });

            setTimeout(() => ScrollTrigger.refresh(), 500);

        }, 300);
    }


    /* ============================================================
       TOP PROGRESS BAR
       ============================================================ */

    function initProgressBar() {

        const fill = document.getElementById('reelGateFill');
        if (!fill) return;

        function updateProgress() {
            const scrollTop = window.scrollY;
            const docHeight = document.body.scrollHeight - window.innerHeight;

            if (docHeight <= 0) {
                fill.style.width = '0%';
                return;
            }

            const progress = (scrollTop / docHeight) * 100;
            fill.style.width = Math.min(100, Math.max(0, progress)) + '%';
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }


    /* ============================================================
       FILTERS
       ============================================================ */

    function initFilters() {

        const chips = document.querySelectorAll('.filter-chip');

        chips.forEach(chip => {
            chip.addEventListener('click', () => {

                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const filter = chip.dataset.filter;

                document.querySelectorAll('.film-card').forEach(card => {
                    const match = filter === 'all' || card.dataset.category === filter;
                    card.classList.toggle('is-hidden', !match);
                });

                if (window.ScrollTrigger) {
                    setTimeout(() => ScrollTrigger.refresh(), 100);
                }
            });
        });
    }


    /* ============================================================
       VIDEO MODAL
       ============================================================ */

    const els = {};

    function cacheModalEls() {
        Object.assign(els, {
            previewContainer: document.getElementById('previewContainer'),
            previewVideo: document.getElementById('previewVideo'),
            previewTitle: document.getElementById('previewTitle'),
            previewTag: document.getElementById('previewTag'),
            closePreview: document.getElementById('closePreview'),
            modalBtn: document.getElementById('modalPlayBtnContainer'),
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
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            videoLoading: document.querySelector('.video-loading')
        });
    }

    function formatTime(s) {
        if (isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    }

    function openClip(index) {

        const clips = window.BTS_CLIPS || [];
        const clip = clips[index];
        if (!clip || !els.previewContainer) return;

        if (els.videoLoading) els.videoLoading.style.display = 'block';

        els.previewVideo.src = clip.video;
        els.previewTitle.textContent = clip.title;
        if (els.previewTag) {
            els.previewTag.textContent =
                `CLIP ${String(index + 1).padStart(2, '0')} / ${String(clips.length).padStart(2, '0')}`;
        }

        els.previewContainer.classList.remove('is-paused');
        els.previewContainer.classList.add('active');

        document.body.style.overflow = 'hidden';

        const p = els.previewVideo.play();

        if (p) {
            p.then(() => {
                if (els.videoLoading) els.videoLoading.style.display = 'none';
            }).catch(() => {
                if (els.videoLoading) els.videoLoading.style.display = 'none';
            });
        }
    }

    function closeClip() {

        els.previewContainer.classList.remove('active');
        els.previewContainer.classList.add('is-paused');

        setTimeout(() => {
            els.previewVideo.pause();
            els.previewVideo.currentTime = 0;
            els.previewVideo.src = '';
        }, 400);

        document.body.style.overflow = '';
    }

    function togglePlay() {
        if (!els.previewVideo) return;

        if (els.previewVideo.paused) {
            els.previewVideo.play().catch(() => {});
        } else {
            els.previewVideo.pause();
        }
    }

    function updatePlayUI() {

        if (!els.previewVideo || !els.previewContainer) return;

        const paused = els.previewVideo.paused;

        if (els.playIcon) els.playIcon.style.display = paused ? 'block' : 'none';
        if (els.pauseIcon) els.pauseIcon.style.display = paused ? 'none' : 'block';

        els.previewContainer.classList.toggle('is-paused', paused);

        if (els.modalBtn) {
            els.modalBtn.classList.toggle('is-paused', paused);
            els.modalBtn.classList.toggle('is-playing', !paused);
        }
    }

    function initModal() {

        cacheModalEls();
        if (!els.previewContainer) return;

        if (els.closePreview) els.closePreview.onclick = closeClip;
        if (els.previewVideo) els.previewVideo.onclick = togglePlay;
        if (els.playPauseBtn) els.playPauseBtn.onclick = togglePlay;

        if (els.modalBtn) {
            els.modalBtn.onclick = (e) => {
                e.stopPropagation();
                togglePlay();
            };
        }

        els.previewVideo?.addEventListener('play', updatePlayUI);
        els.previewVideo?.addEventListener('pause', updatePlayUI);

        els.previewVideo?.addEventListener('timeupdate', () => {
            if (!els.previewVideo) return;

            const pct = (els.previewVideo.currentTime / els.previewVideo.duration) * 100 || 0;

            if (els.progressPlayed) els.progressPlayed.style.width = pct + '%';
            if (els.progressSlider) els.progressSlider.value = pct;
            if (els.currentTimeEl) els.currentTimeEl.textContent = formatTime(els.previewVideo.currentTime);
        });

        els.previewVideo?.addEventListener('loadedmetadata', () => {
            if (els.durationTimeEl) {
                els.durationTimeEl.textContent = formatTime(els.previewVideo.duration);
            }
        });

        if (els.rewindBtn) {
            els.rewindBtn.onclick = (e) => {
                e.stopPropagation();
                els.previewVideo.currentTime -= 5;
            };
        }

        if (els.forwardBtn) {
            els.forwardBtn.onclick = (e) => {
                e.stopPropagation();
                els.previewVideo.currentTime += 5;
            };
        }

        if (els.progressSlider) {
            els.progressSlider.oninput = function (e) {
                e.stopPropagation();
                if (els.previewVideo.duration) {
                    els.previewVideo.currentTime = (this.value / 100) * els.previewVideo.duration;
                }
            };
        }

        if (els.volumeSlider) {
            els.volumeSlider.oninput = function (e) {
                e.stopPropagation();
                els.previewVideo.volume = this.value / 100;
            };
        }

        if (els.fullscreenBtn) {
            els.fullscreenBtn.onclick = (e) => {
                e.stopPropagation();
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    els.previewVideo.requestFullscreen?.();
                }
            };
        }

        document.addEventListener('keydown', (e) => {

            if (!els.previewContainer || !els.previewContainer.classList.contains('active')) {
                return;
            }

            if (e.key === ' ') {
                e.preventDefault();
                togglePlay();
            }

            if (e.key === 'Escape') {
                closeClip();
            }

            if (e.key === 'ArrowLeft') {
                els.previewVideo.currentTime -= 5;
            }

            if (e.key === 'ArrowRight') {
                els.previewVideo.currentTime += 5;
            }
        });
    }


    /* ============================================================
       SAFE RUN
       ============================================================ */

    function safeRun(fn) {
        try {
            fn();
        } catch (err) {
            console.error('[CineChord]', fn.name, err);
        }
    }


    /* ============================================================
       INIT
       ============================================================
       init() ASYNC-dir: əvvəlcə backend-dən item-lər yüklənir,
       hero panelləri və window.BTS_CLIPS qurulur, YALNIZ ONDAN SONRA
       digər modullar işə düşür.
       ============================================================ */

    // Fetch skript yüklənən kimi başlayır (DOMContentLoaded-i gözləmir)
    const itemsPromise = fetchBackstageItems();

    async function init() {

        // Dil seçimi backend-dən asılı deyil, dərhal qurulur
        safeRun(initLanguageSelector);

        const items = await itemsPromise;

        buildStagePanels(items);
        buildClipsFromItems(items);

        safeRun(buildGallery);
        safeRun(initFilters);
        safeRun(initModal);
        safeRun(initCursor);
        safeRun(initHorizontalScroll);
        safeRun(initProgressBar);
        safeRun(initCineStage);

        // Açılış animasiyası əvvəlki kimi, hər şey hazır olandan sonra başlayır
        runCountdown();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }


    /* ============================================================
       BACKSTAGE: video modal (home ilə eyni davranış)
       ============================================================ */
    (function () {
        'use strict';

        const INACTIVITY_DELAY = 3000;

        function initBackstageModal() {
            const oldBox = document.getElementById('previewContainer');
            if (!oldBox) return;

            // Köhnə modal kodunun listener-ləri təkrarlanmasın deyə modalı klonlayırıq
            const box = oldBox.cloneNode(true);
            oldBox.parentNode.replaceChild(box, oldBox);

            const $ = (id) => box.querySelector('#' + id);
            const video      = $('previewVideo');
            const titleEl    = $('previewTitle');
            const loading    = box.querySelector('.video-loading');
            const modalBtn   = $('modalPlayBtnContainer');
            const playBtn    = $('playPauseBtn');
            const playIcon   = $('playIcon');
            const pauseIcon  = $('pauseIcon');
            const rewindBtn  = $('rewindBtn');
            const forwardBtn = $('forwardBtn');
            const slider     = $('progressSlider');
            const played     = $('progressPlayed');
            const curTime    = $('currentTime');
            const durTime    = $('durationTime');
            const volume     = $('volumeSlider');
            const fsBtn      = $('fullscreenBtn');
            const closeBtn   = $('closePreview');

            let activityTimer = null;

            const fmt = (s) => {
                if (isNaN(s)) return '0:00';
                const m = Math.floor(s / 60);
                const sec = Math.floor(s % 60);
                return m + ':' + (sec < 10 ? '0' : '') + sec;
            };

            function activity() {
                box.classList.remove('user-inactive');
                clearTimeout(activityTimer);
                if (!video.paused) {
                    activityTimer = setTimeout(() => box.classList.add('user-inactive'), INACTIVITY_DELAY);
                }
            }

            function syncUI() {
                const paused = video.paused;
                playIcon.style.display  = paused ? 'block' : 'none';
                pauseIcon.style.display = paused ? 'none' : 'block';
                box.classList.toggle('is-paused', paused);
                modalBtn.classList.toggle('is-paused', paused);
                modalBtn.classList.toggle('is-playing', !paused);

                if (paused) {
                    box.classList.remove('user-inactive');
                    clearTimeout(activityTimer);
                } else {
                    activity();
                }
            }

            function toggle(e) {
                if (e) e.stopPropagation();
                if (video.paused) {
                    const p = video.play();
                    if (p && p.catch) p.catch(() => {});
                } else {
                    video.pause();
                }
            }

            function openModal(src, name) {
                if (!src) return;
                loading.style.display = 'block';
                video.src = src;
                titleEl.textContent = name || '';
                box.classList.add('active');
                document.body.style.overflow = 'hidden';

                const p = video.play();
                if (p && p.catch) p.catch(() => { loading.style.display = 'none'; });
            }

            function closeModal() {
                box.classList.remove('active', 'user-inactive');
                box.classList.add('is-paused');
                clearTimeout(activityTimer);
                if (document.fullscreenElement) document.exitFullscreen();

                setTimeout(() => {
                    video.pause();
                    video.currentTime = 0;
                    video.removeAttribute('src');
                    video.load();
                    document.body.style.overflow = '';
                }, 500);
            }

            /* --- Video hadisələri --- */
            video.addEventListener('play', syncUI);
            video.addEventListener('pause', syncUI);
            video.addEventListener('playing', () => { loading.style.display = 'none'; });
            video.addEventListener('waiting', () => { loading.style.display = 'block'; });
            video.addEventListener('loadeddata', () => { loading.style.display = 'none'; });
            video.addEventListener('loadedmetadata', () => { durTime.textContent = fmt(video.duration); });
            video.addEventListener('timeupdate', () => {
                const percent = video.duration ? (video.currentTime / video.duration) * 100 : 0;
                played.style.width = percent + '%';
                slider.value = percent;
                curTime.textContent = fmt(video.currentTime);
            });

            /* --- Düymələr --- */
            video.addEventListener('click', toggle);
            playBtn.addEventListener('click', toggle);
            rewindBtn.addEventListener('click', (e) => { e.stopPropagation(); video.currentTime -= 5; });
            forwardBtn.addEventListener('click', (e) => { e.stopPropagation(); video.currentTime += 5; });
            closeBtn.addEventListener('click', closeModal);

            slider.addEventListener('input', function (e) {
                e.stopPropagation();
                if (video.duration) video.currentTime = (this.value / 100) * video.duration;
            });

            volume.addEventListener('input', function (e) {
                e.stopPropagation();
                video.volume = this.value / 100;
            });

            fsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (document.fullscreenElement) document.exitFullscreen();
                else if (video.requestFullscreen) video.requestFullscreen();
            });

            /* --- 3 saniyə toxunulmasa panel gizlənir --- */
            box.addEventListener('mousemove', activity);
            box.addEventListener('click', activity);
            box.addEventListener('touchstart', activity, { passive: true });

            /* --- Klaviatura --- */
            document.addEventListener('keydown', (e) => {
                if (!box.classList.contains('active')) return;
                if (e.key === 'Escape') closeModal();
                if (e.key === ' ') { e.preventDefault(); toggle(); }
                if (e.key === 'ArrowLeft') video.currentTime -= 5;
                if (e.key === 'ArrowRight') video.currentTime += 5;
            });

            /* --- play yazısına klik → modal açılır --- */
            document.addEventListener('click', (e) => {
                const link = e.target.closest('.poster-play[data-video]');
                if (!link) return;
                e.preventDefault();
                openModal(link.dataset.video, link.dataset.title);
            });

            syncUI();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initBackstageModal);
        } else {
            initBackstageModal();
        }
    })();

})();