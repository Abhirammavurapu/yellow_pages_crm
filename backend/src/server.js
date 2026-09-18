require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const leadRoutes = require('./routes/leadRoutes');
const callRoutes = require('./routes/callRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const transferRoutes = require('./routes/transferRoutes');
const importRoutes = require('./routes/importRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const listingRoutes = require('./routes/listingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const locationRoutes = require('./routes/locationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev/testing, configurable
  },
  credentials: true
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api', apiLimiter);

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
app.use(morgan('dev'));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Yellow Pages CRM API',
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/import', importRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/locations', locationRoutes);

// 404 Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`,
    errorCode: 'NOT_FOUND'
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server only when executed directly
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`Yellow Pages CRM Server running on port ${PORT}`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    });
    console.log(`[Server] Yellow Pages CRM API listening on http://localhost:${PORT}`);
  });

  // Process signal handling
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      process.exit(0);
    });
  });
}

module.exports = app;
