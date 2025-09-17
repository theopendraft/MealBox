# Authentication System - TiffinAdmin

This document explains the comprehensive authentication system implemented in the TiffinAdmin panel.

## Features

### 1. Multiple Authentication Methods

- **Email/Password**: Traditional email and password authentication
- **Google OAuth**: Sign in with Google account
- **Facebook OAuth**: Sign in with Facebook account
- **Phone Authentication**: OTP-based phone number authentication

### 2. Security Features

- **Email Verification**: Automatic email verification for new accounts
- **Password Strength Validation**: Enforced strong password requirements
- **Password Reset**: Secure password reset via email
- **OTP Verification**: SMS-based OTP for phone authentication
- **Re-authentication**: Required for sensitive operations like password changes

### 3. User Experience

- **Modern UI**: Clean, responsive authentication interface
- **Progress Indicators**: Loading states and visual feedback
- **Error Handling**: Clear error messages and recovery options
- **Multi-step Flows**: Guided authentication process

## Components

### AuthPage (`src/pages/AuthPage.jsx`)

Main authentication page with:

- Login/Signup toggle
- Email/Phone authentication method selection
- Social authentication buttons
- Form validation and error handling

### OTPVerification (`src/components/OTPVerification.jsx`)

Dedicated OTP input component featuring:

- 6-digit OTP input with auto-focus
- Resend OTP functionality
- Timer countdown
- Visual feedback

### PasswordChange (`src/components/PasswordChange.jsx`)

Secure password change modal with:

- Current password verification
- Password strength indicator
- Confirmation field
- Security checks

### ForgotPassword (`src/components/ForgotPassword.jsx`)

Password reset modal with:

- Email input validation
- Reset link sending
- Success/error feedback

### UserProfile (`src/pages/UserProfile.jsx`)

User profile page showing:

- Account information
- Authentication methods
- Security settings
- Email verification status

## Firebase Configuration

### Providers Setup (`src/config/firebase.js`)

```javascript
// Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Facebook Provider
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({
  display: "popup",
});
```

### Authentication Context (`src/context/AuthContext.jsx`)

Provides authentication methods:

- `login(email, password)` - Email/password login
- `signup(email, password)` - Account creation
- `signInWithGoogle()` - Google OAuth
- `signInWithFacebook()` - Facebook OAuth
- `signInWithPhone(phone, recaptcha)` - Phone authentication
- `resetPassword(email)` - Password reset
- `changePassword(newPassword)` - Password change
- `sendVerificationEmail()` - Email verification

## Security Considerations

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Phone Authentication

- Uses Firebase reCAPTCHA for bot protection
- OTP expires after 5 minutes
- Rate limiting on OTP requests

### Email Verification

- Required for password reset
- Automatic verification email on signup
- Manual verification option in profile

## Usage Examples

### Basic Login

```javascript
const { login } = useAuth();
await login("user@example.com", "password123");
```

### Phone Authentication

```javascript
const { signInWithPhone, setupRecaptcha } = useAuth();
const recaptchaVerifier = setupRecaptcha("recaptcha-container");
const confirmationResult = await signInWithPhone(
  "+919876543210",
  recaptchaVerifier
);
```

### Password Reset

```javascript
const { resetPassword } = useAuth();
await resetPassword("user@example.com");
```

## Routing Integration

The authentication system is integrated with React Router:

- `/auth` - Main authentication page
- `/profile` - User profile and settings
- Protected routes require authentication
- Automatic redirect to `/auth` for unauthenticated users

## Error Handling

Common error scenarios:

- Invalid credentials
- Network errors
- Firebase quota limits
- Invalid phone numbers
- Weak passwords
- Email already in use

All errors are displayed with user-friendly messages and recovery suggestions.

## Testing

To test the authentication system:

1. **Email/Password**: Create account, verify email, login
2. **Google OAuth**: Test sign in with Google popup
3. **Facebook OAuth**: Test sign in with Facebook popup
4. **Phone Auth**: Test OTP sending and verification
5. **Password Reset**: Test forgot password flow
6. **Profile Management**: Test password change and verification

## Future Enhancements

Potential improvements:

- Multi-factor authentication (MFA)
- Biometric authentication
- Social login with Twitter, GitHub
- Anonymous authentication
- Session management improvements
- Advanced security settings
