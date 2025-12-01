document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. GLOBAL VARS (BİRBAŞA BACKEND-Ə SORĞU VƏ LOCAL DƏSTƏYİ)
    // ============================================================
    
    let BACKEND_URL;
    let UPLOADS_BASE;
    
    // Əgər kod localda (localhost, 127.0.0.1) işləyirsə, local serveri istifadə et
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        BACKEND_URL = "http://localhost:8080"; // Local Spring Boot default portu
    } else {
        // Əks halda, deploy olunmuş serveri istifadə et
        BACKEND_URL = "https://cinechord-admin-production.up.railway.app"; 
    }
    
    // API Public Controller-ə yönləndirilir
    const SERVICES_API = `${BACKEND_URL}/api/service`; 
    
    // Uploads qovluğu da eyni backend-dən
    UPLOADS_BASE = `${BACKEND_URL}/uploads/`;
    
    // Yerdə qalan DOM elementləri
    const pageTransition = document.querySelector('.page-transition');
    
    // ICONS (dəyişmədi)
    const ICONS = { "COMMERCIAL SHOOTING": "fa-shopping-cart", "FILM SHOOTING": "fa-film", "DOCUMENTARY": "fa-video", "MUSIC VIDEOS": "fa-clapperboard" };


    // ============================================================
    // 1. NAVBAR & LOGO SCROLL LOGIC
    // ... (Qalan kod dəyişmir) ...
    // ============================================================
    let lastScroll = 0;
    const navbar = document.querySelector('.header');
    const logo = document.querySelector('.center-logo');

    setTimeout(() => { if (logo) logo.classList.add('entry-done'); }, 200);

    function handleScroll() {
        const currentScroll = window.scrollY;
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
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ============================================================
    // 2. SCROLL REVEAL (OBSERVER)
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

    const staticReveals = document.querySelectorAll('.services-title-container, .chat-section, .main-footer');
    staticReveals.forEach(el => {
        el.classList.add('reveal-item');
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

    document.querySelectorAll('.nav-btn, .footer-link, .cta-button, .chat-cta-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            
            if (!href || href === '#') return;
            if (href.startsWith('#')) return;

            e.preventDefault();
            navigateWithTransition(href);
        });
    });

    // Nav Scramble Effect (Mətn Dəyişmə)
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
    // 4. LOAD SERVICES (Dynamic Sections)
    // ============================================================
    
    // URL-i təmizləyən funksiya (ehtiyac varsa)
    function cleanUrlPath(url) {
        if (url && typeof url === 'string') {
            if (url.startsWith('http')) return url; 
            if (url.startsWith('/uploads/')) return url.substring('/uploads/'.length); 
            if (url.startsWith('uploads/')) return url.substring('uploads/'.length);
        }
        return url;
    }

    async function loadServices() {
        const container = document.getElementById("services-dynamic");
        if (!container) return;

        try {
            // API çağırışı tam URL-ə gedir
            const res = await fetch(SERVICES_API); 
            
            if (!res.ok) { 
                console.error(`HTTP Error! Status: ${res.status}`); 
                container.innerHTML = `<p style="color:red; text-align:center;">API-dən xəta alındı: Status ${res.status}</p>`;
                return; 
            }

            const pageData = await res.json();
            
            // Düzəliş: Yalnız 'content' arrayini götürün
            const services = pageData.content; 

            if (!services || !Array.isArray(services)) { 
                console.error("Fetched data is not an array:", pageData); 
                container.innerHTML = '<p style="color:red; text-align:center;">API-dən boş və ya səhv data formatı gəldi.</p>';
                return; 
            }

            const fragment = document.createDocumentFragment();

            services.forEach((service, index) => {
                let videoUrl = null;
                if (service.videoUrl && service.videoUrl.trim() !== "") {
                    let rawUrl = service.videoUrl.trim();
                    let cleanedUrl = cleanUrlPath(rawUrl);
                    
                    // Tam URL-i qururuq
                    videoUrl = UPLOADS_BASE + cleanedUrl; 
                }

                const iconClass = ICONS[service.title] || "fa-star";
                const bulletPoints = service.bulletPoints || [];
                const steps = service.processSteps || service.steps || [];

                const section = document.createElement('section');
                section.className = 'page-wrapper reveal-item'; 
                
                const leftVideo = (index % 2 === 0 && videoUrl) ? `
                    <div class="media-column"><div class="media-container"><div class="media-frame">
                    <video class="media-content" autoplay muted loop playsinline src="${videoUrl}" type="video/mp4"></video>
                    </div></div></div>` : "";

                const rightVideo = (index % 2 === 1 && videoUrl) ? `
                    <div class="media-column"><div class="media-container"><div class="media-frame">
                    <video class="media-content" autoplay muted loop playsinline src="${videoUrl}" type="video/mp4"></video>
                    </div></div></div>` : "";

                section.innerHTML = `
                    ${leftVideo}
                    <div class="content-column"><div class="content-wrapper">
                        <div class="service-header">
                            <div class="icon-container"><i class="fas ${iconClass}"></i></div>
                            <h2 class="service-title" data-text="${service.title}"><span>${service.title}</span></h2>
                        </div>
                        <p class="description">${service.description}</p>
                        <ul class="bullet-list">${bulletPoints.map(item => `<li>${item}</li>`).join("")}</ul>
                        <div class="divider"></div>
                        <ol class="numbered-list">${steps.map(step => `<li>${step}</li>`).join("")}</ol>
                        
                        <a href="../contact/" class="cta-button">CONTACT <i class="fas fa-long-arrow-alt-right"></i></a>
                    </div></div>
                    ${rightVideo}
                `;
                fragment.appendChild(section);
            });

            container.appendChild(fragment);
            
            // Scroll Reveal və Navigasiyanı yeni elementlərə tətbiq etmək
            requestAnimationFrame(() => {
                const newSections = container.querySelectorAll('.page-wrapper.reveal-item');
                newSections.forEach(el => observer.observe(el));
                
                document.querySelectorAll('.cta-button').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const href = btn.getAttribute('href');
                        if (!href) return;
                        e.preventDefault();
                        navigateWithTransition(href);
                    });
                });
            });
            
        } catch (err) { 
            console.error("Failed to load services:", err);
            container.innerHTML = `<p style="color:red; text-align:center;">Servislər yüklənərkən xəta baş verdi: ${err.message}</p>`; 
        }
    }

    if (pageTransition) {
        setTimeout(() => {
             pageTransition.classList.add('page-loaded'); 
        }, 100);
    }
    
    loadServices();
});