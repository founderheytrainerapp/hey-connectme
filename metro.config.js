// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add TypeScript and JSX support explicitly
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Suppress New Architecture warnings
config.resolver.platforms = ['ios', 'android', 'web'];

// Fix for Firebase ES module imports
config.resolver.unstable_enablePackageExports = true;

// Enable symlinks if needed (commented out to fix expo-doctor warning)
// config.resolver.unstable_enableSymlinks = true;

module.exports = config;