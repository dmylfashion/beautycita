/* ===========================================
   BEAUTYCITA - NOTIFICATION SYSTEM
   =========================================== */

class BeautyCitaNotificationSystem {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.container = null;
    }

    // Initialize notification system
    init() {
        this.container = document.getElementById('notifications');
        if (!this.container) {
            console.warn('Notifications container not found');
            return false;
        }
        return true;
    }

    // Show notification
    show(message, type = 'info', duration = this.defaultDuration) {
        if (!this.container && !this.init()) {
            console.warn('Cannot show notification - container not initialized');
            return;
        }

        const notification = {
            id: this.generateId(),
            message,
            type,
            duration,
            timestamp: Date.now()
        };

        this.notifications.push(notification);
        this.render(notification);
        this.scheduleRemoval(notification.id, duration);
        this.enforceMaxNotifications();
    }

    // Generate unique notification ID
    generateId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Render notification element
    render(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-enter ${notification.type}`;
        element.dataset.id = notification.id;
        
        element.innerHTML = `
            <div class="notification-icon">
                ${this.getIcon(notification.type)}
            </div>
            <div class="notification-content">
                <div class="notification-title">${this.getTitle(notification.type)}</div>
                <div class="notification-message">${this.escapeHtml(notification.message)}</div>
            </div>
            <button class="notification-close" onclick="BeautyCitaNotifications.dismiss('${notification.id}')">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add event listeners
        element.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-close')) {
                return; // Let the onclick handle it
            }
            this.handleNotificationClick(notification);
        });

        this.container.appendChild(element);

        // Trigger animation
        requestAnimationFrame(() => {
            element.classList.add('visible');
        });
    }

    // Get icon for notification type
    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            booking: '<i class="fas fa-calendar-check"></i>',
            message: '<i class="fas fa-comment"></i>',
            payment: '<i class="fas fa-credit-card"></i>',
            location: '<i class="fas fa-map-marker-alt"></i>'
        };
        return icons[type] || icons.info;
    }

    // Get title for notification type
    getTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information',
            booking: 'Booking Update',
            message: 'New Message',
            payment: 'Payment',
            location: 'Location Update'
        };
        return titles[type] || 'Notification';
    }

    // Schedule notification removal
    scheduleRemoval(id, duration) {
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }
    }

    // Dismiss notification
    dismiss(id) {
        const element = document.querySelector(`[data-id="${id}"]`);
        if (!element) return;

        // Add exit animation
        element.classList.add('notification-exit');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            // Remove from notifications array
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    // Dismiss all notifications
    dismissAll() {
        const elements = this.container.querySelectorAll('.notification');
        elements.forEach(element => {
            const id = element.dataset.id;
            this.dismiss(id);
        });
    }

    // Enforce maximum notifications limit
    enforceMaxNotifications() {
        if (this.notifications.length > this.maxNotifications) {
            const excessCount = this.notifications.length - this.maxNotifications;
            const oldestNotifications = this.notifications
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(0, excessCount);
            
            oldestNotifications.forEach(notification => {
                this.dismiss(notification.id);
            });
        }
    }

    // Handle notification click events
    handleNotificationClick(notification) {
        // Emit custom event for other systems to handle
        const event = new CustomEvent('notificationClick', {
            detail: notification
        });
        document.dispatchEvent(event);

        // Auto-dismiss on click unless it's an error or persistent notification
        if (notification.type !== 'error' && notification.duration !== 0) {
            this.dismiss(notification.id);
        }
    }

    // Utility: Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Specific notification types for common use cases

    // Booking-related notifications
    showBookingConfirmed(appointmentId, stylistName) {
        this.show(`Your appointment with ${stylistName} has been confirmed!`, 'booking', 7000);
    }

    showBookingCancelled(reason = '') {
        const message = reason ? `Appointment cancelled: ${reason}` : 'Your appointment has been cancelled';
        this.show(message, 'warning', 6000);
    }

    showStylistEnRoute(eta, stylistName) {
        this.show(`${stylistName} is on the way! ETA: ${eta} minutes`, 'booking', 0); // Persistent
    }

    showStylistArrived(stylistName) {
        this.show(`${stylistName} has arrived at your location`, 'success', 8000);
    }

    showServiceCompleted() {
        this.show('Service completed! Please rate your experience', 'success', 10000);
    }

    // Payment notifications
    showPaymentProcessing() {
        this.show('Processing payment...', 'payment', 3000);
    }

    showPaymentSuccess(amount) {
        this.show(`Payment of ${amount} processed successfully`, 'success', 5000);
    }

    showPaymentFailed(reason = '') {
        const message = reason ? `Payment failed: ${reason}` : 'Payment failed. Please try again.';
        this.show(message, 'error', 8000);
    }

    // Message notifications
    showNewMessage(senderName) {
        this.show(`New message from ${senderName}`, 'message', 6000);
    }

    // Location notifications
    showLocationShared() {
        this.show('Your location is being shared with the stylist', 'location', 4000);
    }

    showLocationPrivacyReminder() {
        this.show('Your location sharing will stop after the appointment', 'info', 6000);
    }

    // System notifications
    showConnectionLost() {
        this.show('Connection lost. Trying to reconnect...', 'warning', 0); // Persistent
    }

    showConnectionRestored() {
        this.show('Connection restored', 'success', 3000);
    }

    showUpdateAvailable() {
        this.show('A new version is available. Refresh to update.', 'info', 0); // Persistent
    }

    // Auth notifications
    showLoginSuccess(userName) {
        this.show(`Welcome back, ${userName}!`, 'success', 4000);
    }

    showLogoutSuccess() {
        this.show('You have been logged out successfully', 'info', 3000);
    }

    showAuthRequired() {
        this.show('Please log in to continue', 'warning', 5000);
    }

    // Error notifications with retry functionality
    showRetryableError(message, retryCallback) {
        const notificationId = this.generateId();
        const notification = {
            id: notificationId,
            message,
            type: 'error',
            duration: 0, // Persistent
            timestamp: Date.now(),
            retryCallback
        };

        this.notifications.push(notification);
        
        const element = document.createElement('div');
        element.className = `notification notification-enter error`;
        element.dataset.id = notificationId;
        
        element.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">Error</div>
                <div class="notification-message">${this.escapeHtml(message)}</div>
                <div class="notification-actions">
                    <button class="retry-btn" onclick="BeautyCitaNotifications.retryAction('${notificationId}')">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            </div>
            <button class="notification-close" onclick="BeautyCitaNotifications.dismiss('${notificationId}')">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(element);
        requestAnimationFrame(() => element.classList.add('visible'));
    }

    // Retry action for retryable errors
    retryAction(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && notification.retryCallback) {
            this.dismiss(notificationId);
            notification.retryCallback();
        }
    }

    // Progress notifications for long operations
    showProgress(message, progress = 0) {
        const notificationId = this.generateId();
        const notification = {
            id: notificationId,
            message,
            type: 'info',
            duration: 0, // Persistent until updated
            timestamp: Date.now(),
            progress
        };

        this.notifications.push(notification);
        
        const element = document.createElement('div');
        element.className = `notification notification-enter info progress-notification`;
        element.dataset.id = notificationId;
        
        element.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">Processing</div>
                <div class="notification-message">${this.escapeHtml(message)}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        `;

        this.container.appendChild(element);
        requestAnimationFrame(() => element.classList.add('visible'));
        
        return notificationId;
    }

    // Update progress notification
    updateProgress(notificationId, message, progress) {
        const element = document.querySelector(`[data-id="${notificationId}"]`);
        if (!element) return;

        const messageEl = element.querySelector('.notification-message');
        const progressFill = element.querySelector('.progress-fill');
        
        if (messageEl) messageEl.textContent = message;
        if (progressFill) progressFill.style.width = `${progress}%`;

        // Auto-dismiss when complete
        if (progress >= 100) {
            setTimeout(() => this.dismiss(notificationId), 2000);
        }
    }

    // Batch notifications for multiple operations
    showBatch(notifications) {
        notifications.forEach((notification, index) => {
            setTimeout(() => {
                this.show(notification.message, notification.type, notification.duration);
            }, index * 200); // Stagger animations
        });
    }

    // Get notification history (for debugging)
    getHistory() {
        return [...this.notifications];
    }

    // Clear notification history
    clearHistory() {
        this.notifications = [];
    }

    // Check if notifications are supported and permissions
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('Browser notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    // Show browser notification (for background notifications)
    async showBrowserNotification(title, options = {}) {
        if (await this.requestPermission()) {
            const notification = new Notification(title, {
                icon: '/images/logo-192x192.png',
                badge: '/images/logo-96x96.png',
                timestamp: Date.now(),
                requireInteraction: false,
                ...options
            });

            // Auto-close after duration
            if (options.duration) {
                setTimeout(() => notification.close(), options.duration);
            }

            return notification;
        }
        
        return null;
    }
}

// Global notification system instance
window.BeautyCitaNotifications = new BeautyCitaNotificationSystem();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    BeautyCitaNotifications.init();
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeautyCitaNotificationSystem;
}