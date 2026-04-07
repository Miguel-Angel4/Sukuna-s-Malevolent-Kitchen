// ==========================================
// Sukuna's Malevolent Kitchen - Minigames JS
// ==========================================

const modal = document.getElementById('game-modal');
const container = document.getElementById('game-container');
const timerDisplay = document.getElementById('game-timer');
const scoreDisplay = document.getElementById('game-score');

let timer = 0;
let score = 0;
let gameInterval;
let activeGame = null;

function stopGame() {
    modal.style.display = 'none';
    container.innerHTML = '';
    clearInterval(gameInterval);
    activeGame = null;
    timer = 0;
    score = 0;
}

function updateDisplays() {
    timerDisplay.textContent = `Tiempo: ${Math.max(0, timer).toFixed(1)}s`;
    scoreDisplay.textContent = `Puntos: ${score}`;
}

// ------------------------------------------
// 1. YUJI KOKUSEN (Timing Game)
// ------------------------------------------
function startKokusen() {
    modal.style.display = 'flex';
    container.innerHTML = '<div style="color:#fff; padding:20px;">Pulsa los círculos cuando el aro rojo coincida con el negro.</div>';
    timer = 40;
    score = 0;
    activeGame = 'kokusen';
    updateDisplays();

    gameInterval = setInterval(() => {
        timer -= 0.1;
        updateDisplays();
        if (timer <= 0) {
            alert(`Juego terminado. Puntos: ${score}. ¡Has conseguido un 5% de descuento! Código: BLACKFLASH5`);
            stopGame();
        }
    }, 100);

    spawnKokusenCircle();
}

function spawnKokusenCircle() {
    if (activeGame !== 'kokusen') return;

    const circle = document.createElement('div');
    circle.style.position = 'absolute';
    circle.style.width = '60px';
    circle.style.height = '60px';
    circle.style.borderRadius = '50%';
    circle.style.border = '3px solid #000';
    circle.style.background = 'rgba(0,0,100,0.5)';
    circle.style.left = Math.random() * 700 + 'px';
    circle.style.top = Math.random() * 500 + 'px';
    circle.style.cursor = 'pointer';

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

    // Animation of shrinking ring
    setTimeout(() => {
        ring.style.width = '60px';
        ring.style.height = '60px';
        ring.style.top = '0px';
        ring.style.left = '0px';
    }, 10);

    circle.onclick = () => {
        const currentSize = parseInt(ring.style.width);
        if (currentSize < 70 && currentSize > 50) {
            score += 10;
            // Visual feedback
            circle.style.background = 'white';
            setTimeout(() => circle.remove(), 100);
        } else {
            score -= 5;
            circle.remove();
        }
        spawnKokusenCircle();
    };

    // Auto remove if not clicked
    setTimeout(() => {
        if (circle.parentNode) {
            circle.remove();
            spawnKokusenCircle();
        }
    }, 1500);
}

// ------------------------------------------
// 2. TODO BOOGIE WOOGIE (Clicker)
// ------------------------------------------
function startTodo() {
    modal.style.display = 'flex';
    container.innerHTML = '<img src="img/game_todo.png" id="todo-sprite" style="position:absolute; width:100px; cursor:pointer; image-rendering:pixelated;">';
    timer = 60;
    score = 0;
    activeGame = 'todo';
    updateDisplays();

    const sprite = document.getElementById('todo-sprite');
    
    const moveTodo = () => {
        sprite.style.left = Math.random() * 700 + 'px';
        sprite.style.top = Math.random() * 500 + 'px';
    };
    
    moveTodo();

    sprite.onclick = () => {
        score++;
        updateDisplays();
        // Teleport
        moveTodo();
        // Play clap sound simulation visual
        const clap = document.createElement('div');
        clap.textContent = '¡CLAP!';
        clap.style.position = 'absolute';
        clap.style.left = sprite.style.left;
        clap.style.top = sprite.style.top;
        clap.style.color = '#B31B1B';
        clap.style.fontWeight = 'bold';
        container.appendChild(clap);
        setTimeout(() => clap.remove(), 500);
    };

    gameInterval = setInterval(() => {
        timer -= 1;
        updateDisplays();
        if (timer <= 0) {
            alert(`¡Increíble Brother! Puntos: ${score}. Descuento del 10%: BROTHER10`);
            stopGame();
        }
    }, 1000);
}

// ------------------------------------------
// 3. GOJO AHORCADO (Hangman)
// ------------------------------------------
const PALABRAS = ["SUKUNA", "GOJO", "ITARODI", "MEGUMI", "NOBARA", "EXPANSION", "DOMINIO", "MALDICION", "TECNICA", "TODO", "NANAMI"];
let palabraOculta = "";
let palabraAdivinada = [];
let intentos = 6;

function startGojo() {
    modal.style.display = 'flex';
    activeGame = 'gojo';
    intentos = 6;
    palabraOculta = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
    palabraAdivinada = Array(palabraOculta.length).fill("_");
    
    renderHangman();
}

