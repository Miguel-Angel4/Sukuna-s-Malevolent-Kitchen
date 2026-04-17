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

// Console welcome message
console.log('%c🔥 Sukuna\'s Malevolent Kitchen 🔥', 'color: #f0404e; font-size: 24px; font-weight: bold;');
console.log('%cWelcome to our domain! 👑', 'color: #f1dc1e; font-size: 16px;');

// Performance monitoring (optional)
window.addEventListener('load', () => {
    if ('performance' in window) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ Page loaded in ${pageLoadTime}ms`);
    }
});

// Prevent default behavior for placeholder links
document.querySelectorAll('a[href="#empleos"], a[href="#faq"], a[href="#contacto"], a[href="#cookies"], a[href="#legal"], a[href="#derechos"], a[href="#privacidad"], a[href="#empleados"], a[href="#descuentos"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Future: Add modal or redirect logic here
        console.log(`Link clicked: ${link.textContent.trim()}`);
        alert(`Funcionalidad "${link.textContent.trim()}" próximamente disponible`);
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

// --- SISTEMA DE AUTENTICACION (SUPABASE AUTH) ---
document.addEventListener('DOMContentLoaded', async () => {
    const navLoginBtn = document.getElementById('nav-login');
    
    // Función para actualizar el nav según el estado de la sesión
    async function updateNav() {
        if (!supabase || SUPABASE_ANON_KEY === "TU_ANON_KEY_AQUI") {
            const currentUser = JSON.parse(localStorage.getItem('sukuna_user'));
            if (currentUser && navLoginBtn) {
                navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
                navLoginBtn.href = "cuenta.html";
                navLoginBtn.classList.add('logged-in');
            }
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session && navLoginBtn) {
            navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
            navLoginBtn.href = "cuenta.html";
            navLoginBtn.classList.add('logged-in');
        } else if (navLoginBtn) {
            navLoginBtn.innerHTML = `Iniciar sesión`;
            navLoginBtn.href = "login.html";
            navLoginBtn.classList.remove('logged-in');
        }
    }

    await updateNav();

    // 2. Lógica específica de login.html
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        const emailInput = document.getElementById('auth-email');
        const passInput = document.getElementById('auth-password');
        const formTitle = document.getElementById('form-title');
        const mainBtn = document.getElementById('main-btn');
        const authMessage = document.getElementById('auth-message');
        const googleBtn = document.getElementById('google-btn');

        let isLoginMode = true;

        const setupToggleButton = () => {
            const btn = document.getElementById('toggle-form');
            const toggleText = document.getElementById('toggle-text');
            const formSubtitle = document.getElementById('form-subtitle');
            
            if (btn) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    isLoginMode = !isLoginMode;
                    if (isLoginMode) {
                        formTitle.textContent = "INICIAR SESIÓN";
                        if (formSubtitle) formSubtitle.textContent = "Bienvenido de nuevo al Dominio.";
                        mainBtn.textContent = "Entrar";
                        if (toggleText) toggleText.innerHTML = '¿No tienes cuenta? <a href="#" id="toggle-form" style="color:#B31B1B; font-weight:bold;">Créala aquí</a>';
                    } else {
                        formTitle.textContent = "NUEVA CUENTA";
                        if (formSubtitle) formSubtitle.textContent = "Sella tu juramento para entrar.";
                        mainBtn.textContent = "Registrarse";
                        if (toggleText) toggleText.innerHTML = '¿Ya tienes cuenta? <a href="#" id="toggle-form" style="color:#B31B1B; font-weight:bold;">Inicia sesión</a>';
                    }
                    setupToggleButton(); // Re-vincula el evento al nuevo link
                };
            }
        };
        setupToggleButton();

        const showMessage = (msg, isError = true) => {
            if (!authMessage) return;
            authMessage.textContent = msg;
            authMessage.className = `alert mt-3 text-center ${isError ? 'alert-danger' : 'alert-success'}`;
            authMessage.classList.remove('d-none');
        };

        authForm.onsubmit = async (e) => {
            e.preventDefault();
            if (!supabase || SUPABASE_ANON_KEY === "TU_ANON_KEY_AQUI") {
                showMessage("❌ Supabase no está configurado (falta la Key).");
                return;
            }
            const email = emailInput.value.trim();
            const pass = passInput.value.trim();

            if (isLoginMode) {
                const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
                if (error) showMessage("❌ " + error.message);
                else {
                    showMessage("✅ Autenticado. Entrando...", false);
                    setTimeout(() => { window.location.href = "cuenta.html"; }, 1500);
                }
            } else {
                const { error } = await supabase.auth.signUp({ email, password: pass });
                if (error) showMessage("❌ " + error.message);
                else showMessage("✅ Registro enviado. Revisa tu email para confirmar.", false);
            }
        };

        if (googleBtn) {
            googleBtn.onclick = async () => {
                if (!supabase || SUPABASE_ANON_KEY === "TU_ANON_KEY_AQUI") return;
                const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
                if (error) showMessage("❌ " + error.message);
            };
        }
    }

    // 3. Lógica específica de cuenta.html
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        if (!supabase || SUPABASE_ANON_KEY === "TU_ANON_KEY_AQUI") {
            window.location.href = "login.html";
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const emailField = document.getElementById('profile-email');
        const nameField = document.getElementById('profile-name');
        const bioField = document.getElementById('profile-bio');
        const displayImg = document.getElementById('display-profile-img');
        const uploadInput = document.getElementById('profile-upload');
        const profileMsg = document.getElementById('profile-msg');
        const logoutLink = document.getElementById('logout-link');

        // Cargar perfil desde tabla 'profiles'
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (emailField) emailField.value = user.email;
        if (profile) {
            if (nameField) nameField.value = profile.name || "";
            if (bioField) bioField.value = profile.bio || "";
            if (profile.photo && displayImg) displayImg.src = profile.photo;
        }

        if (uploadInput) {
            uploadInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (displayImg) displayImg.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        profileForm.onsubmit = async (e) => {
            e.preventDefault();
            const updates = {
                id: user.id,
                name: nameField.value.trim(),
                bio: bioField.value.trim(),
                photo: displayImg.src,
                updated_at: new Date()
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) {
                if (profileMsg) {
                    profileMsg.textContent = "❌ " + error.message;
                    profileMsg.className = "alert alert-danger mt-3 text-center";
                    profileMsg.classList.remove('d-none');
                }
            } else {
                if (profileMsg) {
                    profileMsg.textContent = "✅ Perfil actualizado.";
                    profileMsg.className = "alert alert-success mt-3 text-center";
                    profileMsg.classList.remove('d-none');
                }
            }
        };

        const doLogout = async (e) => {
            e.preventDefault();
            if (confirm("¿Estás seguro de que deseas abandonar el Dominio?")) {
                await supabase.auth.signOut();
                window.location.href = "home.html";
            }
        };
        if (logoutLink) logoutLink.onclick = doLogout;
        const logoutSide = document.getElementById('logout-link-side');
        if (logoutSide) logoutSide.onclick = doLogout;
    }
});


// --- Logica del Widget de Calendario Mensual (Reserva) ---
const SUPABASE_URL = "https://wxbjrpqpomekvyuhlwdg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hshzjtEiSun_NwmqZgYkAw_ulq_v7aN"; // Reemplaza esto con tu clave real

const supabase = typeof supabase !== 'undefined' ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const RESERVATIONS_KEY = 'sukuna_reservations';

async function getReservations() {
    if (!supabase || SUPABASE_ANON_KEY === "TU_ANON_KEY_AQUI") return JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || "[]");
    
    const { data, error } = await supabase
        .from('reservations')
        .select('*');
        
    if (error) {
        console.error("Error fetching reservations:", error);
        return JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || "[]");
    }
    return data;
}

async function saveReservation(reservation) {
    if (supabase && SUPABASE_ANON_KEY !== "TU_ANON_KEY_AQUI") {
        const { error } = await supabase
            .from('reservations')
            .insert([reservation]);
        if (error) console.error("Error saving to Supabase:", error);
    }
    
    const reservations = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || "[]");
    reservations.push(reservation);
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
}

function initDefaultReservations() {
    if (!localStorage.getItem(RESERVATIONS_KEY)) {
        const defaults = [
            { nombre: "Satoru Gojo", fecha_hora: "2026-04-14T14:00", mesa: "Mesa 1", personas: 2 },
            { nombre: "Maki Zenin", fecha_hora: "2026-04-14T21:00", mesa: "Mesa 10", personas: 4 },
            { nombre: "Panda", fecha_hora: "2026-04-15T13:30", mesa: "Mesa 3", personas: 1 }
        ];
        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(defaults));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDefaultReservations();

    const toggle = document.getElementById('calendarToggle');
    const widget = document.getElementById('calendarWidget');
    const calendarDays = document.querySelectorAll('.calendar-day:not(.other-month)');
    const tablesContainer = document.getElementById('tablesContainer');
    const statusTitle = document.getElementById('status-title');
    const fechaHoraInput = document.getElementById('fecha_hora');
    const reservaForm = document.getElementById('form-reserva');

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

    async function updateTables(dayNumber) {
        if (!tablesContainer) return;
        tablesContainer.innerHTML = '';
        
        let selectedTime = "12:00"; 
        let selectedMonth = "04";    
        let selectedYear = "2026";
        
        if (fechaHoraInput && fechaHoraInput.value) {
            const dt = new Date(fechaHoraInput.value);
            selectedTime = dt.getHours().toString().padStart(2, '0') + ":" + dt.getMinutes().toString().padStart(2, '0');
        }

        if (statusTitle) statusTitle.textContent = `Estado para el día ${dayNumber} a las ${selectedTime}`;

        const reservations = await getReservations();

        for (let i = 1; i <= 15; i++) {
            const mesaName = i === 15 ? "Mesa 15 (Especial para Cumpleaños)" : `Mesa ${i}`;
            
            const isReserved = reservations.some(res => {
                const resDate = new Date(res.fecha_hora);
                const day = parseInt(dayNumber);
                const isSameDay = resDate.getFullYear() == 2026 && 
                                  resDate.getMonth() == 3 && 
                                  resDate.getDate() == day;

                if (isSameDay && (res.mesa === mesaName || res.mesa === `Mesa ${i}`)) {
                    if (fechaHoraInput && fechaHoraInput.value) {
                        const checkDate = new Date(`${selectedYear}-${selectedMonth}-${day.toString().padStart(2, '0')}T${selectedTime}`);
                        const diffMs = Math.abs(resDate - checkDate);
                        const diffMins = diffMs / (1000 * 60);
                        return diffMins < 60; 
                    }
                    return true;
                }
                return false;
            });

            const dot = document.createElement('div');
            dot.className = isReserved ? 'table-dot reserved' : 'table-dot';
            dot.textContent = i;
            dot.title = isReserved ? (`${mesaName} - Reservada`) : (`${mesaName} - Libre`);
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
        
        let initialDay = 14;
        if (fechaHoraInput && fechaHoraInput.value) {
            initialDay = new Date(fechaHoraInput.value).getDate();
            calendarDays.forEach(d => {
                if(parseInt(d.textContent) === initialDay) d.classList.add('active');
            });
        }
        updateTables(initialDay); 
    }

    if (reservaForm) {
        reservaForm.addEventListener('submit', () => {
            const formData = new FormData(reservaForm);
            const reservation = {
                nombre: formData.get('nombre'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                fecha_hora: formData.get('fecha_hora'),
                personas: formData.get('personas'),
                mesa: formData.get('mesa'),
                peticiones: formData.get('peticiones')
            };
            saveReservation(reservation);
        });
    }

    if (fechaHoraInput) {
        fechaHoraInput.addEventListener('change', () => {
            const dt = new Date(fechaHoraInput.value);
            if (dt.getFullYear() === 2026 && dt.getMonth() === 3) {
                const day = dt.getDate();
                calendarDays.forEach(d => {
                    if (parseInt(d.textContent) === day) {
                        d.click();
                    }
                });
            } else {
                const activeDay = document.querySelector('.calendar-day.active');
                if (activeDay) updateTables(activeDay.textContent);
            }
        });
    }
});
