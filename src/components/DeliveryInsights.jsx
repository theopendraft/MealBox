import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const DeliveryInsights = () => {
  const { currentUser } = useAuth();
  const [deliveryData, setDeliveryData] = useState({
    weeklyTrends: [],
    mealTypeDistribution: [],
    orderTypeDistribution: [],
    areaPerformance: [],
    peakHours: []
  });
  const [loading, setLoading] = useState(true);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  useEffect(() => {
    const fetchDeliveryInsights = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);

        // Get last 7 days of deliveries
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date();
        endOfWeek.setHours(23, 59, 59, 999);

        // Fetch delivery data from multiple sources
        const [clientsSnapshot, billsSnapshot] = await Promise.all([
          getDocs(collection(db, 'clients')),
          getDocs(query(
            collection(db, 'bills'),
            where('createdAt', '>=', startOfWeek),
            where('createdAt', '<=', endOfWeek),
            orderBy('createdAt', 'desc')
          ))
        ]);

        // Process weekly trends
        const weeklyTrends = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          weeklyTrends.push({
            date: date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
            deliveries: 0,
            revenue: 0
          });
        }

        // Process meal type and order type distribution
        const mealTypes = { lunch: 0, dinner: 0 };
        const orderTypes = { subscription: 0, ondemand: 0, single: 0 };
        const areas = {};
        let totalDeliveries = 0;

        // Process bills data
        billsSnapshot.forEach(doc => {
          const bill = doc.data();
          const billDate = bill.createdAt.toDate().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
          
          // Find matching day in weekly trends
          const dayIndex = weeklyTrends.findIndex(day => day.date === billDate);
          if (dayIndex !== -1) {
            weeklyTrends[dayIndex].deliveries += 1;
            weeklyTrends[dayIndex].revenue += bill.totalAmount || 0;
          }
        });

        // Process client data for additional insights
        clientsSnapshot.forEach(doc => {
          const client = doc.data();
          
          // Count by client type
          if (client.clientType === 'subscription') {
            orderTypes.subscription += 1;
          } else if (client.clientType === 'ondemand') {
            orderTypes.ondemand += 1;
          }

          // Count by area
          const area = client.address?.split(',').pop()?.trim() || 'Unknown';
          areas[area] = (areas[area] || 0) + 1;
          
          totalDeliveries += 1;

          // Simulate meal type distribution (in real app, this would come from delivery data)
          if (client.clientType === 'subscription') {
            mealTypes.lunch += client.lunchEnabled ? 1 : 0;
            mealTypes.dinner += client.dinnerEnabled ? 1 : 0;
          }
        });

        // Format meal type distribution
        const mealTypeDistribution = [
          { name: 'Lunch', value: mealTypes.lunch, percentage: Math.round((mealTypes.lunch / (mealTypes.lunch + mealTypes.dinner)) * 100) },
          { name: 'Dinner', value: mealTypes.dinner, percentage: Math.round((mealTypes.dinner / (mealTypes.lunch + mealTypes.dinner)) * 100) }
        ];

        // Format order type distribution
        const orderTypeDistribution = [
          { name: 'Subscription', value: orderTypes.subscription },
          { name: 'On-Demand', value: orderTypes.ondemand },
          { name: 'Single Orders', value: orderTypes.single }
        ];

        // Format area performance (top 5 areas)
        const areaPerformance = Object.entries(areas)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([area, count]) => ({
            area: area.length > 15 ? area.substring(0, 15) + '...' : area,
            clients: count,
            percentage: Math.round((count / totalDeliveries) * 100)
          }));

        // Simulate peak hours data
        const peakHours = [
          { hour: '11 AM', orders: Math.floor(Math.random() * 20) + 15 },
          { hour: '12 PM', orders: Math.floor(Math.random() * 30) + 35 },
          { hour: '1 PM', orders: Math.floor(Math.random() * 25) + 20 },
          { hour: '7 PM', orders: Math.floor(Math.random() * 25) + 25 },
          { hour: '8 PM', orders: Math.floor(Math.random() * 30) + 30 },
          { hour: '9 PM', orders: Math.floor(Math.random() * 20) + 15 }
        ];

        setDeliveryData({
          weeklyTrends,
          mealTypeDistribution,
          orderTypeDistribution,
          areaPerformance,
          peakHours
        });

      } catch (error) {
        console.error('Error fetching delivery insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryInsights();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Delivery Insights</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-6">Delivery Insights</h3>
      
      {/* Weekly Trends */}
      <div className="mb-8">
        <h4 className="text-md font-medium mb-3 text-gray-700">Weekly Delivery Trends</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={deliveryData.weeklyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'revenue' ? `₹${value.toLocaleString('en-IN')}` : value,
                name === 'revenue' ? 'Revenue' : 'Deliveries'
              ]}
            />
            <Bar dataKey="deliveries" fill="#3B82F6" name="deliveries" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Meal Type and Order Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h4 className="text-md font-medium mb-3 text-gray-700">Meal Type Distribution</h4>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={deliveryData.mealTypeDistribution}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name} ${percentage}%`}
              >
                {deliveryData.mealTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-md font-medium mb-3 text-gray-700">Peak Delivery Hours</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={deliveryData.peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="orders" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area Performance */}
      <div>
        <h4 className="text-md font-medium mb-3 text-gray-700">Top Delivery Areas</h4>
        <div className="space-y-2">
          {deliveryData.areaPerformance.map((area, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">{area.area}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{area.clients} clients</span>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${area.percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 w-8">{area.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryInsights;