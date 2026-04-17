// ========================================
// Sukuna's Malevolent Kitchen - Main JavaScript (Stable Version)
// ========================================

const SUPABASE_URL = "https://wxbjrpqpomekvyuhlwdg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hshzjtEiSun_NwmqZgYkAw_ulq_v7aN";

let sb = null;
try {
    if (typeof supabase !== 'undefined') {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ Supabase conectado");
    }
} catch (e) { console.error("❌ Error inicialización:", e); }

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 DOM Cargado");

    // --- 1. NAVEGACIÓN Y SESIÓN ---
    const setupNav = async () => {
        const navLoginBtn = document.getElementById('nav-login');
        if (navLoginBtn && sb) {
            const { data: { session } } = await sb.auth.getSession();
            if (session) {
                navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
                navLoginBtn.href = "cuenta.html";
            }
        }
    };
    setupNav();

    // --- 2. GOOGLE LOGIN (UNIVERSAL) ---
    const googleBtn = document.getElementById('google-btn');
    if (googleBtn && sb) {
        googleBtn.onclick = async (e) => {
            e.preventDefault();
            console.log("🔄 OAuth Google...");
            await sb.auth.signInWithOAuth({ 
                provider: 'google',
                options: { redirectTo: window.location.origin + '/cuenta.html' }
            });
        };
    }

    // --- 3. LOGIN (login.html) ---
    const authForm = document.getElementById('auth-form');
    if (authForm && sb) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim();
            const pass = document.getElementById('auth-password').value.trim();
            const msg = document.getElementById('auth-message');
            const { error } = await sb.auth.signInWithPassword({ email, password: pass });
            if (error) {
                msg.textContent = "❌ " + error.message;
                msg.classList.remove('d-none');
            } else { window.location.href = "cuenta.html"; }
        };

        const forgotBtn = document.getElementById('forgot-password');
        if (forgotBtn) {
            forgotBtn.onclick = async (e) => {
                e.preventDefault();
                const email = document.getElementById('auth-email').value.trim();
                const msg = document.getElementById('auth-message');
                if (!email) { alert("Introduce tu email"); return; }
                const { error } = await sb.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/cuenta.html',
                });
                msg.textContent = error ? "❌ " + error.message : "✅ Email enviado.";
                msg.classList.remove('d-none');
            };
        }
    }

    // --- 4. REGISTRO (registro.html) ---
    const regForm = document.getElementById('register-form');
    if (regForm && sb) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value.trim();
            const msg = document.getElementById('reg-message');
            const { data, error } = await sb.auth.signUp({ email, password: pass });
            if (error) msg.textContent = "❌ " + error.message;
            else if (data.user?.identities?.length === 0) msg.textContent = "⚠️ Ya existe.";
            else msg.textContent = "✅ Creada.";
            msg.classList.remove('d-none');
        };
    }

    // --- 5. CUENTA (cuenta.html) ---
    const profileForm = document.getElementById('profile-form');
    if (profileForm && sb) {
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
            const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                document.getElementById('profile-name').value = profile.name || "";
                document.getElementById('profile-bio').value = profile.bio || "";
                if (profile.photo) document.getElementById('display-profile-img').src = profile.photo;
            }
            document.getElementById('profile-email').value = user.email;

            // Foto de perfil
            const uploadInput = document.getElementById('profile-upload');
            if (uploadInput) {
                uploadInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => document.getElementById('display-profile-img').src = ev.target.result;
                        reader.readAsDataURL(file);
                    }
                };
            }

            profileForm.onsubmit = async (e) => {
                e.preventDefault();
                await sb.from('profiles').upsert({
                    id: user.id,
                    name: document.getElementById('profile-name').value.trim(),
                    bio: document.getElementById('profile-bio').value.trim(),
                    photo: document.getElementById('display-profile-img').src,
                    updated_at: new Date()
                });
                alert("Perfil actualizado");
            };
        }

        // Recuperación
        if (window.location.hash.includes('type=recovery')) {
            const modal = document.getElementById('recovery-modal');
            if (modal) {
                modal.style.display = 'flex';
                document.getElementById('save-new-password').onclick = async () => {
                    const pass = document.getElementById('new-password').value;
                    const { error } = await sb.auth.updateUser({ password: pass });
                    alert(error ? "Error: " + error.message : "Contraseña actualizada");
                    if (!error) window.location.href = "cuenta.html";
                };
            }
        }
    }

    // --- 6. RESERVAS (reserva.html) ---
    const calendarToggle = document.getElementById('calendarToggle');
    const calendarWidget = document.getElementById('calendarWidget');
    if (calendarToggle && calendarWidget) {
        calendarToggle.onclick = () => calendarWidget.classList.toggle('active');
    }

    const tablesContainer = document.getElementById('tablesContainer');
    if (tablesContainer && sb) {
        const widgetHour = document.getElementById('widget-hour');
        const mainDate = document.getElementById('fecha_hora');
        
        const updateTables = async (day) => {
            tablesContainer.innerHTML = ' Cargando...';
            const { data: reservations } = await sb.from('reservations').select('*');
            let hour = 14, min = 0;
            if (widgetHour?.value) [hour, min] = widgetHour.value.split(':').map(Number);
            
            tablesContainer.innerHTML = '';
            for (let i = 1; i <= 15; i++) {
                const mesa = i === 15 ? "Mesa 15 (Especial para Cumpleaños)" : `Mesa ${i}`;
                const isBusy = reservations?.some(r => {
                    const d = new Date(r.fecha_hora);
                    return d.getDate() == day && Math.abs((d.getHours()*60+d.getMinutes()) - (hour*60+min)) < 60 && r.mesa === mesa;
                });
                const dot = document.createElement('div');
                dot.className = `table-dot ${isBusy ? 'reserved' : ''}`;
                dot.textContent = i;
                tablesContainer.appendChild(dot);
            }
        };

        document.querySelectorAll('.calendar-day:not(.other-month)').forEach(d => {
            d.onclick = () => {
                document.querySelectorAll('.calendar-day').forEach(x => x.classList.remove('active'));
                d.classList.add('active');
                updateTables(d.textContent);
            };
        });

        if (widgetHour) widgetHour.onchange = () => {
            const active = document.querySelector('.calendar-day.active');
            if (active) updateTables(active.textContent);
        };

        const resForm = document.getElementById('form-reserva');
        if (resForm) {
            resForm.onsubmit = async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(resForm));
                try {
                    await sb.from('reservations').insert([data]);
                    await fetch("https://formsubmit.co/ajax/miguelangel261106@gmail.com", {
                        method: "POST", headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    alert("Reserva confirmada");
                    resForm.reset();
                } catch (err) { alert("Error: " + err.message); }
            };
        }
    }
});
