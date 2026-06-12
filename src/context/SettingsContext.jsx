// src/context/SettingsContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

export const DEFAULT_SETTINGS = {
  businessName: 'MealBox Tiffin',
  ownerName: '',
  phone: '',
  email: '',
  upiId: '',
  businessAddress: '',
  logoUrl: '',
  modifierRates: {
    extraChapati: 7,
    extraCurd: 15,
    extraSide: 20,
  },
  routeAreas: [],
  plans: [],
  setupComplete: false,
  setupLocked: false,
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, 'settings', currentUser.uid),
      (snap) => {
        setSettings(snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS);
        setLoading(false);
      }
    );
    return unsub;
  }, [currentUser]);

  const saveSettings = (data) => {
    if (!currentUser) return Promise.reject('Not authenticated');
    return setDoc(doc(db, 'settings', currentUser.uid), data, { merge: true });
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
