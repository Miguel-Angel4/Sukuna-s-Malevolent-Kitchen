// ==========================================
// Sukuna's Malevolent Kitchen - Game Logic
// Rebuild Trigger: v1.0.3 - 1 Play per Week Limit
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

// Detección de escala para móviles (coincidir con CSS)
function getGameScale() {
    return window.innerWidth <= 768 ? 0.3 : 1.0;
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

    // Verificar si ya ha jugado en los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
        const { data, error } = await window.sb
            .from('game_scores')
            .select('created_at, game_name')
            .eq('user_id', session.user.id)
            .gt('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.warn("⚠️ No se pudo verificar el límite semanal, permitiendo acceso por cortesía.");
            return true;
        }

        if (data && data.length > 0) {
            const lastPlay = new Date(data[0].created_at);
            const nextPlay = new Date(lastPlay);
            nextPlay.setDate(nextPlay.getDate() + 7);
            
            const now = new Date();
            const diff = nextPlay - now;
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            alert(`¡Paciencia, hechicero! Tu energía maldita se está agotando. Ya has jugado al minijuego "${data[0].game_name}" recientemente.\n\nSolo se permite una partida por semana para mantener el equilibrio del Reino Sombrío.\n\nPodrás volver a jugar en: ${days}d ${hours}h ${mins}m.`);
            return false;
        }
    } catch (e) {
        console.error("Error en checkGameAccess:", e);
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
        frameDuration: 310, // <--- CAMBIA ESTE VALOR PARA AJUSTAR LA VELOCIDAD (Menor = Más rápido)
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
        frameDuration: 310, // <--- CAMBIA ESTE VALOR PARA AJUSTAR LA VELOCIDAD
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
    if (!session) {
        console.warn("⚠️ No hay sesión activa. El cupón no se guardará en la cuenta.");
        return;
    }

    const { error } = await window.sb.from('rewards').insert([
        { 
            user_id: session.user.id,
            code: code,
            discount_percentage: percentage,
            game_name: gameName
        }
    ]);

    if (error) {
        console.error("❌ Error al guardar recompensa:", error.message);
    } else {
        console.log("✅ Recompensa guardada en la base de datos.");
    }
}

async function saveGameScore(gameName, scoreValue) {
    if (!window.sb) return;
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) return;

    let userName = "Usuario";
    try {
        const { data: prof } = await window.sb.from('profiles').select('name').eq('id', session.user.id).single();
        if (prof && prof.name) {
            userName = prof.name;
        } else {
            userName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
        }
    } catch(e) {}

    const { error } = await window.sb.from('game_scores').insert([
        { 
            user_id: session.user.id,
            user_name: userName,
            game_name: gameName,
            score: scoreValue
        }
    ]);
    if (error) {
        console.error("❌ Error al guardar puntuación:", error.message);
    } else {
        if (typeof loadLeaderboards === 'function') {
            loadLeaderboards();
        }
    }
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

        const { data, error } = await window.sb
            .from('game_scores')
            .select('*')
            .eq('game_name', game.name)
            .order('score', { ascending: game.order })
            .limit(5);

        if (error) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center">Error al cargar datos</td></tr>`;
            continue;
        }

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center">Sin puntuaciones aún</td></tr>`;
            continue;
        }

        tbody.innerHTML = data.map((row, index) => {
            const displayScore = game.name === 'AHORCADO (Gojo)' ? `${row.score}s` : row.score;
            return `<tr>
                <td>${index + 1}</td>
                <td>${row.user_name || 'Desconocido'}</td>
                <td>${displayScore}</td>
            </tr>`;
        }).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[id^="tabla-"]')) {
        setTimeout(loadLeaderboards, 1000);
    }
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

    // Regresar a música principal
    if (window.musicController) window.musicController.playMain();
}

function updateDisplays() {
    timerDisplay.textContent = `Tiempo: ${Math.max(0, timer).toFixed(1)}s`;
    scoreDisplay.textContent = `Puntos: ${score}`;
}

