/* ===========================================
   BEAUTYCITA - API CLIENT
   =========================================== */

class BeautyCitaAPIClient {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('beautycita-token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('beautycita-token', token);
        } else {
            localStorage.removeItem('beautycita-token');
        }
    }

    // Make HTTP request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // PATCH request
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Upload file
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        const config = {
            method: 'POST',
            body: formData,
            headers: {}
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        return data;
    }

    /* ===========================================
       AUTHENTICATION ENDPOINTS
       =========================================== */

    // Register new user
    async register(userData) {
        const response = await this.post('/auth/register', userData);
        if (response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    // Login user
    async login(credentials) {
        const response = await this.post('/auth/login', credentials);
        if (response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    // Logout user
    async logout() {
        try {
            await this.post('/auth/logout');
        } finally {
            this.setToken(null);
        }
    }

    // Get current user
    async getCurrentUser() {
        return this.get('/auth/me');
    }

    // Refresh token
    async refreshToken() {
        const response = await this.post('/auth/refresh');
        if (response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    // Request password reset
    async forgotPassword(email) {
        return this.post('/auth/forgot-password', { email });
    }

    // Reset password
    async resetPassword(token, password) {
        return this.post('/auth/reset-password', { token, password });
    }

    // Google OAuth
    getGoogleAuthURL() {
        return `${this.baseURL}/auth/google`;
    }

    /* ===========================================
       USER MANAGEMENT ENDPOINTS
       =========================================== */

    // Get user profile
    async getUserProfile() {
        return this.get('/users/profile');
    }

    // Update user profile
    async updateUserProfile(profileData) {
        return this.put('/users/profile', profileData);
    }

    // Upload avatar
    async uploadAvatar(file) {
        return this.uploadFile('/users/upload-avatar', file);
    }

    // Delete user account
    async deleteAccount() {
        return this.delete('/users/account');
    }

    /* ===========================================
       STYLIST ENDPOINTS
       =========================================== */

    // Search stylists
    async searchStylists(filters = {}) {
        return this.get('/stylists', filters);
    }

    // Get stylist details
    async getStylistDetails(stylistId) {
        return this.get(`/stylists/${stylistId}`);
    }

    // Get featured stylists
    async getFeaturedStylists(limit = 6) {
        return this.get('/stylists/featured', { limit });
    }

    // Register as stylist (complete onboarding)
    async registerStylist(stylistData) {
        return this.post('/stylists/register', stylistData);
    }

    // Update stylist profile
    async updateStylistProfile(profileData) {
        return this.put('/stylists/profile', profileData);
    }

    // Get stylist dashboard data
    async getStylistDashboard() {
        return this.get('/stylists/dashboard');
    }

    // Add service
    async addService(serviceData) {
        return this.post('/stylists/services', serviceData);
    }

    // Update service
    async updateService(serviceId, serviceData) {
        return this.put(`/stylists/services/${serviceId}`, serviceData);
    }

    // Delete service
    async deleteService(serviceId) {
        return this.delete(`/stylists/services/${serviceId}`);
    }

    // Add portfolio image
    async addPortfolioImage(file, caption = '', category = '') {
        return this.uploadFile('/stylists/portfolio', file, { caption, category });
    }

    // Delete portfolio image
    async deletePortfolioImage(imageId) {
        return this.delete(`/stylists/portfolio/${imageId}`);
    }

    /* ===========================================
       APPOINTMENT ENDPOINTS
       =========================================== */

    // Get user appointments
    async getAppointments(filters = {}) {
        return this.get('/appointments', filters);
    }

    // Create appointment
    async createAppointment(appointmentData) {
        return this.post('/appointments', appointmentData);
    }

    // Get appointment details
    async getAppointmentDetails(appointmentId) {
        return this.get(`/appointments/${appointmentId}`);
    }

    // Update appointment status
    async updateAppointmentStatus(appointmentId, status, message = '') {
        return this.patch(`/appointments/${appointmentId}/status`, { status, message });
    }

    // Cancel appointment
    async cancelAppointment(appointmentId, reason = '') {
        return this.delete(`/appointments/${appointmentId}`, { reason });
    }

    // Check availability
    async checkAvailability(stylistId, date, duration = 60) {
        return this.get('/appointments/availability', {
            stylistId,
            date,
            duration
        });
    }

    // Get flexible time slots
    async getFlexibleTimeSlots(stylistId, preferredTime, date, flexibility = 30) {
        return this.get('/appointments/flexible-slots', {
            stylistId,
            preferredTime,
            date,
            flexibility
        });
    }

    /* ===========================================
       LOCATION ENDPOINTS
       =========================================== */

    // Find nearby stylists
    async findNearbyStylists(latitude, longitude, radius = 15, filters = {}) {
        return this.get('/locations/nearby', {
            lat: latitude,
            lng: longitude,
            radius,
            ...filters
        });
    }

    // Geocode address
    async geocodeAddress(address) {
        return this.post('/locations/geocode', { address });
    }

    // Get travel time estimate
    async getTravelEstimate(origin, destination) {
        return this.get('/locations/estimate', {
            origin: `${origin.lat},${origin.lng}`,
            destination: `${destination.lat},${destination.lng}`
        });
    }

    // Update client location (for tracking)
    async updateClientLocation(appointmentId, latitude, longitude) {
        return this.post('/locations/track', {
            appointmentId,
            latitude,
            longitude,
            timestamp: new Date().toISOString()
        });
    }

    /* ===========================================
       PAYMENT ENDPOINTS
       =========================================== */

    // Create payment order
    async createPaymentOrder(appointmentId) {
        return this.post('/payments/create-order', { appointmentId });
    }

    // Capture payment
    async capturePayment(orderId) {
        return this.post('/payments/capture', { orderId });
    }

    // Request refund
    async requestRefund(appointmentId, reason = '') {
        return this.post('/payments/refund', { appointmentId, reason });
    }

    // Get payment history
    async getPaymentHistory(filters = {}) {
        return this.get('/payments/history', filters);
    }

    /* ===========================================
       REVIEW ENDPOINTS
       =========================================== */

    // Submit review
    async submitReview(appointmentId, reviewData) {
        return this.post('/reviews', {
            appointmentId,
            ...reviewData
        });
    }

    // Get reviews for stylist
    async getStylistReviews(stylistId, page = 1, limit = 10) {
        return this.get(`/reviews/stylist/${stylistId}`, { page, limit });
    }

    // Get user's reviews
    async getUserReviews() {
        return this.get('/reviews/my-reviews');
    }

    /* ===========================================
       CHAT ENDPOINTS
       =========================================== */

    // Get chat messages
    async getChatMessages(appointmentId, page = 1, limit = 50) {
        return this.get(`/chat/${appointmentId}/messages`, { page, limit });
    }

    // Send chat message
    async sendChatMessage(appointmentId, message) {
        return this.post(`/chat/${appointmentId}/messages`, { message });
    }

    // Mark messages as read
    async markMessagesRead(appointmentId) {
        return this.patch(`/chat/${appointmentId}/read`);
    }

    /* ===========================================
       SERVICES CATALOG ENDPOINTS
       =========================================== */

    // Get service categories
    async getServiceCategories() {
        return this.get('/services/categories');
    }

    // Get services by category
    async getServicesByCategory(category) {
        return this.get(`/services/category/${category}`);
    }

    // Search services
    async searchServices(query, filters = {}) {
        return this.get('/services/search', { q: query, ...filters });
    }

    /* ===========================================
       NOTIFICATION ENDPOINTS
       =========================================== */

    // Get user notifications
    async getNotifications(page = 1, limit = 20) {
        return this.get('/notifications', { page, limit });
    }

    // Mark notification as read
    async markNotificationRead(notificationId) {
        return this.patch(`/notifications/${notificationId}/read`);
    }

    // Mark all notifications as read
    async markAllNotificationsRead() {
        return this.patch('/notifications/read-all');
    }

    // Update notification preferences
    async updateNotificationPreferences(preferences) {
        return this.put('/notifications/preferences', preferences);
    }

    /* ===========================================
       UTILITY METHODS
       =========================================== */

    // Handle API errors globally
    handleError(error, context = '') {
        console.error(`API Error ${context}:`, error);
        
        if (error.message === 'Unauthorized') {
            // Token expired, redirect to login
            this.setToken(null);
            if (window.BeautyCita) {
                window.BeautyCita.showLogin();
            }
        }
        
        return {
            success: false,
            error: error.message || 'An unexpected error occurred'
        };
    }

    // Format API response for consistent handling
    formatResponse(data) {
        return {
            success: true,
            data,
            error: null
        };
    }
}

// Global API instance
window.BeautyCitaAPI = new BeautyCitaAPIClient();

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeautyCitaAPIClient;
}