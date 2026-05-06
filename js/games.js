// ==========================================
// Sukuna's Malevolent Kitchen - Game Logic
// Rebuild Trigger: v1.0.5 - Strict Server-Only Time
// ==========================================

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

/**
 * Obtiene la hora real garantizada desde el servidor de Supabase o una API externa.
 * Si no puede obtener una hora confiable, devuelve null para bloquear el acceso.
 */
async function getRealTime() {
    // 1. Intentar obtener la hora de los headers de Supabase (La fuente más fiable)
    try {
        const sbUrl = window.sb.supabaseUrl;
        const sbKey = window.sb.supabaseKey;
        if (sbUrl && sbKey) {
            // Hacemos una petición HEAD a la API de Supabase. El header "date" es del servidor.
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

    // 2. Intentar con una API de tiempo alternativa (usando HTTP para evitar bloqueos SSL si el reloj local está muy mal)
    // Nota: Muchos navegadores bloquean HTTP, así que intentamos HTTPS primero.
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

    // 3. Si el reloj local está tan mal que falla el SSL (HTTPS) y no hay internet fiable
    // NO devolvemos new Date() porque es lo que permite la trampa.
    return null;
}


// Función para verificar si el usuario está logueado y si puede jugar esta semana
async function checkGameAccess() {
    if (!window.sb) return true;
    
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) {
        alert("¡Alto ahí, hechicero! Debes iniciar sesión para acceder a los juegos y obtener descuentos.");
        window.location.href = "login.html";
        return false;
    }

    try {
        // 1. Obtener la hora real (Blindado contra cambios en el dispositivo)
        const now = await getRealTime();
        
        if (!now) {
            alert("⚠️ Error de sincronización temporal.\n\nNo se pudo verificar la hora real del Reino Sombrío. Esto ocurre si tu conexión es inestable o si la fecha de tu dispositivo es muy incorrecta y bloquea la conexión segura.\n\nPor favor, ajusta tu reloj a 'Automático' e inténtalo de nuevo.");
            return false;
        }

        // 2. Obtener la PARTIDA MÁS RECIENTE
        const { data: lastPlays, error: scoreError } = await window.sb
            .from('game_scores')
            .select('created_at, game_name')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (scoreError) {
            console.warn("⚠️ Error en historial, acceso denegado por seguridad.");
            return false;
        }

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

                alert(`¡Paciencia, hechicero!\n\nTu energía maldita aún no se ha recuperado. Ya jugaste al minijuego "${lastPlays[0].game_name}" recientemente.\n\nLímite: 1 partida cada 7 días reales.\nPodrás volver a jugar en: ${days}d ${hours}h ${mins}m.\n\n(Detección de tiempo activa: Cambiar el reloj de tu dispositivo no funcionará).`);
                return false;
            }
        }
    } catch (e) {
        console.error("Error crítico en checkGameAccess:", e);
        alert("Ocurrió un error al verificar tu acceso. Por favor, recarga la página.");
        return false;
    }

    return true;
}


const TODO_SEQUENCE = [
    'img/Todo sprite base.png',
    'img/Todo sprite preparandose.png',
    'img/Todo sprite levantandose.png',
    'img/Todo sprite palmada.png'
];

const KOKUSEN_COMBOS = {
    odd: {
        prepFrames: [
            'img/Itadori sprite base.png',
            'img/Itadori sprite guardia.png',
            'img/Itadori sprite preparando pu\u00f1etazo.png'
        ],
        attackFrame: 'img/Itadori sprite golpeando.png',
        flashFrame: 'img/Itadori sprite black flash pu\u00f1etazo.png',
        frameDuration: 310,
        circleOffset: { x: 135, y: 60 },
        effectOffset: { x: 165, y: 90 }
    },
    even: {
        prepFrames: [
            'img/Itadori sprite base.png',
            'img/Itadori sprite preparando patada.png'
        ],
        attackFrame: 'img/Itadori sprite pateando.png',
        flashFrame: 'img/Itadori sprite black flash patada.png',
        frameDuration: 310,
        circleOffset: { x: 135, y: 60 },
        effectOffset: { x: 165, y: 90 }
    }
};

function registerGameTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
        pendingGameTimeouts = pendingGameTimeouts.filter((id) => id !== timeoutId);
        callback();
    }, delay);
    pendingGameTimeouts.push(timeoutId);
    return timeoutId;
}

