// src/pages/ClientListPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import AddClientModal from '../components/AddClientModal';
import ClientTable from '../components/ClientTable';


export default function ClientListPage() {
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscribed'); // 'subscribed' or 'ondemand'
  const [modalMode, setModalMode] = useState('subscribed'); // NEW: modal mode

  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const fetchClients = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'clients'),
        where('ownerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllClients(clientsData);
    } catch (error) {
      console.error("Error fetching clients: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [currentUser]);

  // Memoized calculation for the filtered client list
  const filteredClients = useMemo(() => {
    return allClients.filter(client => client.customerType === activeTab);
  }, [allClients, activeTab]);

  // Memoized calculation for the stats
  const stats = useMemo(() => ({
    total: allClients.length,
    active: allClients.filter(c => c.status === 'active').length,
    inactive: allClients.filter(c => c.status !== 'active').length,
  }), [allClients]);


  const handleOpenModal = (mode) => {
    setEditingClient(null);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleEditClick = (client) => {
    setEditingClient(client);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSuccess = () => {
    fetchClients();
    handleCloseModal();
  };

  return (
    <>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Manage Clients</h1>
        {/* NEW: Two separate buttons for adding clients */}
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal('subscribed')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
          >
            + Add Subscriber
          </button>
          <button
            onClick={() => handleOpenModal('ondemand')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            + Add On-Demand Client
          </button>
        </div>
      </div>

      {/* --- Stats Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Clients</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-gray-500">Active Clients</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
          <p className="text-sm text-gray-500">Inactive/Paused</p>
        </div>
      </div>

      {/* --- Tabs Section --- */}
      <div className="border-b border-gray-200 bg-white shadow rounded-lg p-2">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('subscribed')}
            className={`whitespace-nowrap py-3 px-4 rounded-md font-medium text-sm ${activeTab === 'subscribed' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Subscribed Clients
          </button>
          <button
            onClick={() => setActiveTab('ondemand')}
            className={`whitespace-nowrap py-3 px-4 rounded-md font-medium text-sm ${activeTab === 'ondemand' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            On-demand Clients
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-center py-10">Loading clients...</p>
        ) : (
          <ClientTable
            clients={filteredClients}
            onDeleteSuccess={fetchClients}
            onEditClick={handleEditClick}
          />
        )}
      </div>

      <AddClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        clientToEdit={editingClient}
        mode={modalMode} // Pass the mode to the modal
      />
    </>
  );
}