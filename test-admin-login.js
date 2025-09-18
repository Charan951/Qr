// Test admin login to get a valid token
const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    // Try to login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });
    
    console.log('Login successful!');
    console.log('Token:', loginResponse.data.token);
    console.log('User:', loginResponse.data.user);
    
    // Now test the requests endpoint with the token
    console.log('\nTesting requests endpoint with token...');
    const requestsResponse = await axios.get('http://localhost:5000/api/admin/requests', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      },
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('Requests response status:', requestsResponse.status);
    console.log('Requests data:', JSON.stringify(requestsResponse.data, null, 2));
    
  } catch (error) {
    console.log('Error:', error.response?.status, error.response?.data || error.message);
  }
}

testAdminLogin();