function clearPendingGameTimeouts() {
    pendingGameTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    pendingGameTimeouts = [];
}

async function saveReward(code, percentage, gameName) {
    if (!window.sb) return;
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) return;
    const { error } = await window.sb.from('rewards').insert([{ 
        user_id: session.user.id,
        code: code,
        discount_percentage: percentage,
        game_name: gameName
    }]);
    if (error) console.error("❌ Error al guardar recompensa:", error.message);
}

async function saveGameScore(gameName, scoreValue) {
    if (!window.sb) return;
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) return;
    let userName = "Usuario";
    try {
        const { data: prof } = await window.sb.from('profiles').select('name').eq('id', session.user.id).single();
        if (prof && prof.name) userName = prof.name;
        else userName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
    } catch(e) {}
    const { error } = await window.sb.from('game_scores').insert([{ 
        user_id: session.user.id,
        user_name: userName,
        game_name: gameName,
        score: scoreValue
    }]);
    if (!error && typeof loadLeaderboards === 'function') loadLeaderboards();
}

async function loadLeaderboards() {
    if (!window.sb) return;
    const games = [
        { name: 'KOKUSEN (Yuji)', id: 'tabla-kokusen', order: false },
        { name: 'BOOGIE WOOGIE (Todo)', id: 'tabla-boogie', order: false },
        { name: 'CORTES (Sukuna)', id: 'tabla-cortes', order: false },
        { name: 'AHORCADO (Gojo)', id: 'tabla-ahorcado', order: true }
    ];
    for (const game of games) {
        const tbody = document.querySelector(`#${game.id} tbody`);
        if (!tbody) continue;
        const { data, error } = await window.sb.from('game_scores').select('*').eq('game_name', game.name).order('score', { ascending: game.order }).limit(5);
        if (error) { tbody.innerHTML = `<tr><td colspan="3" class="text-center">Error</td></tr>`; continue; }
        if (!data || data.length === 0) { tbody.innerHTML = `<tr><td colspan="3" class="text-center">Vac\u00edo</td></tr>`; continue; }
        tbody.innerHTML = data.map((row, index) => {
            const displayScore = game.name === 'AHORCADO (Gojo)' ? `${row.score}s` : row.score;
            return `<tr><td>${index + 1}</td><td>${row.user_name || '...'}</td><td>${displayScore}</td></tr>`;
        }).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[id^="tabla-"]')) setTimeout(loadLeaderboards, 1000);
});

function stopGame() {
    modal.style.display = 'none';
    container.innerHTML = '';
    clearInterval(gameInterval);
    clearPendingGameTimeouts();
    container.style.transform = 'translate(0, 0)';
    container.style.animation = 'none';
    window.onkeydown = null;
    activeGame = null;
    timer = 0;
    score = 0;
    kokusenAttackCount = 0;
    kokusenStreak = 0;
    todoClickCount = 0;
    todoCurrentSpeed = 300;
    if (window.musicController) window.musicController.playMain();
}

function updateDisplays() {
    timerDisplay.textContent = `Tiempo: ${Math.max(0, timer).toFixed(1)}s`;
    scoreDisplay.textContent = `Puntos: ${score}`;
}

async function startKokusen() {
    if (!await checkGameAccess()) return;
    if (window.musicController) window.musicController.playGame('kokusen');
    modal.style.display = 'flex';
    container.innerHTML = '<div style="color:#fff; padding:20px;">Pulsa los círculos cuando el aro rojo coincida con el negro.</div>';
    timer = 40; score = 0; activeGame = 'kokusen'; kokusenAttackCount = 0; updateDisplays();
    gameInterval = setInterval(() => {
        timer -= 0.1; updateDisplays();
        if (timer <= 0) {
            let discount = 0; let code = "";
            if (score >= 201) { discount = 15; code = "KOKUSEN15"; }
            else if (score >= 101) { discount = 10; code = "KOKUSEN10"; }
            else if (score >= 50) { discount = 5; code = "KOKUSEN5"; }
            if (discount > 0) { saveReward(code, discount, "KOKUSEN (Yuji)"); alert(`¡Ganaste un ${discount}%! Código: ${code}`); }
            else alert("Sigue entrenando.");
            saveGameScore('KOKUSEN (Yuji)', score); stopGame();
        }
    }, 100);
    spawnKokusenCircle();
}

