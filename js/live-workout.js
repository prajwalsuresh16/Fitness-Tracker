class LiveWorkoutManager {
    constructor(app) {
        this.app = app;
        this.isActive = false;
        this.timerInterval = null;
        this.startTime = null;
        this.type = 'running'; // Default
        this.caloriesBurned = 0;

        // DOM Elements
        this.activeCard = document.getElementById('active-workout-card');
        this.timerEl = document.getElementById('live-timer');
        this.caloriesEl = document.getElementById('live-calories');
        this.startBtn = document.getElementById('start-live-btn');
        this.stopBtn = document.getElementById('stop-active-btn');

        this.initListeners();
    }

    initListeners() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                // For simplicity, default to running or open a mini-modal. 
                // Let's assume 'running' for the quick start button or ask user.
                // For this MVP, we'll toggle a picker or just default to Running.
                this.startSession('running');
            });
        }

        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.endSession());
        }
    }

    startSession(type) {
        if (this.isActive) return;

        this.isActive = true;
        this.type = type;
        this.startTime = Date.now();
        this.caloriesBurned = 0;

        // UI
        this.activeCard.classList.remove('hidden');
        this.activeCard.classList.add('slide-in-top');
        document.body.classList.add('workout-active');

        // Start Timer
        this.timerInterval = setInterval(() => this.tick(), 1000);
        this.tick(); // Immediate update

        this.app.ui.showNotification(`Started Live ${type.charAt(0).toUpperCase() + type.slice(1)} Session!`);
    }

    tick() {
        const elapsedSecs = Math.floor((Date.now() - this.startTime) / 1000);

        // Update Timer UI (MM:SS)
        const mins = Math.floor(elapsedSecs / 60).toString().padStart(2, '0');
        const secs = (elapsedSecs % 60).toString().padStart(2, '0');
        if (this.timerEl) this.timerEl.textContent = `${mins}:${secs}`;

        // Calculate Calories (Simulated Real-time)
        // Avg MET for Run = 8.0? Let's use Calculator logic if possible or simplified here.
        // Cal = (MET * 3.5 * Weight / 200) * (duration_mins)
        // Let's assume standard weight 70kg for real-time if profile not ready
        const weight = this.app.userProfile?.goals?.weight || 70;
        const met = this.getMET(this.type);
        const formulaPerSec = (met * 3.5 * weight) / 200 / 60;

        this.caloriesBurned += formulaPerSec;

        if (this.caloriesEl) this.caloriesEl.textContent = Math.floor(this.caloriesBurned);
    }

    getMET(type) {
        // Simplified METs for live view
        const mets = {
            running: 9.8,
            cycling: 7.5,
            weightlifting: 3.5,
            yoga: 2.5,
            hiit: 8.0
        };
        return mets[type] || 5.0;
    }

    endSession() {
        if (!this.isActive) return;

        clearInterval(this.timerInterval);
        this.isActive = false;

        // UI
        this.activeCard.classList.add('slide-out-top');
        setTimeout(() => {
            this.activeCard.classList.add('hidden');
            this.activeCard.classList.remove('slide-in-top', 'slide-out-top');
        }, 500);
        document.body.classList.remove('workout-active');

        // Save to Log
        const durationMins = Math.ceil((Date.now() - this.startTime) / 60000);
        const workoutData = {
            type: this.type,
            duration: durationMins,
            intensity: 'active', // Auto-detected
            calories: Math.floor(this.caloriesBurned),
            timestamp: Date.now()
        };

        this.app.logWorkout(workoutData);
    }
}
