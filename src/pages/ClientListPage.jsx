// src/pages/ClientListPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import AddClientModal from '../components/AddClientModal';
import ClientTable from '../components/ClientTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatsCard } from '../components/ui/StatsCard';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, TableLoader } from '../components/ui/LoadingSpinner';
import {
  UsersIcon,
  PlusIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';


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

  // Check if a client was added recently (within last 48 hours)
  const isRecentlyAdded = (client) => {
    if (!client.createdAt) return false;

    const now = new Date();
    const createdAt = client.createdAt.toDate ? client.createdAt.toDate() : new Date(client.createdAt);
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

    return hoursDiff <= 48;
  };

  // Memoized calculation for the filtered client list
  const filteredClients = useMemo(() => {
    return allClients.filter(client => client.customerType === activeTab);
  }, [allClients, activeTab]);

  // Memoized calculation for the stats
  const stats = useMemo(() => {
    const subscribedClients = allClients.filter(c => c.customerType === 'subscribed');
    const ondemandClients = allClients.filter(c => c.customerType === 'ondemand');

    return {
      total: allClients.length,
      active: allClients.filter(c => c.status === 'active').length,
      inactive: allClients.filter(c => c.status !== 'active').length,
      newSubscribed: subscribedClients.filter(isRecentlyAdded).length,
      newOndemand: ondemandClients.filter(isRecentlyAdded).length,
    };
  }, [allClients]);


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
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Manage Clients 👥
          </h1>
          <p className="text-gray-600 mt-1">View and manage your subscription and on-demand clients</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => handleOpenModal('subscribed')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Subscriber
          </Button>
          <Button
            onClick={() => handleOpenModal('ondemand')}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add On-Demand Client
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Clients"
          value={stats.total}
          change="All registered clients"
          changeType="neutral"
          icon={UsersIcon}
          color="blue"
        />

        <StatsCard
          title="Active Clients"
          value={stats.active}
          change="Currently active"
          changeType="positive"
          icon={UserCircleIcon}
          color="green"
        />

        <StatsCard
          title="Inactive/Paused"
          value={stats.inactive}
          change="Need attention"
          changeType="negative"
          icon={ClockIcon}
          color="red"
        />
      </div>

      {/* Tabs Section */}
      <Card>
        <CardContent className="p-0">
          <nav className="flex border-b border-gray-200" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('subscribed')}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200 ${activeTab === 'subscribed'
                ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>Subscribed Clients</span>
                {stats.newSubscribed > 0 && (
                  <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${activeTab === 'subscribed'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-800'
                    } animate-pulse`}>
                    {stats.newSubscribed}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('ondemand')}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200 ${activeTab === 'ondemand'
                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>On-demand Clients</span>
                {stats.newOndemand > 0 && (
                  <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${activeTab === 'ondemand'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-800'
                    } animate-pulse`}>
                    {stats.newOndemand}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </CardContent>
      </Card>

      {/* Client Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableLoader rows={6} />
          ) : (
            <ClientTable
              clients={filteredClients}
              onDeleteSuccess={fetchClients}
              onEditClick={handleEditClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <AddClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        clientToEdit={editingClient}
        mode={modalMode}
      />
    </div>
  );
}