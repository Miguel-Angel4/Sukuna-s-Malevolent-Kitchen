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
document.querySelectorAll('a[href="#empleos"], a[href="#faq"], a[href="#contacto"], a[href="#cookies"], a[href="#legal"], a[href="#derechos"], a[href="#privacidad"], a[href="#empleados"], a[href="#descuentos"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Future: Add modal or redirect logic here
        console.log(`Link clicked: ${link.textContent.trim()}`);
        alert(`Funcionalidad "${link.textContent.trim()}" prÃ³ximamente disponible`);
    });
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

// --- SISTEMA DE AUTENTICACION (LOGIN / REGISTRO) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Mostrar estado de sesión en el Nav
    const navLoginBtn = document.getElementById('nav-login');
    const currentUser = JSON.parse(localStorage.getItem('sukuna_user'));

    if (currentUser && navLoginBtn) {
        // En lugar de cerrar sesión directo, llevamos a Mi Cuenta
        navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
        navLoginBtn.href = "cuenta.html";
        navLoginBtn.classList.add('logged-in');
    }

    // 2. Lógica específica de login.html
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        // Redirigir si ya está logueado
        if (currentUser) {
            window.location.href = "cuenta.html";
            return;
        }

        const emailInput = document.getElementById('auth-email');
        const passInput = document.getElementById('auth-password');
        const toggleFormBtn = document.getElementById('toggle-form');
        const formTitle = document.getElementById('form-title');
        const formSubtitle = document.getElementById('form-subtitle');
        const mainBtn = document.getElementById('main-btn');
        const toggleText = document.getElementById('toggle-text');
        const authMessage = document.getElementById('auth-message');
        const googleBtn = document.getElementById('google-btn');

        let isLoginMode = true; // true = Login, false = Registro

        // Cambiar entre Login y Registro
        const setupToggleButton = () => {
            const btn = document.getElementById('toggle-form');
            if (btn) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    isLoginMode = !isLoginMode;
                    authMessage.classList.add('d-none');

                    if (isLoginMode) {
                        formTitle.textContent = "INICIAR SESIÓN";
                        formSubtitle.textContent = "Bienvenido de nuevo al Dominio.";
                        mainBtn.textContent = "Entrar";
                        toggleText.innerHTML = '¿No tienes cuenta? <a href="#" id="toggle-form" style="color:#B31B1B; font-weight:bold;">Créala aquí</a>';
                    } else {
                        formTitle.textContent = "NUEVA CUENTA";
                        formSubtitle.textContent = "Sella tu juramento para entrar.";
                        mainBtn.textContent = "Registrarse";
                        toggleText.innerHTML = '¿Ya tienes cuenta? <a href="#" id="toggle-form" style="color:#B31B1B; font-weight:bold;">Inicia sesión</a>';
                    }
                    setupToggleButton(); // Re-vincula el evento al nuevo link
                };
            }
        };
        setupToggleButton();

        const showMessage = (msg, isError = true) => {
            authMessage.textContent = msg;
            authMessage.className = `alert mt-3 text-center ${isError ? 'alert-danger' : 'alert-success'}`;
            authMessage.classList.remove('d-none');
        };

        // Enviar Formulario
        authForm.onsubmit = (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            const pass = passInput.value.trim();

            if (!email || !pass) return;

            // Simulamos DB en localStorage
            localStorage.setItem('sukuna_db', localStorage.getItem('sukuna_db') || JSON.stringify({}));
            const db = JSON.parse(localStorage.getItem('sukuna_db'));

            if (isLoginMode) {
                if (!db[email]) {
                    showMessage("❌ No existe cuenta con este correo.");
                } else if (db[email].password !== pass) {
                    showMessage("❌ Contraseña incorrecta.");
                } else {
                    showMessage("✅ Autenticado. Entrando al Dominio...", false);
                    localStorage.setItem('sukuna_user', JSON.stringify({ email: email }));
                    setTimeout(() => { window.location.href = "cuenta.html"; }, 1500);
                }
            } else {
                if (db[email]) {
                    showMessage("❌ Este correo ya está registrado.");
                } else {
                    db[email] = { password: pass, name: "", bio: "", photo: "" };
                    localStorage.setItem('sukuna_db', JSON.stringify(db));
                    showMessage("✅ Cuenta creada. Bienvenido al Dominio.", false);
                    localStorage.setItem('sukuna_user', JSON.stringify({ email: email }));
                    setTimeout(() => { window.location.href = "cuenta.html"; }, 1500);
                }
            }
        };

        // Botón de Google (Simulado)
        googleBtn.onclick = () => {
            const googleEmail = prompt("🔒 [Simulación Google Login]\nIntroduce tu email de Google:");
            if (googleEmail && googleEmail.includes('@')) {
                showMessage(`✅ Iniciando sesión con Google (${googleEmail})...`, false);
                localStorage.setItem('sukuna_user', JSON.stringify({ email: googleEmail, google: true }));
                
                // Asegurar que existe en la DB simulada
                localStorage.setItem('sukuna_db', localStorage.getItem('sukuna_db') || JSON.stringify({}));
                const db = JSON.parse(localStorage.getItem('sukuna_db'));
                if (!db[googleEmail]) {
                    db[googleEmail] = { password: "google_account", name: "", bio: "", photo: "" };
                    localStorage.setItem('sukuna_db', JSON.stringify(db));
                }

                setTimeout(() => { window.location.href = "cuenta.html"; }, 1200);
            }
        };
    }

    // 3. Lógica específica de cuenta.html
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        const db = JSON.parse(localStorage.getItem('sukuna_db') || "{}");
        const userData = db[currentUser.email] || {};

        const emailField = document.getElementById('profile-email');
        const nameField = document.getElementById('profile-name');
        const bioField = document.getElementById('profile-bio');
        const displayImg = document.getElementById('display-profile-img');
        const uploadInput = document.getElementById('profile-upload');
        const profileMsg = document.getElementById('profile-msg');
        const logoutLink = document.getElementById('logout-link');

        // Cargar datos actuales
        emailField.value = currentUser.email;
        nameField.value = userData.name || "";
        bioField.value = userData.bio || "";
        if (userData.photo) {
            displayImg.src = userData.photo;
        }

        // Manejar subida de foto (Simulada con Base64)
        uploadInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    displayImg.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        // Guardar cambios
        profileForm.onsubmit = (e) => {
            e.preventDefault();
            
            userData.name = nameField.value.trim();
            userData.bio = bioField.value.trim();
            userData.photo = displayImg.src;

            db[currentUser.email] = userData;
            localStorage.setItem('sukuna_db', JSON.stringify(db));

            profileMsg.textContent = "✅ Perfil actualizado correctamente.";
            profileMsg.className = "alert alert-success mt-3 text-center";
            profileMsg.classList.remove('d-none');

            setTimeout(() => {
                profileMsg.classList.add('d-none');
            }, 3000);
        };

        // Logout
        logoutLink.onclick = (e) => {
            e.preventDefault();
            if(confirm("¿Estás seguro de que deseas abandonar el Dominio?")){
                localStorage.removeItem('sukuna_user');
                window.location.href = "home.html";
            }
        };
    }
});


