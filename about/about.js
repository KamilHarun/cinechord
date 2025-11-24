// 🎯 NAVBAR & LOGO SCROLL LOGIC
let lastScroll = 0;
const navbar = document.querySelector('.header');
const logo = document.querySelector('.center-logo');
const scrollContainer = document.querySelector('.content-section'); 

setTimeout(() => {
    if (logo) logo.classList.add('entry-done');
}, 500);

function handleScroll(e) {
    const currentScroll = e.target.scrollTop; 

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

if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
} else {
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 50) logo.classList.add('scroll-hidden');
        else logo.classList.remove('scroll-hidden');
    });
}

// 🎯 SCROLL REVEAL (FOCUS-IN)
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

// 🎯 SCRAMBLE EFFECT 
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

// Video Autoplay
document.addEventListener('DOMContentLoaded', function() {
    const video = document.querySelector('.fullscreen-video');
    if (video) {
        video.play().catch(err => console.log('Video error:', err));
    }
});