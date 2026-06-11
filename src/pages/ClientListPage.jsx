// src/pages/ClientListPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import AddClientModal from '../components/AddClientModal';
import ClientTable from '../components/ClientTable';

export default function ClientListPage() {
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscribed');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Real-time listener — auto-updates when clients are added/edited/deleted
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const q = query(
      collection(db, 'clients'),
      where('ownerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q,
      (snap) => {
        setAllClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Clients listener error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [currentUser]);

  const filteredClients = useMemo(
    () => allClients.filter(c => c.customerType === activeTab),
    [allClients, activeTab]
  );

  const stats = useMemo(() => ({
    total:    allClients.length,
    active:   allClients.filter(c => c.status === 'active').length,
    paused:   allClients.filter(c => c.status === 'paused').length,
    inactive: allClients.filter(c => c.status === 'inactive').length,
  }), [allClients]);

  const handleEditClick = (client) => {
    setEditingClient(client);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    // onSnapshot auto-updates the list; just close the modal
    setEditModalOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your tiffin subscribers</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop-only add button — mobile uses the FAB in BottomNavBar */}
          <button
            onClick={() => { setEditingClient(null); setEditModalOpen(true); }}
            className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors active:scale-[0.97]"
          >
            + Add Client
          </button>
          <button
            onClick={() => navigate('/broadcast')}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors active:scale-[0.97]"
          >
            💬 Broadcast
          </button>
        </div>
      </div>

      {/* Stats pill row */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.04] px-5 py-3">
        <div className="flex items-center justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 font-medium">Total</div>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-500 font-medium">Active</div>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div>
            <div className="text-2xl font-bold text-amber-500">{stats.paused}</div>
            <div className="text-xs text-gray-500 font-medium">Paused</div>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div>
            <div className="text-2xl font-bold text-gray-400">{stats.inactive}</div>
            <div className="text-xs text-gray-500 font-medium">Inactive</div>
          </div>
        </div>
      </div>

      {/* iOS segmented control */}
      <div className="bg-gray-100 rounded-xl p-1 flex">
        {[
          { key: 'subscribed', label: 'Subscriptions' },
          { key: 'ondemand',   label: 'One-time' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-red-500' : 'text-gray-400'}`}>
              ({allClients.filter(c => c.customerType === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Client list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ClientTable
          clients={filteredClients}
          onDeleteSuccess={() => {}} // onSnapshot auto-refreshes
          onEditClick={handleEditClick}
        />
      )}

      {/* Edit modal */}
      {editModalOpen && (
        <AddClientModal
          isOpen={editModalOpen}
          onClose={() => { setEditModalOpen(false); setEditingClient(null); }}
          onSuccess={handleEditSuccess}
          clientToEdit={editingClient}
        />
      )}
    </div>
  );
}
