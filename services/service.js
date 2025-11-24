// 🎯 NAVBAR & LOGO SCROLL LOGIC
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

// Scroll listener
window.addEventListener('scroll', handleScroll, { passive: true });

// 🎯 SCROLL REVEAL (FOCUS-IN ANIMATION)
const observerOptions = {
    threshold: 0.15, // 15% görünəndə işə düşür
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Animasiya bir dəfə olsun
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal-item').forEach((el) => {
    observer.observe(el);
});

// 🎯 PROGRESS BAR
const progressBar = document.querySelector('.progress-bar-top');
if(progressBar) {
    window.addEventListener('scroll', () => {
        let scrollTop = window.scrollY;
        let docHeight = document.body.scrollHeight - window.innerHeight;
        let scrollPercent = scrollTop / docHeight;
        progressBar.style.width = (scrollPercent * 100) + '%';
    });
}

// 🎯 PAGE TRANSITION
function navigateWithTransition(href) {
    const pageTransition = document.querySelector('.page-transition');
    if (pageTransition) pageTransition.classList.add('active');
    setTimeout(() => { window.location.href = href; }, 600);
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const href = btn.getAttribute('href');
        if (href === window.location.pathname.split('/').pop()) return;
        e.preventDefault();
        navigateWithTransition(href);
    });
});

// 🎯 NAV SCRAMBLE EFFECT
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