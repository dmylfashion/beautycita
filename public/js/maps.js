/* ===========================================
   BEAUTYCITA - GOOGLE MAPS INTEGRATION
   =========================================== */

class BeautyCitaMapsSystem {
    constructor() {
        this.map = null;
        this.markers = {};
        this.infoWindows = {};
        this.clientLocation = null;
        this.stylistLocation = null;
        this.trackingActive = false;
        this.locationWatcher = null;
        this.proximityAlertSent = false;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.currentAppointmentId = null;
    }

    // Initialize Google Maps
    async init() {
        if (typeof google === 'undefined' || !google.maps) {
            console.warn('Google Maps API not loaded');
            return false;
        }

        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#667eea',
                strokeWeight: 4,
                strokeOpacity: 0.8
            }
        });

        return true;
    }

    // Initialize map for appointment tracking
    initTrackingMap(containerId, appointmentId) {
        if (!this.init()) return null;

        this.currentAppointmentId = appointmentId;
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error('Map container not found:', containerId);
            return null;
        }

        // Default to user's location or NYC
        const defaultLocation = { lat: 40.7128, lng: -74.0060 };
        
        this.map = new google.maps.Map(container, {
            zoom: 13,
            center: defaultLocation,
            styles: this.getMapStyles(),
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: true,
            gestureHandling: 'greedy'
        });

        this.directionsRenderer.setMap(this.map);
        
        // Get user's current location and center map
        this.getCurrentLocation().then(location => {
            if (location) {
                this.map.setCenter(location);
                this.updateClientLocation(location);
            }
        });

        return this.map;
    }

    // Get current user location
    getCurrentLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
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
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    // Start location tracking for appointment
    startLocationTracking(appointmentId) {
        if (this.trackingActive) {
            this.stopLocationTracking();
        }

        this.trackingActive = true;
        this.currentAppointmentId = appointmentId;
        this.proximityAlertSent = false;

        // Start watching position
        if (navigator.geolocation) {
            this.locationWatcher = navigator.geolocation.watchPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    this.updateClientLocation(location);
                    this.sendLocationUpdate(appointmentId, location);
                    this.checkProximityAlert(location);
                },
                (error) => {
                    console.warn('Location tracking error:', error);
                    BeautyCitaNotifications.show('Location tracking unavailable', 'warning');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 10000
                }
            );

            BeautyCitaNotifications.showLocationShared();
            
            // Remind about privacy after 1 minute
            setTimeout(() => {
                if (this.trackingActive) {
                    BeautyCitaNotifications.showLocationPrivacyReminder();
                }
            }, 60000);
        }
    }

    // Stop location tracking
    stopLocationTracking() {
        if (this.locationWatcher) {
            navigator.geolocation.clearWatch(this.locationWatcher);
            this.locationWatcher = null;
        }
        
        this.trackingActive = false;
        this.currentAppointmentId = null;
        this.proximityAlertSent = false;
    }

    // Update client location on map (limited visibility)
    updateClientLocation(location) {
        this.clientLocation = location;

        // Remove existing client marker
        if (this.markers.client) {
            this.markers.client.setMap(null);
        }

        // Create client marker with limited precision for privacy
        const blurredLocation = this.blurLocation(location, 100); // 100 meter blur

        this.markers.client = new google.maps.Marker({
            position: blurredLocation,
            map: this.map,
            title: 'Your Location (approximate)',
            icon: {
                url: this.getClientMarkerIcon(),
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 40)
            },
            zIndex: 1000
        });

        // Update directions if stylist location is known
        if (this.stylistLocation) {
            this.updateDirections();
        }
    }

    // Update stylist location
    updateStylistLocation(location, status = 'confirmed') {
        this.stylistLocation = location;

        // Remove existing stylist marker
        if (this.markers.stylist) {
            this.markers.stylist.setMap(null);
        }

        // Create stylist marker
        this.markers.stylist = new google.maps.Marker({
            position: location,
            map: this.map,
            title: 'Your Stylist',
            icon: {
                url: this.getStylistMarkerIcon(status),
                scaledSize: new google.maps.Size(45, 45),
                anchor: new google.maps.Point(22.5, 45)
            },
            zIndex: 1100
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="map-info-window">
                    <h4>Your Stylist</h4>
                    <p class="status-${status}">
                        <i class="fas fa-circle"></i>
                        ${this.getStatusText(status)}
                    </p>
                </div>
            `
        });

        this.markers.stylist.addListener('click', () => {
            // Close other info windows
            Object.values(this.infoWindows).forEach(iw => iw.close());
            infoWindow.open(this.map, this.markers.stylist);
        });

        this.infoWindows.stylist = infoWindow;

        // Update directions
        if (this.clientLocation) {
            this.updateDirections();
        }

        // Center map to show both locations
        this.fitMapToBounds();
    }

    // Blur location for privacy (add random offset within radius)
    blurLocation(location, radiusMeters) {
        // Convert radius to degrees (approximate)
        const radiusDegrees = radiusMeters / 111111; // 111,111 meters per degree at equator
        
        // Generate random offset
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radiusDegrees;
        
        return {
            lat: location.lat + (distance * Math.cos(angle)),
            lng: location.lng + (distance * Math.sin(angle))
        };
    }

    // Update directions between client and stylist
    updateDirections() {
        if (!this.clientLocation || !this.stylistLocation || !this.directionsService) {
            return;
        }

        this.directionsService.route(
            {
                origin: this.stylistLocation,
                destination: this.clientLocation,
                travelMode: google.maps.TravelMode.DRIVING,
                avoidTolls: false,
                avoidHighways: false
            },
            (result, status) => {
                if (status === 'OK') {
                    this.directionsRenderer.setDirections(result);
                    
                    // Calculate ETA and distance
                    const route = result.routes[0];
                    const leg = route.legs[0];
                    
                    this.updateETADisplay(leg.duration.text, leg.distance.text);
                } else {
                    console.warn('Directions request failed:', status);
                }
            }
        );
    }

    // Fit map bounds to show both client and stylist
    fitMapToBounds() {
        if (!this.clientLocation || !this.stylistLocation) return;

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(this.clientLocation);
        bounds.extend(this.stylistLocation);

        // Add padding
        this.map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        
        // Ensure minimum zoom level
        google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
            if (this.map.getZoom() > 16) {
                this.map.setZoom(16);
            }
        });
    }

    // Check proximity and send alerts
    checkProximityAlert(clientLocation) {
        if (!this.stylistLocation || this.proximityAlertSent) return;

        const distance = this.calculateDistance(clientLocation, this.stylistLocation);
        
        // Send alert when stylist is within 5 minutes (approximately 2-3 miles depending on traffic)
        if (distance <= 3000) { // 3km threshold
            this.proximityAlertSent = true;
            
            // Notify stylist via WebSocket
            if (BeautyCita.socket && this.currentAppointmentId) {
                BeautyCita.socket.emit('client_proximity_alert', {
                    appointmentId: this.currentAppointmentId,
                    distance: distance
                });
            }

            BeautyCitaNotifications.show(
                'You are approaching your appointment location',
                'location',
                6000
            );
        }
    }

    // Calculate distance between two points (Haversine formula)
    calculateDistance(pos1, pos2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = pos1.lat * Math.PI / 180;
        const φ2 = pos2.lat * Math.PI / 180;
        const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
        const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    // Send location update to server
    async sendLocationUpdate(appointmentId, location) {
        try {
            await BeautyCitaAPI.updateClientLocation(
                appointmentId,
                location.lat,
                location.lng
            );
        } catch (error) {
            console.warn('Failed to send location update:', error);
        }
    }

    // Update ETA display in tracking UI
    updateETADisplay(duration, distance) {
        const etaElement = document.getElementById('etaInfo');
        if (etaElement) {
            etaElement.innerHTML = `
                <h4><i class="fas fa-clock"></i> ETA</h4>
                <div class="eta-display">
                    <div class="eta-time">${duration}</div>
                    <div class="eta-label">${distance} away</div>
                </div>
            `;
        }
    }

    // Get appropriate marker icon for client
    getClientMarkerIcon() {
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#667eea" stroke="white" stroke-width="3"/>
                <circle cx="20" cy="20" r="8" fill="white"/>
                <text x="20" y="26" text-anchor="middle" fill="#667eea" font-size="12" font-weight="bold">ME</text>
            </svg>
        `);
    }

    // Get appropriate marker icon for stylist based on status
    getStylistMarkerIcon(status) {
        const colors = {
            confirmed: '#10b981',
            en_route: '#f59e0b',
            arrived: '#3b82f6',
            in_progress: '#8b5cf6'
        };

        const color = colors[status] || '#6b7280';
        
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.5 0C17.25 0 13 4.25 13 9.5C13 16.625 22.5 30 22.5 30S32 16.625 32 9.5C32 4.25 27.75 0 22.5 0Z" 
                      fill="${color}" stroke="white" stroke-width="2"/>
                <circle cx="22.5" cy="9.5" r="6" fill="white"/>
                <path d="M19 7.5L21 9.5L26 4.5" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `);
    }

    // Get status text for display
    getStatusText(status) {
        const statusTexts = {
            confirmed: 'Confirmed',
            en_route: 'On the way',
            arrived: 'Arrived',
            in_progress: 'Service in progress'
        };
        return statusTexts[status] || 'Unknown status';
    }

    // Custom map styles for better UI
    getMapStyles() {
        return [
            {
                featureType: 'all',
                elementType: 'geometry.fill',
                stylers: [
                    { saturation: -15 },
                    { lightness: 5 }
                ]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [
                    { color: '#c9c9c9' },
                    { lightness: 17 }
                ]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.fill',
                stylers: [
                    { color: '#ffffff' },
                    { lightness: 17 }
                ]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [
                    { color: '#ffffff' },
                    { lightness: 29 },
                    { weight: 0.2 }
                ]
            },
            {
                featureType: 'poi',
                elementType: 'geometry',
                stylers: [
                    { color: '#f5f5f5' },
                    { lightness: 21 }
                ]
            }
        ];
    }

    // Geocode address to coordinates
    async geocodeAddress(address) {
        return new Promise((resolve, reject) => {
            if (!this.init()) {
                reject(new Error('Google Maps not available'));
                return;
            }

            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = {
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng(),
                        formatted_address: results[0].formatted_address
                    };
                    resolve(location);
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
    }

    // Reverse geocode coordinates to address
    async reverseGeocode(lat, lng) {
        return new Promise((resolve, reject) => {
            if (!this.init()) {
                reject(new Error('Google Maps not available'));
                return;
            }

            const geocoder = new google.maps.Geocoder();
            const latlng = { lat, lng };
            
            geocoder.geocode({ location: latlng }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    resolve(results[0].formatted_address);
                } else {
                    reject(new Error(`Reverse geocoding failed: ${status}`));
                }
            });
        });
    }

    // Initialize address autocomplete
    initAddressAutocomplete(inputElement, callback) {
        if (!this.init()) return null;

        const autocomplete = new google.maps.places.Autocomplete(inputElement, {
            types: ['address'],
            componentRestrictions: { country: 'us' }
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && callback) {
                callback({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    formatted_address: place.formatted_address
                });
            }
        });

        return autocomplete;
    }

    // Cleanup map resources
    cleanup() {
        this.stopLocationTracking();
        
        // Clear markers
        Object.values(this.markers).forEach(marker => {
            if (marker) marker.setMap(null);
        });
        this.markers = {};

        // Clear info windows
        Object.values(this.infoWindows).forEach(infoWindow => {
            if (infoWindow) infoWindow.close();
        });
        this.infoWindows = {};

        // Clear directions
        if (this.directionsRenderer) {
            this.directionsRenderer.setMap(null);
        }

        this.map = null;
    }
}

// Global maps system instance
window.BeautyCitaMaps = new BeautyCitaMapsSystem();

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeautyCitaMapsSystem;
}