const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

// Environment variables loaded
const app = express();

// // Read the generated certificate files
// const options = {
//     key: fs.readFileSync('localhost-key.pem'),
//     cert: fs.readFileSync('localhost.pem')
// };

// // Use a different port for HTTPS
// const HTTPS_PORT = 3443; 

// // Create the HTTPS server
// https.createServer(options, app).listen(HTTPS_PORT, () => {
//     console.log(`Server running securely on https://localhost:${HTTPS_PORT}`);
// });


// === ✅ UNIVERSAL CORS (working for localhost, LAN, public IP, and Vercel) ===
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow localhost, LAN IPs, your public IP, and Vercel domains
  const allowedPatterns = [
    /^http:\/\/localhost(:\d+)?$/,              // localhost (any port)
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,           // 127.0.0.1 (any port)
    /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,     // LAN IPs
    /^http:\/\/183\.83\.218\.240(:\d+)?$/,      // your public IP
    /^https:\/\/qr-oj5t.*\.vercel\.app$/,       // all vercel preview links
  ];

  const allowedExact = [
    'http://183.83.218.240:3000',
    'https://qr-oj5t.vercel.app',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
  ].filter(Boolean);

  const isAllowed =
    allowedExact.includes(origin) ||
    allowedPatterns.some((regex) => regex.test(origin));

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve logo from client public directory
app.use('/logo.png', express.static(path.join(__dirname, '../client/public/logo.png')));

// Body parsing middleware - skip only for image upload routes
app.use('/api/images/upload', (req, res, next) => {
  // Skip body parsing for image uploads (handled by multer)
  next();
});

// Apply body parsing for all other routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB with timeout and retry logic
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/access-request-db';
console.log('Connecting to MongoDB with URI:', mongoUri);

const User = require('./models/User');
const AccessRequest = require('./models/AccessRequest');
const Message = require('./models/Message');

const connectWithRetry = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
    });
    console.log('MongoDB connected successfully');

    // Ensure collections and indexes exist on startup
    try {
      await Promise.all([
        User.createCollection(),
        AccessRequest.createCollection(),
        Message.createCollection(),
      ]);

      // Sync indexes to match schema definitions
      await Promise.all([
        User.syncIndexes(),
        AccessRequest.syncIndexes(),
        Message.syncIndexes(),
      ]);

      console.log('Verified MongoDB collections and indexes are initialized');
    } catch (initErr) {
      console.error('Error initializing collections/indexes:', initErr.message);
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    connectWithRetry();
  }
};

connectWithRetry();

// Add production-specific middleware
if (process.env.NODE_ENV === 'production') {
  // Trust proxy for production deployment
  app.set('trust proxy', 1);

  // Add security headers for production
  app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Enhanced logging for production
  app.use((req, res, next) => {
    if (req.path.includes('/email-action')) {
      // Simplified logging for email-action requests
    }
    next();
  });
}

// Routes
// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      used:
        Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total:
        Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
  };

  res.status(200).json(healthStatus);
});

// Email health check endpoint
app.get('/api/health/email', async (req, res) => {
  try {
    const { checkEmailHealth } = require('./services/emailService');
    const emailHealth = await checkEmailHealth();

    const statusCode = emailHealth.status === 'healthy' ? 200 : 500;
    res.status(statusCode).json(emailHealth);
  } catch (error) {
    console.error('Email health check endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check email health',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/requests', require('./routes/requests'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api', require('./routes/upload'));
app.use('/api/images', require('./routes/images'));

// Backend API only - frontend is deployed separately on Vercel

// Catch-all handler for undefined API routes (must be last)
app.use('/api/*', (req, res) => {
  if (res.headersSent) {
    return;
  }
  res.status(404).json({ error: 'API endpoint not found' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});