// --- Logica del Widget de Calendario Mensual (Reserva) ---
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('calendarToggle');
    const widget = document.getElementById('calendarWidget');
    const calendarDays = document.querySelectorAll('.calendar-day:not(.other-month)');
    const tablesContainer = document.getElementById('tablesContainer');
    const statusTitle = document.getElementById('status-title');

    if (toggle && widget) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            widget.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!widget.contains(e.target) && !toggle.contains(e.target)) {
                widget.classList.remove('active');
            }
        });
    }

    function updateTables(dayNumber) {
        if (!tablesContainer) return;
        tablesContainer.innerHTML = '';
        if (statusTitle) statusTitle.textContent = "Estado para el dia " + dayNumber;

        for (let i = 1; i <= 15; i++) {
            const isReserved = (Math.sin(dayNumber * i) > 0.3);
            const dot = document.createElement('div');
            dot.className = isReserved ? 'table-dot reserved' : 'table-dot';
            dot.textContent = i;
            dot.title = isReserved ? ("Mesa " + i + " - Reservada") : ("Mesa " + i + " - Libre");
            tablesContainer.appendChild(dot);
        }
    }

    if (calendarDays.length > 0) {
        calendarDays.forEach(dayBtn => {
            dayBtn.addEventListener('click', () => {
                calendarDays.forEach(d => d.classList.remove('active'));
                dayBtn.classList.add('active');
                updateTables(dayBtn.textContent);
            });
        });
        updateTables(14); // Dia actual por defecto
    }
});
