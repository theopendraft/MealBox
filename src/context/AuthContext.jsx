// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// 1. Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// 2. Create the provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // To check initial auth state

  useEffect(() => {
    // 3. Set up the Firebase listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // 4. Cleanup the listener on unmount
    return unsubscribe;
  }, []); // 5. Empty dependency array means this runs only once

  const value = {
    currentUser,
  };

  // 6. Provide the context value to children
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}