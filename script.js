// --- تعريف العناصر الثابتة ---
const DOM = {
    gameArea: document.getElementById('game-area'),
    playerCar: document.getElementById('player-car'),
    scoreDisplay: document.getElementById('score-display'),
    prizeCounter: document.getElementById('prize-counter'),
    screens: {
        start: document.getElementById('start-screen'),
        characterSelection: document.getElementById('character-selection-screen'),
        pause: document.getElementById('pause-screen'),
        gameOver: document.getElementById('game-over-screen'),
        win: document.getElementById('win-screen'),
    },
    buttons: {
        start: document.getElementById('start-button'),
        restart: document.getElementById('restart-button'),
        resume: document.getElementById('resume-btn'),
        restartLevel: document.getElementById('restart-level-btn'),
        newGame: document.getElementById('new-game-btn'),
        winRestart: document.getElementById('win-restart-button'),
    },
    letterGrid: document.getElementById('letter-grid'),
    finalScore: document.getElementById('final-score'),
};

// --- تعريف الإعدادات الثابتة للعبة ---
const CONFIG = {
    WIN_CONDITION: 20,
    SPEED_INCREASE_THRESHOLD: 5,
    INITIAL_OBJECT_SPEED: 4,
    FAST_OBJECT_SPEED: 6,
    PLAYER_SPEED: 6,
    OBJECT_CREATION_INTERVAL: 900,
    PRIZE_CHANCE: 0.2,
    ARABIC_LETTERS: ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'],
};

// --- متغيرات حالة اللعبة (سيتم إعادة تعيينها) ---
let state = {};
let objectCreationInterval;
let animationFrameId;

// --- حالة لوحة المفاتيح ---
const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };

// --- ربط الأحداث الرئيسية ---
function setupEventListeners() {
    DOM.buttons.start.onclick = showCharacterSelection;
    DOM.buttons.restart.onclick = showCharacterSelection;
    DOM.buttons.winRestart.onclick = showCharacterSelection;
    DOM.buttons.resume.onclick = togglePause;
    DOM.buttons.restartLevel.onclick = () => {
        togglePause(false); 
        startGame();
    };
    DOM.buttons.newGame.onclick = () => {
        togglePause(false); 
        showCharacterSelection();
    };

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && state.isPlaying) togglePause();
        if (keys.hasOwnProperty(e.key)) { e.preventDefault(); keys[e.key] = true; }
    });
    document.addEventListener('keyup', e => {
        if (keys.hasOwnProperty(e.key)) { e.preventDefault(); keys[e.key] = false; }
    });
}

// --- وظائف التحكم بالشاشات وحالة اللعبة ---
function showScreen(screenName) {
    Object.values(DOM.screens).forEach(s => s.classList.add('hide'));
    if (screenName) DOM.screens[screenName].classList.remove('hide');
}

function togglePause(forceState) {
    state.isPaused = forceState !== undefined ? forceState : !state.isPaused;
    if (state.isPaused) {
        DOM.screens.pause.classList.remove('hide');
    } else {
        DOM.screens.pause.classList.add('hide');
    }
}

function showCharacterSelection() {
    state.isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    clearInterval(objectCreationInterval);
    showScreen('characterSelection');
    populateLetterGrid();
}

function populateLetterGrid() {
    DOM.letterGrid.innerHTML = '';
    CONFIG.ARABIC_LETTERS.forEach(letter => {
        const button = document.createElement('button');
        button.className = 'letter-btn';
        button.innerText = letter;
        button.onclick = () => {
            state.prizeLetter = letter;
            startGame();
        };
        DOM.letterGrid.appendChild(button);
    });
}

