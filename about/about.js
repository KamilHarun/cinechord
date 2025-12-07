/* ============================================================
   CineChord About - Main JavaScript
   Version: 6.1 - FORCED VIDEO AUTOPLAY
   ============================================================ */

(function() {
    'use strict';

    /* ============================================================
       1. CONFIGURATION - DINAMIK BACKEND URL
       ============================================================ */
    
    const getBackendUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080';
        }
        return 'https://cinechord-admin-production.up.railway.app';
    };
    
    const CONFIG = {
        BACKEND_URL: getBackendUrl(),
        ENDPOINTS: {
            ABOUT: '/api/about/getAbout'
        },
        STATIC_VIDEO: '../videos/Showreel.mp4',
        SCROLL_THRESHOLD: 50,
        LOGO_ENTRY_DELAY: 500,
        PAGE_LOAD_DELAY: 100,
        NAVIGATION_DELAY: 600,
        FALLBACK_DELAY: 1600,
        SCROLL_THROTTLE: 16,
        NAVBAR_HIDE_THRESHOLD: 200,
        LOGO_HIDE_THRESHOLD: 100,
        RESIZE_DEBOUNCE: 250,
        REQUEST_TIMEOUT: 10000,
        RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000
    };

    console.log('🔌 Backend URL:', CONFIG.BACKEND_URL);

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const elements = {
        // Page elements
        pageTransition: document.querySelector('.page-transition'),
        centerLogo: document.querySelector('.center-logo'),
        header: document.querySelector('.header'),
        progressBarTop: document.querySelector('.progress-bar-top'),
        
        // Video - STATIC
        aboutVideo: document.getElementById('about-video'),
        
        // Text elements - ALL DYNAMIC
        mainTitle: document.getElementById('main-title'),
        subtitle: document.getElementById('subtitle'),
        whoWeAre: document.getElementById('who-we-are'),
        ourMission: document.getElementById('our-mission'),
        ourApproach: document.getElementById('our-approach'),
        emailLink: document.getElementById('email-link'),
        phoneLink: document.getElementById('phone-link'),
        address: document.getElementById('address')
    };

    let lastScrollTop = 0;
    let isTransitioning = false;

    /* ============================================================
       3. UTILITY FUNCTIONS
       ============================================================ */
    
    function throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = new Date().getTime();
            if (now - lastCall < delay) return;
            lastCall = now;
            return func(...args);
        };
    }

    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function fetchWithTimeout(url, options = {}, timeout = CONFIG.REQUEST_TIMEOUT) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }

    async function retryFetch(fetchFn, attempts = CONFIG.RETRY_ATTEMPTS) {
        let lastError;
        for (let i = 0; i < attempts; i++) {
            try {
                return await fetchFn();
            } catch (error) {
                lastError = error;
                if (i < attempts - 1) {
                    const delay = CONFIG.RETRY_DELAY * Math.pow(2, i);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }

    /* ============================================================
       4. PAGE TRANSITION
       ============================================================ */
    
    function initPageTransition() {
        if (!elements.pageTransition) return;
        
        setTimeout(() => {
            elements.pageTransition.classList.add('page-loaded');
            console.log('✅ Page transition complete');
        }, CONFIG.PAGE_LOAD_DELAY);
    }

    function navigateWithTransition(href) {
        if (isTransitioning) return;
        
        isTransitioning = true;
        
        if (elements.pageTransition) {
            elements.pageTransition.classList.remove('page-loaded');
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
       5. SCROLL EFFECTS (Works Pattern)
       ============================================================ */
    
    function updateScrollProgress() {
        if (!elements.progressBarTop) return;
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        elements.progressBarTop.style.width = Math.min(scrolled, 100) + '%';
    }

    function handleLogoScroll() {
        if (!elements.centerLogo) return;
        
        // About layout'u side-by-side olduğu için, both window scroll ve content-section scroll'u kontrol et
        const contentSection = document.querySelector('.content-section');
        let scrollTop = window.pageYOffset;
        
        if (contentSection) {
            scrollTop = Math.max(scrollTop, contentSection.scrollTop);
        }
        
        // Smooth animate with scroll - Works pattern
        // Calculate offset based on scroll position (proportional)
        const maxOffset = 120;
        const offset = Math.min(scrollTop * 0.5, maxOffset);
        
        // Apply smooth transform
        elements.centerLogo.style.transform = `translateX(-50%) translateY(-${offset}px) scale(${1 - (offset / maxOffset) * 0.5}) rotate(-${180 - (offset / maxOffset) * 180}deg)`;
        
        // Opacity fade
        const opacity = Math.max(1 - (offset / maxOffset), 0);
        elements.centerLogo.style.opacity = opacity;
        
        // Hide pointer events when too hidden
        if (opacity < 0.1) {
            elements.centerLogo.style.pointerEvents = 'none';
            elements.centerLogo.style.visibility = 'hidden';
        } else {
            elements.centerLogo.style.pointerEvents = 'auto';
            elements.centerLogo.style.visibility = 'visible';
        }
    }

    function handleNavbarScroll() {
        if (!elements.header) return;
        
        // About layout'u side-by-side olduğu için, both window scroll ve content-section scroll'u kontrol et
        const contentSection = document.querySelector('.content-section');
        let currentScroll = window.pageYOffset;
        
        if (contentSection) {
            currentScroll = Math.max(currentScroll, contentSection.scrollTop);
        }
        
        if (currentScroll <= 0) {
            elements.header.style.transform = 'translateY(0)';
            lastScrollTop = currentScroll;
            return;
        }
        
        if (currentScroll > lastScrollTop && currentScroll > CONFIG.NAVBAR_HIDE_THRESHOLD) {
            elements.header.style.transform = 'translateY(-100%)';
        } else {
            elements.header.style.transform = 'translateY(0)';
        }
        lastScrollTop = currentScroll;
    }

    function handleVideoScroll() {
        // Video fade effect on scroll - Works pattern
        const videoSection = document.querySelector('.video-section');
        const contentSection = document.querySelector('.content-section');
        if (!videoSection) return;
        
        // Use content-section scroll for About's layout
        let scrollTop = window.pageYOffset;
        if (contentSection) {
            scrollTop = Math.max(scrollTop, contentSection.scrollTop);
        }
        
        const maxOpacity = 1;
        const fadeStart = 0;
        const fadeEnd = 300;
        
        let opacity = maxOpacity - (scrollTop - fadeStart) / (fadeEnd - fadeStart);
        opacity = Math.max(0, Math.min(maxOpacity, opacity));
        
        videoSection.style.opacity = opacity;
    }

    const handleScroll = throttle(() => {
        updateScrollProgress();
        handleLogoScroll();
        handleNavbarScroll();
        handleVideoScroll();
    }, CONFIG.SCROLL_THROTTLE);

    function initScrollEffects() {
        // Window scroll
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Content-section internal scroll (About's side-by-side layout)
        const contentSection = document.querySelector('.content-section');
        if (contentSection) {
            contentSection.addEventListener('scroll', handleScroll, { passive: true });
        }
        
        updateScrollProgress();
        handleLogoScroll();
        handleNavbarScroll();
        handleVideoScroll();
    }

    /* ============================================================
       6. LOGO ANIMATION
       ============================================================ */
    
    function initLogoAnimation() {
        setTimeout(() => {
            if (elements.centerLogo) {
                elements.centerLogo.classList.add('entry-done');
                console.log('✅ Logo animation started');
            }
        }, CONFIG.LOGO_ENTRY_DELAY);
    }

    /* ============================================================
       7. VIDEO FORCED AUTOPLAY (MOBILE & DESKTOP)
       ============================================================ */
    
    function forceVideoPlay() {
        if (!elements.aboutVideo) return;
        
        elements.aboutVideo.muted = true;
        elements.aboutVideo.playsInline = true;
        elements.aboutVideo.autoplay = true;
        
        const playPromise = elements.aboutVideo.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✅ Video playing successfully');
                })
                .catch(error => {
                    console.warn('⚠️ Autoplay blocked, retrying...', error);
                    // Retry after a short delay
                    setTimeout(() => {
                        elements.aboutVideo.play().catch(err => {
                            console.error('❌ Video play retry failed:', err);
                        });
                    }, 500);
                });
        }
    }
    
    function loadStaticVideo() {
        if (!elements.aboutVideo) return;
        
        console.log('📹 Loading static video:', CONFIG.STATIC_VIDEO);
        elements.aboutVideo.src = CONFIG.STATIC_VIDEO;
        
        // Remove controls attribute if exists
        elements.aboutVideo.removeAttribute('controls');
        
        // Set required attributes for autoplay
        elements.aboutVideo.muted = true;
        elements.aboutVideo.loop = true;
        elements.aboutVideo.playsInline = true;
        elements.aboutVideo.autoplay = true;
        
        elements.aboutVideo.load();
        
        // Force play when loaded
        elements.aboutVideo.addEventListener('loadeddata', function() {
            console.log('✅ Static video loaded');
            forceVideoPlay();
        }, { once: true });
        
        // If video pauses for any reason, restart it immediately
        elements.aboutVideo.addEventListener('pause', function() {
            console.log('⚠️ Video paused, restarting...');
            setTimeout(() => {
                forceVideoPlay();
            }, 100);
        });
        
        // If video ends (shouldn't happen with loop, but just in case)
        elements.aboutVideo.addEventListener('ended', function() {
            console.log('⚠️ Video ended, restarting...');
            elements.aboutVideo.currentTime = 0;
            forceVideoPlay();
        });
        
        // Handle errors
        elements.aboutVideo.addEventListener('error', function(e) {
            console.error('❌ Video error:', e);
        });
        
        // Disable right-click menu on video
        elements.aboutVideo.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        // Play on visibility change
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && elements.aboutVideo) {
                forceVideoPlay();
            }
        });
        
        // Fallback: Force play on user interaction (mobile devices)
        const interactionEvents = ['click', 'touchstart', 'scroll'];
        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, function initVideoOnInteraction() {
                forceVideoPlay();
                // Remove listeners after first interaction
                interactionEvents.forEach(type => {
                    document.removeEventListener(type, initVideoOnInteraction);
                });
            }, { once: true, passive: true });
        });
        
        // Force play after page load
        setTimeout(() => {
            forceVideoPlay();
        }, 1000);
    }

    /* ============================================================
       8. DYNAMIC CONTENT LOADING (API)
       ============================================================ */
    
    async function loadDynamicContent() {
        console.log('🌐 Fetching dynamic content from API...');
        
        try {
            const response = await retryFetch(() => 
                fetchWithTimeout(`${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.ABOUT}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                })
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const apiData = await response.json();
            console.log('📦 API Response:', apiData);
            
            processApiData(apiData);
            
        } catch (error) {
            console.error('❌ API Error:', error);
            showFallbackContent();
        }
    }

    /* ============================================================
       9. PROCESS API DATA
       ============================================================ */
    
    function processApiData(data) {
        console.log('🔧 Processing API data...');
        
        function formatText(text) {
            if (!text) return '';
            return text.replace(/\r\n/g, '<br>');
        }
        
        const content = {
            mainTitle: data.mainTitle || "OUR STORY",
            subTitle: data.subTitle || "We are passionate filmmakers dedicated to cinematic storytelling",
            whoWeAreText: formatText(data.whoWeAreText) || "CineChord is a creative studio specializing in visual storytelling and film production.",
            ourMissionText: formatText(data.ourMissionText) || "Our mission is to transform ideas into powerful visual experiences.",
            ourApproachText: formatText(data.ourApproachText) || "We approach every project with creativity and technical excellence.",
            email: data.email || "cinechord@gmail.com",
            phone: data.phone || "+994 50 123 45 67",
            address: data.address || "Baku, Azerbaijan"
        };
        
        console.log('📝 Processed content:', content);
        populateContent(content);
    }

    /* ============================================================
       10. POPULATE HTML CONTENT
       ============================================================ */
    
    function populateContent(content) {
        console.log('🎨 Populating HTML content...');
        
        // 1. MAIN TITLE
        if (elements.mainTitle && content.mainTitle) {
            const upperTitle = content.mainTitle.toUpperCase();
            elements.mainTitle.setAttribute('data-text', upperTitle);
            const span = elements.mainTitle.querySelector('span');
            if (span) {
                span.textContent = upperTitle;
                console.log('✅ Main title set:', upperTitle);
            }
        }
        
        // 2. SUBTITLE
        if (elements.subtitle) {
            if (content.subTitle && content.subTitle.trim() !== '') {
                elements.subtitle.textContent = content.subTitle;
                console.log('✅ Subtitle set:', content.subTitle);
            } else {
                elements.subtitle.textContent = "We are passionate filmmakers dedicated to cinematic storytelling";
                console.log('⚠️  Subtitle was empty, used default');
            }
        }
        
        // 3. WHO WE ARE
        if (elements.whoWeAre && content.whoWeAreText) {
            elements.whoWeAre.innerHTML = content.whoWeAreText;
            console.log('✅ WHO WE ARE set');
        }
        
        // 4. OUR MISSION
        if (elements.ourMission && content.ourMissionText) {
            elements.ourMission.innerHTML = content.ourMissionText;
            console.log('✅ OUR MISSION set');
        }
        
        // 5. OUR APPROACH
        if (elements.ourApproach && content.ourApproachText) {
            elements.ourApproach.innerHTML = content.ourApproachText;
            console.log('✅ OUR APPROACH set');
        }
        
        // 6. EMAIL
        if (content.email) {
            const emailUpper = content.email.toUpperCase();
            
            if (elements.emailLink) {
                elements.emailLink.href = `mailto:${content.email}`;
                elements.emailLink.setAttribute('data-text', emailUpper);
                
                let emailSpan = elements.emailLink.querySelector('span');
                if (!emailSpan) {
                    emailSpan = document.createElement('span');
                    elements.emailLink.appendChild(emailSpan);
                }
                emailSpan.textContent = emailUpper;
                
                console.log('✅ Email set:', content.email);
            }
        }
        
        // 7. PHONE
        if (content.phone) {
            const phoneDigits = content.phone.replace(/\D/g, '');
            
            if (elements.phoneLink) {
                elements.phoneLink.href = `tel:+${phoneDigits}`;
                elements.phoneLink.setAttribute('data-text', content.phone);
                
                let phoneSpan = elements.phoneLink.querySelector('span');
                if (!phoneSpan) {
                    phoneSpan = document.createElement('span');
                    elements.phoneLink.appendChild(phoneSpan);
                }
                phoneSpan.textContent = content.phone;
                
                console.log('✅ Phone set:', content.phone);
            }
        }
        
        // 8. ADDRESS
        if (elements.address && content.address) {
            elements.address.textContent = content.address.toUpperCase();
            console.log('✅ Address set:', content.address);
        }
        
        console.log('🎉 All content populated successfully!');
    }

    /* ============================================================
       11. FALLBACK CONTENT
       ============================================================ */
    
    function showFallbackContent() {
        console.log('🔄 Showing fallback content');
        
        const fallback = {
            mainTitle: "OUR STORY",
            subTitle: "We are passionate filmmakers dedicated to cinematic storytelling",
            whoWeAreText: "CineChord is a creative studio specializing in visual storytelling and film production.",
            ourMissionText: "Our mission is to transform ideas into powerful visual experiences that resonate with audiences.",
            ourApproachText: "We approach every project with a balance of creativity, strategy, and technical excellence.",
            email: "cinechord@gmail.com",
            phone: "+994 50 123 45 67",
            address: "Baku, Azerbaijan"
        };
        
        populateContent(fallback);
    }

    /* ============================================================
       12. SCROLL REVEAL ANIMATIONS
       ============================================================ */
    
    function initRevealAnimations() {
        const revealElements = document.querySelectorAll('.reveal-item');
        console.log(`👁️ Found ${revealElements.length} reveal elements`);
        
        if (revealElements.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });
        
        revealElements.forEach(el => {
            observer.observe(el);
        });
    }

    /* ============================================================
       13. NAVIGATION & SCRAMBLE
       ============================================================ */
    
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

    function initNavigation() {
        setupNavButtons();
        setTimeout(setupNavButtons, 100);

        // Scramble effect (Desktop only)
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
    }

    /* ============================================================
       14. MOBILE MENU
       ============================================================ */
    
    function initMobileMenu() {
        if (document.querySelector('.hamburger')) return;
        
        const hamburger = document.createElement('div');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        hamburger.setAttribute('aria-label', 'Toggle menu');
        
        if (elements.header) {
            elements.header.appendChild(hamburger);
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
            }, CONFIG.RESIZE_DEBOUNCE);
        });
    }

    /* ============================================================
       15. INITIALIZATION
       ============================================================ */
    
    function init() {
        console.log('🚀 About page initialized - Video will autoplay continuously');
        
        initPageTransition();
        initLogoAnimation();
        loadStaticVideo(); // ✅ Video forced autoplay included
        loadDynamicContent();
        initScrollEffects();
        initNavigation();
        initRevealAnimations();
        
        if (window.innerWidth <= 768) {
            initMobileMenu();
        }
    }

    /* ============================================================
       16. START APPLICATION
       ============================================================ */
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();