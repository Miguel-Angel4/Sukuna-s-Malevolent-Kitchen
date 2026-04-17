// ========================================
// Sukuna's Malevolent Kitchen - Main JavaScript
// ========================================

// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://wxbjrpqpomekvyuhlwdg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hshzjtEiSun_NwmqZgYkAw_ulq_v7aN";
const supabase = typeof supabase !== 'undefined' ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// --- FUNCIONES GLOBALES ---
function createBloodParticles() {
    const container = document.getElementById('bloodParticles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'blood-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 20 + 's';
        p.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(p);
    }
}

// Slider logic
let currentSlide = 0;
function goToSlide(idx) {
    const sliderUl = document.getElementById('sliderUl');
    if (!sliderUl) return;
    sliderUl.style.animation = 'none';
    sliderUl.style.marginLeft = -(idx * 100) + '%';
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    setTimeout(() => {
        sliderUl.style.animation = 'slide 20s infinite ease-in-out';
        sliderUl.style.animationDelay = -(idx * 4) + 's';
    }, 50);
}

// --- LOGICA PRINCIPAL (AL CARGAR DOM) ---
document.addEventListener('DOMContentLoaded', async () => {
    createBloodParticles();

    // 1. Navegación y Sesión
    const navLoginBtn = document.getElementById('nav-login');
    if (navLoginBtn && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
            navLoginBtn.href = "cuenta.html";
            navLoginBtn.classList.add('logged-in');
        }
    }

    // 2. Google Login (Universal para cualquier página con botón Google)
    const googleBtn = document.getElementById('google-btn');
    if (googleBtn && supabase) {
        googleBtn.onclick = (e) => {
            e.preventDefault();
            supabase.auth.signInWithOAuth({ 
                provider: 'google',
                options: { redirectTo: window.location.origin + '/cuenta.html' }
            });
        };
    }

    // 3. Formulario de Login (login.html)
    const authForm = document.getElementById('auth-form');
    if (authForm && supabase) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim();
            const pass = document.getElementById('auth-password').value.trim();
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            const msg = document.getElementById('auth-message');
            if (error) {
                msg.textContent = "❌ " + error.message;
                msg.classList.remove('d-none');
            } else {
                window.location.href = "cuenta.html";
            }
        };
    }

    // 4. Formulario de Registro (registro.html)
    const registerForm = document.getElementById('register-form');
    if (registerForm && supabase) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value.trim();
            const { data, error } = await supabase.auth.signUp({ email, password: pass });
            const msg = document.getElementById('reg-message');
            
            if (error) {
                msg.textContent = "❌ " + error.message;
                msg.className = "alert alert-danger mt-3 text-center";
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                msg.textContent = "⚠️ Cuenta ya existente";
                msg.className = "alert alert-warning mt-3 text-center";
            } else {
                msg.textContent = "✅ Cuenta creada";
                msg.className = "alert alert-success mt-3 text-center";
                registerForm.reset();
            }
            msg.classList.remove('d-none');
        };
    }

    // 5. Gestión de Perfil (cuenta.html)
    const profileForm = document.getElementById('profile-form');
    if (profileForm && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "login.html"; return; }

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
            document.getElementById('profile-name').value = profile.name || "";
            document.getElementById('profile-bio').value = profile.bio || "";
            if (profile.photo) document.getElementById('display-profile-img').src = profile.photo;
        }
        document.getElementById('profile-email').value = user.email;

        profileForm.onsubmit = async (e) => {
            e.preventDefault();
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                name: document.getElementById('profile-name').value.trim(),
                bio: document.getElementById('profile-bio').value.trim(),
                photo: document.getElementById('display-profile-img').src,
                updated_at: new Date()
            });
            const msg = document.getElementById('profile-msg');
            msg.textContent = error ? "❌ " + error.message : "✅ Perfil actualizado.";
            msg.className = `alert mt-3 text-center ${error ? 'alert-danger' : 'alert-success'}`;
            msg.classList.remove('d-none');
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

    // 6. Reservas (reserva.html)
    const tablesContainer = document.getElementById('tablesContainer');
    const fechaHoraInput = document.getElementById('fecha_hora');
    const calendarDays = document.querySelectorAll('.calendar-day:not(.other-month)');

    if (tablesContainer) {
        async function updateTables(day) {
            tablesContainer.innerHTML = '';
            const { data: reservations } = await supabase.from('reservations').select('*');
            
            let selHour = 12, selMin = 0;
            if (fechaHoraInput && fechaHoraInput.value) {
                const dt = new Date(fechaHoraInput.value);
                selHour = dt.getHours(); selMin = dt.getMinutes();
            }

            for (let i = 1; i <= 15; i++) {
                const mesaName = i === 15 ? "Mesa 15 (Especial para Cumpleaños)" : `Mesa ${i}`;
                const isReserved = (reservations || []).some(res => {
                    const rDate = new Date(res.fecha_hora);
                    if (rDate.getDate() == day && rDate.getMonth() == 3) {
                        const diff = Math.abs((rDate.getHours() * 60 + rDate.getMinutes()) - (selHour * 60 + selMin));
                        return diff < 60 && (res.mesa === mesaName || res.mesa === `Mesa ${i}`);
                    }
                    return false;
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
            updateTables(14); // Día por defecto
        }

        if (fechaHoraInput) {
            fechaHoraInput.addEventListener('change', () => {
                const activeDay = document.querySelector('.calendar-day.active');
                if (activeDay) updateTables(activeDay.textContent);
            });
        }

        const reservaForm = document.getElementById('form-reserva');
        if (reservaForm) {
            reservaForm.onsubmit = async (e) => {
                e.preventDefault();
                const fd = new FormData(reservaForm);
                await supabase.from('reservations').insert([Object.fromEntries(fd)]);
                alert("Reserva realizada con éxito");
                reservaForm.reset();
            };
        }
    }
});
