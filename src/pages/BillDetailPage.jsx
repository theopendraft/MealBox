// src/pages/BillDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import GeneratePDFButton from '../components/GeneratePDFButton';

export default function BillDetailPage() {
    const [bill, setBill] = useState(null);
    const [client, setClient] = useState(null);
    const [tiffinDetails, setTiffinDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const { billId } = useParams();

    useEffect(() => {
        const fetchBillDetails = async () => {
            if (!billId) return;
            setLoading(true);

            try {
                // Fetch bill document
                const billDoc = await getDoc(doc(db, 'bills', billId));
                if (!billDoc.exists()) {
                    setBill(null);
                    setLoading(false);
                    return;
                }

                const billData = { id: billDoc.id, ...billDoc.data() };
                setBill(billData);

                // Fetch client document
                const clientDoc = await getDoc(doc(db, 'clients', billData.clientId));
                if (clientDoc.exists()) {
                    const clientData = { id: clientDoc.id, ...clientDoc.data() };
                    setClient(clientData);

                    // Reconstruct tiffin details based on bill breakdown
                    await reconstructTiffinDetails(billData, clientData);
                }

            } catch (error) {
                console.error("Error fetching bill details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBillDetails();
    }, [billId]);

    const reconstructTiffinDetails = async (billData, clientData) => {
        const details = [];
        const billDetails = billData.details || {};

        // For subscription clients - reconstruct delivered tiffins
        if (clientData.customerType === 'subscribed') {
            // Get the billing period
            const startDate = billData.billingPeriod?.start || billData.billingMonth + '-01';
            const endDate = billData.billingPeriod?.end || getLastDayOfMonth(billData.billingMonth);

            // Get pauses to exclude paused days
            const pausesSnapshot = await getDocs(collection(db, 'clients', clientData.id, 'pauses'));
            const pauses = pausesSnapshot.docs.map(doc => doc.data());

            // Reconstruct lunch deliveries
            if (billDetails.lunchesDelivered > 0) {
                const lunchDays = calculateDeliveryDays(
                    startDate,
                    endDate,
                    clientData.deliverySchedule,
                    'lunch',
                    pauses,
                    clientData.plan
                );

                lunchDays.forEach(date => {
                    details.push({
                        date,
                        mealType: 'lunch',
                        orderType: 'subscription',
                        price: billDetails.lunchPrice || 0,
                        description: 'Subscription Lunch'
                    });
                });
            }

            // Reconstruct dinner deliveries
            if (billDetails.dinnersDelivered > 0) {
                const dinnerDays = calculateDeliveryDays(
                    startDate,
                    endDate,
                    clientData.deliverySchedule,
                    'dinner',
                    pauses,
                    clientData.plan
                );

                dinnerDays.forEach(date => {
                    details.push({
                        date,
                        mealType: 'dinner',
                        orderType: 'subscription',
                        price: billDetails.dinnerPrice || 0,
                        description: 'Subscription Dinner'
                    });
                });
            }
        }

        // For on-demand clients - show main order
        if (clientData.customerType === 'ondemand' && billDetails.mainOrder) {
            details.push({
                date: billDetails.mainOrder.orderDate,
                mealType: billDetails.mainOrder.mealType,
                orderType: 'main',
                price: billDetails.mainOrderAmount || 0,
                description: 'Main On-Demand Order'
            });
        }

        // Add extra orders from the bill details
        if (billDetails.extraOrders && Array.isArray(billDetails.extraOrders)) {
            billDetails.extraOrders.forEach(order => {
                details.push({
                    date: order.orderDate,
                    mealType: order.mealType,
                    orderType: 'single',
                    price: order.price || 0,
                    description: 'Single Tiffin Order'
                });
            });
        }

        // Sort by date
        details.sort((a, b) => new Date(a.date) - new Date(b.date));
        setTiffinDetails(details);
    };

    const calculateDeliveryDays = (startDate, endDate, deliverySchedule, mealType, pauses, plan) => {
        const days = [];
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        let current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const dayName = dayNames[current.getDay()];

            // Check if it's within plan period
            if (plan?.startDate && dateStr < plan.startDate) {
                current.setDate(current.getDate() + 1);
                continue;
            }
            if (plan?.endDate && dateStr > plan.endDate) {
                current.setDate(current.getDate() + 1);
                continue;
            }

            // Check if delivery is scheduled for this day
            if (!deliverySchedule || !deliverySchedule[dayName]) {
                current.setDate(current.getDate() + 1);
                continue;
            }

            // Check if meal is subscribed
            if (!plan?.[mealType]?.subscribed) {
                current.setDate(current.getDate() + 1);
                continue;
            }

            // Check if it's paused
            const isPaused = pauses.some(pause => {
                return (pause.mealType === mealType || pause.mealType === 'both') &&
                    dateStr >= pause.startDate && dateStr <= pause.endDate;
            });

            if (!isPaused) {
                days.push(dateStr);
            }

            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    const getLastDayOfMonth = (monthStr) => {
        const [year, month] = monthStr.split('-');
        const lastDay = new Date(year, month, 0).getDate();
        return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    };

    if (loading) {
        return <div className="p-8 text-center">Loading bill details...</div>;
    }

    if (!bill) {
        return (
            <div className="p-8 text-center">
                <p>Bill not found.</p>
                <Link to="/billing" className="text-indigo-600 hover:underline">← Back to Billing</Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link to="/billing" className="text-indigo-600 hover:underline mb-2 block">
                        ← Back to Billing
                    </Link>
                    <h1 className="text-3xl font-bold">Bill Details</h1>
                    <p className="text-gray-600">Bill ID: {bill.id}</p>
                </div>
                <GeneratePDFButton bill={bill} client={client} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bill Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Bill Summary</h2>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Client:</span>
                                <span className="font-medium">{bill.clientName}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Period:</span>
                                <span className="font-medium">
                                    {bill.billingMonth
                                        ? bill.billingMonth
                                        : `${bill.billingPeriod?.start} to ${bill.billingPeriod?.end}`
                                    }
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Generated:</span>
                                <span className="font-medium">
                                    {bill.generatedAt ? new Date(bill.generatedAt.toDate()).toLocaleDateString('en-IN') : 'N/A'}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {bill.status}
                                </span>
                            </div>

                            <div className="border-t pt-3 mt-3">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total Amount:</span>
                                    <span className="text-green-600">₹{bill.finalAmount.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill Breakdown */}
                    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
                        <h2 className="text-xl font-semibold mb-4">Bill Breakdown</h2>
                        <div className="space-y-2">
                            {bill.details?.lunchesDelivered > 0 && (
                                <div className="flex justify-between">
                                    <span>Lunch Deliveries ({bill.details.lunchesDelivered})</span>
                                    <span>₹{(bill.details.lunchesDelivered * bill.details.lunchPrice).toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            {bill.details?.dinnersDelivered > 0 && (
                                <div className="flex justify-between">
                                    <span>Dinner Deliveries ({bill.details.dinnersDelivered})</span>
                                    <span>₹{(bill.details.dinnersDelivered * bill.details.dinnerPrice).toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            {bill.details?.mainOrderAmount > 0 && (
                                <div className="flex justify-between">
                                    <span>Main On-Demand Order</span>
                                    <span>₹{bill.details.mainOrderAmount.toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            {bill.details?.extraOrdersAmount > 0 && (
                                <div className="flex justify-between">
                                    <span>Extra Orders ({bill.details.extraOrdersCount})</span>
                                    <span>₹{bill.details.extraOrdersAmount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tiffin Details */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Tiffin Delivery Details ({tiffinDetails.length} items)
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meal</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tiffinDetails.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {new Date(item.date).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.mealType === 'lunch' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {item.mealType?.charAt(0).toUpperCase() + item.mealType?.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.orderType === 'subscription' ? 'bg-green-100 text-green-800' :
                                                        item.orderType === 'main' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
                                                    }`}>
                                                    {item.orderType === 'subscription' ? 'Subscription' :
                                                        item.orderType === 'main' ? 'On-Demand' : 'Single Order'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                ₹{item.price}
                                            </td>
                                        </tr>
                                    ))}

                                    {tiffinDetails.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                                No tiffin details available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                                {/* Total row */}
                                {tiffinDetails.length > 0 && (
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-3 text-sm font-bold text-gray-900">
                                                Total
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                                ₹{tiffinDetails.reduce((sum, item) => sum + item.price, 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}