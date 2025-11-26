// ================================================================
// 1. KONFİQURASİYALAR
// ================================================================
const BACKEND_URL = "http://localhost:8080";
const ABOUT_API = BACKEND_URL + "/api/about/getAbout";
const UPDATE_ABOUT_API = BACKEND_URL + "/api/about/updateAbout";
const UPLOADS_BASE = BACKEND_URL + "/uploads/";

// DİQQƏT: Admin Panel HTML element ID-ləri (Lazımdırsa dəyişin!)
const ADMIN_ELEMENT_IDS = {
    MAIN_TITLE: 'aMainTitle', 
    SUB_TITLE: 'aSubTitle',   
    WHO_WE_ARE: 'aWho',       
    MISSION: 'aMission',      
    APPROACH: 'aApproach',    
    EMAIL: 'aEmail',
    PHONE: 'aPhone',
    ADDRESS: 'aAddress',
    VIDEO_FILE: 'aVideoFile', 
    SAVE_BUTTON: 'saveAboutBtn' // Update düyməsi ID-si
};

// ================================================================
// 2. MƏLUMATI YENİLƏYƏN FUNKSİYA (UPDATE - PUT)
// ================================================================

// *** BU, SİZİN ƏLAVƏ ETMƏLİ OLDUĞUNUZ ƏSAS FUNKSİYADIR ***
async function saveAbout() {
    // 1. FormData obyektinin yaradılması
    const formData = new FormData();
    
    // Mətn Sahələrinin Əlavə Edilməsi (Backend DTO sahələrinə uyğun adlarla)
    formData.append('mainTitle', document.getElementById(ADMIN_ELEMENT_IDS.MAIN_TITLE).value);
    formData.append('subTitle', document.getElementById(ADMIN_ELEMENT_IDS.SUB_TITLE).value);
    
    // Backend DTO-dakı 'whoWeAreText' adları ilə
    formData.append('whoWeAreText', document.getElementById(ADMIN_ELEMENT_IDS.WHO_WE_ARE).value); 
    formData.append('ourMissionText', document.getElementById(ADMIN_ELEMENT_IDS.MISSION).value);
    formData.append('ourApproachText', document.getElementById(ADMIN_ELEMENT_IDS.APPROACH).value);
    
    formData.append('email', document.getElementById(ADMIN_ELEMENT_IDS.EMAIL).value);
    formData.append('phone', document.getElementById(ADMIN_ELEMENT_IDS.PHONE).value);
    formData.append('address', document.getElementById(ADMIN_ELEMENT_IDS.ADDRESS).value);
    
    // 2. Video Faylının Əlavə Edilməsi
    const videoFileInput = document.getElementById(ADMIN_ELEMENT_IDS.VIDEO_FILE); 
    const videoFile = videoFileInput.files ? videoFileInput.files[0] : null;
    
    if (videoFile) {
        // Kontrollerdəki @RequestParam(value = "videoFile") ilə uyğun gəlir
        formData.append('videoFile', videoFile); 
    } 
    
    // Swal.fire({title: 'Məlumatlar Serverə Göndərilir...', didOpen: () => Swal.showLoading()});
    
    try {
        const res = await authFetch(UPDATE_ABOUT_API, { 
            method: 'PUT', // Backenddə @PutMapping istifadə etdiyiniz üçün
            body: formData, 
        });
        
        if(res.ok) {
            alert('Uğurlu! Məlumatlar yadda saxlanıldı.');
            loadAboutDataToAdminForm(); // Məlumatları yenilə
            videoFileInput.value = ""; 
        } else { 
            const errorText = await res.text();
            console.error('Server error:', errorText);
            alert(`Xəta: ${errorText}`);
        }
    } catch(e) { 
        console.error('Şəbəkə xətası:', e);
        alert('Gözlənilməyən şəbəkə xətası baş verdi.'); 
    }
}

// Məlumatları çəkib Admin Formuna doldurur
async function loadAboutDataToAdminForm() {
    try {
        const res = await fetch(ABOUT_API);
        if (!res.ok) {
            console.error(`HTTP Error! Status: ${res.status}`);
            return;
        }
        const data = await res.json();
        
        // Form sahələrini doldurur
        document.getElementById(ADMIN_ELEMENT_IDS.MAIN_TITLE).value = data.mainTitle || '';
        document.getElementById(ADMIN_ELEMENT_IDS.SUB_TITLE).value = data.subTitle || '';
        document.getElementById(ADMIN_ELEMENT_IDS.WHO_WE_ARE).value = data.whoWeAreText || '';
        document.getElementById(ADMIN_ELEMENT_IDS.MISSION).value = data.ourMissionText || '';
        document.getElementById(ADMIN_ELEMENT_IDS.APPROACH).value = data.ourApproachText || '';
        document.getElementById(ADMIN_ELEMENT_IDS.EMAIL).value = data.email || '';
        document.getElementById(ADMIN_ELEMENT_IDS.PHONE).value = data.phone || '';
        document.getElementById(ADMIN_ELEMENT_IDS.ADDRESS).value = data.address || '';
        
    } catch (err) {
        console.error('Failed to load about data into form:', err);
    }
}


