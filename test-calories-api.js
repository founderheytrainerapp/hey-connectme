const axios = require('axios');

// Test the calories API endpoints
async function testCaloriesAPI() {
  const baseURL = 'http://localhost:3000/api';
  
  // You'll need to replace this with a valid JWT token from your app
  const testToken = 'YOUR_JWT_TOKEN_HERE';
  const testUserId = '688b19221c1b5942f0000891'; // Replace with actual user ID
  
  const headers = {
    'Authorization': `Bearer ${testToken}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('🧪 Testing Calories API...\n');

    // Test 1: Upload calories data
    console.log('1. Testing POST /tracking/calories');
    const uploadData = {
      userId: testUserId,
      caloriesData: {
        current: 150,
        goal: 300,
        readings: [{
          value: 50,
          timestamp: new Date(),
          source: 'manual',
          activity: 'Walking'
        }],
        lastUpdated: new Date()
      }
    };

    try {
      const uploadResponse = await axios.post(`${baseURL}/tracking/calories`, uploadData, { headers });
      console.log('✅ Upload successful:', uploadResponse.data);
    } catch (error) {
      console.log('❌ Upload failed:', error.response?.data || error.message);
    }

    // Test 2: Get today's calories data
    console.log('\n2. Testing GET /tracking/:userId/calories/today');
    try {
      const todayResponse = await axios.get(`${baseURL}/tracking/${testUserId}/calories/today`, { headers });
      console.log('✅ Today data:', todayResponse.data);
    } catch (error) {
      console.log('❌ Today data failed:', error.response?.data || error.message);
    }

    // Test 3: Get calories analytics
    console.log('\n3. Testing GET /tracking/calories');
    const today = new Date().toISOString().split('T')[0];
    try {
      const analyticsResponse = await axios.get(`${baseURL}/tracking/calories?startDate=${today}&endDate=${today}`, { headers });
      console.log('✅ Analytics:', analyticsResponse.data);
    } catch (error) {
      console.log('❌ Analytics failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCaloriesAPI();
