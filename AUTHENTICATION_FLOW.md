# Authentication Flow Documentation

## Overview
This document explains how the authentication system works in the Hey Trainer app, including smooth navigation to the login page when tokens are invalid or missing.

## Components

### 1. AuthGuard Component (`src/components/AuthGuard.tsx`)
- **Purpose**: Protects routes that require authentication
- **Features**:
  - Validates user authentication state
  - Checks token existence in AsyncStorage
  - Validates token with server
  - Provides smooth navigation to login page
  - Skips validation for public routes (login, promo)

### 2. Axios Interceptor (`src/utils/axios.ts`)
- **Purpose**: Automatically handles 401 responses
- **Features**:
  - Clears authentication tokens on 401 errors
  - Marks errors for proper handling
  - Provides smooth error handling

### 3. Error Handler (`src/utils/errorHandler.ts`)
- **Purpose**: Centralized error handling for authentication
- **Features**:
  - Handles API errors globally
  - Clears storage and navigates to login
  - Provides utility functions for error detection

### 4. API Error Handler (`src/utils/apiErrorHandler.ts`)
- **Purpose**: Wrapper for API calls with automatic auth error handling
- **Usage**: Wrap API calls to automatically handle auth errors

## Authentication Flow

### 1. App Initialization
```
App Start → AuthGuard → Check User Context → Check Token → Validate with Server
```

### 2. Token Validation
- Checks if user is logged in (context)
- Verifies token exists in AsyncStorage
- Validates token with server
- Redirects to login if any check fails

### 3. API Error Handling
- 401 responses trigger automatic token cleanup
- User is smoothly redirected to login page
- No manual error handling needed in components

## Usage Examples

### Basic API Call with Error Handling
```typescript
import { withAuthErrorHandling } from '@/utils/apiErrorHandler';

const fetchUserProfile = async () => {
  return await withAuthErrorHandling(() => 
    instance.get('/user/profile')
  );
};
```

### Manual Error Handling
```typescript
import { handleApiError } from '@/utils/errorHandler';

try {
  const response = await instance.get('/user/data');
} catch (error) {
  await handleApiError(error);
}
```

## Route Protection

### Public Routes (No Auth Required)
- `/login` - Login page
- `/(promo)` - Promo pages

### Protected Routes (Auth Required)
- All other routes are protected by AuthGuard
- Automatic redirect to login if not authenticated

## Key Features

1. **Smooth Navigation**: Uses `router.replace()` for seamless transitions
2. **Automatic Cleanup**: Clears tokens and user context on auth errors
3. **Loading States**: Shows loading indicators during validation
4. **Error Recovery**: Graceful handling of network and auth errors
5. **Public Route Support**: Skips auth for login and promo pages

## Configuration

The authentication system is configured in:
- `app/_layout.tsx` - Wraps app with AuthGuard
- `app/index.tsx` - Main routing logic
- `src/contexts/UserContext.tsx` - User state management

## Testing

To test the authentication flow:
1. Clear app storage to simulate no token
2. Navigate to protected route - should redirect to login
3. Login successfully - should navigate to main app
4. Make API call that returns 401 - should redirect to login
5. Check that tokens are cleared on auth errors