// ================================================================
// 3. LOAD ABOUT DATA (DİNAMİK) - SİZİN GÖNDƏRDİYİNİZ ƏSL FAYL MƏNTİQİ
// ================================================================
async function loadAboutData() {
    try {
        const res = await fetch(ABOUT_API);
        
        if (!res.ok) {
            console.error(`HTTP Error! Status: ${res.status}`);
            return;
        }

        const data = await res.json();
        
        // --- VIDEO ---
        const video = document.getElementById('about-video');
        if (video && data.videoUrl) {
            let videoUrl = data.videoUrl.trim();
            if (videoUrl.startsWith('/uploads/')) {
                videoUrl = BACKEND_URL + videoUrl;
            } else if (videoUrl.startsWith('uploads/')) {
                videoUrl = BACKEND_URL + '/' + videoUrl;
            } else if (!videoUrl.startsWith('http')) {
                videoUrl = UPLOADS_BASE + data.videoUrl; // data.videoUrl istifadə edildi
            }
            video.querySelector('source').src = videoUrl;
            video.load();
            video.play().catch(err => console.log('Video autoplay error:', err));
        }

        // --- MAIN TITLE ---
        const mainTitle = document.getElementById('main-title');
        if (mainTitle && data.mainTitle) {
            const titleText = data.mainTitle.toUpperCase();
            mainTitle.setAttribute('data-text', titleText);
            mainTitle.querySelector('span').textContent = titleText;
        }

        // --- SUBTITLE ---
        const subtitle = document.getElementById('subtitle');
        if (subtitle && data.subTitle) {
            subtitle.textContent = data.subTitle;
        }

        // --- WHO WE ARE ---
        const whoWeAre = document.getElementById('who-we-are');
        if (whoWeAre && data.whoWeAreText) {
            whoWeAre.textContent = data.whoWeAreText;
        }

        // --- OUR MISSION ---
        const ourMission = document.getElementById('our-mission');
        if (ourMission && data.ourMissionText) {
            ourMission.textContent = data.ourMissionText;
        }

        // --- OUR APPROACH ---
        const ourApproach = document.getElementById('our-approach');
        if (ourApproach && data.ourApproachText) {
            ourApproach.textContent = data.ourApproachText;
        }

        // --- EMAIL ---
        const emailLink = document.getElementById('email-link');
        if (emailLink && data.email) {
            const emailUpper = data.email.toUpperCase();
            emailLink.href = `mailto:${data.email}`;
            emailLink.setAttribute('data-text', emailUpper);
            emailLink.querySelector('span').textContent = emailUpper;
        }

        // --- PHONE ---
        const phoneLink = document.getElementById('phone-link');
        if (phoneLink && data.phone) {
            phoneLink.href = `tel:${data.phone.replace(/\s/g, '')}`;
            phoneLink.setAttribute('data-text', data.phone);
            phoneLink.querySelector('span').textContent = data.phone;
        }

        // --- ADDRESS ---
        const address = document.getElementById('address');
        if (address && data.address) {
            address.textContent = data.address.toUpperCase();
        }

        console.log('About data loaded successfully');

    } catch (err) {
        console.error('Failed to load about data:', err);
    }
}


// ================================================================
// 4. NAVBAR & LOGO SCROLL LOGIC - SİZİN KODUNUZ
// ================================================================
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


// ================================================================
// 5. SCROLL REVEAL (FOCUS-IN) - SİZİN KODUNUZ
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

document.querySelectorAll('.reveal-item').forEach((el) => {
    observer.observe(el);
});


// ================================================================
// 6. PAGE TRANSITION - SİZİN KODUNUZ
// ================================================================
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


// ================================================================
// 7. SCRAMBLE EFFECT - SİZİN KODUNUZ
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
// 8. BAŞLANĞIC LOGİKASI
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Əsas səhifə üçün datanı çək
    loadAboutData(); 

    // Admin paneldəsinizsə (sizə məlumdursa), formanı doldurmaq üçün çağırın:
    // loadAboutDataToAdminForm();
    
    // Update düyməsini saveAbout funksiyasına bağlayın
    const saveBtn = document.getElementById(ADMIN_ELEMENT_IDS.SAVE_BUTTON);
    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            saveAbout();
        });
    }
});