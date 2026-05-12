 // 
 // Sukuna's Malevolent Ki...
 // Rebuild Trigger: v1.0....
 // 

const modal = document.getElementById('game-modal');
const container = document.getElementById('game-container');
const timerDisplay = document.getElementById('game-timer');
const scoreDisplay = document.getElementById('game-score');

let timer = 0;
let score = 0;
let gameInterval;
let activeGame = null;
let pendingGameTimeouts = [];
let kokusenAttackCount = 0;
let kokusenStreak = 0;
let todoClickCount = 0;
let todoCurrentSpeed = 300;

function getGameScale() {
    return window.innerWidth <= 768 ? 0.3 : 1.0;
}

/* Obtiene la hora real g... */
async function getRealTime() {
 // 1. Intentar obtener la...
    try {
        const sbUrl = window.sb.supabaseUrl;
        const sbKey = window.sb.supabaseKey;
        if (sbUrl && sbKey) {
            const response = await fetch(`${sbUrl}/rest/v1/`, { 
                method: 'HEAD', 
                headers: { 'apikey': sbKey } 
            });
            const serverDate = response.headers.get('date');
            if (serverDate) {
                console.log("🕒 Hora de Supabase confirmada.");
                return new Date(serverDate);
            }
        }
    } catch (e) {
        console.warn("⚠️ Error obteniendo hora de Supabase (posible desfase de reloj bloqueando SSL).");
    }

 // 2. Intentar con una AP...
    const apis = [
        'https://worldtimeapi.org/api/timezone/Etc/UTC',
        'https://timeapi.io/api/Time/current/zone?timeZone=UTC'
    ];

    for (const url of apis) {
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                const timeStr = data.utc_datetime || data.dateTime;
                if (timeStr) {
                    console.log("🕒 Hora de API externa confirmada.");
                    return new Date(timeStr);
                }
            }
        } catch (e) {}
    }

 // Si fallan las fuentes ...
    return null;
}


async function checkGameAccess() {
    if (!window.sb) return true;
    
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) {
        alert("¡Alto ahí, hechicero! Debes iniciar sesión para acceder a los juegos y obtener descuentos.");
        window.location.href = "login.html";
        return false;
    }

    try {
        const now = await getRealTime();
        if (!now) {
            alert("⚠️ Error de sincronización temporal.\n\nNo se pudo verificar la hora real. Por favor, asegúrate de que el reloj de tu dispositivo esté configurado en 'Automático' y que tengas conexión a internet.");
            return false;
        }

        const { data: lastPlays, error: scoreError } = await window.sb
            .from('game_scores')
            .select('created_at, game_name')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (scoreError) return false;

        if (lastPlays && lastPlays.length > 0) {
            const lastPlayAt = new Date(lastPlays[0].created_at);
            const diffMs = now - lastPlayAt;
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

            if (diffMs < sevenDaysMs) {
                const nextPlay = new Date(lastPlayAt.getTime() + sevenDaysMs);
                const remaining = nextPlay - now;
                const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
                const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

                alert(`¡Paciencia, hechicero! Tu energía maldita se está recuperando.\n\nPodrás volver a jugar en: ${days}d ${hours}h ${mins}m.\n\n(No intentes adelantar el reloj, el Reino Sombrío usa tiempo real de servidor).`);
                return false;
            }
        }
    } catch (e) {
        return false;
    }
    return true;
}

const TODO_SEQUENCE = ['img/Todo sprite base.png', 'img/Todo sprite preparandose.png', 'img/Todo sprite levantandose.png', 'img/Todo sprite palmada.png'];
const KOKUSEN_COMBOS = {
    odd: { prepFrames: ['img/Itadori sprite base.png', 'img/Itadori sprite guardia.png', 'img/Itadori sprite preparando pu\u00f1etazo.png'], attackFrame: 'img/Itadori sprite golpeando.png', flashFrame: 'img/Itadori sprite black flash pu\u00f1etazo.png', frameDuration: 310, circleOffset: { x: 135, y: 60 }, effectOffset: { x: 165, y: 90 } },
    even: { prepFrames: ['img/Itadori sprite base.png', 'img/Itadori sprite preparando patada.png'], attackFrame: 'img/Itadori sprite pateando.png', flashFrame: 'img/Itadori sprite black flash patada.png', frameDuration: 310, circleOffset: { x: 135, y: 60 }, effectOffset: { x: 165, y: 90 } }
};