function renderHangman() {
    container.innerHTML = `
        <div style="text-align:center; color:#fff; padding:50px;">
            <img src="img/game_gojo.png" style="width:100px; margin-bottom:20px;">
            <div style="font-size:3rem; letter-spacing:10px; margin-bottom:30px;">${palabraAdivinada.join(" ")}</div>
            <div style="color:#B31B1B;">Vidas: ${"❤️".repeat(intentos)}</div>
            <div id="keyboard" style="margin-top:30px; display:grid; grid-template-columns: repeat(9, 1fr); gap:5px;"></div>
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
        if (!palabraAdivinada.includes("_")) {
            alert(`¡Infinito! Ganaste. Descuento del 15%: VACIOINFINITO15`);
            stopGame();
        }
    } else {
        intentos--;
        if (intentos <= 0) {
            alert(`Has caído. La palabra era: ${palabraOculta}`);
            stopGame();
        }
    }
    renderHangman();
}

// ------------------------------------------
// 4. SUKUNA CORTES (Slider Game)
// ------------------------------------------
function startSukuna() {
    modal.style.display = 'flex';
    container.innerHTML = `
        <div style="text-align:center; color:#fff; padding:50px;">
            <img src="img/game_sukuna.png" style="width:150px; margin-bottom:50px;">
            <div style="width:80%; height:20px; background:#333; margin:0 auto; position:relative; border-radius:10px;">
                <div id="hit-zone" style="width:40px; height:100%; background:#B31B1B; position:absolute; left:50%; transform:translateX(-50%);"></div>
                <div id="slider-pointer" style="width:10px; height:30px; background:#fff; position:absolute; top:-5px; left:0;"></div>
            </div>
            <button class="botoncarta mt-5" onclick="cutSukuna()">CORTAR (ESPACIO)</button>
        </div>
    `;
    
    timer = 30;
    score = 0;
    activeGame = 'sukuna';
    updateDisplays();

    let pos = 0;
    let dir = 1;
    const pointer = document.getElementById('slider-pointer');
    const hitZone = document.getElementById('hit-zone');

    gameInterval = setInterval(() => {
        timer -= 0.02;
        pos += dir * 2;
        if (pos >= 100 || pos <= 0) dir *= -1;
        pointer.style.left = pos + '%';
        updateDisplays();

        if (timer <= 0) {
            alert(`Santuario de Malévolo cerrado. Puntos: ${score}. Descuento del 20%: SANTUARIO20`);
            stopGame();
        }
    }, 20);

    window.onkeydown = (e) => { if(e.code === 'Space') cutSukuna(); };
}

function cutSukuna() {
    const pointer = document.getElementById('slider-pointer');
    const pos = parseFloat(pointer.style.left);
    if (pos > 45 && pos < 55) {
        score += 50;
        // Visual effect
        container.style.boxShadow = 'inset 0 0 50px red';
        setTimeout(() => container.style.boxShadow = 'none', 100);
    } else {
        score -= 20;
    }
}

// ------------------------------------------
// 5. HAKARI JACKPOT (Gambling)
// ------------------------------------------
function startHakari() {
    modal.style.display = 'flex';
    container.innerHTML = `
        <div style="text-align:center; color:#fff; padding:50px;">
            <img src="img/game_hakari.png" style="width:120px;">
            <h2 style="color:#f1dc1e;">PRIVATE PURE LOVE TRAIN</h2>
            <div style="display:flex; justify-content:center; gap:20px; font-size:5rem; margin:40px 0;">
                <div id="reel1" class="glass-effect" style="width:100px; padding:20px;">?</div>
                <div id="reel2" class="glass-effect" style="width:100px; padding:20px;">?</div>
                <div id="reel3" class="glass-effect" style="width:100px; padding:20px;">?</div>
            </div>
            <button id="spin-btn" class="botoncarta" onclick="spinJackpot()" style="font-size:1.5rem;">TIRAR PALANCA</button>
            <p class="mt-4">"Let's go gambling!"</p>
        </div>
    `;
    activeGame = 'hakari';
    score = 0;
    updateDisplays();
}

function spinJackpot() {
    const symbols = ["💀", "🔥", "💎", "🎰", "❤️", "🤞"];
    const r1 = document.getElementById('reel1');
    const r2 = document.getElementById('reel2');
    const r3 = document.getElementById('reel3');
    const btn = document.getElementById('spin-btn');
    
    btn.disabled = true;
    
    let cycles = 0;
    const interval = setInterval(() => {
        r1.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        r2.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        r3.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        cycles++;
        
        if (cycles > 20) {
            clearInterval(interval);
            btn.disabled = false;
            if (r1.textContent === r2.textContent && r2.textContent === r3.textContent) {
                alert("¡JACKPOT! ¡ESTOY CON MI 10/10 FEMBOY! Descuento 50%: JACKPOT50");
                stopGame();
            } else {
                // Típico audio de perder o mensaje
                console.log("Aw dangit!");
            }
        }
    }, 100);
}
