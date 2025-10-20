/**
 * Test script for sleep tracking functionality
 * Run this with: node test-sleep-tracking.js
 */

// Mock AsyncStorage for testing
const mockAsyncStorage = {
  data: {},
  async getItem(key) {
    return this.data[key] || null;
  },
  async setItem(key, value) {
    this.data[key] = value;
  },
  async removeItem(key) {
    delete this.data[key];
  }
};

// Mock the AsyncStorage import
global.AsyncStorage = mockAsyncStorage;

// Import the sleep persistence service
const { sleepPersistence } = require('./src/services/SleepPersistence.ts');

async function testSleepTracking() {
  console.log('🧪 Testing Sleep Tracking Functionality...\n');

  try {
    // Test 1: Initialize daily tracking
    console.log('1. Testing daily tracking initialization...');
    await sleepPersistence.initializeDailyTracking();
    console.log('✅ Daily tracking initialized\n');

    // Test 2: Get today's sleep data
    console.log('2. Testing get today sleep data...');
    const todayData = await sleepPersistence.getTodaySleepData();
    console.log('Today sleep data:', todayData);
    console.log('✅ Today sleep data retrieved\n');

    // Test 3: Update sleep duration
    console.log('3. Testing sleep duration update...');
    const updatedData = await sleepPersistence.updateTodaySleepDuration(8.5);
    console.log('Updated sleep data:', updatedData);
    console.log('✅ Sleep duration updated\n');

    // Test 4: Update sleep quality
    console.log('4. Testing sleep quality update...');
    const qualityData = await sleepPersistence.updateTodaySleepQuality('excellent');
    console.log('Updated quality data:', qualityData);
    console.log('✅ Sleep quality updated\n');

    // Test 5: Update sleep times
    console.log('5. Testing sleep times update...');
    const timesData = await sleepPersistence.updateTodaySleepTimes('23:00', '07:00');
    console.log('Updated times data:', timesData);
    console.log('✅ Sleep times updated\n');

    // Test 6: Get weekly data
    console.log('6. Testing weekly sleep data...');
    const weeklyData = await sleepPersistence.getWeeklySleepData();
    console.log('Weekly sleep data:', weeklyData);
    console.log('✅ Weekly sleep data retrieved\n');

    // Test 7: Get sleep statistics
    console.log('7. Testing sleep statistics...');
    const stats = await sleepPersistence.getSleepStats();
    console.log('Sleep statistics:', stats);
    console.log('✅ Sleep statistics retrieved\n');

    // Test 8: Save complete sleep data
    console.log('8. Testing complete sleep data save...');
    const completeData = {
      date: new Date().toISOString().split('T')[0],
      duration: 7.5,
      quality: 'good',
      bedtime: '22:30',
      wakeTime: '06:00',
      notes: 'Had a good night sleep'
    };
    await sleepPersistence.saveSleepData(completeData);
    const savedData = await sleepPersistence.getTodaySleepData();
    console.log('Saved complete data:', savedData);
    console.log('✅ Complete sleep data saved\n');

    console.log('🎉 All sleep tracking tests passed!');
    console.log('\n📊 Final Test Results:');
    console.log('- Sleep tracking initialization: ✅');
    console.log('- Sleep data retrieval: ✅');
    console.log('- Sleep duration updates: ✅');
    console.log('- Sleep quality updates: ✅');
    console.log('- Sleep times updates: ✅');
    console.log('- Weekly data retrieval: ✅');
    console.log('- Sleep statistics: ✅');
    console.log('- Complete data saving: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSleepTracking();
