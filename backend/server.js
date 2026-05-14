require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('./config/passport'); // Import our passport configuration
const User = require('./models/User'); // Import User model for OAuth
const logger = require('./config/logger');
const security = require('./middleware/security');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const authMinimalRoutes = require('./routes/auth-minimal');
const donationRoutes = require('./routes/donations');
const volunteerRoutes = require('./routes/volunteers');
const crowdfundingRoutes = require('./routes/crowdfunding');
const { verifyTransport } = require('./utils/mailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Security Middleware
if (process.env.ENABLE_HELMET === 'true') {
  app.use(security.helmet);
}

// CORS Configuration
app.use(cors(security.corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
// app.use(security.mongoSanitize); // Temporarily disabled due to Express 5 compatibility

// Data sanitization against XSS
app.use(security.xssProtection);

// Prevent parameter pollution
app.use(security.hpp);

// HTTP request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
if (process.env.ENABLE_RATE_LIMITING === 'true') {
  app.use('/api/auth', security.rateLimit.auth);
  app.use('/api/crowdfunding/apply', security.rateLimit.upload);
  app.use('/api', security.rateLimit.general);
}

// Static files for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y',
  etag: false
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hopenest')
  .then(() => {
    logger.info('Connected to MongoDB');
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Helper function to generate JWT token (placed early for OAuth routes)
function generateJWTToken(user) {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      name: user.name
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

// Direct OAuth Routes (working solution)
app.get('/api/auth/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ 
      error: 'Google OAuth not configured', 
      message: 'Please configure Google OAuth credentials in .env file'
    });
  }
  res.json({
    message: 'Google OAuth endpoint working!',
    configured: true,
    instructions: 'Set up your Google OAuth application and implement the full flow'
  });
});

app.get('/api/auth/facebook', (req, res) => {
  if (!process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
    return res.status(503).json({ 
      error: 'Facebook OAuth not configured', 
      message: 'Please configure Facebook OAuth credentials in .env file'
    });
  }
  res.json({
    message: 'Facebook OAuth endpoint working!',
    configured: true,
    instructions: 'Set up your Facebook OAuth application and implement the full flow'
  });
});

app.get('/api/auth/oauth-status', (req, res) => {
  res.json({
    message: '🎉 OAuth routes are working!',
    status: 'success',
    google_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook_configured: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
    timestamp: new Date().toISOString()
  });
});

// Routes
console.log('📍 Loading routes...');
app.use('/api', apiRoutes);
console.log('📍 API routes loaded');
app.use('/api/auth', authRoutes);  // Re-enable auth routes
console.log('📍 Auth routes loaded');
// app.use('/api/auth-minimal', authMinimalRoutes);
// console.log('📍 Minimal auth routes loaded');
app.use('/api/donations', donationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/crowdfunding', crowdfundingRoutes);
console.log('📍 All routes loaded');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Test if direct routes work
app.get('/test-google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/test-google-callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
    session: false
  }),
  (req, res) => {
    try {
      const token = generateJWTToken(req.user);
      // Redirect to home page instead of dashboard
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?token=${token}&name=${encodeURIComponent(req.user.name)}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=token_generation_failed`);
    }
  }
);

app.get('/test-facebook', passport.authenticate('facebook', {
  scope: ['email']
}));

app.get('/test-facebook-callback',
  passport.authenticate('facebook', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
    session: false
  }),
  (req, res) => {
    try {
      const token = generateJWTToken(req.user);
      // Redirect to home page instead of dashboard
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?token=${token}&name=${encodeURIComponent(req.user.name)}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Facebook OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=token_generation_failed`);
    }
  }
);

// Auth check endpoint
app.get('/api/check-auth', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.json({ isAuthenticated: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ isAuthenticated: true, userId: decoded.userId });
  } catch (err) {
    logger.warn('Invalid token in auth check:', err.message);
    res.json({ isAuthenticated: false });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error'
    });
  } else {
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

// 404 handler - handle all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

app.listen(PORT, () => {
  const message = `Server running on http://localhost:${PORT}`;
  logger.info(message);
  console.log(message);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Verify SMTP at startup for easier debugging
  verifyTransport();
});