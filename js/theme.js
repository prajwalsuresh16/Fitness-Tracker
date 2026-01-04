class ThemeManager {
    constructor() {
        this.btn = document.getElementById('theme-btn');
        this.html = document.documentElement;
        this.icon = this.btn.querySelector('i');
    }

    init() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);

        this.btn.addEventListener('click', () => {
            const current = this.html.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    }

    setTheme(theme) {
        this.html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (theme === 'dark') {
            this.icon.classList.remove('fa-sun');
            this.icon.classList.add('fa-moon');
        } else {
            this.icon.classList.remove('fa-moon');
            this.icon.classList.add('fa-sun');
        }
    }
}
