const MODES = {
    pomodoro: { time: 25, color: 'var(--accent-red)', title: '专注' },
    shortBreak: { time: 5, color: 'var(--accent-green)', title: '短休' },
    longBreak: { time: 15, color: 'var(--accent-blue)', title: '长休' }
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
const progressBar = document.getElementById('progress');
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
    
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 1);
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
    
    // Update Progress Bar
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    progressBar.style.width = `${progress}%`;
}

function switchMode(mode) {
    if (isRunning) {
        if (!confirm('计时器正在运行，确定要切换模式吗？')) return;
        pauseTimer();
    }
    if (currentMode === mode) return;
    
    currentMode = mode;
    timeLeft = MODES[currentMode].time * 60;
    totalTime = timeLeft;
    
    // Update UI Colors
    root.style.setProperty('--primary-color', MODES[currentMode].color);
    
    // Update Buttons
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    document.querySelector('.timer-display').classList.remove('timer-finished');
    updateDisplay();
}

function startTimer() {
    if (timeLeft <= 0) return;
    
    initAudio(); // Initialize audio context on user interaction
    
    isRunning = true;
    startBtn.textContent = '暂停';
    startBtn.classList.add('running');
    
    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerId);
            isRunning = false;
            startBtn.textContent = '开始';
            startBtn.classList.remove('running');
            document.querySelector('.timer-display').classList.add('timer-finished');
            
            // Play alarm
            playBeep();
            setTimeout(playBeep, 500);
            setTimeout(playBeep, 1000);
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerId);
    startBtn.textContent = '继续';
    startBtn.classList.remove('running');
}

function resetTimer() {
    pauseTimer();
    timeLeft = MODES[currentMode].time * 60;
    document.querySelector('.timer-display').classList.remove('timer-finished');
    startBtn.textContent = '开始';
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
updateDisplay();
