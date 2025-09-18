const mongoose = require('mongoose');
const AccessRequest = require('./models/AccessRequest');

async function debugMiddleware() {
  try {
    await mongoose.connect('mongodb://localhost:27017/qr-access-system');
    console.log('Connected to MongoDB');
    
    // Check existing requests
    const existingRequests = await AccessRequest.find({}).sort({ requestId: -1 });
    console.log('Existing requests:');
    existingRequests.forEach(req => {
      console.log(`ID: ${req._id}, RequestID: ${req.requestId || 'N/A'}, Name: ${req.fullName}`);
    });
    
    // Find the last request with requestId
    const lastRequest = await AccessRequest.findOne({}, {}, { sort: { requestId: -1 } });
    console.log('\nLast request with requestId:', lastRequest ? lastRequest.requestId : 'None found');
    
    // Create a new test request
    console.log('\nCreating new test request...');
    const newRequest = new AccessRequest({
      fullName: 'Debug Test User',
      email: 'debug@test.com',
      phoneNumber: '+1234567890',
      purposeOfAccess: 'Debug Testing',
      whomToMeet: 'Admin',
      referenceName: 'Debug Reference',
      referencePhoneNumber: '+1234567890'
    });
    
    await newRequest.save();
    console.log('New request saved with requestId:', newRequest.requestId);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

debugMiddleware();