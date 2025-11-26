// ================================================================
// 1. SERVICE PAGE ENTRY ANIMATION (GSAP - Works-dən Gətirildi)
// ================================================================

if (typeof gsap !== 'undefined') {
    
    // Header və Footer elementlərini GSAP ilə açırıq. 
    // Dinamik məzmun ('reveal-item' olanlar) Intersection Observer ilə açılacaq.
    const servicePageContent = [
        ".header", 
        ".main-footer"
    ];

    // Elementləri ilkin vəziyyətə gətir (50px aşağı və gizli)
    gsap.set(servicePageContent, { 
        y: 50, 
        autoAlpha: 0 
    });
    
    // Animasiyanı başla
    setTimeout(() => {
        gsap.to(servicePageContent, {
            y: 0, 
            autoAlpha: 1, 
            duration: 1.2, 
            stagger: 0.1, 
            ease: "power3.out" 
        });
    }, 100); 
}


// ================================================================
// 2. GLOBAL VARS & LISTENERS (Works-dən Gətirildi)
// ================================================================

let lastScroll = 0;
const navbar = document.querySelector('.header');
const logo = document.querySelector('.center-logo');

// Entry animasiya - Logo DAHA TEZ gəlsin (0.2s sonra)
setTimeout(() => {
    if (logo) logo.classList.add('entry-done');
}, 200);

function handleScroll() {
    const currentScroll = window.scrollY;

    // 1. Navbar Logic (Hide on down, Show on up)
    if (currentScroll > lastScroll && currentScroll > 50) {
        if (navbar) navbar.style.transform = 'translateY(-100%)';
    } else {
        if (navbar) navbar.style.transform = 'translateY(0)';
    }

    // 2. Logo Logic (Scroll edən kimi itir)
    if (currentScroll > 50) {
        if (logo) logo.classList.add('scroll-hidden');
    } else {
        if (logo) logo.classList.remove('scroll-hidden');
    }
    
    lastScroll = currentScroll;
}

window.addEventListener('scroll', handleScroll, { passive: true });


// ================================================================
// 3. SCROLL REVEAL (Mövcud kodunuz)
// ================================================================

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

// Səhifə yüklənərkən mövcud reveal-itemləri izləyir
document.querySelectorAll('.reveal-item').forEach((el) => {
    observer.observe(el);
});


// ================================================================
// 4. PROGRESS BAR & PAGE TRANSITION (Mövcud kodunuz)
// ================================================================

const progressBar = document.querySelector('.progress-bar-top');
if(progressBar) {
    window.addEventListener('scroll', () => {
        let scrollTop = window.scrollY;
        let docHeight = document.body.scrollHeight - window.innerHeight;
        let scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0; 
        progressBar.style.width = (scrollPercent * 100) + '%';
    });
}

function navigateWithTransition(href) {
    const pageTransition = document.querySelector('.page-transition');
    if (pageTransition) pageTransition.classList.add('active');
    setTimeout(() => { window.location.href = href; }, 600);
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const href = btn.getAttribute('href');
        if (!href || href === window.location.pathname.split('/').pop()) return;
        e.preventDefault();
        navigateWithTransition(href);
    });
});


// ================================================================
// 5. NAV SCRAMBLE EFFECT (Mövcud kodunuz)
// ================================================================

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
});


// ================================================================
// 6. DYNAMIC SERVICES LOADER (OPTİMAL - Donma problemi həll edildi)
// ================================================================

const BACKEND_URL = "http://localhost:8080";
const SERVICES_API = BACKEND_URL + "/admin/services/getAll"; 
const UPLOADS_BASE = BACKEND_URL + "/uploads/";

const ICONS = {
    "COMMERCIAL SHOOTING": "fa-shopping-cart",
    "FILM SHOOTING": "fa-film",
    "DOCUMENTARY": "fa-video",
    "MUSIC VIDEOS": "fa-clapperboard"
};

