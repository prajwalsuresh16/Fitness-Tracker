class StorageManager {
    constructor() {
        this.prefix = 'fittrack_guest_'; // Default
    }

    setPrefix(username) {
        this.prefix = `fittrack_${username}_`;
        console.log(`Storage prefix set to: ${this.prefix}`);
    }

    save(key, data) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(data));
            console.log(`Saved ${key}:`, data); // Debug
            return true;
        } catch (e) {
            console.error('Storage Save Error', e);
            return false;
        }
    }

    has(key) {
        return localStorage.getItem(this.prefix + key) !== null;
    }

    load(key) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage Load Error', e);
            return null;
        }
    }



    // --- Phase 4: Data Management ---

    exportToCSV(workouts, meals) {
        if (!workouts && !meals) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Type,Date,Item,Calories,Details\n";

        // Process Workouts
        workouts.forEach(w => {
            const date = new Date(w.timestamp).toLocaleDateString();
            csvContent += `Workout,${date},${w.type},${w.calories},${w.duration} min\n`;
        });

        // Process Meals
        meals.forEach(m => {
            const date = new Date(m.timestamp).toLocaleDateString();
            csvContent += `Meal,${date},${m.name},${m.calories},P:${m.protein} C:${m.carbs} F:${m.fat}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "fittrack_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async exportChartsToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("FitTrack Pro - Weekly Report", 10, 10);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 20);

        // Capture Charts
        const mainCanvas = document.getElementById('mainChart');
        const macroCanvas = document.getElementById('macroChart');

        if (mainCanvas) {
            const mainImg = mainCanvas.toDataURL("image/png", 1.0);
            doc.text("Activity Progress", 10, 30);
            doc.addImage(mainImg, 'PNG', 10, 35, 180, 80);
        }

        if (macroCanvas) {
            const macroImg = macroCanvas.toDataURL("image/png", 1.0);
            doc.text("Macro Breakdown", 10, 125);
            doc.addImage(macroImg, 'PNG', 10, 130, 90, 90);
        }

        doc.save("fittrack_charts.pdf");
    }

    clearAll() {
        // Clear all keys for this specific user prefix
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
        location.reload();
    }
}
