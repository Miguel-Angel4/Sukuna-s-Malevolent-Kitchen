// ========================================
// Sukuna's Malevolent Kitchen - Main JavaScript
// ========================================

// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://wxbjrpqpomekvyuhlwdg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hshzjtEiSun_NwmqZgYkAw_ulq_v7aN";

// Usamos un nombre distinto para evitar conflictos con el objeto global de la librería
let sb = null;
try {
    if (typeof supabase !== 'undefined') {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ Supabase conectado");
    } else {
        console.error("❌ Librería Supabase no encontrada. Revisa el script en el HTML.");
    }
} catch (e) {
    console.error("❌ Error al inicializar Supabase:", e);
}

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
    console.log("🚀 DOM Cargado");
    createBloodParticles();

    // 1. Navegación y Sesión
    const navLoginBtn = document.getElementById('nav-login');
    if (navLoginBtn && sb) {
        const { data: { session } } = await sb.auth.getSession();
        if (session) {
            navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
            navLoginBtn.href = "cuenta.html";
            navLoginBtn.classList.add('logged-in');
        }
    }

    // 2. Google Login (Universal)
    const googleBtn = document.getElementById('google-btn');
    console.log("🔍 Buscando botón Google:", googleBtn ? "Encontrado" : "No encontrado");
    
    if (googleBtn && sb) {
        console.log("🎯 Botón Google listo para recibir clicks");
        googleBtn.onclick = async (e) => {
            e.preventDefault();
            console.log("🔄 Click detectado en Google Btn. Iniciando OAuth...");
            try {
                const { error } = await sb.auth.signInWithOAuth({ 
                    provider: 'google',
                    options: { 
                        redirectTo: window.location.origin + '/cuenta.html' 
                    }
                });
                if (error) {
                    console.error("❌ Error en OAuth:", error.message);
                    alert("Error Google: " + error.message);
                }
            } catch (err) {
                console.error("❌ Excepción en OAuth:", err);
            }
        };
    }

    // 3. Formulario de Login (login.html)
    const authForm = document.getElementById('auth-form');
    if (authForm && sb) {
        console.log("🎯 Formulario de Login detectado");
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim();
            const pass = document.getElementById('auth-password').value.trim();
            const msg = document.getElementById('auth-message');
            
            console.log("🔐 Intentando login para:", email);
            const { error } = await sb.auth.signInWithPassword({ email, password: pass });
            
            if (error) {
                msg.textContent = "❌ " + error.message;
                msg.classList.remove('d-none');
            } else {
                window.location.href = "cuenta.html";
            }
        });

        // Forgot Password logic
        const forgotBtn = document.getElementById('forgot-password');
        forgotBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim();
            const msg = document.getElementById('auth-message');
            
            if (!email) {
                msg.textContent = "❌ Por favor, introduce tu email primero.";
                msg.classList.remove('d-none');
                return;
            }

            const { error } = await sb.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/cuenta.html',
            });

            if (error) {
                msg.textContent = "❌ " + error.message;
            } else {
                msg.textContent = "✅ Email de recuperación enviado. Revisa tu bandeja de entrada.";
                msg.className = "alert alert-success mt-3 text-center";
            }
            msg.classList.remove('d-none');
        });
    }

    // 4. Formulario de Registro (registro.html)
    const registerForm = document.getElementById('register-form');
    if (registerForm && sb) {
        console.log("🎯 Formulario de Registro detectado");
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value.trim();
            const msg = document.getElementById('reg-message');
            
            console.log("📝 Intentando registro para:", email);
            const { data, error } = await sb.auth.signUp({ email, password: pass });
            
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
        });
    }

    // 5. Gestión de Perfil (cuenta.html)
    const profileForm = document.getElementById('profile-form');
    if (profileForm && sb) {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { window.location.href = "login.html"; return; }

        const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
            document.getElementById('profile-name').value = profile.name || "";
            document.getElementById('profile-bio').value = profile.bio || "";
            if (profile.photo) document.getElementById('display-profile-img').src = profile.photo;
        }
        document.getElementById('profile-email').value = user.email;

        // Lógica para subir foto de perfil
        const uploadInput = document.getElementById('profile-upload');
        const displayImg = document.getElementById('display-profile-img');
        if (uploadInput && displayImg) {
            uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        displayImg.src = event.target.result;
                        console.log("📸 Imagen cargada localmente");
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        profileForm.onsubmit = async (e) => {
            e.preventDefault();
            const { error } = await sb.from('profiles').upsert({
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
                await sb.auth.signOut();
                window.location.href = "home.html";
            };
        }

        // --- Lógica de recuperación de contraseña ---
        if (window.location.hash.includes('type=recovery')) {
            const recoveryModal = document.getElementById('recovery-modal');
            const saveBtn = document.getElementById('save-new-password');
            const newPassInput = document.getElementById('new-password');
            const recMsg = document.getElementById('recovery-msg');

            if (recoveryModal) {
                recoveryModal.style.display = 'flex';
                saveBtn.onclick = async () => {
                    const newPass = newPassInput.value.trim();
                    if (newPass.length < 6) {
                        recMsg.textContent = "❌ Mínimo 6 caracteres";
                        recMsg.className = "alert alert-danger mt-3";
                        recMsg.classList.remove('d-none');
                        return;
                    }

                    const { error } = await sb.auth.updateUser({ password: newPass });
                    if (error) {
                        recMsg.textContent = "❌ " + error.message;
                        recMsg.className = "alert alert-danger mt-3";
                    } else {
                        recMsg.textContent = "✅ Contraseña actualizada. Redirigiendo...";
                        recMsg.className = "alert alert-success mt-3";
                        setTimeout(() => window.location.href = "cuenta.html", 2000);
                    }
                    recMsg.classList.remove('d-none');
                };
            }
        }
    }

    // 6. Reservas (reserva.html)
    const tablesContainer = document.getElementById('tablesContainer');
    const fechaHoraInput = document.getElementById('fecha_hora');
    const calendarDays = document.querySelectorAll('.calendar-day:not(.other-month)');
    const calendarWidget = document.getElementById('calendarWidget');
    const calendarToggle = document.getElementById('calendarToggle');
    const statusTitle = document.getElementById('status-title');

    // Toggle del widget
    if (calendarToggle && calendarWidget) {
        calendarToggle.onclick = () => {
            calendarWidget.classList.toggle('active');
            console.log("📅 Toggle calendario");
        };
    }

        const widgetHourInput = document.getElementById('widget-hour');

        async function updateTables(day) {
            tablesContainer.innerHTML = '';
            const { data: reservations } = await sb.from('reservations').select('*');
            
            let selHour = 12, selMin = 0;
            // Prioridad al selector del widget si se está usando, si no, al del formulario principal
            if (widgetHourInput && widgetHourInput.value) {
                [selHour, selMin] = widgetHourInput.value.split(':').map(Number);
            } else if (fechaHoraInput && fechaHoraInput.value) {
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
                dot.title = isReserved ? `Ocupada a las ${selHour}:${selMin.toString().padStart(2,'0')}` : "Libre";
                tablesContainer.appendChild(dot);
            }
        }

        if (calendarDays.length > 0) {
            calendarDays.forEach(d => d.addEventListener('click', () => {
                calendarDays.forEach(x => x.classList.remove('active'));
                d.classList.add('active');
                if (statusTitle) statusTitle.textContent = `Estado para el día ${d.textContent}`;
                updateTables(d.textContent);
            }));
            updateTables(14); // Día por defecto
        }

        if (fechaHoraInput) {
            fechaHoraInput.addEventListener('change', () => {
                const activeDay = document.querySelector('.calendar-day.active');
                if (activeDay) updateTables(activeDay.textContent);
                // Sincronizar widget con formulario principal
                if (widgetHourInput && fechaHoraInput.value) {
                    const dt = new Date(fechaHoraInput.value);
                    widgetHourInput.value = `${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')}`;
                }
            });
        }

        if (widgetHourInput) {
            widgetHourInput.addEventListener('change', () => {
                const activeDay = document.querySelector('.calendar-day.active');
                if (activeDay) updateTables(activeDay.textContent);
            });
        }

        const reservaForm = document.getElementById('form-reserva');
        if (reservaForm) {
            reservaForm.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(reservaForm);
                const dataObj = Object.fromEntries(formData);

                try {
                    // 1. Guardar en Supabase
                    const { error: sbError } = await sb.from('reservations').insert([dataObj]);
                    if (sbError) throw sbError;

                    // 2. Enviar a Formsubmit (Email)
                    // Usamos el email del usuario para Formsubmit (miguelangel261106@gmail.com)
                    await fetch("https://formsubmit.co/ajax/miguelangel261106@gmail.com", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(dataObj)
                    });

                    alert("🩸 Reserva confirmada en el Dominio. Recibirás un correo en breve.");
                    reservaForm.reset();
                    const activeDay = document.querySelector('.calendar-day.active');
                    if (activeDay) updateTables(activeDay.textContent);

                } catch (err) {
                    console.error("Error en reserva:", err);
                    alert("❌ Error al procesar la reserva: " + err.message);
                }
            };
        }
    }
});
