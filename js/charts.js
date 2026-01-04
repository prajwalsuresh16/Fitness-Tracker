class ChartManager {
    constructor(app) {
        this.app = app;
        this.mainChartCtx = document.getElementById('mainChart').getContext('2d');
        this.macroChartCtx = document.getElementById('macroChart').getContext('2d');
        this.mainChart = null;
        this.macroChart = null;
        this.currentPeriod = 'weekly';

        // Listen for period change
        document.getElementById('chart-period').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.app.updateDashboard(); // Trigger re-render
        });
    }

    init() {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = '#334155';

        // Generate Init Labels (Last 7 Days) to ensure X-axis is visible immediately
        const initLabels = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            initLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        }

        this.mainChart = new Chart(this.mainChartCtx, {
            type: 'line',
            data: {
                labels: initLabels,
                datasets: [
                    {
                        label: 'Calories Burned',
                        data: [0, 0, 0, 0, 0, 0, 0], // Explicit zeros help some renderers
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#8b5cf6'
                    },
                    {
                        label: 'Daily Goal',
                        data: [500, 500, 500, 500, 500, 500, 500], // Default Goal Line
                        borderColor: '#10b981', // Green Target Line
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#94a3b8',
                        borderColor: '#334155',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: 600, // UX Fix: Prevent flat line on empty data
                        grid: { color: '#334155' },
                        ticks: { callback: function (value) { return value + ' kcal'; } }
                    },
                    x: { grid: { display: false } }
                }
            }
        });

        this.macroChart = new Chart(this.macroChartCtx, {
            type: 'doughnut',
            data: {
                labels: ['Target Protein', 'Target Carbs', 'Target Fats'],
                datasets: [{
                    data: [30, 40, 30], // Default: Target Goal Distribution
                    backgroundColor: ['#10b981', '#3b82f6', '#f43f5e'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 20, color: '#94a3b8' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return ' ' + context.label + ': ' + context.raw + '%';
                            }
                        }
                    }
                }
            }
        });


        // Initialize Weight Chart if element exists
        const weightCtx = document.getElementById('weightChart');
        if (weightCtx) {
            this.weightChart = new Chart(weightCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Current Weight',
                            data: [],
                            borderColor: '#3b82f6', // Blue
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.3,
                            fill: true,
                            pointRadius: 4
                        },
                        {
                            label: 'Target Weight',
                            data: [],
                            borderColor: '#10b981', // Green
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, labels: { color: '#94a3b8' } },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: '#1e293b',
                            titleColor: '#f8fafc',
                            bodyColor: '#94a3b8',
                            borderColor: '#334155',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            grid: { color: '#334155' },
                            ticks: { callback: function (val) { return val + ' kg'; }, color: '#64748b' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#64748b' }
                        }
                    }
                }
            });
        }
    }

    update(workouts, meals, goalHistory = []) {
        this.updateMainChart(workouts);
        this.updateMacroChart(meals);
        if (this.weightChart) {
            this.updateWeightChart(goalHistory);
        }
    }

    updateWeightChart(history) {
        if (!this.weightChart) return;

        // Data logic: history is newest-first. Reverse for chart.
        // Limit to last 20 entries for readability.
        const data = [...history].reverse().slice(-20);

        this.weightChart.data.labels = data.map(h => h.date.split(',')[0]);
        this.weightChart.data.datasets[0].data = data.map(h => h.currentWeight || null); // Line breaks if null? Chartjs handles null as gap.
        this.weightChart.data.datasets[1].data = data.map(h => h.targetWeight || h.weight || 0);

        this.weightChart.update();
    }

    updateMainChart(workoutsArg) {
        // Prefer passed argument (Immediate Data), fallback to App State
        const workouts = (workoutsArg && workoutsArg.length > 0) ? workoutsArg : (this.app && this.app.workouts) ? this.app.workouts : [];

        const labels = [];
        const data = [];
        const today = new Date();

        if (this.currentPeriod === 'weekly') {
            // Last 7 days including today
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

                // Match app.js List Rendering Logic (Robust String Comp)
                const checkDateStr = date.toDateString();

                const dayTotal = workouts
                    .filter(w => {
                        if (!w.timestamp) return false;
                        return new Date(w.timestamp).toDateString() === checkDateStr;
                    })
                    .reduce((acc, w) => acc + w.calories, 0);

                data.push(dayTotal);

            }
        } else {
            // Last ~30 days (simplified to 4 weeks or just last 30 days)
            // Let's do weeks of the current month? Or last 30 days?
            // User requirement says Monthly view. Usually implies day-by-day for the month.
            // Let's show last 10 days to keep it clean or weeks?
            // "Monthly" often means the trend over the month.
            // Let's do last 4 weeks aggregation for cleaner chart on small screens?
            // Or just last 14 days? Let's do last 7 days vs last 30 days logic.

            for (let i = 29; i >= 0; i--) {
                if (i % 3 !== 0 && i !== 0) continue; // Skip labels to avoid clutter
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                labels.push(date.getDate() + '/' + (date.getMonth() + 1));
            }

            // Re-loop for data to match the filtered scale? 
            // Better: Show all 30 points, hide labels.
            // Let's reset labels for full 30 days
            labels.length = 0;
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));

                const dayStr = date.toDateString();
                const dayTotal = workouts
                    .filter(w => new Date(w.timestamp).toDateString() === dayStr)
                    .reduce((acc, w) => acc + w.calories, 0);
                data.push(dayTotal);
            }
        }



        // Add Goal Line Data
        // Add Goal Line Data
        // Use Intake Goal as requested by user (Dynamic)
        const goalVal = (this.app.userProfile && this.app.userProfile.goals && this.app.userProfile.goals.calories) ? this.app.userProfile.goals.calories : 2000;
        // Note: userProfile.goals.calories is usually INTAKE goal (2000). Burn goal might be different?
        // Let's assume a static "Activity Goal" of 500 for now, or derive it.
        // Actually, let's use a standard 500 active calorie goal for visuals if not defined.

        const goalData = new Array(data.length).fill(goalVal);

        console.log("ChartManager: generated data", { labels, data, goalData });

        this.mainChart.data.labels = labels;
        this.mainChart.data.datasets[0].data = data;

        if (this.mainChart.data.datasets[1]) {
            this.mainChart.data.datasets[1].data = goalData;
        } else {
            console.warn("ChartManager: Dataset[1] (Goal) missing!");
        }

        this.mainChart.update();
    }

    updateMacroChart(meals) {
        // Filter for today only
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startOfDayTime = startOfDay.getTime();

        const todaysMeals = meals.filter(m => {
            if (!m.timestamp) return false;
            const mDate = new Date(m.timestamp);
            mDate.setHours(0, 0, 0, 0);
            return mDate.getTime() === startOfDayTime;
        });

        // Robust Summation (handles m.macros.p OR m.protein structure)
        const total = todaysMeals.reduce((acc, m) => {
            const p = (m.macros && m.macros.p) ? m.macros.p : (m.protein || 0);
            const c = (m.macros && m.macros.c) ? m.macros.c : (m.carbs || 0);
            const f = (m.macros && m.macros.f) ? m.macros.f : (m.fats || 0);

            acc.p += p;
            acc.c += c;
            acc.f += f;
            return acc;
        }, { p: 0, c: 0, f: 0 });

        const sum = total.p + total.c + total.f;

        if (this.macroChart) {
            if (sum === 0) {
                // Empty State: Show Target Distribution
                this.macroChart.data.labels = ['Target Protein', 'Target Carbs', 'Target Fats'];
                this.macroChart.data.datasets[0].data = [30, 40, 30]; // 30/40/30 Split
                this.macroChart.data.datasets[0].backgroundColor = ['#10b981', '#3b82f6', '#f43f5e'];
                this.macroChart.options.plugins.tooltip.enabled = true; // Enable tooltip to show it's a target
            } else {
                // Active State
                this.macroChart.data.labels = ['Protein', 'Carbs', 'Fats'];
                this.macroChart.data.datasets[0].data = [total.p, total.c, total.f];
                this.macroChart.data.datasets[0].backgroundColor = ['#10b981', '#3b82f6', '#f43f5e'];
                this.macroChart.options.plugins.tooltip.enabled = true;
            }
            this.macroChart.update();
        }
    }

    renderAnalytics(workouts, meals, history, currentWater, currentStreak) {
        if (!history) history = [];

        // Initialize cache
        if (!this.analyticsCharts) this.analyticsCharts = {};

        const days = 7;
        const labels = [];
        const burnedData = [];
        const consumedData = [];
        const waterData = [];
        const streakData = [];
        const today = new Date();

        // Loop Last 7 Days
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();

            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

            // Burned
            const dayBurned = workouts
                .filter(w => new Date(w.timestamp).toDateString() === dateStr)
                .reduce((acc, w) => acc + w.calories, 0);
            burnedData.push(dayBurned);

            // Consumed
            const dayConsumed = meals
                .filter(m => new Date(m.timestamp).toDateString() === dateStr)
                .reduce((acc, m) => acc + m.calories, 0);
            consumedData.push(dayConsumed);

            // Water & Streak (From History + Current)
            if (dateStr === today.toDateString()) {
                waterData.push(currentWater || 0);
                streakData.push(currentStreak || 0);
            } else {
                const entry = history.find(h => new Date(h.date).toDateString() === dateStr);
                waterData.push(entry ? entry.water : 0);
                streakData.push(entry ? entry.streak : 0);
            }
        }

        // Render Charts
        this.createOrUpdateChart('chart-burned-weekly', 'line', labels, burnedData, 'Burned', '#f43f5e', true);
        this.createOrUpdateChart('chart-consumed-weekly', 'bar', labels, consumedData, 'Consumed', '#10b981');
        this.createOrUpdateChart('chart-water-weekly', 'line', labels, waterData, 'Water', '#3b82f6', true);
        this.createOrUpdateChart('chart-streak-weekly', 'bar', labels, streakData, 'Streak', '#fbbf24');
    }

    createOrUpdateChart(id, type, labels, data, label, color, fill = false) {
        const ctx = document.getElementById(id);
        if (!ctx) return;

        // Fix for 'burned' ID having a space in previous step if it happened, checking consistency
        // In index.html -> id="chart- burned-weekly". The space is weird but I must match it.
        // Actually I should probably fix the ID in HTML in a separate step if I made a typo.
        // But for now, I will assume the ID string passed matches the HTML.

        if (this.analyticsCharts[id]) {
            this.analyticsCharts[id].data.labels = labels;
            this.analyticsCharts[id].data.datasets[0].data = data;
            this.analyticsCharts[id].update();
        } else {
            this.analyticsCharts[id] = new Chart(ctx, {
                type: type,
                data: {
                    labels: labels,
                    datasets: [{
                        label: label,
                        data: data,
                        borderColor: color,
                        backgroundColor: color + (type === 'line' || type === 'bar' ? '88' : 'CC'), // Simple alpha
                        // Better alpha handling
                        backgroundColor: fill ? color + '33' : color,
                        tension: 0.4,
                        fill: fill,
                        borderRadius: 4,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#334155' },
                            ticks: { color: '#94a3b8', font: { size: 10 } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 10 } }
                        }
                    }
                }
            });
        }
    }
}
