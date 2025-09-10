// BeautyCita Animation Manager - Redesigned
class AnimationManager {
    constructor() {
        this.observers = new Map();
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupParticleSystem();
        this.setupRippleEffects();
        this.initModalAnimations();
    }

    setupScrollAnimations() {
        // Intersection Observer for scroll animations
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    entry.target.classList.remove('animate-out');
                } else {
                    entry.target.classList.add('animate-out');
                    entry.target.classList.remove('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements with animation classes
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            scrollObserver.observe(el);
        });

        this.observers.set('scroll', scrollObserver);
    }

    setupParticleSystem() {
        const particleContainer = document.querySelector('.hero-particles');
        if (!particleContainer) return;

        // Create floating particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random positioning and animation delay
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            
            particleContainer.appendChild(particle);
        }
    }

    setupRippleEffects() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.btn, .nav-item, .service-card, .theme-option');
            if (!target) return;

            this.createRipple(e, target);
        });
    }

    createRipple(event, element) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.className = 'ripple-effect';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    initModalAnimations() {
        this.modalAnimationConfig = {
            duration: 300,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        };
    }

    // Modal animation methods
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('frostedOverlay');
        const content = modal.querySelector('.modal-content');
        
        if (!modal || !overlay || !content) return;

        // Reset transforms
        modal.style.display = 'flex';
        overlay.style.display = 'block';
        content.style.transform = 'translateX(100%) translateY(100%) scale(0.8)';
        content.style.opacity = '0';

        // Force reflow
        modal.offsetHeight;

        // Start animation sequence
        this.animateModalOpen(modal, overlay, content);
    }

    animateModalOpen(modal, overlay, content) {
        const { duration, easing } = this.modalAnimationConfig;

        // Step 1: Zoom out background and show frosted overlay
        document.body.style.transform = 'scale(0.95)';
        document.body.style.transition = `transform ${duration}ms ${easing}`;
        
        overlay.style.opacity = '0';
        overlay.style.transition = `opacity ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            overlay.classList.add('active');
        });

        // Step 2: Slide in modal from bottom-right with elastic bounce
        setTimeout(() => {
            content.style.transition = `all ${duration}ms ${easing}`;
            content.style.transform = 'translateX(0) translateY(0) scale(1)';
            content.style.opacity = '1';
            
            modal.classList.add('active');
        }, duration);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('frostedOverlay');
        const content = modal.querySelector('.modal-content');
        
        if (!modal || !overlay || !content) return;

        this.animateModalClose(modal, overlay, content);
    }

    animateModalClose(modal, overlay, content) {
        const { duration, easing } = this.modalAnimationConfig;

        // Step 1: Slide out modal to bottom-right
        content.style.transition = `all ${duration}ms ${easing}`;
        content.style.transform = 'translateX(100%) translateY(100%) scale(0.8)';
        content.style.opacity = '0';

        // Step 2: Hide frosted overlay
        setTimeout(() => {
            overlay.style.transition = `opacity ${duration}ms ease`;
            overlay.style.opacity = '0';
            overlay.classList.remove('active');
        }, duration);

        // Step 3: Restore background scale
        setTimeout(() => {
            document.body.style.transform = 'scale(1)';
            document.body.style.transition = `transform ${duration}ms ${easing}`;
        }, duration * 1.5);

        // Step 4: Hide modal
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('active');
            overlay.style.display = 'none';
            document.body.style.transform = '';
            document.body.style.transition = '';
        }, duration * 3);
    }

    // Notification animations
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(notification);

        // Slide in animation
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification(notification);
            }, duration);
        }
    }

    hideNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // FAB animation
    pulseFAB() {
        const fab = document.querySelector('.fab-button');
        if (!fab) return;

        fab.classList.add('pulse');
        setTimeout(() => {
            fab.classList.remove('pulse');
        }, 1000);
    }

    // Loading animations
    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (!overlay) return;

        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (!overlay) return;

        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }

    // Utility method to check if user prefers reduced motion
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Cleanup method
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Initialize animation manager
document.addEventListener('DOMContentLoaded', () => {
    window.AnimationManager = new AnimationManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
}