// --- الوظيفة الرئيسية لبدء اللعبة ---
function startGame() {
    state = {
        score: 0, prizesCollected: 0,
        currentSpeed: CONFIG.INITIAL_OBJECT_SPEED,
        prizeLetter: state.prizeLetter, isPaused: false, isPlaying: true,
    };

    showScreen(null); 
    DOM.gameArea.innerHTML = ''; 
    DOM.gameArea.appendChild(DOM.playerCar); 
    
    // --- تم تعديل هذا السطر ليتوافق مع الحجم الجديد ---
    DOM.playerCar.style.left = '170px';
    DOM.playerCar.style.bottom = '20px';

    clearInterval(objectCreationInterval);
    objectCreationInterval = setInterval(createFallingObject, CONFIG.OBJECT_CREATION_INTERVAL);
    
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- حلقة اللعبة الرئيسية (Game Loop) ---
function gameLoop() {
    if (!state.isPlaying) return;
    if (!state.isPaused) {
        movePlayer();
        updateFallingObjects();
        updateUI();
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- وظائف تحديث اللعبة ---
function movePlayer() {
    const car = DOM.playerCar;
    const left = car.offsetLeft;
    const bottom = parseInt(car.style.bottom) || 0;
    const gameAreaWidth = DOM.gameArea.clientWidth;
    const gameAreaHeight = DOM.gameArea.clientHeight;

    if (keys.ArrowLeft && left > 0) car.style.left = `${left - CONFIG.PLAYER_SPEED}px`;
    if (keys.ArrowRight && left < (gameAreaWidth - car.offsetWidth)) car.style.left = `${left + CONFIG.PLAYER_SPEED}px`;
    if (keys.ArrowUp && bottom < (gameAreaHeight - car.offsetHeight)) car.style.bottom = `${bottom + CONFIG.PLAYER_SPEED}px`;
    if (keys.ArrowDown && bottom > 10) car.style.bottom = `${bottom - CONFIG.PLAYER_SPEED}px`;
}

function createFallingObject() {
    const obj = document.createElement('div');
    obj.className = 'falling-object';
    
    if (Math.random() < CONFIG.PRIZE_CHANCE) {
        obj.classList.add('prize');
        obj.innerText = state.prizeLetter;
        obj.dataset.type = 'prize';
    } else {
        obj.classList.add('obstacle');
        let randomObstacle;
        do { randomObstacle = CONFIG.ARABIC_LETTERS[Math.floor(Math.random() * CONFIG.ARABIC_LETTERS.length)]; } while (randomObstacle === state.prizeLetter);
        obj.innerText = randomObstacle;
        obj.dataset.type = 'obstacle';
    }
    
    obj.style.left = `${Math.floor(Math.random() * (DOM.gameArea.clientWidth - 50))}px`;
    obj.style.top = '-60px';
    DOM.gameArea.appendChild(obj);
}

function updateFallingObjects() {
    const objects = DOM.gameArea.querySelectorAll('.falling-object');
    const playerRect = DOM.playerCar.getBoundingClientRect();

    objects.forEach(obj => {
        obj.style.top = `${obj.offsetTop + state.currentSpeed}px`;
        if (obj.offsetTop > DOM.gameArea.clientHeight) {
            if (obj.dataset.type === 'obstacle') state.score++;
            obj.remove();
        } else {
            const objRect = obj.getBoundingClientRect();
            if (isColliding(playerRect, objRect)) {
                handleCollision(obj);
            }
        }
    });
}

function handleCollision(obj) {
    if (obj.dataset.type === 'prize') {
        state.score += 50;
        state.prizesCollected++;
        if (state.prizesCollected >= CONFIG.WIN_CONDITION) {
            endGame(true);
        } else if (state.prizesCollected === CONFIG.SPEED_INCREASE_THRESHOLD) {
            state.currentSpeed = CONFIG.FAST_OBJECT_SPEED;
        }
    } else {
        endGame(false);
    }
    obj.remove();
}

function isColliding(rect1, rect2) {
    return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
}

function updateUI() {
    DOM.scoreDisplay.innerText = `النتيجة: ${state.score}`;
    DOM.prizeCounter.innerText = `الجوائز: ${state.prizesCollected} / ${CONFIG.WIN_CONDITION}`;
}

// --- وظيفة إنهاء اللعبة ---
function endGame(isWin) {
    state.isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    clearInterval(objectCreationInterval);
    
    if (isWin) {
        showScreen('win');
    } else {
        DOM.finalScore.innerText = state.score;
        showScreen('gameOver');
    }
}

// --- بدء كل شيء ---
setupEventListeners();