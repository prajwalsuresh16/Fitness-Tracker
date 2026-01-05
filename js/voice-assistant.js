class VoiceAssistant {
    constructor(app) {
        this.app = app;
        this.recognition = null;
        this.isListening = false;
        this.triggerBtn = document.getElementById('voice-assistant-trigger');

        this.init();
    }

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error("Speech Recognition not supported in this browser.");
            if (this.triggerBtn) this.triggerBtn.style.display = 'none';
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = true; // Enabled for feedback
        this.recognition.maxAlternatives = 1;

        this.setupListeners();
    }

    setupListeners() {
        if (!this.triggerBtn) return;

        this.triggerBtn.addEventListener('click', () => {
            if (this.isListening) {
                this.stop();
            } else {
                this.start();
            }
        });

        this.recognition.onstart = () => {
            this.isListening = true;
            this.triggerBtn.classList.add('listening');
            this.showHint("Listening...");
            console.log("Ghost Assistant is listening...");
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.triggerBtn.classList.remove('listening');
            setTimeout(() => this.hideHint(), 2000); // Leave hint for a bit
            console.log("Ghost Assistant stopped listening.");
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (interimTranscript) {
                this.showHint(interimTranscript);
            }

            if (finalTranscript) {
                console.log("Speech Result:", finalTranscript.toLowerCase());
                this.handleCommand(finalTranscript.toLowerCase());
                this.stop();
            }
        };

        this.recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                console.warn("No speech detected.");
                this.app.ui.showNotification("I didn't hear anything. Try again?", 'info');
            } else {
                console.error("Speech Recognition Error:", event.error);
                this.app.ui.showNotification(`Voice error: ${event.error}`, 'error');
            }
            this.stop();
        };
    }

    showHint(text) {
        let hint = document.getElementById('voice-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'voice-hint';
            hint.className = 'voice-command-hint';
            this.triggerBtn.parentElement.appendChild(hint);
        }
        hint.textContent = text;
        hint.style.display = 'block';
    }

    hideHint() {
        const hint = document.getElementById('voice-hint');
        if (hint) hint.style.display = 'none';
    }

    start() {
        try {
            this.recognition.start();
        } catch (e) {
            console.error("Failed to start recognition:", e);
        }
    }

    stop() {
        this.recognition.stop();
    }

    handleCommand(text) {
        // 1. Navigation Commands
        if (text.includes("switch to") || text.includes("go to") || text.includes("open")) {
            const sections = {
                'dashboard': 'dashboard',
                'workout': 'workouts',
                'workouts': 'workouts',
                'analytics': 'analytics',
                'achievement': 'achievements',
                'achievements': 'achievements',
                'nutrition': 'nutrition',
                'hydration': 'hydration',
                'water': 'hydration',
                'fasting': 'fasting',
                'body': 'body-tracker',
                'status': 'body-tracker',
                'setting': 'settings',
                'settings': 'settings'
            };

            for (const [key, id] of Object.entries(sections)) {
                if (text.includes(key)) {
                    this.app.ui.switchSection(id);
                    this.app.ui.showNotification(`Navigating to ${key}...`);
                    return;
                }
            }
        }

        // 2. Smart Logging: Distinguish between Workouts and Meals
        const allFoods = Object.keys(Calculator.FOOD_DB);
        const isFoodInText = allFoods.some(food => text.includes(food));

        if (text.includes("log")) {
            const kcalMatch = text.match(/(\d+)\s*(?:kcal|calories|calorie)/);
            const value = kcalMatch ? parseInt(kcalMatch[1]) : 200;

            // List of words that usually mean it's a WORKOUT
            const workoutKeywords = [
                "run", "running", "cycle", "cycling", "workout", "gym", "burn", "exercise", "training", "swimming", "yoga", "hiit",
                "pushups", "push up", "bench press", "chest fly", "squats", "lunges", "deadlift", "walking", "walk",
                "bicep curl", "tricep extension", "pullups", "pull up", "rows", "overhead press", "lateral raise",
                "jumping jacks", "burpees", "zumba", "plank", "crunch", "leg raises", "pilates", "core"
            ];
            const isWorkout = workoutKeywords.some(word => text.includes(word));

            if (isWorkout) {
                // 1. Extract Duration (e.g., "10 minutes", "15 min")
                const durationMatch = text.match(/(\d+)\s*(?:min|minute|minutes)/i);
                let duration = durationMatch ? parseInt(durationMatch[1]) : 30;

                // 2. Extract Distance (e.g., "5km", "10 kilometers", "500m")
                const distanceMatch = text.match(/(\d+\.?\d*)\s*(?:km|kilometers|kilometer|m|meters|meter)/i);
                let distance = distanceMatch ? parseFloat(distanceMatch[1]) : null;

                // Convert meters to km if caught as 'm' or 'meters' (avoiding 'kilometers' trap)
                if (distanceMatch) {
                    const matchedUnit = distanceMatch[0].toLowerCase();
                    const isKm = matchedUnit.includes('k');

                    if (!isKm && (matchedUnit.includes('meter') || matchedUnit.endsWith('m'))) {
                        distance = distance / 1000;
                    }
                }

                // 3. Determine workout type (Smart Matching)
                let type = "Workout";
                const sortedKeywords = workoutKeywords.filter(k => !["run", "cycle", "workout", "gym", "burn", "exercise", "training", "walk"].includes(k)).sort((a, b) => b.length - a.length);

                const foundType = sortedKeywords.find(k => text.includes(k));
                if (foundType) {
                    type = foundType.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                } else if (text.includes("run")) type = "Running";
                else if (text.includes("cycle")) type = "Cycling";
                else if (text.includes("swim")) type = "Swimming";
                else if (text.includes("walk")) type = "Walking";
                else if (text.includes("yoga")) type = "Yoga";
                else if (text.includes("hiit")) type = "HIIT";

                // 4. Smart Duration Estimation (if missing but distance exists)
                if (!durationMatch && distance) {
                    if (type === "Swimming") {
                        // 3 mins per 100m (500m = 15 mins)
                        duration = Math.max(1, Math.round(distance * 30));
                    } else if (type === "Running") {
                        // 6 mins per km (5km = 30 mins)
                        duration = Math.max(1, Math.round(distance * 6));
                    } else if (type === "Cycling") {
                        // 3 mins per km (10km = 30 mins)
                        duration = Math.max(1, Math.round(distance * 3));
                    }
                }

                this.app.logWorkout({
                    type: type,
                    duration: duration,
                    intensity: "moderate",
                    param: distance, // Distance used for speed-based intensity
                    manualCalories: value > 200 ? value : null
                });
                return;
            }
            else if (isFoodInText || text.includes("kcal") || text.includes("calories") || text.includes("meal")) {
                // If it's not a workout but mentions food, it's a MEAL
                const analysis = this.app.calc.analyzeFood(text);

                this.app.logMeal({
                    name: analysis.name || "Healthy Snack",
                    calories: analysis.calories || value,
                    macros: {
                        p: analysis.protein || 0,
                        c: analysis.carbs || 0,
                        f: analysis.fats || 0
                    }
                });
                return;
            }
        }

        // 3. Hydration Commands (e.g., "Add 500ml water" or "Remove 250ml water")
        if (text.includes("water") || (text.includes("ml") && !isFoodInText)) {
            const amountMatch = text.match(/\d+/);
            const amount = amountMatch ? parseInt(amountMatch[0]) : 250;

            if (text.includes("remove") || text.includes("delete") || text.includes("take away") || text.includes("minus")) {
                this.app.removeWater(amount);
                this.app.ui.showNotification(`Removing ${amount}ml water...`);
            } else {
                this.app.addWater(amount);
                this.app.ui.showNotification(`Adding ${amount}ml water...`);
            }
            return;
        }

        // 5. New: Fasting Timer
        if (text.includes("fasting") && text.includes("start")) {
            this.app.ui.switchSection('fasting');
            setTimeout(() => {
                if (this.app.fasting) this.app.fasting.startFast();
            }, 500);
            return;
        }

        if (text.includes("fasting") && (text.includes("stop") || text.includes("end"))) {
            if (this.app.fasting) this.app.fasting.endFast();
            return;
        }

        // 6. New: Zen / Recovery
        if (text.includes("zen") || text.includes("breathing") || text.includes("recovery")) {
            if (text.includes("stop") || text.includes("end") || text.includes("finish")) {
                if (this.app.recovery) this.app.recovery.stopSession();
                return;
            }

            this.app.ui.switchSection('recovery');
            if (text.includes("start") || text.includes("begin")) {
                setTimeout(() => {
                    if (this.app.recovery) this.app.recovery.startSession();
                }, 500);
            }
            return;
        }

        if ((text.includes("stop") || text.includes("end")) && (text.includes("zen") || text.includes("session"))) {
            if (this.app.recovery) this.app.recovery.stopSession();
            return;
        }

        // 7. New: Logout
        if (text.includes("logout") || text.includes("sign out")) {
            this.app.logout();
            return;
        }

        // 7. Theme Commands
        if (text.includes("dark mode") || text.includes("light mode") || text.includes("theme")) {
            const themeBtn = document.getElementById('theme-btn');
            if (themeBtn) themeBtn.click();
            return;
        }

        // If no command matched
        this.app.ui.showNotification("Command not recognized. Try 'Add 500ml water' or 'Go to Analytics'", 'error');
    }
}
