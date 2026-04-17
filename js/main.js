// ========================================
// Sukuna's Malevolent Kitchen - Main JavaScript
// ========================================

// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://wxbjrpqpomekvyuhlwdg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hshzjtEiSun_NwmqZgYkAw_ulq_v7aN";
const supabase = typeof supabase !== 'undefined' ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// --- FUNCIONES DE UTILIDAD ---
function createBloodParticles() {
    const container = document.getElementById('bloodParticles');
    if (!container) return;
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'blood-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

let currentSlide = 0;
const totalSlides = 5;
function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    const sliderUl = document.getElementById('sliderUl');
    if (!sliderUl) return;
    sliderUl.style.animation = 'none';
    sliderUl.style.marginLeft = -(slideIndex * 100) + '%';
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (dot) dot.classList.toggle('active', i === slideIndex);
    }
    setTimeout(() => {
        sliderUl.style.animation = 'slide 20s infinite ease-in-out';
        sliderUl.style.animationDelay = -(slideIndex * 4) + 's';
    }, 50);
}

// --- LÓGICA DE NAVEGACIÓN Y UI ---
document.addEventListener('DOMContentLoaded', async () => {
    createBloodParticles();
    const firstDot = document.getElementById('dot-0');
    if (firstDot) firstDot.classList.add('active');

    // Actualizar Nav según sesión
    const navLoginBtn = document.getElementById('nav-login');
    if (navLoginBtn) {
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
                navLoginBtn.href = "cuenta.html";
                navLoginBtn.classList.add('logged-in');
            }
        } else {
            const currentUser = JSON.parse(localStorage.getItem('sukuna_user'));
            if (currentUser) {
                navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
                navLoginBtn.href = "cuenta.html";
                navLoginBtn.classList.add('logged-in');
            }
        }
    }

    // Modal de imágenes
    const modalImagen = document.getElementById('image-modal');
    const modalImgContainer = document.getElementById('modal-img-container');
    const closeModal = document.querySelector('.close-modal');
    if (modalImagen && modalImgContainer && closeModal) {
        document.querySelectorAll('.menu-item[data-img]').forEach(item => {
            item.addEventListener('click', function() {
                const imgUrls = this.getAttribute('data-img').split(',');
                modalImgContainer.innerHTML = '';
                imgUrls.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url.trim();
                    img.className = 'modal-imagen-content';
                    if (imgUrls.length > 1) img.classList.add('multi');
                    modalImgContainer.appendChild(img);
                });
                modalImagen.style.display = 'flex';
                setTimeout(() => modalImagen.classList.add('show'), 10);
            });
        });
        closeModal.addEventListener('click', () => {
            modalImagen.classList.remove('show');
            setTimeout(() => modalImagen.style.display = 'none', 300);
        });
    }
});

