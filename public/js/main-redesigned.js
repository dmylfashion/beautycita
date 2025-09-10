/* ===========================================
   BEAUTYCITA - REDESIGNED MAIN APPLICATION
   =========================================== */

class BeautyCitaRedesigned {
    constructor() {
        this.socket = null;
        this.user = null;
        this.currentBooking = {};
        this.theme = localStorage.getItem('beautycita-theme') || 'light';
        this.initialized = false;
        this.activeModals = new Set();
        this.animationQueue = [];
        this.isAnimating = false;
    }

    // Initialize the application
    async init() {
        if (this.initialized) return;
        
        try {
            // Set initial theme
            this.setTheme(this.theme);
            
            // Initialize components
            await this.initAuth();
            this.initEventListeners();
            this.initAnimations();
            this.initSocket();
            this.initBottomNavigation();
            this.initThemePaintbrush();
            this.loadInitialData();
            
            // Prevent zoom and text selection
            this.initAccessibilityBlocks();
            
            this.initialized = true;
            console.log('BeautyCita Redesigned app initialized successfully');
        } catch (error) {
            console.error('Failed to initialize BeautyCita Redesigned app:', error);
            this.showNotification('Failed to load application', 'error');
        }
    }

    // Prevent zoom and text selection
    initAccessibilityBlocks() {
        // Prevent pinch zoom
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });

        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Block text selection globally but allow in specific elements
        document.addEventListener('selectstart', (e) => {
            const allowedElements = ['INPUT', 'TEXTAREA'];
            const hasAllowClass = e.target.closest('.allow-select');
            
            if (!allowedElements.includes(e.target.tagName) && !hasAllowClass) {
                e.preventDefault();
                return false;
            }
        });
    }

    // Initialize Bottom Navigation
    initBottomNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-section]');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Scroll to section
                const section = item.dataset.section;
                this.scrollToSection(section);
                
                // Haptic feedback for mobile
                if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }
            });
        });

        // Update active navigation based on scroll
        window.addEventListener('scroll', this.throttle(() => {
            this.updateActiveNavigation();
        }, 100));
    }

    // Initialize Theme Paintbrush
    initThemePaintbrush() {
        const paintbrush = document.getElementById('themePaintbrush');
        const paintbrushIcon = paintbrush.querySelector('.paintbrush-icon');
        const themePopup = document.getElementById('themePopup');
        const themeOptions = themePopup.querySelectorAll('.theme-option');

        paintbrushIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleThemePopup();
        });

        themeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = option.dataset.theme;
                this.setTheme(theme);
                this.closeThemePopup();
                
                // Haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate([50, 50, 50]);
                }
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!paintbrush.contains(e.target)) {
                this.closeThemePopup();
            }
        });
    }

    // Toggle Theme Popup
    toggleThemePopup() {
        const themePopup = document.getElementById('themePopup');
        const isActive = themePopup.classList.contains('active');
        
        if (isActive) {
            this.closeThemePopup();
        } else {
            this.openThemePopup();
        }
    }

    // Open Theme Popup
    openThemePopup() {
        const themePopup = document.getElementById('themePopup');
        const paintbrushIcon = document.querySelector('.paintbrush-icon');
        
        themePopup.classList.add('active');
        paintbrushIcon.style.transform = 'scale(1.2) rotate(45deg)';
        
        // Update active theme option
        this.updateActiveThemeOption();
    }

    // Close Theme Popup
    closeThemePopup() {
        const themePopup = document.getElementById('themePopup');
        const paintbrushIcon = document.querySelector('.paintbrush-icon');
        
        themePopup.classList.remove('active');
        paintbrushIcon.style.transform = '';
    }

    // Update Active Theme Option
    updateActiveThemeOption() {
        const themeOptions = document.querySelectorAll('.theme-popup .theme-option');
        themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === this.theme) {
                option.classList.add('active');
            }
        });
    }

    // Set Theme with Enhanced Animation
    setTheme(theme) {
        if (this.theme === theme) return;
        
        this.theme = theme;
        
        // Apply theme transition effect
        document.documentElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        document.documentElement.setAttribute('data-theme', theme);
        
        localStorage.setItem('beautycita-theme', theme);
        
        // Update theme options
        this.updateActiveThemeOption();
        
        // Remove transition after animation
        setTimeout(() => {
            document.documentElement.style.transition = '';
        }, 300);
        
        this.showNotification(`Switched to ${theme} theme`, 'success', 2000);
    }

    // Scroll to Section with Animation
    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 20; // Small offset since no top nav
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Update Active Navigation Based on Scroll
    updateActiveNavigation() {
        const sections = ['home', 'services', 'stylists'];
        const navItems = document.querySelectorAll('.nav-item[data-section]');
        
        let activeSection = 'home';
        
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                const rect = element.getBoundingClientRect();
                if (rect.top <= 100 && rect.bottom >= 100) {
                    activeSection = sectionId;
                }
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === activeSection) {
                item.classList.add('active');
            }
        });
    }

    // Enhanced Modal System
    async showModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal || this.activeModals.has(modalId)) return;

        this.activeModals.add(modalId);
        
        // Start background animation sequence
        await this.animateModalOpen(modal, options);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    async hideModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal || !this.activeModals.has(modalId)) return;

        this.activeModals.delete(modalId);
        
        // Start closing animation sequence
        await this.animateModalClose(modal, options);
        
        // Restore body scroll if no modals are active
        if (this.activeModals.size === 0) {
            document.body.style.overflow = '';
        }
    }

    // Modal Opening Animation Sequence
    async animateModalOpen(modal, options = {}) {
        const mainContent = document.getElementById('mainContent');
        const frostedOverlay = document.getElementById('frostedOverlay');
        const modalContent = modal.querySelector('.modal-content');

        // Step 1: Zoom out background (300ms)
        mainContent.classList.add('modal-open');
        
        // Step 2: Frosted glass effect fills from center (300ms)
        setTimeout(() => {
            frostedOverlay.classList.add('active');
        }, 100);
        
        // Step 3: Show modal and animate in from bottom-right (300ms)
        setTimeout(() => {
            modal.classList.add('active');
            
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
        }, 200);

        return new Promise(resolve => {
            setTimeout(resolve, 600);
        });
    }

    // Modal Closing Animation Sequence (Reverse)
    async animateModalClose(modal, options = {}) {
        const mainContent = document.getElementById('mainContent');
        const frostedOverlay = document.getElementById('frostedOverlay');

        // Step 1: Hide modal content
        modal.classList.remove('active');
        
        // Step 2: Remove frosted glass effect
        setTimeout(() => {
            frostedOverlay.classList.remove('active');
        }, 100);
        
        // Step 3: Restore background scale
        setTimeout(() => {
            mainContent.classList.remove('modal-open');
        }, 200);

        return new Promise(resolve => {
            setTimeout(resolve, 300);
        });
    }

    // Enhanced Event Listeners
    initEventListeners() {
        // Close modals on outside click (tappable area)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('enhanced-modal')) {
                const modalId = e.target.id;
                this.closeModalByType(modalId);
            }
        });

        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Service category selection with enhanced feedback
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const category = card.dataset.category;
                
                // Add click animation
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 150);
                
                // Haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate(75);
                }
                
                this.selectServiceCategory(category);
            });
        });

        // Enhanced CTA buttons
        document.querySelectorAll('.cta-button').forEach(button => {
            this.addButtonEnhancement(button);
        });

        // Enhanced FAB button
        const fabButton = document.querySelector('.fab-button');
        if (fabButton) {
            fabButton.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Enhanced click animation
                fabButton.style.transform = 'scale(0.9) rotate(90deg)';
                setTimeout(() => {
                    fabButton.style.transform = '';
                }, 200);
                
                // Strong haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100, 50, 100]);
                }
            });
        }
    }

    // Add Button Enhancement
    addButtonEnhancement(button) {
        button.addEventListener('click', (e) => {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
            
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        });
    }

    // Close Modal by Type
    closeModalByType(modalId) {
        switch(modalId) {
            case 'bookingModal':
                this.closeBookingModal();
                break;
            case 'authModal':
                this.closeAuthModal();
                break;
            case 'chatModal':
                this.closeChatModal();
                break;
            case 'trackingModal':
                this.closeTrackingModal();
                break;
            case 'userMenuModal':
                this.closeUserMenu();
                break;
            default:
                this.hideModal(modalId);
        }
    }

    // Close All Modals
    async closeAllModals() {
        const promises = Array.from(this.activeModals).map(modalId => 
            this.closeModalByType(modalId)
        );
        await Promise.all(promises);
    }

    // Booking Modal Methods
    startBooking() {
        this.currentBooking = {
            step: 1,
            service: null,
            category: null,
            date: null,
            time: null,
            stylistId: null,
            location: null
        };
        
        this.showBookingModal();
    }

    async showBookingModal() {
        await this.showModal('bookingModal');
        // Load booking content
        this.loadBookingStep(1);
    }

    async closeBookingModal() {
        await this.hideModal('bookingModal');
    }

    // Auth Modal Methods
    async showLogin() {
        await this.showModal('authModal');
        document.getElementById('authTitle').textContent = 'Welcome Back';
        // Load login form
        this.loadAuthContent('login');
    }

    async showSignup() {
        await this.showModal('authModal');
        document.getElementById('authTitle').textContent = 'Join BeautyCita';
        // Load signup form
        this.loadAuthContent('signup');
    }

    async closeAuthModal() {
        await this.hideModal('authModal');
    }

    // User Menu Methods
    async showUserMenu() {
        await this.showModal('userMenuModal');
        this.updateUserMenuContent();
    }

    async closeUserMenu() {
        await this.hideModal('userMenuModal');
    }

    updateUserMenuContent() {
        const userMenuName = document.getElementById('userMenuName');
        const userMenuEmail = document.getElementById('userMenuEmail');
        const guestSection = document.getElementById('guestMenuSection');
        const userSection = document.getElementById('userMenuSection');
        
        if (this.user) {
            userMenuName.textContent = this.user.display_name || 'User';
            userMenuEmail.textContent = this.user.email || '';
            guestSection.style.display = 'none';
            userSection.style.display = 'block';
        } else {
            userMenuName.textContent = 'Welcome';
            userMenuEmail.textContent = 'Please sign in';
            guestSection.style.display = 'block';
            userSection.style.display = 'none';
        }
    }

    // Chat Modal Methods
    async showChatModal() {
        await this.showModal('chatModal');
    }

    async closeChatModal() {
        await this.hideModal('chatModal');
    }

    // Tracking Modal Methods
    async showTrackingModal() {
        await this.showModal('trackingModal');
    }

    async closeTrackingModal() {
        await this.hideModal('trackingModal');
    }

    // Enhanced Notification System
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${iconMap[type]}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'notificationSlideOut 0.3s ease-in forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
        
        // Haptic feedback for errors
        if (type === 'error' && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }

    // Initialize particle animations
    initAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Add elastic bounce animation
                    if (entry.target.classList.contains('service-card')) {
                        entry.target.classList.add('elastic-bounce');
                    }
                }
            });
        }, observerOptions);

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        this.initParticles();
    }

    // Enhanced particle system
    initParticles() {
        const particlesContainer = document.querySelector('.hero-particles');
        if (!particlesContainer) return;

        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            
            // Random size variation
            const size = 4 + Math.random() * 8;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            particlesContainer.appendChild(particle);

            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 30000);
        };

        // Create initial particles
        for (let i = 0; i < 15; i++) {
            setTimeout(() => createParticle(), i * 2000);
        }

        // Continue creating particles
        setInterval(createParticle, 3000);
    }

    // Utility: Throttle function
    throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        }
    }

    // Authentication methods (stub implementations)
    async initAuth() {
        const token = localStorage.getItem('beautycita-token');
        if (token) {
            try {
                // Simulate API call
                // const user = await BeautyCitaAPI.getCurrentUser();
                // this.setUser(user);
            } catch (error) {
                console.warn('Invalid token, clearing auth:', error);
                localStorage.removeItem('beautycita-token');
            }
        }
    }

    setUser(user) {
        this.user = user;
        this.updateUserMenuContent();
    }

    async logout() {
        try {
            // await BeautyCitaAPI.logout();
            localStorage.removeItem('beautycita-token');
            this.user = null;
            this.updateUserMenuContent();
            this.showNotification('Successfully logged out', 'success');
            
            if (this.socket) {
                this.socket.disconnect();
            }
        } catch (error) {
            console.error('Logout failed:', error);
            this.showNotification('Logout failed', 'error');
        }
    }

    // Socket methods (stub implementations)
    initSocket() {
        // Socket initialization would go here
        console.log('Socket initialization (stub)');
    }

    // Load initial data
    async loadInitialData() {
        try {
            // Load featured stylists
            // const stylists = await BeautyCitaAPI.getFeaturedStylists();
            // this.renderFeaturedStylists(stylists);
            console.log('Loading initial data (stub)');
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    // Booking methods (stub implementations)
    selectServiceCategory(category) {
        this.currentBooking.category = category;
        this.startBooking();
    }

    loadBookingStep(step) {
        console.log(`Loading booking step ${step} (stub)`);
    }

    loadAuthContent(type) {
        console.log(`Loading auth content: ${type} (stub)`);
    }

    // Profile methods (stub implementations)
    showProfile() {
        console.log('Show profile (stub)');
    }

    showBookings() {
        console.log('Show bookings (stub)');
    }

    showSettings() {
        console.log('Show settings (stub)');
    }
}

// Global instance
window.BeautyCita = new BeautyCitaRedesigned();

// CSS for ripple effect
const rippleCSS = `
.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: scale(0);
    animation: rippleEffect 0.6s linear;
    pointer-events: none;
}

@keyframes rippleEffect {
    to {
        transform: scale(2);
        opacity: 0;
    }
}

@keyframes notificationSlideOut {
    to {
        transform: translateX(100%) scale(0.8);
        opacity: 0;
    }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    BeautyCita.init();
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeautyCitaRedesigned;
}