const mongoose = require('mongoose');
const AccessRequest = require('./models/AccessRequest');
const Message = require('./models/Message');
require('dotenv').config();

const populateCollections = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create sample access requests
    console.log('\n📝 Creating sample access requests...');
    
    const sampleRequests = [
      {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        purposeOfAccess: 'Visitor',
        whomToMeet: 'Jane Smith',
        visitorDescription: 'Meeting with HR for interview',
        status: 'pending',
        submittedDate: new Date(),
        submittedTime: new Date().toLocaleTimeString(),
        images: ['https://via.placeholder.com/150']
      },
      {
        fullName: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        phoneNumber: '+1234567891',
        purposeOfAccess: 'Contractor',
        whomToMeet: 'Bob Wilson',
        visitorDescription: 'IT maintenance work',
        status: 'approved',
        submittedDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        submittedTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleTimeString(),
        images: ['https://via.placeholder.com/150'],
        approvedBy: 'hr1@company.com',
        approvedAt: new Date()
      },
      {
        fullName: 'Mike Brown',
        email: 'mike.brown@example.com',
        phoneNumber: '+1234567892',
        purposeOfAccess: 'Delivery',
        whomToMeet: 'Reception',
        visitorDescription: 'Package delivery for office supplies',
        status: 'rejected',
        submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        submittedTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleTimeString(),
        images: ['https://via.placeholder.com/150'],
        rejectionReason: 'Incomplete documentation'
      }
    ];

    // Clear existing access requests and create new ones
    await AccessRequest.deleteMany({});
    for (const requestData of sampleRequests) {
      const request = new AccessRequest(requestData);
      await request.save();
      console.log(`  ✅ Created access request for ${requestData.email} (${requestData.status})`);
    }

    // Create sample messages
    console.log('\n💬 Creating sample messages...');
    
    const sampleMessages = [
      {
        recipient: 'hr',
        title: 'New Access Request Submitted',
        message: 'A new access request has been submitted by John Doe and requires review.',
        type: 'info',
        relatedUser: 'John Doe',
        actionBy: 'System',
        actionByRole: 'admin',
        isRead: false,
        priority: 'medium'
      },
      {
        recipient: 'admin',
        title: 'Access Request Approved',
        message: 'Access request for Alice Johnson has been approved by HR.',
        type: 'approval',
        relatedUser: 'Alice Johnson',
        actionBy: 'HR Team',
        actionByRole: 'hr',
        isRead: true,
        priority: 'low'
      },
      {
        recipient: 'both',
        title: 'Access Request Rejected',
        message: 'Access request for Mike Brown has been rejected due to incomplete documentation.',
        type: 'rejection',
        relatedUser: 'Mike Brown',
        actionBy: 'HR Manager',
        actionByRole: 'hr',
        isRead: false,
        priority: 'high'
      }
    ];

    // Clear existing messages and create new ones
    await Message.deleteMany({});
    for (const messageData of sampleMessages) {
      const message = new Message(messageData);
      await message.save();
      console.log(`  ✅ Created message from ${messageData.senderEmail} to ${messageData.recipientEmail}`);
    }

    // Verify collections were created
    console.log('\n🔍 Verifying collections...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  📊 ${collection.name}: ${count} documents`);
    }

    console.log('\n✅ All collections populated successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error populating collections:', error);
    process.exit(1);
  }
};

populateCollections();