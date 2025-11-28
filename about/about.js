document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. FLASH FIX & CONFIG
    // ============================================================
    const pageTransition = document.querySelector('.page-transition');
    if (pageTransition) {
        setTimeout(() => {
             pageTransition.classList.add('page-loaded'); 
        }, 100);
    }

    const BACKEND_URL = "http://localhost:8080";
    const ABOUT_API = BACKEND_URL + "/api/about/getAbout";
    const UPLOADS_BASE = BACKEND_URL + "/uploads/";

    // ============================================================
    // 1. NAVBAR & LOGO SCROLL LOGIC
    // ============================================================
    let lastScroll = 0;
    const navbar = document.querySelector('.header');
    const logo = document.querySelector('.center-logo');
    
    // About səhifəsində scroll konteyneri fərqli ola bilər
    const scrollContainer = document.querySelector('.content-section') || window; 

    setTimeout(() => { if (logo) logo.classList.add('entry-done'); }, 500);

    function handleScroll(e) {
        // Əgər window-dursa scrollY, elementdirsə scrollTop
        const currentScroll = (scrollContainer === window) ? window.scrollY : e.target.scrollTop;

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

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // ============================================================
    // 2. SCROLL REVEAL (FOCUS-IN)
    // ============================================================
    const observerOptions = {
        threshold: 0.15, 
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

    document.querySelectorAll('.reveal-item').forEach((el) => {
        observer.observe(el);
    });

    // ============================================================
    // 3. PAGE TRANSITION & NAV
    // ============================================================
    function navigateWithTransition(href) {
        if (pageTransition) {
             pageTransition.classList.remove('page-loaded'); 
             pageTransition.style.transition = 'none';
             pageTransition.classList.add('active');
        }
        setTimeout(() => { window.location.href = href; }, 600);
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            if (!href || href === '#' || href.startsWith('#')) return;
            
            // Eyni səhifədirsə keçmə
            if (href === window.location.pathname.split('/').pop()) return;
            
            e.preventDefault();
            navigateWithTransition(href);
        });
    });

    // ============================================================
    // 4. SCRAMBLE EFFECT
    // ============================================================
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const originalText = btn.getAttribute('data-text');
        if (!originalText) return;
        const navText = btn.querySelector('.nav-text');
        if (!navText) return;

        btn.addEventListener('mouseenter', function() {
            if (this.classList.contains('active')) return;
            let iteration = 0;
            let interval = setInterval(() => {
                navText.innerText = originalText.split("").map((letter, index) => {
                    if(index < iteration) return originalText[index];
                    return letters[Math.floor(Math.random() * letters.length)];
                }).join("");
                if(iteration >= originalText.length) clearInterval(interval);
                iteration += 1/3;
            }, 30);
        });
        
        btn.addEventListener('mouseleave', function() {
            if (this.classList.contains('active')) return;
            navText.innerText = originalText;
        });
    });

    // ============================================================
    // 5. LOAD ABOUT DATA (BACKEND)
    // ============================================================
    async function loadAboutData() {
        try {
            const res = await fetch(ABOUT_API);
            if (!res.ok) {
                console.error(`HTTP Error! Status: ${res.status}`);
                return;
            }

            const data = await res.json();
            
            // --- VIDEO ---
            const video = document.getElementById('about-video');
            if (video && data.videoUrl) {
                let videoUrl = data.videoUrl.trim();
                if (videoUrl.startsWith('/uploads/')) {
                    videoUrl = BACKEND_URL + videoUrl;
                } else if (videoUrl.startsWith('uploads/')) {
                    videoUrl = BACKEND_URL + '/' + videoUrl;
                } else if (!videoUrl.startsWith('http')) {
                    videoUrl = UPLOADS_BASE + data.videoUrl;
                }
                video.querySelector('source').src = videoUrl;
                video.load();
                video.play().catch(err => console.log('Video autoplay error:', err));
            }

            // --- TEXT CONTENT ---
            const setText = (id, text) => {
                const el = document.getElementById(id);
                if (el && text) el.textContent = text;
            };

            const setRolling = (id, text) => {
                const el = document.getElementById(id);
                if (el && text) {
                    const upper = text.toUpperCase();
                    el.setAttribute('data-text', upper);
                    const span = el.querySelector('span');
                    if(span) span.textContent = upper;
                }
            };

            setRolling('main-title', data.mainTitle);
            setText('subtitle', data.subTitle);
            setText('who-we-are', data.whoWeAreText);
            setText('our-mission', data.ourMissionText);
            setText('our-approach', data.ourApproachText);

            // --- CONTACT INFO ---
            const emailLink = document.getElementById('email-link');
            if (emailLink && data.email) {
                const emailUpper = data.email.toUpperCase();
                emailLink.href = `mailto:${data.email}`;
                emailLink.setAttribute('data-text', emailUpper);
                const span = emailLink.querySelector('span');
                if(span) span.textContent = emailUpper;
            }

            const phoneLink = document.getElementById('phone-link');
            if (phoneLink && data.phone) {
                phoneLink.href = `tel:${data.phone.replace(/\s/g, '')}`;
                phoneLink.setAttribute('data-text', data.phone);
                const span = phoneLink.querySelector('span');
                if(span) span.textContent = data.phone;
            }

            if (data.address) {
                setText('address', data.address.toUpperCase());
            }

            console.log('About data loaded successfully');

        } catch (err) {
            console.error('Failed to load about data:', err);
        }
    }

    // Yükləməni başlat
    loadAboutData();
});