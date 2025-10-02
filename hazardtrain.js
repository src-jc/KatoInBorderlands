const totalCarts = 23; // 0–22
const maskLimit = 5;
const totalPoisonPerSection = 5;

let poisonedCarts = [];
let currentCart = 1;
let masksLeft = maskLimit;
let hp = 3;
let timer;
let timeLeft = 10;

const trainDiv = document.getElementById('train');
const statusDiv = document.getElementById('status');
const useMaskBtn = document.getElementById('useMask');
const skipBtn = document.getElementById('skip');
const scanBtn = document.getElementById('scanBtn');
const maskIconsDiv = document.getElementById('maskIcons');
const hpDiv = document.getElementById('hp');

const introScreen = document.getElementById('introScreen');
const gameDiv = document.getElementById('game');
const startBtnIntro = document.getElementById('startBtnIntro');
const overlay = document.getElementById('overlay');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');


function setupGame() {
    poisonedCarts = [];
    currentCart = 1;
    masksLeft = maskLimit;
    hp = 3;
    trainDiv.innerHTML = "";
    maskIconsDiv.innerHTML = "";
    hpDiv.innerText = `HP: ${hp}`;

    for (let i = 0; i < totalCarts; i++) {
        const cart = document.createElement('div');
        cart.className = 'cart';
        if (i === 0) {
            cart.innerText = "Start";
            cart.classList.add("safe");
        } else if (i === 11) {
            cart.innerText = "Checkpoint";
        } else if (i === totalCarts - 1) {
            cart.innerText = "Finish";
        } else {
            cart.innerText = i.toString();
        }
        trainDiv.appendChild(cart);
    }

    while (poisonedCarts.filter(c => c >= 1 && c <= 10).length < totalPoisonPerSection) {
        let r = Math.floor(Math.random() * 10) + 1;
        if (!poisonedCarts.includes(r)) poisonedCarts.push(r);
    }
    while (poisonedCarts.filter(c => c >= 12 && c <= 21).length < totalPoisonPerSection) {
        let r = Math.floor(Math.random() * 10) + 12;
        if (!poisonedCarts.includes(r)) poisonedCarts.push(r);
    }

    updateMasks();
    updateHP()
}

function startGame() {
    introScreen.style.display = "none";
    overlay.style.visibility = "hidden";
    gameDiv.style.display = "block";
    setupGame();
    nextCart();
}

function nextCart() {
    if (currentCart >= totalCarts) {
        winGame();
        return;
    }

    const carts = document.querySelectorAll('.cart');
    carts.forEach(c => c.classList.remove('active'));
    carts[currentCart].classList.add('active');

    announce(`Cart ${carts[currentCart].innerText}`);
    playannounce()
    startTimer();
}

function startTimer() {
    timeLeft = 10;
    clearInterval(timer);
    timer = setInterval(() => {
        document.getElementById("timerDisplay").innerText = `${timeLeft}s`;
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(timer);
            resolveChoice(false);
        }
    }, 1000);

    useMaskBtn.disabled = masksLeft <= 0;
    scanBtn.disabled = hp < 2;
}

// preload sounds
const dingSound = new Audio("sounds/ding.mp3");
const hurtSound = new Audio("sounds/hurt.mp3");
const LoserSound = new Audio("sounds/Loser.mp3");
const WastedSound = new Audio("sounds/Wasted.mp3");
const CheckpointSound = new Audio("sounds/Yay.mp3");
const SavedSound = new Audio("sounds/Phew.mp3");
const ScanSound = new Audio("sounds/Scan.mp3");
const ErrorSound = new Audio("sounds/Error.mp3");
const AnnounceSound = new Audio("sounds/Announcetrain.mp3");

function playDing() {
    dingSound.currentTime = 0;
    dingSound.play().catch(() => {});
}

function playHurt() {
    hurtSound.currentTime = 0;
    hurtSound.play().catch(() => {});
}

function playLoser() {
    LoserSound.currentTime = 0;
    LoserSound.play().catch(() => {});
}

function playwasted() {
    WastedSound.currentTime = 0;
    WastedSound.play().catch(() => {});
}

function playcheckpoint() {
    CheckpointSound.currentTime = 0;
    CheckpointSound.play().catch(() => {});
}

function playsaved() {
    SavedSound.currentTime = 0;
    SavedSound.play().catch(() => {});
}

function playscan() {
    ScanSound.currentTime = 0;
    ScanSound.play().catch(() => {});
}

function playerror() {
    ErrorSound.currentTime = 0;
    ErrorSound.play().catch(() => {});
}

function playannounce() {
    AnnounceSound.currentTime = 0;
    AnnounceSound.play().catch(() => {});
}

