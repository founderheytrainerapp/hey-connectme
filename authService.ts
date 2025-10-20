// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import { FirebaseAuthTypes } from '@react-native-firebase/auth';
// import { Platform } from 'react-native';

// // Types
// export interface PhoneAuthResult {
//   success: boolean;
//   verificationId?: string;
//   error?: string;
// }

// export interface OTPVerificationResult {
//   success: boolean;
//   user?: FirebaseAuthTypes.User;
//   error?: string;
// }

// export interface GoogleSignInResult {
//   success: boolean;
//   user?: FirebaseAuthTypes.User;
//   error?: string;
// }

// class AuthService {
//   // Send phone verification code
//   async sendPhoneVerificationCode(phoneNumber: string): Promise<PhoneAuthResult> {
//     try {
//       const confirmation = await auth().signInWithPhoneNumber(phoneNumber);

//       return {
//         success: true,
//         verificationId: confirmation.verificationId || undefined
//       };
//     } catch (error: any) {
//       console.error('Error sending verification code:', error);

//       let errorMessage = 'Failed to send verification code';
//       if (error.code === 'auth/invalid-phone-number') {
//         errorMessage = 'Invalid phone number format';
//       } else if (error.code === 'auth/too-many-requests') {
//         errorMessage = 'Too many requests. Please try again later';
//       } else if (error.code === 'auth/quota-exceeded') {
//         errorMessage = 'SMS quota exceeded. Please try again later';
//       }

//       return {
//         success: false,
//         error: errorMessage
//       };
//     }
//   }

//   // Verify OTP code
//   async verifyOTP(verificationId: string, code: string): Promise<OTPVerificationResult> {
//     try {
//       const credential = auth.PhoneAuthProvider.credential(verificationId, code);
//       const userCredential = await auth().signInWithCredential(credential);

//       return {
//         success: true,
//         user: userCredential.user
//       };
//     } catch (error: any) {
//       console.error('Error verifying OTP:', error);

//       let errorMessage = 'Invalid verification code';
//       if (error.code === 'auth/invalid-verification-code') {
//         errorMessage = 'Invalid verification code';
//       } else if (error.code === 'auth/code-expired') {
//         errorMessage = 'Verification code has expired';
//       } else if (error.code === 'auth/session-expired') {
//         errorMessage = 'Session has expired. Please request a new code';
//       }

//       return {
//         success: false,
//         error: errorMessage
//       };
//     }
//   }

//   // Google Sign-In
//  async signInWithGoogle(): Promise<GoogleSignInResult> {
//   try {
//     // For Android, check Play Services
//     if (Platform.OS === 'android') {
//       await GoogleSignin.hasPlayServices();
//     }

//     // Sign in with Google
//     const userInfo = await GoogleSignin.signIn();

//     // Get tokens - this is the reliable way
//     const tokens = await GoogleSignin.getTokens();

//     if (!tokens.idToken) {
//       throw new Error('No ID token received from Google');
//     }

//     // Create a Google credential with the token
//     const googleCredential = auth.GoogleAuthProvider.credential(tokens.idToken);

//     // Sign-in the user with the credential
//     const userCredential = await auth().signInWithCredential(googleCredential);

//     return {
//       success: true,
//       user: userCredential.user
//     };
//   } catch (error: any) {
//     console.error('Google sign-in error:', error);

//       let errorMessage = 'Google sign-in failed';
//       if (error.code === 'auth/account-exists-with-different-credential') {
//         errorMessage = 'Account exists with different sign-in method';
//       } else if (error.code === 'auth/credential-already-in-use') {
//         errorMessage = 'This Google account is already linked to another user';
//       } else if (error.code === 'auth/operation-not-allowed') {
//         errorMessage = 'Google sign-in is not enabled';
//       } else if (error.code === 12501) { // Google Sign-In was cancelled
//         errorMessage = 'Sign-in was cancelled';
//       } else if (error.message === 'Sign in action cancelled') {
//         errorMessage = 'Sign-in was cancelled';
//       } else if (error.message === 'DEVELOPER_ERROR') {
//         errorMessage = 'Google Sign-In not configured properly';
//       }

