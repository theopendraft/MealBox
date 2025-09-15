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
  if (!client) return <div className="p-8 text-center">Client not found. <Link to="/clients" className="text-indigo-600">Go back</Link></div>;

  return (
    <div>
      <Link to="/clients" className="text-indigo-600 hover:underline my-6 mx-8 block">&larr; Back to all clients</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-8 pb-8">
        <div className="lg:col-span-1 space-y-8">
          <ClientInfoCard client={client} />
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