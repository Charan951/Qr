const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedAdminUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/access-request-db');
    console.log('Connected to MongoDB');

    // Clear existing admin users
    await User.deleteMany({ role: 'admin' });
    console.log('Cleared existing admin users');

    // Create admin user
    const adminUser = new User({
      username: 'speshway',
      email: 'pcharan214@gmail.com',
      password: 'Speshway',
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Admin credentials: username=admin, password=admin123');

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding admin users:', error);
    process.exit(1);
  }
};

seedAdminUsers();