

// src/pages/BillingPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import BillsTable from '../components/BillsTable';

export default function BillingPage() {
  const [allBills, setAllBills] = useState([]);
  const [allClients, setAllClients] = useState([]); // 1. Add state for clients
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // State for filters
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 2. This effect now fetches BOTH bills and clients
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all bills
        const billsQuery = query(collection(db, 'bills'), where('ownerId', '==', currentUser.uid), orderBy('generatedAt', 'desc'));
        const billsPromise = getDocs(billsQuery);

        // Fetch all clients
        const clientsQuery = query(collection(db, 'clients'), where('ownerId', '==', currentUser.uid));
        const clientsPromise = getDocs(clientsQuery);
        
        // Wait for both fetches to complete
        const [billsSnapshot, clientsSnapshot] = await Promise.all([billsPromise, clientsPromise]);

        const billsData = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setAllBills(billsData);
        setAllClients(clientsData);

      } catch (error) { 
        console.error("Error fetching data:", error);
      } finally { 
        setLoading(false); 
      }
    };

    fetchData();
  }, [currentUser]);

  // Use useMemo to efficiently filter the displayed bills
  const filteredBills = useMemo(() => {
    return allBills
      .filter(bill => {
        // Filter by status
        return filterStatus ? bill.status === filterStatus : true;
      })
      .filter(bill => {
        // Filter by search term (client name)
        return searchTerm ? bill.clientName.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      });
  }, [allBills, filterStatus, searchTerm]);

  // Calculate high-level stats
  const stats = useMemo(() => {
    const totalRevenue = allBills
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.finalAmount, 0);
    const totalDue = allBills
      .filter(b => b.status === 'unpaid')
      .reduce((sum, b) => sum + b.finalAmount, 0);
    return { totalRevenue, totalDue };
  }, [allBills]);
  
  // This function will be passed to the BillsTable to refresh the data after a status change
  const handleBillUpdate = async () => {
    const billsQuery = query(collection(db, 'bills'), where('ownerId', '==', currentUser.uid), orderBy('generatedAt', 'desc'));
    const querySnapshot = await getDocs(billsQuery);
    const billsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAllBills(billsData);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Finance Dashboard</h1>
        <p className="text-gray-600">View and manage all generated bills.</p>
      </div>

      {/* --- Stat Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500 text-sm font-medium">Total Revenue (Paid)</h2>
          <p className="text-3xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500 text-sm font-medium">Total Outstanding (Unpaid)</h2>
          <p className="text-3xl font-bold text-red-600">₹{stats.totalDue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* --- Filters & Search Section --- */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search-client" className="text-sm font-medium">Search by Client Name</label>
            <input 
              type="text" 
              id="search-client"
              placeholder="Enter client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full input-style"
            />
          </div>
          <div>
            <label htmlFor="filter-status" className="text-sm font-medium">Filter by Status</label>
            <select 
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 block w-full input-style"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- Master Bills Table --- */}
      {loading ? (
        <p className="text-center py-10">Loading all bills...</p>
      ) : (
        <BillsTable bills={filteredBills} clients={allClients} onStatusChange={handleBillUpdate} />
      )}
    </div>
  );
}