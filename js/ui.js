class UIManager {
    constructor(app) {
        this.app = app;
        this.navLinks = document.querySelectorAll('.nav-links li');
        this.sections = document.querySelectorAll('section');
        this.modals = document.querySelectorAll('.modal');
    }

    initListeners() {
        // Hydration Page Buttons
        const waterBtns = document.querySelectorAll('.water-action-btn');
        waterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action; // 'add' or 'remove'
                let amount = parseInt(e.currentTarget.dataset.amount);

                // Fallback for remove button if no amount specified
                if (isNaN(amount)) amount = 250;

                if (action === 'add') {
                    this.app.addWater(amount);
                } else if (action === 'remove') {
                    this.app.removeWater(amount);
                }
            });
        });

        // Navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.navLinks.forEach(l => l.classList.remove('active'));
                const sectionId = link.getAttribute('data-section');
                this.switchSection(sectionId);
            });
        });



        // Dropdown Actions (None in simplified version or kept minimal)
        // Kept minimal to avoid errors if elements missing

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent <a> behavior if used
                e.stopPropagation();
                this.app.logout();
            });
        }

        // Modals
        document.getElementById('add-workout-btn').addEventListener('click', () => {
            document.getElementById('workout-modal').classList.add('active');
        });

        document.getElementById('add-meal-btn').addEventListener('click', () => {
            document.getElementById('meal-modal').classList.add('active');
        });



        // Initialize Data Management Listeners
        this.initDataManagement();

        // Water Controls
        const addWaterBtn = document.getElementById('add-water');
        const removeWaterBtn = document.getElementById('remove-water');

        if (addWaterBtn && removeWaterBtn) {
            addWaterBtn.addEventListener('click', () => window.app.addWater());
            removeWaterBtn.addEventListener('click', () => window.app.removeWater());
        }
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Forms
        document.getElementById('workout-form').addEventListener('submit', (e) => {
            e.preventDefault();
            try {
                const data = {
                    type: document.getElementById('w-type').value,
                    duration: parseFloat(document.getElementById('w-duration').value),
                    param: parseFloat(document.getElementById('w-param').value) || 0,
                    intensity: document.querySelector('input[name="intensity"]:checked').value
                };
                this.app.logWorkout(data);
                this.showNotification('Workout logged!', 'success');
            } catch (err) {
                console.error("Log Workout Failed:", err);
                this.showNotification('Error logging workout', 'error');
            } finally {
                // Always close modal
                document.getElementById('workout-modal').classList.remove('active');
                e.target.reset();
            }
        });

        document.getElementById('meal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            try {
                const data = {
                    name: document.getElementById('m-name').value,
                    calories: parseFloat(document.getElementById('m-calories').value),
                    macros: {
                        p: parseFloat(document.getElementById('m-protein').value) || 0,
                        c: parseFloat(document.getElementById('m-carbs').value) || 0,
                        f: parseFloat(document.getElementById('m-fats').value) || 0
                    }
                };
                this.app.logMeal(data);
                this.showNotification('Meal logged!', 'success');
            } catch (err) {
                console.error("Log Meal Failed:", err);
                this.showNotification('Error logging meal', 'error');
            } finally {
                document.getElementById('meal-modal').classList.remove('active');
                e.target.reset();
            }
        });

        // Smart Nutrition Analysis Listener
        const mNameInput = document.getElementById('m-name');
        if (mNameInput) {
            mNameInput.addEventListener('input', (e) => {
                const query = e.target.value;
                if (query.length > 2) {
                    const result = this.app.calc.analyzeFood(query);

                    // Auto-fill fields if we found a match (confidence > 0.5)
                    if (result.confidence > 0.5) {
                        document.getElementById('m-calories').value = result.calories;
                        document.getElementById('m-protein').value = result.protein;
                        document.getElementById('m-carbs').value = result.carbs;
                        document.getElementById('m-fats').value = result.fats;
                    }
                }
            });
        }

        document.getElementById('goals-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const goals = {
                calories: parseFloat(document.getElementById('goal-calories').value),
                weight: parseFloat(document.getElementById('goal-weight').value),
                currentWeight: parseFloat(document.getElementById('current-weight').value) || 0
            };
            this.app.saveGoals(goals);
        });

        // Profile Dropdown Toggle
        const profileTrigger = document.getElementById('profile-dropdown-trigger');
        if (profileTrigger) {
            profileTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                // Toggle active class
                profileTrigger.classList.toggle('active');
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (profileTrigger.classList.contains('active') && !profileTrigger.contains(e.target)) {
                    profileTrigger.classList.remove('active');
                }
            });
        }

        // Macro Hover Interaction
        const macroContainer = document.querySelector('.macro-ring-container');
        if (macroContainer) {
            macroContainer.style.cursor = 'pointer';
            macroContainer.addEventListener('mouseenter', () => this.showFocusOverlay('macros'));
            macroContainer.addEventListener('mouseleave', () => this.hideFocusOverlay());
        }

        // Workout Bubble Interaction
        ['bubble-active-min', 'bubble-burned-cal'].forEach(id => {
            const bubble = document.getElementById(id);
            if (bubble) {
                bubble.style.cursor = 'pointer';
                bubble.addEventListener('mouseenter', () => this.showFocusOverlay('workouts'));
                bubble.addEventListener('mouseleave', () => this.hideFocusOverlay());
            }
        });

        // Dynamic Input Listeners
        const updateEstimate = () => {
            const type = document.getElementById('w-type').value;
            const duration = parseFloat(document.getElementById('w-duration').value) || 0;
            const param = parseFloat(document.getElementById('w-param').value) || 0;

            if (duration > 0) {
                const result = this.app.calc.estimateBurn({ type, duration, param });
                document.getElementById('w-calories').value = result.calories;

                // Update Intensity Radio
                const radios = document.getElementsByName('intensity');
                radios.forEach(r => {
                    if (r.value === result.intensity) r.checked = true;
                });
            }
        };

        const wInputs = ['w-type', 'w-duration', 'w-param'];
        wInputs.forEach(id => {
            document.getElementById(id).addEventListener('input', updateEstimate);
            document.getElementById(id).addEventListener('change', updateEstimate);
        });

        // Update param label based on type
        document.getElementById('w-type').addEventListener('change', (e) => {
            const label = document.getElementById('w-param-label');
            const type = e.target.value;
            if (type === 'weightlifting') label.textContent = 'Weight (kg)';
            else if (type === 'hiit' || type === 'yoga') label.textContent = 'Difficulty (1-10)';
            else label.textContent = 'Distance (km)';
        });

        // Profile Listeners
        this.setupProfileListeners();

        // Init Focus Overlay
        this.initFocusOverlay();
    }

    switchSection(id) {
        this.sections.forEach(s => {
            s.classList.remove('active-section');
            s.classList.add('hidden-section');
        });
        const target = document.getElementById(id);
        target.classList.remove('hidden-section');
        target.classList.add('active-section');

        // Chart.js Resize Fix for Hidden Charts
        if (id === 'settings' && this.app.charts && this.app.charts.weightChart) {
            setTimeout(() => {
                this.app.charts.weightChart.resize();
                this.app.charts.weightChart.update();
            }, 50);
        }

        // Dashboard Activation (Force Update Main)
        if (id === 'dashboard' && this.app.charts && this.app.charts.mainChart) {
            setTimeout(() => {
                this.app.charts.mainChart.resize();
                if (this.app.updateStats) this.app.updateStats();
            }, 50);
        }

        // Analytics Activation
        if (id === 'analytics' && this.app.charts) {
            this.app.charts.renderAnalytics(
                this.app.workouts,
                this.app.meals,
                this.app.userProfile.history || [],
                this.app.userProfile.water || 0,
                this.app.userProfile.streak || 0
            );

            // Update Fire Streak Value
            const streakVal = document.getElementById('analytics-streak-val');
            if (streakVal) streakVal.textContent = this.app.userProfile.streak || 0;
        }

        // Achievements Activation
        if (id === 'achievements') {
            this.renderBadges(this.app.userProfile.badges, this.app.BADGES_CONFIG || {});
        }

        // Body Tracker Activation (Force Update)
        if (id === 'body-tracker') {
            if (this.app.updateStats) this.app.updateStats();
        }
    }

    updateSummaryIds(burned, consumed, goal) {
        // Animate numbers (simple implementation)
        document.getElementById('dash-burned').textContent = Math.round(burned);
        document.getElementById('dash-consumed').textContent = Math.round(consumed);
        document.getElementById('dash-goal-val').textContent = goal;

        const balance = consumed - burned;
        const balanceEl = document.getElementById('dash-balance');
        balanceEl.textContent = Math.round(balance);

        const msgEl = document.getElementById('balance-msg');
        if (balance > goal + 200) {
            msgEl.textContent = "High Calorie Intake";
            msgEl.style.color = "var(--accent-fire)";
        } else if (balance < goal - 500) {
            msgEl.textContent = "Low Calorie Intake";
            msgEl.style.color = "var(--accent-blue)";
        } else {
            msgEl.textContent = "Perfect Balance";
            msgEl.style.color = "var(--accent-apple)";
        }
    }

    renderWorkout(data) {
        const list = document.getElementById('workout-list');
        const empty = list.querySelector('.empty-state');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'timeline-card';
        item.id = `workout-${data.id}`;

        const index = list.children.length;
        item.style.animationDelay = `${index * 0.1}s`;

        const date = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        item.innerHTML = `
            <div class="timeline-info">
                 <div class="workout-icon-bg">
                    <i class="fa-solid ${data.type.toLowerCase() === 'yoga' ? 'fa-om' : data.type.toLowerCase() === 'cycling' ? 'fa-bicycle' : 'fa-person-running'}"></i>
                </div>
                <div>
                    <h4>${data.type}</h4>
                    <span><i class="fa-regular fa-clock"></i> ${date}</span>
                </div>
            </div>
            <div class="timeline-stat">
                <span class="big-stat">${data.calories} kcal</span>
                <span class="sub-stat">${data.duration} min</span>
            </div>
            <button class="delete-btn" aria-label="Delete" onclick="window.app.removeWorkout(${data.id})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        list.prepend(item);

        this.updateWorkoutHero();
    }

    updateWorkoutHero() {
        const activeMinEl = document.getElementById('today-active-min');
        const calBurnEl = document.getElementById('today-workout-cal');

        if (activeMinEl && calBurnEl && this.app.workouts) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const startOfDayTime = startOfDay.getTime();

            const todayWorkouts = this.app.workouts.filter(w => {
                if (!w.timestamp) return false;
                const wDate = new Date(w.timestamp);
                wDate.setHours(0, 0, 0, 0);
                return wDate.getTime() === startOfDayTime;
            });

            const totalMin = todayWorkouts.reduce((acc, w) => acc + (parseInt(w.duration) || 0), 0);
            const totalCal = todayWorkouts.reduce((acc, w) => acc + (w.calories || 0), 0);

            activeMinEl.innerText = totalMin;
            calBurnEl.innerText = totalCal;
        }
    }

    removeWorkoutElement(id) {
        // ... (existing code, ensure it matches context if using replace_file_content logic properly)
        // Since I'm using replace_file_content with range, I must be careful not to delete this if it's outside.
        // Wait, the instruction is to rewrite renderWorkout/Meal. I will just target them.
        const el = document.getElementById(`workout-${id}`);
        if (el) {
            el.style.transform = 'translateX(100px)';
            el.style.opacity = '0';
            setTimeout(() => {
                el.remove();
                const list = document.getElementById('workout-list');
                if (list.children.length === 0) {
                    list.innerHTML = `
                        <div class="empty-state">
                            <i class="fa-solid fa-person-running"></i>
                            <p>No workouts logged yet</p>
                            <small>Get moving and track your progress!</small>
                        </div>`;
                }
            }, 300);
        }
    }

    renderMeal(data) {
        const list = document.getElementById('meal-list');
        const empty = list.querySelector('.empty-state');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'timeline-card';
        item.id = `meal-${data.id}`;

        const index = list.children.length;
        item.style.animationDelay = `${index * 0.1}s`;

        const date = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const p = data.macros ? data.macros.p : 0;
        const c = data.macros ? data.macros.c : 0;
        const f = data.macros ? data.macros.f : 0;

        item.innerHTML = `
            <div class="timeline-info">
                 <div class="workout-icon-bg" style="background: rgba(16, 185, 129, 0.1); color: var(--accent-apple);">
                    <i class="fa-solid fa-utensils"></i>
                </div>
                <div>
                    <h4>${data.name}</h4>
                    <span>
                        <span class="macro-pill p-pill">P:${p}g</span>
                        <span class="macro-pill c-pill">C:${c}g</span>
                        <span class="macro-pill f-pill">F:${f}g</span>
                    </span>
                </div>
            </div>
             <div class="timeline-stat">
                <span class="big-stat" style="color:#fff;">${data.calories} kcal</span>
                <span class="sub-stat">${date}</span>
            </div>
             <button class="delete-btn" aria-label="Delete" onclick="window.app.removeMeal(${data.id})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        list.prepend(item);

        this.updateNutritionHero();
    }

    updateNutritionHero() {
        const ringP = document.getElementById('ring-protein');
        const ringC = document.getElementById('ring-carbs');
        const ringF = document.getElementById('ring-fats');
        const heroCal = document.getElementById('today-consumed-hero');

        if (heroCal && this.app.meals) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const startOfDayTime = startOfDay.getTime();

            const todayMeals = this.app.meals.filter(m => {
                if (!m.timestamp) return false;
                const mDate = new Date(m.timestamp);
                mDate.setHours(0, 0, 0, 0);
                return mDate.getTime() === startOfDayTime;
            });

            const totals = todayMeals.reduce((acc, m) => {
                acc.cal += (m.calories || 0);
                if (m.macros) {
                    acc.p += (m.macros.p || 0);
                    acc.c += (m.macros.c || 0);
                    acc.f += (m.macros.f || 0);
                }
                return acc;
            }, { cal: 0, p: 0, c: 0, f: 0 });

            heroCal.innerText = totals.cal;

            const totalGrams = totals.p + totals.c + totals.f;
            const pPct = totalGrams ? (totals.p / totalGrams) * 100 : 0;
            const cPct = totalGrams ? (totals.c / totalGrams) * 100 : 0;
            const fPct = totalGrams ? (totals.f / totalGrams) * 100 : 0;

            if (ringP) ringP.style.setProperty('--c', '#ef4444');
            if (ringP) ringP.style.setProperty('--p', pPct);

            if (ringC) ringC.style.setProperty('--c', '#3b82f6');
            if (ringC) ringC.style.setProperty('--p', cPct);

            if (ringF) ringF.style.setProperty('--c', '#eab308');
            if (ringF) ringF.style.setProperty('--p', fPct);
        }
    }


    removeMealElement(id) {
        const el = document.getElementById(`meal-${id}`);
        if (el) {
            el.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => el.remove(), 300);
        }
    }

    showNotification(msg, type = 'success') {
        const container = document.getElementById('notification-container');
        const toast = document.createElement('div');
        toast.className = 'notification-toast';

        let icon = 'fa-check-circle';
        let title = 'Success';

        if (type === 'error') {
            icon = 'fa-exclamation-circle';
            title = 'Error';
            toast.style.borderColor = 'var(--accent-fire)';
        } else if (type === 'override') {
            icon = 'fa-fire-flame-curved';
            title = 'System Override';
            toast.classList.add('override-toast');
        }

        toast.innerHTML = `
            <div class="icon"><i class="fa-solid ${icon}"></i></div>
            <div class="content">
                <h4>${title}</h4>
                <p>${msg}</p>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('closing');
            setTimeout(() => toast.remove(), 400); // Wait for animation
        }, 3000);
    }

    initFocusOverlay() {
        const overlay = document.getElementById('focus-overlay');
        const cards = document.querySelectorAll('.summary-card');
        let macroInterval; // Defined in scope for closure access

        // Local Helper for Overlay
        const getGoal = () => this.app.userProfile.goals; // FIXED: Missing Definition

        const getOverlayStats = () => {
            const statsWorkouts = this.app.workouts || [];
            const statsMeals = this.app.meals || [];
            const today = new Date().toDateString();

            // Overlay shows Today's Stats to match Dashboard
            const todayWorkouts = statsWorkouts.filter(w => new Date(w.timestamp).toDateString() === today);
            const todayMeals = statsMeals.filter(m => new Date(m.timestamp).toDateString() === today);

            const burned = todayWorkouts.reduce((acc, w) => acc + w.calories, 0);
            const consumed = todayMeals.reduce((acc, m) => acc + m.calories, 0);
            return { burned, consumed };
        };

        const updateOverlay = (type) => {
            const goals = getGoal();
            const { burned, consumed } = getOverlayStats();

            const els = {
                icon: document.getElementById('focus-icon'),
                title: document.getElementById('focus-title'),
                val: document.getElementById('focus-value'),
                unit: document.getElementById('focus-unit'),
                suggTitle: document.getElementById('focus-suggestion-title'),
                suggText: document.getElementById('focus-suggestion-text'),
                items: document.getElementById('focus-action-items'),
                card: overlay.querySelector('.focus-card')
            };

            // Reset Classes
            els.card.className = 'focus-card'; // clear colors
            els.items.innerHTML = '';

            if (type === 'fire') {
                // BURNED LOGIC
                els.card.classList.add('fire');
                els.icon.className = 'fa-solid fa-fire';
                els.title.innerText = 'Calories Burned';
                els.val.innerText = Math.round(burned);
                els.unit.innerText = 'kcal';

                // Suggestions
                // Simple heuristic: Goal is usually net 0? Or user wants to burn X?
                // Let's assume daily burn goal is roughly 500-1000 active cals or just specific goal
                // User requirement: "suggest exercise to be done"
                // Interactive Math: 
                const targetBurn = Math.max(300, Math.round(goals.calories * 0.3));
                const remaining = Math.max(0, targetBurn - burned);

                els.suggTitle.innerText = `Suggested Active Target: ${targetBurn} kcal`;
                if (remaining > 0) {
                    // "You've set a target of [UserGoal] Kcal, so I'm suggesting you to still burn [RemainingBurn] Kcal"
                    els.suggText.innerHTML = `You've set a target of <strong>${goals.calories} kcal</strong>, so I'm suggesting you to still burn <strong>${remaining} kcal</strong>.`;

                    // Suggest Workouts
                    const suggestions = [
                        { text: 'Running (30m)', cal: 300 },
                        { text: 'HIIT (20m)', cal: 250 },
                        { text: 'Walking (45m)', cal: 150 }
                    ];
                    suggestions.forEach(s => {
                        els.items.innerHTML += `<div class="pill">${s.text} ~ ${s.cal}kcal</div>`;
                    });

                } else {
                    els.suggText.innerText = "Fantastic! You've hit your burn target.";
                    els.items.innerHTML = '<div class="pill">Rest & Recover</div>';
                }

            } else if (type === 'apple') {
                // CONSUMED LOGIC
                els.card.classList.add('apple');
                els.icon.className = 'fa-solid fa-utensils';
                els.title.innerText = 'Calories Consumed';
                els.val.innerText = Math.round(consumed);
                els.unit.innerText = `/ ${goals.calories} kcal`;

                const remaining = Math.max(0, goals.calories - consumed);

                els.suggTitle.innerText = "Fuel Status";
                if (remaining > 0) {
                    els.suggText.innerHTML = `You have <strong>${remaining} kcal</strong> remaining today.`;
                    // Suggest Meals
                    const suggestions = [
                        { text: 'Grilled Chicken Salad', cal: 450 },
                        { text: 'Oatmeal Bowl', cal: 300 },
                        { text: 'Protein Shake', cal: 150 }
                    ];
                    // Filter based on remaining size
                    const relevant = suggestions.filter(s => s.cal <= remaining + 100);

                    if (relevant.length) {
                        relevant.forEach(s => els.items.innerHTML += `<div class="pill">${s.text}</div>`);
                    } else {
                        els.items.innerHTML = `<div class="pill">Small Snack</div>`;
                    }

                } else {
                    els.suggText.innerText = "You've met your calorie goal for today.";
                    els.items.innerHTML = '<div class="pill">Stay Hydrated</div>';
                }

            } else if (type === 'water') {
                // WATER LOGIC
                els.card.classList.add('water');
                els.icon.className = 'fa-solid fa-glass-water';
                els.title.innerText = 'Hydration Level';

                const stats = this.app.userProfile.water || 0;
                const goal = 5000;

                // FIXED Format: Show target as requested "/5000ml" - Force Color to override parent gradients
                els.val.innerHTML = `${stats}<span style="font-size: 0.5em; opacity: 1; margin-left: 6px; -webkit-text-fill-color: rgba(255,255,255,0.6); color: rgba(255,255,255,0.6);">/5000ml</span>`;
                els.unit.innerText = ''; // Clear external unit since it is inside val
                els.unit.innerText = ''; // Clear unit since it's in val now

                const remaining = Math.max(0, goal - stats);

                els.suggTitle.innerText = "Hydration Status";
                if (stats >= goal) {
                    els.suggText.innerText = "You are fully hydrated! Great job.";
                    els.items.innerHTML = '<div class="pill">Keep it up</div>';
                } else {
                    els.suggText.innerHTML = `You need <strong>${remaining} ml</strong> more to reach your daily goal.`;
                    els.items.innerHTML = '<div class="pill">Drink Water</div><div class="pill">Herbal Tea</div>';
                }

            } else if (type === 'balance') {
                // BALANCE LOGIC
                els.card.classList.add('balance');
                els.icon.className = 'fa-solid fa-scale-balanced';
                els.title.innerText = 'Net Balance';
                const net = consumed - burned;
                els.val.innerText = Math.round(net);
                els.unit.innerText = 'kcal'; // Explicit unit

                const diff = net - goals.calories;

                if (Math.abs(diff) < 200) {
                    els.suggTitle.innerText = "Perfectly Balanced";
                    els.suggText.innerText = "You are right on track with your goals.";
                } else if (diff < 0) {
                    els.suggTitle.innerText = "Calorie Deficit";
                    els.suggText.innerHTML = `You are <strong>${Math.abs(diff)} kcal</strong> under your maintenance goal.`;
                } else {
                    els.suggTitle.innerText = "Calorie Surplus";
                    els.suggText.innerHTML = `You are <strong>${diff} kcal</strong> over. Consider a light walk.`;
                }

            } else if (type === 'macros') {
                // MACRO SLIDESHOW LOGIC
                // 1. Calculate Data (Today Only)
                const meals = this.app.meals || [];

                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const startOfDayTime = startOfDay.getTime();

                const todayMeals = meals.filter(m => {
                    if (!m.timestamp) return false;
                    const mDate = new Date(m.timestamp);
                    mDate.setHours(0, 0, 0, 0);
                    return mDate.getTime() === startOfDayTime;
                });

                const totals = todayMeals.reduce((acc, m) => {
                    if (m.macros) {
                        acc.p += (m.macros.p || 0);
                        acc.c += (m.macros.c || 0);
                        acc.f += (m.macros.f || 0);
                    }
                    return acc;
                }, { p: 0, c: 0, f: 0 });

                // 2. Define Slides
                const slides = [
                    {
                        title: 'Protein',
                        val: Math.round(totals.p),
                        unit: 'g',
                        class: 'fire', // Recycled class for color (Red/Orange)
                        icon: 'fa-solid fa-drumstick-bite',
                        msg: 'Essential for muscle repair.',
                        pill: 'High Protein'
                    },
                    {
                        title: 'Carbs',
                        val: Math.round(totals.c),
                        unit: 'g',
                        class: 'apple', // Green/Blue
                        icon: 'fa-solid fa-wheat-awn',
                        msg: 'Your primary energy source.',
                        pill: 'Complex Carbs'
                    },
                    {
                        title: 'Fats',
                        val: Math.round(totals.f),
                        unit: 'g',
                        class: 'balance', // Purple
                        icon: 'fa-solid fa-droplet',
                        msg: 'Vital for hormonal health.',
                        pill: 'Healthy Fats'
                    }
                ];

                let slideIndex = 0;

                // Function to render slide
                const showSlide = (idx) => {
                    const s = slides[idx];

                    // Retain Base Card classes but switch theme
                    els.card.className = `focus-card ${s.class}`;

                    // Animate Out? (Maybe too complex, just swap)
                    els.icon.className = s.icon;
                    els.title.innerText = s.title;

                    // Value & Unit
                    els.val.innerHTML = `${s.val}`;
                    els.unit.innerText = s.unit;

                    els.suggTitle.innerText = "Macro Impact";
                    els.suggText.innerText = s.msg;
                    els.items.innerHTML = `<div class="pill">${s.pill}</div>`;
                };

                // Show First
                showSlide(0);

                // Start Interval
                if (macroInterval) clearInterval(macroInterval);
                macroInterval = setInterval(() => {
                    slideIndex = (slideIndex + 1) % slides.length;
                    showSlide(slideIndex);
                }, 2000); // 2 seconds per slide
            } else if (type === 'workouts') {
                // WORKOUT SLIDESHOW LOGIC
                els.card.className = 'focus-card fire';
                els.icon.className = 'fa-solid fa-person-running';

                // 1. Get Today's Workouts
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const startOfDayTime = startOfDay.getTime();

                const workouts = (this.app.workouts || []).filter(w => {
                    if (!w.timestamp) return false;
                    const wDate = new Date(w.timestamp);
                    wDate.setHours(0, 0, 0, 0);
                    return wDate.getTime() === startOfDayTime;
                });

                if (workouts.length === 0) {
                    els.title.innerText = 'Log Activity';
                    els.val.innerText = '0';
                    els.unit.innerText = 'min';
                    els.suggTitle.innerText = "Get Moving!";
                    els.suggText.innerText = "No activities logged today yet.";
                    els.items.innerHTML = '<div class="pill">Start Now</div>';
                    return;
                }

                // 2. Aggregate by Type
                // Group: { 'running': { min: 30, cal: 200, count: 1 } }
                const groups = workouts.reduce((acc, w) => {
                    const t = w.type || 'Activity';
                    if (!acc[t]) acc[t] = { min: 0, cal: 0, count: 0 };
                    acc[t].min += (w.duration || 0);
                    acc[t].cal += (w.calories || 0);
                    acc[t].count++;
                    return acc;
                }, {});

                const types = Object.keys(groups);

                // If only 1 type, just show it static
                // If multiple, slideshow

                const slides = types.map(t => ({
                    title: t.charAt(0).toUpperCase() + t.slice(1),
                    val: groups[t].min,
                    unit: 'min',
                    msg: `Burned ${Math.round(groups[t].cal)} kcal across ${groups[t].count} sessions.`,
                    pill: `${Math.round(groups[t].cal / groups[t].min * 10) / 10} cal/min`
                }));

                let slideIndex = 0;

                const showSlide = (idx) => {
                    const s = slides[idx];
                    els.title.innerText = s.title;
                    els.val.innerHTML = `${Math.round(s.val)}`;
                    els.unit.innerText = s.unit;
                    els.suggTitle.innerText = "Activity Breakdown";
                    els.suggText.innerText = s.msg;
                    els.items.innerHTML = `<div class="pill">${s.pill}</div>`;
                };

                showSlide(0);

                if (slides.length > 1) {
                    if (macroInterval) clearInterval(macroInterval);
                    macroInterval = setInterval(() => {
                        slideIndex = (slideIndex + 1) % slides.length;
                        showSlide(slideIndex);
                    }, 2500);
                }
            }
        };

        // Expose Public API for Hover Interactions
        this.showFocusOverlay = (type) => {
            updateOverlay(type);
            overlay.classList.add('active');
        };

        this.hideFocusOverlay = () => {
            overlay.classList.remove('active');
            if (macroInterval) clearInterval(macroInterval);
        };



        // --- Event Listeners for Summary Cards ---
        let hoverTimeout;

        const openOverlayWithDelay = (type) => {
            clearTimeout(hoverTimeout); // Cancel any pending close
            updateOverlay(type);
            overlay.classList.add('active'); // Actually 'overlay' variable IS available in closure.
        };

        const closeOverlayWithDelay = () => {
            hoverTimeout = setTimeout(() => {
                overlay.classList.remove('active');
            }, 100); // Small buffer
        };

        cards.forEach((card, index) => {
            card.style.cursor = 'default';

            card.onmouseenter = () => {
                let type = 'fire';
                if (index === 1) type = 'apple';
                if (index === 2) type = 'balance';
                if (index === 3 || card.classList.contains('water')) type = 'water';

                // Cancel close timer if exists
                clearTimeout(hoverTimeout);

                // Slight delay to open? Or immediate? User wants "smooth".
                // Immediate open is usually better, but close needs delay.
                updateOverlay(type);
                overlay.classList.add('active');
            };

            card.onmouseleave = () => {
                closeOverlayWithDelay();
            };
        });

        // Loophole: If user moves from Card -> Overlay?
        // If overlay has pointer-events: none, we can't hover it.
        // User just wants to see it. 
        // 100ms delay helps with jitter.

        // --- NEW: Macro Chart Overlay (Slideshow) ---
        const macroCard = document.querySelector('.chart-card.small');

        // Note: macroInterval is defined at the top of initFocusOverlay to allow closure access.

        if (macroCard) {
            macroCard.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                updateOverlay('macros');
                overlay.classList.add('active');
            });
            macroCard.addEventListener('mouseleave', () => {
                closeOverlayWithDelay();
                if (macroInterval) clearInterval(macroInterval);
            });
        }
    }

    // --- Profile UI Updates ---
    updateProfileUI(profile) {
        if (!profile) return;

        // Update Meta Logic
        const lvlEl = document.getElementById('profile-level-display');
        if (lvlEl) lvlEl.innerText = profile.level || 1;

        // Update Name Display (Profile Card & Header)
        const nameEl = document.getElementById('profile-name-display');
        if (nameEl) nameEl.innerText = profile.displayName || 'User';

        const headerNameEl = document.getElementById('user-name');
        if (headerNameEl) headerNameEl.innerText = profile.displayName || 'User';

        const headerNameInput = document.getElementById('input-display-name');
        if (headerNameInput) headerNameInput.value = profile.displayName || '';

        const curWeightEl = document.getElementById('current-weight');
        if (curWeightEl && profile.goals) curWeightEl.value = profile.goals.currentWeight || 0;

        const goalWeightEl = document.getElementById('goal-weight');
        if (goalWeightEl && profile.goals) goalWeightEl.value = profile.goals.weight || 70;

        const goalCalEl = document.getElementById('goal-calories');
        if (goalCalEl && profile.goals) goalCalEl.value = profile.goals.calories || 2000;

        // Member Since
        const dateEl = document.getElementById('profile-join-date');
        if (dateEl && profile.joinDate) {
            try {
                const date = new Date(profile.joinDate);
                const year = date.getFullYear();
                const month = date.toLocaleString('default', { month: 'short' });
                dateEl.innerText = `Member since ${month} ${year}`;
            } catch (e) {
                dateEl.innerText = `Member since 2024`;
            }
        }
    }

    // Profile Listeners Implementation
    setupProfileListeners() {
        const toggleBtn = document.getElementById('btn-toggle-edit-name');
        const saveBtn = document.getElementById('btn-save-name');
        const panel = document.getElementById('edit-name-panel');
        const input = document.getElementById('input-display-name');

        if (toggleBtn && panel) {
            toggleBtn.addEventListener('click', () => {
                panel.classList.toggle('hidden');
                const isHidden = panel.classList.contains('hidden');
                toggleBtn.innerHTML = isHidden ? '<i class="fa-solid fa-pen-to-square"></i> Edit Name' : '<i class="fa-solid fa-times"></i> Cancel';
                if (!isHidden && input) input.focus();
            });
        }

        if (saveBtn && input) {
            saveBtn.addEventListener('click', () => {
                const newName = input.value.trim();
                if (newName) {
                    this.app.userProfile.displayName = newName;
                    if (this.app.storage) {
                        this.app.storage.save('userProfile', this.app.userProfile);
                    }
                    this.updateProfileUI(this.app.userProfile);

                    // Reset UI
                    panel.classList.add('hidden');
                    toggleBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Name';
                    this.showNotification('Name updated!');
                }
            });
        }
    }

    renderRecommendations(tips) {
        // ... (existing code, keeping it safe)
        const container = document.getElementById('recommendations');
        if (!container) return; // safety
        container.innerHTML = '';
        tips.forEach(tip => {
            const el = document.createElement('div');
            el.className = `recommendation-card ${tip.type}`;
            el.innerHTML = `
                <div class="icon"><i class="fa-solid ${tip.icon}"></i></div>
                <div class="content">
                    <h4>${tip.title}</h4>
                    <p>${tip.message}</p>
                </div>
            `;
            container.appendChild(el);
        });
    }

    renderGoalHistory(history) {
        const container = document.getElementById('goal-history-list');
        if (!container) return;

        if (!history || history.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary); background: rgba(255,255,255,0.02); border-radius: 12px;">No history data found.</div>';
            return;
        }

        container.innerHTML = '';
        history.forEach((item, index) => {
            const div = document.createElement('div');
            // Premium Card Style
            div.style.cssText = `
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
                border: 1px solid rgba(255,255,255,0.08);
                padding: 1.5rem;
                border-radius: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: transform 0.2s;
                position: relative;
                overflow: hidden;
            `;

            if (index === 0) div.style.borderLeft = '4px solid var(--primary)'; // Current visual indicator

            // Parse Date
            const dateStr = item.date.split(',')[0];
            const timeStr = item.date.split(',')[1] || '';

            div.innerHTML = `
                <div class="hist-left">
                    <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                        <i class="fa-regular fa-calendar-check" style="margin-right: 6px;"></i> ${dateStr}
                    </div>
                    <div style="font-size: 1.1rem; color: white; font-family: 'Outfit', sans-serif;">
                        ${timeStr}
                    </div>
                </div>
                
                <div class="hist-right" style="text-align: right;">
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">Target Goal</div>
                    <div style="font-size: 1.4rem; color: var(--primary); font-weight: 700;">
                        ${item.calories} <span style="font-size: 0.9rem; color: var(--text-secondary); font-weight: 400;">kcal</span>
                    </div>
                    ${item.weight ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">Target Weight: ${item.weight} kg</div>` : ''}
                </div>
            `;
            container.appendChild(div);
        });
    }



    updateWaterUI(vol) {
        // 1. Dashboard Card
        const countEl = document.getElementById('water-count');
        const waves = document.querySelectorAll('.wave');
        const target = 5000;

        if (countEl) {
            // User Requested Format: "1500/5000ml"
            countEl.innerHTML = `${vol}<span style="font-size: 0.6em; font-weight: 400; opacity: 0.7; margin-left: 4px;">/ ${target}ml</span>`;

            // Animate Wave Height (Max 5000ml for full height visualization)
            const percentage = Math.min(100, Math.max(10, (vol / target) * 100));
            waves.forEach(wave => {
                wave.parentElement.style.height = `${percentage}%`;
            });
        }

        // 2. Hydration Page (Dedicated Section)
        const fillEl = document.getElementById('water-fill-level');
        const glassValEl = document.getElementById('hydration-glass-val');

        if (fillEl && glassValEl) {
            const percentage = Math.min(100, (vol / target) * 100);

            // Update Fill Height
            fillEl.style.height = `${percentage}%`;

            // Update Text
            glassValEl.textContent = `${vol} / ${target}ml`;
        }
    }

    updateDashboard(burned, consumed, goal) {
        // Direct assignment from arguments
        const burnedEl = document.getElementById('dash-burned');
        const consumedEl = document.getElementById('dash-consumed');
        const balanceEl = document.getElementById('dash-balance');
        const goalEl = document.getElementById('dash-goal-val');
        const msgEl = document.getElementById('balance-msg');

        this.animateValue(burnedEl, burned, 1000);
        this.animateValue(consumedEl, consumed, 1000);
        if (goalEl) goalEl.textContent = goal; // Goal usually static, no need to animate every time

        if (balanceEl) {
            const net = consumed - burned;
            this.animateValue(balanceEl, net, 1000);

            let msg = "Balanced";
            let color = "var(--text-secondary)";

            if (net < 0) {
                msg = "Calorie Deficit";
                color = "var(--accent-fire)";
            } else if (net > 0 && net < 500) {
                msg = "Perfect Balance";
                color = "var(--accent-apple)";
            } else if (net >= 500) {
                msg = "High Calorie Intake";
                color = "#fbbf24";
            }

            if (msgEl) {
                msgEl.textContent = msg;
                msgEl.style.color = color;
                // Add pulse animation
                msgEl.classList.remove('pulse-anim');
                void msgEl.offsetWidth; // Trigger reflow
                msgEl.classList.add('pulse-anim');
            }
        }
    }

    animateValue(obj, end, duration) {
        if (!obj) return;

        let start = parseInt(obj.textContent.replace(/,/g, '')) || 0;
        if (isNaN(start)) start = 0;

        // If difference is small, just set it
        if (start === end) return;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // EaseOutExpo or similar? Let's use simple generic easing or linear
            // Math.floor(progress * (end - start) + start)

            const current = Math.floor(progress * (end - start) + start);
            obj.textContent = current;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.textContent = end;
            }
        };
        window.requestAnimationFrame(step);
    }

    updateStreakUI(streak) {
        const el = document.getElementById('streak-val');
        if (el) {
            el.textContent = streak;
            // Pulse animation for engagement
            const container = el.closest('.streak-container');
            if (container) {
                container.style.transform = "scale(1.1)";
                setTimeout(() => container.style.transform = "scale(1)", 200);
            }
        }
    }


    renderBadges(userBadges, config) {
        const earnedShelf = document.getElementById('earned-shelf');
        const unearnedGrid = document.getElementById('unearned-grid');

        // Safety check
        if (!earnedShelf || !unearnedGrid) return;

        earnedShelf.innerHTML = '';
        unearnedGrid.innerHTML = '';

        if (!userBadges) userBadges = [];

        Object.entries(config).forEach(([id, badge]) => {
            const isUnlocked = userBadges.includes(id);
            const card = document.createElement('div');
            card.className = `badge-card ${isUnlocked ? 'unlocked' : 'locked'}`;

            card.innerHTML = `
                <div class="badge-visual">
                    <i class="fa-solid ${badge.icon} badge-icon" style="color: ${isUnlocked ? '#fff' : '#94a3b8'};"></i>
                </div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.desc}</div>
            `;

            if (isUnlocked) {
                earnedShelf.appendChild(card);
            } else {
                unearnedGrid.appendChild(card);
            }

            // Cinematic Hover
            card.addEventListener('mouseenter', () => {
                const spotlight = document.getElementById('badge-spotlight');
                const sStatus = document.getElementById('spot-status');
                const sTitle = document.getElementById('spot-title');
                const sDesc = document.getElementById('spot-desc');
                const sIcon = document.getElementById('spot-icon');

                if (spotlight && sStatus && sTitle && sDesc && sIcon) {
                    sTitle.textContent = badge.name;
                    sIcon.className = `fa-solid ${badge.icon}`;

                    if (isUnlocked) {
                        spotlight.classList.remove('locked-mode'); // Ensure clean state
                        spotlight.classList.add('visible');
                        sStatus.textContent = 'Congratulations!';
                        sDesc.textContent = `You earned this badge: ${badge.desc}`;
                        sIcon.style.color = badge.color || '#fbbf24';
                    } else {
                        spotlight.classList.add('locked-mode');
                        spotlight.classList.add('visible');
                        sStatus.textContent = 'Locked Achievement';
                        sDesc.textContent = `How to unlock: ${badge.desc}`;
                        sIcon.style.color = '#94a3b8';
                    }
                }
            });

            card.addEventListener('mouseleave', () => {
                const spotlight = document.getElementById('badge-spotlight');
                if (spotlight) {
                    spotlight.classList.remove('visible');
                    // We don't need to add 'hidden' because CSS handles default state as invisible
                }
            });
        });
    }

    showBadgeNotification(badge) {
        // Create an overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.backdropFilter = 'blur(5px)';
        overlay.style.animation = 'fadeIn 0.3s ease';
        overlay.style.cursor = 'pointer';

        overlay.innerHTML = `
            <div style="background: var(--card-bg); border: 2px solid #fbbf24; padding: 2.5rem; border-radius: 20px; text-align: center; max-width: 90%; width: 400px; animation: unlock-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 0 50px rgba(251, 191, 36, 0.5); cursor: default;">
                <div style="font-size: 5rem; margin-bottom: 1rem; color: #fbbf24; filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.5));">
                    <i class="fa-solid fa-trophy"></i>
                </div>
                <h2 style="font-size: 2rem; margin-bottom: 0.5rem; background: linear-gradient(to right, #fbbf24, #f59e0b); -webkit-background-clip: text; background-clip: text; color: transparent;">Badge Unlocked!</h2>
                <h3 style="color: #f8fafc; margin-bottom: 0.5rem;">${badge.name}</h3>
                <p style="color: #94a3b8; margin-bottom: 2rem;">${badge.desc}</p>
                <button id="close-badge-modal" style="background: #fbbf24; color: #000; border: none; padding: 0.8rem 2rem; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 1rem; transition: transform 0.2s;">
                    Awesome!
                </button>
                <div style="margin-top: 1rem; font-size: 0.8rem; color: #64748b;">(Click anywhere to close)</div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Confetti? Using the existing confetti if defined or just visual
        // Assuming user has canvas-confetti from previous steps or similar? 
        // We added confetti-js earlier for Level Up.
        if (window.confetti) {
            window.confetti({ zIndex: 10000, particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }

        const close = () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        };

        document.getElementById('close-badge-modal').onclick = (e) => {
            e.stopPropagation();
            close();
        };

        overlay.onclick = close;
    }



    // --- Holo-Body Tracker Logic ---
    renderBodyTracker(burned, consumed, goal) {
        const fluidRect = document.getElementById('fluid-fill');
        const calDisplay = document.getElementById('holo-cal-display');
        const svgContainer = document.getElementById('holo-body-svg');

        if (!fluidRect || !goal) return;

        const net = Math.max(0, consumed - burned);
        const percentage = Math.min(1, net / goal);

        // SVG Metrics Corrected for Feet position
        const startY = 310;
        const maxFluidHeight = 300;

        const currentHeight = maxFluidHeight * percentage;
        const currentY = startY - currentHeight;

        // Update SVG
        fluidRect.setAttribute('height', currentHeight);
        fluidRect.setAttribute('y', currentY);

        // Update Text
        if (calDisplay) {
            calDisplay.innerHTML = `${Math.round(net)} / ${goal}`;
        }

        // Store for Tooltip separate logic
        this.lastNet = net;

        // --- Interaction & Heatmap ---
        if (!this.muscleInitialized) {
            this.initMuscleInteractions();
            this.muscleInitialized = true;
        }

        if (this.app.userProfile.muscleHeat) {
            this.updateHeatmap(this.app.userProfile.muscleHeat);
        }

        // --- Refined Hover Logic (4s/4s) ---
        if (svgContainer && !svgContainer.dataset.refined) {
            svgContainer.dataset.refined = "true";

            svgContainer.onmouseenter = () => {
                svgContainer.classList.add('heatmap-mode');
                this.updateHoloLabelsNew('schedule'); // Show Schedule initially

                this.hoverTimer = setTimeout(() => {
                    this.updateHoloLabelsNew('stats'); // Switch to Stats after 4s
                }, 4000);
            };

            svgContainer.onmouseleave = () => {
                svgContainer.classList.remove('heatmap-mode');
                if (this.hoverTimer) clearTimeout(this.hoverTimer);
                this.updateHoloLabelsNew('reset'); // Returns to only today's schedule
            };
        }

        // Update Vital Stats HUD (Phase 7)
        if (this.app && this.app.userProfile) {
            this.renderBodyHUD(this.app.userProfile);
        } else {
            this.renderBodyHUD({});
        }
    }

    updateHeatmap(muscleHeat) {
        if (!muscleHeat) return;
        const groups = document.querySelectorAll('.muscle-group');
        groups.forEach(group => {
            const muscle = group.dataset.muscle;
            const intensity = muscleHeat[muscle] || 0;

            if (intensity > 0) {
                group.classList.add('active-heat');
                const blur = (intensity / 100) * 12;
                const opacity = 0.1 + (intensity / 100) * 0.5;

                group.style.setProperty('--heat-blur', `${blur}px`);
                group.style.setProperty('--heat-glow', `rgba(255, 79, 79, ${intensity / 100})`);
                group.style.setProperty('--heat-color', `rgba(255, 79, 79, ${opacity})`);
            } else {
                group.classList.remove('active-heat');
                group.style.removeProperty('--heat-color');
                group.style.removeProperty('--heat-glow');
                group.style.setProperty('--heat-blur', '0px');
            }
        });
    }

    initMuscleInteractions() {
        const groups = document.querySelectorAll('.muscle-group');
        groups.forEach(group => {
            group.addEventListener('click', (e) => {
                e.stopPropagation();
                const muscle = group.dataset.muscle;
                this.showMuscleQuickLog(muscle);
            });
        });
    }

    showMuscleQuickLog(muscle) {
        const modal = document.getElementById('log-workout-modal');
        if (modal) {
            // Pre-fill muscle data and open existing modal
            const typeInput = document.getElementById('workout-type');
            if (typeInput) typeInput.value = `${muscle} Training`;

            // We could also add a custom field or hidden data
            this.showModal('log-workout-modal');
            this.showNotification(`Targeting ${muscle} - Ready to log!`, 'info');
        } else {
            // Fallback to prompt if modal missing (unlikely but safe)
            const cals = prompt(`Quick log: How many calories did you burn training ${muscle}?`, "200");
            if (cals) {
                this.app.logWorkout({
                    type: `${muscle} Training`,
                    targetMuscle: muscle,
                    calories: parseInt(cals) || 200
                });
            }
        }
    }

    updateHoloLabels() {
        const labelEl = document.getElementById('label-active');
        if (!labelEl) return;

        const date = new Date();
        const day = date.getDay(); // 0=Sun, 1=Mon... 6=Sat
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const schedule = {
            0: { text: "Rest & Stretch", pos: { top: "25%", left: "60%" } },
            1: { text: "Chest Day", pos: { top: "25%", left: "70%" } },
            2: { text: "Back & Biceps", pos: { top: "30%", left: "20%" } },
            3: { text: "Leg Day", pos: { top: "60%", left: "70%" } },
            4: { text: "Arms & Shoulders", pos: { top: "25%", left: "70%" } },
            5: { text: "Cardio", pos: { top: "40%", left: "60%" } },
            6: { text: "Leg Day", pos: { top: "60%", left: "70%" } }
        };

        const config = schedule[day];

        // Update DOM
        const span = labelEl.querySelector('span');
        // Explicitly show Day Name to prove dynamic logic
        if (span) span.innerText = `${days[day]}: ${config.text}`;

        labelEl.style.top = config.pos.top;
        labelEl.style.left = config.pos.left;
        labelEl.classList.remove('hidden');
    }

    updateXPUI(level, xp) {
        // Update Sidebar
        const lvlEl = document.getElementById('user-level');
        const xpEl = document.getElementById('user-xp');
        const barEl = document.getElementById('xp-bar-fill');

        /* Debugging Gamification */
        console.log(`Gamification Update -> Level: ${level}, XP: ${xp}`);

        if (lvlEl) lvlEl.textContent = level; // Just the number
        if (xpEl) xpEl.textContent = xp;

        if (barEl) {
            // Threshold is level * 100.
            // Avoid divide by zero if level somehow is 0 (shouldn't happen but safety first)
            const threshold = (level && level > 0) ? level * 100 : 100;

            const rawPercent = (xp / threshold) * 100;
            const percent = Math.min(100, Math.max(0, rawPercent));

            console.log(`Gamification Bar -> Threshold: ${threshold}, Percent: ${percent}%`);

            barEl.style.width = `${percent}%`;

            // Update Percentage Text
            const percentEl = document.getElementById('xp-percent');
            if (percentEl) {
                percentEl.textContent = `(${Math.round(percent)}%)`;
            }

            // Optional: If user wants to see the % text, we can append it or use a tooltip
            barEl.title = `${Math.round(100 - percent)}% to Level ${level + 1}`;
        }
    }


    initDataManagement() {
        const csvBtn = document.getElementById('btn-export-csv');
        const pdfBtn = document.getElementById('btn-export-pdf');
        const resetBtn = document.getElementById('btn-reset-data');

        if (csvBtn) {
            csvBtn.addEventListener('click', () => {
                this.app.storage.exportToCSV(this.app.workouts, this.app.meals);
                this.showNotification('CSV Log Exported!');
            });
        }

        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => {
                this.showNotification('Generating PDF...');
                this.app.storage.exportChartsToPDF().then(() => {
                    this.showNotification('PDF Charts Exported!', 'success');
                });
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm("⚠ DANGER ZONE ⚠\n\nAre you sure you want to delete ALL data? This cannot be undone.")) {
                    if (confirm("Final Warning: This will wipe your profile, workouts, and history.")) {
                        this.app.storage.clearAll();
                    }
                }
            });
        }

        // Initialize Bio-Metrics Form Logic (Phase 8)
        this.initBioForm();
    }

    renderBodyHUD(profile) {
        const panels = document.querySelectorAll('.hud-panel');
        const form = document.getElementById('bio-input-overlay');

        // Check if Profile is "Complete" (simple check)
        const isProfileComplete = profile && profile.weight && profile.height && profile.age;

        if (!isProfileComplete) {
            // Show Form, Hide HUD
            if (form) {
                form.classList.remove('hidden-panel');
                form.style.display = 'flex'; // Ensure visibility
            }
            panels.forEach(p => p.classList.add('hidden-panel'));
            return; // Stop rendering
        }

        // Hide Form, Show HUD
        if (form) {
            form.classList.add('hidden-panel');
            form.style.display = 'none'; // Force hide
        }
        panels.forEach(p => p.classList.remove('hidden-panel'));

        // Defaults (Safety fallback)
        const height = profile.height || 175;
        const weight = profile.weight || 70;
        const age = profile.age || 25;
        const gender = profile.gender || 'male';

        // 1. BMI Calculation
        const heightM = height / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);

        let bmiCat = 'Normal';
        if (bmi < 18.5) bmiCat = 'Underweight';
        else if (bmi >= 25 && bmi < 29.9) bmiCat = 'Overweight';
        else if (bmi >= 30) bmiCat = 'Obese';

        // 2. BMR Calculation (Mifflin-St Jeor)
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr += (gender === 'male' ? 5 : -161);
        bmr = Math.round(bmr);

        // 3. TDEE Sync (Total = BMR + Active Burn)
        const activeBurn = (this.app && this.app.todayStats) ? (this.app.todayStats.burned || 0) : 0;
        const tdee = bmr + activeBurn;

        // 4. Update DOM
        const els = {
            bmi: document.getElementById('hud-bmi'),
            bmiCat: document.getElementById('hud-bmi-cat'),
            weight: document.getElementById('hud-weight'),
            bmr: document.getElementById('hud-bmr'),
            tdee: document.getElementById('hud-tdee')
        };

        if (els.bmi) els.bmi.textContent = bmi;
        if (els.bmiCat) els.bmiCat.textContent = bmiCat;
        if (els.weight) els.weight.textContent = weight;
        if (els.bmr) els.bmr.textContent = bmr;
        if (els.tdee) els.tdee.textContent = tdee;
    }

    initBioForm() {
        console.log("initBioForm Called");
        const btn = document.getElementById('btn-activate-hud');
        if (!btn) {
            console.error("Activate Button NOT FOUND in DOM");
            return;
        }

        // Prevent multiple listeners
        if (btn.dataset.listening) {
            console.log("BioForm listener already attached - Skipping");
            return;
        }
        btn.dataset.listening = "true";

        console.log("Attaching CLICK listener to Activate Button");
        const handleClick = (e) => {
            e.preventDefault();
            console.log("Activate Button CLICKED");
            // alert("System Activating..."); // Visual Feedback for User

            const age = parseInt(document.getElementById('bio-age').value);
            const gender = document.getElementById('bio-gender').value;
            const height = parseInt(document.getElementById('bio-height').value);
            const weight = parseInt(document.getElementById('bio-weight').value);

            console.log("Inputs Captured:", { age, gender, height, weight });

            if (age && height && weight) {
                // Update Profile
                if (!this.app.userProfile) this.app.userProfile = {};

                this.app.userProfile.age = age;
                this.app.userProfile.gender = gender;
                this.app.userProfile.height = height;
                this.app.userProfile.weight = weight;

                // Save Persistence
                console.log("Saving Profile...", this.app.userProfile);
                this.app.storage.save('userProfile', this.app.userProfile);

                // Render HUD
                this.renderBodyHUD(this.app.userProfile);
                this.showNotification("Bio-Core Activated!", "success");
            } else {
                console.warn("Validation Failed: Missing required fields");
                this.showNotification("Please fill all Bio-Metrics.", "error");
            }
        };

        btn.addEventListener('click', handleClick);

        // Edit Button Logic (Phase 9)
        const editBtn = document.getElementById('btn-edit-bio');
        if (editBtn && !editBtn.dataset.listening) {
            editBtn.dataset.listening = "true";
            editBtn.addEventListener('click', () => {
                console.log("Edit Button Clicked");
                const form = document.getElementById('bio-input-overlay');
                const panels = document.querySelectorAll('.hud-panel');

                // Pre-fill Form
                if (this.app.userProfile) {
                    const p = this.app.userProfile;
                    if (p.age) document.getElementById('bio-age').value = p.age;
                    if (p.gender) document.getElementById('bio-gender').value = p.gender;
                    if (p.height) document.getElementById('bio-height').value = p.height;
                    if (p.weight) document.getElementById('bio-weight').value = p.weight;
                }

                // Show Form, Hide HUD
                if (form) {
                    form.classList.remove('hidden-panel');
                    // Ensure visibility vs previous display:none
                    form.style.display = 'flex';
                    form.style.opacity = '1';
                    form.style.pointerEvents = 'all';
                }
                panels.forEach(p => p.classList.add('hidden-panel'));
            });
        }

        // Reset Button Logic
        this.initMuscleResetButton();
    }

    initMuscleResetButton() {
        const resetBtn = document.getElementById('btn-reset-heat');
        if (resetBtn && !resetBtn.dataset.listening) {
            resetBtn.dataset.listening = "true";
            resetBtn.addEventListener('click', () => {
                // Removed browser confirm alert as per user request
                this.app.resetMuscleHeat();
                this.showNotification("Muscle Heatmap Deactivated", "override");
            });
        }
    }

    initMuscleInteractions() {
        const groups = document.querySelectorAll('.muscle-group');
        groups.forEach(group => {
            group.addEventListener('click', (e) => {
                e.stopPropagation();
                const muscle = group.dataset.muscle;
                this.showMuscleQuickLog(muscle);
            });

            group.addEventListener('mouseenter', () => {
                this.hoveredMuscle = group.dataset.muscle;
                // Immediate update if in stats mode
                if (document.getElementById('holo-body-svg').classList.contains('heatmap-mode')) {
                    this.updateHoloLabelsNew('stats');
                }
            });

            group.addEventListener('mouseleave', () => {
                this.hoveredMuscle = null;
                // Immediate update to clear highlight
                if (document.getElementById('holo-body-svg').classList.contains('heatmap-mode')) {
                    this.updateHoloLabelsNew('stats');
                }
            });
        });
    }

    showMuscleQuickLog(muscle) {
        const modal = document.getElementById('log-workout-modal');
        if (modal) {
            const typeInput = document.getElementById('workout-type');
            if (typeInput) typeInput.value = `${muscle} Training`;
            this.showModal('log-workout-modal');
            this.showNotification(`Targeting ${muscle} - Ready to log!`, 'info');
        } else {
            const cals = prompt(`Quick log: How many calories did you burn training ${muscle}?`, "200");
            if (cals) {
                this.app.logWorkout({
                    type: `${muscle} Training`,
                    targetMuscle: muscle,
                    calories: parseInt(cals) || 200
                });
            }
        }
    }

    updateHoloLabelsNew(mode = 'reset') {
        const container = document.getElementById('body-labels');
        if (!container) return;

        container.innerHTML = '';
        const date = new Date();
        const currentDay = date.getDay();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const schedule = {
            0: { text: "Rest & Stretch", pos: { top: "5%", left: "50%" }, align: "center" },
            1: { text: "Chest Day", pos: { top: "25%", left: "80%" }, align: "left" },
            2: { text: "Back & Biceps", pos: { top: "25%", left: "20%" }, align: "right" },
            3: { text: "Leg Day", pos: { top: "60%", left: "20%" }, align: "right" },
            4: { text: "Arms & Shoulders", pos: { top: "40%", left: "80%" }, align: "left" },
            5: { text: "Cardio", pos: { top: "75%", left: "50%" }, align: "center" },
            6: { text: "Leg Day", pos: { top: "60%", left: "80%" }, align: "left" }
        };

        if (mode === 'schedule') {
            for (let i = 0; i < 7; i++) {
                const config = schedule[i];
                container.appendChild(this.createHoloLabel(`${days[i]}: ${config.text}`, config.pos, config.align));
            }
        } else if (mode === 'stats') {
            const muscleStats = {
                'Chest': { pos: { top: "15%", left: "85%" }, align: "left", icon: "fa-shield-halved" },
                'Shoulders': { pos: { top: "30%", left: "85%" }, align: "left", icon: "fa-arrows-to-dot" },
                'Arms': { pos: { top: "45%", left: "85%" }, align: "left", icon: "fa-dumbbell" },
                'Abs': { pos: { top: "15%", left: "15%" }, align: "right", icon: "fa-fire" },
                'Back': { pos: { top: "35%", left: "15%" }, align: "right", icon: "fa-dna" },
                'Legs': { pos: { top: "65%", left: "15%" }, align: "right", icon: "fa-person-running" }
            };


            Object.entries(muscleStats).forEach(([muscle, config]) => {
                const heat = this.app.userProfile.muscleHeat ? (this.app.userProfile.muscleHeat[muscle] || 0) : 0;
                const isTarget = (this.hoveredMuscle === muscle);

                // Refined Color Logic: Blue/Cyan for 0%, Red/Rose for > 0%
                let color = '#4facfe'; // Default Blue
                if (heat > 0) color = isTarget ? '#f43f5e' : '#fb7185';
                else if (isTarget) color = '#00f2fe'; // Bright Cyan for targeted 0%

                const fire = (heat > 0) ? '🔥 ' : '';
                const intensityText = isTarget ? ' Intensity' : '';
                const text = `${fire}${muscle}: ${Math.round(heat)}%${intensityText}`;

                const el = this.createHoloLabel(text, config.pos, config.align, color, config.icon);
                if (isTarget) el.classList.add('active-stat');
                container.appendChild(el);
            });
        } else {
            const config = schedule[currentDay];
            container.appendChild(this.createHoloLabel(`${days[currentDay]}: ${config.text}`, config.pos, config.align));
        }
    }

    createHoloLabel(text, pos, align, color = '#4facfe', icon = null) {
        const el = document.createElement('div');
        el.className = 'holo-label';
        el.style.top = pos.top;
        el.style.left = pos.left;
        el.style.transform = 'translate(-50%, -50%)';

        let flexDir = 'row';
        if (align === 'right') flexDir = 'row-reverse';
        if (align === 'center') flexDir = 'column';
        el.style.flexDirection = flexDir;

        const iconHtml = icon ? `<i class="fa-solid ${icon}" style="color: ${color};"></i>` : '';

        // The entire label is now a single pill-shaped card
        el.innerHTML = `
            <div class="pill-content">
                <div class="status-dot" style="background:${color}; box-shadow:0 0 10px ${color};"></div>
                ${iconHtml}
                <span class="label-text">${text}</span>
            </div>
            <div class="glow-edge" style="background:${color};"></div>
        `;
        return el;
    }
}
