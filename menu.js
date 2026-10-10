/* ================================================================
   CineChord Index - ORTAQ TAM EKRAN MENYU (menu.js)
   Version: 1.3
   Dəyişikliklər (1.2):
   - menyu açılanda CARİ səhifə (is-current) mərkəzdə oturur
   - ÇARX: sonsuz dövr edən silindr formalı scroll, fokus həmişə mərkəzdə
   - wheel-də kənarlarda yüngül rezin effekti
   - Müstəqildir: səhifənin öz JS-indən heç nə tələb etmir

   QURULUM (hər səhifədə):
     <link rel="stylesheet" href="../menu.css">     <!-- səhifənin CSS-indən SONRA -->
     <script src="../menu.js"></script>             <!-- səhifənin JS-indən ƏVVƏL -->
   menu.js və menu.css saytın KÖK qovluğunda (index.html ilə yanaşı) durmalıdır.
   ================================================================ */

(function () {
    'use strict';

    if (window.__cinechordMenuLoaded) return;
    window.__cinechordMenuLoaded = true;

    /* ---------- kök yol: menu.js-in yerləşdiyi qovluqdan ---------- */
    const SCRIPT = document.currentScript || document.querySelector('script[src*="menu.js"]');
    const ROOT = (function () {
        try { return new URL('./', SCRIPT.src).pathname; } catch (e) { return '/'; }
    })();

    const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const NAVIGATION_DELAY = 600;

    const NAV_ITEMS = [
        { key: 'home',      path: '' },
        { key: 'work',      path: 'works/' },
        { key: 'service',   path: 'services/' },
        { key: 'archive',   path: 'archive/' },
        { key: 'backstage', path: 'backstage/' },
        { key: 'about',     path: 'about/' },
        { key: 'contact',   path: 'contact/' }
    ].map(it => ({ ...it, href: ROOT + it.path }));

    const TEXT = {
        en: {
            menu: 'MENU', close: 'CLOSE',
            home: 'HOME', work: 'WORK', service: 'SERVICE', archive: 'ARCHIVE',
            backstage: 'BACKSTAGE', about: 'ABOUT', contact: 'CONTACT'
        },
        az: {
            menu: 'MENYU', close: 'BAĞLA',
            home: 'ANA SƏHİFƏ', work: 'İŞLƏR', service: 'XİDMƏTLƏR', archive: 'ARXİV',
            backstage: 'KULİS', about: 'HAQQIMIZDA', contact: 'ƏLAQƏ'
        }
    };

    function getLang() {
        let l = null;
        try { l = localStorage.getItem('selectedLang'); } catch (e) { /* ignore */ }
        l = l || window.currentLang || 'en';
        return TEXT[l] ? l : 'en';
    }

    /* ---------- səhifə keçidi (page-transition ilə) ---------- */
    function navigate(href) {
        if (!href) return;
        if (/^(mailto|tel):/.test(href)) { window.location.href = href; return; }
        const pt = document.querySelector('.page-transition');
        if (pt) pt.classList.remove('page-loaded');
        document.querySelectorAll('video').forEach(v => v.pause());
        setTimeout(() => { window.location.href = href; }, NAVIGATION_DELAY);
    }

    // "Geri" düyməsi ilə qayıdanda qara pərdə ekranda qalmasın
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            const pt = document.querySelector('.page-transition');
            if (pt) pt.classList.add('page-loaded');
        }
    });

    /* ---------- standart sosial / əlaqə (səhifədə yoxdursa) ---------- */
    function buildSocials() {
        const d = document.createElement('div');
        d.className = 'menu-socials';
        d.innerHTML =
            '<a href="https://www.instagram.com/cine.chord/?hl=en" target="_blank" rel="noopener noreferrer">Instagram</a>' +
            '<a href="https://www.youtube.com/@cinechordpro" target="_blank" rel="noopener noreferrer">Youtube</a>' +
            '<a href="#">Vimeo</a>';
        return d;
    }

    function buildContact() {
        const d = document.createElement('div');
        d.className = 'menu-contact-info';
        d.innerHTML =
            '<p><a href="mailto:info@cinechord.az">info@cinechord.az</a></p>' +
            '<p><a href="tel:+994502330454">+994 50 233 04 54</a></p>';
        return d;
    }

    function init() {
        const hamburger = document.getElementById('hamburgerBtn');
        if (!hamburger) {
            console.warn('[CineChord menu] #hamburgerBtn tapılmadı');
            return;
        }

        let mobileMenu = document.getElementById('mobileMenu');
        if (!mobileMenu) {
            mobileMenu = document.createElement('nav');
            mobileMenu.id = 'mobileMenu';
            mobileMenu.className = 'mobile-menu';
            document.body.appendChild(mobileMenu);
        }

        let overlay = document.getElementById('mobileMenuOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mobileMenuOverlay';
            overlay.className = 'mobile-menu-overlay';
            document.body.insertBefore(overlay, mobileMenu);
        }

        const hamburgerText = hamburger.querySelector('.hamburger-text');

        const socials = mobileMenu.querySelector('.menu-socials') || buildSocials();
        const contact = mobileMenu.querySelector('.menu-contact-info') || buildContact();
        const logoEl = document.querySelector('.center-logo .logo-img');
        const logoSrc = logoEl ? logoEl.getAttribute('src') : '';

        /* ---------- cari səhifə ---------- */
        function normPath(p) {
            p = p.replace(/index\.html$/, '');
            if (!p.endsWith('/')) p += '/';
            return p;
        }
        const here = normPath(window.location.pathname);
        const rootNorm = normPath(ROOT);
        function isCurrentHref(href) {
            const h = normPath(href);
            return h === rootNorm ? here === h : here.startsWith(h);
        }

        /* ---------- DOM ---------- */
        const L0 = TEXT[getLang()];
        const links = NAV_ITEMS.map((it, i) => {
            const cur = isCurrentHref(it.href);
            const label = L0[it.key];
            return `<a class="fm-link${cur ? ' is-current' : ''}" href="${it.href}" data-key="${it.key}" draggable="false" ` +
                   `style="--i:${i}"${cur ? ' aria-current="page"' : ''}>` +
                   `<span class="fm-mask"><span class="fm-text" data-text="${label}">${label}</span></span></a>`;
        }).join('');

        const total = String(NAV_ITEMS.length).padStart(2, '0');

        const fm = document.createElement('div');
        fm.className = 'fm';
        fm.innerHTML =
            `<div class="fm-left">${logoSrc ? `<img class="fm-logo" src="${logoSrc}" alt="">` : ''}</div>` +
            `<div class="fm-main">` +
                `<div class="fm-count" aria-hidden="true">` +
                    `<span class="fm-count-cur">01</span><i class="fm-count-line"></i><span>${total}</span>` +
                `</div>` +
                `<nav class="fm-list" aria-label="Menu"><div class="fm-track">${links}</div></nav>` +
                `<div class="fm-bottom">` +
                    `<div class="fm-row fm-row-top">` +
                        `<div class="fm-contact"></div>` +
                        `<div class="fm-lang" role="group" aria-label="Language">` +
                            `<button type="button" data-lang="en">EN</button><span>/</span>` +
                            `<button type="button" data-lang="az">AZ</button>` +
                        `</div>` +
                    `</div>` +
                    `<div class="fm-rule"></div>` +
                    `<div class="fm-row fm-row-bottom">` +
                        `<div class="fm-socials"></div>` +
                        `<div class="fm-clock"><span>Baku --:--:--</span></div>` +
                    `</div>` +
                `</div>` +
            `</div>`;

        fm.querySelector('.fm-contact').appendChild(contact);
        fm.querySelector('.fm-socials').appendChild(socials);
        mobileMenu.replaceChildren(fm);

        mobileMenu.setAttribute('role', 'dialog');
        mobileMenu.setAttribute('aria-modal', 'true');
        mobileMenu.setAttribute('aria-label', 'Menu');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-controls', 'mobileMenu');
        hamburger.setAttribute('aria-label', 'Menu');

        // Sosial linklər lang="en" olmalıdır, yoxsa AZ-da I hərfi "ı" olur
        mobileMenu.querySelectorAll('.menu-socials a, .menu-contact-info a').forEach(a => a.setAttribute('lang', 'en'));

        /* ---------- MENU <-> CLOSE yazısı ---------- */
        function setHamburgerText(text, isClose) {
            if (!hamburgerText) return;
            if (REDUCE_MOTION) {
                hamburgerText.textContent = text;
                hamburgerText.classList.toggle('is-close', !!isClose);
                return;
            }
            hamburgerText.classList.remove('roll');
            void hamburgerText.offsetWidth;
            hamburgerText.classList.add('roll');
            setTimeout(() => {
                hamburgerText.textContent = text;
                hamburgerText.classList.toggle('is-close', !!isClose);
            }, 240);
            hamburgerText.addEventListener('animationend', () => {
                hamburgerText.classList.remove('roll');
            }, { once: true });
        }

        function setInert(on) {
            Array.from(document.body.children).forEach(el => {
                if (el === mobileMenu || el === overlay || el === hamburger) return;
                if (el.contains(hamburger)) return;
                const tag = el.tagName;
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK') return;
                if (el.classList.contains('page-transition') ||
                    el.classList.contains('grain-overlay') ||
                    el.classList.contains('lang-selector')) return;
                el.inert = on;
            });
        }

        const isOpen = () => hamburger.classList.contains('active');

        /* ---------- AÇ / BAĞLA ---------- */
        function setOpen(willOpen) {
            if (willOpen === isOpen()) return;

            const langSelector = document.getElementById('langSelector');
            if (langSelector) langSelector.classList.remove('active');

            // scrollbar yoxa çıxanda layout sıçramasın
            if (willOpen) {
                const sbw = window.innerWidth - document.documentElement.clientWidth;
                if (sbw > 0) {
                    document.body.style.paddingRight = sbw + 'px';
                    const pr = parseFloat(getComputedStyle(hamburger).paddingRight) || 0;
                    hamburger.style.paddingRight = (pr + sbw) + 'px';
                }
            } else {
                document.body.style.paddingRight = '';
                hamburger.style.paddingRight = '';
            }

            hamburger.classList.toggle('active', willOpen);
            mobileMenu.classList.toggle('active', willOpen);
            overlay.classList.toggle('active', willOpen);
            document.body.classList.toggle('menu-is-open', willOpen);
            hamburger.setAttribute('aria-expanded', String(willOpen));
            document.body.style.overflow = willOpen ? 'hidden' : '';

            setInert(willOpen);

            const L = TEXT[getLang()];
            setHamburgerText(willOpen ? L.close : L.menu, willOpen);

            onMenuState(willOpen);

            if (!willOpen && mobileMenu.contains(document.activeElement)) {
                hamburger.focus({ preventScroll: true });
            }

            document.dispatchEvent(new CustomEvent('menu:toggle', { detail: { open: willOpen } }));
        }

        // capture + stopImmediatePropagation: səhifənin köhnə menyu kodu qalıbsa belə cüt-toggle olmasın
        hamburger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            setOpen(!isOpen());
        }, true);

        overlay.addEventListener('click', (e) => {
            e.stopImmediatePropagation();
            setOpen(false);
        }, true);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) setOpen(false);
        });

        /* ---------- ÇARX (sonsuz, silindr formasında) ---------- */
        const list = fm.querySelector('.fm-list');
        const track = fm.querySelector('.fm-track');
        const countCur = fm.querySelector('.fm-count-cur');
        const items = Array.from(track.children);
        const N = items.length;

        const EASE = 8;            // kiçik = daha yumşaq süzülmə
        const WHEEL_GAIN = 0.85;   // 1 təkər kliki ≈ 1 bənd
        const SNAP_DELAY = 140;    // təkər dayanandan sonra mərkəzə oturma (ms)
        const STEP = 0.36;         // bəndlər arası bucaq (radian): böyük = çarx daha əyri
        const MAX_TILT = 1.45;     // maksimal bucaq (radian)
        const TILT_VIEW = 0.6;     // bəndin yazı əyilməsi (1 = tam silindr)
        const CLICK_SETTLE = 260;  // klikdən sonra mərkəzə oturma müddəti (ms)
        const CLOSE_DELAY = 150;   // menyu bağlandıqdan sonra keçid gecikməsi (ms)

        let rowH = 0, H = 0;
        let pos = 0, target = 0;   // məhdudiyyətsiz: çarx dövr edir
        let focusIdx = -1;
        let raf = 0, last = 0, snapTimer = 0;
        let dragging = false, moved = false;

        const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
        const mod = (i) => ((i % N) + N) % N;
        // d-ni [-N/2, N/2] aralığına gətirir (çarxda ən qısa məsafə)
        const wrapD = (d) => d - N * Math.round(d / N);

        function render() {
            if (!rowH) return;

            const R = rowH / STEP;     // silindrin radiusu
            const half = N / 2;

            // fokus həmişə siyahının tam ortasındadır
            track.style.setProperty('--fy', ((H - rowH) / 2).toFixed(1) + 'px');

            for (let i = 0; i < N; i++) {
                const d = wrapD(i - pos);
                const ad = Math.abs(d);
                const th = clamp(d * STEP, -MAX_TILT, MAX_TILT);

                const a = clamp((ad - 1) / 2.2, 0, 1);            // uzaqlıq: solma, blur, kiçilmə
                const edge = clamp((half - ad) / 1.2, 0, 1);      // çarxın arxasına keçəndə görünməz olur
                const o = (1 - a * 0.7) * edge;

                const el = items[i];
                el.style.setProperty('--y', (R * Math.sin(th)).toFixed(1) + 'px');
                el.style.setProperty('--rx', (-th * 180 / Math.PI * TILT_VIEW).toFixed(1) + 'deg');
                el.style.setProperty('--sc', (1 - a * 0.3).toFixed(3));
                el.style.setProperty('--a', a.toFixed(3));
                el.style.setProperty('--o', o.toFixed(3));
                el.style.pointerEvents = o < 0.05 ? 'none' : '';
            }

            const best = mod(Math.round(pos));
            if (best !== focusIdx) {
                if (focusIdx >= 0) items[focusIdx].classList.remove('is-focus');
                items[best].classList.add('is-focus');
                focusIdx = best;
                if (countCur) countCur.textContent = String(best + 1).padStart(2, '0');
            }
        }

        function measure() {
            rowH = items[0].offsetHeight;
            H = list.clientHeight;
            render();
        }

        function tick(now) {
            const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
            last = now;
            const diff = target - pos;
            if (Math.abs(diff) < 0.001) {
                pos = target;
                render();
                raf = 0;
                return;
            }
            pos += diff * (1 - Math.exp(-dt * EASE));
            render();
            raf = requestAnimationFrame(tick);
        }

        function run() {
            if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
        }

        function moveTo(v, instant) {
            target = v;
            if (instant || REDUCE_MOTION) { pos = target; render(); }
            else run();
        }

        // idx bəndinə ən qısa yolla getmək üçün hədəf (çarxda irəli və ya geri)
        function nearest(idx, from) {
            return from + wrapD(idx - mod(from));
        }

        function snapSoon() {
            clearTimeout(snapTimer);
            snapTimer = setTimeout(() => moveTo(Math.round(target)), SNAP_DELAY);
        }

        function go(a) {
            const href = a.getAttribute('href');
            if (a.classList.contains('is-current')) { setOpen(false); return; }
            setOpen(false);
            setTimeout(() => navigate(href), CLOSE_DELAY);
        }

        /* təkər / touchpad: menyu açıqdırsa ekranın HƏR YERİNDƏ işləyir */
        document.addEventListener('wheel', (e) => {
            if (!isOpen()) return;
            e.preventDefault();
            let dy = e.deltaY;
            if (e.deltaMode === 1) dy *= 32;
            else if (e.deltaMode === 2) dy *= H;
            dy = clamp(dy, -140, 140);
            target += (dy / rowH) * WHEEL_GAIN;
            if (REDUCE_MOTION) { pos = target; render(); } else run();
            snapSoon();
        }, { passive: false });

        // mobil: arxadakı səhifə sürüşməsin
        document.addEventListener('touchmove', (e) => {
            if (isOpen()) e.preventDefault();
        }, { passive: false });

        /* toxunma / siçanla sürüşdürmə */
        let sy = 0, sp = 0, lastY = 0, lastT = 0, vel = 0;

        list.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            dragging = true; moved = false;
            sy = lastY = e.clientY; sp = pos; lastT = e.timeStamp; vel = 0;
            clearTimeout(snapTimer);
        });

        window.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dy = e.clientY - sy;
            if (!moved && Math.abs(dy) > 6) moved = true;
            if (!moved) return;
            const dt = e.timeStamp - lastT;
            if (dt > 0) vel = vel * 0.6 + ((e.clientY - lastY) / dt) * 0.4;
            lastY = e.clientY; lastT = e.timeStamp;
            target = pos = sp - dy / rowH;
            render();
        });

        function endDrag() {
            if (!dragging) return;
            dragging = false;
            if (moved) moveTo(Math.round(pos - clamp((vel * 320) / rowH, -4, 4)));
        }
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
        list.addEventListener('dragstart', (e) => e.preventDefault());

        /* klik: əvvəl mərkəzə fırlanır, sonra keçid */
        list.addEventListener('click', (e) => {
            const a = e.target.closest('.fm-link');
            if (!a) return;

            const wasMoved = moved;
            moved = false;
            if (wasMoved) { e.preventDefault(); return; }

            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
            e.preventDefault();

            const idx = items.indexOf(a);
            const cur = Math.round(pos);
            if (idx !== mod(cur)) {
                moveTo(nearest(idx, cur));
                setTimeout(() => go(a), REDUCE_MOTION ? 0 : CLICK_SETTLE);
            } else {
                go(a);
            }
        });

        /* Tab ilə fokus */
        list.addEventListener('focusin', (e) => {
            const a = e.target.closest('.fm-link');
            if (a) moveTo(nearest(items.indexOf(a), Math.round(target)));
        });
        list.addEventListener('scroll', () => { list.scrollTop = 0; list.scrollLeft = 0; });

        /* ↑ ↓ Enter */
        document.addEventListener('keydown', (e) => {
            if (!isOpen()) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); moveTo(Math.round(target) + 1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); moveTo(Math.round(target) - 1); }
            else if (e.key === 'Enter' && items[focusIdx] && document.activeElement !== items[focusIdx]) {
                e.preventDefault();
                go(items[focusIdx]);
            }
        });

        window.addEventListener('resize', measure);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
        measure();

        /* ---------- mətnlər (dilə görə) ---------- */
        const clockEl = fm.querySelector('.fm-clock span');
        const fmt = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Baku', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        let clockTimer = null;

        function tickClock() {
            const city = getLang() === 'az' ? 'Bakı' : 'Baku';
            clockEl.textContent = city + ' ' + fmt.format(new Date());
        }

        function applyTexts() {
            const lg = getLang();
            const L = TEXT[lg];
            items.forEach(a => {
                const v = L[a.dataset.key];
                const txt = a.querySelector('.fm-text');
                if (txt) { txt.textContent = v; txt.setAttribute('data-text', v); }
                a.setAttribute('aria-label', v);
            });
            mobileMenu.setAttribute('aria-label', L.menu);
            if (hamburgerText && !hamburgerText.classList.contains('roll')) {
                hamburgerText.textContent = isOpen() ? L.close : L.menu;
            }
            tickClock();
        }

        /* ---------- dil seçimi ---------- */
        const langBtns = fm.querySelectorAll('.fm-lang button');
        function syncLang() {
            const lg = getLang();
            langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === lg));
        }

        fm.querySelector('.fm-lang').addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (!b) return;
            const lg = b.dataset.lang;
            if (lg === getLang()) return;

            // səhifənin öz dil seçicisi varsa, onu işə salırıq (səhifə tərcümələri də yenilənsin)
            const opt = document.querySelector(`.lang-option[data-lang="${lg}"]`);
            if (opt) {
                opt.click();
            } else {
                try { localStorage.setItem('selectedLang', lg); } catch (err) { /* ignore */ }
                window.currentLang = lg;
                document.body.classList.toggle('lang-az', lg === 'az');
                document.documentElement.setAttribute('lang', lg);
                document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lg } }));
            }
            syncLang();
            applyTexts();
        });

        document.addEventListener('languageChanged', () => { syncLang(); applyTexts(); measure(); });

        syncLang();
        applyTexts();

        /* ---------- menyu açılış / bağlanış vəziyyəti ---------- */
        function onMenuState(open) {
            if (open) {
                measure();

                // cari səhifəni tap; tapılmasa HOME
                const curIdx = items.findIndex(a => a.classList.contains('is-current'));
                const c = curIdx >= 0 ? curIdx : 0;

                target = c;
                // açılışda süzülüb oturur; sona yaxın bəndlərdə istiqamət tərsinə
                pos = REDUCE_MOTION ? c : c + 1.8;   // açılışda çarx fırlanıb cari bəndə oturur
                render();
                clearTimeout(snapTimer);
                setTimeout(run, 280);

                tickClock();
                clearInterval(clockTimer);
                clockTimer = setInterval(tickClock, 1000);
                setTimeout(() => {
                    const f = items[c];
                    if (f) f.focus({ preventScroll: true });
                }, 80);
            } else {
                clearInterval(clockTimer);
                clockTimer = null;
                clearTimeout(snapTimer);
            }
        }

        window.CineChordMenu = {
            open: () => setOpen(true),
            close: () => setOpen(false),
            toggle: () => setOpen(!isOpen())
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();