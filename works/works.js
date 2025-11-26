// works.js

document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // 0. Sabitlər və Köməkçi Məlumatlar (Sizin HTML-dən gətirilmiş və works.js-dəkilər)
    // ============================================================
    const API_BASE_URL = "http://localhost:8080"; 
    // Qeyd: İki fərqli API URL-i var, works.js-dəki admin/works/getAllWorks-i saxlayırıq.
    const API_WORKS = `${API_BASE_URL}/admin/works/getAllWorks`; 
    const UPLOADS_URL = `${API_BASE_URL}/uploads/`; 
    
    // Backend Enum-larını Frontend Class-larına çevirmək üçün
    const categoryMap = { 
        'FILM': 'films', 
        'COMMERCIAL': 'commercial', 
        'CLIP': 'clips' 
    };

    // HTML elementləri
    const container = document.getElementById('dynamic-projects-grid');
    const modal = document.getElementById('previewContainer');
    const videoEl = document.getElementById('previewVideo');
    const titleEl = document.getElementById('previewTitle');
    const loadingEl = document.querySelector('.video-loading');
    const closeBtn = document.getElementById('closePreview');

    // ============================================================
    // 1. KÖMƏKÇİ FUNKSİYA: URL-i təmizləmək
    // ============================================================
    // Backend-dən gələn URL `/uploads/faylinadi.mp4` formasındadırsa, 
    // bu funksiya onu sadəcə `faylinadi.mp4` edir (Əgər artıq təmizlənməyibsə).
    function cleanUrlPath(url) {
        if (url && typeof url === 'string') {
            // Yalnız tam path deyil, həm də /uploads/ hissəsi varsa təmizlə
            if (url.startsWith('/uploads/')) {
                return url.substring('/uploads/'.length); 
            }
            // Əgər tam path (http) deyilsə, lakin sadəcə fayl adıdırsa, olduğu kimi qaytar
            if (!url.startsWith('http') && url.includes('.')) {
                return url;
            }
        }
        return url; // Digər hallarda (null, undefined, tam http linki) olduğu kimi qaytar
    }


    // ============================================================
    // 2. İŞLƏRİ YÜKLƏMƏK (loadDynamicWorks)
    // ============================================================
    async function loadDynamicWorks() {
        if(!container) return;

        try {
            const response = await fetch(API_WORKS);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            const works = data.content ? data.content : data;

            container.innerHTML = ''; 

            if(works.length === 0) {
                container.innerHTML = '<p style="color:white; text-align:center; width:100%; margin-top:50px">Hələ ki, iş yoxdur.</p>';
                return;
            }

            works.forEach(work => {
                let videoSrc = work.previewVideoUrl || work.videoUrl;
                let imageSrc = work.imageUrl;
                
                // Kart üçün video URL (Preview və ya Əsas)
                if (videoSrc) {
                    videoSrc = cleanUrlPath(videoSrc);
                    if (!videoSrc.startsWith('http')) videoSrc = UPLOADS_URL + videoSrc;
                }

                // Kart üçün Poster URL
                if (imageSrc) {
                    imageSrc = cleanUrlPath(imageSrc);
                    if (!imageSrc.startsWith('http')) imageSrc = UPLOADS_URL + imageSrc;
                }

                const categoryClass = categoryMap[work.category] || 'other';

                // Əsas video URL-i (Modal üçün) - təmizlənmiş şəkildə ötürülür
                const mainVideoUrlForButton = cleanUrlPath(work.videoUrl);

                const workHTML = `
                    <div class="project-card" data-category="${categoryClass}">
                        <div class="project-image-container">
                            <video muted loop playsinline class="project-video" preload="metadata" poster="${imageSrc || ''}">
                                <source src="${videoSrc}" type="video/mp4">
                            </video>
                            <div class="card-overlay"></div>
                            <div class="card-info">
                                <h3 class="card-title">${work.title}</h3>
                                <p style="font-size: 12px; opacity: 0.7; margin-top: 5px;">${work.clientName || ''}</p>
                            </div>
                            <button class="fullscreen-btn" onclick="playMainVideo('${mainVideoUrlForButton}', '${work.title}')"></button>
                        </div>
                    </div>
                `;
                container.innerHTML += workHTML;
            });

            // Elementlər yarandıqdan sonra effektləri tətbiq edirik
            initScrollAnimations();
            attachHoverEffects();

        } catch (error) {
            console.error("Yüklənmə xətası:", error);
            container.innerHTML = '<p style="color:red; text-align:center;">Serverlə əlaqə xətası</p>';
        }
    }

    // ============================================================
    // 3. GLOBAL FUNKSİYALAR (HTML-dən çağırılanlar)
    // ============================================================
    
    // FİLTRASİYA
    window.filterWorks = function(category, btn) {
        if(btn) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        const cards = document.querySelectorAll('.project-card');
        cards.forEach(card => {
            const cardCat = card.getAttribute('data-category');
            if (category === 'all' || cardCat === category) {
                card.style.display = 'block';
                if (typeof gsap !== 'undefined') {
                    gsap.to(card, { opacity: 1, duration: 0.5 });
                } else {
                    card.style.opacity = 1;
                }
            } else {
                if (typeof gsap !== 'undefined') {
                    gsap.to(card, { opacity: 0, duration: 0.5, onComplete: () => card.style.display = 'none' });
                } else {
                    card.style.opacity = 0;
                    setTimeout(() => card.style.display = 'none', 500);
                }
            }
        });
    };

    // VİDEO PLAYER AÇMAQ (FULLSCREEN)
    window.playMainVideo = function(url, title) {
        if (!url) { alert("Video linki yoxdur"); return; }
        if (!modal || !videoEl || !titleEl) return;

        let finalUrl = cleanUrlPath(url);
        if (!finalUrl.startsWith('http')) finalUrl = UPLOADS_URL + finalUrl;

        titleEl.innerText = title;
        
        // Playeri sıfırla və aç
        videoEl.src = finalUrl; 
        modal.style.display = 'flex';
        if(loadingEl) loadingEl.style.display = 'block';

        setTimeout(() => {
            modal.classList.add('active');
             if (typeof gsap !== 'undefined') {
                 gsap.to(modal, { opacity: 1, duration: 0.5 });
             } else {
                 modal.style.opacity = 1;
             }

            videoEl.play().then(() => {
                if(loadingEl) loadingEl.style.display = 'none';
            }).catch(e => console.log("Video avtomatik oynatma xətası:", e));
        }, 100);
    };

    // ============================================================
    // 4. DAXİLİ MƏNTİQ (Hover, Modal Close, Scroll Animasiya)
    // ============================================================

    // Səhifə yüklənməsi animasiyası (GSAP)
    function initPageEntryAnimation() {
         const pageContent = [".header", ".hero-section", ".category-section", ".works-section", ".main-footer"];
         if (typeof gsap !== 'undefined') {
            gsap.set(pageContent, { y: 50, autoAlpha: 0 });
            setTimeout(() => {
                gsap.to(pageContent, {
                    y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.1, ease: "power3.out"
                });
            }, 100);
        }
    }


    function initScrollAnimations() {
        if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
            ScrollTrigger.batch(".project-card", {
                start: "top 85%",
                onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.15, duration: 0.8 })
            });
        }
    }

    // Kartların üzərinə gəlindikdə video oynatmaq
    function attachHoverEffects() {
        const cards = document.querySelectorAll('.project-card');
        cards.forEach(card => {
            const video = card.querySelector('video');
            if (video) {
                card.addEventListener('mouseenter', () => video.play().catch(()=>{}));
                card.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
            }
        });
    }

    // Modal Bağlamaq
    function closeVideoPlayer() {
        if (!modal || !videoEl) return;
        
        modal.classList.remove('active');

        if (typeof gsap !== 'undefined') {
             gsap.to(modal, { opacity: 0, duration: 0.5, onComplete: () => {
                videoEl.pause();
                videoEl.src = "";
                modal.style.display = 'none';
             }});
        } else {
            videoEl.pause();
            videoEl.src = "";
            modal.style.display = 'none';
        }
    }

    // Event Listenerlar
    if (closeBtn) {
        closeBtn.addEventListener('click', closeVideoPlayer);
    }
    
    // ============================================================
    // 5. BAŞLAMA NÖQTƏSİ
    // ============================================================

    // Səhifənin giriş animasiyasını işə sal
    initPageEntryAnimation();

    // Dinamik işləri yüklə
    loadDynamicWorks();
});