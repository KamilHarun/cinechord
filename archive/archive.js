/* ============================================================
   CineChord Archive - Main JavaScript
   Version: 2.5 - FULLY OPTIMIZED
   Description: Professional archive system with complete features
   Author: Kamil
   ============================================================ */

(function() {
    'use strict';

    /* ============================================================
       1. CONFIGURATION & CONSTANTS
       ============================================================ */
    
    // Backend configuration - Railway production server
    const CONFIG = {
        BACKEND_URL: 'https://cinechord-admin-production.up.railway.app',
        ENDPOINTS: {
            ARCHIVE: '/api/archive'
        },
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        REQUEST_TIMEOUT: 15000,
        SCROLL_THROTTLE: 16, // 60fps
        NAVBAR_HIDE_THRESHOLD: 200,
        LOGO_HIDE_THRESHOLD: 100
    };

    // Build complete API URLs
    const API_URLS = {
        ARCHIVE: `${CONFIG.BACKEND_URL}${CONFIG.ENDPOINTS.ARCHIVE}`,
        UPLOADS: `${CONFIG.BACKEND_URL}/uploads/`
    };

    // Backend to Frontend category mapping
    const CATEGORY_MAP = {
        'FILM': 'FILM',
        'COMMERCIAL': 'COMMERCIAL',
        'CLIP': 'CLIP',
        'MUSIC_VIDEO': 'MUSIC VIDEO',
        'DOCUMENTARY': 'DOCUMENTARY',
        'SOCIAL': 'SOCIAL'
    };

    /* ============================================================
       2. DOM ELEMENT REFERENCES
       ============================================================ */
    
    const elements = {
        // Table elements
        tableBody: document.querySelector('.archive-table tbody'),
        
        // Video preview modal elements
        previewContainer: document.getElementById('previewContainer'),
        videoElement: document.getElementById('previewVideo'),
        previewTitle: document.getElementById('previewTitle'),
        previewMeta: document.getElementById('previewMeta'),
        videoLoading: document.querySelector('.video-loading'),
        closeButton: document.getElementById('closePreview'),
        
        // Video control elements
        playPauseBtn: document.getElementById('playPauseBtn'),
        playIcon: document.getElementById('playIcon'),
        pauseIcon: document.getElementById('pauseIcon'),
        skipBackBtn: document.getElementById('skipBackBtn'),
        skipForwardBtn: document.getElementById('skipForwardBtn'),
        muteBtn: document.getElementById('muteBtn'),
        volumeIcon: document.getElementById('volumeIcon'),
        muteIcon: document.getElementById('muteIcon'),
        volumeSlider: document.getElementById('volumeSlider'),
        speedBtn: document.getElementById('speedBtn'),
        fullscreenBtn: document.getElementById('fullscreenBtn'),
        progressSlider: document.getElementById('progressSlider'),
        progressPlayed: document.getElementById('progressPlayed'),
        progressBuffered: document.getElementById('progressBuffered'),
        currentTimeDisplay: document.getElementById('currentTime'),
        durationTimeDisplay: document.getElementById('durationTime'),
        
        // Page elements
        pageTransition: document.querySelector('.page-transition'),
        progressBarTop: document.querySelector('.progress-bar-top'),
        centerLogo: document.querySelector('.center-logo'),
        header: document.querySelector('.header')
    };

    // Scroll state tracking
    let lastScrollTop = 0;
    let isScrolling = false;

    /* ============================================================
       3. UTILITY FUNCTIONS
       ============================================================ */
    
    /**
     * Throttle function calls for performance
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Throttled function
     */
    function throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = new Date().getTime();
            if (now - lastCall < delay) return;
            lastCall = now;
            return func(...args);
        };
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Clean URL path by removing duplicate /uploads/ prefix
     * @param {string} url - URL to clean
     * @returns {string} Cleaned URL
     */
    function cleanUrlPath(url) {
        if (!url || typeof url !== 'string') return url;
        
        // If it's already a full URL, return as is
        if (url.startsWith('http')) return url;
        
        // Remove /uploads/ prefix if exists
        return url.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
    }

    /**
     * Build complete video URL from relative path
     * @param {string} videoUrl - Relative or absolute video URL
     * @returns {string|null} Complete video URL or null
     */
    function getFullVideoUrl(videoUrl) {
        if (!videoUrl) return null;
        
        const url = videoUrl.trim();
        
        // If already a full URL, return as is
        if (url.startsWith('http')) return url;
        
        // Clean the URL and prepend uploads base URL
        const cleanedUrl = cleanUrlPath(url);
        return API_URLS.UPLOADS + cleanedUrl;
    }

    /**
     * Format time in MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Fetch with timeout support
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise} Fetch promise
     */
    function fetchWithTimeout(url, options = {}, timeout = CONFIG.REQUEST_TIMEOUT) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }

    /**
     * Retry fetch with exponential backoff
     * @param {Function} fetchFn - Fetch function to retry
     * @param {number} attempts - Number of retry attempts
     * @returns {Promise} Result of fetch
     */
    async function retryFetch(fetchFn, attempts = CONFIG.RETRY_ATTEMPTS) {
        let lastError;
        
        for (let i = 0; i < attempts; i++) {
            try {
                return await fetchFn();
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${i + 1} failed:`, error.message);
                
                if (i < attempts - 1) {
                    // Exponential backoff
                    const delay = CONFIG.RETRY_DELAY * Math.pow(2, i);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /* ============================================================
       4. SCROLL EFFECTS
       ============================================================ */
    
    /**
     * Update scroll progress bar
     */
    function updateScrollProgress() {
        if (!elements.progressBarTop) return;
        
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        elements.progressBarTop.style.width = Math.min(scrolled, 100) + '%';
    }

    /**
     * Handle center logo visibility on scroll
     */
    function handleLogoScroll() {
        if (!elements.centerLogo) return;
        
        const scrollTop = window.pageYOffset;
        
        if (scrollTop > CONFIG.LOGO_HIDE_THRESHOLD) {
            elements.centerLogo.classList.add('scroll-hidden');
        } else {
            elements.centerLogo.classList.remove('scroll-hidden');
        }
    }

    /**
     * Handle navbar show/hide on scroll
     */
    function handleNavbarScroll() {
        if (!elements.header) return;
        
        const currentScroll = window.pageYOffset;
        
        // Don't hide navbar at the top of the page
        if (currentScroll <= 0) {
            elements.header.classList.remove('navbar-hide');
            elements.header.classList.add('navbar-show');
            lastScrollTop = currentScroll;
            return;
        }
        
        // Hide navbar when scrolling down, show when scrolling up
        if (currentScroll > lastScrollTop && currentScroll > CONFIG.NAVBAR_HIDE_THRESHOLD) {
            // Scrolling down
            elements.header.classList.add('navbar-hide');
            elements.header.classList.remove('navbar-show');
        } else {
            // Scrolling up
            elements.header.classList.remove('navbar-hide');
            elements.header.classList.add('navbar-show');
        }
        
        lastScrollTop = currentScroll;
    }

    /**
     * Combined scroll handler (throttled)
     */
    const handleScroll = throttle(() => {
        updateScrollProgress();
        handleLogoScroll();
        handleNavbarScroll();
    }, CONFIG.SCROLL_THROTTLE);

    /**
     * Initialize scroll effects
     */
    function initScrollEffects() {
        window.addEventListener('scroll', handleScroll);
        
        // Initial call
        updateScrollProgress();
        handleLogoScroll();
        handleNavbarScroll();
        
        console.log('✅ Scroll effects initialized');
    }

    /* ============================================================
       5. PAGE TRANSITION SYSTEM
       ============================================================ */
    
    /**
     * Initialize page transition effect
     */
    function initPageTransition() {
        if (!elements.pageTransition) return;
        
        // Remove transition on page load
        setTimeout(() => {
            elements.pageTransition.classList.add('page-loaded');
        }, 100);
    }

    /**
     * Navigate to another page with transition effect
     * @param {string} href - Target URL
     */
    function navigateWithTransition(href) {
        if (!elements.pageTransition) {
            window.location.href = href;
            return;
        }
        
        elements.pageTransition.classList.remove('page-loaded');
        elements.pageTransition.style.transition = 'none';
        elements.pageTransition.classList.add('active');
        
        setTimeout(() => {
            window.location.href = href;
        }, 600);
    }

    /* ============================================================
       6. DATA LOADING FROM BACKEND
       ============================================================ */
    
    /**
     * Load archive data from backend API
     */
    async function loadArchiveData() {
        if (!elements.tableBody) {
            console.error('Table body element not found');
            return;
        }

        // Show loading state with smooth animation
        elements.tableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="7" style="text-align: center; padding: 60px 20px; opacity: 0; animation: fadeIn 0.3s ease forwards;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #FFA500; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div style="margin-top: 15px; font-size: 13px;">Məlumatlar yüklənir...</div>
                    <div style="margin-top: 5px; font-size: 11px; opacity: 0.5;">Serverlə əlaqə qurulur</div>
                </td>
            </tr>
        `;

        try {
            console.log('📡 Connecting to backend:', API_URLS.ARCHIVE);
            const startTime = performance.now();

            // Fetch archive data with retry logic and progress tracking
            const response = await retryFetch(() => 
                fetchWithTimeout(API_URLS.ARCHIVE, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
            );

            const fetchTime = ((performance.now() - startTime) / 1000).toFixed(2);
            console.log(`⏱️ Server response time: ${fetchTime}s`);

            // Check response status
            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            // Parse JSON response
            const data = await response.json();
            
            // Extract works array (handle both paginated and direct array responses)
            const works = Array.isArray(data) ? data : (data.content || []);

            console.log(`✅ Successfully loaded ${works.length} works from archive`);

            // Clear table with fade out
            const loadingRow = elements.tableBody.querySelector('.loading-row');
            if (loadingRow) {
                loadingRow.style.opacity = '0';
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            elements.tableBody.innerHTML = '';

            // Check if works exist
            if (works.length === 0) {
                elements.tableBody.innerHTML = `
                    <tr style="animation: fadeIn 0.5s ease;">
                        <td colspan="7" style="text-align: center; padding: 60px 20px; opacity: 0.5;">
                            <div style="font-size: 48px; margin-bottom: 15px;">📁</div>
                            <div style="font-size: 14px;">Hələ ki, arxivdə iş yoxdur</div>
                        </td>
                    </tr>
                `;
                return;
            }

            // Use requestAnimationFrame to prevent UI blocking
            const batchSize = 10; // Process 10 rows at a time
            let currentIndex = 0;

            function processBatch() {
                const batch = works.slice(currentIndex, currentIndex + batchSize);
                
                batch.forEach((work, index) => {
                    const globalIndex = currentIndex + index;
                    const videoUrl = getFullVideoUrl(work.videoUrl);
                    const previewUrl = getFullVideoUrl(work.previewVideoUrl);
                    
                    // Priority: previewVideoUrl > videoUrl
                    const videoSrc = previewUrl || videoUrl || '';
                    
                    // Create table row
                    const row = document.createElement('tr');
                    
                    // Set data attributes for video playback
                    row.setAttribute('data-video', videoSrc);
                    row.setAttribute('data-title', work.title || '');
                    row.setAttribute('data-client', work.clientName || '');
                    row.setAttribute('data-category', work.category || '');
                    row.setAttribute('data-year', work.productionYear || '');
                    
                    // Get display category
                    const categoryDisplay = CATEGORY_MAP[work.category] || work.category || '-';
                    
                    // Build row HTML
                    row.innerHTML = `
                        <td class="number-col">${String(globalIndex + 1).padStart(2, '0')}</td>
                        <td class="client-col" data-original="${work.clientName || '-'}">${work.clientName || '-'}</td>
                        <td class="title-col" data-original="${work.title || 'Untitled'}">${work.title || 'Untitled'}</td>
                        <td class="type-col" data-original="${categoryDisplay}">${categoryDisplay}</td>
                        <td class="location-col" data-original="${work.location || '-'}">${work.location || '-'}</td>
                        <td class="agency-col" data-original="${work.agency || '-'}">${work.agency || '-'}</td>
                        <td class="year-col" data-original="${work.productionYear || '-'}">${work.productionYear || '-'}</td>
                    `;
                    
                    elements.tableBody.appendChild(row);
                });
                
                currentIndex += batchSize;
                
                // If there are more rows to process, schedule next batch
                if (currentIndex < works.length) {
                    requestAnimationFrame(processBatch);
                } else {
                    // All rows processed, initialize animations and effects
                    initTableAnimations();
                    attachTableRowEffects();
                    
                    const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
                    console.log(`🎉 Table rendered in ${totalTime}s (${works.length} rows)`);
                }
            }
            
            // Start processing batches
            requestAnimationFrame(processBatch);

        } catch (error) {
            console.error('❌ Archive loading error:', error);
            
            // Show user-friendly error message with fade in
            elements.tableBody.innerHTML = `
                <tr style="animation: fadeIn 0.5s ease;">
                    <td colspan="7" style="text-align: center; padding: 60px 20px;">
                        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                        <div style="color: #FFA500; margin-bottom: 10px; font-size: 16px; font-weight: 600;">Xəta baş verdi</div>
                        <div style="opacity: 0.6; font-size: 12px; margin-bottom: 20px; max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.6;">
                            ${error.message === 'Request timeout' 
                                ? 'Server cavab vermək üçün çox uzun müddət tələb edir. İnternet bağlantınızı yoxlayın.'
                                : 'Serverə qoşulma uğursuz oldu. Xahiş edirik bir az sonra yenidən cəhd edin.'}
                        </div>
                        <button onclick="location.reload()" style="padding: 12px 24px; background: #FFA500; border: none; border-radius: 25px; color: #000; cursor: pointer; font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; letter-spacing: 1px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(255, 165, 0, 0.3);" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            🔄 YENİDƏN YÜKLƏ
                        </button>
                        <div style="margin-top: 20px; font-size: 10px; opacity: 0.4;">
                            Error: ${error.message}
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    /* ============================================================
       7. TABLE ANIMATIONS
       ============================================================ */
    
    /**
     * Initialize intersection observer for table row animations
     */
    function initTableAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Stagger animation with delay
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 50);
                    
                    // Stop observing after animation
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all table rows
        document.querySelectorAll('.archive-table tbody tr').forEach(row => {
            observer.observe(row);
        });
    }

    /* ============================================================
       8. TABLE ROW EFFECTS
       ============================================================ */
    
    /**
     * Attach scramble effect and click handlers to table rows
     */
    function attachTableRowEffects() {
        const rows = document.querySelectorAll('.archive-table tbody tr');
        const scrambleLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const preserveChars = 'ƏəŞşÜüİıÖöĞğÇç ';

        rows.forEach(row => {
            // Prepare cells for scramble effect
            const cells = row.querySelectorAll('td:not(.number-col)');
            cells.forEach(cell => {
                const originalText = cell.getAttribute('data-original') || cell.textContent;
                cell.setAttribute('data-original', originalText);
                
                // Wrap each character in span for animation
                cell.innerHTML = originalText.split('').map(char => 
                    char === ' ' ? ' ' : `<span>${char}</span>`
                ).join('');
            });

            // Scramble effect on hover
            row.addEventListener('mouseenter', function() {
                const hoverCells = this.querySelectorAll('td:not(.number-col)');
                
                hoverCells.forEach(cell => {
                    const spans = cell.querySelectorAll('span');
                    const originalText = cell.getAttribute('data-original') || '';
                    
                    let iteration = 0;
                    const interval = setInterval(() => {
                        spans.forEach((span, index) => {
                            const originalChar = originalText[index];
                            
                            if (index < iteration) {
                                // Show original character
                                span.textContent = originalChar;
                            } else if (preserveChars.includes(originalChar)) {
                                // Preserve special characters
                                span.textContent = originalChar;
                            } else {
                                // Show random character
                                span.textContent = scrambleLetters[Math.floor(Math.random() * scrambleLetters.length)];
                            }
                        });
                        
                        iteration += 1 / 2.5;
                        
                        if (iteration >= originalText.length) {
                            clearInterval(interval);
                        }
                    }, 30);
                    
                    // Store interval for cleanup
                    cell.dataset.scrambleInterval = interval;
                });
            });

            // Reset on mouse leave
            row.addEventListener('mouseleave', function() {
                const cells = this.querySelectorAll('td:not(.number-col)');
                cells.forEach(cell => {
                    // Clear any running intervals
                    if (cell.dataset.scrambleInterval) {
                        clearInterval(parseInt(cell.dataset.scrambleInterval));
                    }
                    
                    // Reset to original text
                    const originalText = cell.getAttribute('data-original') || '';
                    const spans = cell.querySelectorAll('span');
                    spans.forEach((span, index) => {
                        span.textContent = originalText[index] || '';
                    });
                });
            });

            // Open video preview on click
            row.addEventListener('click', function() {
                const videoSrc = this.getAttribute('data-video');
                const title = this.getAttribute('data-title');
                const client = this.getAttribute('data-client');
                const category = this.getAttribute('data-category');
                const year = this.getAttribute('data-year');

                if (!videoSrc || videoSrc === '') {
                    console.warn('No video URL available for this work');
                    return;
                }

                openVideoPreview(videoSrc, title, client, category, year);
            });
        });
    }

    /* ============================================================
       9. VIDEO PREVIEW MODAL
       ============================================================ */
    
    /**
     * Open video preview modal
     * @param {string} videoUrl - Video URL to play
     * @param {string} title - Video title
     * @param {string} client - Client name
     * @param {string} category - Video category
     * @param {string} year - Production year
     */
    function openVideoPreview(videoUrl, title, client, category, year) {
        if (!elements.previewContainer || !elements.videoElement) {
            console.error('Preview container elements not found');
            return;
        }

        // Show loading spinner
        if (elements.videoLoading) {
            elements.videoLoading.style.display = 'block';
        }

        // Set video source
        elements.videoElement.src = videoUrl;
        
        // Set video information
        if (elements.previewTitle) {
            elements.previewTitle.textContent = `${client} - ${title}`;
        }
        
        if (elements.previewMeta) {
            const categoryDisplay = CATEGORY_MAP[category] || category;
            elements.previewMeta.textContent = `${categoryDisplay} • ${year}`;
        }

        // Reset playback speed
        if (elements.speedBtn) {
            elements.speedBtn.textContent = '1x';
            elements.videoElement.playbackRate = 1;
        }

        // Video ready handler
        elements.videoElement.oncanplay = function() {
            if (elements.videoLoading) {
                elements.videoLoading.style.display = 'none';
            }
        };

        // Video error handler
        elements.videoElement.onerror = function() {
            if (elements.videoLoading) {
                elements.videoLoading.style.display = 'none';
            }
            console.error('Video loading error:', videoUrl);
            alert('Video yüklənmə xətası. Xahiş edirik bir az sonra yenidən cəhd edin.');
        };

        // Show modal with slight delay for smooth animation
        setTimeout(() => {
            elements.previewContainer.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Attempt autoplay
            elements.videoElement.play().catch(err => {
                console.log('Autoplay prevented by browser:', err.message);
            });
        }, 10);
        
        console.log('🎬 Video opened:', title);
    }

    /**
     * Close video preview modal
     */
    function closeVideoPreview() {
        if (!elements.previewContainer || !elements.videoElement) return;

        // Hide modal
        elements.previewContainer.classList.remove('active');
        document.body.style.overflow = '';
        
        // Pause and reset video after animation
        setTimeout(() => {
            elements.videoElement.pause();
            elements.videoElement.currentTime = 0;
            elements.videoElement.src = '';
        }, 600);
        
        console.log('⏹️ Video closed');
    }

    /* ============================================================
       10. VIDEO PLAYER CONTROLS
       ============================================================ */
    
    /**
     * Initialize all video player controls
     */
    function initVideoControls() {
        if (!elements.videoElement) return;

        // Play/Pause button
        if (elements.playPauseBtn) {
            elements.playPauseBtn.addEventListener('click', () => {
                if (elements.videoElement.paused) {
                    elements.videoElement.play();
                } else {
                    elements.videoElement.pause();
                }
            });
        }

        // Skip backward button (10 seconds)
        if (elements.skipBackBtn) {
            elements.skipBackBtn.addEventListener('click', () => {
                elements.videoElement.currentTime = Math.max(0, elements.videoElement.currentTime - 10);
            });
        }

        // Skip forward button (10 seconds)
        if (elements.skipForwardBtn) {
            elements.skipForwardBtn.addEventListener('click', () => {
                elements.videoElement.currentTime = Math.min(
                    elements.videoElement.duration,
                    elements.videoElement.currentTime + 10
                );
            });
        }

        // Mute/Unmute button
        if (elements.muteBtn) {
            elements.muteBtn.addEventListener('click', () => {
                elements.videoElement.muted = !elements.videoElement.muted;
                updateMuteButton();
            });
        }

        // Volume slider
        if (elements.volumeSlider) {
            elements.volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                elements.videoElement.volume = volume;
                elements.videoElement.muted = volume === 0;
                updateMuteButton();
            });
        }

        // Playback speed button
        if (elements.speedBtn) {
            const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
            let currentSpeedIndex = 2; // Start at 1x

            elements.speedBtn.addEventListener('click', () => {
                currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
                const newSpeed = speeds[currentSpeedIndex];
                elements.videoElement.playbackRate = newSpeed;
                elements.speedBtn.textContent = `${newSpeed}x`;
            });
        }

        // Fullscreen button
        if (elements.fullscreenBtn) {
            elements.fullscreenBtn.addEventListener('click', () => {
                if (elements.videoElement.requestFullscreen) {
                    elements.videoElement.requestFullscreen();
                } else if (elements.videoElement.webkitRequestFullscreen) {
                    elements.videoElement.webkitRequestFullscreen();
                } else if (elements.videoElement.mozRequestFullScreen) {
                    elements.videoElement.mozRequestFullScreen();
                }
            });
        }

        // Progress bar
        if (elements.progressSlider) {
            elements.progressSlider.addEventListener('input', (e) => {
                const time = (e.target.value / 100) * elements.videoElement.duration;
                elements.videoElement.currentTime = time;
            });
        }

        // Update controls on video events
        elements.videoElement.addEventListener('play', updatePlayPauseButton);
        elements.videoElement.addEventListener('pause', updatePlayPauseButton);
        elements.videoElement.addEventListener('timeupdate', updateProgress);
        elements.videoElement.addEventListener('loadedmetadata', updateDuration);
        elements.videoElement.addEventListener('progress', updateBuffered);
        
        console.log('✅ Video controls initialized');
    }

    /**
     * Update play/pause button icon
     */
    function updatePlayPauseButton() {
        if (!elements.videoElement) return;

        if (elements.videoElement.paused) {
            if (elements.playIcon) elements.playIcon.style.display = 'block';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'none';
        } else {
            if (elements.playIcon) elements.playIcon.style.display = 'none';
            if (elements.pauseIcon) elements.pauseIcon.style.display = 'block';
        }
    }

    /**
     * Update mute button icon
     */
    function updateMuteButton() {
        if (!elements.videoElement) return;

        if (elements.videoElement.muted || elements.videoElement.volume === 0) {
            if (elements.volumeIcon) elements.volumeIcon.style.display = 'none';
            if (elements.muteIcon) elements.muteIcon.style.display = 'block';
        } else {
            if (elements.volumeIcon) elements.volumeIcon.style.display = 'block';
            if (elements.muteIcon) elements.muteIcon.style.display = 'none';
        }
    }

    /**
     * Update progress bar
     */
    function updateProgress() {
        if (!elements.videoElement || !elements.progressSlider) return;

        const progress = (elements.videoElement.currentTime / elements.videoElement.duration) * 100;
        elements.progressSlider.value = progress || 0;
        
        if (elements.progressPlayed) {
            elements.progressPlayed.style.width = `${progress}%`;
        }

        if (elements.currentTimeDisplay) {
            elements.currentTimeDisplay.textContent = formatTime(elements.videoElement.currentTime);
        }
    }

    /**
     * Update duration display
     */
    function updateDuration() {
        if (!elements.videoElement || !elements.durationTimeDisplay) return;

        elements.durationTimeDisplay.textContent = formatTime(elements.videoElement.duration);
    }

    /**
     * Update buffered progress
     */
    function updateBuffered() {
        if (!elements.videoElement || !elements.progressBuffered) return;

        if (elements.videoElement.buffered.length > 0) {
            const buffered = elements.videoElement.buffered.end(elements.videoElement.buffered.length - 1);
            const duration = elements.videoElement.duration;
            const bufferedPercent = (buffered / duration) * 100;
            elements.progressBuffered.style.width = `${bufferedPercent}%`;
        }
    }

    /* ============================================================
       11. KEYBOARD SHORTCUTS
       ============================================================ */
    
    /**
     * Initialize keyboard shortcuts for video player
     */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only work when video modal is open
            if (!elements.previewContainer?.classList.contains('active')) return;
            
            // Prevent default for handled keys
            const handledKeys = ['Space', 'ArrowLeft', 'ArrowRight', 'KeyF', 'KeyM', 'Escape'];
            if (handledKeys.includes(e.code)) {
                e.preventDefault();
            }

            switch(e.code) {
                case 'Space':
                    // Play/Pause
                    if (elements.videoElement.paused) {
                        elements.videoElement.play();
                    } else {
                        elements.videoElement.pause();
                    }
                    break;
                    
                case 'ArrowLeft':
                    // Skip backward 5 seconds
                    elements.videoElement.currentTime = Math.max(0, elements.videoElement.currentTime - 5);
                    break;
                    
                case 'ArrowRight':
                    // Skip forward 5 seconds
                    elements.videoElement.currentTime = Math.min(
                        elements.videoElement.duration,
                        elements.videoElement.currentTime + 5
                    );
                    break;
                    
                case 'KeyF':
                    // Fullscreen
                    if (elements.videoElement.requestFullscreen) {
                        elements.videoElement.requestFullscreen();
                    }
                    break;
                    
                case 'KeyM':
                    // Mute/Unmute
                    elements.videoElement.muted = !elements.videoElement.muted;
                    updateMuteButton();
                    break;
                    
                case 'Escape':
                    // Close modal
                    closeVideoPreview();
                    break;
            }
        });
        
        console.log('✅ Keyboard shortcuts initialized (Space, ←/→, F, M, Esc)');
    }

    /* ============================================================
       12. NAVIGATION SYSTEM
       ============================================================ */
    
    /**
     * Initialize navigation button effects and transitions
     */
    function initNavigation() {
        // Navigation transition handlers
        document.querySelectorAll('.nav-btn, .footer-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const href = btn.getAttribute('href');
                
                // Skip if no href or anchor link
                if (!href || href === '#' || href.startsWith('#')) return;
                
                e.preventDefault();
                navigateWithTransition(href);
            });
        });

        // Navigation button scramble effect
        const scrambleLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-@#$%&*';
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const originalText = btn.getAttribute('data-text');
            if (!originalText) return;
            
            const navText = btn.querySelector('.nav-text');
            if (!navText) return;
            
            // Wrap each character in span
            navText.innerHTML = originalText.split('').map(char => 
                `<span>${char}</span>`
            ).join('');
            
            let scrambleInterval = null;
            
            // Scramble on hover
            btn.addEventListener('mouseenter', function() {
                // Skip if button is active
                if (this.classList.contains('active')) return;
                
                const spans = navText.querySelectorAll('span');
                let iteration = 0;
                
                clearInterval(scrambleInterval);
                
                scrambleInterval = setInterval(() => {
                    spans.forEach((span, index) => {
                        if (index < iteration) {
                            span.textContent = originalText[index];
                        } else {
                            span.textContent = scrambleLetters[Math.floor(Math.random() * scrambleLetters.length)];
                        }
                    });
                    
                    iteration += 0.33;
                    
                    if (iteration >= originalText.length) {
                        clearInterval(scrambleInterval);
                    }
                }, 50);
            });
            
            // Reset on mouse leave
            btn.addEventListener('mouseleave', function() {
                // Skip if button is active
                if (this.classList.contains('active')) return;
                
                clearInterval(scrambleInterval);
                
                const spans = navText.querySelectorAll('span');
                spans.forEach((span, index) => {
                    span.textContent = originalText[index];
                });
            });
        });
        
        console.log('✅ Navigation initialized');
    }

    /* ============================================================
       13. EVENT LISTENERS
       ============================================================ */
    
    /**
     * Initialize all event listeners
     */
    function initEventListeners() {
        // Close preview button
        if (elements.closeButton) {
            elements.closeButton.addEventListener('click', closeVideoPreview);
        }

        // Click outside to close
        if (elements.previewContainer) {
            elements.previewContainer.addEventListener('click', (e) => {
                if (e.target === elements.previewContainer) {
                    closeVideoPreview();
                }
            });
        }

        // Escape key to close (handled in keyboard shortcuts)
        
        console.log('✅ Event listeners initialized');
    }

    /* ============================================================
       14. INITIALIZATION
       ============================================================ */
    
    /**
     * Main initialization function
     */
    function init() {
        console.log('🎬 Initializing CineChord Archive v2.5...');
        
        // Initialize page transition
        initPageTransition();
        
        // Initialize scroll effects
        initScrollEffects();
        
        // Initialize navigation system
        initNavigation();
        
        // Initialize video controls
        initVideoControls();
        
        // Initialize keyboard shortcuts
        initKeyboardShortcuts();
        
        // Initialize event listeners
        initEventListeners();
        
        // Load archive data from backend
        loadArchiveData();
        
        console.log('✅ Archive initialized successfully');
        console.log('📌 Keyboard shortcuts: Space (play/pause), ←/→ (skip), F (fullscreen), M (mute), Esc (close)');
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();