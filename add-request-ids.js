const axios = require('axios');

async function addRequestIds() {
  try {
    console.log('Getting admin token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token received');
    
    // Get all requests
    const requestsResponse = await axios.get('http://localhost:5000/api/admin/requests?limit=100', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const requests = requestsResponse.data.data;
    console.log(`Found ${requests.length} requests to update`);
    
    let requestId = 1001;
    
    for (const request of requests) {
      if (!request.requestId) {
        try {
          // Update the request with a sequential ID (only requestId, no status)
          const response = await axios.patch(`http://localhost:5000/api/admin/requests/${request._id}`, 
            { requestId: requestId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log(`Updated request ${request._id} with requestId: ${requestId}`);
          requestId++;
        } catch (error) {
          console.error(`Error updating request ${request._id}:`, error.response?.data || error.message);
        }
      } else {
        console.log(`Request ${request._id} already has requestId: ${request.requestId}`);
      }
    }
    
    console.log('Finished updating requests');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

addRequestIds();