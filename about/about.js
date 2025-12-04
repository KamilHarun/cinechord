/* ============================================================
   CineChord About - Main JavaScript
   Version: 5.1 - FIXED URL SYNCHRONIZATION
   ============================================================ */

(function() {
    'use strict';

    /* ============================================================
       1. CONFIGURATION - DINAMIK BACKEND URL
       ============================================================ */
    
    // 🔧 Dinamik Backend URL - Local və Production üçün uyğun
    const getBackendUrl = () => {
        // Localhost varsa, localhost-dan istifadə et (development)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080';
        }
        // Production - Railway server
        return 'https://cinechord-admin-production.up.railway.app';
    };
    
    const CONFIG = {
        BACKEND_URL: getBackendUrl(),
        ENDPOINTS: {
            ABOUT: '/api/about/getAbout'
        },
        STATIC_VIDEO: '../videos/Showreel.mp4', // Video STATİC
        SCROLL_THRESHOLD: 50,
        LOGO_ENTRY_DELAY: 500,
        PAGE_LOAD_DELAY: 100
    };

    console.log('🔌 Backend URL:', CONFIG.BACKEND_URL); // Debug

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const elements = {
        // Page elements
        pageTransition: document.querySelector('.page-transition'),
        centerLogo: document.querySelector('.center-logo'),
        header: document.querySelector('.header'),
        
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

    /* ============================================================
       3. INITIALIZATION
       ============================================================ */
    
    function init() {
        console.log('🚀 About page initialized');
        
        // 1. Page transition
        initPageTransition();
        
        // 2. Logo animation
        initLogoAnimation();
        
        // 3. Load STATIC video immediately
        loadStaticVideo();
        
        // 4. Load DYNAMIC content from API
        loadDynamicContent();
        
        // 5. Setup scroll effects
        initScrollEffects();
        
        // 6. Setup navigation
        setupNavigation();
        
        // 7. Mobile menu (yalnız mobile üçün)
        if (window.innerWidth <= 768) {
            initMobileMenu();
        }
        
        // 8. Reveal animations
        setTimeout(initRevealAnimations, 1000);
    }

    /* ============================================================
       4. PAGE TRANSITION
       ============================================================ */
    
    function initPageTransition() {
        if (elements.pageTransition) {
            setTimeout(() => {
                elements.pageTransition.classList.add('page-loaded');
                console.log('✅ Page transition complete');
            }, CONFIG.PAGE_LOAD_DELAY);
        }
    }

    /* ============================================================
       5. STATIC VIDEO LOADING
       ============================================================ */
    
    function loadStaticVideo() {
        if (elements.aboutVideo) {
            console.log('📹 Loading static video:', CONFIG.STATIC_VIDEO);
            elements.aboutVideo.src = CONFIG.STATIC_VIDEO;
            elements.aboutVideo.load();
            
            elements.aboutVideo.addEventListener('loadeddata', function() {
                console.log('✅ Static video loaded');
            });
            
            elements.aboutVideo.addEventListener('error', function(e) {
                console.error('❌ Video error:', e);
            });
        }
    }

    /* ============================================================
       6. DYNAMIC CONTENT LOADING (API)
       ============================================================ */
    
    async function loadDynamicContent() {
        console.log('🌐 Fetching dynamic content from API...');
        
        try {
            const apiUrl = `${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.ABOUT}?t=${Date.now()}`;
            console.log('🔗 API URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const apiData = await response.json();
            console.log('📦 API Response:', apiData);
            
            // Process data
            processApiData(apiData);
            
        } catch (error) {
            console.error('❌ API Error:', error);
            
            // Fallback content
            showFallbackContent();
        }
    }

    /* ============================================================
       7. PROCESS API DATA
       ============================================================ */
    
    function processApiData(data) {
        console.log('🔧 Processing API data...');
        
        // Format text: Replace \r\n with <br> for HTML
        function formatText(text) {
            if (!text) return '';
            return text.replace(/\r\n/g, '<br>');
        }
        
        const content = {
            // Titles
            mainTitle: data.mainTitle || "OUR STORY",
            subTitle: data.subTitle || "We create cinematic experiences", // əgər boşdursa default
            
            // Content sections
            whoWeAreText: formatText(data.whoWeAreText) || "CineChord is a creative production studio",
            ourMissionText: formatText(data.ourMissionText) || "Our mission is visual storytelling",
            ourApproachText: formatText(data.ourApproachText) || "We approach projects with creativity",
            
            // Contact info
            email: data.email || "cinechord@gmail.com",
            phone: data.phone || "+994 50 123 45 67",
            address: data.address || "Baku, Azerbaijan"
        };
        
        console.log('📝 Processed content:', content);
        
        // Populate HTML
        populateContent(content);
    }

    /* ============================================================
       8. POPULATE HTML CONTENT
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
                // Set href
                elements.emailLink.href = `mailto:${content.email}`;
                
                // Set data-text attribute for rolling effect
                elements.emailLink.setAttribute('data-text', emailUpper);
                
                // Find or create span inside emailLink
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
                // Set href
                elements.phoneLink.href = `tel:+${phoneDigits}`;
                
                // Set data-text attribute
                elements.phoneLink.setAttribute('data-text', content.phone);
                
                // Find or create span inside phoneLink
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
       9. FALLBACK CONTENT
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
       10. SCROLL REVEAL ANIMATIONS
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
       11. LOGO ANIMATION
       ============================================================ */
    
    function initLogoAnimation() {
        if (elements.centerLogo) {
            setTimeout(() => {
                elements.centerLogo.classList.add('entry-done');
                console.log('✅ Logo animation started');
            }, CONFIG.LOGO_ENTRY_DELAY);
        }
    }

    /* ============================================================
       12. SCROLL EFFECTS
       ============================================================ */
    
    function initScrollEffects() {
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', function() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            
            // Progress bar
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            const progressBar = document.querySelector('.progress-bar-top');
            if (progressBar) {
                progressBar.style.width = scrollPercent + '%';
            }
            
            // Logo hide/show
            if (elements.centerLogo) {
                if (scrollTop > CONFIG.SCROLL_THRESHOLD) {
                    elements.centerLogo.classList.add('scroll-hidden');
                } else {
                    elements.centerLogo.classList.remove('scroll-hidden');
                }
            }
            
            // Header hide/show
            if (elements.header) {
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    elements.header.style.transform = 'translateY(-100%)';
                } else {
                    elements.header.style.transform = 'translateY(0)';
                }
            }
            
            lastScrollTop = scrollTop;
        });
    }

    /* ============================================================
       13. NAVIGATION
       ============================================================ */
    
    function setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Skip if same page or anchor
                if (!href || href === '#' || href.includes('about')) {
                    return;
                }
                
                e.preventDefault();
                console.log('🔗 Navigating to:', href);
                
                // Elementi birbaşa tap (cache issue üçün)
                const transition = document.querySelector('.page-transition');
                
                if (transition) {
                    // Transition-u force et
                    transition.style.transition = 'transform 0.5s cubic-bezier(0.76, 0, 0.24, 1)';
                    transition.classList.remove('page-loaded');
                    // Force reflow
                    transition.offsetHeight;
                    transition.style.transform = 'translateY(0)';
                }
                
                // Navigate after transition
                setTimeout(() => {
                    window.location.href = href;
                }, 600);
            });
        });
    }

    /* ============================================================
       14. MOBILE MENU
       ============================================================ */
    
    function initMobileMenu() {
        console.log('📱 Initializing mobile menu');
        
        // Check if already exists
        if (document.querySelector('.hamburger')) {
            console.log('ℹ️  Mobile menu already exists');
            return;
        }
        
        // Create hamburger
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        hamburger.setAttribute('aria-label', 'Toggle menu');
        
        // Create mobile menu
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        
        // Clone nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const clone = btn.cloneNode(true);
            mobileMenu.appendChild(clone);
        });
        
        // Add to DOM
        document.body.appendChild(overlay);
        document.body.appendChild(mobileMenu);
        
        if (elements.header) {
            elements.header.appendChild(hamburger);
        }
        
        // Toggle function
        function toggleMenu() {
            const isActive = hamburger.classList.contains('active');
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = isActive ? '' : 'hidden';
        }
        
        // Event listeners
        hamburger.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
        
        // Close menu on link click
        mobileMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                toggleMenu();
            }
        });
        
        // Close on resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
        
        console.log('✅ Mobile menu initialized');
    }

    /* ============================================================
       15. DEBUG HELPER
       ============================================================ */
    
    function debugElements() {
        console.log('🔍 Debugging elements:');
        Object.keys(elements).forEach(key => {
            console.log(`${key}:`, elements[key] ? '✅ Found' : '❌ Not found');
        });
    }

    /* ============================================================
       16. START APPLICATION
       ============================================================ */
    
    // DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 DOM fully loaded');
            debugElements();
            init();
        });
    } else {
        console.log('⚡ DOM already loaded');
        debugElements();
        init();
    }

    // Global error handler
    window.addEventListener('error', function(e) {
        console.error('💥 Global error:', e.error);
    });

})();