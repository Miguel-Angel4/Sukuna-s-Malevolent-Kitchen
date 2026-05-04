// ==========================================
// Sukuna's Malevolent Kitchen - Game Logic
// Triggering rebuild
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


// Función para verificar si el usuario está logueado antes de jugar
async function checkGameAccess() {
    if (!window.sb) return true;
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) {
        alert("¡Alto ahí, hechicero! Debes iniciar sesión para acceder a los juegos y obtener descuentos.");
        window.location.href = "login.html";
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
        frameDuration: 310, // <--- CAMBIA ESTE VALOR PARA AJUSTAR LA VELOCIDAD (Menor = Más rápido)
        circleOffset: { x: 154, y: 70 },
        effectOffset: { x: 184, y: 100 }
    },
    even: {
        prepFrames: [
            'img/Itadori sprite base.png',
            'img/Itadori sprite preparando patada.png'
        ],
        attackFrame: 'img/Itadori sprite pateando.png',
        flashFrame: 'img/Itadori sprite black flash patada.png',
        frameDuration: 310, // <--- CAMBIA ESTE VALOR PARA AJUSTAR LA VELOCIDAD
        circleOffset: { x: 154, y: 70 },
        effectOffset: { x: 184, y: 100 }
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
    // Música de Itadori
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
            stopGame();
        }
    }, 100);

    spawnKokusenCircle();
}

function oldSpawnKokusenCircle() {
    if (activeGame !== 'kokusen') return;

    // Crear sprite de Yuji atacando
    const yuji = document.createElement('img');
    yuji.id = 'yuji-sprite';
    yuji.src = 'img/game_yuji.png';
    yuji.style.position = 'absolute';
    yuji.style.width = '100px';
    yuji.style.imageRendering = 'pixelated';
    yuji.style.transition = 'all 0.3s ease-out';

    // Posición inicial (fuera o en el borde)
    const startX = Math.random() > 0.5 ? -100 : 800;
    const startY = Math.random() * 500;
    yuji.style.left = startX + 'px';
    yuji.style.top = startY + 'px';
    container.appendChild(yuji);

    // Objetivo del golpe
    const targetX = Math.random() * 650;
    const targetY = Math.random() * 450;

    // Animación de ataque
    setTimeout(() => {
        yuji.style.left = targetX + 'px';
        yuji.style.top = targetY + 'px';
        yuji.src = 'img/game_yuji_punch.png'; // Cambiar a pose de golpe

        // Crear el círculo de timing en el punto del golpe
        const circle = document.createElement('div');
        circle.className = 'kokusen-target';
        circle.style.position = 'absolute';
        circle.style.width = '60px';
        circle.style.height = '60px';
        circle.style.borderRadius = '50%';
        circle.style.border = '3px solid #000';
        circle.style.background = 'rgba(0,0,100,0.3)';
        circle.style.left = (targetX + 80) + 'px'; // Ajustado al puño
        circle.style.top = (targetY + 20) + 'px';
        circle.style.cursor = 'pointer';
        circle.style.zIndex = '10';

        const ring = document.createElement('div');
        ring.style.position = 'absolute';
        ring.style.width = '120px';
        ring.style.height = '120px';
        ring.style.borderRadius = '50%';
        ring.style.border = '2px solid #B31B1B';
        ring.style.top = '-30px';
        ring.style.left = '-30px';
        ring.style.transition = 'all 1s linear';

        circle.appendChild(ring);
        container.appendChild(circle);

        setTimeout(() => {
            ring.style.width = '60px';
            ring.style.height = '60px';
            ring.style.top = '0px';
            ring.style.left = '0px';
        }, 10);

        circle.onclick = () => {
            const currentSize = parseInt(ring.style.width);
            if (currentSize < 75 && currentSize > 45) {
                score += 10;
                showBlackFlashEffect(targetX + 110, targetY + 50);
                circle.remove();
            } else {
                score -= 5;
                circle.remove();
            }
            yuji.remove();
            spawnKokusenCircle();
        };

        // Si no se pulsa a tiempo
        setTimeout(() => {
            if (circle.parentNode) {
                circle.remove();
                yuji.remove();
                spawnKokusenCircle();
            }
        }, 1200);

    }, 200);
}

