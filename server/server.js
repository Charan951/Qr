const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();



// Log environment variables for debugging (without sensitive data)
console.log('Environment Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('BASE_URL:', process.env.BASE_URL);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');

const app = express();

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve logo from client public directory
app.use('/logo.png', express.static(path.join(__dirname, '../client/public/logo.png')));

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://qr-oj5t.vercel.app',
      'https://qr-oj5t-git-master-charan951s-projects.vercel.app',
      'https://qr-oj5t-charan951s-projects.vercel.app',
      process.env.FRONTEND_URL,
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In production, allow email action requests from any origin
      if (process.env.NODE_ENV === 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  optionsSuccessStatus: 200
}));

// Add explicit OPTIONS handling for preflight requests
app.options('*', cors());

// Skip body parsing for image upload routes
app.use((req, res, next) => {
  if (req.path === '/api/images/upload') {
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});

app.use((req, res, next) => {
  if (req.path === '/api/images/upload') {
    return next();
  }
  express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
});

// Connect to MongoDB with timeout and retry logic
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/access-request-db';
console.log('Connecting to MongoDB with URI:', mongoUri);

const connectWithRetry = () => {
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    maxPoolSize: 10, // Maintain up to 10 socket connections
    bufferCommands: false, // Disable mongoose buffering
  })
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.log('MongoDB connection error:', err.message);
    console.log('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
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
      console.log('Production email-action request:', {
        method: req.method,
        path: req.path,
        query: req.query,
        headers: {
          'user-agent': req.get('User-Agent'),
          'referer': req.get('Referer'),
          'origin': req.get('Origin')
        },
        timestamp: new Date().toISOString()
      });
    }
    next();
  });
}

// Routes
app.use('/api/requests', require('./routes/requests'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api', require('./routes/upload'));
app.use('/api/images', require('./routes/images'));

// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };
  
  res.status(200).json(healthStatus);
});

// Backend API only - frontend is deployed separately on Vercel

// Catch-all handler for undefined API routes (must be last)
app.use('/api/*', (req, res) => {
  // Skip if response has already been sent (for HTML responses from email-action)
  if (res.headersSent) {
    return;
  }
  res.status(404).json({ error: 'API endpoint not found' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  console.log('Server startup completed successfully');
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
