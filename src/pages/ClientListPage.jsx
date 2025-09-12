// src/pages/ClientListPage.jsx
import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import AddClientModal from '../components/AddClientModal';
import ClientTable from '../components/ClientTable';

export default function ClientListPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
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
        orderBy('createdAt', 'desc') // Show newest clients first
      );
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching clients: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [currentUser]);

  // Handler to open the modal for editing
  const handleEditClick = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  // Handler to close the modal and reset state
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  // Handler for when a client is successfully added or updated
  const handleSuccess = () => {
    fetchClients();     // First, refresh the data
    handleCloseModal(); // Then, close the modal
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Manage Clients</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-full sm:w-auto"
        >
          + Add New Client
        </button>
      </div>

      {loading ? (
        <p className="text-center py-10">Loading clients...</p>
      ) : (
        <ClientTable
          clients={clients}
          onDeleteSuccess={fetchClients}
          onEditClick={handleEditClick}
        />
      )}

      <AddClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        clientToEdit={editingClient}
      />
    </div>
  );
}