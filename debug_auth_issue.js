// Quick debug script to verify Firebase configuration
// Run this in your project root: node debug_auth_issue.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Firebase Authentication Configuration Debug');
console.log('='.repeat(50));

// Check app.config.js
console.log('\n📂 App Configuration (from app.config.js):');
console.log('- Firebase Project ID: heytrainer-470210');
console.log('- Firebase Messaging Sender ID: 416410601191');
console.log('- Firebase App ID: 1:416410601191:web:600bd461d9e03343d14442');
console.log('- Google Web Client ID: 416410601191-c0ki5vg8k6625c00oopdo6o5ljqcmfnl.apps.googleusercontent.com');
console.log('- Google Android Client ID: 416410601191-ufr4sqjsue6acl5itijtg2h5b2m9uno0.apps.googleusercontent.com');
console.log('- Google iOS Client ID: 416410601191-k9q07mfp27rgi7if5hfd47g6vlruiq73.apps.googleusercontent.com');

// Check google-services.json
try {
  const googleServices = JSON.parse(fs.readFileSync('./google-services.json', 'utf8'));
  console.log('\n📂 Google Services Configuration:');
  console.log('- Project ID:', googleServices.project_info.project_id);
  console.log('- Project Number:', googleServices.project_info.project_number);
  
  const client = googleServices.client[0];
  console.log('- Package Name:', client.client_info.android_client_info.package_name);
  console.log('- App ID:', client.client_info.mobilesdk_app_id);
  
  console.log('\n🔑 OAuth Clients:');
  client.oauth_client.forEach((oauth, index) => {
    console.log(`  ${index + 1}. Client ID: ${oauth.client_id}`);
    console.log(`     Type: ${oauth.client_type === 1 ? 'Android' : oauth.client_type === 3 ? 'Web' : 'Other'}`);
  });
} catch (error) {
  console.error('❌ Error reading google-services.json:', error.message);
}

console.log('\n🚨 Critical Issues to Check:');
console.log('1. Firebase Console > Authentication > Sign-in method');
console.log('   - Enable "Phone" authentication');
console.log('   - Enable "Google" authentication');
console.log('');
console.log('2. Firebase Console > Project Settings > Android app');
console.log('   - Add SHA certificate fingerprints');
console.log('   - Debug: keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey');
console.log('');
console.log('3. Google Cloud Console > APIs & Services > Credentials');
console.log('   - Verify OAuth 2.0 client IDs match google-services.json');
console.log('   - Check authorized redirect URIs');
console.log('');
console.log('4. Rebuild your app after configuration changes:');
console.log('   - expo run:android');

console.log('\n📱 Next Steps:');
console.log('1. Compare client IDs between app.config.js and google-services.json');
console.log('2. Check Firebase Console settings');
console.log('3. Add SHA certificates to Firebase project');
console.log('4. Enable required authentication methods');
console.log('5. Rebuild and test');

console.log('\n🌐 Firebase Console URLs:');
console.log(`- Authentication: https://console.firebase.google.com/project/heytrainer-470210/authentication/users`);
console.log(`- Project Settings: https://console.firebase.google.com/project/heytrainer-470210/settings/general`);
console.log(`- Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=heytrainer-470210`);
