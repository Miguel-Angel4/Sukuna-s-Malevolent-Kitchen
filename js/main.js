// ========================================
// Sukuna's Malevolent Kitchen - Main JavaScript
// ========================================

const SUPABASE_URL = "https://wxbjrpqpomekvyuhlwdg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hshzjtEiSun_NwmqZgYkAw_ulq_v7aN";

// EmailJS config (rellena con tus credenciales de emailjs.com)
const EMAILJS_SERVICE_ID  = "service_sukuna";     // <-- cambia esto
const EMAILJS_TEMPLATE_ID = "template_reserva";   // <-- cambia esto
const EMAILJS_PUBLIC_KEY  = "TU_PUBLIC_KEY";      // <-- cambia esto

let sb = null;
try {
    if (typeof supabase !== 'undefined') {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ Supabase conectado");
    }
} catch (e) { console.error("❌ Error Supabase:", e); }

// updateTables en ámbito global para que todos los bloques puedan usarla
let updateTables = async (day) => {};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 DOM Cargado");

    // --- 0. MENU MÓVIL ---
    const menuToggle = document.getElementById('menuToggle');
    const menu = document.querySelector('.menu');
    if (menuToggle && menu) {
        menuToggle.onclick = () => {
            menuToggle.classList.toggle('active');
            menu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        };

        // Cerrar menú al hacer clic en un enlace
        document.querySelectorAll('.nav-link').forEach(link => {
            link.onclick = () => {
                menuToggle.classList.remove('active');
                menu.classList.remove('active');
                document.body.classList.remove('menu-open');
            };
        });
    }

    // --- 1. NAVEGACIÓN ---
    const navLoginBtn = document.getElementById('nav-login');
    if (navLoginBtn && sb) {
        const updateNav = (session) => {
            if (session) {
                navLoginBtn.innerHTML = `<strong>Mi Cuenta</strong>`;
                navLoginBtn.href = "cuenta.html";
            } else {
                navLoginBtn.innerHTML = `Iniciar Sesión`;
                navLoginBtn.href = "login.html";
            }
        };

        // 1. Check inicial (para que salga rápido al cargar)
        const { data: { session } } = await sb.auth.getSession();
        updateNav(session);

        // 2. Escuchar cambios (login/logout)
        sb.auth.onAuthStateChange((_event, session) => updateNav(session));
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

    // --- 3. LOGIN ---
    const authForm = document.getElementById('auth-form');
    if (authForm && sb) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim();
            const pass  = document.getElementById('auth-password').value.trim();
            const msg   = document.getElementById('auth-message');
            const { error } = await sb.auth.signInWithPassword({ email, password: pass });
            if (error) { msg.textContent = "❌ " + error.message; msg.classList.remove('d-none'); }
            else { window.location.href = "cuenta.html"; }
        };

        const forgotBtn = document.getElementById('forgot-password');
        if (forgotBtn) {
            forgotBtn.onclick = async (e) => {
                e.preventDefault();
                const email = document.getElementById('auth-email').value.trim();
                const msg   = document.getElementById('auth-message');
                if (!email) { alert("Introduce tu email primero."); return; }
                const { error } = await sb.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/cuenta.html',
                });
                msg.textContent = error ? "❌ " + error.message : "✅ Email de recuperación enviado.";
                msg.classList.remove('d-none');
            };
        }
    }

    // --- 4. REGISTRO ---
    const regForm = document.getElementById('register-form');
    if (regForm && sb) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value.trim();
            const pass  = document.getElementById('reg-password').value.trim();
            const msg   = document.getElementById('reg-message');
            const { data, error } = await sb.auth.signUp({ email, password: pass });
            if (error) msg.textContent = "❌ " + error.message;
            else if (data.user?.identities?.length === 0) msg.textContent = "⚠️ Ya existe.";
            else msg.textContent = "✅ Cuenta creada.";
            msg.classList.remove('d-none');
        };
    }

    // --- 5. CALENDARIO Y RESERVAS ---
    const calendarToggle  = document.getElementById('calendarToggle');
    const calendarWidget  = document.getElementById('calendarWidget');
    if (calendarToggle && calendarWidget) {
        calendarToggle.onclick = () => calendarWidget.classList.toggle('active');
    }

    const tablesContainer = document.getElementById('tablesContainer');
    const widgetHour      = document.getElementById('widget-hour');

    // Definir updateTables globalmente
    updateTables = async (day) => {
        if (!tablesContainer || !sb) return;
        tablesContainer.innerHTML = '<span style="color:#aaa;font-size:0.8rem">Cargando...</span>';

        const { data: reservations, error } = await sb.from('reservations').select('*');
        if (error) { console.error("Error mesas:", error); return; }

        let h = 14, m = 0;
        if (widgetHour?.value) [h, m] = widgetHour.value.split(':').map(Number);

        tablesContainer.innerHTML = '';
        for (let i = 1; i <= 15; i++) {
            const mesaNombre = i === 15 ? "Mesa 15 (Especial para Cumpleaños)" : `Mesa ${i}`;
            const isBusy = (reservations || []).some(r => {
                const resMesa  = String(r.mesa).trim().toLowerCase();
                const baseMesa = `mesa ${i}`;
                const fullMesa = mesaNombre.trim().toLowerCase();

                const d = new Date(r.fecha_hora);
                // Comprobar día (UTC y local para robustez)
                const dayMatch   = d.getUTCDate() == day || d.getDate() == day;
                const monthMatch = d.getUTCMonth() === 3 || d.getMonth() === 3; // Abril

                // Bloqueo de exactamente 1 hora (60 min)
                const resMin    = d.getUTCHours() * 60 + d.getUTCMinutes();
                const targetMin = h * 60 + m;
                const timeMatch = Math.abs(resMin - targetMin) < 60;

                return dayMatch && monthMatch && timeMatch && (resMesa === baseMesa || resMesa === fullMesa);
            });

            const dot = document.createElement('div');
            dot.className = `table-dot ${isBusy ? 'reserved' : ''}`;
            dot.textContent = i;
            dot.title = isBusy ? "Ocupada" : "Libre";
            tablesContainer.appendChild(dot);
        }
    };

    // Asignar eventos a los días del calendario
    document.querySelectorAll('.calendar-day:not(.other-month)').forEach(d => {
        d.onclick = () => {
            document.querySelectorAll('.calendar-day').forEach(x => x.classList.remove('active'));
            d.classList.add('active');
            const title = document.getElementById('status-title');
            if (title) title.textContent = `Estado para el día ${d.textContent}`;
            updateTables(d.textContent);
        };
    });

    if (widgetHour) {
        widgetHour.onchange = () => {
            const active = document.querySelector('.calendar-day.active');
            if (active) updateTables(active.textContent);
        };
    }

    // Carga inicial del calendario
    if (tablesContainer) updateTables(14);

    // --- 6. FORMULARIO DE EMPLEO ---
    const cvForm = document.getElementById('form-empleo');
    const cvFormStatus = document.getElementById('cv-form-status');
    if (cvForm && cvFormStatus) {
        const cvInput = document.getElementById('cv');
        const cvPreview = document.getElementById('cv-preview');
        const cvPreviewBody = document.getElementById('cv-preview-body');
        const cvPreviewMeta = document.getElementById('cv-preview-meta');
        let cvPreviewUrl = null;

        const resetCvPreview = () => {
            if (cvPreviewUrl) {
                URL.revokeObjectURL(cvPreviewUrl);
                cvPreviewUrl = null;
            }

            if (cvPreviewBody) cvPreviewBody.innerHTML = "";
            if (cvPreviewMeta) cvPreviewMeta.textContent = "";
            if (cvPreview) cvPreview.classList.add('d-none');
        };

        const formatFileSize = (bytes) => {
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        };

        const renderCvPreview = (file) => {
            resetCvPreview();

            if (!file || !cvPreview || !cvPreviewBody || !cvPreviewMeta) return;

            cvPreviewUrl = URL.createObjectURL(file);
            cvPreviewMeta.textContent = `${file.name} - ${formatFileSize(file.size)}`;

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = cvPreviewUrl;
                img.alt = 'Vista previa de la imagen seleccionada';
                img.className = 'cv-preview-image';
                cvPreviewBody.appendChild(img);
            } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                const frame = document.createElement('iframe');
                frame.src = cvPreviewUrl;
                frame.className = 'cv-preview-frame';
                frame.title = 'Vista previa del PDF seleccionado';

                const note = document.createElement('p');
                note.className = 'cv-preview-note';
                note.textContent = 'Si tu navegador no muestra el PDF aqui, puedes abrirlo en otra pestana.';

                const link = document.createElement('a');
                link.href = cvPreviewUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'cv-preview-link';
                link.textContent = 'Abrir PDF';

                cvPreviewBody.appendChild(frame);
                cvPreviewBody.appendChild(note);
                cvPreviewBody.appendChild(link);
            } else {
                const note = document.createElement('p');
                note.className = 'cv-preview-note';
                note.textContent = 'Archivo seleccionado correctamente. Este tipo de archivo no tiene vista previa en el navegador.';
                cvPreviewBody.appendChild(note);
            }

            cvPreview.classList.remove('d-none');
        };

        if (cvInput) {
            cvInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                renderCvPreview(file);
            });
        }

        if (typeof Forminit !== 'undefined') {
            const cvButton = cvForm.querySelector('button[type="submit"]');
            const cvButtonText = cvButton ? cvButton.textContent : "";
            const forminit = new Forminit();

            cvForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                cvFormStatus.className = 'alert alert-info mb-4';
                cvFormStatus.textContent = 'Enviando candidatura...';

                if (cvButton) {
                    cvButton.disabled = true;
                    cvButton.textContent = 'Enviando...';
                }

                try {
                    const formData = new FormData(cvForm);
                    const { error } = await forminit.submit('b8sn8gw0v8z', formData);

                    if (error) {
                        throw new Error(error.message || 'No se pudo enviar el formulario.');
                    }

                    cvFormStatus.className = 'alert alert-success mb-4';
                    cvFormStatus.textContent = 'Hemos recibido tu candidatura correctamente. Revisaremos tu CV muy pronto.';
                    cvForm.reset();
                    resetCvPreview();
                } catch (err) {
                    cvFormStatus.className = 'alert alert-danger mb-4';
                    cvFormStatus.textContent = err.message || 'No se pudo enviar tu candidatura.';
                } finally {
                    if (cvButton) {
                        cvButton.disabled = false;
                        cvButton.textContent = cvButtonText;
                    }

                    cvFormStatus.classList.remove('d-none');
                    cvFormStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    }

    // --- 7. FORMULARIO DE RESERVA ---
    const resForm = document.getElementById('form-reserva');
    if (resForm && sb) {
        resForm.onsubmit = async (e) => {
            e.preventDefault();
            const fd   = new FormData(resForm);
            const data = Object.fromEntries(fd);

            try {
                // 1. GUARDAR EN SUPABASE
                const supabaseData = {
                    nombre:     data.nombre,
                    email:      data.email,
                    telefono:   data.telefono,
                    fecha_hora: data.fecha_hora,
                    personas:   parseInt(data.personas),
                    mesa:       data.mesa,
                    peticiones: data.peticiones || ''
                };
                const { error: sbError } = await sb.from('reservations').insert([supabaseData]);
                if (sbError) throw sbError;

                // Enviar email usando el proxy de Vercel hacia Formsubmit (evita Cisco Umbrella)
                const emailData = {
                    ...supabaseData,
                    _subject: "¡Nueva Reserva en Sukuna's Kitchen!",
                    _captcha: "false"
                };

                fetch("/api/form-submit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(emailData)
                })
                .then(r => console.log("📧 Email enviado al proxy:", r.status))
                .catch(e => console.warn("⚠️ Proxy no disponible:", e));

                // 3. CONFIRMACIÓN
                alert(`🩸 RESERVA CONFIRMADA 🩸\n\nNombre: ${data.nombre}\nMesa: ${data.mesa}\nFecha: ${data.fecha_hora.replace('T', ' ')}\nPersonas: ${data.personas}`);
                resForm.reset();

                // 4. REFRESCAR CALENDARIO
                const activeDay = document.querySelector('.calendar-day.active');
                if (activeDay) setTimeout(() => updateTables(activeDay.textContent), 600);

            } catch (err) {
                console.error("Error reserva:", err);
                alert("❌ Error: " + err.message);
            }
        };
    }

    // --- 8. CUENTA (cuenta.html) ---
    const profileForm = document.getElementById('profile-form');
    if (profileForm && sb) {
        sb.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return;
            const emailIn = document.getElementById('profile-email');
            const nameIn  = document.getElementById('profile-name');
            const bioIn   = document.getElementById('profile-bio');
            const img     = document.getElementById('display-profile-img');

            if (emailIn) { emailIn.value = user.email; emailIn.readOnly = true; }

            const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).single();
            if (prof) {
                if (nameIn) nameIn.value = prof.name || "";
                if (bioIn)  bioIn.value  = prof.bio  || "";
                if (img && prof.photo) img.src = prof.photo;
            } else {
                const m = user.user_metadata;
                if (nameIn && m?.full_name)  nameIn.value = m.full_name;
                if (img    && m?.avatar_url) img.src      = m.avatar_url;
            }

            // --- ACTUALIZAR ESTADÍSTICAS EN TIEMPO REAL ---
            // 1. Reservas Pendientes
            const now = new Date().toISOString();
            const { data: resData } = await sb
                .from('reservations')
                .select('id')
                .eq('email', user.email)
                .gte('fecha_hora', now);
            
            const pendingCountEl = document.getElementById('pending-reservations-count');
            if (pendingCountEl && resData) {
                pendingCountEl.textContent = resData.length;
            }

            // 2. Descuentos Actuales (Placeholder por ahora, ya que no hay tabla de cupones)
            const discountsCountEl = document.getElementById('current-discounts-count');
            if (discountsCountEl) {
                discountsCountEl.textContent = "0";
            }

            const up = document.getElementById('profile-upload');
            if (up && img) {
                up.onchange = (e) => {
                    const f = e.target.files[0];
                    if (f) { const r = new FileReader(); r.onload = ev => img.src = ev.target.result; r.readAsDataURL(f); }
                };
            }

            profileForm.onsubmit = async (e) => {
                e.preventDefault();
                const { error } = await sb.from('profiles').upsert({
                    id: user.id,
                    name: nameIn?.value || "",
                    bio:  bioIn?.value  || "",
                    photo: img?.src     || "",
                    updated_at: new Date()
                });
                alert(error ? "❌ Error: " + error.message : "¡Identidad Guardada!");
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

    // --- 9. CARTA ---
    const categoryCards = document.querySelectorAll('.card-comida');
    const menuDisplay   = document.getElementById('menu-display');
    if (categoryCards.length > 0 && menuDisplay) {
        categoryCards.forEach(card => {
            card.onclick = () => {
                const cat    = card.getAttribute('data-category');
                const target = document.getElementById(`sec-${cat}`);
                document.querySelectorAll('.menu-category').forEach(s => s.style.display = 'none');
                if (target) {
                    target.style.display = 'block';
                    menuDisplay.style.display = 'block';
                    document.querySelectorAll('.seccion-comida').forEach(s => s.style.display = 'none');
                }
            };
        });

        // Hacer que los enlaces de texto de la barra superior también funcionen
        const categoryLinks = document.querySelectorAll('.categoria-link');
        categoryLinks.forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                const cat = link.getAttribute('href').replace('#', '');
                const target = document.getElementById(`sec-${cat}`);
                document.querySelectorAll('.menu-category').forEach(s => s.style.display = 'none');
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
    // --- 10. GESTIÓN DE COOKIES ---
    const initCookies = () => {
        const cookiePrefs = localStorage.getItem('cookie_prefs');
        if (!cookiePrefs) {
            const banner = document.createElement('div');
            banner.className = 'cookie-banner';
            banner.innerHTML = `
                <div class="cookie-banner-title">Juramento de Privacidad</div>
                <div class="cookie-banner-text">
                    En Sukuna's Malevolent Kitchen utilizamos cookies para asegurar que tu experiencia sea de grado especial. ¿Aceptas nuestro contrato?
                </div>
                <div class="cookie-banner-buttons">
                    <button class="btn-cookie btn-cookie-accept" id="accept-all-cookies">Aceptar todo</button>
                    <button class="btn-cookie btn-cookie-reject" id="reject-optional-cookies">Solo necesarias</button>
                    <a href="cookies.html" class="btn-cookie btn-cookie-settings">Ajustes</a>
                </div>
            `;
            document.body.appendChild(banner);
            setTimeout(() => banner.classList.add('active'), 1000);

            document.getElementById('accept-all-cookies').onclick = () => {
                localStorage.setItem('cookie_prefs', JSON.stringify({
                    functional: true,
                    analytical: true,
                    marketing: true,
                    accepted: true
                }));
                banner.classList.remove('active');
                setTimeout(() => banner.remove(), 500);
            };

            document.getElementById('reject-optional-cookies').onclick = () => {
                localStorage.setItem('cookie_prefs', JSON.stringify({
                    functional: false,
                    analytical: false,
                    marketing: false,
                    accepted: true
                }));
                banner.classList.remove('active');
                setTimeout(() => banner.remove(), 500);
            };
        }
    };
    initCookies();
});
