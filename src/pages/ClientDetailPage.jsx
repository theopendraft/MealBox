// src/pages/ClientDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentMonth, getFullMonthLabel } from '../utils/cycles';
import ClientInfoCard from '../components/ClientInfoCard';

export default function ClientDetailPage() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const { clientId } = useParams();

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    getDoc(doc(db, 'clients', clientId))
      .then(snap => setClient(snap.exists() ? { id: snap.id, ...snap.data() } : null))
      .catch(err => console.error('Error fetching client:', err))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="p-8 text-center text-gray-500">
      Client not found. <Link to="/clients" className="text-red-600 font-medium">← Go back</Link>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* Header nav */}
      <div className="flex items-center justify-between pt-2">
        <Link to="/clients"
          className="flex items-center gap-1 text-sm font-semibold text-red-600 active:opacity-70 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Clients
        </Link>
        <Link
          to={`/clients/${client.id}/ledger`}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors active:scale-[0.97]"
        >
          📋 {getFullMonthLabel(getCurrentMonth())} Ledger
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Client info card (includes pause accordion) */}
      <ClientInfoCard client={client} onClientUpdate={setClient} />

    </div>
  );
}
