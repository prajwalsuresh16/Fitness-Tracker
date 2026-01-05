class RecoveryManager {
    constructor(app) {
        this.app = app;
        this.isSessionActive = false;
        this.startTime = null;
        this.sessionDuration = 0; // ms
        this.lastTotalTime = 0; // minutes

        this.timerEl = document.getElementById('zen-session-timer');
        this.totalTimeEl = document.getElementById('zen-total-time');
        this.instructionEl = document.getElementById('zen-instruction');
        this.startBtn = document.getElementById('start-zen-btn');
        this.stopBtn = document.getElementById('stop-zen-btn');
        this.sphere = document.getElementById('zen-sphere');

        this.rhythm = 'box'; // Default
        this.phase = 'in'; // in, hold, out, hold2
        this.phaseStartTime = 0;

        this.rhythms = {
            box: { in: 4000, hold: 4000, out: 4000, hold2: 4000 },
            relax: { in: 4000, hold: 7000, out: 8000, hold2: 0 },
            calm: { in: 5000, hold: 0, out: 5000, hold2: 0 }
        };

        this.init();
    }

    init() {
        if (!this.startBtn) return;

        this.startBtn.addEventListener('click', () => this.startSession());
        this.stopBtn.addEventListener('click', () => this.stopSession());

        document.querySelectorAll('.rhythm-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.rhythm-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.rhythm = btn.dataset.rhythm;
            });
        });

        this.loadStats();
    }

    loadStats() {
        if (!this.app.userProfile) return;

        // Re-fetch in case of DOM changes
        this.totalTimeEl = document.getElementById('zen-total-time');

        this.totalZenSeconds = parseInt(this.app.userProfile.zenTotalSeconds) || 0;
        this.updateTotalTimeDisplay();
    }

    updateTotalTimeDisplay() {
        if (!this.totalTimeEl) return;

        const m = Math.floor(this.totalZenSeconds / 60);
        const s = this.totalZenSeconds % 60;

        if (m > 0) {
            this.totalTimeEl.textContent = `${m}m ${s}s`;
        } else {
            this.totalTimeEl.textContent = `${s}s`;
        }
    }

    saveStats(seconds) {
        if (!this.app.userProfile) return;

        const current = parseInt(this.app.userProfile.zenTotalSeconds) || 0;
        this.app.userProfile.zenTotalSeconds = current + seconds;

        // Update minutes for legacy support (optional but keeps it cleaner)
        this.app.userProfile.zenTotalMinutes = Math.floor(this.app.userProfile.zenTotalSeconds / 60);

        this.app.saveProfile();

        this.totalZenSeconds = this.app.userProfile.zenTotalSeconds;

        // Re-fetch to be safe
        this.totalTimeEl = document.getElementById('zen-total-time');
        this.updateTotalTimeDisplay();
    }

    startSession() {
        this.isSessionActive = true;
        this.startTime = Date.now();
        this.phaseStartTime = Date.now();
        this.phase = 'in';

        this.startBtn.classList.add('hidden');
        this.stopBtn.classList.remove('hidden');
        if (this.sphere) this.sphere.classList.add('active');

        this.app.ui.showNotification("Mindfulness session started. Focus on the sphere.");

        requestAnimationFrame((t) => this.tick(t));
    }

    stopSession() {
        if (!this.isSessionActive) return;

        this.isSessionActive = false;
        const durationSec = Math.floor((Date.now() - this.startTime) / 1000);
        const durationMin = Math.floor(durationSec / 60);

        if (durationSec > 0) {
            // XP Rule: 5 XP per 5 minutes
            const xp = Math.floor(durationMin / 5) * 5;
            if (xp > 0) {
                this.app.addXP(xp);
                this.app.ui.showNotification(`Great session! You earned ${xp} XP for your mindfulness.`);
            } else {
                const sessionStr = durationSec >= 60 ? `${durationMin}m ${durationSec % 60}s` : `${durationSec}s`;
                this.app.ui.showNotification(`Session complete (${sessionStr}). Stay consistent for XP!`);
            }
            this.saveStats(durationSec);
        } else {
            this.app.ui.showNotification("Session ended early.");
        }

        this.startBtn.classList.remove('hidden');
        this.stopBtn.classList.add('hidden');
        if (this.sphere) {
            this.sphere.classList.remove('active');
            this.sphere.style.transform = 'scale(1)';
        }
        this.instructionEl.textContent = "READY";
        this.timerEl.textContent = "00:00";
    }

    tick() {
        if (!this.isSessionActive) return;

        const now = Date.now();
        const elapsed = now - this.startTime;
        const phaseElapsed = now - this.phaseStartTime;

        // Update timer
        const secs = Math.floor(elapsed / 1000);
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        this.timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        // Breathing Logic
        const currentRhythm = this.rhythms[this.rhythm];
        const phaseDuration = currentRhythm[this.phase];

        if (phaseElapsed >= phaseDuration) {
            // Next Phase
            const phases = Object.keys(currentRhythm).filter(k => currentRhythm[k] > 0);
            const currentIndex = phases.indexOf(this.phase);
            this.phase = phases[(currentIndex + 1) % phases.length];
            this.phaseStartTime = now;
        }

        // Visual Updates
        this.updateVisuals(phaseElapsed, phaseDuration);

        requestAnimationFrame(() => this.tick());
    }

    updateVisuals(elapsed, duration) {
        let scale = 1;
        let text = "";

        if (this.phase === 'in') {
            scale = 1 + ((elapsed / duration) * 1.2); // Scale from 1 to 2.2
            text = "Breathe In";
        } else if (this.phase === 'hold') {
            scale = 2.2;
            text = "Hold";
        } else if (this.phase === 'out') {
            scale = 2.2 - ((elapsed / duration) * 1.2); // Scale from 2.2 to 1
            text = "Breathe Out";
        } else if (this.phase === 'hold2') {
            scale = 1;
            text = "Hold";
        }

        this.sphere.style.transform = `scale(${scale})`;
        this.instructionEl.textContent = text;
    }
}
