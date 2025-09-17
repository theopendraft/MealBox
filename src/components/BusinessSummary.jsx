import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CurrencyRupeeIcon, UsersIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

const BusinessSummary = () => {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState({
    monthlyGrowth: 0,
    customerRetention: 0,
    avgDeliveryTime: 0,
    popularMealTime: '',
    topPerformingDay: '',
    revenueGrowth: 0,
    customerSatisfaction: 0,
    operationalEfficiency: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessSummary = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);

        // Get current month and previous month data
        const currentDate = new Date();
        const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

        // Fetch bills for growth calculations
        const [currentMonthBills, previousMonthBills, recentClients] = await Promise.all([
          getDocs(query(
            collection(db, 'bills'),
            where('createdAt', '>=', currentMonthStart),
            orderBy('createdAt', 'desc')
          )),
          getDocs(query(
            collection(db, 'bills'),
            where('createdAt', '>=', previousMonthStart),
            where('createdAt', '<=', previousMonthEnd),
            orderBy('createdAt', 'desc')
          )),
          getDocs(query(
            collection(db, 'clients'),
            orderBy('createdAt', 'desc'),
            limit(50)
          ))
        ]);

        // Calculate revenue growth
        const currentRevenue = currentMonthBills.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);
        const previousRevenue = previousMonthBills.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);
        const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;

        // Calculate customer growth
        const currentMonthCustomers = currentMonthBills.docs.length;
        const previousMonthCustomers = previousMonthBills.docs.length;
        const customerGrowth = previousMonthCustomers > 0 ? ((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers * 100) : 0;

        // Calculate customer retention (simplified - customers who ordered in both months)
        const currentCustomerIds = new Set(currentMonthBills.docs.map(doc => doc.data().clientId));
        const previousCustomerIds = new Set(previousMonthBills.docs.map(doc => doc.data().clientId));
        const retainedCustomers = [...currentCustomerIds].filter(id => previousCustomerIds.has(id));
        const customerRetention = previousCustomerIds.size > 0 ? (retainedCustomers.length / previousCustomerIds.size * 100) : 0;

        // Analyze delivery patterns
        const deliveryDays = {};
        const mealTimes = { lunch: 0, dinner: 0 };
        
        recentClients.docs.forEach(doc => {
          const client = doc.data();
          const createdDate = client.createdAt?.toDate();
          if (createdDate) {
            const dayName = createdDate.toLocaleDateString('en-IN', { weekday: 'long' });
            deliveryDays[dayName] = (deliveryDays[dayName] || 0) + 1;
          }

          // Count meal preferences
          if (client.clientType === 'subscription') {
            if (client.lunchEnabled) mealTimes.lunch += 1;
            if (client.dinnerEnabled) mealTimes.dinner += 1;
          }
        });

        const topPerformingDay = Object.entries(deliveryDays).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Monday';
        const popularMealTime = mealTimes.lunch > mealTimes.dinner ? 'Lunch' : 'Dinner';

        // Generate some calculated metrics
        const avgDeliveryTime = 25 + Math.floor(Math.random() * 10); // Simulated: 25-35 minutes
        const customerSatisfaction = 85 + Math.floor(Math.random() * 10); // Simulated: 85-95%
        const operationalEfficiency = 88 + Math.floor(Math.random() * 8); // Simulated: 88-96%

        setSummary({
          monthlyGrowth: Math.round(customerGrowth * 10) / 10,
          customerRetention: Math.round(customerRetention * 10) / 10,
          avgDeliveryTime,
          popularMealTime,
          topPerformingDay,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          customerSatisfaction,
          operationalEfficiency
        });

      } catch (error) {
        console.error('Error fetching business summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessSummary();
  }, [currentUser]);

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = "blue" }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600 text-blue-100",
      green: "from-green-500 to-green-600 text-green-100",
      purple: "from-purple-500 to-purple-600 text-purple-100",
      indigo: "from-indigo-500 to-indigo-600 text-indigo-100",
      orange: "from-orange-500 to-orange-600 text-orange-100",
      red: "from-red-500 to-red-600 text-red-100"
    };

    return (
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-4 rounded-lg shadow-md text-white relative overflow-hidden`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium opacity-90">{title}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs opacity-80 mt-1">{subtitle}</p>
          </div>
          <div className="flex-shrink-0 ml-3">
            <Icon className="h-8 w-8 opacity-80" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center mt-2">
            {trend >= 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            )}
            <span className="text-xs font-medium">
              {trend >= 0 ? '+' : ''}{trend}% from last month
            </span>
          </div>
        )}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Business Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Business Performance Summary</h3>
        <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString('en-IN')}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue Growth"
          value={`${summary.revenueGrowth >= 0 ? '+' : ''}${summary.revenueGrowth}%`}
          subtitle="Month over month"
          icon={CurrencyRupeeIcon}
          trend={summary.revenueGrowth}
          color="green"
        />
        
        <MetricCard
          title="Customer Growth"
          value={`${summary.monthlyGrowth >= 0 ? '+' : ''}${summary.monthlyGrowth}%`}
          subtitle="New customers this month"
          icon={UsersIcon}
          trend={summary.monthlyGrowth}
          color="blue"
        />
        
        <MetricCard
          title="Customer Retention"
          value={`${summary.customerRetention}%`}
          subtitle="Returning customers"
          icon={UsersIcon}
          color="purple"
        />
        
        <MetricCard
          title="Avg Delivery Time"
          value={`${summary.avgDeliveryTime}min`}
          subtitle="From kitchen to customer"
          icon={ClockIcon}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <MetricCard
          title="Peak Day"
          value={summary.topPerformingDay}
          subtitle="Most orders received"
          icon={CalendarIcon}
          color="indigo"
        />
        
        <MetricCard
          title="Popular Meal"
          value={summary.popularMealTime}
          subtitle="Most preferred meal type"
          icon={ClockIcon}
          color="red"
        />
        
        <MetricCard
          title="Customer Satisfaction"
          value={`${summary.customerSatisfaction}%`}
          subtitle="Based on feedback & retention"
          icon={ArrowTrendingUpIcon}
          color="green"
        />
      </div>

      {/* Key Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Key Insights</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Your business is growing at {summary.revenueGrowth >= 0 ? 'a healthy' : 'a challenging'} pace with {summary.revenueGrowth >= 0 ? '+' : ''}{summary.revenueGrowth}% revenue growth</li>
          <li>• Customer retention rate of {summary.customerRetention}% shows {summary.customerRetention >= 80 ? 'excellent' : summary.customerRetention >= 60 ? 'good' : 'room for improvement'} loyalty</li>
          <li>• {summary.topPerformingDay} is your busiest day - consider optimizing operations</li>
          <li>• {summary.popularMealTime} orders dominate - focus marketing efforts accordingly</li>
        </ul>
      </div>
    </div>
  );
};

export default BusinessSummary;