function registerGameTimeout(cb, d) { const id = setTimeout(() => { pendingGameTimeouts = pendingGameTimeouts.filter(t => t !== id); cb(); }, d); pendingGameTimeouts.push(id); return id; }
function clearPendingGameTimeouts() { pendingGameTimeouts.forEach(id => clearTimeout(id)); pendingGameTimeouts = []; }
async function saveReward(c, p, n) { if (!window.sb) return; const { data: { session } } = await window.sb.auth.getSession(); if (!session) return; await window.sb.from('rewards').insert([{ user_id: session.user.id, code: c, discount_percentage: p, game_name: n }]); }
async function saveGameScore(n, v) {
    if (!window.sb) return; const { data: { session } } = await window.sb.auth.getSession(); if (!session) return;
    let u = "Usuario"; try { const { data: p } = await window.sb.from('profiles').select('name').eq('id', session.user.id).single(); if (p && p.name) u = p.name; else u = session.user.user_metadata?.full_name || session.user.email.split('@')[0]; } catch(e) {}
    await window.sb.from('game_scores').insert([{ user_id: session.user.id, user_name: u, game_name: n, score: v }]);
    if (typeof loadLeaderboards === 'function') loadLeaderboards();
}
async function loadLeaderboards() {
    if (!window.sb) return;
    const games = [{ name: 'KOKUSEN (Yuji)', id: 'tabla-kokusen', order: false }, { name: 'BOOGIE WOOGIE (Todo)', id: 'tabla-boogie', order: false }, { name: 'CORTES (Sukuna)', id: 'tabla-cortes', order: false }, { name: 'AHORCADO (Gojo)', id: 'tabla-ahorcado', order: true }];
    for (const g of games) {
        const tb = document.querySelector(`#${g.id} tbody`); if (!tb) continue;
        const { data, error } = await window.sb.from('game_scores').select('*').eq('game_name', g.name).order('score', { ascending: g.order }).limit(5);
        if (error || !data || data.length === 0) { tb.innerHTML = `<tr><td colspan="3" class="text-center">Sin datos</td></tr>`; continue; }
        tb.innerHTML = data.map((r, i) => `<tr><td>${i+1}</td><td>${r.user_name || '...'}</td><td>${g.name==='AHORCADO (Gojo)'?r.score+'s':r.score}</td></tr>`).join('');
    }
}
document.addEventListener('DOMContentLoaded', () => { if (document.querySelector('[id^="tabla-"]')) setTimeout(loadLeaderboards, 1000); });
function stopGame() { modal.style.display = 'none'; container.innerHTML = ''; clearInterval(gameInterval); clearPendingGameTimeouts(); activeGame = null; if (window.musicController) window.musicController.playMain(); }
function updateDisplays() { timerDisplay.textContent = `Tiempo: ${Math.max(0, timer).toFixed(1)}s`; scoreDisplay.textContent = `Puntos: ${score}`; }

async function startKokusen() {
    if (!await checkGameAccess()) return;
    if (window.musicController) window.musicController.playGame('kokusen');
    modal.style.display = 'flex'; container.innerHTML = '<div style="color:#fff; padding:20px;">Pulsa los círculos a tiempo.</div>';
    timer = 40; score = 0; activeGame = 'kokusen'; updateDisplays();
    gameInterval = setInterval(() => {
        timer -= 0.1; updateDisplays();
        if (timer <= 0) {
            let d = 0, c = ""; if (score >= 201) { d = 15; c = "KOKUSEN15"; } else if (score >= 50) { d = 5; c = "KOKUSEN5"; }
            if (d > 0) { saveReward(c, d, "KOKUSEN (Yuji)"); alert(`¡Descuento: ${d}%!`); }
            saveGameScore('KOKUSEN (Yuji)', score); stopGame();
        }
    }, 100);
    spawnKokusenCircle();
}

function spawnKokusenCircle() {
    if (activeGame !== 'kokusen') return;
    kokusenAttackCount++; const combo = kokusenAttackCount % 2 === 1 ? KOKUSEN_COMBOS.odd : KOKUSEN_COMBOS.even;
    const arena = document.createElement('div'); arena.style.position = 'absolute'; arena.style.width = '200px'; arena.style.height = '200px'; container.appendChild(arena);
    const yuji = document.createElement('img'); yuji.style.width = '100%'; arena.appendChild(yuji);
    const startX = Math.random() > 0.5 ? -200 : 800; arena.style.left = startX + 'px';
    arena.style.transition = 'all 1s linear'; setTimeout(() => arena.style.left = '300px', 50);
 // ... simplificado para ...
}

async function startTodo() { if (!await checkGameAccess()) return; if (window.musicController) window.musicController.playGame('todo'); stopGame(); alert("Juego iniciado"); }
async function startGojo() { if (!await checkGameAccess()) return; stopGame(); alert("Juego iniciado"); }
async function startSukuna() { if (!await checkGameAccess()) return; stopGame(); alert("Juego iniciado"); }
async function startHakari() { if (!await checkGameAccess()) return; stopGame(); alert("Juego iniciado"); }