function oldShowBlackFlashEffect(x, y) {
    const flash = document.createElement('div');
    flash.id = 'yuji-effect';
    flash.style.position = 'absolute';
    flash.style.left = x + 'px';
    flash.style.top = y + 'px';
    flash.style.width = '2px';
    flash.style.height = '2px';
    flash.style.background = '#fff';
    flash.style.boxShadow = '0 0 40px 20px #000, 0 0 100px 40px #B31B1B';
    flash.style.borderRadius = '50%';
    flash.style.zIndex = '100';
    flash.style.pointerEvents = 'none';

    // Rayos rojos simulados con sombras múltiples
    flash.style.boxShadow += ', 20px -20px 0 #B31B1B, -20px 20px 0 #B31B1B';

    container.appendChild(flash);

    // Efecto de sacudida
    container.style.transform = 'translate(5px, 5px)';
    setTimeout(() => container.style.transform = 'translate(-5px, -5px)', 50);
    setTimeout(() => container.style.transform = 'translate(0, 0)', 100);

    setTimeout(() => flash.remove(), 400);
}

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
    circle.style.pointerEvents = 'auto'; // Permitir clics en el círculo
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
        if (activeGame !== 'kokusen') return;
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
        if (circle.parentNode) {
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
    const containerWidth = container.clientWidth || 800;
    const containerHeight = container.clientHeight || 600;

    // Crear arena para agrupar sprite y círculo
    const arena = document.createElement('div');
    arena.className = 'kokusen-arena';
    arena.style.position = 'absolute';
    arena.style.width = '200px';
    arena.style.height = '200px';
    arena.style.transform = `scale(${scale})`;
    arena.style.transformOrigin = '0 0';
    arena.style.pointerEvents = 'none'; // No bloquea clics fuera de sus hijos
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
    flash.id = 'yuji-effect';
    flash.style.position = 'absolute';
    flash.style.left = x + 'px';
    flash.style.top = y + 'px';
    flash.style.width = '2px';
    flash.style.height = '2px';
    flash.style.background = '#fff';
    flash.style.boxShadow = '0 0 40px 20px #000, 0 0 100px 40px #B31B1B';
    flash.style.borderRadius = '50%';
    flash.style.zIndex = '100';
    flash.style.pointerEvents = 'none';
    flash.style.boxShadow += ', 20px -20px 0 #B31B1B, -20px 20px 0 #B31B1B';
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
    // Música de Todo
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
    let isAnimating = false;

    const moveTodo = () => {
        const x = Math.random() * (container.clientWidth - 130);
        const y = Math.random() * (container.clientHeight - 130);
        sprite.style.left = x + 'px';
        sprite.style.top = y + 'px';
    };

    let currentSequenceTimeout = null;

    const playTodoSequence = () => {
        if (!activeGame || !sprite.isConnected) return;

        let frame = 0;

        const nextFrame = () => {
            if (!activeGame || !sprite.isConnected) return;

            if (frame < TODO_SEQUENCE.length) {
                sprite.src = TODO_SEQUENCE[frame];
                frame++;
                currentSequenceTimeout = registerGameTimeout(nextFrame, todoCurrentSpeed);
            } else {
                // Se completó la animación sin click: penalización y se hace más lento
                score = Math.max(0, score - 3);
                todoCurrentSpeed = Math.min(600, todoCurrentSpeed + 40); // Se hace más lento
                updateDisplays();
                moveTodo();
                playTodoSequence();
            }
        };
        nextFrame();
    };

    moveTodo();
    playTodoSequence(); // Iniciar automáticamente el bucle

    sprite.onclick = () => {
        if (!activeGame) return;

        // Click exitoso: premio, teletransporte y se hace más rápido
        clearPendingGameTimeouts();
        score += 10;
        todoClickCount++;
        todoCurrentSpeed = Math.max(60, todoCurrentSpeed - 25); // Se hace más rápido
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

async function startGojo() {
    if (!await checkGameAccess()) return;
    // Música de Gojo
    if (window.musicController) window.musicController.playGame('gojo');

    modal.style.display = 'flex';
    activeGame = 'gojo';
    intentos = 6;
    palabraOculta = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
    palabraAdivinada = Array(palabraOculta.length).fill("_");
    timer = 120;
    score = 0;
    updateDisplays();

    gameInterval = setInterval(() => {
        timer -= 0.1;
        updateDisplays();
        if (timer <= 0) {
            alert(`¡Se acabó el tiempo! Has caído. La palabra era: ${palabraOculta}`);
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

function guessLetter(l, btn) {
    btn.disabled = true;
    if (palabraOculta.includes(l)) {
        for (let i = 0; i < palabraOculta.length; i++) {
            if (palabraOculta[i] === l) palabraAdivinada[i] = l;
        }
        timer += 5; // Acierto: +5 segundos
        if (!palabraAdivinada.includes("_")) {
            let discount = 30 - ((6 - intentos) * 5);
            saveReward(`GOJO${discount}`, discount, "AHORCADO (Gojo)");
            alert(`¡Infinito! Ganaste. Vidas restantes: ${intentos}. Descuento del ${discount}%: GOJO${discount}. Estará guardado en tu cuenta.`);
            stopGame();
        }
    } else {
        intentos--;
        timer -= 10; // Fallo: -10 segundos
        if (intentos <= 0) {
            alert(`Has caído. La palabra era: ${palabraOculta}`);
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

    // Secuencia inicial
    setTimeout(() => { if (activeGame === 'sukuna') sprite.src = 'img/Sukuna sprite preparado.png'; }, 500);
    setTimeout(() => { if (activeGame === 'sukuna') sprite.src = 'img/Sukuna sprite corte.png'; }, 1000);
    setTimeout(() => { if (activeGame === 'sukuna') sprite.src = 'img/Sukuna sprite base.png'; }, 1500);

    timer = 30;
    score = 0;
    activeGame = 'sukuna';
    updateDisplays();

    let pos = 0;
    let dir = 1;
    const pointer = document.getElementById('slider-pointer');

    gameInterval = setInterval(() => {
        timer -= 0.02;
        pos += dir * 3.2; // Velocidad ajustada a 3.2

        if (pos >= 100 || pos <= 0) {
            dir *= -1;
            hitZonePos = Math.random() * 70 + 15; // Rango un poco más centrado
            hitZone.style.left = hitZonePos + '%';
        }

        pointer.style.left = pos + '%';
        updateDisplays();

        // Rango visual (coincide con el ancho del hit-zone)
        const inRange = pos > (hitZonePos - 8) && pos < (hitZonePos + 8);

        if (!isAnimatingAction) {
            if (inRange) {
                sprite.src = 'img/Sukuna sprite corte.png';
            } else if (Math.abs(pos - hitZonePos) < 25) {
                sprite.src = 'img/Sukuna sprite preparado.png';
            } else {
                sprite.src = 'img/Sukuna sprite base.png';
            }
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
            stopGame();
        }
    }, 20);

    window.onkeydown = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            window.cutSukuna();
        }
    };

    window.cutSukuna = function () {
        // No bloquear el click si no estamos en medio de una risa de fallo
        if (isAnimatingAction && sprite.src.includes('riendo')) return;

        const currentPos = parseFloat(pointer.style.left);

        // Efecto de tajo
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

        // HIT DETECTION: Rango mucho más generoso (+/- 12%)
        if (Math.abs(currentPos - hitZonePos) < 12) {
            score += 15;
            isAnimatingAction = true;
            sprite.src = 'img/Sukuna sprite preparado.png';
            setTimeout(() => {
                if (activeGame === 'sukuna') {
                    sprite.src = 'img/Sukuna sprite corte.png';
                    container.style.transform = 'scale(1.1)';
                    setTimeout(() => container.style.transform = 'scale(1)', 100);
                }
            }, 50);

            setTimeout(() => {
                isAnimatingAction = false;
            }, 200); // Bloqueo de éxito muy corto
        } else {
            score -= 10;
            isAnimatingAction = true;
            sprite.src = 'img/Sukuna sprite riendo.png';
            sprite.classList.add('laugh-anim');
            setTimeout(() => {
                if (activeGame === 'sukuna') {
                    sprite.classList.remove('laugh-anim');
                    isAnimatingAction = false;
                }
            }, 500); // Bloqueo de fallo reducido
        }
        updateDisplays();
    };
}

// ------------------------------------------
// 5. HAKARI JACKPOT (Gambling)
// ------------------------------------------
async function startHakari() {
    if (!await checkGameAccess()) return;
    // Música de Hakari
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

    btn.disabled = true;

    // Animación de baile
    sprite.classList.remove('hakari-float');
    let danceFrame = 1;
    let danceInterval = setInterval(() => {
        danceFrame = (danceFrame === 1) ? 2 : 1;
        sprite.src = `img/Hakari sprites dance ${danceFrame}.png`;
    }, 150);

    let cycles = 0;
    const interval = setInterval(() => {
        r1.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        r2.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        r3.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        cycles++;

        if (cycles > 20) {
            clearInterval(interval);
            clearInterval(danceInterval);
            btn.disabled = false;
            sprite.src = 'img/Hakari sprites feliz.png';
            sprite.classList.add('hakari-float');

            if (r1.textContent === r2.textContent && r2.textContent === r3.textContent) {
                saveReward("JACKPOT50", 50, "JACKPOT (Hakari)");
                alert("¡JACKPOT! Has ganado un 50% de descuento. Código: JACKPOT50. QR disponible en tu cuenta.");
                score = 1000;
            } else {
                alert("Aw dangit! No has ganado nada esta vez. ¡Sigue intentándolo!");
            }
            updateDisplays();
        }
    }, 100);
}
