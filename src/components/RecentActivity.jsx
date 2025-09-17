// src/components/RecentActivity.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function RecentActivity() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchRecentActivity = async () => {
            if (!currentUser) return;
            setLoading(true);

            try {
                const activityList = [];

                // Get recent bills
                const recentBillsQuery = query(
                    collection(db, 'bills'),
                    where('ownerId', '==', currentUser.uid),
                    orderBy('generatedAt', 'desc'),
                    limit(5)
                );
                const billsSnapshot = await getDocs(recentBillsQuery);
                billsSnapshot.docs.forEach(doc => {
                    const bill = doc.data();
                    activityList.push({
                        type: 'bill',
                        icon: '💰',
                        title: `Bill generated for ${bill.clientName}`,
                        subtitle: `₹${bill.finalAmount.toLocaleString('en-IN')} - ${bill.status}`,
                        time: bill.generatedAt?.toDate() || new Date(),
                        link: `/bills/${doc.id}`,
                        color: bill.status === 'paid' ? 'text-green-600' : 'text-orange-600'
                    });
                });

                // Get recent clients
                const recentClientsQuery = query(
                    collection(db, 'clients'),
                    where('ownerId', '==', currentUser.uid),
                    orderBy('createdAt', 'desc'),
                    limit(3)
                );
                const clientsSnapshot = await getDocs(recentClientsQuery);
                clientsSnapshot.docs.forEach(doc => {
                    const client = doc.data();
                    activityList.push({
                        type: 'client',
                        icon: '👥',
                        title: `New ${client.customerType} client added`,
                        subtitle: client.name,
                        time: client.createdAt?.toDate() || new Date(),
                        link: `/clients/${doc.id}`,
                        color: 'text-blue-600'
                    });
                });

                // Sort all activities by time and take the most recent 8
                const sortedActivities = activityList
                    .sort((a, b) => b.time - a.time)
                    .slice(0, 8);

                setActivities(sortedActivities);

            } catch (error) {
                console.error("Error fetching recent activity:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentActivity();
    }, [currentUser]);

    const formatTimeAgo = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString('en-IN');
    };

    if (loading) {
        return (
            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <div className="text-center py-8 text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <Link to="/billing" className="text-sm text-indigo-600 hover:underline">
                    View All →
                </Link>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.length > 0 ? (
                    activities.map((activity, index) => (
                        <Link 
                            key={index}
                            to={activity.link}
                            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex-shrink-0 text-2xl">
                                {activity.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${activity.color}`}>
                                    {activity.title}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                    {activity.subtitle}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatTimeAgo(activity.time)}
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No recent activity</p>
                        <p className="text-xs mt-1">Start by adding clients or generating bills</p>
                    </div>
                )}
            </div>
        </div>
    );
}