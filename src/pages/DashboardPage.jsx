// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, getCountFromServer, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import QuickActions from '../components/QuickActions';
import RecentActivity from '../components/RecentActivity';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatsCard } from '../components/ui/StatsCard';
import { LoadingSpinner, CardLoader } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import {
  ChartBarIcon,
  ArrowRightIcon,
  TruckIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

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
    avgOrderValue: 0,
    totalCustomers: 0,
    newCustomersThisWeek: 0,
    deliverySuccessRate: 98.5,
  });
  const [deliveryList, setDeliveryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      setLoading(true);

      try {
        // Get Active Clients Count
        const activeClientsQuery = query(
          collection(db, 'clients'),
          where('ownerId', '==', currentUser.uid),
          where('status', '==', 'active')
        );
        const activeClientsPromise = getCountFromServer(activeClientsQuery);

        // Get Today's Delivery List
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
              if (client.plan?.date === todayStr && client.plan?.mealType) {
                finalList.push({
                  ...client,
                  mealType: client.plan.mealType,
                  orderType: 'main',
                  price: client.plan.price || 0
                });
              }
            }

            // Handle Subscription Clients
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

            // Handle Single Tiffin Orders
            const ordersQuery = query(collection(db, 'clients', client.id, 'orders'));
            const ordersSnapshot = await getDocs(ordersQuery);

            for (const orderDoc of ordersSnapshot.docs) {
              const order = orderDoc.data();
              let orderDateStr = order.orderDate;

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

        // Get Quick Stats
        const currentMonthStr = getTodayDateString().substring(0, 7);
        const revenueQuery = query(
          collection(db, 'bills'),
          where('ownerId', '==', currentUser.uid),
          where('billingMonth', '==', currentMonthStr),
          where('status', '==', 'paid')
        );
        const revenuePromise = getDocs(revenueQuery).then(snapshot =>
          snapshot.docs.reduce((sum, doc) => sum + doc.data().finalAmount, 0)
        );

        const pendingQuery = query(
          collection(db, 'bills'),
          where('ownerId', '==', currentUser.uid),
          where('status', '==', 'unpaid')
        );
        const pendingPromise = getDocs(pendingQuery).then(snapshot =>
          snapshot.docs.reduce((sum, doc) => sum + doc.data().finalAmount, 0)
        );

        // Get recently added clients (within last 48 hours)
        const twoDaysAgo = new Date();
        twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

        const recentClientsQuery = query(
          collection(db, 'clients'),
          where('ownerId', '==', currentUser.uid),
          where('createdAt', '>=', twoDaysAgo),
          orderBy('createdAt', 'desc')
        );
        const recentClientsPromise = getDocs(recentClientsQuery);

        const [
          activeClientsCount,
          todaysDeliveries,
          monthlyRevenue,
          pendingPayments,
          recentClientsSnapshot,
        ] = await Promise.all([
          activeClientsPromise,
          fetchDeliveryListPromise(),
          revenuePromise,
          pendingPromise,
          recentClientsPromise,
        ]);

        setStats({
          activeClients: activeClientsCount.data().count,
          monthlyRevenue,
          pendingPayments,
          todaysRevenue: todaysDeliveries.reduce((sum, d) => sum + (d.price || 0), 0),
          newClients: recentClientsSnapshot.docs.length,
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
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <CardLoader key={i} />
          ))}
        </div>

        {/* Loading Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <CardLoader />
          </div>
          <div>
            <CardLoader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your tiffin service today.</p>
        </div>
        <Link
          to="/dashboard/analytics"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <ChartBarIcon className="h-5 w-5 mr-2" />
          View Analytics
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Link>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatsCard
          title="Today's Tiffins"
          value={deliveryList.length}
          change="+5 from yesterday"
          changeType="positive"
          icon={TruckIcon}
          color="red"
        />

        <StatsCard
          title="Active Clients"
          value={stats.activeClients}
          change="+3 this week"
          changeType="positive"
          icon={UsersIcon}
          color="green"
        />

        <StatsCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString('en-IN')}`}
          change="+12% from last month"
          changeType="positive"
          icon={CurrencyRupeeIcon}
          color="blue"
        />

        <StatsCard
          title="Pending Payments"
          value={`₹${stats.pendingPayments.toLocaleString('en-IN')}`}
          change="-8% from last week"
          changeType="negative"
          icon={ClockIcon}
          color="orange"
        />

        <StatsCard
          title="New Clients"
          value={stats.newClients || 0}
          change="Last 48 hours"
          changeType={stats.newClients > 0 ? "positive" : "neutral"}
          icon={SparklesIcon}
          color="orange"
        />
      </div>

      {/* Quick Actions Section */}
      <QuickActions />

      {/* Today's Schedule and Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Today's Schedule - Takes more space */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <TruckIcon className="h-6 w-6 text-red-600" />
                <span>Today's Delivery Schedule</span>
              </CardTitle>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 font-medium">
                  Total: ₹{stats.todaysRevenue?.toLocaleString('en-IN') || 0}
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/deliveries" className="text-red-600 hover:text-red-700">
                    View All →
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {deliveryList.length > 0 ? (
                deliveryList.map((delivery, index) => (
                  <div
                    key={`${delivery.id}-${delivery.mealType}-${index}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-red-50 transition-all duration-200 hover:shadow-md group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 group-hover:text-red-800">{delivery.name}</p>
                          <p className="text-sm text-gray-500">{delivery.address}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${delivery.mealType === 'lunch'
                            ? 'bg-yellow-100 text-yellow-800 group-hover:bg-yellow-200'
                            : 'bg-orange-100 text-orange-800 group-hover:bg-orange-200'
                            }`}>
                            {delivery.mealType?.charAt(0).toUpperCase() + delivery.mealType?.slice(1)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${delivery.orderType === 'subscription'
                            ? 'bg-red-100 text-red-800 group-hover:bg-red-200' :
                            delivery.orderType === 'main'
                              ? 'bg-orange-100 text-orange-800 group-hover:bg-orange-200'
                              : 'bg-red-100 text-red-800 group-hover:bg-red-200'
                            }`}>
                            {delivery.orderType === 'subscription' ? 'Subscription' :
                              delivery.orderType === 'main' ? 'On-Demand' : 'Single Order'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-semibold text-red-600">{delivery.deliveryTimePreference}</p>
                      <p className="text-sm font-bold text-gray-800">₹{delivery.price}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No deliveries scheduled for today</p>
                  <Button asChild>
                    <Link to="/clients" className="inline-flex items-center">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Go to Clients Page
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - Sidebar */}
        <div className="xl:col-span-1">
          <RecentActivity />
        </div>
      </div>

      {/* Quick Analytics Preview */}
      <Card className="bg-gradient-to-br from-red-600 via-orange-600 to-red-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <SparklesIcon className="h-8 w-8 text-white" />
                <h3 className="text-xl font-bold">Want deeper insights?</h3>
              </div>
              <p className="text-red-100 text-sm leading-relaxed max-w-lg">
                View comprehensive analytics including revenue trends, customer insights, delivery performance metrics, and growth opportunities.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                asChild
                className=" text-red-600 bg-transparent hover:bg-red-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Link to="/dashboard/analytics" className="inline-flex items-center px-6 py-3 font-semibold">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  View Analytics
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}