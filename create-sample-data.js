const mongoose = require('mongoose');
const AccessRequest = require('./models/AccessRequest');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/qr_access_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleRequests = [
  {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    purposeOfAccess: 'Business Meeting',
    whomToMeet: 'Jane Smith',
    submittedDate: new Date(),
    status: 'pending'
  },
  {
    fullName: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    phoneNumber: '+1987654321',
    purposeOfAccess: 'Interview',
    whomToMeet: 'HR Manager',
    submittedDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    status: 'approved'
  },
  {
    fullName: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    phoneNumber: '+1122334455',
    purposeOfAccess: 'Delivery',
    whomToMeet: 'Reception',
    submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'rejected',
    rejectionReason: 'Incomplete documentation'
  }
];

async function createSampleData() {
  try {
    // Clear existing data
    await AccessRequest.deleteMany({});
    console.log('Cleared existing requests');

    // Insert sample data
    const requests = await AccessRequest.insertMany(sampleRequests);
    console.log('Created sample requests:', requests.length);
    
    requests.forEach(req => {
      console.log(`ID: ${req._id}, Name: ${req.fullName}, Status: ${req.status}`);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating sample data:', error);
    mongoose.disconnect();
  }
}

createSampleData();