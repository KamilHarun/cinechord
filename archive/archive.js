// 🎯 CENTER LOGO SCROLL HIDE/SHOW
(function() {
  const centerLogo = document.querySelector('.center-logo');
  if (!centerLogo) return;

  // Entry animasiyasını başlat
  setTimeout(() => {
    centerLogo.classList.add('entry-done');
  }, 300);

  let lastScrollY = 0;
  let ticking = false;

  function updateLogoVisibility() {
    const currentScrollY = window.scrollY || window.pageYOffset;
    
    if (currentScrollY > 100) {
      centerLogo.classList.add('scroll-hidden');
    } else {
      centerLogo.classList.remove('scroll-hidden');
    }
    
    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(updateLogoVisibility);
      ticking = true;
    }
  }, { passive: true });

  // İlkin vəziyyəti yoxla
  updateLogoVisibility();
})();

// 🎯 NAVBAR HIDE/SHOW ON SCROLL - Archive Page
(function() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScroll = 0;

  function handleScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    if (currentScroll > lastScroll && currentScroll > 50) {
      header.classList.add('navbar-hide');
      header.classList.remove('navbar-show');
    } else {
      header.classList.remove('navbar-hide');
      header.classList.add('navbar-show');
    }
    
    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  header.classList.add('navbar-show');
})();

// 🎯 PROGRESS BAR TOP
(function() {
  const progress = document.querySelector('.progress-bar-top');
  if (!progress) return;
  
  function updateProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = scrollPercent + '%';
  }
  
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
})();

// 🎞 TV NOISE GENERATOR
(function() {
  const canvas = document.getElementById('noiseCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  function generateNoise() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 70;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  function animate() {
    generateNoise();
    requestAnimationFrame(animate);
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  animate();
})();

// Get current page
function getCurrentPage() {
  const path = window.location.pathname;
  return path.split('/').pop() || 'archive.html';
}

// Navigate with immediate transition
function navigateWithTransition(href) {
  const pageTransition = document.querySelector('.page-transition');
  
  if (pageTransition) {
    pageTransition.classList.add('active');
  }
  
  setTimeout(() => {
    window.location.href = href;
  }, 600);
}

// Nav buttons with animated transitions
document.addEventListener('DOMContentLoaded', function() {
  const navBtns = document.querySelectorAll('.nav-btn:not(.disabled)');
  navBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href) return;
      
      const currentPage = getCurrentPage();
      const targetPage = href.split('/').pop();
      
      if (targetPage === currentPage || 
          (targetPage === '' && currentPage === 'index.html') ||
          (targetPage === 'index.html' && currentPage === '')) {
        e.preventDefault();
        return;
      }
      
      e.preventDefault();
      navigateWithTransition(href);
    });
  });
});

// Set active state for current page
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop() || 'archive.html';
  const navButtons = document.querySelectorAll('.nav-btn');
  
  navButtons.forEach(btn => {
    const btnText = btn.getAttribute('data-text')?.toLowerCase();
    
    if (!btnText) return;
    
    if ((currentPage.includes('archive') && btnText === 'archive') ||
        (currentPage.includes('index') && btnText === 'home') ||
        (currentPage.includes('about') && btnText === 'about') ||
        (currentPage.includes('contact') && btnText === 'contact') ||
        (currentPage.includes('work') && btnText === 'work') ||
        (currentPage === '' && btnText === 'home')) {
      btn.classList.add('active');
    }
  });
});

// Scramble effect letters for nav buttons
document.addEventListener('DOMContentLoaded', function() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-@#$%&*';
  const navButtons = document.querySelectorAll('.nav-btn');
  
  navButtons.forEach(btn => {
    const originalText = btn.getAttribute('data-text');
    if (!originalText) return;
    
    const navText = btn.querySelector('.nav-text');
    if (!navText) return;
    
    navText.innerHTML = originalText.split('').map(char => 
      `<span>${char}</span>`
    ).join('');
    
    let interval = null;
    
    btn.addEventListener('mouseenter', function() {
      if (this.classList.contains('disabled') || this.classList.contains('active')) return;
      
      let iteration = 0;
      const spans = navText.querySelectorAll('span');
      
      clearInterval(interval);
      
      interval = setInterval(() => {
        spans.forEach((span, index) => {
          if (index < iteration) {
            span.textContent = originalText[index];
          } else {
            span.textContent = letters[Math.floor(Math.random() * letters.length)];
          }
        });
        
        iteration += 0.33;
        
        if (iteration >= originalText.length) {
          clearInterval(interval);
        }
      }, 50);
    });
    
    btn.addEventListener('mouseleave', function() {
      clearInterval(interval);
      
      const spans = navText.querySelectorAll('span');
      spans.forEach((span, index) => {
        span.textContent = originalText[index];
      });
    });
  });
});

