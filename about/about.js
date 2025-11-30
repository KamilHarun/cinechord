document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. FLASH FIX & CONFIG (PROXY UPDATED)
    // ============================================================
    const pageTransition = document.querySelector('.page-transition');
    if (pageTransition) {
        setTimeout(() => {
             pageTransition.classList.add('page-loaded'); 
        }, 100);
    }

    // [DƏYİŞDİRİLDİ] Artıq uzun Railway URL-i yoxdur!
    // Netlify _redirects faylı bütün '/api' sorğularını yönləndirəcək.
    
    // BACKEND_URL artıq lazım deyil, boş qoyuruq ki, kod xəta verməsin (əgər aşağıda istifadə olunubsa).
    const BACKEND_URL = ""; 
    
    // API birbaşa eyni domaindən çağırılır
    const ABOUT_API = "/api/about/getAbout";
    
    // Uploads qovluğu da eyni domaindən (proxy ilə)
    const UPLOADS_BASE = "/uploads/";

    // ============================================================
    // 1. HAMBURGER MENU (MOBILE)
    // ============================================================
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    hamburger.setAttribute('aria-label', 'Toggle menu');
    hamburger.setAttribute('role', 'button');
    
    const header = document.querySelector('.header');
    if (header) {
        header.appendChild(hamburger);
    }

    // Create mobile menu
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    
    // Copy all nav buttons to mobile menu
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        const clone = btn.cloneNode(true);
        mobileMenu.appendChild(clone);
    });
    
    document.body.appendChild(overlay);
    document.body.appendChild(mobileMenu);

    // Toggle mobile menu
    function toggleMenu() {
        const isActive = hamburger.classList.contains('active');
        
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Prevent scroll when menu is open
        document.body.style.overflow = isActive ? '' : 'hidden';
    }

    // Open/close menu
    hamburger.addEventListener('click', toggleMenu);

    // Close menu when clicking overlay
    overlay.addEventListener('click', toggleMenu);

    // Close menu when clicking a link
    mobileMenu.addEventListener('click', function(e) {
        if (e.target.classList.contains('nav-btn') || e.target.closest('.nav-btn')) {
            toggleMenu();
        }
    });

    // Close menu on window resize to desktop
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 768 && hamburger.classList.contains('active')) {
                toggleMenu();
            }
        }, 250);
    });

    // ============================================================
    // 2. NAVBAR & LOGO SCROLL LOGIC
    // ============================================================
    let lastScroll = 0;
    const navbar = document.querySelector('.header');
    const logo = document.querySelector('.center-logo');
    
    const scrollContainer = document.querySelector('.content-section') || window; 

    setTimeout(() => { if (logo) logo.classList.add('entry-done'); }, 500);

    function handleScroll(e) {
        const currentScroll = (scrollContainer === window) ? window.scrollY : e.target.scrollTop;

        // Hide navbar on scroll down, show on scroll up
        if (currentScroll > lastScroll && currentScroll > 50) {
            if (navbar) navbar.style.transform = 'translateY(-100%)';
        } else {
            if (navbar) navbar.style.transform = 'translateY(0)';
        }

        // Hide logo on scroll
        if (currentScroll > 50) {
            if (logo) logo.classList.add('scroll-hidden');
        } else {
            if (logo) logo.classList.remove('scroll-hidden');
        }
        lastScroll = currentScroll;
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // ============================================================
    // 3. SCROLL REVEAL (FOCUS-IN)
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
    // 4. PAGE TRANSITION & NAV
    // ============================================================
    function navigateWithTransition(href) {
        if (pageTransition) {
             pageTransition.classList.remove('page-loaded'); 
             pageTransition.style.transition = 'none';
             pageTransition.classList.add('active');
        }
        setTimeout(() => { window.location.href = href; }, 600);
    }

    // Handle both desktop and mobile nav buttons
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

    // Re-setup after mobile menu is populated
    setTimeout(setupNavButtons, 100);

    // ============================================================
    // 5. SCRAMBLE EFFECT (DESKTOP ONLY)
    // ============================================================
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

    // ============================================================
    // 6. TOUCH ENHANCEMENTS FOR MOBILE
    // ============================================================
    if ('ontouchstart' in window) {
        // Add active state on touch for better feedback
        document.querySelectorAll('.nav-btn, .social-link').forEach(el => {
            el.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            }, { passive: true });
            
            el.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
    }

    // ============================================================
    // 7. LOAD ABOUT DATA (BACKEND)
    // ============================================================
    async function loadAboutData() {
        try {
            // BACKEND_URL olmadan, nisbi yol ilə çağırırıq:
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
                
                // Video yollarını təmizləyirik
                if (videoUrl.startsWith('/uploads/')) {
                    videoUrl = videoUrl; // Artıq eyni domaindir, dəyişməyə ehtiyac yoxdur
                } else if (videoUrl.startsWith('uploads/')) {
                    videoUrl = '/' + videoUrl;
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

    // ============================================================
    // 8. PERFORMANCE OPTIMIZATIONS
    // ============================================================
    
    // Lazy load video on mobile to save bandwidth
    if (window.innerWidth <= 768) {
        const video = document.getElementById('about-video');
        if (video) {
            video.setAttribute('preload', 'metadata');
        }
    }

    // Debounce scroll events for better performance
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

    // Apply debounce to scroll handler on mobile
    if (window.innerWidth <= 768) {
        const debouncedScroll = debounce(handleScroll, 10);
        scrollContainer.removeEventListener('scroll', handleScroll);
        scrollContainer.addEventListener('scroll', debouncedScroll, { passive: true });
    }

    // ============================================================
    // INITIALIZE
    // ============================================================
    loadAboutData();
});