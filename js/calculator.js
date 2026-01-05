class Calculator {
    estimateBurn(workout) {
        // Simple MET (Metabolic Equivalent of Task) based estimation
        // Calories = Duration (min) * (MET * 3.5 * Weight(kg)) / 200
        // Assuming defaults for demo: Weight = 70kg
        const weight = 70;

        const metTable = {
            running: { light: 6, moderate: 9.8, high: 12.3 },
            walking: { light: 2.5, moderate: 3.5, high: 4.5 },
            cycling: { light: 4, moderate: 8, high: 10 },
            weightlifting: { light: 3, moderate: 5, high: 6 },
            yoga: { light: 2, moderate: 3, high: 4 },
            hiit: { light: 8, moderate: 11, high: 14 },
            swimming: { light: 6, moderate: 8, high: 10 },
            // Chest
            pushups: { light: 3, moderate: 4, high: 8 },
            'bench press': { light: 3, moderate: 5, high: 7 },
            'chest fly': { light: 2.5, moderate: 4, high: 6 },
            // Legs
            squats: { light: 3.5, moderate: 5, high: 8 },
            lunges: { light: 3.5, moderate: 5, high: 8 },
            deadlift: { light: 3, moderate: 5, high: 8 },
            // Arms
            'bicep curl': { light: 2.5, moderate: 3.5, high: 5 },
            'tricep extension': { light: 2.5, moderate: 3.5, high: 5 },
            // Back
            pullups: { light: 4, moderate: 6, high: 10 },
            rows: { light: 3, moderate: 5, high: 7 },
            // Shoulders
            'overhead press': { light: 3, moderate: 5, high: 7 },
            'lateral raise': { light: 2.5, moderate: 4, high: 6 },
            // Abs/Core
            plank: { light: 2, moderate: 3, high: 5 },
            crunch: { light: 2.5, moderate: 3.5, high: 5 },
            'leg raises': { light: 2.5, moderate: 3.5, high: 5 },
            pilates: { light: 3, moderate: 4, high: 5 },
            core: { light: 3, moderate: 4, high: 6 },
            // Cardio & Full Body
            'jumping jacks': { light: 6, moderate: 8, high: 10 },
            burpees: { light: 8, moderate: 10, high: 12 },
            zumba: { light: 4, moderate: 6, high: 8 }
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

    static FOOD_DB = {
        // --- 100 Common Foods & More ---
        // Basis: Liquids per 1ml, Solids per 1g, Pieces per 1 unit

        // Grains & Carbs
        'white rice': { unit: 'g', kcal: 1.3, p: 0.027, c: 0.28, f: 0.003 },
        'brown rice': { unit: 'g', kcal: 1.23, p: 0.027, c: 0.26, f: 0.01 },
        'pasta': { unit: 'g', kcal: 1.58, p: 0.058, c: 0.31, f: 0.009 },
        'white bread': { unit: 'g', kcal: 2.65, p: 0.09, c: 0.49, f: 0.032 },
        'whole wheat bread': { unit: 'g', kcal: 2.47, p: 0.13, c: 0.41, f: 0.042 },
        'pizza': { unit: 'g', kcal: 2.85, p: 0.12, c: 0.36, f: 0.1 },
        'burger bun': { unit: 'g', kcal: 2.65, p: 0.091, c: 0.49, f: 0.04, pieceWeight: 98 },
        'boiled potato': { unit: 'g', kcal: 0.87, p: 0.019, c: 0.2, f: 0.001 },
        'french fries': { unit: 'g', kcal: 3.12, p: 0.034, c: 0.41, f: 0.15 },
        'mashed potatoes': { unit: 'g', kcal: 0.88, p: 0.02, c: 0.2, f: 0.002 },
        'oats': { unit: 'g', kcal: 3.89, p: 0.17, c: 0.66, f: 0.07 },
        'cornflakes': { unit: 'g', kcal: 3.57, p: 0.08, c: 0.84, f: 0.004 },
        'granola': { unit: 'g', kcal: 4.71, p: 0.1, c: 0.64, f: 0.2 },
        'rice': { unit: 'g', kcal: 1.3, p: 0.027, c: 0.28, f: 0.003 },
        'bread': { unit: 'g', kcal: 2.65, p: 0.09, c: 0.49, f: 0.032, pieceWeight: 30 },
        'quinoa': { unit: 'g', kcal: 1.2, p: 0.044, c: 0.21, f: 0.019 },
        'potato': { unit: 'g', kcal: 0.87, p: 0.02, c: 0.2, f: 0.001 },
        'sweet potato': { unit: 'g', kcal: 0.86, p: 0.016, c: 0.2, f: 0.001 },

        // Proteins
        'chicken breast': { unit: 'g', kcal: 1.65, p: 0.31, c: 0, f: 0.036 },
        'chicken thigh': { unit: 'g', kcal: 2.09, p: 0.26, c: 0, f: 0.109 },
        'beef': { unit: 'g', kcal: 2.50, p: 0.26, c: 0, f: 0.15 },
        'salmon': { unit: 'g', kcal: 2.08, p: 0.2, c: 0, f: 0.13 },
        'egg': { unit: 'g', kcal: 1.55, p: 0.126, c: 0.011, f: 0.1, pieceWeight: 50 },
        'egg white': { unit: 'g', kcal: 0.52, p: 0.11, c: 0.007, f: 0.002, pieceWeight: 33 },
        'chicken': { unit: 'g', kcal: 1.65, p: 0.31, c: 0, f: 0.036 },
        'tofu': { unit: 'g', kcal: 0.76, p: 0.08, c: 0.019, f: 0.048 },

        // Dairy
        'milk': { unit: 'ml', kcal: 0.61, p: 0.032, c: 0.05, f: 0.033 },
        'cheese': { unit: 'g', kcal: 3.50, p: 0.2, c: 0.01, f: 0.3 },
        'cream': { unit: 'ml', kcal: 3.40, p: 0.02, c: 0.03, f: 0.36 },
        'protein shake': { unit: 'ml', kcal: 0.8, p: 0.1, c: 0.06, f: 0.01 },

        // Fruits
        'apple': { unit: 'g', kcal: 0.52, p: 0.003, c: 0.138, f: 0.002, pieceWeight: 182 },
        'banana': { unit: 'g', kcal: 0.89, p: 0.011, c: 0.228, f: 0.003, pieceWeight: 118 },
        'orange': { unit: 'g', kcal: 0.47, p: 0.009, c: 0.118, f: 0.001, pieceWeight: 131 },
        'mango': { unit: 'g', kcal: 0.6, p: 0.008, c: 0.15, f: 0.004, pieceWeight: 336 },
        'grapes': { unit: 'g', kcal: 0.69, p: 0.007, c: 0.18, f: 0.002 },
        'pear': { unit: 'g', kcal: 0.57, p: 0.004, c: 0.15, f: 0.001, pieceWeight: 178 },
        'peach': { unit: 'g', kcal: 0.39, p: 0.009, c: 0.09, f: 0.003, pieceWeight: 150 },
        'papaya': { unit: 'g', kcal: 0.4, p: 0.005, c: 0.1, f: 0.003, pieceWeight: 300 },
        'kiwi': { unit: 'g', kcal: 0.61, p: 0.011, c: 0.15, f: 0.005, pieceWeight: 70 },
        'pomegranate': { unit: 'g', kcal: 0.83, p: 0.017, c: 0.19, f: 0.012, pieceWeight: 280 },
        'avocado': { unit: 'g', kcal: 1.6, p: 0.02, c: 0.085, f: 0.147, pieceWeight: 150 },
        'avacado': { unit: 'g', kcal: 1.6, p: 0.02, c: 0.085, f: 0.147, pieceWeight: 150 },

        // Veggies
        'tomato': { unit: 'g', kcal: 0.18, p: 0.009, c: 0.039, f: 0.002 },
        'cucumber': { unit: 'g', kcal: 0.16, p: 0.007, c: 0.036, f: 0.001 },
        'carrot': { unit: 'g', kcal: 0.41, p: 0.009, c: 0.1, f: 0.002 },
        'onion': { unit: 'g', kcal: 0.4, p: 0.011, c: 0.09, f: 0.001 },
        'spinach': { unit: 'g', kcal: 0.23, p: 0.029, c: 0.036, f: 0.004 },
        'broccoli': { unit: 'g', kcal: 0.34, p: 0.028, c: 0.07, f: 0.004 },
        'cauliflower': { unit: 'g', kcal: 0.25, p: 0.019, c: 0.05, f: 0.003 },
        'peas': { unit: 'g', kcal: 0.81, p: 0.05, c: 0.14, f: 0.004 },
        'corn': { unit: 'g', kcal: 0.86, p: 0.032, c: 0.19, f: 0.012 },
        'bell pepper': { unit: 'g', kcal: 0.2, p: 0.009, c: 0.046, f: 0.002 }, // Original 'bell pepper'
        'mushroom': { unit: 'g', kcal: 0.22, p: 0.031, c: 0.033, f: 0.003 }, // Original 'mushroom'
        'eggplant': { unit: 'g', kcal: 0.25, p: 0.01, c: 0.06, f: 0.002 }, // Original 'eggplant'

        // Healthy Fats & Nuts
        'almonds': { unit: 'g', kcal: 5.79, p: 0.21, c: 0.22, f: 0.5 },
        'peanuts': { unit: 'g', kcal: 5.67, p: 0.26, c: 0.16, f: 0.49 },
        'walnuts': { unit: 'g', kcal: 6.54, p: 0.15, c: 0.14, f: 0.65 },
        'peanut butter': { unit: 'g', kcal: 5.88, p: 0.25, c: 0.2, f: 0.5 },
        'avocado': { unit: 'piece', kcal: 234, p: 3, c: 12, f: 21 },
        'olive oil': { unit: 'ml', kcal: 8.84, p: 0, c: 0, f: 1 },
        'coconut oil': { unit: 'ml', kcal: 8.62, p: 0, c: 0, f: 1 },
        'chia': { unit: 'g', kcal: 4.86, p: 0.17, c: 0.42, f: 0.31 }, // Original 'chia'
        'flax': { unit: 'g', kcal: 5.34, p: 0.18, c: 0.29, f: 0.42 }, // Original 'flax'

        // Meals & Fast Food
        'burger': { unit: 'g', kcal: 2.5, p: 0.13, c: 0.3, f: 0.1, pieceWeight: 226 },
        'pizza slice': { unit: 'g', kcal: 2.85, p: 0.12, c: 0.36, f: 0.1, pieceWeight: 105 },
        'pizza': { unit: 'g', kcal: 2.85, p: 0.12, c: 0.36, f: 0.1, pieceWeight: 105 },
        'taco': { unit: 'g', kcal: 2.26, p: 0.09, c: 0.2, f: 0.13, pieceWeight: 75 },
        'biryani': { unit: 'g', kcal: 1.98, p: 0.06, c: 0.22, f: 0.08, pieceWeight: 350 },
        'shawarma': { unit: 'g', kcal: 2.66, p: 0.14, c: 0.22, f: 0.13, pieceWeight: 200 },
        'fries': { unit: 'g', kcal: 3.12, p: 0.034, c: 0.41, f: 0.15 },
        'samosa': { unit: 'g', kcal: 3.08, p: 0.06, c: 0.32, f: 0.17, pieceWeight: 50 },
        'dosa': { unit: 'g', kcal: 1.68, p: 0.04, c: 0.29, f: 0.04, pieceWeight: 100 },
        'idli': { unit: 'g', kcal: 1.46, p: 0.04, c: 0.30, f: 0.004, pieceWeight: 40 },
        'poha': { unit: 'g', kcal: 1.80, p: 0.03, c: 0.32, f: 0.05, pieceWeight: 200 },
        'upma': { unit: 'g', kcal: 1.80, p: 0.04, c: 0.23, f: 0.07, pieceWeight: 200 },
        'roti': { unit: 'g', kcal: 2.97, p: 0.11, c: 0.62, f: 0.02, pieceWeight: 40 },
        'chapati': { unit: 'g', kcal: 2.97, p: 0.11, c: 0.62, f: 0.02, pieceWeight: 40 },
        'naan': { unit: 'g', kcal: 3.10, p: 0.09, c: 0.50, f: 0.09, pieceWeight: 120 },
        'pav bread': { unit: 'g', kcal: 2.65, p: 0.09, c: 0.49, f: 0.03, pieceWeight: 50 },
        'salad': { unit: 'g', kcal: 0.15, p: 0.01, c: 0.03, f: 0.005 },

        // Liquid Meals & Drinks
        'soup': { unit: 'ml', kcal: 0.36, p: 0.018, c: 0.07, f: 0.005 },
        'chicken soup': { unit: 'ml', kcal: 0.75, p: 0.06, c: 0.04, f: 0.03 },
        'soda': { unit: 'ml', kcal: 0.41, p: 0, c: 0.106, f: 0 },
        'fruit juice': { unit: 'ml', kcal: 0.45, p: 0.005, c: 0.11, f: 0.001 },
        'energy drink': { unit: 'ml', kcal: 0.45, p: 0, c: 0.11, f: 0 },
        'coffee': { unit: 'ml', kcal: 0.02, p: 0.003, c: 0, f: 0 },
        'tea': { unit: 'ml', kcal: 0.01, p: 0, c: 0, f: 0 },
        'lassi': { unit: 'ml', kcal: 0.75, p: 0.03, c: 0.08, f: 0.03 },
        'buttermilk': { unit: 'ml', kcal: 0.40, p: 0.03, c: 0.048, f: 0.009 },
        'coconut water': { unit: 'ml', kcal: 0.19, p: 0.007, c: 0.037, f: 0.002 },

        // Snacks & Misc
        'popcorn': { unit: 'g', kcal: 3.87, p: 0.13, c: 0.78, f: 0.04 },
        'chips': { unit: 'g', kcal: 5.36, p: 0.07, c: 0.53, f: 0.35 },
        'chocolate': { unit: 'g', kcal: 5.35, p: 0.076, c: 0.59, f: 0.30 },
        'cookies': { unit: 'g', kcal: 5.02, p: 0.06, c: 0.65, f: 0.24 },
        'muffin': { unit: 'g', kcal: 3.77, p: 0.06, c: 0.53, f: 0.17 },
        'cake': { unit: 'g', kcal: 3.50, p: 0.05, c: 0.50, f: 0.15 },
        'sugar': { unit: 'g', kcal: 3.87, p: 0, c: 1, f: 0 },
        'honey': { unit: 'g', kcal: 3.04, p: 0.003, c: 0.82, f: 0 },
        'mayonnaise': { unit: 'g', kcal: 6.80, p: 0.01, c: 0.01, f: 0.75 },
        'ketchup': { unit: 'g', kcal: 1.12, p: 0.013, c: 0.26, f: 0.002 },

        // Indian & Asian Foods (Basis per 100g -> per 1g)
        'biryani': { unit: 'g', kcal: 1.98, p: 0.06, c: 0.22, f: 0.080 },
        'chicken biryani': { unit: 'g', kcal: 2.15, p: 0.08, c: 0.24, f: 0.08 },
        'egg biryani': { unit: 'g', kcal: 2.00, p: 0.07, c: 0.25, f: 0.07 },
        'dal': { unit: 'g', kcal: 1.16, p: 0.09, c: 0.20, f: 0.030 },
        'rajma': { unit: 'g', kcal: 1.27, p: 0.09, c: 0.23, f: 0.010 },
        'chole': { unit: 'g', kcal: 1.64, p: 0.09, c: 0.27, f: 0.030 },
        'sambar': { unit: 'g', kcal: 1.40, p: 0.07, c: 0.18, f: 0.040 },
        'rasam': { unit: 'g', kcal: 0.30, p: 0.02, c: 0.04, f: 0.005 },
        'palak paneer': { unit: 'g', kcal: 1.80, p: 0.11, c: 0.06, f: 0.120 },
        'shahi paneer': { unit: 'g', kcal: 2.65, p: 0.10, c: 0.07, f: 0.200 },
        'paneer': { unit: 'g', kcal: 2.65, p: 0.18, c: 0.012, f: 0.200 },
        'idli': { unit: 'g', kcal: 1.46, p: 0.04, c: 0.30, f: 0.004 },
        'dosa': { unit: 'g', kcal: 1.68, p: 0.04, c: 0.29, f: 0.040 },
        'vada': { unit: 'g', kcal: 3.00, p: 0.07, c: 0.25, f: 0.200 },
        'poha': { unit: 'g', kcal: 1.80, p: 0.03, c: 0.32, f: 0.050 },
        'upma': { unit: 'g', kcal: 1.80, p: 0.04, c: 0.23, f: 0.070 },
        'paratha': { unit: 'g', kcal: 3.00, p: 0.07, c: 0.45, f: 0.100 },
        'chapati': { unit: 'g', kcal: 2.97, p: 0.11, c: 0.62, f: 0.020 },
        'naan': { unit: 'g', kcal: 3.10, p: 0.09, c: 0.50, f: 0.090 },
        'shawarma': { unit: 'g', kcal: 2.66, p: 0.14, c: 0.22, f: 0.130 },
        'samosa': { unit: 'g', kcal: 3.08, p: 0.06, c: 0.32, f: 0.170 },
        'pakora': { unit: 'g', kcal: 3.36, p: 0.10, c: 0.30, f: 0.200 },
        'ramen': { unit: 'g', kcal: 4.36, p: 0.09, c: 0.63, f: 0.170 },
        'sushi': { unit: 'g', kcal: 1.50, p: 0.06, c: 0.29, f: 0.025 },

        // Juices & Beverages (Basis per 100ml -> per 1ml)
        'apple juice': { unit: 'ml', kcal: 0.46, p: 0.001, c: 0.11, f: 0.001 },
        'orange juice': { unit: 'ml', kcal: 0.45, p: 0.007, c: 0.10, f: 0.002 },
        'grape juice': { unit: 'ml', kcal: 0.60, p: 0.004, c: 0.15, f: 0.001 },
        'pineapple juice': { unit: 'ml', kcal: 0.53, p: 0.004, c: 0.13, f: 0.001 },
        'mango juice': { unit: 'ml', kcal: 0.60, p: 0.006, c: 0.14, f: 0.002 },
        'tomato juice': { unit: 'ml', kcal: 0.17, p: 0.009, c: 0.039, f: 0.002 },
        'coconut water': { unit: 'ml', kcal: 0.19, p: 0.007, c: 0.037, f: 0.002 },
        'lemonade': { unit: 'ml', kcal: 0.40, p: 0, c: 0.10, f: 0 },
        'iced tea': { unit: 'ml', kcal: 0.30, p: 0, c: 0.07, f: 0 },
        'milkshake': { unit: 'ml', kcal: 1.12, p: 0.035, c: 0.15, f: 0.040 },

        // Nuts & Seeds
        'pistachios': { unit: 'g', kcal: 5.62, p: 0.20, c: 0.28, f: 0.450 },
        'cashews': { unit: 'g', kcal: 5.53, p: 0.18, c: 0.30, f: 0.440 },
        'hazelnuts': { unit: 'g', kcal: 6.28, p: 0.15, c: 0.17, f: 0.610 },
        'walnuts': { unit: 'g', kcal: 6.54, p: 0.15, c: 0.14, f: 0.650 },
        'chia seeds': { unit: 'g', kcal: 4.86, p: 0.17, c: 0.42, f: 0.310 },
        'flax seeds': { unit: 'g', kcal: 5.34, p: 0.18, c: 0.29, f: 0.420 },
        'pumpkin seeds': { unit: 'g', kcal: 5.59, p: 0.30, c: 0.15, f: 0.490 },

        // Sweets
        'gulab jamun': { unit: 'g', kcal: 3.30, p: 0.06, c: 0.45, f: 0.150 },
        'jalebi': { unit: 'g', kcal: 4.59, p: 0.04, c: 0.60, f: 0.220 },
        'rasgulla': { unit: 'piece', kcal: 186, p: 4, c: 40, f: 1 },

        // Final Specific Batch
        'tomato soup': { unit: 'ml', kcal: 0.35, p: 0.015, c: 0.07, f: 0.003 },
        'mushroom soup': { unit: 'ml', kcal: 0.50, p: 0.02, c: 0.06, f: 0.01 },
        'mushroom masala': { unit: 'g', kcal: 1.50, p: 0.04, c: 0.08, f: 0.09 },
        'bhindi masala': { unit: 'g', kcal: 1.35, p: 0.03, c: 0.11, f: 0.07 },
        'baingan bharta': { unit: 'g', kcal: 1.20, p: 0.03, c: 0.10, f: 0.06 },
        'dal tadka': { unit: 'g', kcal: 1.16, p: 0.09, c: 0.20, f: 0.03 },
        'jeera rice': { unit: 'g', kcal: 1.80, p: 0.04, c: 0.32, f: 0.04 },
        'lemon rice': { unit: 'g', kcal: 1.90, p: 0.03, c: 0.30, f: 0.06 },
        'chow mein': { unit: 'g', kcal: 1.70, p: 0.05, c: 0.25, f: 0.06 },
        'hakka noodles': { unit: 'g', kcal: 1.80, p: 0.05, c: 0.28, f: 0.06 },
        'pad thai': { unit: 'g', kcal: 2.10, p: 0.08, c: 0.25, f: 0.09 }
    };

    analyzeFood(query) {
        const text = query.toLowerCase().trim();
        const db = Calculator.FOOD_DB;

        // --- Portion Mapping (Weights in grams or ml) ---
        const portionMap = {
            'slice': 105,
            'pieces': 1,
            'piece': 1,
            'bowl': 300,
            'cup': 250,
            'glass': 250,
            'plate': 400,
            'serving': 150,
            'medium': 1,
            'unit': 1,
            'ml': 1,
            'g': 1,
            'gram': 1,
            'grams': 1,
            'kg': 1000,
            'kilogram': 1000,
            'kilograms': 1000,
            'l': 1000,
            'liter': 1000,
            'litre': 1000,
            'liters': 1000,
            'litres': 1000
        };

        // --- Improved Parsing Logic ---
        // 1. Extract Number
        const amountMatch = text.match(/(\d+\.?\d*)/);
        let amount = amountMatch ? parseFloat(amountMatch[0]) : 1;

        // 2. Detect Portion Unit
        let portionUnit = null;
        for (const unit in portionMap) {
            // Check for unit with word boundary or directly following a number
            const regex = new RegExp(`(?:\\d|^|\\s)${unit}(?:\\b|\\s|$)`, 'i');
            if (regex.test(text)) {
                portionUnit = unit;
                break;
            }
        }

        // 3. Find Match in DB
        const sortedKeys = Object.keys(db).sort((a, b) => b.length - a.length);
        let foodKey = sortedKeys.find(key => text.includes(key));

        if (foodKey) {
            const food = db[foodKey];
            let multiplier = amount;

            // Handle Unit Scaling & Conversions
            if (portionUnit) {
                // e.g., "1kg" -> 1 * 1000 = 1000g. "1 bowl" -> 1 * 300 = 300g.
                multiplier = amount * portionMap[portionUnit];
            } else {
                // No unit given (e.g., "1 apple")
                // Use pieceWeight as the multiplier if it exists
                multiplier = food.pieceWeight ? (amount * food.pieceWeight) : amount;
            }

            return {
                name: foodKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                calories: Math.round(food.kcal * multiplier),
                protein: Math.round((food.p || 0) * multiplier),
                carbs: Math.round((food.c || 0) * multiplier),
                fats: Math.round((food.f || 0) * multiplier),
                confidence: 1.0
            };
        }

        // Fallback
        return {
            name: query,
            calories: Math.round(amount * 2),
            protein: Math.round(amount * 0.1),
            carbs: Math.round(amount * 0.2),
            fats: Math.round(amount * 0.05),
            confidence: 0.3
        };
    }
}
