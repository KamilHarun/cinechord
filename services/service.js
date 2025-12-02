document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. DOM ELEMENTS & CONFIG
    // ============================================================
    
    const pageTransition = document.querySelector('.page-transition');
    const navbar = document.querySelector('.header');
    const logo = document.querySelector('.center-logo');
    const isMobile = window.innerWidth <= 768;
    
    const CONFIG = {
        SCROLL_THRESHOLD: 50,
        TRANSITION_DURATION: 600, // ✅ CSS ilə eyni
        FALLBACK_TIMEOUT: 1600
    };

    // ============================================================
    // 1. 🔥 VIDEO LAZY LOADING (ƏN VACİB!)
    // ============================================================
    
    /**
     * Video lazy loading - yalnız görünəndə yüklə
     * Bu 5 videonu eyni anda yükləməyi qarşısını alır
     */
    function initVideoLazyLoad() {
        const videoObserverOptions = {
            threshold: 0.25, // Video 25% görünəndə yüklə
            rootMargin: "100px" // 100px əvvəlcədən hazırla
        };

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    const videoSrc = video.getAttribute('data-src');
                    
                    if (videoSrc && !video.src) {
                        console.log('📹 Loading video:', videoSrc);
                        
                        // Show loading state
                        video.style.background = 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)';
                        
                        // Load video
                        video.src = videoSrc;
                        video.load();
                        
                        // Play when ready
                        video.addEventListener('loadeddata', () => {
                            video.style.background = '#000';
                            video.play().catch(err => {
                                console.log('Video autoplay blocked:', err);
                            });
                        });
                        
                        // Error handling
                        video.addEventListener('error', () => {
                            console.error('❌ Video load error:', videoSrc);
                            video.style.background = '#1a1a1a';
                        });
                    }
                    
                    videoObserver.unobserve(video);
                }
            });
        }, videoObserverOptions);

        // Observe all videos with data-src
        document.querySelectorAll('video[data-src]').forEach(video => {
            videoObserver.observe(video);
        });
        
        console.log('✅ Video lazy loading initialized');
    }

    // ============================================================
    // 2. 🔥 NAVBAR & LOGO SCROLL (RAF Optimized)
    // ============================================================
    
    let lastScroll = 0;
    let ticking = false;

    setTimeout(() => { 
        if (logo) logo.classList.add('entry-done'); 
    }, 200);

    function updateScroll(currentScroll) {
        if (currentScroll > lastScroll && currentScroll > CONFIG.SCROLL_THRESHOLD) {
            if (navbar) navbar.style.transform = 'translateY(-100%)';
        } else {
            if (navbar) navbar.style.transform = 'translateY(0)';
        }
        
        if (currentScroll > CONFIG.SCROLL_THRESHOLD) {
            if (logo) logo.classList.add('scroll-hidden');
        } else {
            if (logo) logo.classList.remove('scroll-hidden');
        }
        
        lastScroll = currentScroll;
        ticking = false;
    }

    function handleScroll() {
        const currentScroll = window.scrollY;
        
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateScroll(currentScroll);
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ============================================================
    // 3. SCROLL REVEAL (Intersection Observer)
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

    document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
    
    document.querySelectorAll('.page-wrapper').forEach(el => {
        el.classList.add('reveal-item');
        observer.observe(el);
    });
    
    // ✅ Chat section lazy reveal
    const chatSection = document.querySelector('.chat-section');
    if (chatSection) {
        observer.observe(chatSection);
    }

    // ============================================================
    // 4. 🔥 PAGE TRANSITION (SERVER OPTIMIZED)
    // ============================================================
    
    let isTransitioning = false;
    
    function navigateWithTransition(href) {
        // ✅ Prevent double navigation
        if (isTransitioning) {
            console.warn('⚠️ Transition already in progress');
            return;
        }
        
        isTransitioning = true;
        console.log('🚀 Starting navigation to:', href);
        
        // Stop and cleanup all videos
        document.querySelectorAll('video').forEach(video => {
            video.pause();
            video.currentTime = 0;
        });
        
        // Start transition
        if (pageTransition) {
            pageTransition.classList.remove('page-loaded'); 
            pageTransition.style.transition = 'none';
            void pageTransition.offsetWidth; // Force reflow
            pageTransition.classList.add('active'); 
        }
        
        // ✅ Navigate with correct timing (matches CSS)
        setTimeout(() => { 
            window.location.href = href; 
        }, CONFIG.TRANSITION_DURATION);
        
        // ✅ Fallback for slow server
        setTimeout(() => {
            if (!document.hidden) {
                console.warn('⚠️ Slow server response, forcing navigation');
                window.location.href = href;
            }
        }, CONFIG.FALLBACK_TIMEOUT);
    }

    function setupNavButtons() {
        document.querySelectorAll('.nav-btn, .footer-link, .chat-cta-button, .cta-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const href = btn.getAttribute('href');
                if (!href || href === '#' || href.startsWith('#')) return;
                
                e.preventDefault();
                navigateWithTransition(href);
            });
        });
    }

    setupNavButtons();

    // ============================================================
    // 5. 🔥 NAV SCRAMBLE EFFECT (Desktop Only)
    // ============================================================
    
    if (!isMobile) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const originalText = btn.getAttribute('data-text');
            if (!originalText) return;
            
            const navText = btn.querySelector('.nav-text');
            if (!navText) return;

            btn.addEventListener('mouseenter', function() {
                if (this.classList.contains('active')) return;
                
                let iteration = 0;
                const interval = setInterval(() => {
                    navText.innerText = originalText.split("").map((letter, index) => {
                        if (index < iteration) return originalText[index];
                        return letters[Math.floor(Math.random() * letters.length)];
                    }).join("");
                    
                    if (iteration >= originalText.length) {
                        clearInterval(interval);
                    }
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
    // 6. 🔥 MOBILE OPTIMIZATIONS
    // ============================================================
    
    if (isMobile) {
        // Reduce video quality on mobile
        document.querySelectorAll('video').forEach(video => {
            video.setAttribute('preload', 'metadata');
        });
        
        console.log('✅ Mobile optimizations applied');
    }

    // ============================================================
    // 7. INITIALIZE
    // ============================================================
    
    if (pageTransition) {
        setTimeout(() => {
            pageTransition.classList.add('page-loaded'); 
        }, 100);
    }
    
    // Initialize video lazy loading
    initVideoLazyLoad();
    
    console.log('✅ Services page fully optimized and ready');
});