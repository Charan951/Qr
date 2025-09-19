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

// Connect to MongoDB - Use in-memory database for testing if MongoDB is not available
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/access-request-db';
console.log('Connecting to MongoDB with URI:', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.log('MongoDB connection error:', err);
  console.log('Continuing without database connection - data will not persist');
});

// Routes
app.use('/api/requests', require('./routes/requests'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api', require('./routes/upload'));
app.use('/api/images', require('./routes/images'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', status: 'OK' });
});

// Backend API only - frontend is deployed separately on Vercel

// Catch-all handler for undefined API routes (must be last)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});