import "dotenv/config";

export default {
  name: "HeyTrainer",
  slug: "HeyTrainer", // Keep consistent with scheme
  scheme: "heytrainer",
  version: "1.0.0",

  extra: {
    // API Configuration
    BASE_URL: process.env.BASE_URL,

    // EAS Configuration
    eas: {
      projectId:
        process.env.PROJECT_ID || "87b4a87b-5e77-45c4-9ac8-de32ed9c38b9",
    },
    recaptchaSiteKey: process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY,
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
  },

  orientation: "portrait",
  userInterfaceStyle: "automatic",

  icon: "./src/assets/images/icon.png",
  splash: {
    image: "./src/assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },

  assetBundlePatterns: ["**/*"],

  ios: {
    deploymentTarget: "15.1",
    supportsTablet: true,
    bundleIdentifier: "com.heytrainer.HeyTrainer",
    // googleServicesFile: "./GoogleService-Info.plist", // Add this
    infoPlist: {
      UIViewControllerBasedStatusBarAppearance: false,
      NSHealthShareUsageDescription:
        "This app needs access to health data to track your fitness progress.",
      NSHealthUpdateUsageDescription:
        "This app needs to write health data to track your workouts.",
      NSMotionUsageDescription:
        "This app uses motion data to track your physical activity.",
      CFBundleURLTypes: [
        {
          CFBundleTypeRole: "Editor",
          CFBundleURLName: "Google Sign-In",
          CFBundleURLSchemes: [
            "com.googleusercontent.apps.416410601191-k9q07mfp27rgi7if5hfd47g6vlruiq73",
          ],
        },
        {
          CFBundleTypeRole: "Editor",
          CFBundleURLName: "HeyTrainer",
          CFBundleURLSchemes: ["heytrainer"],
        },
      ],
    },
  },

  android: {
    package: "com.heytrainer.HeyTrainer", // Changed to lowercase for consistency
    googleServicesFile: "./google-services.json", // Removed duplicate line
    hardwareAccelerated: true,
    edgeToEdgeEnabled: true,
    usesCleartextTraffic: false, // Set to false for security
    useNextNotificationsApi: true,
    adaptiveIcon: {
      foregroundImage: "./src/assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    permissions: ["ACTIVITY_RECOGNITION", "android.permission.BODY_SENSORS"],
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./src/assets/images/favicon.png",
  },
  androidNavigationBar: {
    visible: "leanback",
    barStyle: "light-content",
    backgroundColor: "#8A2BE2",
  },
  plugins: [
    "./plugins/withHeyTrainerFirebase.js",
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    "expo-secure-store",
    [
      "expo-health-connect",
      {
        permissions: ["steps", "sleep", "hydration", "calories_expended", "heart_rate"],
      },
    ],
    "expo-font",
    [
      "expo-notifications",
      {
        icon: "./src/assets/images/notification-icon.png",
        color: "#ffffff",
        defaultChannel: "default",
      },
    ],
    "expo-web-browser",
    [
      "expo-router",
      {
        origin: "heytrainer://",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 26,
          buildToolsVersion: "35.0.0",
        },
        ios: {
          deploymentTarget: "15.1",
          useFrameworks: "static",
        },
      },
    ],
  ],
};
