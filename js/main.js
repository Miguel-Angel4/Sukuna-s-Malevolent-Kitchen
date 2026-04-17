// ========================================
// Sukuna's Malevolent Kitchen - Main JavaScript (Final Robust Version)
// ========================================

const SUPABASE_URL = "https://wxbjrpqpomekvyuhlwdg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hshzjtEiSun_NwmqZgYkAw_ulq_v7aN";

let sb = null;
try {
    if (typeof supabase !== 'undefined') {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ Supabase conectado");
    }
} catch (e) { console.error("❌ Error inicialización Supabase:", e); }

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 DOM Cargado");

    // --- 1. NAVEGACIÓN Y SESIÓN ---
    const navLoginBtn = document.getElementById('nav-login');
    if (navLoginBtn && sb) {
        // Usar onAuthStateChange para detectar sesión en TODAS las páginas de forma fiable
        sb.auth.onAuthStateChange((event, session) => {
            if (session) {
                navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
                navLoginBtn.href = "cuenta.html";
            } else {
                navLoginBtn.innerHTML = `Iniciar Sesión`;
                navLoginBtn.href = "login.html";
            }
        });
    }

    // --- 2. GOOGLE LOGIN ---
    const googleBtn = document.getElementById('google-btn');
    if (googleBtn && sb) {
        googleBtn.onclick = async (e) => {
            e.preventDefault();
            await sb.auth.signInWithOAuth({ 
                provider: 'google',
                options: { redirectTo: window.location.origin + '/cuenta.html' }
            });
        };
    }

    // --- 3. LOGIN / REGISTRO ---
    const authForm = document.getElementById('auth-form');
    if (authForm && sb) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim();
            const pass = document.getElementById('auth-password').value.trim();
            const msg = document.getElementById('auth-message');
            const { error } = await sb.auth.signInWithPassword({ email, password: pass });
            if (error) { msg.textContent = "❌ " + error.message; msg.classList.remove('d-none'); }
            else { window.location.href = "cuenta.html"; }
        };
    }

    // --- 4. CALENDARIO Y RESERVAS ---
    const calendarToggle = document.getElementById('calendarToggle');
    const calendarWidget = document.getElementById('calendarWidget');
    if (calendarToggle && calendarWidget) {
        calendarToggle.onclick = () => calendarWidget.classList.toggle('active');
    }

    const tablesContainer = document.getElementById('tablesContainer');
    if (tablesContainer && sb) {
        const widgetHour = document.getElementById('widget-hour');
        
        const updateTables = async (day) => {
            if (!tablesContainer) return;
            tablesContainer.innerHTML = '<span style="color:red">Cargando...</span>';
            
            // Forzar descarga fresca de Supabase
            const { data: reservations, error } = await sb.from('reservations').select('*');
            if (error) console.error("Error al cargar mesas:", error);

            let h = 14, m = 0;
            if (widgetHour?.value) [h, m] = widgetHour.value.split(':').map(Number);
            
            tablesContainer.innerHTML = '';
            for (let i = 1; i <= 15; i++) {
                const mesaNombre = i === 15 ? "Mesa 15 (Especial para Cumpleaños)" : `Mesa ${i}`;
                
                const isBusy = (reservations || []).some(r => {
                    // Limpieza de datos para comparar
                    const resMesa = String(r.mesa).trim().toLowerCase();
                    const targetMesa = mesaNombre.trim().toLowerCase();
                    const simpleMesa = `mesa ${i}`;

                    const d = new Date(r.fecha_hora);
                    // Comparación robusta (Día, Mes y Año)
                    const dayMatch = d.getUTCDate() == day || d.getDate() == day;
                    const monthMatch = d.getUTCMonth() === 3 || d.getMonth() === 3; // Abril
                    
                    // Comparación de hora (margen de 2 horas para seguridad)
                    const resTotalMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
                    const targetTotalMinutes = h * 60 + m;
                    const timeMatch = Math.abs(resTotalMinutes - targetTotalMinutes) < 120;

                    return dayMatch && monthMatch && timeMatch && (resMesa === targetMesa || resMesa === simpleMesa);
                });

                const dot = document.createElement('div');
                dot.className = `table-dot ${isBusy ? 'reserved' : ''}`;
                dot.textContent = i;
                dot.title = isBusy ? "Mesa Ocupada" : "Mesa Libre";
                tablesContainer.appendChild(dot);
            }
        };

        document.querySelectorAll('.calendar-day:not(.other-month)').forEach(d => {
            d.onclick = () => {
                document.querySelectorAll('.calendar-day').forEach(x => x.classList.remove('active'));
                d.classList.add('active');
                const title = document.getElementById('status-title');
                if (title) title.textContent = `Estado para el día ${d.textContent}`;
                updateTables(d.textContent);
            };
        });
        
        // Carga inicial
        updateTables(14);
    }

    const resForm = document.getElementById('form-reserva');
    if (resForm && sb) {
        resForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(resForm);
            const data = Object.fromEntries(formData);

            try {
                // 1. GUARDAR EN SUPABASE (solo los campos de la tabla, sin campos de email)
                const supabaseData = {
                    nombre: data.nombre,
                    email: data.email,
                    telefono: data.telefono,
                    fecha_hora: data.fecha_hora,
                    personas: data.personas,
                    mesa: data.mesa,
                    peticiones: data.peticiones || ''
                };
                const { error: sbError } = await sb.from('reservations').insert([supabaseData]);
                if (sbError) throw sbError;

                // 2. ENVIAR EMAIL (campos extra solo para Formsubmit, no van a la BD)
                const emailData = {
                    ...supabaseData,
                    _subject: "¡Nueva Reserva en Sukuna's Kitchen!",
                    _captcha: "false"
                };
                fetch("https://formsubmit.co/ajax/sukunaamalevolentkitchen@gmail.com", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(emailData)
                })
                .then(r => r.json())
                .then(res => console.log("📧 Email enviado:", res))
                .catch(err => console.error("❌ Fallo email:", err));

                // 3. CONFIRMACIÓN Y REFRESCO
                alert(`🩸 RESERVA CONFIRMADA 🩸\n\nNombre: ${data.nombre}\nMesa: ${data.mesa}\nFecha: ${data.fecha_hora}`);
                resForm.reset();
                const activeDay = document.querySelector('.calendar-day.active');
                if (activeDay) setTimeout(() => updateTables(activeDay.textContent), 800);

            } catch (err) {
                alert("❌ Error: " + err.message);
            }
        };
    }

    // --- 5. CUENTA (cuenta.html) ---
    const profileForm = document.getElementById('profile-form');
    if (profileForm && sb) {
        sb.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;
            const emailIn = document.getElementById('profile-email');
            const nameIn = document.getElementById('profile-name');
            const bioIn = document.getElementById('profile-bio');
            const img = document.getElementById('display-profile-img');

            if (emailIn) { emailIn.value = user.email; emailIn.readOnly = true; }

            const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).single();
            if (prof) {
                if (nameIn) nameIn.value = prof.name || "";
                if (bioIn) bioIn.value = prof.bio || "";
                if (img && prof.photo) img.src = prof.photo;
            } else {
                const m = user.user_metadata;
                if (nameIn && m?.full_name) nameIn.value = m.full_name;
                if (img && m?.avatar_url) img.src = m.avatar_url;
            }

            const up = document.getElementById('profile-upload');
            if (up && img) {
                up.onchange = (e) => {
                    const f = e.target.files[0];
                    if (f) {
                        const r = new FileReader();
                        r.onload = (ev) => img.src = ev.target.result;
                        r.readAsDataURL(f);
                    }
                };
            }

            profileForm.onsubmit = async (e) => {
                e.preventDefault();
                await sb.from('profiles').upsert({
                    id: user.id,
                    name: nameIn?.value || "",
                    bio: bioIn?.value || "",
                    photo: img?.src || "",
                    updated_at: new Date()
                });
                alert("¡Identidad Guardada!");
            };
        });

        const logoutBtn = document.getElementById('logout-link') || document.getElementById('logout-link-side');
        if (logoutBtn) {
            logoutBtn.onclick = async (e) => {
                e.preventDefault();
                await sb.auth.signOut();
                window.location.href = "home.html";
            };
        }
    }

    // --- 6. CARTA ---
    const categoryCards = document.querySelectorAll('.card-comida');
    const menuDisplay = document.getElementById('menu-display');
    if (categoryCards.length > 0 && menuDisplay) {
        categoryCards.forEach(card => {
            card.onclick = () => {
                const cat = card.getAttribute('data-category');
                document.querySelectorAll('.menu-category').forEach(s => s.style.display = 'none');
                const target = document.getElementById(`sec-${cat}`);
                if (target) {
                    target.style.display = 'block';
                    menuDisplay.style.display = 'block';
                    document.querySelectorAll('.seccion-comida').forEach(s => s.style.display = 'none');
                }
            };
        });

        const btnVolver = document.getElementById('btn-volver');
        if (btnVolver) {
            btnVolver.onclick = () => {
                menuDisplay.style.display = 'none';
                document.querySelectorAll('.seccion-comida').forEach(s => s.style.display = 'block');
            };
        }

        const modal = document.getElementById('image-modal');
        document.querySelectorAll('.menu-item').forEach(item => {
            item.onclick = () => {
                const imgs = item.getAttribute('data-img')?.split(',') || [];
                const cont = document.getElementById('modal-img-container');
                if (cont && modal) {
                    cont.innerHTML = imgs.map(u => `<img src="${u.trim()}" class="img-fluid mb-2">`).join('');
                    modal.style.display = 'flex';
                }
            };
        });
        const close = document.querySelector('.close-modal');
        if (close && modal) close.onclick = () => modal.style.display = 'none';
    }
});
