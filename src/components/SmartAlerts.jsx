// src/components/SmartAlerts.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function SmartAlerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchAlerts = async () => {
            if (!currentUser) return;
            setLoading(true);

            try {
                const alertsList = [];

                // 1. Overdue Payments Alert
                const overdueQuery = query(
                    collection(db, 'bills'),
                    where('ownerId', '==', currentUser.uid),
                    where('status', '==', 'unpaid')
                );
                const overdueSnapshot = await getDocs(overdueQuery);
                const overdueAmount = overdueSnapshot.docs.reduce((sum, doc) => sum + doc.data().finalAmount, 0);

                if (overdueSnapshot.docs.length > 0) {
                    alertsList.push({
                        type: 'warning',
                        icon: '💰',
                        title: `${overdueSnapshot.docs.length} Overdue Payments`,
                        description: `₹${overdueAmount.toLocaleString('en-IN')} pending collection`,
                        action: { text: 'View Bills', link: '/billing' }
                    });
                }

                // 2. Today's High Volume Alert
                const today = new Date().toISOString().split('T')[0];
                const clientsSnapshot = await getDocs(query(
                    collection(db, 'clients'),
                    where('ownerId', '==', currentUser.uid),
                    where('status', '==', 'active')
                ));

                let todaysDeliveries = 0;
                for (const clientDoc of clientsSnapshot.docs) {
                    const client = clientDoc.data();
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const todayDayName = dayNames[new Date().getDay()];

                    if (client.customerType === 'subscribed' && client.deliverySchedule?.[todayDayName]) {
                        if (client.plan?.lunch?.subscribed) todaysDeliveries++;
                        if (client.plan?.dinner?.subscribed) todaysDeliveries++;
                    }
                }

                if (todaysDeliveries >= 10) {
                    alertsList.push({
                        type: 'info',
                        icon: '🚚',
                        title: 'High Volume Day',
                        description: `${todaysDeliveries} deliveries scheduled today`,
                        action: { text: 'View Schedule', link: '/deliveries' }
                    });
                }

                // 3. New Customers This Week
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);

                const newClientsQuery = query(
                    collection(db, 'clients'),
                    where('ownerId', '==', currentUser.uid),
                    where('createdAt', '>=', weekAgo),
                    orderBy('createdAt', 'desc')
                );
                const newClientsSnapshot = await getDocs(newClientsQuery);

                if (newClientsSnapshot.docs.length > 0) {
                    alertsList.push({
                        type: 'success',
                        icon: '🎉',
                        title: `${newClientsSnapshot.docs.length} New Customers`,
                        description: 'Added this week',
                        action: { text: 'View Clients', link: '/clients' }
                    });
                }

                // 4. Low Activity Alert
                const lowActivityClients = [];
                for (const clientDoc of clientsSnapshot.docs) {
                    const client = clientDoc.data();
                    if (client.customerType === 'subscribed') {
                        // Check if client has any recent orders
                        const ordersSnapshot = await getDocs(query(
                            collection(db, 'clients', clientDoc.id, 'orders'),
                            orderBy('createdAt', 'desc'),
                            limit(1)
                        ));

                        if (ordersSnapshot.docs.length === 0) {
                            const lastActivity = client.createdAt?.toDate() || new Date();
                            const daysSinceActivity = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));

                            if (daysSinceActivity > 14) {
                                lowActivityClients.push(client.name);
                            }
                        }
                    }
                }

                if (lowActivityClients.length > 0) {
                    alertsList.push({
                        type: 'warning',
                        icon: '⚠️',
                        title: `${lowActivityClients.length} Inactive Customers`,
                        description: 'No recent activity detected',
                        action: { text: 'Review', link: '/clients' }
                    });
                }

                setAlerts(alertsList);
            } catch (error) {
                console.error("Error fetching alerts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, [currentUser]);

    if (loading) {
        return <div className="text-center p-4">Loading alerts...</div>;
    }

    if (alerts.length === 0) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                    <span className="text-2xl mr-3">✅</span>
                    <div>
                        <p className="font-medium text-green-800">All Good!</p>
                        <p className="text-sm text-green-600">No alerts at this time</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {alerts.map((alert, index) => (
                <div
                    key={index}
                    className={`border rounded-lg p-4 ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            alert.type === 'success' ? 'bg-green-50 border-green-200' :
                                alert.type === 'error' ? 'bg-red-50 border-red-200' :
                                    'bg-blue-50 border-blue-200'
                        }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start">
                            <span className="text-xl mr-3">{alert.icon}</span>
                            <div>
                                <p className={`font-medium ${alert.type === 'warning' ? 'text-yellow-800' :
                                        alert.type === 'success' ? 'text-green-800' :
                                            alert.type === 'error' ? 'text-red-800' :
                                                'text-blue-800'
                                    }`}>
                                    {alert.title}
                                </p>
                                <p className={`text-sm ${alert.type === 'warning' ? 'text-yellow-600' :
                                        alert.type === 'success' ? 'text-green-600' :
                                            alert.type === 'error' ? 'text-red-600' :
                                                'text-blue-600'
                                    }`}>
                                    {alert.description}
                                </p>
                            </div>
                        </div>
                        {alert.action && (
                            <Link
                                to={alert.action.link}
                                className={`text-sm font-medium hover:underline ${alert.type === 'warning' ? 'text-yellow-700' :
                                        alert.type === 'success' ? 'text-green-700' :
                                            alert.type === 'error' ? 'text-red-700' :
                                                'text-blue-700'
                                    }`}
                            >
                                {alert.action.text} →
                            </Link>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}