class Calculator {
    estimateBurn(workout) {
        // Simple MET (Metabolic Equivalent of Task) based estimation
        // Calories = Duration (min) * (MET * 3.5 * Weight(kg)) / 200
        // Assuming defaults for demo: Weight = 70kg
        const weight = 70;

        const metTable = {
            running: { light: 6, moderate: 9, high: 12 },
            cycling: { light: 4, moderate: 8, high: 10 },
            weightlifting: { light: 3, moderate: 5, high: 6 },
            yoga: { light: 2, moderate: 3, high: 4 },
            hiit: { light: 8, moderate: 11, high: 14 },
            swimming: { light: 6, moderate: 8, high: 10 }
        };

        const activityMets = metTable[workout.type.toLowerCase()];
        let met = 5; // default

        // Smart Intensity Detection Logic
        if (activityMets) {
            let detectedIntensity = 'moderate';

            // Heuristic Examples:
            // Running: > 10km/h (approx pace) considered high
            // Cycling: > 20km/h considered high

            if (workout.param) {
                const speed = workout.param / (workout.duration / 60); // km/h

                if (workout.type === 'running') {
                    if (speed < 8) detectedIntensity = 'light';
                    else if (speed > 12) detectedIntensity = 'high';
                    else detectedIntensity = 'moderate';
                } else if (workout.type === 'cycling') {
                    if (speed < 15) detectedIntensity = 'light';
                    else if (speed > 25) detectedIntensity = 'high';
                    else detectedIntensity = 'moderate';
                }
                // For others we might default to manual selection or duration based
            }

            // Allow manual override if user explicitly selected? 
            // For now, we return the precise MET to help the UI update the radio button
            met = activityMets[detectedIntensity];
            return { calories: Math.round((workout.duration * (met * 3.5 * weight)) / 200), intensity: detectedIntensity };
        }

        return { calories: Math.round((workout.duration * (5 * 3.5 * weight)) / 200), intensity: 'moderate' };
    }
}
