const mongoose = require('mongoose');
const AccessRequest = require('./models/AccessRequest');

async function createCleanTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://qr:123@cluster0.ofifu7s.mongodb.net/access-request-db?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');

    // Create test requests without requestId
    const testRequests = [
      {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        purposeOfAccess: 'Business Meeting',
        whomToMeet: 'Manager',
        referenceName: 'Jane Smith',
        referencePhoneNumber: '+1234567891',
        status: 'pending'
      },
      {
        fullName: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        phoneNumber: '+1234567892',
        purposeOfAccess: 'Interview',
        whomToMeet: 'HR Director',
        referenceName: 'Bob Wilson',
        referencePhoneNumber: '+1234567893',
        status: 'pending'
      },
      {
        fullName: 'Mike Brown',
        email: 'mike.brown@example.com',
        phoneNumber: '+1234567894',
        purposeOfAccess: 'Delivery',
        whomToMeet: 'Reception',
        referenceName: 'Sarah Davis',
        referencePhoneNumber: '+1234567895',
        status: 'approved'
      }
    ];

    // Insert test requests
    const createdRequests = await AccessRequest.insertMany(testRequests);
    console.log(`Created ${createdRequests.length} test requests:`);
    
    createdRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.fullName} - ${req.email} - Status: ${req.status}`);
    });

    console.log('\nDatabase now contains clean data without requestId field');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createCleanTestData();