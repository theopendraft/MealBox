// src/hooks/useSettings.js
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const DEFAULT_SETTINGS = {
  businessName: 'MealBox Tiffin',
  ownerName: '',
  phone: '',
  email: '',
  upiId: '',
  businessAddress: '',
  modifierRates: {
    extraChapati: 7,
    extraCurd: 15,
    extraSide: 20,
  },
  routeAreas: [],
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(
      doc(db, 'settings', currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
        }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  const saveSettings = (data) => {
    if (!currentUser) return Promise.reject('Not authenticated');
    return setDoc(doc(db, 'settings', currentUser.uid), data, { merge: true });
  };

  return { settings, loading, saveSettings };
}
