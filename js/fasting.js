class FastingManager {
    constructor(app) {
        this.app = app;
        this.timerInterval = null;

        // DOM Elements
        this.statusEl = document.getElementById('fasting-status');
        this.timerEl = document.getElementById('timer-display');
        this.goalDisplayEl = document.getElementById('fasting-goal-display');
        this.startBtn = document.getElementById('start-fast-btn');
        this.endBtn = document.getElementById('end-fast-btn');
        this.goalSelect = document.getElementById('fast-goal');
        this.progressRing = document.querySelector('.timer-progress');
        this.historyList = document.getElementById('fasting-history-list');

        if (!this.startBtn) console.error("CRITICAL: Start Fast Button NOT FOUND!");
        if (!this.endBtn) console.error("CRITICAL: End Fast Button NOT FOUND!");

        console.log("FastingManager Init:", {
            startBtn: this.startBtn,
            endBtn: this.endBtn,
            goalSelect: this.goalSelect
        });

        // Ring Circumference: 2 * PI * r (r=140) => approx 879
        this.circumference = 879;
        if (this.progressRing) {
            this.progressRing.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
            this.progressRing.style.strokeDashoffset = this.circumference;
        }

        // State from UserProfile
        this.attachListeners();
        // this.init(); // REMOVED: Cannot init state immediately as userProfile is not loaded yet
    }

    loadData() {
        // Called by App.loadData() once profile is ready
        this.checkState();
        this.renderHistory();

        // Start Tick
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        this.updateTimer(); // Immediate
    }

    attachListeners() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startFast());
        }
        if (this.endBtn) {
            this.endBtn.addEventListener('click', () => this.endFast());
        }
    }

    checkState() {
        const state = this.app.userProfile.fastingState || { isFasting: false, startTime: null, goal: 16 };

        if (state.isFasting) {
            this.toggleUI(true);
            this.goalSelect.value = state.goal;
            this.goalSelect.disabled = true;
        } else {
            this.toggleUI(false);
            this.goalSelect.disabled = false;
        }
    }

    startFast() {
        console.log("Start Fast Clicked!");
        const goal = parseInt(this.goalSelect.value);
        this.app.userProfile.fastingState = {
            isFasting: true,
            startTime: Date.now(),
            goal: goal
        };
        this.app.saveProfile();

        this.toggleUI(true);
        this.goalSelect.disabled = true;
        this.updateTimer();

        this.app.ui.showNotification(`Fasting Started! Target: ${goal}h`);
    }

    endFast() {
        const state = this.app.userProfile.fastingState;
        if (!state || !state.isFasting) return;

        const durationMs = Date.now() - state.startTime;
        const durationHrs = durationMs / (1000 * 60 * 60);

        // Save to History
        if (!this.app.userProfile.fastingHistory) {
            this.app.userProfile.fastingHistory = [];
        }

        const entry = {
            date: new Date().toLocaleDateString(),
            startTime: new Date(state.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: durationHrs.toFixed(1),
            goal: state.goal,
            success: durationHrs >= state.goal
        };

        this.app.userProfile.fastingHistory.unshift(entry);

        // Reset State
        this.app.userProfile.fastingState = { isFasting: false, startTime: null, goal: 16 };
        this.app.saveProfile();

        // UI Reset
        this.toggleUI(false);
        this.goalSelect.disabled = false;

        // Remove Ring Logic
        // this.progressRing.style.strokeDashoffset = ...

        this.timerEl.textContent = "00:00:00";
        this.statusEl.textContent = "Eating Window";
        const remainingEl = document.getElementById('timer-remaining');
        if (remainingEl) remainingEl.textContent = "--:--:--";

        this.renderHistory();

        // Calculate XP: 0 if failed. Formula if success.
        let xp = 0;
        let msg = "Fast Stopped. Time kept.";

        if (entry.success) {
            // Base 20 + 5 per hour
            xp = Math.round(20 + (durationHrs * 5));
            this.app.addXP(xp);
            msg = `Fast Completed! +${xp} XP 🔥`;
            this.app.ui.showNotification(msg, 'success');

            // Check badges (Fasting Warrior, etc.)
            setTimeout(() => {
                if (this.app.checkAchievements) this.app.checkAchievements();
            }, 500); // Small delay to let XP notification settle
        } else {
            // Failed / Stopped Early
            msg = `Fast Stopped Early. Reach ${state.goal}h for XP next time!`;
            this.app.ui.showNotification(msg, 'info');
        }
    }

    updateTimer() {
        const state = this.app.userProfile.fastingState;

        if (state && state.isFasting && state.startTime) {
            const elapsed = Date.now() - state.startTime;

            // Format Time (Elapsed)
            this.timerEl.textContent = this.formatTime(elapsed);
            this.statusEl.textContent = "Fasting Zone";

            // Calculate Remaining
            const totalMs = state.goal * 60 * 60 * 1000;
            const remaining = Math.max(0, totalMs - elapsed);

            const remainingEl = document.getElementById('timer-remaining');
            if (remainingEl) {
                remainingEl.textContent = this.formatTime(remaining);

                if (remaining === 0) {
                    remainingEl.innerHTML = "GOAL REACHED! <i class='fa-solid fa-check'></i>";
                    remainingEl.style.color = "#10b981";
                } else {
                    remainingEl.style.color = "var(--accent-fire)";
                }
            }

            // Progress Ring Logic Removed (Redesign)
            if (this.progressRing) {
                // Keep minimal if element exists to prevent errors, or remove entirely if HTML is gone
            }
        } else {
            // Not fasting
            this.timerEl.textContent = "00:00:00";
            this.statusEl.textContent = "Eating Window";
            if (document.getElementById('timer-remaining')) {
                document.getElementById('timer-remaining').textContent = "--:--:--";
            }
        }
    }

    toggleUI(isFasting) {
        if (isFasting) {
            this.startBtn.classList.add('hidden');
            this.endBtn.classList.remove('hidden');
        } else {
            this.startBtn.classList.remove('hidden');
            this.endBtn.classList.add('hidden');
        }
    }

    formatTime(ms) {
        const totalSecs = Math.floor(ms / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    renderHistory() {
        const list = this.app.userProfile.fastingHistory || [];
        if (!this.historyList) return;

        this.historyList.innerHTML = '';

        if (list.length === 0) {
            this.historyList.innerHTML = '<li class="empty-msg">No completed fasts yet.</li>';
            return;
        }

        // Show last 5
        list.slice(0, 5).forEach(f => {
            const li = document.createElement('li');
            li.className = 'fast-entry';
            // Styling based on success
            li.style.borderLeftColor = f.success ? 'var(--accent-apple)' : 'var(--text-secondary)';

            li.innerHTML = `
                <div>
                    <div style="font-weight: 600; font-size: 0.95rem;">${f.duration}h Fast</div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">${f.date} • ${f.startTime} - ${f.endTime}</div>
                </div>
                <div>
                     ${f.success ? '<i class="fa-solid fa-check-circle" style="color: var(--accent-apple)"></i>' : ''}
                </div>
            `;
            this.historyList.appendChild(li);
        });
    }
}
