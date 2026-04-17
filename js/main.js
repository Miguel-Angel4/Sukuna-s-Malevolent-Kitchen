// ========================================
// Sukuna's Malevolent Kitchen - Main JavaScript (Blindado)
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
        sb.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
                navLoginBtn.href = "cuenta.html";
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
            tablesContainer.innerHTML = '...';
            const { data: reservations } = await sb.from('reservations').select('*');
            let h = 14, m = 0;
            if (widgetHour?.value) [h, m] = widgetHour.value.split(':').map(Number);
            
            tablesContainer.innerHTML = '';
            for (let i = 1; i <= 15; i++) {
                const mesa = i === 15 ? "Mesa 15 (Especial para Cumpleaños)" : `Mesa ${i}`;
                const busy = reservations?.some(r => {
                    const d = new Date(r.fecha_hora);
                    // Comprobar día, mes (Abril=3) y año (2026)
                    return d.getDate() == day && d.getMonth() === 3 && d.getFullYear() === 2026 &&
                           Math.abs((d.getHours()*60+d.getMinutes()) - (h*60+m)) < 60 && 
                           (r.mesa === mesa || r.mesa === `Mesa ${i}`);
                });
                const dot = document.createElement('div');
                dot.className = `table-dot ${busy ? 'reserved' : ''}`;
                dot.textContent = i;
                dot.title = busy ? "Ocupada" : "Libre";
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
        updateTables(14);

        const resForm = document.getElementById('form-reserva');
        if (resForm) {
            resForm.onsubmit = async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(resForm));
                try {
                    await sb.from('reservations').insert([data]);
                    // 2. Intentar enviar el email (Formsubmit)
                    fetch("https://formsubmit.co/ajax/sukunaamalevolentkitchen@gmail.com", {
                        method: "POST", 
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(data)
                    }).then(res => console.log("📧 Formsubmit respuesta:", res))
                      .catch(e => console.error("❌ Error email:", e));
                    
                    // Mostrar resumen de la reserva al usuario
                    const resumen = `🩸 RESERVA CONFIRMADA 🩸\n\nNombre: ${data.nombre}\nMesa: ${data.mesa}\nHora: ${data.fecha_hora.replace('T', ' ')}`;
                    alert(resumen);
                    
                    resForm.reset();
                    
                    // FORZAR REFRESCO: Volver a cargar mesas tras 500ms para asegurar que Supabase se actualizó
                    setTimeout(() => {
                        const activeDay = document.querySelector('.calendar-day.active');
                        if (activeDay) updateTables(activeDay.textContent);
                    }, 500);

                } catch (err) { alert("❌ Error: " + err.message); }
            };
        }
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
