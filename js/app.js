// Main App Entry
// Imports removed for local file compatibility


class App {
    constructor() {
        this.storage = new StorageManager();
        this.auth = new AuthManager(this); // New Auth
        this.theme = new ThemeManager();
        this.calc = new Calculator();
        this.recommender = new RecommendationsEngine();
        this.ui = new UIManager(this);
        this.charts = new ChartManager(this);
        this.live = new LiveWorkoutManager(this);
        this.fasting = new FastingManager(this);

        this.init();
    }

    init() {
        console.log("FitTrack Pro Initialized");

        // Check Login
        this.showLoginScreen();

        // Standard Init
        this.theme.init();
        this.ui.initListeners();
        // Charts & Dashboard will update after login
    }

    showLoginScreen() {
        const screen = document.getElementById('login-screen');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const loginInput = document.getElementById('login-username');
        const tabs = document.querySelectorAll('.auth-tab');

        // Tab Switching Logic
        tabs.forEach(tab => {
            tab.onclick = () => {
                // UI Toggle
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Content Toggle
                document.querySelectorAll('.auth-view').forEach(v => v.classList.remove('active'));
                document.getElementById(`auth-${tab.dataset.tab}`).classList.add('active');
            }
        });

        // Mobile Menu Logic
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.querySelector('.sidebar');

        // Create Backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);

        const toggleMenu = () => {
            sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        };

        if (mobileBtn) {
            mobileBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent immediate close
                toggleMenu();
            });
        }

        // Close on backdrop click
        backdrop.addEventListener('click', () => {
            sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        });

        // Close on route change (mobile)
        document.querySelectorAll('.nav-links li').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            });
        });

        // 1. Manual Login Logic
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const username = loginInput.value.trim();
            const password = document.getElementById('login-password').value.trim();

            if (username && password) {
                if (this.auth.login(username, password)) {
                    this.login(username);
                } else {
                    this.ui.showNotification('Invalid Credentials! Try "user123" for User 1.', 'error');
                    loginInput.classList.add('error-shake');
                    document.getElementById('login-password').classList.add('error-shake');
                    setTimeout(() => {
                        loginInput.classList.remove('error-shake');
                        document.getElementById('login-password').classList.remove('error-shake');
                    }, 500);
                }
            }
        };

        // 2. Enhanced Registration Logic
        signupForm.onsubmit = (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value.trim();
            const password = document.getElementById('reg-password').value.trim();
            const weight = document.getElementById('reg-weight').value;
            const goal = document.getElementById('reg-goal').value;

            if (username && password && weight && goal) {
                if (this.auth.createUser(username, password)) {
                    // Initialize Profile
                    this.auth.login(username, password); // Set prefix

                    const profile = { goals: { calories: parseInt(goal), weight: parseInt(weight) } };
                    this.storage.save('userProfile', profile);

                    this.ui.showNotification('Account created successfully!', 'success');
                    this.login(username);
                } else {
                    this.ui.showNotification('Username already taken!', 'error');
                }
            }
        };

        screen.classList.remove('hidden');
    }

    login(username) {
        // UI Logic only - Auth already verified by caller
        this.currentUsername = username;
        console.log("App.login called for:", username);

        // Hide Login Screen immediately
        document.getElementById('login-screen').classList.add('hidden');

        // Play Success Animation
        this.playIntroAnimation(() => {
            console.log("Animation complete. Initializing Dashboard...");
            // Callback: Runs AFTER animation finishes

            // Update UI Name
            const profileName = document.querySelector('.header-text p');
            // Fix selector if needed, index.html has #user-name
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) userNameEl.textContent = username;

            // Load Data for this user
            try {
                // Init Charts FIRST so they are ready for data
                try {
                    this.charts.init();
                } catch (chartErr) {
                    console.error("Chart Init Failed:", chartErr);
                }

                console.log("Loading data for user:", username);
                this.loadData();
                console.log("Data Loaded. Workouts:", this.workouts.length);

                this.ui.switchSection('dashboard');

                // Update Stats with Retry Mechanism
                // Fixes race condition where UI/Data might not be ready
                this.ui.switchSection('dashboard');

                // Immediate Update (Synchronous & Simple)
                this.updateStats();

                // --- DEBUG & FAILSAFE ---
                // Manually inspect data count
                const wCount = this.workouts ? this.workouts.length : 0;
                const mCount = this.meals ? this.meals.length : 0;

                // Visual Confirmation for User/Dev
                this.ui.showNotification(`Debug: Loaded ${wCount} Workouts, ${mCount} Meals.`);

                // Redundant DOM Force if UpdateStats failed silently
                if (wCount > 0 || mCount > 0) {
                    // Safe Date Filter for Fallback
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    const t = startOfDay.getTime();

                    const b = this.workouts
                        .filter(w => {
                            if (!w.timestamp) return false;
                            const d = new Date(w.timestamp);
                            d.setHours(0, 0, 0, 0);
                            return d.getTime() === t;
                        })
                        .reduce((s, x) => s + x.calories, 0);

                    const c = this.meals
                        .filter(m => {
                            if (!m.timestamp) return false;
                            const d = new Date(m.timestamp);
                            d.setHours(0, 0, 0, 0);
                            return d.getTime() === t;
                        })
                        .reduce((s, x) => s + x.calories, 0);

                    const elB = document.getElementById('dash-burned');
                    if (elB && elB.textContent === '0') elB.textContent = b; // Force if 0

                    const elC = document.getElementById('dash-consumed');
                    if (elC && elC.textContent === '0') elC.textContent = c;

                    // Force Chart Update (Sync with Fallback)
                    if (this.charts) {
                        this.charts.update(this.workouts, this.meals, this.userProfile.goalHistory || []);
                    }
                }
                // ------------------------

                // One safety retry for slow renders
                setTimeout(() => this.updateStats(), 100);

                // Ensure Water UI
                if (this.userProfile) {
                    this.ui.updateWaterUI(this.userProfile.water || 0);
                    if (this.ui.updateProfileUI) this.ui.updateProfileUI(this.userProfile);
                }

                this.ui.showNotification(`Welcome back, ${username}!`);
                console.log("Dashboard initialized successfully.");
            } catch (err) {
                console.error("Error initializing dashboard:", err);
            }
        });
    }

    startDataObserver() {
        // Runs every 1s to ensure UI matches Data
        setInterval(() => {
            if (!this.userProfile || !this.workouts) return;

            // Check if we have data but UI says 0
            const burntEl = document.getElementById('dash-burned');
            if (burntEl) {
                const uiVal = parseInt(burntEl.textContent) || 0;
                const actualVal = this.workouts.reduce((sum, w) => sum + w.calories, 0);

                if (actualVal > 0 && uiVal === 0) {
                    console.log("Observer: UI desync detected (UI: 0, Data: " + actualVal + "). Forcing update.");
                    this.updateStats();
                }
            }
        }, 1000);
    }

    logout() {
        this.auth.logout();

        // Reset Logic
        document.getElementById('login-form').reset();
        document.getElementById('signup-form').reset();

        // Reset Tabs to Login
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-tab="login"]').classList.add('active');
        document.querySelectorAll('.auth-view').forEach(v => v.classList.remove('active'));
        document.getElementById('auth-login').classList.add('active');

        document.getElementById('login-screen').classList.remove('hidden');
        this.showLoginScreen();

        this.ui.showNotification('Logged out successfully');
    }

    playIntroAnimation(onComplete) {
        const story = document.getElementById('story-intro');
        const splash = document.getElementById('splash-screen');

        // 1. Reset & Prepare Elements
        if (story) {
            story.classList.remove('hidden');
            story.style.opacity = '1';
        }

        // Splash should be visible underneath or prepared to show
        if (splash) {
            splash.classList.remove('fade-out', 'hidden');
            splash.style.display = 'flex';
        }

        // 2. Start Story (Delay for paint)
        setTimeout(() => {
            if (story) story.classList.add('start-animation');
        }, 50);

        // 3. End Story -> Start Splash
        setTimeout(() => {
            if (story) {
                story.classList.add('hidden'); // Fades out
                setTimeout(() => story.remove(), 500);
            }

            // Reveal Splash (It's under the story, so fading story reveals it)
            setTimeout(() => {
                if (splash) {
                    splash.classList.add('fade-out');
                    setTimeout(() => {
                        splash.remove();
                        if (onComplete) onComplete();
                    }, 500);
                } else {
                    if (onComplete) onComplete();
                }
            }, 2000); // Show logo for 2 seconds

        }, 5300); // Story duration
    }

    loadData() {
        // Load user profile or Initialize Default
        this.userProfile = this.storage.load('userProfile') || {
            goals: { calories: 2000, weight: 70 },
            water: 0,
            level: 1,
            xp: 0,
            joinDate: new Date().toISOString(),
            displayName: this.currentUsername || 'User'
        };

        // Backfill joinDate if missing (for existing users)
        if (!this.userProfile.joinDate) {
            this.userProfile.joinDate = new Date().toISOString();
        }

        // Backfill displayName
        if (!this.userProfile.displayName) {
            this.userProfile.displayName = this.currentUsername || 'User';
        }

        // Safety check for existing profiles missing new fields
        this.userProfile.water = this.userProfile.water || 0;
        this.userProfile.level = this.userProfile.level || 1;
        this.userProfile.level = this.userProfile.level || 1;
        this.userProfile.xp = this.userProfile.xp || 0;
        this.userProfile.streak = this.userProfile.streak || 0;
        this.userProfile.lastLogDate = this.userProfile.lastLogDate || "";
        this.userProfile.history = this.userProfile.history || [];

        // Daily Reset Logic
        const today = new Date().toDateString();
        if (this.userProfile.lastWaterDate !== today) {
            // Archive previous day's data
            if (this.userProfile.lastWaterDate) {
                this.userProfile.history.push({
                    date: this.userProfile.lastWaterDate,
                    water: this.userProfile.water || 0,
                    streak: this.userProfile.streak || 0
                });
                // Limit to 60 days
                if (this.userProfile.history.length > 60) this.userProfile.history.shift();
            }

            this.userProfile.water = 0;
            this.userProfile.waterGoalMet = false;
            this.userProfile.lastWaterDate = today;
            this.saveProfile(); // Persist reset
        }

        console.log(`Loading Data from Prefix: ${this.storage.prefix}`);

        // Check if data exists in storage
        const hasWorkouts = this.storage.has('workouts');
        const hasMeals = this.storage.has('meals');

        console.log(`Deep Audit: Prefix=${this.storage.prefix}, HasW=${hasWorkouts}, HasM=${hasMeals}`);

        if (!hasWorkouts && !hasMeals) {
            console.log("No data found, starting fresh.");
            this.workouts = [];
            this.meals = [];
        } else {
            // Load existing (even if empty)
            this.workouts = this.storage.load('workouts') || [];
            this.workouts = this.storage.load('workouts') || [];
            this.meals = this.storage.load('meals') || [];
        }

        // Initialize Input Values
        const cwEl = document.getElementById('current-weight');
        if (cwEl && this.userProfile.currentWeight) {
            cwEl.value = this.userProfile.currentWeight;
        }

        const gwEl = document.getElementById('goal-weight');
        if (gwEl && this.userProfile.goals && this.userProfile.goals.weight) {
            gwEl.value = this.userProfile.goals.weight; // Ensure this is synced
        }

        // Render Loaded Data to UI (Only Today's Data for Daily Log)

        this.workouts
            .filter(w => new Date(w.timestamp).toDateString() === today)
            .forEach(w => this.ui.renderWorkout(w));

        this.meals
            .filter(m => new Date(m.timestamp).toDateString() === today)
            .forEach(m => this.ui.renderMeal(m));

        // Render History if exists
        if (this.userProfile.goalHistory) {
            this.ui.renderGoalHistory(this.userProfile.goalHistory);
        }

        // Initialize Gamification & Hydration UI
        // Initialize Gamification & Hydration UI
        this.ui.updateXPUI(this.userProfile.level || 1, this.userProfile.xp || 0);
        this.ui.updateWaterUI(this.userProfile.water || 0);
        if (this.fasting) this.fasting.loadData(); // Initialize Fasting State
        this.ui.updateStreakUI(this.userProfile.streak || 0);

        // Initialize Badges
        this.checkAchievements();

        // Render Dashboard (Initial)
        this.updateStats();

        // Safety Delay: Force Update again to ensure Charts catch up
        // Fixes issue where Charts show 0s on Login despite data existing
        setTimeout(() => {
            console.log("Force Updating Stats/Charts...");
            this.updateStats();
        }, 500);
    }

    // seedDemoData() removed per user request for clean start


    logWorkout(workoutData) {
        // Enhance data with calculations
        const result = this.calc.estimateBurn(workoutData);
        workoutData.calories = result.calories;

        workoutData.id = Date.now();
        workoutData.timestamp = Date.now();

        this.workouts.push(workoutData);
        this.storage.save('workouts', this.workouts);

        this.ui.renderWorkout(workoutData);
        this.updateDashboard();
        this.addXP(20);
        this.checkStreak();
        this.checkAchievements();
        this.ui.showNotification('Workout logged! +20 XP');
    }

    // --- Stats Updates ---

    // Alias for compatibility with Charts/Other calls
    updateDashboard() {
        this.updateStats();
    }

    updateStats() {
        // Calculate Stats (Today)
        const workouts = this.workouts || [];
        const meals = this.meals || [];

        // Robust Date Comparison
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startOfDayTime = startOfDay.getTime();

        const todayWorkouts = workouts.filter(w => {
            if (!w.timestamp) return false;
            const wDate = new Date(w.timestamp);
            wDate.setHours(0, 0, 0, 0);
            return wDate.getTime() === startOfDayTime;
        });

        const todayMeals = meals.filter(m => {
            if (!m.timestamp) return false;
            const mDate = new Date(m.timestamp);
            mDate.setHours(0, 0, 0, 0);
            return mDate.getTime() === startOfDayTime;
        });

        const burned = todayWorkouts.reduce((sum, item) => sum + item.calories, 0);
        const consumed = todayMeals.reduce((sum, item) => sum + item.calories, 0);
        const goal = (this.userProfile && this.userProfile.goals) ? this.userProfile.goals.calories : 2000;

        // Update UI
        this.ui.updateDashboard(burned, consumed, goal);
        if (this.ui.renderBodyTracker) {
            this.ui.renderBodyTracker(burned, consumed, goal);
        }

        // Update Charts
        if (this.charts) {
            this.charts.update(workouts, meals, this.userProfile.goalHistory || []);
        }

        this.checkRecommendations();
    }

    checkRecommendations() {
        // Recommendations - let them run on all data or however defined
        if (this.recommender) {
            const tips = this.recommender.generate(this.workouts, this.meals, this.userProfile.goals);
            this.ui.renderRecommendations(tips);
        }
    }

    // --- Actions ---

    addWorkout(workout) {
        this.workouts.unshift(workout);
        this.storage.save('workouts', this.workouts); // Save immediately
        this.ui.renderWorkout(workout);
        this.updateStats();
        this.addXP(20);
        this.checkAchievements();
        this.ui.showNotification('Workout Logged! +20 XP', 'success');
    }

    removeWorkout(id) {
        this.workouts = this.workouts.filter(w => w.id !== id);
        this.storage.save('workouts', this.workouts);
        // Re-render list
        const list = document.getElementById('workout-list');
        if (list) list.innerHTML = '';
        if (this.workouts.length === 0) this.ui.renderEmptyState('workout-list', 'No workouts today');
        this.workouts.forEach(w => this.ui.renderWorkout(w));

        this.updateStats();
    }

    logMeal(mealData) {
        mealData.id = Date.now();
        mealData.timestamp = Date.now();

        this.meals.push(mealData);
        this.storage.save('meals', this.meals);

        this.ui.renderMeal(mealData);
        this.updateDashboard();
        this.addXP(10);
        this.checkStreak();
        this.checkAchievements();
        this.ui.showNotification('Meal logged! +10 XP');
    }

    addMeal(meal) {
        this.meals.unshift(meal);
        this.storage.save('meals', this.meals);
        this.ui.renderMeal(meal);
        this.updateStats();
        this.addXP(10);
        this.checkAchievements();
        this.ui.showNotification('Meal Logged! +10 XP', 'success');
    }

    // --- Phase 1: Logic ---

    // Hydration
    addWater(amount = 250) {
        this.userProfile.water = (this.userProfile.water || 0) + amount;

        // Goal Check (Target: 5000ml)
        const TARGET = 5000;
        if (this.userProfile.water >= TARGET && !this.userProfile.waterGoalMet) {
            this.addXP(50);
            this.userProfile.waterGoalMet = true;
            this.ui.showNotification(`Hydration Goal Reached! +50 XP 💧`, 'success');
        } else {
            this.ui.showNotification(`Added ${amount}ml water!`, 'success');
        }

        this.saveProfile();
        this.ui.updateWaterUI(this.userProfile.water);
        this.checkStreak();
        this.checkAchievements();
    }

    removeWater() {
        if (this.userProfile.water > 0) {
            this.userProfile.water = Math.max(0, this.userProfile.water - 250);
            this.saveProfile();
            this.ui.updateWaterUI(this.userProfile.water);
        }
    }

    // Gamification
    addXP(amount) {
        this.userProfile.xp += amount;

        // Level Up Logic: Threshold = Level * 100
        const threshold = this.userProfile.level * 100;

        if (this.userProfile.xp >= threshold) {
            this.userProfile.xp -= threshold;
            this.userProfile.level++;
            this.ui.showLevelUp(this.userProfile.level);
            this.ui.showNotification(`LEVEL UP! You reached Level ${this.userProfile.level}!`, 'success');
        }

        this.saveProfile();
        this.ui.updateXPUI(this.userProfile.level, this.userProfile.xp);
        this.checkAchievements(); // Check for Level-based badges immediately
    }

    saveProfile() {
        this.storage.save('userProfile', this.userProfile);
    }

    removeMeal(id) {
        this.meals = this.meals.filter(m => m.id !== id);
        this.storage.save('meals', this.meals);
        this.ui.removeMealElement(id);
        this.updateDashboard();
    }

    // --- Phase 5: Polish & Engagement ---

    checkStreak() {
        const today = new Date().toDateString();
        const lastLog = this.userProfile.lastLogDate;

        if (today === lastLog) return; // Already counted today

        if (lastLog) {
            const todayDate = new Date();
            const lastDate = new Date(lastLog);

            // Normalize time to midnight for accurate day diff
            todayDate.setHours(0, 0, 0, 0);
            lastDate.setHours(0, 0, 0, 0);

            const diffTime = Math.abs(todayDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                this.userProfile.streak = (this.userProfile.streak || 0) + 1;
                this.ui.showNotification(`Streak Increased! 🔥 ${this.userProfile.streak} Days`, 'success');
            } else if (diffDays > 1) {
                // Missed a day
                this.userProfile.streak = 1;
            }
        } else {
            // First time ever
            this.userProfile.streak = 1;
        }

        this.userProfile.lastLogDate = today;
        this.saveProfile();
        this.ui.updateStreakUI(this.userProfile.streak);
        this.checkAchievements();
    }

    // --- Badge System ---
    checkAchievements() {
        if (!this.userProfile.badges) this.userProfile.badges = [];

        const BADGES = {
            'first_login': { name: 'First Step', icon: 'fa-shoe-prints', color: '#22c55e', desc: 'Logged your first activity' },
            'goal_met': { name: 'Goal Crusher', icon: 'fa-bullseye', color: '#3b82f6', desc: 'Hit daily calorie goal' },
            'streak_7': { name: 'Week Warrior', icon: 'fa-crown', color: '#a855f7', desc: 'Maintained 7 Day Streak' },
            'streak_30': { name: 'Monthly Titan', icon: 'fa-trophy', color: '#f59e0b', desc: 'Maintained 30 Day Streak' },
            'early_bird': { name: 'Early Bird', icon: 'fa-cloud-sun', color: '#fde047', desc: 'Logged a workout before 9AM' },
            'night_owl': { name: 'Night Owl', icon: 'fa-moon', color: '#6366f1', desc: 'Logged a workout after 8PM' },
            'hydration_god': { name: 'Hydration God', icon: 'fa-droplet', color: '#0ea5e9', desc: 'Drank 5000ml in a day' },
            'weekend_warrior': { name: 'Weekend Warrior', icon: 'fa-dumbbell', color: '#ec4899', desc: 'Logged workout on a Weekend' },
            // New 10 Badges
            'protein_champion': { name: 'Protein Champ', icon: 'fa-drumstick-bite', color: '#ef4444', desc: 'Eat >100g Protein in a day' },
            'gym_rat': { name: 'Gym Rat', icon: 'fa-person-running', color: '#64748b', desc: '3 Workouts in one day' },
            'heavy_hitter': { name: 'Heavy Hitter', icon: 'fa-stopwatch-20', color: '#14b8a6', desc: 'Workout > 90 minutes' },
            'zen_mind': { name: 'Zen Mind', icon: 'fa-om', color: '#8b5cf6', desc: 'Complete a Yoga session' },
            'pump_master': { name: 'Pump Master', icon: 'fa-dumbbell', color: '#dc2626', desc: 'Log a Weightlifting session' },
            'speed_demon': { name: 'Speed Demon', icon: 'fa-bolt', color: '#eab308', desc: 'Log a HIIT session' },
            'fasting_warrior': { name: 'Fasting Warrior', icon: 'fa-clock', color: '#f97316', desc: 'Complete a Fast (Any)' },
            'streak_50': { name: 'Half-Centurion', icon: 'fa-fire-flame-curved', color: '#f43f5e', desc: '50 Day Streak' },
            'level_5': { name: 'Rising Star', icon: 'fa-star', color: '#84cc16', desc: 'Reach Level 5' },
            'level_10': { name: 'Fitness Legend', icon: 'fa-medal', color: '#d946ef', desc: 'Reach Level 10' }
        };

        // Helper: Calculate daily totals
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startOfDayTime = startOfDay.getTime();

        const todaysMeals = this.meals.filter(m => {
            if (!m.timestamp) return false;
            const mDate = new Date(m.timestamp);
            mDate.setHours(0, 0, 0, 0);
            return mDate.getTime() === startOfDayTime;
        });

        const dailyProtein = todaysMeals.reduce((acc, m) => {
            const p = (m.macros && m.macros.p) ? m.macros.p : (m.protein || 0); // Fallback for old data
            return acc + p;
        }, 0);

        const todaysWorkouts = this.workouts.filter(w => {
            if (!w.timestamp) return false;
            const wDate = new Date(w.timestamp);
            wDate.setHours(0, 0, 0, 0);
            return wDate.getTime() === startOfDayTime;
        });

        const unlock = (id) => {
            if (!this.userProfile.badges.includes(id)) {
                this.userProfile.badges.push(id);
                this.saveProfile();
                this.ui.showBadgeNotification(BADGES[id]);
                this.ui.renderBadges(this.userProfile.badges, BADGES);
            }
        };

        // --- Original Logic ---
        if (this.workouts.length > 0 || this.meals.length > 0) unlock('first_login');

        if (this.userProfile.water >= 5000) {
            unlock('hydration_god');
            if (!this.userProfile.badges.includes('goal_met')) unlock('goal_met');
        }

        if (this.userProfile.streak >= 7) unlock('streak_7');
        if (this.userProfile.streak >= 30) unlock('streak_30');

        // --- New Logic ---

        // 1. Protein Champion
        if (dailyProtein >= 100) unlock('protein_champion');

        // 2. Gym Rat (3 workouts today)
        if (todaysWorkouts.length >= 3) unlock('gym_rat');

        // 3. Streak 50
        if (this.userProfile.streak >= 50) unlock('streak_50');

        // 4. Levels
        if (this.userProfile.level >= 5) unlock('level_5');
        if (this.userProfile.level >= 10) unlock('level_10');

        // 5. Workout Types & Duration (Check latest or iterate all? Checking latest avoids loop cost, but might miss if batch imported. 
        // Let's iterate user's workouts if array is small, or just check the one just added.
        // Since this runs on loadData too, we should check ALL history for 'has ever done x' type badges if using historical badges?
        // But for simplicity/performance, let's just check the LATEST workout for one-off events, and iterate logic for 'counts'.
        // Actually, user wants to see them in 'Unearned', so we just defined them. Unlocking them requires action.
        // Let's check the current session's latest workout.

        if (this.workouts.length > 0) {
            const lastWorkout = this.workouts[this.workouts.length - 1];
            const wTime = new Date(lastWorkout.timestamp);

            // Time Check
            const wDateCheck = new Date(wTime);
            wDateCheck.setHours(0, 0, 0, 0);

            if (wDateCheck.getTime() === startOfDayTime) {
                const hour = wTime.getHours();
                if (hour < 9) unlock('early_bird');
                if (hour >= 20) unlock('night_owl');
                if (wTime.getDay() === 0 || wTime.getDay() === 6) unlock('weekend_warrior');
            }

            // Heavy Hitter
            if (lastWorkout.duration > 90) unlock('heavy_hitter');

            // Type Checks
            const type = lastWorkout.type.toLowerCase();
            if (type === 'yoga') unlock('zen_mind');
            if (type === 'weightlifting') unlock('pump_master');
            if (type === 'hiit') unlock('speed_demon');
        }

        // Fasting (Check fasting history if available, or just check current state?)
        // Assuming fasting.js saves to a history array in local storage or something?
        // The prompt says we have 'd:\FITNESS TRACKER\js\fasting.js'.
        // Ideally App should know about fasting. Let's assume if they start a fast or end one, this is called.
        // For now, let's leave Fasting Warrior manual or linked if we can find the data. 
        // We can check localstorage 'fastingHistory' if it exists.
        const fastingHistory = JSON.parse(localStorage.getItem('fastingHistory') || '[]');
        if (fastingHistory.length > 0) unlock('fasting_warrior');

        this.BADGES_CONFIG = BADGES; // Expose for UI
    }

    updateDashboard() {
        const today = new Date().toDateString();

        // Filter for today
        const todaysWorkouts = this.workouts.filter(w => new Date(w.timestamp).toDateString() === today);
        const todaysMeals = this.meals.filter(m => new Date(m.timestamp).toDateString() === today);

        const burned = todaysWorkouts.reduce((acc, curr) => acc + curr.calories, 0);
        const consumed = todaysMeals.reduce((acc, curr) => acc + curr.calories, 0);

        this.ui.updateSummaryIds(burned, consumed, this.userProfile.goals.calories);

        try {
            this.charts.update(this.workouts, this.meals, this.userProfile.goalHistory || []);
        } catch (chartErr) {
            console.error("Chart Update Failed:", chartErr);
        }

        const tips = this.recommender.generate(this.workouts, this.meals, this.userProfile.goals);
        this.ui.renderRecommendations(tips);
    }

    saveGoals(goals) {
        this.userProfile.goals = goals;
        // Also persist current weight to profile for easy access
        if (goals.currentWeight) {
            this.userProfile.currentWeight = goals.currentWeight;
        }

        // History Logic
        if (!this.userProfile.goalHistory) {
            this.userProfile.goalHistory = [];
        }

        const entry = {
            date: new Date().toLocaleString(), // "1/3/2026, 11:55:00 AM"
            calories: goals.calories,
            targetWeight: goals.weight, // Renaming for clarity (was 'weight')
            currentWeight: goals.currentWeight || 0
        };

        this.userProfile.goalHistory.unshift(entry); // Add to top

        // Limit history to last 10 entries to save space? Optional.
        // this.userProfile.goalHistory = this.userProfile.goalHistory.slice(0, 50);

        this.storage.save('userProfile', this.userProfile);
        this.ui.showNotification('Goals updated & saved to history!');
        this.updateDashboard();
        this.ui.renderGoalHistory(this.userProfile.goalHistory);
    }
}

// Instantiate App
// Instantiate App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();

    // Splash logic is now handled by App.login() -> playIntroAnimation()
    // We leave the splash screen in the DOM (hidden by CSS or Z-index) 
    // waiting for the JS to trigger it.
});
