const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedHRUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/access-request-db');
    console.log('Connected to MongoDB');

    // Clear existing HR users
    await User.deleteMany({ role: 'hr' });
    console.log('Cleared existing HR users');

    // Create HR users
    const hrUsers = [
      {
        username: 'hr1',
        email: 'hr1@company.com',
        password: 'hr123456',
        role: 'hr',
        isActive: true
      },
      {
        username: 'hr2',
        email: 'hr2@company.com',
        password: 'hr123456',
        role: 'hr',
        isActive: true
      },
      {
        username: 'hr_manager',
        email: 'hrmanager@company.com',
        password: 'hrmanager123',
        role: 'hr',
        isActive: true
      }
    ];

    for (const userData of hrUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`HR user created: ${userData.username} (${userData.email})`);
    }

    console.log('All HR users created successfully');
    console.log('HR credentials:');
    console.log('- username=hr1, password=hr123456, email=hr1@company.com');
    console.log('- username=hr2, password=hr123456, email=hr2@company.com');
    console.log('- username=hr_manager, password=hrmanager123, email=hrmanager@company.com');

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding HR users:', error);
    process.exit(1);
  }
};

seedHRUsers();