/* ===========================================
   BEAUTYCITA BACKEND SERVER - REDESIGNED
   =========================================== */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');

// Import configurations and utilities
const config = require('./config/config');
const logger = require('./config/logger');
const database = require('./config/database');
const redis = require('./config/redis');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const stylistRoutes = require('./routes/stylists');
const appointmentRoutes = require('./routes/appointments');
const serviceRoutes = require('./routes/services');
const locationRoutes = require('./routes/locations');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const webhookRoutes = require('./routes/webhooks');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const socketAuth = require('./middleware/socketAuth');

// Import socket handlers
const socketHandlers = require('./sockets/handlers');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://beautycita.com', 'https://www.beautycita.com']
            : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "https://maps.googleapis.com", "https://js.paypal.com", "https://cdn.socket.io"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "wss:", "https:"],
            frameSrc: ["'self'", "https://www.paypal.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? ['https://beautycita.com', 'https://www.beautycita.com']
            : ['http://localhost:3000', 'http://127.0.0.1:3000'];
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Please try again in 15 minutes',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for static files
        return req.url.startsWith('/css/') || 
               req.url.startsWith('/js/') || 
               req.url.startsWith('/images/');
    }
});

// Slow down repeated requests
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per windowMs without delay
    delayMs: 500, // add 500ms of delay per request after delayAfter
    maxDelayMs: 20000 // max delay of 20 seconds
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 attempts per 15 minutes
    message: {
        error: 'Too many authentication attempts',
        message: 'Please try again in 15 minutes'
    }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(mongoSanitize()); // Prevent NoSQL injection attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution attacks

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) }
    }));
} else {
    app.use(morgan('dev'));
}

// Serve static files
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        // Set cache headers for different file types
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Health check endpoint (before other middleware)
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        const dbCheck = await database.query('SELECT NOW()');
        
        // Check Redis connection
        let redisStatus = 'disconnected';
        try {
            await redis.ping();
            redisStatus = 'connected';
        } catch (error) {
            logger.warn('Redis health check failed:', error.message);
        }

        res.json({
            status: 'OK',
            service: 'beautycita-backend',
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: 'connected',
            redis: redisStatus,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'ERROR',
            service: 'beautycita-backend',
            message: 'Service temporarily unavailable',
            timestamp: new Date().toISOString()
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stylists', stylistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);

// Socket.IO authentication middleware
io.use(socketAuth);

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);
    
    // Join user to their personal room
    if (socket.userId) {
        socket.join(`user_${socket.userId}`);
    }

    // Initialize socket handlers
    socketHandlers.initializeHandlers(socket, io);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        logger.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });

    // Handle socket errors
    socket.on('error', (error) => {
        logger.error(`Socket error: ${socket.id}`, error);
    });
});

// Handle uncaught socket errors
io.engine.on('connection_error', (err) => {
    logger.error('Socket connection error:', err);
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found',
            message: `The endpoint ${req.method} ${req.path} does not exist`
        });
    }
    
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Global error handlers
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    
    server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connections
        database.end()
            .then(() => logger.info('Database connections closed'))
            .catch(err => logger.error('Error closing database connections:', err));
        
        // Close Redis connection
        redis.quit()
            .then(() => logger.info('Redis connection closed'))
            .catch(err => logger.error('Error closing Redis connection:', err));
        
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.emit('SIGTERM');
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database and start server
async function startServer() {
    try {
        // Test database connection
        await database.query('SELECT NOW()');
        logger.info('Database connected successfully');
        
        // Test Redis connection (optional)
        try {
            await redis.ping();
            logger.info('Redis connected successfully');
        } catch (error) {
            logger.warn('Redis connection failed, continuing without cache:', error.message);
        }
        
        // Start HTTP server
        server.listen(PORT, HOST, () => {
            logger.info(`BeautyCita backend server running on ${HOST}:${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`Socket.IO enabled on port ${PORT}`);
        });
        
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Export for testing
module.exports = { app, server, io };

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}