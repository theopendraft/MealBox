// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import {
  auth,
  googleProvider,
  facebookProvider
} from '../config/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification
} from 'firebase/auth';

// 1. Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// 2. Create the provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 3. Set up the Firebase listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // 4. Cleanup the listener on unmount
    return unsubscribe;
  }, []);

  // Email/Password Authentication
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password) => {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Send verification email immediately after account creation
      await sendEmailVerification(userCredential.user);

      return userCredential;
    } catch (error) {
      // Re-throw the error so it can be handled by the calling component
      throw error;
    }
  };

  // Social Authentication
  const signInWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const signInWithFacebook = () => {
    return signInWithPopup(auth, facebookProvider);
  };

  // Password Management
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const changePassword = (newPassword) => {
    return updatePassword(currentUser, newPassword);
  };

  // Email Verification
  const sendVerificationEmail = (user = null) => {
    const targetUser = user || currentUser;
    if (!targetUser) {
      throw new Error('No user available for email verification');
    }
    return sendEmailVerification(targetUser);
  };

  const resendVerificationEmail = async (email, password) => {
    try {
      // Sign in the user temporarily to send verification email
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      // Sign out after sending verification email
      await signOut(auth);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // Logout
  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    login,
    signup,
    signInWithGoogle,
    signInWithFacebook,
    resetPassword,
    changePassword,
    sendVerificationEmail,
    resendVerificationEmail,
    logout
  };

  // 6. Provide the context value to children
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}