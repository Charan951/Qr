const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Skip body parsing for image upload routes
app.use((req, res, next) => {
  if (req.path === '/api/images/upload') {
    return next();
  }
  express.json()(req, res, next);
});

app.use((req, res, next) => {
  if (req.path === '/api/images/upload') {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
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
    bufferMaxEntries: 0, // Disable mongoose buffering
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