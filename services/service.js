document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. STATİK SERVİS DATA (Backend çağırışı yoxdur)
    // ============================================================
    
    const SERVICES_DATA = [
        {
            title: "FILM SHOOTING",
            description: "Professional film production services with cinematic excellence",
            videoUrl: "../videos/we_create.mp4",
            bulletPoints: [
                "Creative storytelling",
                "Professional cinematography",
                "Post-production excellence"
            ],
            processSteps: [
                "Pre-production planning",
                "Principal photography",
                "Post-production & delivery"
            ]
        }
        // Başqa servislər əlavə et (video olmadan da olar)
    ];
    
    const ICONS = { 
        "COMMERCIAL SHOOTING": "fa-shopping-cart", 
        "FILM SHOOTING": "fa-film", 
        "DOCUMENTARY": "fa-video", 
        "MUSIC VIDEOS": "fa-clapperboard" 
    };

    // DOM elementləri
    const pageTransition = document.querySelector('.page-transition');
    
    // ============================================================
    // 1. NAVBAR & LOGO SCROLL LOGIC (saxla)
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
    // 2. SCROLL REVEAL (saxla)
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
    // 3. PAGE TRANSITION & NAV (saxla)
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
            if (!href || href === '#' || href.startsWith('#')) return;
            e.preventDefault();
            navigateWithTransition(href);
        });
    });

    // Nav Scramble Effect
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
    // 4. RENDER SERVICES (STATİK - Backend yoxdur)
    // ============================================================
    
    function renderServices() {
        const container = document.getElementById("services-dynamic");
        if (!container) {
            console.warn("services-dynamic container tapılmadı!");
            return;
        }

        console.log(`${SERVICES_DATA.length} servis render edilir`);

        const fragment = document.createDocumentFragment();

        SERVICES_DATA.forEach((service, index) => {
            const iconClass = ICONS[service.title] || "fa-star";
            const bulletPoints = service.bulletPoints || [];
            const steps = service.processSteps || [];
            const videoUrl = service.videoUrl || null;

            const section = document.createElement('section');
            section.className = 'page-wrapper reveal-item'; 
            
            const leftVideo = (index % 2 === 0 && videoUrl) ? `
                <div class="media-column"><div class="media-container"><div class="media-frame">
                <video class="media-content" autoplay muted loop playsinline src="${videoUrl}"></video>
                </div></div></div>` : "";

            const rightVideo = (index % 2 === 1 && videoUrl) ? `
                <div class="media-column"><div class="media-container"><div class="media-frame">
                <video class="media-content" autoplay muted loop playsinline src="${videoUrl}"></video>
                </div></div></div>` : "";

            section.innerHTML = `
                ${leftVideo}
                <div class="content-column"><div class="content-wrapper">
                    <div class="service-header">
                        <div class="icon-container"><i class="fas ${iconClass}"></i></div>
                        <h2 class="service-title" data-text="${service.title}"><span>${service.title}</span></h2>
                    </div>
                    <p class="description">${service.description || ''}</p>
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
        
        // Scroll Reveal
        requestAnimationFrame(() => {
            const newSections = container.querySelectorAll('.page-wrapper.reveal-item');
            newSections.forEach(el => observer.observe(el));
        });
    }

    // Page transition
    if (pageTransition) {
        setTimeout(() => {
             pageTransition.classList.add('page-loaded'); 
        }, 100);
    }
    
    // Servislər render et
    renderServices();
});