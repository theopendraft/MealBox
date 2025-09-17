// src/components/RevenueAnalytics.jsx
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function RevenueAnalytics() {
    const [monthlyData, setMonthlyData] = useState([]);
    const [mealTypeData, setMealTypeData] = useState([]);
    const [customerTypeData, setCustomerTypeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            if (!currentUser) return;
            setLoading(true);

            try {
                // Get last 6 months of revenue data
                const monthlyRevenue = [];
                const mealStats = { lunch: 0, dinner: 0 };
                const customerStats = { subscribed: 0, ondemand: 0 };

                // Get all bills for revenue analytics
                const billsQuery = query(
                    collection(db, 'bills'),
                    where('ownerId', '==', currentUser.uid),
                    where('status', '==', 'paid')
                );
                const billsSnapshot = await getDocs(billsQuery);

                // Process bills by month
                const monthlyMap = {};
                billsSnapshot.docs.forEach(doc => {
                    const bill = doc.data();
                    const month = bill.billingMonth || bill.generatedAt?.toDate().toISOString().slice(0, 7) || new Date().toISOString().slice(0, 7);

                    if (!monthlyMap[month]) {
                        monthlyMap[month] = { month, revenue: 0, bills: 0 };
                    }
                    monthlyMap[month].revenue += bill.finalAmount;
                    monthlyMap[month].bills += 1;

                    // Count meal types from bill details
                    if (bill.details?.lunchesDelivered > 0) {
                        mealStats.lunch += bill.details.lunchesDelivered;
                    }
                    if (bill.details?.dinnersDelivered > 0) {
                        mealStats.dinner += bill.details.dinnersDelivered;
                    }
                });

                // Convert to array and sort
                const sortedMonths = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
                setMonthlyData(sortedMonths.slice(-6)); // Last 6 months

                // Get customer type distribution
                const clientsQuery = query(
                    collection(db, 'clients'),
                    where('ownerId', '==', currentUser.uid),
                    where('status', '==', 'active')
                );
                const clientsSnapshot = await getDocs(clientsQuery);

                clientsSnapshot.docs.forEach(doc => {
                    const client = doc.data();
                    if (client.customerType === 'subscribed') {
                        customerStats.subscribed += 1;
                    } else {
                        customerStats.ondemand += 1;
                    }
                });

                // Prepare meal type data for pie chart
                setMealTypeData([
                    { name: 'Lunch', value: mealStats.lunch, color: '#fbbf24' },
                    { name: 'Dinner', value: mealStats.dinner, color: '#8b5cf6' }
                ]);

                // Prepare customer type data for pie chart
                setCustomerTypeData([
                    { name: 'Subscription', value: customerStats.subscribed, color: '#10b981' },
                    { name: 'On-Demand', value: customerStats.ondemand, color: '#3b82f6' }
                ]);

            } catch (error) {
                console.error("Error fetching analytics data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, [currentUser]);

    if (loading) {
        return <div className="text-center p-8">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meal Type Distribution */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Meal Type Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={mealTypeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {mealTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Deliveries']} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center space-x-4 mt-4">
                        {mealTypeData.map((entry, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: entry.color }}
                                ></div>
                                <span className="text-sm text-gray-600">
                                    {entry.name}: {entry.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Customer Type Distribution */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Customer Type Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={customerTypeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8">
                                {customerTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center space-x-4 mt-4">
                        {customerTypeData.map((entry, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: entry.color }}
                                ></div>
                                <span className="text-sm text-gray-600">
                                    {entry.name}: {entry.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 6 Months)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="month"
                            tickFormatter={(value) => {
                                const date = new Date(value + '-01');
                                return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                            }}
                        />
                        <YAxis
                            tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                        />
                        <Tooltip
                            formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                            labelFormatter={(label) => {
                                const date = new Date(label + '-01');
                                return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}