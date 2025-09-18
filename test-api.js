const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login successful, token received');
    const token = loginResponse.data.token;
    
    console.log('Fetching requests...');
    const requestsResponse = await axios.get('http://localhost:5000/api/admin/requests', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('API Response:');
    console.log(JSON.stringify(requestsResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();