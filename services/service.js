document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. FLASH FIX & ACTIVE NAV
    // ============================================================
    const pageTransition = document.querySelector('.page-transition');
    
    // Aktiv Navigasiyanı Təyin Etmək
    const currentPath = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-btn');
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        
        if (linkPath === currentPath) {
             link.classList.add('active');
        } else {
             if (currentPath === "" && linkPath === "index.html") {
                 link.classList.add('active');
             }
        }
    });

    if (pageTransition) {
        // DÜZƏLİŞ 2: Səhifə yüklənəndə pərdəni yuxarı çəkmək (Flash Fix üçün Wipe Up)
        // CSS-də pərdə tam ekranı örtür. Biz onu yuxarı çəkirik.
        setTimeout(() => {
             pageTransition.classList.add('page-loaded'); 
        }, 100);
    }
    
    // ============================================================
    // 1. NAVBAR & LOGO SCROLL LOGIC
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
    // 2. SCROLL REVEAL (OBSERVER) - "Our Service" Motion üçün
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

    // Statik elementləri (Başlıq, Chat, Footer) seç və animasiya ver
    const staticReveals = document.querySelectorAll('.services-title-container, .chat-section, .main-footer');
    staticReveals.forEach(el => {
        el.classList.add('reveal-item');
        observer.observe(el);
    });

    // ============================================================
    // 3. PAGE TRANSITION & NAV (Çıxış Effekti)
    // ============================================================
    function navigateWithTransition(href) {
        if (pageTransition) {
            // Səhifəni açan sinfi ləğv edirik ki, animasiya tətbiq olunsun
             pageTransition.classList.remove('page-loaded'); 
             pageTransition.style.transition = 'none';
             pageTransition.classList.add('active'); // CSS @keyframes işə salır (Wipe Down)
        }
        setTimeout(() => { window.location.href = href; }, 600); 
    }

    document.querySelectorAll('.nav-btn, .footer-link, .cta-button, .chat-cta-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            const linkPath = href.split('/').pop();
            const currentPath = window.location.pathname.split('/').pop();

            // Eyni səhifəyə və ya hashtag linklərə keçidi əngəllə
            if (!href || href === '#' || linkPath === currentPath) return;
            
            e.preventDefault();
            navigateWithTransition(href);
        });
    });

    // Nav Scramble
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
    const BACKEND_URL = "http://localhost:8080";
    const SERVICES_API = BACKEND_URL + "/admin/services/getAll"; 
    const UPLOADS_BASE = BACKEND_URL + "/uploads/";
    const ICONS = { "COMMERCIAL SHOOTING": "fa-shopping-cart", "FILM SHOOTING": "fa-film", "DOCUMENTARY": "fa-video", "MUSIC VIDEOS": "fa-clapperboard" };

    async function loadServices() {
        const container = document.getElementById("services-dynamic");
        if (!container) return;

        try {
            const res = await fetch(SERVICES_API);
            if (!res.ok) { console.error(`HTTP Error! Status: ${res.status}`); return; }

            const services = await res.json();
            if (!Array.isArray(services)) { console.error("Fetched data is not an array:", services); return; }

            const fragment = document.createDocumentFragment();

            services.forEach((service, index) => {
                let videoUrl = null;
                if (service.videoUrl && service.videoUrl.trim() !== "") {
                    let rawUrl = service.videoUrl.trim();
                    if (rawUrl.startsWith('/uploads/')) videoUrl = BACKEND_URL + rawUrl;
                    else if (rawUrl.startsWith('uploads/')) videoUrl = BACKEND_URL + '/' + rawUrl;
                    else videoUrl = UPLOADS_BASE + rawUrl;
                }

                const iconClass = ICONS[service.title] || "fa-star";
                const bulletPoints = service.bulletPoints || [];
                const steps = service.processSteps || service.steps || [];

                const section = document.createElement('section');
                section.className = 'page-wrapper reveal-item'; // Scroll reveal üçün
                
                const leftVideo = (index % 2 === 0 && videoUrl) ? `
                    <div class="media-column"><div class="media-container"><div class="media-frame">
                    <video class="media-content" autoplay muted loop playsinline><source src="${videoUrl}" type="video/mp4"></video>
                    </div></div></div>` : "";

                const rightVideo = (index % 2 === 1 && videoUrl) ? `
                    <div class="media-column"><div class="media-container"><div class="media-frame">
                    <video class="media-content" autoplay muted loop playsinline><source src="${videoUrl}" type="video/mp4"></video>
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
                        <a href="../contact/contact.html" class="cta-button">CONTACT <i class="fas fa-long-arrow-alt-right"></i></a>
                    </div></div>
                    ${rightVideo}
                `;
                fragment.appendChild(section);
            });

            container.appendChild(fragment);
            
            // Yeni yaranan elementləri observerə qoş
            requestAnimationFrame(() => {
                const newSections = container.querySelectorAll('.page-wrapper.reveal-item');
                newSections.forEach(el => observer.observe(el));
                
                // CTA Button Transition Listener
                document.querySelectorAll('.cta-button').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const href = btn.getAttribute('href');
                        if (!href || href === window.location.pathname.split('/').pop()) return;
                        e.preventDefault();
                        navigateWithTransition(href);
                    });
                });
            });
            
        } catch (err) { console.error("Failed to load services:", err); }
    }

    loadServices();
});