function playKokusenSequence(sprite, combo, onComplete) {
    let frameIndex = 0; sprite.src = combo.prepFrames[frameIndex];
    const showNextFrame = () => {
        if (activeGame !== 'kokusen' || !sprite.isConnected) return;
        frameIndex += 1;
        if (frameIndex >= combo.prepFrames.length) { sprite.src = combo.attackFrame; onComplete(); return; }
        sprite.src = combo.prepFrames[frameIndex];
        registerGameTimeout(showNextFrame, combo.frameDuration);
    };
    registerGameTimeout(showNextFrame, combo.frameDuration);
}

function createKokusenTarget(arena, yuji, combo) {
    if (activeGame !== 'kokusen' || !yuji.isConnected) return;
    const baseDuration = 1000;
    const currentDuration = Math.max(300, 1000 * Math.pow(0.85, kokusenStreak));
    const circle = document.createElement('div');
    circle.className = 'kokusen-target';
    circle.style.position = 'absolute';
    circle.style.width = '60px'; circle.style.height = '60px'; circle.style.borderRadius = '50%';
    circle.style.border = '3px solid #87CEEB'; circle.style.background = 'rgba(0,0,100,0.3)';
    circle.style.left = `${combo.circleOffset.x}px`; circle.style.top = `${combo.circleOffset.y}px`;
    circle.style.cursor = 'pointer'; circle.style.zIndex = '10'; circle.style.pointerEvents = 'auto';
    arena.appendChild(circle);
    const ring = document.createElement('div');
    ring.style.position = 'absolute'; ring.style.width = '120px'; ring.style.height = '120px';
    ring.style.borderRadius = '50%'; ring.style.border = '2px solid #B31B1B';
    ring.style.top = '-30px'; ring.style.left = '-30px'; ring.style.transition = `all ${currentDuration}ms linear`;
    circle.appendChild(ring);
    void ring.offsetHeight;
    registerGameTimeout(() => { ring.style.width = '60px'; ring.style.height = '60px'; ring.style.top = '0px'; ring.style.left = '0px'; }, 20);
    circle.onclick = () => {
        if (activeGame !== 'kokusen' || circle.dataset.clicked) return;
        circle.dataset.clicked = "true";
        const currentSize = parseInt(window.getComputedStyle(ring).width, 10);
        if (currentSize <= 66 && currentSize >= 54) {
            score += 10; kokusenStreak++; yuji.src = combo.flashFrame;
            showBlackFlashEffect(arena, combo.effectOffset.x, combo.effectOffset.y);
            registerGameTimeout(() => { if (arena.isConnected) arena.remove(); }, 500);
        } else { score = (currentSize > 66) ? score + 2 : score - 5; kokusenStreak = 0; arena.remove(); }
        updateDisplays(); spawnKokusenCircle();
    };
    registerGameTimeout(() => { if (circle.parentNode && !circle.dataset.clicked) { score -= 5; kokusenStreak = 0; updateDisplays(); arena.remove(); spawnKokusenCircle(); } }, currentDuration + 200);
}

