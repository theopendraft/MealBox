

// src/pages/BillingPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import BillsTable from '../components/BillsTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatsCard } from '../components/ui/StatsCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

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
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          💰 Finance Dashboard
        </h1>
        <p className="text-xl text-gray-600">
          Track revenue, manage outstanding payments, and monitor billing performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          color="green"
          subtitle="Paid bills"
          loading={loading}
        />
        <StatsCard
          title="Outstanding Due"
          value={`₹${stats.totalDue.toLocaleString('en-IN')}`}
          color="red"
          subtitle="Unpaid bills"
          loading={loading}
        />
        <StatsCard
          title="Total Bills"
          value={allBills.length.toLocaleString()}
          color="blue"
          subtitle="All generated"
          loading={loading}
        />
        <StatsCard
          title="Payment Rate"
          value={`${allBills.length > 0 ? Math.round((allBills.filter(b => b.status === 'paid').length / allBills.length) * 100) : 0}%`}
          color="purple"
          subtitle="Bills paid"
          loading={loading}
        />
      </div>

      {/* Filters & Search Section */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader>
          <CardTitle className="text-indigo-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Search & Filter Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="search-client" className="block text-sm font-semibold text-gray-700 mb-2">
                Search by Client Name
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  id="search-client"
                  placeholder="Enter client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="filter-status" className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="paid">✅ Paid</option>
                <option value="unpaid">⏳ Unpaid</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full">
                <div className="text-sm font-semibold text-gray-700 mb-2">Quick Actions</div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
                  }}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  🔄 Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || filterStatus) && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-700">
                <span className="font-semibold">Active Filters:</span>
                {searchTerm && <span className="ml-2 px-2 py-1 bg-indigo-200 rounded">Client: "{searchTerm}"</span>}
                {filterStatus && <span className="ml-2 px-2 py-1 bg-indigo-200 rounded">Status: {filterStatus}</span>}
                <span className="ml-2 text-indigo-600">• Showing {filteredBills.length} of {allBills.length} bills</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bills Table Section */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="text-green-700 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2H8a2 2 0 002-2h2a2 2 0 002 2v6a2 2 0 002 2h2a2 2 0 002-2V9a2 2 0 00-2-2h-1V5a2 2 0 00-2-2h-1a2 2 0 00-2 2v2H8V5z" clipRule="evenodd" />
              </svg>
              All Bills & Invoices
            </div>
            <span className="text-sm font-normal bg-green-100 text-green-800 px-3 py-1 rounded-full">
              {filteredBills.length} bills
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600 text-lg">Loading bills data...</p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bills Found</h3>
              <p className="text-gray-600 mb-4">
                {(searchTerm || filterStatus)
                  ? "No bills match your current filters. Try adjusting your search criteria."
                  : "No bills have been generated yet. Start by creating your first bill."}
              </p>
              {(searchTerm || filterStatus) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <BillsTable
              bills={filteredBills}
              clients={allClients}
              onStatusChange={handleBillUpdate}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}