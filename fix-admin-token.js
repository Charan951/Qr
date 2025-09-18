const axios = require('axios');

async function getValidAdminToken() {
  try {
    console.log('Logging in as admin...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('📋 Copy this token and paste it in your browser console:');
    console.log('');
    console.log(`localStorage.setItem('adminToken', '${response.data.token}')`);
    console.log('');
    console.log('Then refresh the admin dashboard page.');
    
    // Test the token works
    console.log('\n🔍 Testing token...');
    const testResponse = await axios.get('http://localhost:5000/api/admin/requests', {
      headers: { Authorization: `Bearer ${response.data.token}` }
    });
    
    console.log(`✅ Token works! Found ${testResponse.data.data.length} requests in database`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

getValidAdminToken();