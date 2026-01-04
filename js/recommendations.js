class RecommendationsEngine {
    generate(workouts, meals, goals) {
        const tips = [];
        const today = new Date().toDateString();
        const todaysWorkouts = workouts.filter(w => new Date(w.timestamp).toDateString() === today);
        const totalBurned = todaysWorkouts.reduce((acc, w) => acc + w.calories, 0);

        // 1. Activity Insight
        if (totalBurned > goals.calories * 0.8) {
            tips.push({ type: 'fire', icon: 'fa-fire', title: 'On Fire!', message: 'You are crushing your calorie goals. Great intensity!' });
        } else {
            tips.push({ type: 'info', icon: 'fa-person-running', title: 'Keep Moving', message: `${goals.calories - totalBurned} kcal to reach your daily target.` });
        }

        // 2. Nutrition Insight
        tips.push({ type: 'apple', icon: 'fa-carrot', title: 'Nutrition Check', message: 'Aim for a balanced plate with 30% protein today.' });

        // 3. Hydration Logic (Placeholder or Real)
        tips.push({ type: 'water', icon: 'fa-glass-water', title: 'Hydration', message: 'Drink 250ml of water every hour to stay peak performance.' });

        // 4. Recovery / Wellness
        tips.push({ type: 'balance', icon: 'fa-moon', title: 'Recovery', message: 'Sleep is when muscles grow. Aim for 8 hours tonight.' });

        return tips;
    }
}
