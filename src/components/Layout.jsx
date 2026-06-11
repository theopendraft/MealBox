// src/components/Layout.jsx
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { createTodayRecords } from '../utils/dailyRecords';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';
import AddClientModal from './AddClientModal';

export default function Layout({ children }) {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const clientCountRef = useRef(null);

  // Global auto-sync: whenever a new active client is added anywhere in the app,
  // immediately create their daily record for today so Kitchen/Delivery show them.
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'clients'),
      where('ownerId', '==', currentUser.uid),
      where('status', '==', 'active')
    );
    const unsub = onSnapshot(q, async (snap) => {
      const count = snap.docs.length;
      if (clientCountRef.current === null || count > clientCountRef.current) {
        clientCountRef.current = count;
        try { await createTodayRecords(currentUser.uid); } catch { /* silent */ }
      } else {
        clientCountRef.current = count;
      }
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobile && sidebarOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobile, sidebarOpen]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl pb-24 md:pb-6">
            <div className="min-h-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      <BottomNavBar onFabPress={() => setAddClientOpen(true)} />

      <AddClientModal
        isOpen={addClientOpen}
        onClose={() => setAddClientOpen(false)}
        onSuccess={() => {
          setAddClientOpen(false);
          // Page will reload data via its own Firestore listener
        }}
      />
    </div>
  );
}
