# 💄 BeautyCita

<div align="center">

**Beautiful You, Anywhere** ✨

*Premium on-demand beauty services platform with real-time booking and location tracking*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-BeautyCita.com-ff69b4?style=for-the-badge)](https://beautycita.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7+-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)

![BeautyCita Preview](https://via.placeholder.com/800x400/ff69b4/ffffff?text=BeautyCita+Preview)

</div>

---

## 🌟 **Features**

### 🎨 **Advanced Theme System**
- **Light, Dark & OLED Black** themes
- **Paintbrush theme selector** with smooth transitions
- **Automatic theme persistence** across sessions

### 📱 **Service-First Discovery**
- **Category-based stylist search** (Hair, Makeup, Nails, Skincare)
- **Intelligent ranking algorithm** prioritizing schedule flexibility
- **"NEW" badges** for stylists within 21 days
- **Distance + rating optimization**

### ⚡ **Real-Time Booking Flow**
- **5-minute confirmation window** with auto-acceptance
- **10-minute grace period** for manual confirmation
- **Live WebSocket notifications** for all parties
- **Proximity alerts** at 5-minute ETA

### 🗺️ **Advanced Location Services**
- **Google Maps integration** with directions
- **Real-time location tracking** during appointments
- **Privacy-focused visibility** (limited movement data)
- **PostGIS geospatial queries** for optimal matching

### 💬 **Secure Communication**
- **Post-payment chat activation**
- **Privacy keyword filtering** (blocks phone/email/social)
- **Real-time messaging** with delivery status
- **Typing indicators** and read receipts

### 🎭 **Premium UX/UI**
- **Bottom navigation** with floating action button
- **Elastic bounce animations** with 300ms transitions
- **Frosted glass effects** on modals
- **Particle system** with theme-responsive colors
- **Touch-optimized interactions**

---

## 🏗️ **Architecture**

### **Frontend Stack**
```
📱 Vanilla JavaScript ES6+ (Framework-free)
🎨 CSS3 with Custom Properties & Grid/Flexbox
✨ Advanced Animation System (GPU-accelerated)
🌐 Progressive Web App (PWA) Ready
📡 Socket.IO Client for Real-time Features
```

### **Backend Stack**
```
🚀 Node.js 18+ with Express.js
🗄️ PostgreSQL 14+ with PostGIS Extension
📡 Socket.IO for Real-time Communication
🔐 JWT Authentication + OAuth 2.0 (Google)
💳 PayPal Integration for Payments
📱 Twilio SMS Notifications
🗺️ Google Maps API Suite
```

### **Infrastructure**
```
🔧 PM2 Process Management
🌐 Nginx Reverse Proxy
🔥 UFW Firewall Security
🔒 SSL/TLS Certificates (Let's Encrypt)
📊 Winston Logging System
🐳 Docker Ready
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- PostgreSQL 14+ with PostGIS
- Redis (optional, for caching)
- Google Maps API key
- PayPal developer account

### **Installation**

```bash
# Clone the repository
git clone https://github.com/dmylfashion/beautycita.git
cd beautycita

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.template .env
# Edit .env with your API keys and database credentials

# Set up database
createdb beautycita_db
npm run migrate

# Start the application
npm start

# The app will be running at http://localhost:3000
```

### **Docker Setup** 🐳

```bash
# Build and run with Docker
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 📂 **Project Structure**

```
beautycita/
├── 📁 backend/                 # Node.js API Server
│   ├── 📁 config/             # Database & app configuration
│   ├── 📁 routes/             # API endpoints
│   ├── 📁 middleware/         # Security & validation
│   ├── 📁 models/             # Data models
│   ├── 📁 sockets/            # Real-time event handlers
│   └── 📄 server.js           # Main application file
├── 📁 public/                 # Frontend Assets
│   ├── 📁 css/               # Themes & animations
│   ├── 📁 js/                # JavaScript modules
│   ├── 📁 images/            # Static assets
│   └── 📄 index.html         # Main application
├── 📁 scripts/               # Database migrations & utils
├── 📁 logs/                  # Application logs
└── 📄 README.md              # You are here! 👋
```

---

## 🔧 **Environment Configuration**

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=beautycita_db
DB_USER=beautycita_user
DB_PASSWORD=your_secure_password

# JWT Security
JWT_SECRET=your_256_bit_secret_key_here
JWT_EXPIRY=24h

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# External APIs
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## 🎯 **API Endpoints**

### **Authentication**
```http
POST   /api/auth/register      # User registration
POST   /api/auth/login         # User login
GET    /api/auth/me            # Get current user
POST   /api/auth/refresh       # Refresh token
```

### **Booking System**
```http
GET    /api/stylists           # Search stylists
POST   /api/appointments       # Create booking
PATCH  /api/appointments/:id   # Update booking status
GET    /api/appointments       # List user bookings
```

### **Real-time Features**
```http
GET    /api/locations/nearby   # Find nearby stylists
POST   /api/locations/track    # Update location
GET    /api/chat/:sessionId    # Chat messages
POST   /api/chat/send          # Send message
```

---

## 🎨 **Theme Customization**

BeautyCita supports three beautiful themes:

### **Light Theme** ☀️
```css
--primary-color: #ff69b4;
--background: #ffffff;
--text-color: #333333;
```

### **Dark Theme** 🌙
```css
--primary-color: #ff69b4;
--background: #1a1a1a;
--text-color: #ffffff;
```

### **OLED Black Theme** ⚫
```css
--primary-color: #ff69b4;
--background: #000000;
--text-color: #ffffff;
```

---

## 📱 **Mobile-First Design**

### **Responsive Breakpoints**
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px  
- **Desktop**: 1024px+

### **Touch Interactions**
- **Minimum touch target**: 44px
- **Swipe gestures** supported
- **Haptic feedback** on supported devices
- **Pull-to-refresh** functionality

---

## 🔐 **Security Features**

- ✅ **Helmet.js** security headers
- ✅ **Rate limiting** on all endpoints
- ✅ **Input sanitization** and validation
- ✅ **SQL injection** prevention
- ✅ **XSS protection** with CSP headers
- ✅ **HTTPS enforcement** in production
- ✅ **JWT token** secure handling
- ✅ **CORS** configuration
- ✅ **Privacy controls** in chat system

---

## 🚦 **Performance Optimizations**

### **Frontend**
- **GPU-accelerated** animations
- **Lazy loading** with Intersection Observer
- **Service Worker** for offline functionality
- **Image optimization** with WebP support
- **CSS minification** and compression

### **Backend**
- **Database connection pooling**
- **Redis caching** for frequent queries
- **Response compression** with gzip
- **Query optimization** with proper indexes
- **PM2 clustering** for load balancing

---

## 📊 **Monitoring & Analytics**

### **Health Monitoring**
```http
GET /api/health              # Application health
GET /api/health/db           # Database connectivity
GET /api/health/redis        # Cache status
```

### **Logging System**
- **Winston** structured logging
- **Daily log rotation** with compression
- **Error tracking** and alerting
- **Performance metrics** collection

---

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:auth
npm run test:booking
npm run test:real-time
```

---

## 🚀 **Deployment**

### **Production Checklist**
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations applied
- [ ] PM2 ecosystem configured
- [ ] Nginx reverse proxy setup
- [ ] Firewall rules applied
- [ ] Log rotation configured
- [ ] Health monitoring active

### **Docker Production**
```bash
# Build production image
docker build -t beautycita:latest .

# Run in production mode
docker run -d \
  --name beautycita \
  -p 3000:3000 \
  --env-file .env.production \
  beautycita:latest
```

---

## 🤝 **Contributing**

We welcome contributions! Here's how you can help:

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### **Code Style**
- Use **ESLint** and **Prettier** for JavaScript
- Follow **BEM methodology** for CSS
- Write **descriptive commit messages**
- Add **tests** for new features

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Google Maps API** for location services
- **PayPal SDK** for payment processing
- **Twilio API** for SMS notifications
- **Socket.IO** for real-time communication
- **PostGIS** for geospatial queries
- **Beautiful UI inspiration** from modern design systems

---

## 📞 **Support**

Need help? We're here for you!

- 📧 **Email**: support@beautycita.com
- 💬 **Discord**: [BeautyCita Community](https://discord.gg/beautycita)
- 📖 **Documentation**: [docs.beautycita.com](https://docs.beautycita.com)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/dmylfashion/beautycita/issues)

---

<div align="center">

**Made with 💖 by the BeautyCita Team**

[![GitHub stars](https://img.shields.io/github/stars/dmylfashion/beautycita?style=social)](https://github.com/dmylfashion/beautycita/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/dmylfashion/beautycita?style=social)](https://github.com/dmylfashion/beautycita/network)
[![Follow on GitHub](https://img.shields.io/github/followers/dmylfashion?style=social)](https://github.com/dmylfashion)

</div>