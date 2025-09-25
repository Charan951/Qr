const fetch = require('node-fetch');

async function testFormSubmission() {
  console.log('Testing form submission API...');
  
  const testData = {
    fullName: 'Test User',
    email: 'test@example.com',
    phoneNumber: '1234567890',
    purposeOfAccess: 'visitor',
    whomToMeet: 'John Doe',
    visitorDescription: 'Testing form submission'
  };
  
  try {
    console.log('Sending POST request to http://localhost:5000/api/requests');
    console.log('Data:', testData);
    
    const response = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    if (response.ok) {
      console.log('✅ Form submission successful!');
      console.log('Request ID:', responseData.requestId);
    } else {
      console.log('❌ Form submission failed');
    }
    
  } catch (error) {
    console.error('❌ Error during form submission test:', error.message);
  }
}

testFormSubmission();