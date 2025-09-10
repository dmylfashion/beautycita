/* ===========================================
   BEAUTYCITA - UTILITY FUNCTIONS
   =========================================== */

// Debounce function for performance optimization
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle function for scroll and resize events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format currency with proper locale
function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Format date with various options
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    return new Intl.DateTimeFormat('en-US', formatOptions).format(new Date(date));
}

// Format time with 12-hour format
function formatTime(time, use24Hour = false) {
    const [hours, minutes] = time.split(':').map(Number);
    
    if (use24Hour) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return formatDate(date, { month: 'short', day: 'numeric' });
}

// Generate unique ID
function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Deep clone object
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const cloned = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

// Merge objects deeply
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

// Check if value is object
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Strip HTML tags
function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number (US format)
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1]?[-.\s]?[\(]?[0-9]{3}[\)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Format phone number
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/);
    
    if (match) {
        const intlCode = cleaned.length === 11 ? '1' : '';
        return `${intlCode ? '+1 ' : ''}(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2, unit = 'miles') {
    const R = unit === 'miles' ? 3959 : 6371; // Radius in miles or kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Get device type
function getDeviceType() {
    const width = window.innerWidth;
    
    if (width <= 480) return 'mobile';
    if (width <= 768) return 'tablet';
    if (width <= 1024) return 'laptop';
    return 'desktop';
}

// Check if device supports touch
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Get browser name
function getBrowserName() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            document.body.removeChild(textArea);
            return false;
        }
    }
}

// Share content using Web Share API
async function shareContent(title, text, url) {
    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('Share failed:', error);
            }
        }
    }
    
    // Fallback: copy URL to clipboard
    return await copyToClipboard(url || text);
}

// Local storage with expiration
class Storage {
    static set(key, value, expireInMinutes = null) {
        const data = {
            value,
            expire: expireInMinutes ? Date.now() + (expireInMinutes * 60 * 1000) : null
        };
        
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn('localStorage.setItem failed:', error);
            return false;
        }
    }
    
    static get(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            const data = JSON.parse(item);
            
            // Check if expired
            if (data.expire && Date.now() > data.expire) {
                localStorage.removeItem(key);
                return null;
            }
            
            return data.value;
        } catch (error) {
            console.warn('localStorage.getItem failed:', error);
            return null;
        }
    }
    
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('localStorage.removeItem failed:', error);
            return false;
        }
    }
    
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.warn('localStorage.clear failed:', error);
            return false;
        }
    }
}

// URL utilities
class URLUtils {
    static getParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    static setParam(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.replaceState({}, '', url);
    }
    
    static removeParam(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.replaceState({}, '', url);
    }
    
    static buildQueryString(params) {
        return new URLSearchParams(params).toString();
    }
}

// Image utilities
class ImageUtils {
    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    static resizeImage(file, maxWidth, maxHeight, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
}

// Animation utilities
class AnimationUtils {
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        return new Promise(resolve => {
            element.animate([
                { opacity: 0 },
                { opacity: 1 }
            ], {
                duration,
                fill: 'forwards'
            }).addEventListener('finish', resolve);
        });
    }
    
    static fadeOut(element, duration = 300) {
        return new Promise(resolve => {
            element.animate([
                { opacity: 1 },
                { opacity: 0 }
            ], {
                duration,
                fill: 'forwards'
            }).addEventListener('finish', () => {
                element.style.display = 'none';
                resolve();
            });
        });
    }
    
    static slideUp(element, duration = 300) {
        const height = element.offsetHeight;
        
        return new Promise(resolve => {
            element.animate([
                { height: `${height}px`, opacity: 1 },
                { height: '0px', opacity: 0 }
            ], {
                duration,
                fill: 'forwards'
            }).addEventListener('finish', () => {
                element.style.display = 'none';
                resolve();
            });
        });
    }
    
    static slideDown(element, duration = 300) {
        element.style.display = 'block';
        const height = element.scrollHeight;
        element.style.height = '0px';
        element.style.opacity = '0';
        
        return new Promise(resolve => {
            element.animate([
                { height: '0px', opacity: 0 },
                { height: `${height}px`, opacity: 1 }
            ], {
                duration,
                fill: 'forwards'
            }).addEventListener('finish', resolve);
        });
    }
}

// Performance monitoring
class PerformanceMonitor {
    static marks = new Map();
    
    static mark(name) {
        this.marks.set(name, performance.now());
    }
    
    static measure(name, startMark) {
        const startTime = this.marks.get(startMark);
        if (startTime) {
            const duration = performance.now() - startTime;
            console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
            return duration;
        }
        return 0;
    }
    
    static measurePageLoad() {
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`Page load time: ${loadTime}ms`);
        });
    }
}

// Error tracking
class ErrorTracker {
    static errors = [];
    
    static init() {
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason);
        });
    }
    
    static logError(type, error, context = {}) {
        const errorInfo = {
            type,
            message: error?.message || String(error),
            stack: error?.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            context
        };
        
        this.errors.push(errorInfo);
        console.error(type, errorInfo);
        
        // Send to error reporting service (implement as needed)
        // this.sendToErrorService(errorInfo);
    }
    
    static getErrors() {
        return [...this.errors];
    }
    
    static clearErrors() {
        this.errors = [];
    }
}

// Initialize error tracking
ErrorTracker.init();

// Export utilities globally
window.BeautyCitaUtils = {
    debounce,
    throttle,
    formatCurrency,
    formatDate,
    formatTime,
    formatRelativeTime,
    generateId,
    deepClone,
    mergeDeep,
    escapeHtml,
    stripHtml,
    isValidEmail,
    isValidPhone,
    formatPhoneNumber,
    calculateDistance,
    getDeviceType,
    isTouchDevice,
    getBrowserName,
    copyToClipboard,
    shareContent,
    Storage,
    URLUtils,
    ImageUtils,
    AnimationUtils,
    PerformanceMonitor,
    ErrorTracker
};

// Export for CommonJS if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeautyCitaUtils;
}