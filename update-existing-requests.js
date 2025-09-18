const mongoose = require('mongoose');
const AccessRequest = require('./models/AccessRequest');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/qr_access_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateExistingRequests() {
  try {
    // Get all requests without requestId, sorted by creation date
    const requests = await AccessRequest.find({ requestId: { $exists: false } }).sort({ createdAt: 1 });
    
    console.log(`Found ${requests.length} requests to update`);
    
    let requestId = 1001; // Starting ID
    
    for (const request of requests) {
      request.requestId = requestId++;
      await request.save();
      console.log(`Updated request ${request._id} with requestId: ${request.requestId}`);
    }
    
    console.log('All existing requests updated successfully');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error updating requests:', error);
    mongoose.disconnect();
  }
}

updateExistingRequests();