function spawnKokusenCircle() {
    if (activeGame !== 'kokusen') return;
    kokusenAttackCount++; const combo = kokusenAttackCount % 2 === 1 ? KOKUSEN_COMBOS.odd : KOKUSEN_COMBOS.even;
    const scale = getGameScale(); const arena = document.createElement('div');
    arena.className = 'kokusen-arena'; arena.style.position = 'absolute'; arena.style.width = '200px'; arena.style.height = '200px';
    arena.style.transform = `scale(${scale})`; arena.style.transformOrigin = '0 0'; arena.style.pointerEvents = 'none';
    container.appendChild(arena);
    const yuji = document.createElement('img');
    yuji.id = 'yuji-sprite'; yuji.style.position = 'absolute'; yuji.style.width = '200px'; yuji.style.height = '200px';
    yuji.style.objectFit = 'contain'; yuji.style.imageRendering = 'pixelated'; yuji.style.pointerEvents = 'none'; yuji.style.zIndex = '5';
    arena.appendChild(yuji);
    const containerWidth = container.clientWidth || 800; const containerHeight = container.clientHeight || 600;
    const startX = Math.random() > 0.5 ? -200 : containerWidth + 20; const startY = Math.random() * Math.max(1, containerHeight - 100);
    const targetX = 20 + Math.random() * Math.max(1, (containerWidth - 200 * scale) - 50); const targetY = 20 + Math.random() * Math.max(1, (containerHeight - 200 * scale) - 50);
    const travelDuration = (combo.prepFrames.length + 1) * combo.frameDuration + 220;
    arena.style.left = `${startX}px`; arena.style.top = `${startY}px`;
    arena.style.transition = `left ${travelDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1), top ${travelDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
    registerGameTimeout(() => { arena.style.left = `${targetX}px`; arena.style.top = `${targetY}px`; }, 30);
    playKokusenSequence(yuji, combo, () => createKokusenTarget(arena, yuji, combo));
}

function showBlackFlashEffect(arena, x, y) {
    const flash = document.createElement('div'); flash.style.position = 'absolute'; flash.style.left = x + 'px'; flash.style.top = y + 'px';
    flash.style.width = '2px'; flash.style.height = '2px'; flash.style.background = '#fff';
    flash.style.boxShadow = '0 0 40px 20px #000, 0 0 100px 40px #B31B1B, 20px -20px 0 #B31B1B, -20px 20px 0 #B31B1B';
    flash.style.borderRadius = '50%'; flash.style.zIndex = '100'; flash.style.pointerEvents = 'none';
    arena.appendChild(flash);
    container.style.transform = 'translate(5px, 5px)'; registerGameTimeout(() => { if (activeGame) container.style.transform = 'translate(-5px, -5px)'; }, 50);
    registerGameTimeout(() => { if (activeGame) container.style.transform = 'translate(0, 0)'; }, 100);
    registerGameTimeout(() => flash.remove(), 400);
}

async function startTodo() {
    if (!await checkGameAccess()) return;
    if (window.musicController) window.musicController.playGame('todo');
    modal.style.display = 'flex';
    container.innerHTML = `<div id="todo-container" style="position:relative; width:100%; height:100%;"><img src="img/Todo sprite base.png" id="todo-sprite" style="position:absolute; width:120px; height:120px; cursor:pointer; image-rendering:pixelated; object-fit:contain; z-index:10;"></div>`;
    timer = 60; score = 0; todoClickCount = 0; todoCurrentSpeed = 300; activeGame = 'todo'; updateDisplays();
    const sprite = document.getElementById('todo-sprite');
    const moveTodo = () => { sprite.style.left = Math.random() * (container.clientWidth - 130) + 'px'; sprite.style.top = Math.random() * (container.clientHeight - 130) + 'px'; };
    const playTodoSequence = () => {
        if (!activeGame || !sprite.isConnected) return;
        let frame = 0;
        const nextFrame = () => {
            if (!activeGame || !sprite.isConnected) return;
            if (frame < TODO_SEQUENCE.length) { sprite.src = TODO_SEQUENCE[frame]; frame++; registerGameTimeout(nextFrame, todoCurrentSpeed); }
            else { score = Math.max(0, score - 3); todoCurrentSpeed = Math.min(600, todoCurrentSpeed + 40); updateDisplays(); moveTodo(); playTodoSequence(); }
        };
        nextFrame();
    };
    moveTodo(); playTodoSequence();
    sprite.onclick = () => { if (!activeGame) return; clearPendingGameTimeouts(); score += 10; todoClickCount++; todoCurrentSpeed = Math.max(60, todoCurrentSpeed - 25); updateDisplays(); showClapEffect(parseInt(sprite.style.left), parseInt(sprite.style.top)); moveTodo(); playTodoSequence(); };
    gameInterval = setInterval(() => {
        timer -= 1; updateDisplays();
        if (timer <= 0) {
            let discount = 0; let code = "";
            if (score >= 251) { discount = 20; code = "BOOGIE20"; } else if (score >= 101) { discount = 16; code = "BOOGIE16"; } else if (score >= 50) { discount = 8; code = "BOOGIE8"; }
            if (discount > 0) { saveReward(code, discount, "BOOGIE WOOGIE (Todo)"); alert(`¡Increíble Brother! Descuento: ${discount}%`); }
            else alert("Brother, necesitas más puntos.");
            saveGameScore('BOOGIE WOOGIE (Todo)', score); stopGame();
        }
    }, 1000);
}

function showClapEffect(x, y) {
    const clap = document.createElement('div'); clap.textContent = '\u00a1CLAP!'; clap.style.position = 'absolute';
    clap.style.left = (x + 40) + 'px'; clap.style.top = (y - 20) + 'px'; clap.style.color = '#FFD700'; clap.style.fontWeight = 'bold';
    clap.style.fontSize = '24px'; clap.style.textShadow = '0 0 10px #000'; clap.style.pointerEvents = 'none'; clap.style.zIndex = '20';
    clap.style.animation = 'clap-float 0.5s ease-out forwards'; container.appendChild(clap); setTimeout(() => clap.remove(), 500);
}

async function startGojo() {
    if (!await checkGameAccess()) return;
    if (window.musicController) window.musicController.playGame('gojo');
    modal.style.display = 'flex'; activeGame = 'gojo'; intentos = 6;
    palabraOculta = PALABRAS[Math.floor(Math.random() * PALABRAS.length)]; palabraAdivinada = Array(palabraOculta.length).fill("_");
    timer = 120; score = 0; gojoStartTime = Date.now(); updateDisplays();
    gameInterval = setInterval(() => {
        timer -= 0.1; updateDisplays();
        if (timer <= 0) { alert(`¡Perdiste! Era: ${palabraOculta}`); saveGameScore('AHORCADO (Gojo)', 0); stopGame(); }
    }, 100);
    renderHangman();
}

function renderHangman() {
    container.innerHTML = `<div style="text-align:center; color:#fff; padding:20px;"><img src="img/Satoru Gojo Sprite.png" style="width:150px; margin-bottom:20px;"><div style="font-size:3rem; letter-spacing:10px; margin-bottom:30px;">${palabraAdivinada.join(" ")}</div><div style="color:#B31B1B;">Vidas: ${"❤️".repeat(intentos)}</div><div id="keyboard" style="margin-top:30px; display:flex; flex-wrap:wrap; justify-content:center; gap:5px;"></div></div>`;
    "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("").forEach(l => { const btn = document.createElement('button'); btn.textContent = l; btn.style.padding = '10px'; btn.onclick = () => guessLetter(l, btn); document.getElementById('keyboard').appendChild(btn); });
}

function guessLetter(l, btn) {
    btn.disabled = true;
    if (palabraOculta.includes(l)) {
        for (let i = 0; i < palabraOculta.length; i++) if (palabraOculta[i] === l) palabraAdivinada[i] = l;
        if (!palabraAdivinada.includes("_")) {
            let disc = 30 - ((6 - intentos) * 5); saveReward(`GOJO${disc}`, disc, "AHORCADO (Gojo)");
            saveGameScore('AHORCADO (Gojo)', parseFloat(((Date.now() - gojoStartTime)/1000).toFixed(1)));
            alert(`¡Victoria! Descuento: ${disc}%`); stopGame();
        }
    } else { intentos--; if (intentos <= 0) { alert(`Perdiste. Era: ${palabraOculta}`); saveGameScore('AHORCADO (Gojo)', 0); stopGame(); } }
    updateDisplays(); renderHangman();
}

async function startSukuna() {
    if (!await checkGameAccess()) return;
    modal.style.display = 'flex';
    container.innerHTML = `<div style="text-align:center; color:#fff; padding:20px;"><img id="sukuna-sprite" src="img/Sukuna sprite base.png" style="width:150px; height:150px; object-fit:contain; margin-bottom:50px;"><div style="width:80%; height:20px; background:#333; margin:0 auto; position:relative; border-radius:10px;"><div id="hit-zone" style="width:60px; height:100%; background:#B31B1B; position:absolute; left:50%; transform:translateX(-50%); border-radius:5px;"></div><div id="slider-pointer" style="width:10px; height:30px; background:#fff; position:absolute; top:-5px; left:0; border-radius:2px;"></div></div><button class="botoncarta mt-5" onclick="cutSukuna()">CORTAR (ESPACIO)</button></div>`;
    const sprite = document.getElementById('sukuna-sprite'); const hitZone = document.getElementById('hit-zone');
    let isAnimating = false; let hitZonePos = 50; timer = 30; score = 0; activeGame = 'sukuna'; updateDisplays();
    let pos = 0, dir = 1; const pointer = document.getElementById('slider-pointer');
    gameInterval = setInterval(() => {
        timer -= 0.02; pos += dir * 3.2; if (pos >= 100 || pos <= 0) { dir *= -1; hitZonePos = Math.random() * 70 + 15; hitZone.style.left = hitZonePos + '%'; }
        pointer.style.left = pos + '%'; updateDisplays();
        if (!isAnimating) { if (Math.abs(pos - hitZonePos) < 8) sprite.src = 'img/Sukuna sprite corte.png'; else if (Math.abs(pos - hitZonePos) < 25) sprite.src = 'img/Sukuna sprite preparado.png'; else sprite.src = 'img/Sukuna sprite base.png'; }
        if (timer <= 0) {
            let d = 0, c = "";
            if (score >= 141) { d = 40; c = "CORTES40"; } else if (score >= 61) { d = 25; c = "CORTES25"; } else if (score >= 20) { d = 10; c = "CORTES10"; }
            if (d > 0) { saveReward(c, d, "CORTES (Sukuna)"); alert(`Corte conseguido: ${d}%`); } else alert("No cortaste suficiente.");
            saveGameScore('CORTES (Sukuna)', score); stopGame();
        }
    }, 20);
    window.onkeydown = (e) => { if (e.code === 'Space') { e.preventDefault(); window.cutSukuna(); } };
    window.cutSukuna = function () {
        if (isAnimating && sprite.src.includes('riendo')) return;
        if (Math.abs(parseFloat(pointer.style.left) - hitZonePos) < 12) {
            score += 15; isAnimating = true; sprite.src = 'img/Sukuna sprite corte.png'; setTimeout(() => isAnimating = false, 200);
        } else { score -= 10; isAnimating = true; sprite.src = 'img/Sukuna sprite riendo.png'; setTimeout(() => isAnimating = false, 500); }
        updateDisplays();
    };
}

async function startHakari() {
    if (!await checkGameAccess()) return;
    if (window.musicController) window.musicController.playGame('hakari');
    modal.style.display = 'flex';
    container.innerHTML = `<div style="text-align:center; color:#fff; padding:20px;"><img id="hakari-sprite" src="img/Hakari sprites feliz.png" class="hakari-float" style="width:150px; height:150px; object-fit:contain; margin-bottom:30px;"><div id="slot-machine" style="font-size:4rem; margin-bottom:30px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px;"><span id="reel1">?</span> <span id="reel2">?</span> <span id="reel3">?</span></div><button id="spin-btn" class="botoncarta mt-5" onclick="spinJackpot()">TIRAR DE LA PALANCA</button></div>`;
    activeGame = 'hakari'; score = 0; updateDisplays();
}

function spinJackpot() {
    const r1 = document.getElementById('reel1'), r2 = document.getElementById('reel2'), r3 = document.getElementById('reel3'), btn = document.getElementById('spin-btn'), sprite = document.getElementById('hakari-sprite');
    const symbols = ["💀", "🔥", "💎", "🎰", "❤️", "🤞"];
    if (btn.disabled) return; btn.disabled = true;
    const finalIdx = [Math.floor(Math.random()*6), Math.floor(Math.random()*6), Math.floor(Math.random()*6)];
    let cycles = 0;
    const interval = setInterval(() => {
        cycles++; if (cycles < 20) { r1.textContent = symbols[Math.floor(Math.random()*6)]; r2.textContent = symbols[Math.floor(Math.random()*6)]; r3.textContent = symbols[Math.floor(Math.random()*6)]; }
        else {
            clearInterval(interval); r1.textContent = symbols[finalIdx[0]]; r2.textContent = symbols[finalIdx[1]]; r3.textContent = symbols[finalIdx[2]];
            btn.disabled = false; if (finalIdx[0] === finalIdx[1] && finalIdx[1] === finalIdx[2]) {
                const s = symbols[finalIdx[0]]; const d = s === '🎰' ? 50 : 30; saveReward(`JACKPOT${d}`, d, "JACKPOT (Hakari)"); alert(`¡JACKPOT! ${d}%`); score = 1000;
            } else { alert("Perdiste."); score = 0; }
            saveGameScore('JACKPOT (Hakari)', score); updateDisplays();
        }
    }, 100);
}