// --- LÓGICA DE AUTENTICACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    // Login Form
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        const emailInput = document.getElementById('auth-email');
        const passInput = document.getElementById('auth-password');
        const authMessage = document.getElementById('auth-message');
        const googleBtn = document.getElementById('google-btn');

        authForm.onsubmit = async (e) => {
            e.preventDefault();
            if (!supabase) return;
            const { error } = await supabase.auth.signInWithPassword({
                email: emailInput.value.trim(),
                password: passInput.value.trim()
            });
            if (error) {
                authMessage.textContent = "❌ " + error.message;
                authMessage.classList.remove('d-none');
            } else {
                window.location.href = "cuenta.html";
            }
        };

        if (googleBtn) {
            googleBtn.onclick = () => supabase.auth.signInWithOAuth({ provider: 'google' });
        }
    }

    // Register Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        const regEmailInput = document.getElementById('reg-email');
        const regPassInput = document.getElementById('reg-password');
        const regMessage = document.getElementById('reg-message');

        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            if (!supabase) return;
            const { error } = await supabase.auth.signUp({
                email: regEmailInput.value.trim(),
                password: regPassInput.value.trim()
            });
            if (error) {
                regMessage.textContent = "❌ " + error.message;
                regMessage.className = "alert alert-danger mt-3 text-center";
                regMessage.classList.remove('d-none');
            } else {
                regMessage.textContent = "✅ Cuenta creada. REVISA TU EMAIL para confirmar antes de entrar.";
                regMessage.className = "alert alert-success mt-3 text-center";
                regMessage.classList.remove('d-none');
                registerForm.reset();
            }
        };
    }

    // Profile Page
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "login.html"; return; }

        const emailField = document.getElementById('profile-email');
        const nameField = document.getElementById('profile-name');
        const bioField = document.getElementById('profile-bio');
        const displayImg = document.getElementById('display-profile-img');
        const profileMsg = document.getElementById('profile-msg');

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (emailField) emailField.value = user.email;
        if (profile) {
            if (nameField) nameField.value = profile.name || "";
            if (bioField) bioField.value = profile.bio || "";
            if (profile.photo && displayImg) displayImg.src = profile.photo;
        }

        profileForm.onsubmit = async (e) => {
            e.preventDefault();
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                name: nameField.value.trim(),
                bio: bioField.value.trim(),
                photo: displayImg.src,
                updated_at: new Date()
            });
            if (profileMsg) {
                profileMsg.textContent = error ? "❌ " + error.message : "✅ Perfil actualizado.";
                profileMsg.className = `alert mt-3 text-center ${error ? 'alert-danger' : 'alert-success'}`;
                profileMsg.classList.remove('d-none');
            }
        };

        const logoutBtn = document.getElementById('logout-link') || document.getElementById('logout-link-side');
        if (logoutBtn) {
            logoutBtn.onclick = async (e) => {
                e.preventDefault();
                await supabase.auth.signOut();
                window.location.href = "home.html";
            };
        }
    }
});

// --- LÓGICA DE RESERVAS ---
const RESERVATIONS_KEY = 'sukuna_reservations';
async function getReservations() {
    if (!supabase) return JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || "[]");
    const { data, error } = await supabase.from('reservations').select('*');
    return error ? JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || "[]") : data;
}

async function saveReservation(res) {
    if (supabase) await supabase.from('reservations').insert([res]);
    const local = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || "[]");
    local.push(res);
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(local));
}

document.addEventListener('DOMContentLoaded', () => {
    const calendarDays = document.querySelectorAll('.calendar-day:not(.other-month)');
    const tablesContainer = document.getElementById('tablesContainer');
    const fechaHoraInput = document.getElementById('fecha_hora');
    const reservaForm = document.getElementById('form-reserva');

    async function updateTables(day) {
        if (!tablesContainer) return;
        tablesContainer.innerHTML = '';
        const reservations = await getReservations();
        for (let i = 1; i <= 15; i++) {
            const mesaName = i === 15 ? "Mesa 15 (Especial para Cumpleaños)" : `Mesa ${i}`;
            const isReserved = reservations.some(r => {
                const rDate = new Date(r.fecha_hora);
                return rDate.getDate() == day && rDate.getMonth() == 3 && (r.mesa === mesaName || r.mesa === `Mesa ${i}`);
            });
            const dot = document.createElement('div');
            dot.className = isReserved ? 'table-dot reserved' : 'table-dot';
            dot.textContent = i;
            tablesContainer.appendChild(dot);
        }
    }

    if (calendarDays.length > 0) {
        calendarDays.forEach(d => d.addEventListener('click', () => {
            calendarDays.forEach(x => x.classList.remove('active'));
            d.classList.add('active');
            updateTables(d.textContent);
        }));
        updateTables(14);
    }

    if (reservaForm) {
        reservaForm.onsubmit = () => {
            const fd = new FormData(reservaForm);
            saveReservation(Object.fromEntries(fd));
        };
    }
});