// ------------------------------------------
// 1. YUJI KOKUSEN (Timing Game)
// ------------------------------------------
async function startKokusen() {
    if (!await checkGameAccess()) return;
    if (window.musicController) window.musicController.playGame('kokusen');

    modal.style.display = 'flex';
    container.innerHTML = '<div style="color:#fff; padding:20px;">Pulsa los círculos cuando el aro rojo coincida con el negro.</div>';
    timer = 40;
    score = 0;
    activeGame = 'kokusen';
    kokusenAttackCount = 0;
    updateDisplays();

    gameInterval = setInterval(() => {
        timer -= 0.1;
        updateDisplays();
        if (timer <= 0) {
            let discount = 0;
            let code = "";
            if (score >= 201) { discount = 15; code = "KOKUSEN15"; }
            else if (score >= 101) { discount = 10; code = "KOKUSEN10"; }
            else if (score >= 50) { discount = 5; code = "KOKUSEN5"; }

            if (discount > 0) {
                saveReward(code, discount, "KOKUSEN (Yuji)");
                alert(`¡Juego terminado! Puntos: ${score}. Has conseguido un ${discount}% de descuento. Tu código QR: ${code} estará disponible en tu cuenta durante 30 días.`);
            } else {
                alert(`Juego terminado. Puntos: ${score}. No has alcanzado el mínimo para un descuento. ¡Sigue entrenando!`);
            }
            saveGameScore('KOKUSEN (Yuji)', score);
            stopGame();
        }
    }, 100);

    spawnKokusenCircle();
}

// ... spawnKokusenCircle y funciones auxiliares de Yuji omitidas por brevedad (se mantienen igual) ...

function playKokusenSequence(sprite, combo, onComplete) {
    let frameIndex = 0;
    sprite.src = combo.prepFrames[frameIndex];
    const showNextFrame = () => {
        if (activeGame !== 'kokusen' || !sprite.isConnected) return;
        frameIndex += 1;
        if (frameIndex >= combo.prepFrames.length) {
            sprite.src = combo.attackFrame;
            onComplete();
            return;
        }
        sprite.src = combo.prepFrames[frameIndex];
        registerGameTimeout(showNextFrame, combo.frameDuration);
    };
    registerGameTimeout(showNextFrame, combo.frameDuration);
}

function createKokusenTarget(arena, yuji, combo) {
    if (activeGame !== 'kokusen' || !yuji.isConnected) return;
    const baseDuration = 1000;
    const speedMultiplier = Math.pow(0.85, kokusenStreak);
    const currentDuration = Math.max(300, baseDuration * speedMultiplier);
    const circle = document.createElement('div');
    circle.className = 'kokusen-target';
    circle.style.position = 'absolute';
    circle.style.width = '60px';
    circle.style.height = '60px';
    circle.style.borderRadius = '50%';
    circle.style.border = '3px solid #87CEEB';
    circle.style.background = 'rgba(0,0,100,0.3)';
    circle.style.left = `${combo.circleOffset.x}px`;
    circle.style.top = `${combo.circleOffset.y}px`;
    circle.style.cursor = 'pointer';
    circle.style.zIndex = '10';
    circle.style.pointerEvents = 'auto';
    arena.appendChild(circle);
    const ring = document.createElement('div');
    ring.style.position = 'absolute';
    ring.style.width = '120px';
    ring.style.height = '120px';
    ring.style.borderRadius = '50%';
    ring.style.border = '2px solid #B31B1B';
    ring.style.top = '-30px';
    ring.style.left = '-30px';
    ring.style.transition = `all ${currentDuration}ms linear`;
    circle.appendChild(ring);
    void ring.offsetHeight;
    registerGameTimeout(() => {
        ring.style.width = '60px';
        ring.style.height = '60px';
        ring.style.top = '0px';
        ring.style.left = '0px';
    }, 20);
    circle.onclick = () => {
        if (activeGame !== 'kokusen' || circle.dataset.clicked) return;
        circle.dataset.clicked = "true";
        const currentWidth = window.getComputedStyle(ring).width;
        const currentSize = parseInt(currentWidth, 10);
        if (currentSize <= 66 && currentSize >= 54) {
            score += 10;
            kokusenStreak++;
            yuji.src = combo.flashFrame;
            showBlackFlashEffect(arena, combo.effectOffset.x, combo.effectOffset.y);
            registerGameTimeout(() => { if (arena.isConnected) arena.remove(); }, 500);
        } else {
            score = (currentSize > 66) ? score + 2 : score - 5;
            kokusenStreak = 0;
            arena.remove();
        }
        updateDisplays();
        spawnKokusenCircle();
    };
    registerGameTimeout(() => {
        if (circle.parentNode && !circle.dataset.clicked) {
            score -= 5;
            kokusenStreak = 0;
            updateDisplays();
            arena.remove();
            spawnKokusenCircle();
        }
    }, currentDuration + 200);
}

