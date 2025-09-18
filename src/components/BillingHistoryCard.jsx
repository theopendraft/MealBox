import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export default function BillingHistoryCard({ client }) {
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we don't have a client object yet, don't do anything.
    if (!client?.id || !client?.ownerId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const billsQuery = query(
      collection(db, 'bills'),
      where('ownerId', '==', client.ownerId),
      where('clientId', '==', client.id),
      orderBy('generatedAt', 'desc') // Order by generation time to always see the newest first
    );

    // Set up the real-time listener
    const unsubscribe = onSnapshot(billsQuery, (querySnapshot) => {

      const billsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBillingHistory(billsData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to billing history:", error);
      setLoading(false);
    });

    // Cleanup function: stop listening when the component is removed
    return () => unsubscribe();

  }, [client]); // Rerun this entire effect if the client prop changes

  // This calculation will now automatically re-run whenever the listener
  // provides a new billingHistory array.
  const totalDue = useMemo(() => {
    return billingHistory
      .filter(bill => bill.status === 'unpaid')
      .reduce((sum, bill) => sum + bill.finalAmount, 0);
  }, [billingHistory]);

  if (loading) {
    return <div className="bg-white shadow-md rounded-lg p-6 text-center">Loading Billing Info...</div>;
  }
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Account Ledger</h2>
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4">
        <p className="font-bold">Total Amount Due</p>
        <p className="text-3xl">₹{totalDue.toLocaleString('en-IN')}</p>
      </div>

      <div className="mt-4">
        <Link
          to={`/clients/${client.id}/generate-bill`}
          className="w-full block text-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Prepare New Bill
        </Link>
      </div>

      <h3 className="text-lg font-medium mb-2 mt-6">History</h3>
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {billingHistory.length > 0 ? (
          billingHistory.map(bill => (
            <div key={bill.id} className="border-b pb-2">
              <Link to={`/bills/${bill.id}`} className="block hover:bg-gray-50 p-2 rounded transition-colors">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-red-600 hover:text-red-800">
                    {bill.billingMonth ? `Bill for ${bill.billingMonth}` : `Bill: ${bill.billingPeriod?.start} to ${bill.billingPeriod?.end}`}
                  </p>
                  <p className="font-bold">₹{bill.finalAmount}</p>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <p className="text-gray-500">
                    {bill.generatedAt ? new Date(bill.generatedAt.toDate()).toLocaleDateString('en-IN') : 'N/A'}
                  </p>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.status === 'paid' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No billing history found.</p>
        )}
      </div>
    </div>
  );
}