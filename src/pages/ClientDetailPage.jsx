// src/pages/ClientDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

import ClientInfoCard from '../components/ClientInfoCard';
import BillingHistoryCard from '../components/BillingHistoryCard';
import PauseManager from '../components/PauseManager';
import OrderManager from '../components/OrderManager';

export default function ClientDetailPage() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const { clientId } = useParams();

  // Check if a client was added recently (within last 48 hours)
  const isRecentlyAdded = (client) => {
    if (!client?.createdAt) return false;

    const now = new Date();
    const createdAt = client.createdAt.toDate ? client.createdAt.toDate() : new Date(client.createdAt);
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

    return hoursDiff <= 48;
  };

  useEffect(() => {
    if (!clientId) return;
    const fetchClientData = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'clients', clientId));
        if (docSnap.exists()) {
          setClient({ id: docSnap.id, ...docSnap.data() });
        } else {
          setClient(null);
        }
      } catch (error) {
        console.error("Error fetching client details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClientData();
  }, [clientId]);

  if (loading) return <div className="p-8 text-center">Loading client details...</div>;
  if (!client) return <div className="p-8 text-center">Client not found. <Link to="/clients" className="text-red-600">Go back</Link></div>;

  const handleClientUpdate = (updatedClient) => {
    setClient(updatedClient);
  };

  return (
    <div>
      <Link to="/clients" className="text-red-600 hover:underline my-6 mx-8 block">&larr; Back to all clients</Link>

      {/* New Client Banner */}
      {isRecentlyAdded(client) && (
        <div className="mx-8 mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Recently Added Client
              </h3>
              <p className="text-sm text-red-700">
                This client was added recently and may need additional setup or verification.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-8 pb-8">
        <div className="lg:col-span-1 space-y-8">
          <ClientInfoCard client={client} onClientUpdate={handleClientUpdate} />
          {/* --- THE FIX IS HERE --- */}
          <BillingHistoryCard client={client} />
          <OrderManager client={client} />
        </div>
        <div className="lg:col-span-2">
          <PauseManager client={client} />
        </div>
      </div>
    </div>
  );
}