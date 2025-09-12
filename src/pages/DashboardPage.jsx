// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, where, getDocs,getCountFromServer } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    dailyTiffins: 0,
    activeClients: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      setLoading(true);

      try {
        // --- All data fetching promises will be run in parallel ---

        // 1. Get Active Clients Count
        const activeClientsQuery = query(
          collection(db, 'clients'),
          where('ownerId', '==', currentUser.uid),
          where('status', '==', 'active')
        );
        const activeClientsPromise = getCountFromServer(activeClientsQuery);

        // 2. Get Today's Tiffin Count (more complex logic)
        const fetchTiffinCount = async () => {
          const todayStr = getTodayDateString();
          const clientsSnapshot = await getDocs(activeClientsQuery);
          let tiffinCount = 0;
          for (const clientDoc of clientsSnapshot.docs) {
            const pausesQuery = query(collection(db, 'clients', clientDoc.id, 'pauses'));
            const pausesSnapshot = await getDocs(pausesQuery);
            let isPausedToday = false;
            for (const pauseDoc of pausesSnapshot.docs) {
              const p = pauseDoc.data();
              if (todayStr >= p.startDate && todayStr <= p.endDate) {
                isPausedToday = true;
                break;
              }
            }
            if (!isPausedToday) tiffinCount++;
          }
          return tiffinCount;
        };
        const dailyTiffinsPromise = fetchTiffinCount();

        // 3. Get Monthly Revenue
        const currentMonthStr = getTodayDateString().substring(0, 7); // YYYY-MM
        const revenueQuery = query(
          collection(db, 'bills'),
          where('ownerId', '==', currentUser.uid),
          where('billingMonth', '==', currentMonthStr),
          where('status', '==', 'paid')
        );
        const revenuePromise = getDocs(revenueQuery).then(snapshot => 
          snapshot.docs.reduce((sum, doc) => sum + doc.data().finalAmount, 0)
        );

        // 4. Get Total Pending Payments
        const pendingQuery = query(
          collection(db, 'bills'),
          where('ownerId', '==', currentUser.uid),
          where('status', '==', 'unpaid')
        );
        const pendingPromise = getDocs(pendingQuery).then(snapshot => 
          snapshot.docs.reduce((sum, doc) => sum + doc.data().finalAmount, 0)
        );
        
        // Wait for all promises to resolve
        const [activeClientsCount, dailyTiffins, monthlyRevenue, pendingPayments] = await Promise.all([
          activeClientsPromise,
          dailyTiffinsPromise,
          revenuePromise,
          pendingPromise,
        ]);

        setStats({
          activeClients: activeClientsCount.data().count,
          dailyTiffins,
          monthlyRevenue,
          pendingPayments,
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return <div className="p-8 text-center">Loading Dashboard...</div>;
  }
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium">Tiffins for Today</h2>
          <p className="text-3xl font-bold text-indigo-600">{stats.dailyTiffins}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium">Active Clients</h2>
          <p className="text-3xl font-bold text-green-600">{stats.activeClients}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium">Revenue This Month</h2>
          <p className="text-3xl font-bold text-blue-600">₹{stats.monthlyRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium">Pending Payments</h2>
          <p className="text-3xl font-bold text-red-600">₹{stats.pendingPayments.toLocaleString('en-IN')}</p>
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/clients" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center font-medium text-gray-700">Manage Clients</Link>
          <Link to="/deliveries" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center font-medium text-gray-700">Daily Delivery List</Link>
          <Link to="/billing" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center font-medium text-gray-700">Billing & Payments</Link>
        </div>
      </div>
    </div>
  );
}