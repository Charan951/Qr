const axios = require('axios');

async function createTestRequest() {
  try {
    console.log('Creating a new test request...');
    
    const response = await axios.post('http://localhost:5000/api/requests', {
      fullName: 'Test User',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      purposeOfAccess: 'Testing',
      whomToMeet: 'Admin',
      referenceName: 'Test Reference',
      referencePhoneNumber: '+1234567890'
    });
    
    console.log('New request created:', response.data);
    
    // Now fetch all requests to see if the new one has a requestId
    console.log('\nGetting admin token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    
    const requestsResponse = await axios.get('http://localhost:5000/api/admin/requests?limit=100', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\nAll requests:');
    requestsResponse.data.data.forEach(req => {
      console.log(`ID: ${req._id}, RequestID: ${req.requestId || 'N/A'}, Name: ${req.fullName}`);
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createTestRequest();