const AudioContextClass = window.AudioContext || window.webkitAudioContext;

function playHiss(duration = 3) {
    const audioCtx = new AudioContextClass();
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    noise.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start();
    noise.stop(audioCtx.currentTime + duration);
}

function resolveChoice(usedMask) {
    clearInterval(timer);
    const carts = document.querySelectorAll('.cart');
    const isPoisoned = poisonedCarts.includes(currentCart);

    if (currentCart === 11) {
        masksLeft += 3;
        updateMasks();
        announce("Checkpoint reached! +3 canisters.");
        playcheckpoint()
        currentCart++;
        setTimeout(nextCart, 2500);
        return;
    }

    announce(`Cart ${carts[currentCart].innerText} is releasing gas...`);
    playHiss(3);
    carts[currentCart].classList.add('active');

    useMaskBtn.disabled = true;
    skipBtn.disabled = true;
    scanBtn.disabled = true;

    setTimeout(() => {
        if (usedMask && masksLeft > 0) {
            masksLeft--;
            updateMasks();

            if (isPoisoned) {
                carts[currentCart].classList.add('maskUsed');
                poisonedCarts = poisonedCarts.filter(c => c !== currentCart);
                announce(`Cart ${carts[currentCart].innerText} released poison, mask saved you.`);
                playsaved()
            } else {
                carts[currentCart].classList.add('safe');
                announce(`Cart ${carts[currentCart].innerText} was safe. Canister wasted.`);
                playwasted()
            }
        } else {
            if (isPoisoned) {
                hp--;
                updateHP();
                playHurt();
                if (hp <= 0) {
                    announce(`Cart ${carts[currentCart].innerText} released poison! You collapsed...`);
                    gameOver("You lost all HP.");
                    playLoser()
                    return;
                } else {
                    carts[currentCart].classList.add('poisonRevealed');
                    announce(`Cart ${carts[currentCart].innerText} released poison! You lost 1 HP.`);
                    playHurt()
                }
            } else {
                carts[currentCart].classList.add('safe');
                announce(`Cart ${carts[currentCart].innerText} was safe.`);
                playDing();
            }
        }

        useMaskBtn.disabled = masksLeft <= 0;
        scanBtn.disabled = hp < 2;
        skipBtn.disabled = false;

        currentCart++;
        setTimeout(nextCart, 2000);
    }, 3000);
}

function updateMasks() {
    maskIconsDiv.innerHTML = "";
    for (let i = 0; i < maskLimit; i++) {
        const icon = document.createElement("div");
        icon.classList.add("mask");
        if (i >= masksLeft) icon.classList.add("used");
        maskIconsDiv.appendChild(icon);
    }
}

function scanAhead() {
    if (hp < 2) {
        statusDiv.innerText = "Not enough HP to scan.";
        playerror()
        return;
    }

    hp -= 2;
    updateHP()
    playscan()

    const carts = document.querySelectorAll('.cart');
    const remainingCarts = [];
    for (let i = currentCart; i < carts.length - 1; i++) {
        remainingCarts.push(i);
    }

    const scanCarts = [];
    while (scanCarts.length < 2 && remainingCarts.length > 0) {
        const idx = Math.floor(Math.random() * remainingCarts.length);
        scanCarts.push(remainingCarts[idx]);
        remainingCarts.splice(idx, 1);
    }

    scanCarts.forEach(i => {
        carts[i].classList.add('scan');
    });

    statusDiv.innerText = `Scan used! HP left: ${hp}`;
}

function gameOver(msg) {
    overlayMsg.innerText = msg + " Game Over.";
    overlay.style.visibility = "visible";
    playLoser()
}

function winGame() {
    const carts = document.querySelectorAll('.cart');
    carts[totalCarts - 1].classList.add('finish');
    overlayMsg.innerText = "You reached the Finish. You win!";
    overlay.style.visibility = "visible";
    playcheckpoint()
}

function updateHP() {
    const hpDiv = document.getElementById("hp");
    hpDiv.innerHTML = "";
    const totalLives = 3; // change if you use a different max
    for (let i = 0; i < totalLives; i++) {
        const heart = document.createElement("div");
        heart.className = "heart" + (i >= hp ? " lost" : "");
        hpDiv.appendChild(heart);
    }
}

function announce(msg) {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = msg;
    statusDiv.classList.remove("show");
    void statusDiv.offsetWidth;
    statusDiv.classList.add("show");
}

startBtnIntro.addEventListener('click', startGame);
scanBtn.addEventListener('click', scanAhead);
useMaskBtn.addEventListener('click', () => resolveChoice(true));
skipBtn.addEventListener('click', () => resolveChoice(false));
overlayBtn.addEventListener('click', startGame);
