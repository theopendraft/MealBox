// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
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
    activeClients: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
  });
  const [deliveryList, setDeliveryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      setLoading(true);

      try {
        // --- PROMISE-BASED PARALLEL FETCHING ---

        // 1. Get Active Clients Count
        const activeClientsQuery = query(
          collection(db, 'clients'),
          where('ownerId', '==', currentUser.uid),
          where('status', '==', 'active')
        );
        const activeClientsPromise = getCountFromServer(activeClientsQuery);

        // 2. Get Today's Delivery List (which also gives us the count)
        const fetchDeliveryListPromise = async () => {
          const todayStr = getTodayDateString();
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const todayDayName = dayNames[new Date().getDay()];
          const finalList = [];

          const clientsSnapshot = await getDocs(activeClientsQuery);

          for (const clientDoc of clientsSnapshot.docs) {
            const client = { id: clientDoc.id, ...clientDoc.data() };

            // Handle On-Demand Clients
            if (client.customerType === 'ondemand') {
              // Check if main on-demand order is for today
              if (client.plan?.date === todayStr && client.plan?.mealType) {
                finalList.push({
                  ...client,
                  mealType: client.plan.mealType,
                  orderType: 'main',
                  price: client.plan.price || 0
                });
              }
            }

            // Handle Subscription Clients with regular delivery schedule
            if (client.customerType === 'subscribed' && client.deliverySchedule && client.deliverySchedule[todayDayName]) {
              // Check for pauses
              const pausesQuery = query(collection(db, 'clients', client.id, 'pauses'));
              const pausesSnapshot = await getDocs(pausesQuery);
              let lunchPaused = false;
              let dinnerPaused = false;

              for (const pauseDoc of pausesSnapshot.docs) {
                const p = pauseDoc.data();
                if (todayStr >= p.startDate && todayStr <= p.endDate) {
                  if (p.mealType === 'lunch' || p.mealType === 'both') lunchPaused = true;
                  if (p.mealType === 'dinner' || p.mealType === 'both') dinnerPaused = true;
                }
              }

              // Add lunch delivery if subscribed and not paused
              if (client.plan?.lunch?.subscribed && !lunchPaused) {
                finalList.push({
                  ...client,
                  mealType: 'lunch',
                  orderType: 'subscription',
                  price: client.plan.lunch.price || 0
                });
              }

              // Add dinner delivery if subscribed and not paused
              if (client.plan?.dinner?.subscribed && !dinnerPaused) {
                finalList.push({
                  ...client,
                  mealType: 'dinner',
                  orderType: 'subscription',
                  price: client.plan.dinner.price || 0
                });
              }
            }

            // Handle Single Tiffin Orders for ALL clients (both subscription and on-demand)
            const ordersQuery = query(collection(db, 'clients', client.id, 'orders'));
            const ordersSnapshot = await getDocs(ordersQuery);

            for (const orderDoc of ordersSnapshot.docs) {
              const order = orderDoc.data();
              let orderDateStr = order.orderDate;

              // Handle Firestore timestamp if needed
              if (order.orderDate && typeof order.orderDate.toDate === 'function') {
                orderDateStr = order.orderDate.toDate().toISOString().slice(0, 10);
              }

              if (orderDateStr === todayStr && order.mealType) {
                finalList.push({
                  ...client,
                  mealType: order.mealType,
                  orderType: 'single',
                  price: order.price || 0
                });
              }
            }
          }

          return finalList;
        };

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

        // --- Await all promises together ---
        const [
          activeClientsCount,
          todaysDeliveries,
          monthlyRevenue,
          pendingPayments
        ] = await Promise.all([
          activeClientsPromise,
          fetchDeliveryListPromise(),
          revenuePromise,
          pendingPromise,
        ]);

        setStats({
          activeClients: activeClientsCount.data().count,
          monthlyRevenue,
          pendingPayments,
        });
        setDeliveryList(todaysDeliveries);

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
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium">Tiffins for Today</h2>
          <p className="text-3xl font-bold text-indigo-600">{deliveryList.length}</p>
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

      {/* Today's Schedule Widget */}
      <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Today's Schedule</h2>
          <Link to="/deliveries" className="text-sm text-indigo-600 hover:underline">View Full List &rarr;</Link>
        </div>
        {loading ? (
          <p>Loading schedule...</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {deliveryList.length > 0 ? (
              deliveryList.map((delivery, index) => (
                <div key={`${delivery.id}-${delivery.mealType}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-800">{delivery.name}</p>
                    <p className="text-sm text-gray-500">{delivery.address}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${delivery.mealType === 'lunch' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                        {delivery.mealType?.charAt(0).toUpperCase() + delivery.mealType?.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${delivery.orderType === 'subscription' ? 'bg-green-100 text-green-800' :
                          delivery.orderType === 'main' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                        {delivery.orderType === 'subscription' ? 'Subscription' :
                          delivery.orderType === 'main' ? 'On-Demand' : 'Single Order'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-semibold text-indigo-600">{delivery.deliveryTimePreference}</p>
                    <p className="text-xs text-gray-500">₹{delivery.price}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No deliveries scheduled for today.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}