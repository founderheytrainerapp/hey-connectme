// Test script for activity persistence
// Run this in your React Native debugger console to test the persistence

const testActivityPersistence = async () => {
  console.log("🧪 Testing Activity Persistence...");
  
  try {
    // Import the storage functions
    const { 
      saveExtraActivities, 
      loadExtraActivities, 
      clearExtraActivities 
    } = require('./src/storage/activityStorage');
    
    const testUserId = "test-user-123";
    const testActivities = [
      {
        id: "test_activity_1",
        name: "Test Activity 1",
        icon: "fitness",
        goal: 100,
        unit: "reps",
        currentValue: 50
      },
      {
        id: "test_activity_2", 
        name: "Test Activity 2",
        icon: "bicycle",
        goal: 30,
        unit: "minutes",
        currentValue: 15
      }
    ];
    
    console.log("1. Saving test activities...");
    await saveExtraActivities(testActivities, testUserId);
    
    console.log("2. Loading activities from storage...");
    const loadedActivities = await loadExtraActivities(testUserId);
    
    console.log("3. Verifying data integrity...");
    if (loadedActivities.length === testActivities.length) {
      console.log("✅ Activities count matches!");
    } else {
      console.log("❌ Activities count mismatch!");
    }
    
    const firstActivity = loadedActivities[0];
    if (firstActivity && firstActivity.name === testActivities[0].name) {
      console.log("✅ First activity data matches!");
    } else {
      console.log("❌ First activity data mismatch!");
    }
    
    console.log("4. Testing cache functionality...");
    const cachedActivities = await loadExtraActivities(testUserId);
    if (cachedActivities.length === testActivities.length) {
      console.log("✅ Cache functionality works!");
    } else {
      console.log("❌ Cache functionality failed!");
    }
    
    console.log("5. Cleaning up test data...");
    await clearExtraActivities(testUserId);
    
    console.log("🎉 Activity persistence test completed successfully!");
    
    return {
      success: true,
      saved: testActivities.length,
      loaded: loadedActivities.length,
      cached: cachedActivities.length
    };
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export for use in React Native debugger
if (typeof global !== 'undefined') {
  global.testActivityPersistence = testActivityPersistence;
}

console.log("Activity persistence test loaded. Run testActivityPersistence() to start the test.");
