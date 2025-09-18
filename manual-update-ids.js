const axios = require('axios');

async function updateRequestIds() {
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
    console.log(`Found ${requests.length} requests`);
    
    let requestId = 1001;
    
    // Sort by creation date to assign IDs in chronological order
    const sortedRequests = requests.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    for (const request of sortedRequests) {
      console.log(`\nProcessing request: ${request._id}`);
      console.log(`Current requestId: ${request.requestId || 'N/A'}`);
      
      if (!request.requestId) {
        try {
          console.log(`Updating with requestId: ${requestId}`);
          const response = await axios.patch(`http://localhost:5000/api/admin/requests/${request._id}`, 
            { requestId: requestId },
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              } 
            }
          );
          console.log(`✓ Successfully updated request ${request._id} with requestId: ${requestId}`);
          requestId++;
        } catch (error) {
          console.error(`✗ Error updating request ${request._id}:`, error.response?.data || error.message);
        }
      } else {
        console.log(`Request already has requestId: ${request.requestId}`);
      }
    }
    
    console.log('\n=== Final verification ===');
    const finalResponse = await axios.get('http://localhost:5000/api/admin/requests?limit=100', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('All requests after update:');
    finalResponse.data.data.forEach(req => {
      console.log(`ID: ${req._id.slice(-8)}, RequestID: ${req.requestId || 'N/A'}, Name: ${req.fullName}`);
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

updateRequestIds();