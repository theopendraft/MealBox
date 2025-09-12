// src/pages/BillingPage.jsx
import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import BillsTable from '../components/BillsTable';

// Helper function to get the current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Helper function to get the number of days in a given month and year
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

// Helper function to calculate how many of a client's pause days fall within the selected month
const getPausedDaysInMonth = (pauses, year, month) => {
  let pausedDaysCount = 0;
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));

  pauses.forEach(pause => {
    // Ensure pause dates are treated as UTC to avoid timezone issues
    const pauseStart = new Date(pause.startDate + 'T00:00:00Z');
    const pauseEnd = new Date(pause.endDate + 'T00:00:00Z');

    const effectiveStart = new Date(Math.max(monthStart, pauseStart));
    const effectiveEnd = new Date(Math.min(monthEnd, pauseEnd));
    
    if (effectiveEnd >= effectiveStart) {
      const diffTime = Math.abs(effectiveEnd - effectiveStart);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      pausedDaysCount += diffDays;
    }
  });
  return pausedDaysCount;
};

export default function BillingPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { currentUser } = useAuth();

  const fetchBills = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const billsQuery = query(
        collection(db, 'bills'),
        where('ownerId', '==', currentUser.uid),
        where('billingMonth', '==', selectedMonth)
      );
      const querySnapshot = await getDocs(billsQuery);
      const billsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBills(billsData);
    } catch (error) { 
      console.error("Error fetching bills:", error);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchBills();
  }, [selectedMonth, currentUser]);

  const handleGenerateBills = async () => {
    if (bills.length > 0) {
      if (!window.confirm("Bills already exist for this month. Generating new bills will create duplicates. Are you sure you want to continue?")) {
        return;
      }
    }

    setIsGenerating(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDaysInMonth = getDaysInMonth(year, month);

    try {
      const clientsQuery = query(collection(db, 'clients'), where('ownerId', '==', currentUser.uid), where('status', '==', 'active'));
      const clientsSnapshot = await getDocs(clientsQuery);
      
      const batch = writeBatch(db);

      for (const clientDoc of clientsSnapshot.docs) {
        const client = { id: clientDoc.id, ...clientDoc.data() };

        const pausesQuery = query(collection(db, 'clients', client.id, 'pauses'));
        const pausesSnapshot = await getDocs(pausesQuery);
        const pauses = pausesSnapshot.docs.map(doc => doc.data());

        const pausedDays = getPausedDaysInMonth(pauses, year, month);
        const deliveredDays = totalDaysInMonth - pausedDays;
        
        if (deliveredDays < 0) continue; // Skip if pause period is longer than month

        const finalAmount = Math.round((client.plan.price / totalDaysInMonth) * deliveredDays);

        const newBillRef = doc(collection(db, 'bills'));
        batch.set(newBillRef, {
          clientId: client.id,
          clientName: client.name,
          ownerId: currentUser.uid,
          billingMonth: selectedMonth,
          totalDaysInMonth,
          pausedDays,
          deliveredDays,
          planPrice: client.plan.price,
          finalAmount,
          status: 'unpaid',
          generatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      alert(`Successfully generated bills for ${clientsSnapshot.docs.length} clients!`);
      fetchBills(); // Refresh the list
    } catch (error) {
      console.error("Error generating bills:", error);
      alert("An error occurred while generating bills.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6">Billing & Payments</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label htmlFor="billing-month" className="block text-sm font-medium text-gray-700">Select Billing Month</label>
            <input
              type="month"
              id="billing-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <button
            onClick={handleGenerateBills}
            disabled={isGenerating}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 w-full sm:w-auto mt-4 sm:mt-0 self-end disabled:bg-green-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Bills for this Month'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10">Loading bills for {selectedMonth}...</p>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Generated Bills for {selectedMonth}</h2>
          {bills.length > 0 ? (
            <BillsTable bills={bills} onStatusChange={fetchBills} />
          ) : (
            <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
              <p>No bills generated for this month yet.</p>
              <p className="text-sm mt-2">Click the "Generate Bills" button to begin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}