// 🎥 LOCAL MP4 VIDEO PREVIEW FUNCTIONALITY WITH CUSTOM CONTROLS
document.addEventListener('DOMContentLoaded', function() {
  const previewContainer = document.getElementById('previewContainer');
  const videoWrapper = document.getElementById('videoWrapper');
  const previewVideo = document.getElementById('previewVideo');
  const previewTitle = document.getElementById('previewTitle');
  const previewMeta = document.getElementById('previewMeta');
  const closePreview = document.getElementById('closePreview');
  const videoLoading = document.querySelector('.video-loading');

  // Custom Controls Elements
  const customControls = document.getElementById('customControls');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const skipBackBtn = document.getElementById('skipBackBtn');
  const skipForwardBtn = document.getElementById('skipForwardBtn');
  const progressSlider = document.getElementById('progressSlider');
  const progressPlayed = document.getElementById('progressPlayed');
  const progressBuffered = document.getElementById('progressBuffered');
  const currentTimeEl = document.getElementById('currentTime');
  const durationTimeEl = document.getElementById('durationTime');
  const muteBtn = document.getElementById('muteBtn');
  const volumeIcon = document.getElementById('volumeIcon');
  const muteIcon = document.getElementById('muteIcon');
  const volumeSlider = document.getElementById('volumeSlider');
  const speedBtn = document.getElementById('speedBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  // Speed options
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  let currentSpeedIndex = 2; // Default 1x

  // Format time helper
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Update play/pause button
  function updatePlayPauseButton() {
    if (previewVideo.paused) {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    } else {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    }
  }

  // Update progress bar
  function updateProgress() {
    const percent = (previewVideo.currentTime / previewVideo.duration) * 100;
    progressPlayed.style.width = percent + '%';
    progressSlider.value = percent;
    currentTimeEl.textContent = formatTime(previewVideo.currentTime);
  }

  // Update buffer
  function updateBuffer() {
    if (previewVideo.buffered.length > 0) {
      const bufferedEnd = previewVideo.buffered.end(previewVideo.buffered.length - 1);
      const percent = (bufferedEnd / previewVideo.duration) * 100;
      progressBuffered.style.width = percent + '%';
    }
  }

  // Update duration
  function updateDuration() {
    durationTimeEl.textContent = formatTime(previewVideo.duration);
  }

  // Update volume UI
  function updateVolumeUI() {
    const muted = previewVideo.muted || previewVideo.volume === 0;
    volumeIcon.style.display = muted ? 'none' : 'block';
    muteIcon.style.display = muted ? 'block' : 'none';
    volumeSlider.value = muted ? 0 : previewVideo.volume * 100;
  }

  // Video event listeners for custom controls
  previewVideo.addEventListener('timeupdate', updateProgress);
  previewVideo.addEventListener('progress', updateBuffer);
  previewVideo.addEventListener('loadedmetadata', updateDuration);
  previewVideo.addEventListener('play', updatePlayPauseButton);
  previewVideo.addEventListener('pause', updatePlayPauseButton);
  previewVideo.addEventListener('volumechange', updateVolumeUI);

  // Play/Pause button
  playPauseBtn.addEventListener('click', function() {
    if (previewVideo.paused) {
      previewVideo.play();
    } else {
      previewVideo.pause();
    }
  });

  // Skip buttons
  skipBackBtn.addEventListener('click', function() {
    previewVideo.currentTime = Math.max(0, previewVideo.currentTime - 10);
  });

  skipForwardBtn.addEventListener('click', function() {
    previewVideo.currentTime = Math.min(previewVideo.duration, previewVideo.currentTime + 10);
  });

  // Progress slider
  progressSlider.addEventListener('input', function() {
    const time = (this.value / 100) * previewVideo.duration;
    previewVideo.currentTime = time;
  });

  // Mute button
  muteBtn.addEventListener('click', function() {
    previewVideo.muted = !previewVideo.muted;
  });

  // Volume slider
  volumeSlider.addEventListener('input', function() {
    previewVideo.volume = this.value / 100;
    previewVideo.muted = this.value == 0;
  });

  // Speed button
  speedBtn.addEventListener('click', function() {
    currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
    const speed = speeds[currentSpeedIndex];
    previewVideo.playbackRate = speed;
    this.textContent = speed + 'x';
  });

  // Fullscreen button
  fullscreenBtn.addEventListener('click', function() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (previewVideo.requestFullscreen) {
      previewVideo.requestFullscreen();
    } else if (previewVideo.webkitRequestFullscreen) {
      previewVideo.webkitRequestFullscreen();
    }
  });

  // Click on video to toggle play/pause
  previewVideo.addEventListener('click', function() {
    if (this.paused) {
      this.play();
    } else {
      this.pause();
    }
  });

  // Scroll animation for table rows
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 50);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // LOCAL VIDEO Preview functionality - Click to open
  document.querySelectorAll('.archive-table tbody tr').forEach(row => {
    observer.observe(row);

    // Store original text before wrapping in spans
    const cells = row.querySelectorAll('td');
    cells.forEach(cell => {
      const originalText = cell.textContent;
      cell.setAttribute('data-original', originalText);
      cell.innerHTML = originalText.split('').map(char => 
        char === ' ' ? ' ' : `<span>${char}</span>`
      ).join('');
    });

    // Scramble effect on hover - PRESERVING SPECIAL CHARACTERS
    row.addEventListener('mouseenter', function() {
      const hoverCells = this.querySelectorAll('td');
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const preserveChars = 'ƏəŞşÜüİıÖöĞğÇç ';
      
      hoverCells.forEach(cell => {
        const spans = cell.querySelectorAll('span');
        const originalText = cell.getAttribute('data-original') || Array.from(spans).map(s => s.textContent).join('');
        
        let iteration = 0;
        const interval = setInterval(() => {
          spans.forEach((span, index) => {
            const originalChar = originalText[index];
            if(index < iteration) {
              span.textContent = originalChar;
            } else if (preserveChars.includes(originalChar)) {
              span.textContent = originalChar;
            } else {
              span.textContent = letters[Math.floor(Math.random() * letters.length)];
            }
          });
          
          iteration += 1/2.5;
          
          if(iteration >= originalText.length) {
            clearInterval(interval);
          }
        }, 30);
      });
    });

    // Click to open LOCAL VIDEO preview
    row.addEventListener('click', function() {
      const videoSrc = this.getAttribute('data-video');
      const title = this.querySelector('.title-col').getAttribute('data-original');
      const type = this.querySelector('.type-col').getAttribute('data-original');
      const year = this.querySelector('.year-col').getAttribute('data-original');
      const client = this.querySelector('.client-col').getAttribute('data-original');

      if (!videoSrc) {
        console.warn('Video source not set for this row');
        return;
      }

      // Show loading
      videoLoading.style.display = 'block';

      // Set video source
      previewVideo.src = videoSrc;
      
      // Set info
      previewTitle.textContent = `${client} - ${title}`;
      previewMeta.textContent = `${type} • ${year}`;

      // Reset custom controls
      currentSpeedIndex = 2;
      speedBtn.textContent = '1x';
      previewVideo.playbackRate = 1;

      // Hide loading when video is ready
      previewVideo.oncanplay = function() {
        videoLoading.style.display = 'none';
      };

      // Handle video errors
      previewVideo.onerror = function() {
        videoLoading.style.display = 'none';
        console.error('Video load error:', videoSrc);
        console.error('Full path attempted:', previewVideo.src);
      };

      // Activate modal
      setTimeout(() => {
        previewContainer.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Auto-play when modal opens
        previewVideo.play().catch(err => {
          console.log('Autoplay prevented:', err);
        });
      }, 10);
    });
  });

  // Close preview function
  function closeVideoPreview() {
    previewContainer.classList.remove('active');
    document.body.style.overflow = '';
    
    // Stop and reset video after animation
    setTimeout(() => {
      previewVideo.pause();
      previewVideo.currentTime = 0;
      previewVideo.src = '';
    }, 600);
  }

  // Close preview button
  closePreview.addEventListener('click', closeVideoPreview);

  // Close on background click
  previewContainer.addEventListener('click', function(e) {
    if (e.target === this) {
      closeVideoPreview();
    }
  });

  // Close on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && previewContainer.classList.contains('active')) {
      closeVideoPreview();
    }
  });

  // Keyboard shortcuts for video
  document.addEventListener('keydown', function(e) {
    if (!previewContainer.classList.contains('active')) return;
    
    switch(e.key) {
      case ' ':
        e.preventDefault();
        if (previewVideo.paused) {
          previewVideo.play();
        } else {
          previewVideo.pause();
        }
        break;
      case 'ArrowLeft':
        previewVideo.currentTime -= 10;
        break;
      case 'ArrowRight':
        previewVideo.currentTime += 10;
        break;
      case 'ArrowUp':
        e.preventDefault();
        previewVideo.volume = Math.min(1, previewVideo.volume + 0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        previewVideo.volume = Math.max(0, previewVideo.volume - 0.1);
        break;
      case 'f':
      case 'F':
        if (previewVideo.requestFullscreen) {
          previewVideo.requestFullscreen();
        }
        break;
      case 'm':
      case 'M':
        previewVideo.muted = !previewVideo.muted;
        break;
    }
  });
});

// Page load logs
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Archive page scripts loaded');
  console.log('✅ LOCAL MP4 Video Player with CUSTOM CONTROLS enabled');
  console.log('✅ Keyboard shortcuts: SPACE=play/pause, ←→=seek 10s, ↑↓=volume, F=fullscreen, M=mute');
  console.log('✅ Navbar HIDE ON SCROLL DOWN - SHOW ON SCROLL UP');
  console.log('✅ Center Logo with SCROLL HIDE effect enabled');
  console.log('✅ All animations running smoothly');
});