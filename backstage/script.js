/* ================================================================
   CineChord — BEHIND THE SCENES / "REEL ARCHIVE"
   ================================================================ */

// ---- EDIT THIS: your backstage clips ----
window.BTS_CLIPS = [
    {
        title: 'ABB Tam Gənc — Set',
        category: 'abb',
        video: '../videos/ABB-TamGenc-Card.mp4',
        poster: ''
    },
    {
        title: 'Bakcell 099 — Kulis',
        category: 'bakcell',
        video: '../videos/Bakcell-099.mp4',
        poster: ''
    },
    {
        title: 'Yaz Fürsəti — Çəkiliş',
        category: 'bakcell',
        video: '../videos/Yaz-furseti-kampaniyasi.mp4',
        poster: ''
    },
    {
        title: 'Yeni Dövr — Proses',
        category: 'abb',
        video: '../videos/Yeni-dovr.mp4',
        poster: ''
    },
    {
        title: 'Showreel — Raw Cuts',
        category: 'showreel',
        video: 'https://res.cloudinary.com/dwybvusv6/video/upload/f_auto,q_auto,vc_auto/CineChord_Showreel_1_1_o3bvnx',
        poster: ''
    }
];

(function () {
    'use strict';

    /* ---------------- COUNTDOWN INTRO ---------------- */
    function runCountdown() {
        const screen = document.getElementById('countdownScreen');
        const numEl = document.getElementById('countdownNumber');
        const ring = document.getElementById('countdownRingFill');
        if (!screen || !numEl || !ring) return finishCountdown();

        const seen = sessionStorage.getItem('btsIntroShown');
        if (seen) { screen.style.display = 'none'; return finishCountdown(true); }
        sessionStorage.setItem('btsIntroShown', 'true');

        let count = 5;
        numEl.textContent = count;
        const circumference = 339;

        function tick() {
            ring.style.strokeDashoffset = 0;
            requestAnimationFrame(() => { ring.style.transition = 'none'; ring.style.strokeDashoffset = circumference; requestAnimationFrame(() => { ring.style.transition = 'stroke-dashoffset .9s linear'; ring.style.strokeDashoffset = 0; }); });

            setTimeout(() => {
                count--;
                if (count > 0) {
                    numEl.textContent = count;
                    tick();
                } else {
                    screen.classList.add('done');
                    setTimeout(() => { screen.style.display = 'none'; finishCountdown(); }, 950);
                }
            }, 950);
        }
        tick();
    }

    function finishCountdown(skip) {
        document.querySelector('.page-transition')?.classList.add('page-loaded');
        revealHero();
        if (window.gsap) {
            gsap.to(['.logo-img', '.hamburger'], { opacity: 1, duration: .8, ease: 'power2.out', delay: skip ? 0 : .1 });
        } else {
            document.querySelector('.logo-img').style.opacity = 1;
            document.querySelector('.hamburger').style.opacity = 1;
        }
    }

    function revealHero() {
        const title = document.getElementById('btsTitle');
        title?.classList.add('revealed');
        const targets = ['.bts-eyebrow', '.bts-subtitle', '.scroll-cue'];
        if (window.gsap) {
            gsap.to(targets, { opacity: 1, y: 0, duration: .9, ease: 'power2.out', stagger: .12, delay: .25 });
        } else {
            targets.forEach(sel => { const el = document.querySelector(sel); if (el) { el.style.opacity = 1; el.style.transform = 'none'; } });
        }
    }

    /* ---------------- CUSTOM CURSOR ---------------- */
    function initCursor() {
        const cursor = document.getElementById('cineCursor');
        if (!cursor || window.matchMedia('(hover: none)').matches) return;

        let mx = 0, my = 0, cx = 0, cy = 0;
        document.addEventListener('mousemove', (e) => {
            mx = e.clientX; my = e.clientY;
            cursor.classList.add('active');
        });
        (function loop() {
            cx += (mx - cx) * 0.18;
            cy += (my - cy) * 0.18;
            cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%) scale(${cursor.classList.contains('active') ? 1 : 0})`;
            requestAnimationFrame(loop);
        })();

        document.querySelectorAll('.film-card').forEach(card => {
            card.addEventListener('mouseenter', () => cursor.classList.add('on-card'));
            card.addEventListener('mouseleave', () => cursor.classList.remove('on-card'));
        });
    }

    /* ---------------- FILM STRIP GALLERY ---------------- */
    function buildGallery() {
        const strip = document.getElementById('filmstrip');
        if (!strip) return;

        window.BTS_CLIPS.forEach((clip, i) => {
            const card = document.createElement('div');
            card.className = 'film-card';
            card.dataset.category = clip.category;
            card.dataset.index = i;

            card.innerHTML = `
                <div class="perf">${Array(10).fill('<span></span>').join('')}</div>
                <div class="film-frame">
                    <video muted loop playsinline preload="none" data-src="${clip.video}"></video>
                    <div class="frame-tint"></div>
                    <div class="frame-timecode"><span class="rec-dot"></span> CLIP ${String(i + 1).padStart(2, '0')}</div>
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
            card.addEventListener('mouseleave', () => vid.pause());

            card.addEventListener('click', () => openClip(i));
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
                    setTimeout(() => entry.target.classList.add('revealed'), (entry.target.dataset.index % 3) * 100);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: .15 });
        cards.forEach(c => io.observe(c));
    }

    /* ---------------- FILTERS ---------------- */
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
            });
        });
    }

    /* ---------------- VIDEO MODAL ---------------- */
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
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    }

    function openClip(index) {
        const clip = window.BTS_CLIPS[index];
        if (!clip || !els.previewContainer) return;

        els.videoLoading.style.display = 'block';
        els.previewVideo.src = clip.video;
        els.previewTitle.textContent = clip.title;
        els.previewTag.textContent = `CLIP ${String(index + 1).padStart(2, '0')} / ${String(window.BTS_CLIPS.length).padStart(2, '0')}`;

        els.previewContainer.classList.remove('is-paused');
        els.previewContainer.classList.add('active');
        document.body.style.overflow = 'hidden';

        const p = els.previewVideo.play();
        if (p) p.then(() => els.videoLoading.style.display = 'none').catch(() => els.videoLoading.style.display = 'none');
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
        els.previewVideo.paused ? els.previewVideo.play() : els.previewVideo.pause();
    }

    function updatePlayUI() {
        const paused = els.previewVideo.paused;
        els.playIcon.style.display = paused ? 'block' : 'none';
        els.pauseIcon.style.display = paused ? 'none' : 'block';
        els.previewContainer.classList.toggle('is-paused', paused);
        els.modalBtn.classList.toggle('is-paused', paused);
        els.modalBtn.classList.toggle('is-playing', !paused);
    }

    function initModal() {
        cacheModalEls();
        if (!els.previewContainer) return;

        els.closePreview.onclick = closeClip;
        els.previewVideo.onclick = togglePlay;
        els.playPauseBtn.onclick = togglePlay;
        els.modalBtn.onclick = (e) => { e.stopPropagation(); togglePlay(); };

        els.previewVideo.addEventListener('play', updatePlayUI);
        els.previewVideo.addEventListener('pause', updatePlayUI);

        els.previewVideo.addEventListener('timeupdate', () => {
            const pct = (els.previewVideo.currentTime / els.previewVideo.duration) * 100 || 0;
            els.progressPlayed.style.width = pct + '%';
            els.progressSlider.value = pct;
            els.currentTimeEl.textContent = formatTime(els.previewVideo.currentTime);
        });
        els.previewVideo.addEventListener('loadedmetadata', () => {
            els.durationTimeEl.textContent = formatTime(els.previewVideo.duration);
        });

        els.rewindBtn.onclick = (e) => { e.stopPropagation(); els.previewVideo.currentTime -= 5; };
        els.forwardBtn.onclick = (e) => { e.stopPropagation(); els.previewVideo.currentTime += 5; };
        els.progressSlider.oninput = function (e) { e.stopPropagation(); els.previewVideo.currentTime = (this.value / 100) * els.previewVideo.duration; };
        els.volumeSlider.oninput = function (e) { e.stopPropagation(); els.previewVideo.volume = this.value / 100; };
        els.fullscreenBtn.onclick = (e) => {
            e.stopPropagation();
            document.fullscreenElement ? document.exitFullscreen() : els.previewVideo.requestFullscreen?.();
        };

        document.addEventListener('keydown', (e) => {
            if (!els.previewContainer.classList.contains('active')) return;
            if (e.key === ' ') { e.preventDefault(); togglePlay(); }
            if (e.key === 'Escape') closeClip();
            if (e.key === 'ArrowLeft') els.previewVideo.currentTime -= 5;
            if (e.key === 'ArrowRight') els.previewVideo.currentTime += 5;
        });
    }

    /* ---------------- MOBILE MENU ---------------- */
    function initMenu() {
        const hamburger = document.getElementById('hamburgerBtn');
        const menu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('mobileMenuOverlay');
        if (!hamburger || !menu) return;

        function toggle() {
            hamburger.classList.toggle('active');
            menu.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
        }
        hamburger.addEventListener('click', toggle);
        overlay.addEventListener('click', toggle);
    }

    /* ---------------- INIT ---------------- */
    function init() {
        buildGallery();
        initFilters();
        initModal();
        initMenu();
        initCursor();
        runCountdown();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();