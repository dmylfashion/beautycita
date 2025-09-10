/* ===========================================
   BEAUTYCITA - MAIN APPLICATION
   =========================================== */

class BeautyCitaApp {
    constructor() {
        this.socket = null;
        this.user = null;
        this.currentBooking = {};
        this.theme = localStorage.getItem('beautycita-theme') || 'light';
        this.initialized = false;
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
            this.loadInitialData();
            
            this.initialized = true;
            console.log('BeautyCita app initialized successfully');
        } catch (error) {
            console.error('Failed to initialize BeautyCita app:', error);
            this.showNotification('Failed to load application', 'error');
        }
    }

    // Authentication initialization
    async initAuth() {
        const token = localStorage.getItem('beautycita-token');
        if (token) {
            try {
                const user = await BeautyCitaAPI.getCurrentUser();
                this.setUser(user);
            } catch (error) {
                console.warn('Invalid token, clearing auth:', error);
                localStorage.removeItem('beautycita-token');
            }
        }
    }

    // Set current user
    setUser(user) {
        this.user = user;
        this.updateUI();
    }

    // Update UI based on auth state
    updateUI() {
        const loginBtn = document.querySelector('.login-btn');
        const signupBtn = document.querySelector('.signup-btn');
        const userMenu = document.getElementById('userMenu');

        if (this.user) {
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            userMenu.style.display = 'block';
            
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar && this.user.profile_picture_url) {
                userAvatar.src = this.user.profile_picture_url;
            }
        } else {
            loginBtn.style.display = 'inline-block';
            signupBtn.style.display = 'inline-block';
            userMenu.style.display = 'none';
        }
    }

    // Initialize event listeners
    initEventListeners() {
        // Navigation scroll effect
        window.addEventListener('scroll', this.handleNavbarScroll.bind(this));
        
        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        // User menu toggle
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', this.toggleUserMenu.bind(this));
        }

        // Close modals on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));

        // Service category selection
        document.querySelectorAll('.service-cta').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.closest('.service-card').dataset.category;
                this.selectServiceCategory(category);
            });
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', this.handleNavClick.bind(this));
        });
    }

    // Handle navigation scroll effect
    handleNavbarScroll() {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Handle navigation clicks
    handleNavClick(e) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        
        if (href.startsWith('#')) {
            this.scrollTo(href);
            
            // Update active link
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            e.target.classList.add('active');
            
            // Close mobile menu if open
            this.closeMobileMenu();
        }
    }

    // Smooth scroll to element
    scrollTo(selector) {
        const element = document.querySelector(selector);
        if (element) {
            const offset = 100; // Account for fixed navbar
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Toggle mobile menu
    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        mobileMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (mobileMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    // Close mobile menu
    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Toggle user menu dropdown
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('active');
    }

    // Handle outside clicks for modals and dropdowns
    handleOutsideClick(e) {
        // Close user dropdown
        const userMenu = document.getElementById('userMenu');
        const userDropdown = document.getElementById('userDropdown');
        if (userMenu && !userMenu.contains(e.target) && userDropdown.classList.contains('active')) {
            userDropdown.classList.remove('active');
        }

        // Close mobile menu
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenu.classList.contains('active') && 
            !mobileMenu.contains(e.target) && 
            !mobileMenuBtn.contains(e.target)) {
            this.closeMobileMenu();
        }

        // Close theme selector
        const themeSelector = document.getElementById('themeSelector');
        const themeToggleBtn = document.querySelector('.theme-toggle-btn');
        if (themeSelector.classList.contains('active') && 
            !themeSelector.contains(e.target) && 
            !themeToggleBtn.contains(e.target)) {
            this.closeThemeSelector();
        }
    }

    // Handle keyboard shortcuts
    handleKeyboard(e) {
        // Escape key closes modals and dropdowns
        if (e.key === 'Escape') {
            this.closeAllModals();
            this.closeMobileMenu();
            this.closeThemeSelector();
            document.getElementById('userDropdown').classList.remove('active');
        }

        // Ctrl/Cmd + K opens search (future feature)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            // this.openSearch();
        }
    }

    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    // Initialize scroll animations
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
                }
            });
        }, observerOptions);

        // Observe all elements with animate-on-scroll class
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        // Add particle animation to hero
        this.initParticles();
    }

    // Initialize particle animation
    initParticles() {
        const particlesContainer = document.querySelector('.hero-particles');
        if (!particlesContainer) return;

        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            
            particlesContainer.appendChild(particle);

            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 25000);
        };

        // Create initial particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => createParticle(), i * 1000);
        }

        // Continue creating particles
        setInterval(createParticle, 2000);
    }

    // Initialize WebSocket connection
    initSocket() {
        if (!window.io) {
            console.warn('Socket.IO not loaded');
            return;
        }

        try {
            this.socket = io({
                auth: {
                    token: localStorage.getItem('beautycita-token')
                }
            });

            this.socket.on('connect', () => {
                console.log('Socket connected');
                if (this.user) {
                    this.socket.emit('join_user_room', this.user.id);
                }
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            // Real-time notifications
            this.socket.on('notification', (data) => {
                this.showNotification(data.message, data.type);
            });

            // Appointment updates
            this.socket.on('appointment_update', (data) => {
                this.handleAppointmentUpdate(data);
            });

            // Location updates
            this.socket.on('client_location_update', (data) => {
                if (window.BeautyCitaMaps) {
                    BeautyCitaMaps.updateClientLocation(data);
                }
            });

        } catch (error) {
            console.error('Socket initialization failed:', error);
        }
    }

    // Load initial data
    async loadInitialData() {
        try {
            // Load featured stylists
            const stylists = await BeautyCitaAPI.getFeaturedStylists();
            this.renderFeaturedStylists(stylists);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    // Render featured stylists
    renderFeaturedStylists(stylists) {
        const container = document.getElementById('featuredStylists');
        if (!container || !stylists.length) return;

        container.innerHTML = stylists.map(stylist => `
            <div class="stylist-card animate-on-scroll hover-lift" data-stylist-id="${stylist.id}">
                <div class="stylist-header">
                    <div class="stylist-avatar">
                        <img src="${stylist.profile_picture_url || '/images/default-avatar.png'}" alt="${stylist.display_name}">
                    </div>
                    <div class="stylist-info">
                        <h4>${stylist.display_name}</h4>
                        <div class="stylist-rating">
                            <div class="rating-stars">
                                ${this.generateStarRating(stylist.rating_average)}
                            </div>
                            <span class="rating-count">${stylist.rating_average} (${stylist.total_reviews} reviews)</span>
                        </div>
                        <div class="stylist-specialties">
                            ${stylist.specialties.slice(0, 3).map(s => `<span class="specialty-tag">${s}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="stylist-stats">
                    <div class="stat">
                        <i class="fas fa-calendar-check"></i>
                        <span>${stylist.total_bookings} bookings</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-clock"></i>
                        <span>Available today</span>
                    </div>
                </div>
                <button class="btn primary" onclick="BeautyCita.bookStylist('${stylist.id}')">
                    Book Now
                </button>
            </div>
        `).join('');

        // Re-observe new elements for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        container.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    // Generate star rating HTML
    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let html = '';

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                html += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalfStar) {
                html += '<i class="fas fa-star-half-alt"></i>';
            } else {
                html += '<i class="far fa-star"></i>';
            }
        }

        return html;
    }

    // Theme management
    toggleThemeSelector() {
        const themeSelector = document.getElementById('themeSelector');
        themeSelector.classList.toggle('active');
    }

    closeThemeSelector() {
        const themeSelector = document.getElementById('themeSelector');
        themeSelector.classList.remove('active');
    }

    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('beautycita-theme', theme);
        
        // Update theme selector UI
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === theme) {
                option.classList.add('active');
            }
        });
    }

    // Booking methods
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
        
        if (window.BeautyCitaBooking) {
            BeautyCitaBooking.showBookingModal();
        }
    }

    selectServiceCategory(category) {
        this.currentBooking.category = category;
        this.startBooking();
    }

    bookStylist(stylistId) {
        if (!this.user) {
            this.showLogin();
            return;
        }
        
        this.currentBooking.stylistId = stylistId;
        this.startBooking();
    }

    // Authentication methods
    showLogin() {
        if (window.BeautyCitaAuth) {
            BeautyCitaAuth.showLogin();
        }
    }

    showSignup() {
        if (window.BeautyCitaAuth) {
            BeautyCitaAuth.showSignup();
        }
    }

    async logout() {
        try {
            await BeautyCitaAPI.logout();
            localStorage.removeItem('beautycita-token');
            this.user = null;
            this.updateUI();
            this.showNotification('Successfully logged out', 'success');
            
            if (this.socket) {
                this.socket.disconnect();
            }
        } catch (error) {
            console.error('Logout failed:', error);
            this.showNotification('Logout failed', 'error');
        }
    }

    // Profile and settings
    showProfile() {
        // Implementation for profile modal
        console.log('Show profile modal');
    }

    showBookings() {
        // Implementation for bookings modal
        console.log('Show bookings modal');
    }

    showSettings() {
        // Implementation for settings modal
        console.log('Show settings modal');
    }

    // Appointment handling
    handleAppointmentUpdate(data) {
        console.log('Appointment update:', data);
        this.showNotification(data.message, 'info');
        
        // Update UI if tracking modal is open
        if (document.getElementById('trackingModal').classList.contains('active')) {
            this.updateTrackingInfo(data);
        }
    }

    updateTrackingInfo(data) {
        const statusElement = document.getElementById('appointmentStatus');
        const etaElement = document.getElementById('etaInfo');
        
        if (statusElement) {
            statusElement.innerHTML = `
                <h4><i class="fas fa-info-circle"></i> Status</h4>
                <div class="status-indicator ${data.status}">
                    <i class="fas fa-circle"></i>
                    ${this.formatAppointmentStatus(data.status)}
                </div>
            `;
        }

        if (etaElement && data.eta) {
            etaElement.innerHTML = `
                <h4><i class="fas fa-clock"></i> ETA</h4>
                <div class="eta-display">
                    <div class="eta-time">${data.eta}</div>
                    <div class="eta-label">Minutes away</div>
                </div>
            `;
        }
    }

    formatAppointmentStatus(status) {
        const statusMap = {
            'pending': 'Waiting for confirmation',
            'confirmed': 'Confirmed',
            'en_route': 'Stylist is on the way',
            'arrived': 'Stylist has arrived',
            'in_progress': 'Service in progress',
            'completed': 'Service completed'
        };
        return statusMap[status] || status;
    }

    // Notification system
    showNotification(message, type = 'info', duration = 5000) {
        if (window.BeautyCitaNotifications) {
            BeautyCitaNotifications.show(message, type, duration);
        }
    }

    // Loading overlay
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        
        if (text) text.textContent = message;
        if (overlay) overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }

    formatTime(time) {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(new Date(`2000-01-01T${time}`));
    }
}

// Global BeautyCita instance
window.BeautyCita = new BeautyCitaApp();

// Theme selector event handlers
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme selector
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            BeautyCita.setTheme(theme);
            BeautyCita.closeThemeSelector();
        });
    });

    // Initialize the app
    BeautyCita.init();
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeautyCitaApp;
}