//       return {
//         success: false,
//         error: errorMessage
//       };
//     }
//   }

//   // Alternative Google Sign-In method that uses getTokens
//   async signInWithGoogleAlt(): Promise<GoogleSignInResult> {
//     try {
//       // Sign in with Google
//       await GoogleSignin.hasPlayServices();
//       const userInfo = await GoogleSignin.signIn();

//       // Get the ID token using getTokens
//       const tokens = await GoogleSignin.getTokens();

//       if (!tokens.idToken) {
//         throw new Error('No ID token received from Google');
//       }

//       // Create a Google credential with the token
//       const googleCredential = auth.GoogleAuthProvider.credential(tokens.idToken);

//       // Sign-in the user with the credential
//       const userCredential = await auth().signInWithCredential(googleCredential);

//       return {
//         success: true,
//         user: userCredential.user
//       };
//     } catch (error: any) {
//       console.error('Google sign-in error:', error);

//       let errorMessage = 'Google sign-in failed';
//       if (error.code === 'auth/account-exists-with-different-credential') {
//         errorMessage = 'Account exists with different sign-in method';
//       } else if (error.code === 'auth/credential-already-in-use') {
//         errorMessage = 'This Google account is already linked to another user';
//       } else if (error.code === 'auth/operation-not-allowed') {
//         errorMessage = 'Google sign-in is not enabled';
//       } else if (error.code === 12501 || error.message === 'Sign in action cancelled') {
//         errorMessage = 'Sign-in was cancelled';
//       }

//       return {
//         success: false,
//         error: errorMessage
//       };
//     }
//   }

//   // Anonymous sign-in
//   async signInAnonymously(): Promise<GoogleSignInResult> {
//     try {
//       const userCredential = await auth().signInAnonymously();
//       return {
//         success: true,
//         user: userCredential.user
//       };
//     } catch (error: any) {
//       console.error('Anonymous sign-in error:', error);
//       return {
//         success: false,
//         error: 'Anonymous sign-in failed'
//       };
//     }
//   }

//   // Sign out
//   async signOut(): Promise<void> {
//     try {
//       // Check if user is signed in with Google before trying to sign out
//       const currentUser = await GoogleSignin.getCurrentUser();

//       if (currentUser) {
//         await GoogleSignin.revokeAccess();
//         await GoogleSignin.signOut();
//       }

//       await auth().signOut();
//       console.log('User signed out successfully');
//     } catch (error) {
//       console.error('Error signing out:', error);
//       // Still sign out from Firebase even if Google sign-out fails
//       try {
//         await auth().signOut();
//       } catch (firebaseSignOutError) {
//         console.error('Firebase sign-out also failed:', firebaseSignOutError);
//       }
//     }
//   }

//   // Get current user
//   getCurrentUser(): FirebaseAuthTypes.User | null {
//     return auth().currentUser;
//   }

//   // Check if user is signed in
//   isSignedIn(): boolean {
//     return !!auth().currentUser;
//   }

//   // Check if Google user is signed in
//   async isGoogleSignedIn(): Promise<boolean> {
//     try {
//       const currentUser = await GoogleSignin.getCurrentUser();
//       return currentUser !== null;
//     } catch (error) {
//       return false;
//     }
//   }

//   // Update user profile
//   async updateUserProfile(profile: { displayName?: string; photoURL?: string }): Promise<void> {
//     try {
//       const user = auth().currentUser;
//       if (user) {
//         await user.updateProfile(profile);
//       }
//     } catch (error) {
//       console.error('Error updating user profile:', error);
//       throw error;
//     }
//   }

//   // Listen to auth state changes
//   onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void): () => void {
//     return auth().onAuthStateChanged(callback);
//   }
// }

// // Create singleton instance
// const authServiceInstance = new AuthService();

// // Export both named and default exports
// export const authService = authServiceInstance;
// export default authServiceInstance;
