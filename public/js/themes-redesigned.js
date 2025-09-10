// BeautyCita Theme Manager - Redesigned
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('beautycita-theme') || 'light';
        this.themes = {
            light: {
                name: 'Light',
                icon: '☀️'
            },
            dark: {
                name: 'Dark', 
                icon: '🌙'
            },
            black: {
                name: 'Black',
                icon: '⚫'
            }
        };
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
        this.updateActiveTheme();
    }

    setupEventListeners() {
        // Paintbrush toggle
        const paintbrush = document.getElementById('themePaintbrush');
        const popup = document.getElementById('themePopup');
        
        if (paintbrush && popup) {
            paintbrush.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleThemePopup();
            });

            // Theme option clicks
            const themeOptions = popup.querySelectorAll('.theme-option');
            themeOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const theme = option.dataset.theme;
                    this.setTheme(theme);
                });
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!paintbrush.contains(e.target)) {
                    this.closeThemePopup();
                }
            });
        }
    }

    toggleThemePopup() {
        const popup = document.getElementById('themePopup');
        const isOpen = popup.classList.contains('active');
        
        if (isOpen) {
            this.closeThemePopup();
        } else {
            this.openThemePopup();
        }
    }

    openThemePopup() {
        const popup = document.getElementById('themePopup');
        const overlay = document.getElementById('frostedOverlay');
        
        // Show overlay with frosted effect
        overlay.classList.add('active');
        
        // Add popup animation
        setTimeout(() => {
            popup.classList.add('active');
        }, 150);
    }

    closeThemePopup() {
        const popup = document.getElementById('themePopup');
        const overlay = document.getElementById('frostedOverlay');
        
        popup.classList.remove('active');
        
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 300);
    }

    setTheme(theme) {
        if (this.themes[theme]) {
            this.currentTheme = theme;
            this.applyTheme(theme);
            this.updateActiveTheme();
            localStorage.setItem('beautycita-theme', theme);
            this.closeThemePopup();
            
            // Trigger theme change animation
            this.animateThemeChange();
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update meta theme color
        let themeColor;
        switch (theme) {
            case 'dark':
                themeColor = '#1a1a1a';
                break;
            case 'black':
                themeColor = '#000000';
                break;
            default:
                themeColor = '#ffffff';
        }
        
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = themeColor;
    }

    updateActiveTheme() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.currentTheme);
        });
    }

    animateThemeChange() {
        const body = document.body;
        body.style.transition = 'all 0.3s ease';
        
        // Brief flash animation
        body.style.opacity = '0.9';
        setTimeout(() => {
            body.style.opacity = '1';
            body.style.transition = '';
        }, 150);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getThemeInfo(theme = this.currentTheme) {
        return this.themes[theme];
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ThemeManager = new ThemeManager();
});