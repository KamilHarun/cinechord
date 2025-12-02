document.addEventListener('DOMContentLoaded', function() {

    // ===================================================================
    // 0. CONFIGURATION & DOM REFERENCES
    // ===================================================================
    
    const ABOUT_DATA = {
        mainTitle: "OUR STORY",
        subTitle: "We are passionate filmmakers dedicated to bringing stories to life through the power of cinema.",
        whoWeAreText: "CINE CHORD is a collective of creative professionals specializing in cinematic storytelling. With years of experience in film production, we combine technical expertise with artistic vision to create compelling visual narratives that resonate with audiences.",
        ourMissionText: "Our mission is to elevate the art of filmmaking by delivering high-quality productions that exceed expectations. We believe in the power of storytelling to inspire, educate, and entertain, and we're committed to bringing your vision to the screen with professionalism and creativity.",
        ourApproachText: "We take a collaborative approach to every project, working closely with our clients to understand their goals and bring their ideas to life. From concept development to final delivery, we ensure every frame meets our high standards of excellence.",
        email: "info@cinechord.az",
        phone: "+994 50 123 45 67",
        address: "Baku, Azerbaijan",
        videoUrl: "/videos/Showreel.mp4" 
    };

    const pageTransition = document.querySelector('.page-transition');
    const logo = document.querySelector('.center-logo');
    const header = document.querySelector('.header');
    const scrollContainer = document.querySelector('.content-section') || window; 
    const headerEl = document.querySelector('.header');
    
    // Səhifə yüklənəndə transition effekti
    if (pageTransition) {
        setTimeout(() => {
             pageTransition.classList.add('page-loaded'); 
        }, 100);
    }
    
    // ===================================================================
    // 1. MOBILE NAVIGATION & HAMBURGER
    // ===================================================================
    
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    hamburger.setAttribute('aria-label', 'Toggle menu');
    hamburger.setAttribute('role', 'button');
    
    if (header) {
        header.appendChild(hamburger);
    }

    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        mobileMenu.appendChild(btn.cloneNode(true));
    });
    
    document.body.appendChild(overlay);
    document.body.appendChild(mobileMenu);

    function toggleMenu() {
        const isActive = hamburger.classList.contains('active');
        
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        
        document.body.style.overflow = isActive ? '' : 'hidden'; 
    }

    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
    mobileMenu.addEventListener('click', function(e) {
        if (e.target.classList.contains('nav-btn') || e.target.closest('.nav-btn')) {
            toggleMenu();
        }
    });

    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 768 && hamburger.classList.contains('active')) {
                toggleMenu();
            }
        }, 250);
    });

    // ===================================================================
    // 2. SCROLL & HEADER ANIMATION LOGIC
    // ===================================================================
    
    let lastScroll = 0;

    function handleScroll(e) {
        const currentScroll = (scrollContainer === window) ? window.scrollY : e.target.scrollTop;

        if (currentScroll > lastScroll && currentScroll > 50) {
            if (headerEl) headerEl.style.transform = 'translateY(-100%)';
        } else {
            if (headerEl) headerEl.style.transform = 'translateY(0)';
        }

        if (currentScroll > 50) {
            if (logo) logo.classList.add('scroll-hidden');
        } else {
            if (logo) logo.classList.remove('scroll-hidden');
        }
        lastScroll = currentScroll;
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    setTimeout(() => { if (logo) logo.classList.add('entry-done'); }, 500);


    // ===================================================================
    // 3. SCROLL REVEAL (Intersection Observer)
    // ===================================================================
    
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

    // ===================================================================
    // 4. PAGE TRANSITION & NAVIGATION (SERVER FIX)
    // ===================================================================
    
    // ✅ SERVER FIX: Transition lock və fallback
    let isTransitioning = false;
    
    function navigateWithTransition(href) {
        // ✅ Prevent double navigation
        if (isTransitioning) {
            console.warn('⚠️ Transition in progress, ignoring click');
            return;
        }
        
        isTransitioning = true;
        
        if (pageTransition) {
             pageTransition.classList.remove('page-loaded'); 
             pageTransition.style.transition = 'none';
             pageTransition.classList.add('active');
        }
        
        // ✅ Normal navigation
        setTimeout(() => { 
            window.location.href = href; 
        }, 600);
        
        // ✅ Fallback: Server gec cavab verərsə, force et
        setTimeout(() => {
            if (!document.hidden) {
                console.warn('⚠️ Slow server, forcing navigation');
                window.location.href = href;
            }
        }, 1600);
    }

    function setupNavButtons() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const href = btn.getAttribute('href');
                if (!href || href === '#' || href.startsWith('#')) return;
                
                if (href === window.location.pathname.split('/').pop()) return;
                
                e.preventDefault();
                navigateWithTransition(href);
            });
        });
    }

    setupNavButtons();
    setTimeout(setupNavButtons, 100);

    // ===================================================================
    // 5. SCRAMBLE EFFECT (DESKTOP)
    // ===================================================================
    
    if (window.innerWidth > 768) {
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
    }

    // ===================================================================
    // 6. LOAD ABOUT DATA
    // ===================================================================
    
    function loadAboutData() {
        try {
            const video = document.getElementById('about-video');
            if (video && ABOUT_DATA.videoUrl) {
                video.src = ABOUT_DATA.videoUrl;
                video.load();
                video.play().catch(err => console.log('Video autoplay blocked:', err));
            }

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

            setRolling('main-title', ABOUT_DATA.mainTitle);
            setText('subtitle', ABOUT_DATA.subTitle);
            setText('who-we-are', ABOUT_DATA.whoWeAreText);
            setText('our-mission', ABOUT_DATA.ourMissionText);
            setText('our-approach', ABOUT_DATA.ourApproachText);

            const emailLink = document.getElementById('email-link');
            if (emailLink && ABOUT_DATA.email) {
                const emailUpper = ABOUT_DATA.email.toUpperCase();
                emailLink.href = `mailto:${ABOUT_DATA.email}`;
                emailLink.setAttribute('data-text', emailUpper);
                const span = emailLink.querySelector('span');
                if(span) span.textContent = emailUpper;
            }

            const phoneLink = document.getElementById('phone-link');
            if (phoneLink && ABOUT_DATA.phone) {
                phoneLink.href = `tel:${ABOUT_DATA.phone.replace(/\s/g, '')}`;
                phoneLink.setAttribute('data-text', ABOUT_DATA.phone);
                const span = phoneLink.querySelector('span');
                if(span) span.textContent = ABOUT_DATA.phone;
            }

            if (ABOUT_DATA.address) {
                setText('address', ABOUT_DATA.address.toUpperCase());
            }

        } catch (err) {
            console.error('Content loading error:', err);
        }
    }

    // ===================================================================
    // 7. PERFORMANCE OPTIMIZATIONS
    // ===================================================================
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    if (window.innerWidth <= 768) {
        const video = document.getElementById('about-video');
        if (video) {
            video.setAttribute('preload', 'metadata');
        }
        
        const debouncedScroll = debounce(handleScroll, 10);
        scrollContainer.removeEventListener('scroll', handleScroll);
        scrollContainer.addEventListener('scroll', debouncedScroll, { passive: true });
    }
    
    if ('ontouchstart' in window) {
        document.querySelectorAll('.nav-btn, .social-link').forEach(el => {
            el.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            }, { passive: true });
            
            el.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
    }

    loadAboutData();
    
    console.log('✅ About page loaded successfully');
});