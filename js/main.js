// ========================================
// Sukuna's Malevolent Kitchen - Main JavaScript
// ========================================

// Create floating blood particles
function createBloodParticles() {
    const container = document.getElementById('bloodParticles');
    if (!container) return;

    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'blood-particle';

        // Random horizontal position
        particle.style.left = Math.random() * 100 + '%';

        // Random animation delay
        particle.style.animationDelay = Math.random() * 20 + 's';

        // Random animation duration (15-25s)
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';

        container.appendChild(particle);
    }
}

// Slider controls
let currentSlide = 0;
const totalSlides = 5;

function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    const sliderUl = document.getElementById('sliderUl');
    if (!sliderUl) return;

    // Remove animation temporarily
    sliderUl.style.animation = 'none';

    // Move to the selected slide
    sliderUl.style.marginLeft = -(slideIndex * 100) + '%';

    // Update active dot
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (dot) {
            if (i === slideIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        }
    }

    // Restart animation after a brief delay
    setTimeout(() => {
        sliderUl.style.animation = 'slide 20s infinite ease-in-out';
        sliderUl.style.animationDelay = -(slideIndex * 4) + 's';
    }, 50);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    createBloodParticles();

    // Set first dot as active
    const firstDot = document.getElementById('dot-0');
    if (firstDot) {
        firstDot.classList.add('active');
    }
});

// Active category link highlighting in menu page
if (document.body.classList.contains('carta')) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active class from all links
                document.querySelectorAll('.categoria-link').forEach(link => {
                    link.classList.remove('active');
                });

                // Add active class to current section's link
                const id = entry.target.getAttribute('id');
                const activeLink = document.querySelector(`.categoria-link[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '-150px 0px -50% 0px'
    });

    // Observe all food category sections
    document.querySelectorAll('[id^="bebidas"], [id^="entrantes"], [id^="carnes"], [id^="vegetales"], [id^="pescados"], [id^="pastas"], [id^="postres"], [id^="menus"]').forEach(section => {
        observer.observe(section);
    });
}

// Intersection Observer for fade-in animations
const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
});

// Observe elements with animation classes
document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
    fadeInObserver.observe(el);
});

// Header shadow on scroll
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        header.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
    } else {
        header.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
    }

    lastScroll = currentScroll;
});

// Lazy loading for images (if needed in future)
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// Add hover effect sound (optional - commented out by default)
/*
const hoverSound = new Audio('path/to/hover-sound.mp3');
document.querySelectorAll('.botoncarta, .botonempleado, .card-comida').forEach(el => {
    el.addEventListener('mouseenter', () => {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(e => console.log('Audio play prevented'));
    });
});
*/

// Console welcome message
console.log('%cðŸ”¥ Sukuna\'s Malevolent Kitchen ðŸ”¥', 'color: #f0404e; font-size: 24px; font-weight: bold;');
console.log('%cWelcome to our domain! ðŸ‘‘', 'color: #f1dc1e; font-size: 16px;');

// Performance monitoring (optional)
window.addEventListener('load', () => {
    if ('performance' in window) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`âš¡ Page loaded in ${pageLoadTime}ms`);
    }
});

// Prevent default behavior for placeholder links
document.querySelectorAll('a[href="#empleos"], a[href="#reserva"], a[href="#login"], a[href="#faq"], a[href="#contacto"], a[href="#cookies"], a[href="#legal"], a[href="#derechos"], a[href="#privacidad"], a[href="#empleados"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Future: Add modal or redirect logic here
        console.log(`Link clicked: ${link.textContent.trim()}`);
        alert(`Funcionalidad "${link.textContent.trim()}" prÃ³ximamente disponible`);
    });
});
