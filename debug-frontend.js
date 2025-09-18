const axios = require('axios');

async function testFrontendAPI() {
  try {
    console.log('Testing admin login...');
    
    // Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Admin token received:', token ? 'Yes' : 'No');
    
    // Test admin requests endpoint
    console.log('\nTesting admin requests endpoint...');
    const requestsResponse = await axios.get('http://localhost:5000/api/admin/requests', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Response status:', requestsResponse.status);
    console.log('Response data structure:');
    console.log('- data exists:', !!requestsResponse.data.data);
    console.log('- data length:', requestsResponse.data.data?.length || 0);
    console.log('- pagination exists:', !!requestsResponse.data.pagination);
    
    if (requestsResponse.data.data && requestsResponse.data.data.length > 0) {
      console.log('\nFirst request sample:');
      const firstRequest = requestsResponse.data.data[0];
      console.log('- _id:', firstRequest._id);
      console.log('- requestId:', firstRequest.requestId);
      console.log('- fullName:', firstRequest.fullName);
      console.log('- email:', firstRequest.email);
      console.log('- status:', firstRequest.status);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testFrontendAPI();