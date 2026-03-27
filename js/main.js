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

// Category card click -> show detail section on carta page
if (document.body.classList.contains('carta')) {
    const cardButtons = document.querySelectorAll('.card-comida[data-category]');
    const menuDisplay = document.getElementById('menu-display');
    const btnVolver = document.getElementById('btn-volver');
    const allCardSections = document.querySelectorAll('.seccion-comida');
    const allCategories = document.querySelectorAll('#menu-display .menu-category');

    function openCategory(categoryName) {
        // Hide all card sections
        allCardSections.forEach(s => s.style.display = 'none');

        // Hide all detail categories
        allCategories.forEach(c => c.style.display = 'none');

        // Show the menu display container
        menuDisplay.style.display = 'block';

        // Show the matching detail section
        const target = document.getElementById('sec-' + categoryName);
        if (target) {
            target.style.display = 'block';
            target.style.animation = 'fadeInUp 0.5s ease-out';
        }

        // Scroll to top of menu display
        menuDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Update active nav link
        document.querySelectorAll('.categoria-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + categoryName) {
                link.classList.add('active');
            }
        });
    }

    function closeCategory() {
        // Hide menu display
        menuDisplay.style.display = 'none';

        // Show all card sections
        allCardSections.forEach(s => s.style.display = 'block');

        // Remove active from nav links
        document.querySelectorAll('.categoria-link').forEach(link => {
            link.classList.remove('active');
        });
    }

    // Click on image cards
    cardButtons.forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.getAttribute('data-category');
            openCategory(cat);
        });
    });

    // Click on nav links
    document.querySelectorAll('.categoria-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.getAttribute('href').substring(1);
            openCategory(cat);
        });
    });

    // Volver button
    if (btnVolver) {
        btnVolver.addEventListener('click', closeCategory);
    }
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
document.querySelectorAll('a[href="#empleos"], a[href="#reserva"], a[href="#login"], a[href="#faq"], a[href="#contacto"], a[href="#cookies"], a[href="#legal"], a[href="#derechos"], a[href="#privacidad"], a[href="#empleados"], a[href="#descuentos"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Future: Add modal or redirect logic here
        console.log(`Link clicked: ${link.textContent.trim()}`);
        alert(`Funcionalidad "${link.textContent.trim()}" prÃ³ximamente disponible`);
    });
});

// --- DOMAIN EXPANSION ENTRANCE ---
document.addEventListener('DOMContentLoaded', () => {
    const domainOverlay = document.getElementById('domain-overlay');
    const enterButton = document.getElementById('enter-domain');
    const sukunaAudio = document.getElementById('sukuna-audio');

    if (domainOverlay && enterButton && sukunaAudio) {
        // Prevent scrolling while in "pre-domain" state
        document.body.style.overflow = 'hidden';

        enterButton.addEventListener('click', () => {
            // Play Ryomen Sukuna's Domain Expansion audio
            sukunaAudio.volume = 0.8;
            sukunaAudio.play().catch(e => {
                console.warn("Autoplay was prevented or audio failed:", e);
            });

            // Trigger the "cut" animation to open the repository
            domainOverlay.classList.add('opened');

            // Restore scrolling and remove overlay after animation completes
            setTimeout(() => {
                document.body.style.overflow = '';
                // Optional: remove from DOM to keep it clean
                // domainOverlay.remove();
            }, 1200);
        });
    }
});

// --- MODAL DE IMAGENES PARA BEBIDAS Y CARTA ---
document.addEventListener('DOMContentLoaded', () => {
    const modalImagen = document.getElementById('image-modal');
    const modalImgContainer = document.getElementById('modal-img-container');
    const closeModal = document.querySelector('.close-modal');

    if (modalImagen && modalImgContainer && closeModal) {
        // Añadir evento click a todos los items con data-img
        document.querySelectorAll('.menu-item[data-img]').forEach(item => {
            item.addEventListener('click', function() {
                const imgUrls = this.getAttribute('data-img').split(',');
                
                // Limpiar container
                modalImgContainer.innerHTML = '';
                
                // Añadir imagenes
                imgUrls.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url.trim();
                    img.className = 'modal-imagen-content';
                    if (imgUrls.length > 1) {
                        img.classList.add('multi');
                    }
                    modalImgContainer.appendChild(img);
                });
                
                modalImagen.style.display = 'flex';
                // Pequeño retardo para que la transición CSS funcione (display none -> flex)
                setTimeout(() => {
                    modalImagen.classList.add('show');
                }, 10);
            });
        });

        // Cerrar modal al hacer click en la X
        closeModal.addEventListener('click', () => {
            modalImagen.classList.remove('show');
            setTimeout(() => {
                modalImagen.style.display = 'none';
            }, 300); // Esperar que termine la transición
        });

        // Cerrar modal al hacer click fuera de la imagen
        modalImagen.addEventListener('click', (e) => {
            if (e.target === modalImagen || e.target === modalImgContainer) {
                modalImagen.classList.remove('show');
                setTimeout(() => {
                    modalImagen.style.display = 'none';
                }, 300);
            }
        });
    }
});

// --- FORMULARIO DE EMPLEO ---
// El envío se maneja nativamente por el atributo 'action' de Forminit 
// para asegurar la compatibilidad con archivos en todos los entornos.
document.addEventListener('DOMContentLoaded', () => {
    const formEmpleo = document.getElementById('form-empleo');
    if (formEmpleo) {
        formEmpleo.addEventListener('submit', () => {
            const submitBtn = formEmpleo.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerText = "Enviando al Relicario...";
                submitBtn.style.opacity = "0.7";
                submitBtn.style.pointerEvents = "none";
            }
        });
    }
});
