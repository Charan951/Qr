// Check if admin token exists and is valid
const axios = require('axios');

async function checkToken() {
  try {
    // Simulate what the frontend would do
    const token = 'your-admin-token-here'; // Replace with actual token if you have one
    
    console.log('Testing admin requests endpoint...');
    const response = await axios.get('http://localhost:5000/api/admin/requests', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('Error:', error.response?.status, error.response?.data || error.message);
  }
}

checkToken();