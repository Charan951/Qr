const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://your-vercel-app.vercel.app', // Replace with your actual Vercel domain
    process.env.FRONTEND_URL
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
app.use('/api', require('./routes/upload'));
app.use('/api/images', require('./routes/images'));

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', status: 'OK' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});