function spawnKokusenCircle() {
    if (activeGame !== 'kokusen') return;
    kokusenAttackCount += 1;
    const combo = kokusenAttackCount % 2 === 1 ? KOKUSEN_COMBOS.odd : KOKUSEN_COMBOS.even;
    const scale = getGameScale();
    const arena = document.createElement('div');
    arena.className = 'kokusen-arena';
    arena.style.position = 'absolute';
    arena.style.width = '200px';
    arena.style.height = '200px';
    arena.style.transform = `scale(${scale})`;
    arena.style.transformOrigin = '0 0';
    arena.style.pointerEvents = 'none';
    container.appendChild(arena);
    const yuji = document.createElement('img');
    yuji.id = 'yuji-sprite';
    yuji.style.position = 'absolute';
    yuji.style.width = '200px';
    yuji.style.height = '200px';
    yuji.style.objectFit = 'contain';
    yuji.style.imageRendering = 'pixelated';
    yuji.style.pointerEvents = 'none';
    yuji.style.zIndex = '5';
    arena.appendChild(yuji);
    const containerWidth = container.clientWidth || 800;
    const containerHeight = container.clientHeight || 600;
    const startX = Math.random() > 0.5 ? -200 : containerWidth + 20;
    const startY = Math.random() * Math.max(1, containerHeight - 100);
    const targetX = 20 + Math.random() * Math.max(1, (containerWidth - 200 * scale) - 50);
    const targetY = 20 + Math.random() * Math.max(1, (containerHeight - 200 * scale) - 50);
    const travelDuration = (combo.prepFrames.length + 1) * combo.frameDuration + 220;
    arena.style.left = `${startX}px`;
    arena.style.top = `${startY}px`;
    arena.style.transition = `left ${travelDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1), top ${travelDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
    registerGameTimeout(() => {
        arena.style.left = `${targetX}px`;
        arena.style.top = `${targetY}px`;
    }, 30);
    playKokusenSequence(yuji, combo, () => createKokusenTarget(arena, yuji, combo));
}

function showBlackFlashEffect(arena, x, y) {
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.left = x + 'px';
    flash.style.top = y + 'px';
    flash.style.width = '2px';
    flash.style.height = '2px';
    flash.style.background = '#fff';
    flash.style.boxShadow = '0 0 40px 20px #000, 0 0 100px 40px #B31B1B, 20px -20px 0 #B31B1B, -20px 20px 0 #B31B1B';
    flash.style.borderRadius = '50%';
    flash.style.zIndex = '100';
    flash.style.pointerEvents = 'none';
    arena.appendChild(flash);
    container.style.transform = 'translate(5px, 5px)';
    registerGameTimeout(() => { if (activeGame) container.style.transform = 'translate(-5px, -5px)'; }, 50);
    registerGameTimeout(() => { if (activeGame) container.style.transform = 'translate(0, 0)'; }, 100);
    registerGameTimeout(() => flash.remove(), 400);
}

// ------------------------------------------
// 2. TODO BOOGIE WOOGIE (Clicker)
// ------------------------------------------
async function startTodo() {
    if (!await checkGameAccess()) return;
    if (window.musicController) window.musicController.playGame('todo');

    modal.style.display = 'flex';
    container.innerHTML = `
        <div id="todo-container" style="position:relative; width:100%; height:100%;">
            <img src="img/Todo sprite base.png" id="todo-sprite" 
                 style="position:absolute; width:120px; height:120px; cursor:pointer; 
                        image-rendering:pixelated; object-fit:contain; z-index:10;">
        </div>
    `;

    timer = 60;
    score = 0;
    todoClickCount = 0;
    todoCurrentSpeed = 300; 
    activeGame = 'todo';
    updateDisplays();

    const sprite = document.getElementById('todo-sprite');
    const moveTodo = () => {
        const x = Math.random() * (container.clientWidth - 130);
        const y = Math.random() * (container.clientHeight - 130);
        sprite.style.left = x + 'px';
        sprite.style.top = y + 'px';
    };

    const playTodoSequence = () => {
        if (!activeGame || !sprite.isConnected) return;
        let frame = 0;
        const nextFrame = () => {
            if (!activeGame || !sprite.isConnected) return;
            if (frame < TODO_SEQUENCE.length) {
                sprite.src = TODO_SEQUENCE[frame];
                frame++;
                registerGameTimeout(nextFrame, todoCurrentSpeed);
            } else {
                score = Math.max(0, score - 3);
                todoCurrentSpeed = Math.min(600, todoCurrentSpeed + 40);
                updateDisplays();
                moveTodo();
                playTodoSequence();
            }
        };
        nextFrame();
    };

    moveTodo();
    playTodoSequence();

    sprite.onclick = () => {
        if (!activeGame) return;
        clearPendingGameTimeouts();
        score += 10;
        todoClickCount++;
        todoCurrentSpeed = Math.max(60, todoCurrentSpeed - 25);
        updateDisplays();
        showClapEffect(parseInt(sprite.style.left), parseInt(sprite.style.top));
        moveTodo();
        playTodoSequence();
    };

    gameInterval = setInterval(() => {
        timer -= 1;
        updateDisplays();
        if (timer <= 0) {
            let discount = 0;
            let code = "";
            if (score >= 251) { discount = 20; code = "BOOGIE20"; }
            else if (score >= 101) { discount = 16; code = "BOOGIE16"; }
            else if (score >= 50) { discount = 8; code = "BOOGIE8"; }

            if (discount > 0) {
                saveReward(code, discount, "BOOGIE WOOGIE (Todo)");
                alert(`¡Increíble Brother! Puntos: ${score}. Has conseguido un ${discount}% de descuento. Tu código QR: ${code} estará disponible en tu cuenta durante 30 días.`);
            } else {
                alert(`¡Brother! Puntos: ${score}. Necesitas al menos 50 puntos para un descuento.`);
            }
            saveGameScore('BOOGIE WOOGIE (Todo)', score);
            stopGame();
        }
    }, 1000);
}

function showClapEffect(x, y) {
    const clap = document.createElement('div');
    clap.textContent = '\u00a1CLAP!';
    clap.style.position = 'absolute';
    clap.style.left = (x + 40) + 'px';
    clap.style.top = (y - 20) + 'px';
    clap.style.color = '#FFD700';
    clap.style.fontWeight = 'bold';
    clap.style.fontSize = '24px';
    clap.style.textShadow = '0 0 10px #000';
    clap.style.pointerEvents = 'none';
    clap.style.zIndex = '20';
    clap.style.animation = 'clap-float 0.5s ease-out forwards';
    container.appendChild(clap);
    setTimeout(() => clap.remove(), 500);
}

// ------------------------------------------
// 3. GOJO AHORCADO (Hangman)
// ------------------------------------------
const PALABRAS = ["SUKUNA", "GOJO", "ITARODI", "MEGUMI", "NOBARA", "EXPANSION", "DOMINIO", "MALDICION", "TECNICA", "TODO", "NANAMI"];
let palabraOculta = "";
let palabraAdivinada = [];
let intentos = 6;
let gojoStartTime = 0;

async function startGojo() {
    if (!await checkGameAccess()) return;
    if (window.musicController) window.musicController.playGame('gojo');

    modal.style.display = 'flex';
    activeGame = 'gojo';
    intentos = 6;
    palabraOculta = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
    palabraAdivinada = Array(palabraOculta.length).fill("_");
    timer = 120;
    score = 0;
    gojoStartTime = Date.now();
    updateDisplays();

    gameInterval = setInterval(() => {
        timer -= 0.1;
        updateDisplays();
        if (timer <= 0) {
            alert(`¡Se acabó el tiempo! Has caído. La palabra era: ${palabraOculta}`);
            saveGameScore('AHORCADO (Gojo)', 0);
            stopGame();
        }
    }, 100);

    renderHangman();
}

function renderHangman() {
    container.innerHTML = `
        <div style="text-align:center; color:#fff; padding:20px;">
            <img src="img/Satoru Gojo Sprite.png" style="width:150px; margin-bottom:20px; filter: drop-shadow(0 0 15px #8A2BE2) drop-shadow(0 0 30px #4B0082);">
            <div style="font-size:3rem; letter-spacing:10px; margin-bottom:30px; word-break: break-all;">${palabraAdivinada.join(" ")}</div>
            <div style="color:#B31B1B;">Vidas: ${"❤️".repeat(intentos)}</div>
            <div id="keyboard" style="margin-top:30px; display:flex; flex-wrap:wrap; justify-content:center; gap:5px;"></div>
        </div>
    `;
    const kb = document.getElementById('keyboard');
    "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("").forEach(letra => {
        const btn = document.createElement('button');
        btn.textContent = letra;
        btn.style.padding = '10px';
        btn.onclick = () => guessLetter(letra, btn);
        kb.appendChild(btn);
    });
}

function guessLetter(letra, btn) {
    btn.disabled = true;
    if (palabraOculta.includes(letra)) {
        for (let i = 0; i < palabraOculta.length; i++) {
            if (palabraOculta[i] === letra) palabraAdivinada[i] = letra;
        }
        timer += 5;
        if (!palabraAdivinada.includes("_")) {
            let discount = 30 - ((6 - intentos) * 5);
            saveReward(`GOJO${discount}`, discount, "AHORCADO (Gojo)");
            let timeTaken = parseFloat(((Date.now() - gojoStartTime) / 1000).toFixed(1));
            alert(`¡Infinito! Ganaste. Vidas restantes: ${intentos}. Descuento del ${discount}%: GOJO${discount}. Estará guardado en tu cuenta.`);
            saveGameScore('AHORCADO (Gojo)', timeTaken);
            stopGame();
        }
    } else {
        intentos--;
        timer -= 10;
        if (intentos <= 0) {
            alert(`Has caído. La palabra era: ${palabraOculta}`);
            saveGameScore('AHORCADO (Gojo)', 0);
            stopGame();
        }
    }
    updateDisplays();
    renderHangman();
}

// ------------------------------------------
// 4. SUKUNA CORTES (Slider Game)
// ------------------------------------------
async function startSukuna() {
    if (!await checkGameAccess()) return;
    modal.style.display = 'flex';
    container.innerHTML = `
        <div style="text-align:center; color:#fff; padding:20px;">
            <img id="sukuna-sprite" src="img/Sukuna sprite base.png" style="width:150px; height:150px; object-fit:contain; margin-bottom:50px; transition: transform 0.2s;">
            <div style="width:80%; height:20px; background:#333; margin:0 auto; position:relative; border-radius:10px;">
                <div id="hit-zone" style="width:60px; height:100%; background:#B31B1B; position:absolute; left:50%; transform:translateX(-50%); border-radius:5px; box-shadow: 0 0 15px rgba(179, 27, 27, 0.5);"></div>
                <div id="slider-pointer" style="width:10px; height:30px; background:#fff; position:absolute; top:-5px; left:0; border-radius:2px; box-shadow: 0 0 10px #fff;"></div>
            </div>
            <button class="botoncarta mt-5" onclick="cutSukuna()">CORTAR (ESPACIO)</button>
        </div>
    `;

    const sprite = document.getElementById('sukuna-sprite');
    const hitZone = document.getElementById('hit-zone');
    let isAnimatingAction = false;
    let hitZonePos = 50;
    timer = 30;
    score = 0;
    activeGame = 'sukuna';
    updateDisplays();

    let pos = 0;
    let dir = 1;
    const pointer = document.getElementById('slider-pointer');

    gameInterval = setInterval(() => {
        timer -= 0.02;
        pos += dir * 3.2;
        if (pos >= 100 || pos <= 0) {
            dir *= -1;
            hitZonePos = Math.random() * 70 + 15;
            hitZone.style.left = hitZonePos + '%';
        }
        pointer.style.left = pos + '%';
        updateDisplays();
        const inRange = pos > (hitZonePos - 8) && pos < (hitZonePos + 8);
        if (!isAnimatingAction) {
            if (inRange) sprite.src = 'img/Sukuna sprite corte.png';
            else if (Math.abs(pos - hitZonePos) < 25) sprite.src = 'img/Sukuna sprite preparado.png';
            else sprite.src = 'img/Sukuna sprite base.png';
        }
        if (timer <= 0) {
            let discount = 0;
            let code = "";
            if (score >= 141) { discount = 40; code = "CORTES40"; }
            else if (score >= 61) { discount = 25; code = "CORTES25"; }
            else if (score >= 20) { discount = 10; code = "CORTES10"; }
            if (discount > 0) {
                saveReward(code, discount, "CORTES (Sukuna)");
                alert(`Santuario de Malévolo cerrado. Puntos: ${score}. Has conseguido un ${discount}% de descuento. Código QR: ${code} guardado en tu cuenta.`);
            } else {
                alert(`Santuario cerrado. Puntos: ${score}. No has cortado lo suficiente.`);
            }
            saveGameScore('CORTES (Sukuna)', score);
            stopGame();
        }
    }, 20);

    window.onkeydown = (e) => { if (e.code === 'Space') { e.preventDefault(); window.cutSukuna(); } };

    window.cutSukuna = function () {
        if (isAnimatingAction && sprite.src.includes('riendo')) return;
        const currentPos = parseFloat(pointer.style.left);
        const slash = document.createElement('div');
        slash.style.position = 'absolute';
        slash.style.width = '100%';
        slash.style.height = '4px';
        slash.style.background = '#fff';
        slash.style.boxShadow = '0 0 15px #B31B1B';
        slash.style.top = Math.random() * 400 + 'px';
        slash.style.left = '0';
        slash.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;
        slash.style.zIndex = '50';
        container.appendChild(slash);
        setTimeout(() => slash.remove(), 150);

        if (Math.abs(currentPos - hitZonePos) < 12) {
            score += 15;
            isAnimatingAction = true;
            sprite.src = 'img/Sukuna sprite preparado.png';
            setTimeout(() => { if (activeGame === 'sukuna') { sprite.src = 'img/Sukuna sprite corte.png'; container.style.transform = 'scale(1.1)'; setTimeout(() => container.style.transform = 'scale(1)', 100); } }, 50);
            setTimeout(() => { isAnimatingAction = false; }, 200);
        } else {
            score -= 10;
            isAnimatingAction = true;
            sprite.src = 'img/Sukuna sprite riendo.png';
            sprite.classList.add('laugh-anim');
            setTimeout(() => { if (activeGame === 'sukuna') { sprite.classList.remove('laugh-anim'); isAnimatingAction = false; } }, 500);
        }
        updateDisplays();
    };
}

// ------------------------------------------
// 5. HAKARI JACKPOT (Gambling)
// ------------------------------------------
async function startHakari() {
    if (!await checkGameAccess()) return;
    if (window.musicController) window.musicController.playGame('hakari');

    modal.style.display = 'flex';
    container.innerHTML = `
        <div style="text-align:center; color:#fff; padding:20px;">
            <img id="hakari-sprite" src="img/Hakari sprites feliz.png" class="hakari-float" style="width:150px; height:150px; object-fit:contain; margin-bottom:30px;">
            <div id="slot-machine" style="font-size:4rem; margin-bottom:30px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px;">
                <span id="reel1">?</span> <span id="reel2">?</span> <span id="reel3">?</span>
            </div>
            <button id="spin-btn" class="botoncarta mt-5" onclick="spinJackpot()">TIRAR DE LA PALANCA</button>
            <p class="mt-4">"Let's go gambling!"</p>
        </div>
    `;
    activeGame = 'hakari';
    score = 0;
    updateDisplays();
}

function spinJackpot() {
    const r1 = document.getElementById('reel1');
    const r2 = document.getElementById('reel2');
    const r3 = document.getElementById('reel3');
    const btn = document.getElementById('spin-btn');
    const sprite = document.getElementById('hakari-sprite');
    const symbols = ["💀", "🔥", "💎", "🎰", "❤️", "🤞"];
    if (btn.disabled) return;
    btn.disabled = true;
    sprite.classList.remove('hakari-float');
    let danceFrame = 1;
    let danceInterval = setInterval(() => { danceFrame = (danceFrame === 1) ? 2 : 1; sprite.src = `img/Hakari sprites dance ${danceFrame}.png`; }, 150);
    let cycles = 0;
    const finalResultIndices = [Math.floor(Math.random() * symbols.length), Math.floor(Math.random() * symbols.length), Math.floor(Math.random() * symbols.length)];
    const interval = setInterval(() => {
        cycles++;
        if (cycles < 20) {
            r1.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            r2.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            r3.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        } else {
            clearInterval(interval);
            clearInterval(danceInterval);
            const idx1 = finalResultIndices[0];
            const idx2 = finalResultIndices[1];
            const idx3 = finalResultIndices[2];
            r1.textContent = symbols[idx1];
            r2.textContent = symbols[idx2];
            r3.textContent = symbols[idx3];
            btn.disabled = false;
            sprite.src = 'img/Hakari sprites feliz.png';
            sprite.classList.add('hakari-float');
            setTimeout(() => {
                if (idx1 === idx2 && idx2 === idx3) {
                    const winnerSymbol = symbols[idx1];
                    if (winnerSymbol === '🎰') { saveReward("JACKPOT50", 50, "JACKPOT (Hakari)"); alert("¡JACKPOT SUPREMO! 🎰🎰🎰\nHas ganado un 50% de descuento.\nCódigo: JACKPOT50\nEl cupón se ha guardado en tu cuenta."); }
                    else { saveReward("JACKPOT30", 30, "JACKPOT (Hakari)"); alert(`¡JACKPOT! ${winnerSymbol}${winnerSymbol}${winnerSymbol}\nHas ganado un 30% de descuento.\nCódigo: JACKPOT30\nEl cupón se ha guardado en tu cuenta.`); }
                    score = 1000;
                } else {
                    alert(`Aw dangit! (${symbols[idx1]} ${symbols[idx2]} ${symbols[idx3]}) No has ganado nada esta vez. ¡Sigue intentándolo!`);
                    score = 0;
                }
                saveGameScore('JACKPOT (Hakari)', score);
                updateDisplays();
            }, 500);
        }
    }, 100);
}
