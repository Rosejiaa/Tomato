const MODES = {
    pomodoro: { time: 25, color: 'var(--accent-red)', title: '专注', shadow: 'rgba(255, 107, 107, 0.2)' },
    shortBreak: { time: 5, color: 'var(--accent-green)', title: '短休', shadow: 'rgba(81, 207, 102, 0.2)' },
    longBreak: { time: 15, color: 'var(--accent-blue)', title: '长休', shadow: 'rgba(51, 154, 240, 0.2)' }
};

let currentMode = 'pomodoro';
let timeLeft = MODES[currentMode].time * 60;
let totalTime = timeLeft;
let timerId = null;
let isRunning = false;

// DOM Elements
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const root = document.documentElement;

// Audio context for completion beep
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playBeep() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Play a cuter, higher pitched beep (C6)
    osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.5);
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    minutesDisplay.textContent = minutesStr;
    secondsDisplay.textContent = secondsStr;

    // Update Document Title
    document.title = `${minutesStr}:${secondsStr} - ${MODES[currentMode].title}`;
}

function switchMode(mode) {
    if (isRunning) {
        if (!confirm('计时器正在运行，小番茄会难过的，确定要切换吗？')) return;
        pauseTimer();
    }
    if (currentMode === mode) return;

    currentMode = mode;
    timeLeft = MODES[currentMode].time * 60;
    totalTime = timeLeft;

    // Reset start button text
    startBtn.textContent = '开始';

    // Update UI Colors
    root.style.setProperty('--primary-color', MODES[currentMode].color);
    root.style.setProperty('--shadow-color', MODES[currentMode].shadow);

    // Update Body attributes for CSS animations
    document.body.setAttribute('data-mode', mode);

    // Update Buttons
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    updateDisplay();
}

function startTimer() {
    if (timeLeft <= 0) return;

    initAudio();

    isRunning = true;
    startBtn.textContent = '暂停';
    startBtn.classList.add('running');
    document.body.classList.add('is-running');

    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerId);
            isRunning = false;
            startBtn.textContent = '开始专注';
            startBtn.classList.remove('running');
            document.body.classList.remove('is-running');

            // Play alarm
            playBeep();
            setTimeout(playBeep, 300);
            setTimeout(playBeep, 600);
            setTimeout(playBeep, 900);
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerId);
    startBtn.textContent = '继续';
    startBtn.classList.remove('running');
    document.body.classList.remove('is-running');
}

function resetTimer() {
    pauseTimer();
    timeLeft = MODES[currentMode].time * 60;
    startBtn.textContent = '开始';
    document.body.classList.remove('is-running');
    updateDisplay();
}

// Event Listeners
startBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);

modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => switchMode(e.target.dataset.mode));
});

// Request Notification Permission
if ('Notification' in window && Notification.permission !== 'denied' && Notification.permission !== 'granted') {
    startBtn.addEventListener('click', () => {
        Notification.requestPermission();
    }, { once: true });
}

// Initialize
document.body.setAttribute('data-mode', currentMode);
updateDisplay();