async function loadServices() {
    const container = document.getElementById("services-dynamic");
    if (!container) return;

    try {
        const res = await fetch(SERVICES_API);
        
        if (!res.ok) {
            console.error(`HTTP Error! Status: ${res.status}. Server URL: ${SERVICES_API}`);
            return; 
        }

        const services = await res.json();
        
        if (!Array.isArray(services)) {
            console.error("Fetched data is not a list/array:", services);
            return;
        }

        // ✅ DocumentFragment istifadə et - BİR DƏFƏ DOM-a əlavə et (donmanı aradan qaldırır)
        const fragment = document.createDocumentFragment();

        services.forEach((service, index) => {
            
            let videoUrl = null;
            if (service.videoUrl && service.videoUrl.trim() !== "") {
                let rawUrl = service.videoUrl.trim();
                if (rawUrl.startsWith('/uploads/')) {
                    videoUrl = BACKEND_URL + rawUrl;
                } else if (rawUrl.startsWith('uploads/')) {
                    videoUrl = BACKEND_URL + '/' + rawUrl;
                } else {
                    videoUrl = UPLOADS_BASE + rawUrl;
                }
            }

            const iconClass = ICONS[service.title] || "fa-star";
            const bulletPoints = service.bulletPoints || [];
            const steps = service.processSteps || service.steps || [];

            // ✅ Template element yarat
            const section = document.createElement('section');
            section.className = 'page-wrapper reveal-item';
            
            // Video sol tərəfdə (cüt index)
            const leftVideo = (index % 2 === 0 && videoUrl) ? `
                <div class="media-column">
                    <div class="media-container">
                        <div class="media-frame">
                            <video class="media-content" autoplay muted loop playsinline>
                                <source src="${videoUrl}" type="video/mp4">
                            </video>
                        </div>
                    </div>
                </div>
            ` : "";

            // Video sağ tərəfdə (tək index)
            const rightVideo = (index % 2 === 1 && videoUrl) ? `
                <div class="media-column">
                    <div class="media-container">
                        <div class="media-frame">
                            <video class="media-content" autoplay muted loop playsinline>
                                <source src="${videoUrl}" type="video/mp4">
                            </video>
                        </div>
                    </div>
                </div>
            ` : "";

            section.innerHTML = `
                ${leftVideo}

                <div class="content-column">
                    <div class="content-wrapper">

                        <div class="service-header">
                            <div class="icon-container">
                                <i class="fas ${iconClass}"></i>
                            </div>
                            <h2 class="service-title" data-text="${service.title}">
                                <span>${service.title}</span>
                            </h2>
                        </div>

                        <p class="description">${service.description}</p>

                        <ul class="bullet-list">
                            ${bulletPoints.map(item => `<li>${item}</li>`).join("")}
                        </ul>

                        <div class="divider"></div>

                        <ol class="numbered-list">
                            ${steps.map(step => `<li>${step}</li>`).join("")}
                        </ol>

                        <a href="../contact/contact.html" class="cta-button">
                            CONTACT <i class="fas fa-long-arrow-alt-right"></i>
                        </a>
                    </div>
                </div>

                ${rightVideo}
            `;

            // ✅ Fragment-ə əlavə et (DOM-a deyil!)
            fragment.appendChild(section);
        });

        // ✅ BİR DƏFƏ DOM-a əlavə et - bu reflow-u minimuma endirir
        container.appendChild(fragment);

        // ✅ requestAnimationFrame ilə observer-i tətbiq et (render bitdikdən sonra)
        requestAnimationFrame(() => {
            const newSections = container.querySelectorAll('.reveal-item');
            newSections.forEach(el => observer.observe(el));

            // PAGE TRANSITION TƏTBİQİ (Yeni CTA düymələri üçün)
            document.querySelectorAll('.cta-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const href = btn.getAttribute('href');
                    if (!href || href === window.location.pathname.split('/').pop()) return;
                    e.preventDefault();
                    navigateWithTransition(href);
                });
            });
        });

    } catch (err) {
        console.error("Failed to load services:", err);
    }
}

// Servisləri yükləyirik
loadServices();