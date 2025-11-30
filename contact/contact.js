document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. FLASH FIX & CONFIG
    // ============================================================
    const BACKEND_URL = "https://cinechord-admin-production.up.railway.app";
    const pageTransition = document.querySelector('.page-transition');
    if (pageTransition) {
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

    setTimeout(() => {
        if (logo) logo.classList.add('entry-done');
    }, 200);

    function handleScroll() {
        const currentScroll = window.scrollY;

        // Navbar Logic
        if (currentScroll > lastScroll && currentScroll > 50) {
            if (navbar) navbar.style.transform = 'translateY(-100%)';
        } else {
            if (navbar) navbar.style.transform = 'translateY(0)';
        }

        // Logo Logic
        if (currentScroll > 50) {
            if (logo) logo.classList.add('scroll-hidden');
        } else {
            if (logo) logo.classList.remove('scroll-hidden');
        }
        
        lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

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
    // 3. PROGRESS BAR
    // ============================================================
    const progressBar = document.querySelector('.progress-bar-top');
    if(progressBar) {
        window.addEventListener('scroll', () => {
            let scrollTop = window.scrollY;
            let docHeight = document.body.scrollHeight - window.innerHeight;
            let scrollPercent = scrollTop / docHeight;
            progressBar.style.width = (scrollPercent * 100) + '%';
        });
    }

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

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            if (!href || href === '#' || href.startsWith('#')) return;
            
            // Eyni səhifə
            if (href === window.location.pathname.split('/').pop()) return;
            
            e.preventDefault();
            navigateWithTransition(href);
        });
    });

    // ============================================================
    // 5. NAV SCRAMBLE EFFECT
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
    // 6. TEXTAREA AUTO RESIZE
    // ============================================================
    const textareas = document.querySelectorAll('.textarea-mode');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });

    // ============================================================
    // 7. FORM SUBMISSION
    // ============================================================
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnTextContainer = form.querySelector('.rolling-text-btn');
            const visibleSpan = btnTextContainer.querySelector('span');
            const originalText = "SEND MESSAGE";

            // Göndərilir... rejimi
            visibleSpan.textContent = 'SENDING...';
            btnTextContainer.setAttribute('data-text', 'SENDING...');
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value,
                subject: "Saytdan Müraciət",
                newsletter: document.getElementById('newsletter').checked
            };

            try {
                // ✅ DÜZƏLİŞ: Localhost silindi, Railway yazıldı
                const response = await fetch(`${BACKEND_URL}/api/createMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    // UĞURLU
                    visibleSpan.textContent = 'MESSAGE SENT!';
                    btnTextContainer.setAttribute('data-text', 'MESSAGE SENT!');
                    form.reset(); 
                    setTimeout(() => {
                        visibleSpan.textContent = originalText;
                        btnTextContainer.setAttribute('data-text', originalText);
                    }, 3000);
                } else {
                    throw new Error('Server cavabı uğursuz oldu');
                }
            } catch (error) {
                console.error('Fetch Xətası:', error);
                
                visibleSpan.textContent = 'ERROR! TRY AGAIN';
                btnTextContainer.setAttribute('data-text', 'ERROR! TRY AGAIN');
                
                setTimeout(() => {
                    visibleSpan.textContent = originalText;
                    btnTextContainer.setAttribute('data-text', originalText);
                }, 3000);
            }
        });
    }
});