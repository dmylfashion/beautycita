/* ===========================================
   BEAUTYCITA - BOOKING SYSTEM
   =========================================== */

class BeautyCitaBookingSystem {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 4;
        this.bookingData = {
            category: null,
            service: null,
            date: null,
            time: null,
            flexibleTime: true,
            stylistId: null,
            location: null,
            notes: '',
            paymentMethod: null
        };
        this.availableStylists = [];
        this.timeSlots = [];
        this.confirmationTimeout = null;
        this.graceTimeout = null;
    }

    // Show booking modal
    showBookingModal(preselectedCategory = null) {
        if (preselectedCategory) {
            this.bookingData.category = preselectedCategory;
        }
        
        this.resetBooking();
        this.renderCurrentStep();
        
        const modal = document.getElementById('bookingModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close booking modal
    closeBookingModal() {
        const modal = document.getElementById('bookingModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.resetBooking();
    }

    // Reset booking data
    resetBooking() {
        this.currentStep = 1;
        this.bookingData = {
            category: this.bookingData.category, // Preserve category if pre-selected
            service: null,
            date: null,
            time: null,
            flexibleTime: true,
            stylistId: null,
            location: null,
            notes: '',
            paymentMethod: null
        };
        this.updateProgressIndicator();
    }

    // Navigate to next step
    async nextBookingStep() {
        if (!this.validateCurrentStep()) {
            return;
        }

        if (this.currentStep < this.maxSteps) {
            this.currentStep++;
            await this.renderCurrentStep();
            this.updateProgressIndicator();
            this.updateNavigationButtons();
        } else {
            await this.submitBooking();
        }
    }

    // Navigate to previous step
    previousBookingStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.renderCurrentStep();
            this.updateProgressIndicator();
            this.updateNavigationButtons();
        }
    }

    // Validate current step
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1: // Service selection
                if (!this.bookingData.service) {
                    BeautyCita.showNotification('Please select a service', 'warning');
                    return false;
                }
                return true;
                
            case 2: // Date and time selection
                if (!this.bookingData.date || !this.bookingData.time) {
                    BeautyCita.showNotification('Please select date and time', 'warning');
                    return false;
                }
                return true;
                
            case 3: // Stylist selection
                if (!this.bookingData.stylistId) {
                    BeautyCita.showNotification('Please select a stylist', 'warning');
                    return false;
                }
                return true;
                
            case 4: // Confirmation
                if (!this.bookingData.paymentMethod) {
                    BeautyCita.showNotification('Please select a payment method', 'warning');
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    }

    // Render current step content
    async renderCurrentStep() {
        const container = document.getElementById('bookingSteps');
        
        switch (this.currentStep) {
            case 1:
                container.innerHTML = await this.renderServiceSelection();
                this.initServiceSelectionEvents();
                break;
            case 2:
                container.innerHTML = await this.renderDateTimeSelection();
                this.initDateTimeSelectionEvents();
                break;
            case 3:
                container.innerHTML = await this.renderStylistSelection();
                await this.loadStylists();
                this.initStylistSelectionEvents();
                break;
            case 4:
                container.innerHTML = await this.renderConfirmation();
                this.initConfirmationEvents();
                break;
        }
    }

    // Render service selection step
    async renderServiceSelection() {
        let categories;
        try {
            categories = await BeautyCitaAPI.getServiceCategories();
        } catch (error) {
            console.error('Failed to load service categories:', error);
            categories = this.getDefaultCategories();
        }

        return `
            <div class="service-selection">
                <div class="service-categories">
                    <h3>Service Categories</h3>
                    <div class="category-list">
                        ${categories.map(category => `
                            <div class="category-item ${this.bookingData.category === category.id ? 'active' : ''}" 
                                 data-category="${category.id}">
                                <i class="${category.icon}"></i>
                                <div class="category-info">
                                    <h4>${category.name}</h4>
                                    <p>${category.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="services-list">
                    <h3>Select Service</h3>
                    <div class="service-options" id="serviceOptions">
                        ${this.bookingData.category ? await this.renderServiceOptions(this.bookingData.category) : '<p class="text-secondary">Select a category to see available services</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    // Render service options for selected category
    async renderServiceOptions(category) {
        try {
            const services = await BeautyCitaAPI.getServicesByCategory(category);
            
            return services.map(service => `
                <div class="service-option ${this.bookingData.service?.id === service.id ? 'selected' : ''}" 
                     data-service-id="${service.id}">
                    <div class="service-option-header">
                        <div class="service-option-info">
                            <h4>${service.name}</h4>
                            <p>${service.description}</p>
                        </div>
                        <div class="service-option-price">
                            ${BeautyCita.formatCurrency(service.base_price)}
                        </div>
                    </div>
                    <div class="service-option-details">
                        <div class="service-detail">
                            <i class="fas fa-clock"></i>
                            <span>${service.duration_minutes} min</span>
                        </div>
                        <div class="service-detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Book ${service.booking_advance_hours}h ahead</span>
                        </div>
                        ${service.requires_consultation ? `
                            <div class="service-detail">
                                <i class="fas fa-comments"></i>
                                <span>Consultation required</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load services:', error);
            return '<p class="text-error">Failed to load services. Please try again.</p>';
        }
    }

    // Render date and time selection step
    async renderDateTimeSelection() {
        return `
            <div class="datetime-selection">
                <div class="date-picker-section">
                    <h3>Select Date</h3>
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <button class="calendar-nav-btn" onclick="BeautyCitaBooking.previousMonth()">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span id="calendarMonth">January 2024</span>
                            <button class="calendar-nav-btn" onclick="BeautyCitaBooking.nextMonth()">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div class="calendar-grid" id="calendarGrid">
                            ${this.renderCalendar()}
                        </div>
                    </div>
                </div>
                
                <div class="time-picker-section">
                    <h3>Select Time</h3>
                    <div class="flexibility-toggle">
                        <label class="toggle-switch">
                            <input type="checkbox" ${this.bookingData.flexibleTime ? 'checked' : ''} 
                                   onchange="BeautyCitaBooking.toggleFlexibleTime(this.checked)">
                            <span class="slider"></span>
                            Flexible timing (±15 minutes)
                        </label>
                    </div>
                    <div class="time-slots" id="timeSlots">
                        ${this.bookingData.date ? await this.renderTimeSlots() : '<p class="text-secondary">Select a date to see available times</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    // Render stylist selection step with advanced search algorithm
    async renderStylistSelection() {
        return `
            <div class="stylist-selection">
                <div class="search-filters">
                    <input type="text" class="search-input" placeholder="Search stylists by name or specialty..." 
                           id="stylistSearch" oninput="BeautyCitaBooking.filterStylists(this.value)">
                    <div class="filter-dropdown">
                        <button class="filter-btn" onclick="BeautyCitaBooking.toggleSortDropdown()">
                            <span>Sort by Rating</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="dropdown-menu" id="sortDropdown">
                            <a href="#" onclick="BeautyCitaBooking.sortStylists('rating')">Highest Rating</a>
                            <a href="#" onclick="BeautyCitaBooking.sortStylists('distance')">Closest Distance</a>
                            <a href="#" onclick="BeautyCitaBooking.sortStylists('availability')">Most Available</a>
                            <a href="#" onclick="BeautyCitaBooking.sortStylists('new')">Newest Stylists</a>
                        </div>
                    </div>
                </div>
                
                <div class="stylists-grid" id="stylistsGrid">
                    <div class="loading-skeleton">Loading stylists...</div>
                </div>
            </div>
        `;
    }

    // Render confirmation step
    async renderConfirmation() {
        const stylist = this.availableStylists.find(s => s.id === this.bookingData.stylistId);
        const totalPrice = this.calculateTotalPrice();
        
        return `
            <div class="booking-confirmation">
                <div class="confirmation-details">
                    <div class="confirmation-section">
                        <h4><i class="fas fa-cut"></i> Service Details</h4>
                        <div class="confirmation-item">
                            <label>Service:</label>
                            <span>${this.bookingData.service.name}</span>
                        </div>
                        <div class="confirmation-item">
                            <label>Duration:</label>
                            <span>${this.bookingData.service.duration_minutes} minutes</span>
                        </div>
                        <div class="confirmation-item">
                            <label>Price:</label>
                            <span>${BeautyCita.formatCurrency(this.bookingData.service.base_price)}</span>
                        </div>
                    </div>
                    
                    <div class="confirmation-section">
                        <h4><i class="fas fa-calendar"></i> Appointment Details</h4>
                        <div class="confirmation-item">
                            <label>Date:</label>
                            <span>${BeautyCita.formatDate(this.bookingData.date)}</span>
                        </div>
                        <div class="confirmation-item">
                            <label>Time:</label>
                            <span>${BeautyCita.formatTime(this.bookingData.time)} ${this.bookingData.flexibleTime ? '(±15 min)' : ''}</span>
                        </div>
                    </div>
                    
                    <div class="confirmation-section">
                        <h4><i class="fas fa-user"></i> Stylist Information</h4>
                        <div class="stylist-preview">
                            <img src="${stylist?.profile_picture_url || '/images/default-avatar.png'}" alt="${stylist?.display_name}">
                            <div class="stylist-details">
                                <h5>${stylist?.display_name}</h5>
                                <div class="rating">
                                    ${BeautyCita.generateStarRating(stylist?.rating_average)}
                                    <span>(${stylist?.total_reviews} reviews)</span>
                                </div>
                                <p>${stylist?.bio || 'Professional stylist'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="confirmation-section">
                        <h4><i class="fas fa-map-marker-alt"></i> Location</h4>
                        <div class="confirmation-item">
                            <label>Service Location:</label>
                            <span>Your Location</span>
                        </div>
                        <textarea class="form-input" placeholder="Special instructions or notes..." 
                                  oninput="BeautyCitaBooking.updateNotes(this.value)">${this.bookingData.notes}</textarea>
                    </div>
                </div>
                
                <div class="booking-summary">
                    <h4>Booking Summary</h4>
                    <div class="summary-item">
                        <label>Service Fee:</label>
                        <span>${BeautyCita.formatCurrency(this.bookingData.service.base_price)}</span>
                    </div>
                    <div class="summary-item">
                        <label>Travel Fee:</label>
                        <span>${BeautyCita.formatCurrency(totalPrice.travelFee)}</span>
                    </div>
                    <div class="summary-item">
                        <label>Platform Fee:</label>
                        <span>${BeautyCita.formatCurrency(totalPrice.platformFee)}</span>
                    </div>
                    <div class="summary-item">
                        <label><strong>Total:</strong></label>
                        <span><strong>${BeautyCita.formatCurrency(totalPrice.total)}</strong></span>
                    </div>
                    
                    <div class="payment-methods">
                        <h5>Payment Method</h5>
                        <div class="payment-method ${this.bookingData.paymentMethod === 'paypal' ? 'selected' : ''}" 
                             onclick="BeautyCitaBooking.selectPaymentMethod('paypal')">
                            <input type="radio" name="payment" value="paypal" ${this.bookingData.paymentMethod === 'paypal' ? 'checked' : ''}>
                            <div class="payment-method-info">
                                <h5>PayPal</h5>
                                <p>Pay securely with PayPal</p>
                            </div>
                            <i class="fab fa-paypal"></i>
                        </div>
                        <div class="payment-method ${this.bookingData.paymentMethod === 'card' ? 'selected' : ''}" 
                             onclick="BeautyCitaBooking.selectPaymentMethod('card')">
                            <input type="radio" name="payment" value="card" ${this.bookingData.paymentMethod === 'card' ? 'checked' : ''}>
                            <div class="payment-method-info">
                                <h5>Credit Card</h5>
                                <p>Pay with credit or debit card</p>
                            </div>
                            <i class="fas fa-credit-card"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Advanced Search Algorithm Implementation
    async loadStylists() {
        if (!BeautyCita.user) {
            BeautyCita.showNotification('Please login to continue booking', 'warning');
            BeautyCita.showLogin();
            return;
        }

        try {
            BeautyCita.showLoading('Finding the best stylists for you...');
            
            // Get user's location (using HTML5 geolocation or stored preference)
            const userLocation = await this.getUserLocation();
            
            // Search parameters based on advanced algorithm
            const searchParams = {
                category: this.bookingData.category,
                service_id: this.bookingData.service.id,
                date: this.bookingData.date,
                time: this.bookingData.time,
                flexible_time: this.bookingData.flexibleTime,
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                max_distance: 25, // miles
                priority_flexibility: true // Prioritize schedule flexibility
            };

            const response = await BeautyCitaAPI.searchStylists(searchParams);
            this.availableStylists = this.rankStylists(response.stylists, userLocation);
            
            BeautyCita.hideLoading();
            this.renderStylists();
            
        } catch (error) {
            console.error('Failed to load stylists:', error);
            BeautyCita.hideLoading();
            BeautyCita.showNotification('Failed to load stylists. Please try again.', 'error');
            this.renderStylists([]);
        }
    }

    // Advanced stylist ranking algorithm
    rankStylists(stylists, userLocation) {
        return stylists.map(stylist => {
            let score = 0;
            
            // 1. Schedule flexibility priority (40% weight)
            const flexibilityScore = this.calculateFlexibilityScore(stylist);
            score += flexibilityScore * 0.4;
            
            // 2. Distance factor (30% weight)
            const distanceScore = this.calculateDistanceScore(stylist, userLocation);
            score += distanceScore * 0.3;
            
            // 3. Rating factor (25% weight)
            const ratingScore = (stylist.rating_average / 5) * 100;
            score += ratingScore * 0.25;
            
            // 4. New stylist bonus (5% weight)
            const isNew = this.isStylistNew(stylist);
            if (isNew) {
                score += 5;
                stylist.isNew = true;
            }
            
            stylist.matchScore = Math.round(score);
            return stylist;
        }).sort((a, b) => b.matchScore - a.matchScore);
    }

    // Calculate flexibility score based on available time slots around preferred time
    calculateFlexibilityScore(stylist) {
        if (!stylist.availability) return 0;
        
        const preferredTime = this.bookingData.time;
        const timeSlots = stylist.availability.filter(slot => slot.date === this.bookingData.date);
        
        if (!timeSlots.length) return 0;
        
        // Find slots within 30 minutes of preferred time
        const flexibleSlots = timeSlots.filter(slot => {
            const timeDiff = Math.abs(this.getMinutesDifference(slot.time, preferredTime));
            return timeDiff <= 30;
        });
        
        // Score based on how many flexible slots are available
        return Math.min((flexibleSlots.length / timeSlots.length) * 100, 100);
    }

    // Calculate distance score (closer = higher score)
    calculateDistanceScore(stylist, userLocation) {
        if (!stylist.distance) return 0;
        
        // Convert distance to score (max 25 miles = 0 points, 0 miles = 100 points)
        const maxDistance = 25;
        return Math.max(0, ((maxDistance - stylist.distance) / maxDistance) * 100);
    }

    // Check if stylist is new (signed up within last 21 days)
    isStylistNew(stylist) {
        if (!stylist.created_at) return false;
        
        const signupDate = new Date(stylist.created_at);
        const daysSinceSignup = (Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24);
        
        return daysSinceSignup <= 21;
    }

    // Render stylists list
    renderStylists(stylists = this.availableStylists) {
        const container = document.getElementById('stylistsGrid');
        
        if (!stylists.length) {
            container.innerHTML = `
                <div class="no-stylists">
                    <i class="fas fa-search"></i>
                    <h4>No stylists available</h4>
                    <p>Try adjusting your date, time, or enable flexible timing for more options.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = stylists.map(stylist => `
            <div class="stylist-card ${this.bookingData.stylistId === stylist.id ? 'selected' : ''} ${stylist.isNew ? 'new' : ''}" 
                 data-stylist-id="${stylist.id}" onclick="BeautyCitaBooking.selectStylist('${stylist.id}')">
                <div class="stylist-header">
                    <div class="stylist-avatar">
                        <img src="${stylist.profile_picture_url || '/images/default-avatar.png'}" alt="${stylist.display_name}">
                    </div>
                    <div class="stylist-info">
                        <h4>${stylist.display_name}</h4>
                        <div class="stylist-rating">
                            <div class="rating-stars">
                                ${BeautyCita.generateStarRating(stylist.rating_average)}
                            </div>
                            <span class="rating-count">${stylist.rating_average} (${stylist.total_reviews})</span>
                        </div>
                        <div class="match-score">
                            <i class="fas fa-star"></i>
                            <span>${stylist.matchScore}% match</span>
                        </div>
                    </div>
                </div>
                <div class="stylist-details">
                    <p>${stylist.bio ? stylist.bio.substring(0, 100) + '...' : 'Professional stylist'}</p>
                    <div class="stylist-tags">
                        ${stylist.specialties.slice(0, 3).map(specialty => `
                            <span class="specialty-tag">${specialty}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="stylist-distance">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${stylist.distance ? stylist.distance.toFixed(1) + ' miles away' : 'Distance unknown'}</span>
                </div>
            </div>
        `).join('');
    }

    // Get user's current location
    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                // Fallback to default location or user's stored address
                resolve({ lat: 40.7128, lng: -74.0060 }); // NYC default
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Geolocation failed:', error);
                    resolve({ lat: 40.7128, lng: -74.0060 }); // Fallback
                }
            );
        });
    }

    // Booking confirmation system with timeouts
    async submitBooking() {
        if (!BeautyCita.user) {
            BeautyCita.showLogin();
            return;
        }

        try {
            BeautyCita.showLoading('Creating your appointment...');
            
            // Create appointment request
            const appointmentData = {
                service_id: this.bookingData.service.id,
                stylist_id: this.bookingData.stylistId,
                scheduled_at: `${this.bookingData.date}T${this.bookingData.time}`,
                flexible_time: this.bookingData.flexibleTime,
                notes: this.bookingData.notes,
                payment_method: this.bookingData.paymentMethod
            };

            const response = await BeautyCitaAPI.createAppointment(appointmentData);
            
            BeautyCita.hideLoading();
            
            if (response.status === 'pending') {
                this.startConfirmationTimers(response.appointment.id);
                this.showBookingPendingModal(response.appointment);
            } else if (response.status === 'confirmed') {
                this.showBookingSuccessModal(response.appointment);
            }
            
        } catch (error) {
            console.error('Booking failed:', error);
            BeautyCita.hideLoading();
            BeautyCita.showNotification('Booking failed. Please try again.', 'error');
        }
    }

    // Start 5-minute confirmation and 10-minute grace period timers
    startConfirmationTimers(appointmentId) {
        // 5-minute auto-confirmation window
        this.confirmationTimeout = setTimeout(async () => {
            // Grace period begins - manual confirmation required
            BeautyCita.showNotification('Stylist has 5 more minutes to respond', 'info');
            
            // 10-minute total timeout (5 + 5)
            this.graceTimeout = setTimeout(() => {
                BeautyCita.showNotification('Appointment request expired. Please try booking with another stylist.', 'warning');
                this.closeBookingModal();
            }, 5 * 60 * 1000); // 5 more minutes
            
        }, 5 * 60 * 1000); // 5 minutes

        // Listen for real-time confirmation
        if (BeautyCita.socket) {
            BeautyCita.socket.on('appointment_confirmed', (data) => {
                if (data.appointment_id === appointmentId) {
                    this.clearConfirmationTimers();
                    this.showBookingSuccessModal(data.appointment);
                }
            });
        }
    }

    // Clear confirmation timers
    clearConfirmationTimers() {
        if (this.confirmationTimeout) {
            clearTimeout(this.confirmationTimeout);
            this.confirmationTimeout = null;
        }
        if (this.graceTimeout) {
            clearTimeout(this.graceTimeout);
            this.graceTimeout = null;
        }
    }

    // Event handlers and utility methods...

    // Initialize event handlers for each step
    initServiceSelectionEvents() {
        // Category selection
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                const category = e.currentTarget.dataset.category;
                
                // Update active category
                document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                this.bookingData.category = category;
                
                // Load services for this category
                const serviceOptions = document.getElementById('serviceOptions');
                serviceOptions.innerHTML = '<div class="loading-skeleton">Loading services...</div>';
                serviceOptions.innerHTML = await this.renderServiceOptions(category);
                
                // Re-initialize service selection events
                this.initServiceOptionEvents();
            });
        });

        this.initServiceOptionEvents();
    }

    initServiceOptionEvents() {
        document.querySelectorAll('.service-option').forEach(option => {
            option.addEventListener('click', async (e) => {
                const serviceId = e.currentTarget.dataset.serviceId;
                
                // Get service details
                try {
                    const services = await BeautyCitaAPI.getServicesByCategory(this.bookingData.category);
                    const service = services.find(s => s.id === serviceId);
                    
                    if (service) {
                        this.bookingData.service = service;
                        
                        // Update UI
                        document.querySelectorAll('.service-option').forEach(o => o.classList.remove('selected'));
                        e.currentTarget.classList.add('selected');
                    }
                } catch (error) {
                    console.error('Failed to get service details:', error);
                }
            });
        });
    }

    initDateTimeSelectionEvents() {
        // Calendar events will be handled by individual date buttons
        // Time slot events will be handled by individual time buttons
    }

    initStylistSelectionEvents() {
        // Search input
        const searchInput = document.getElementById('stylistSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterStylists(e.target.value);
                }, 300);
            });
        }
    }

    initConfirmationEvents() {
        // Events are handled by onclick attributes in the HTML
    }

    // Helper methods
    selectStylist(stylistId) {
        this.bookingData.stylistId = stylistId;
        
        // Update UI
        document.querySelectorAll('.stylist-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.stylistId === stylistId) {
                card.classList.add('selected');
            }
        });
    }

    selectPaymentMethod(method) {
        this.bookingData.paymentMethod = method;
        
        // Update UI
        document.querySelectorAll('.payment-method').forEach(pm => {
            pm.classList.remove('selected');
            const input = pm.querySelector('input[type="radio"]');
            input.checked = input.value === method;
            if (input.checked) {
                pm.classList.add('selected');
            }
        });
    }

    updateNotes(notes) {
        this.bookingData.notes = notes;
    }

    toggleFlexibleTime(enabled) {
        this.bookingData.flexibleTime = enabled;
    }

    filterStylists(query) {
        const filteredStylists = this.availableStylists.filter(stylist => {
            const searchText = `${stylist.display_name} ${stylist.specialties.join(' ')} ${stylist.bio || ''}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
        
        this.renderStylists(filteredStylists);
    }

    sortStylists(criteria) {
        let sorted = [...this.availableStylists];
        
        switch (criteria) {
            case 'rating':
                sorted.sort((a, b) => b.rating_average - a.rating_average);
                break;
            case 'distance':
                sorted.sort((a, b) => a.distance - b.distance);
                break;
            case 'availability':
                sorted.sort((a, b) => b.matchScore - a.matchScore);
                break;
            case 'new':
                sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
                break;
        }
        
        this.renderStylists(sorted);
        
        // Close dropdown
        document.getElementById('sortDropdown').classList.remove('active');
    }

    // Update progress indicator
    updateProgressIndicator() {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    // Update navigation buttons
    updateNavigationButtons() {
        const backBtn = document.getElementById('bookingBackBtn');
        const nextBtn = document.getElementById('bookingNextBtn');
        
        // Back button
        if (this.currentStep === 1) {
            backBtn.style.display = 'none';
        } else {
            backBtn.style.display = 'flex';
        }
        
        // Next/Confirm button
        if (this.currentStep === this.maxSteps) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Booking';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
    }

    // Calculate total price including fees
    calculateTotalPrice() {
        const basePrice = this.bookingData.service?.base_price || 0;
        const travelFee = 10; // Flat travel fee
        const platformFee = basePrice * 0.1; // 10% platform fee
        const total = basePrice + travelFee + platformFee;
        
        return {
            basePrice,
            travelFee,
            platformFee,
            total
        };
    }

    // Utility methods for date/time handling
    getMinutesDifference(time1, time2) {
        const [h1, m1] = time1.split(':').map(Number);
        const [h2, m2] = time2.split(':').map(Number);
        
        const minutes1 = h1 * 60 + m1;
        const minutes2 = h2 * 60 + m2;
        
        return minutes1 - minutes2;
    }

    // Default categories fallback
    getDefaultCategories() {
        return [
            {
                id: 'hair',
                name: 'Hair Services',
                description: 'Cuts, styling, coloring, treatments',
                icon: 'fas fa-cut'
            },
            {
                id: 'makeup',
                name: 'Makeup Services',
                description: 'Professional makeup for any occasion',
                icon: 'fas fa-palette'
            },
            {
                id: 'nails',
                name: 'Nail Services',
                description: 'Complete nail care and artistry',
                icon: 'fas fa-hand-sparkles'
            },
            {
                id: 'skincare',
                name: 'Skincare Services',
                description: 'Rejuvenating facial treatments',
                icon: 'fas fa-spa'
            }
        ];
    }

    // Calendar and time slot rendering methods
    renderCalendar() {
        // Implementation for calendar rendering
        return '<p>Calendar implementation needed</p>';
    }

    renderTimeSlots() {
        // Implementation for time slots rendering
        return '<p>Time slots implementation needed</p>';
    }

    // Modal methods
    showBookingPendingModal(appointment) {
        // Implementation for pending booking modal
        BeautyCita.showNotification('Appointment request sent! Waiting for stylist confirmation...', 'info', 10000);
    }

    showBookingSuccessModal(appointment) {
        // Implementation for successful booking modal
        BeautyCita.showNotification('Appointment confirmed! You will receive booking details shortly.', 'success');
        this.closeBookingModal();
    }
}

// Global booking system instance
window.BeautyCitaBooking = new BeautyCitaBookingSystem();

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeautyCitaBookingSystem;
}