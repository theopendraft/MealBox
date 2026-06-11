// src/pages/GenerateBillPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, getDocs, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateBillForClient } from '../utils/billing';
import GeneratePDFButton from '../components/GeneratePDFButton';
import { useToast } from '../components/ui/Toast';

export default function GenerateBillPage() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billPreview, setBillPreview] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [billSaved, setBillSaved] = useState(false);
  const [savedBillDoc, setSavedBillDoc] = useState(null);

  const { clientId } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      const docSnap = await getDoc(doc(db, 'clients', clientId));
      if (docSnap.exists()) {
        const clientData = { id: docSnap.id, ...docSnap.data() };
        setClient(clientData);

        let allDates = [];
        if (clientData.plan?.startDate && clientData.plan?.endDate) {
          let current = new Date(clientData.plan.startDate);
          const end = new Date(clientData.plan.endDate);
          while (current <= end) {
            allDates.push(current.toISOString().slice(0, 10));
            current.setDate(current.getDate() + 1);
          }
        }

        const ordersSnapshot = await getDocs(query(collection(db, 'clients', clientId, 'orders')));
        const orderDates = ordersSnapshot.docs.map(doc => doc.data().orderDate).filter(Boolean);
        allDates = Array.from(new Set(allDates.concat(orderDates))).sort();

        if (allDates.length > 0) {
          setStartDate(allDates[0]);
          setEndDate(allDates[allDates.length - 1]);
        } else {
          const today = new Date().toISOString().slice(0, 10);
          setStartDate(today);
          setEndDate(today);
        }
      }
      setLoading(false);
    };
    fetchClientData();
  }, [clientId]);

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      showError("Please select a start and end date.");
      return;
    }
    setIsCalculating(true);
    setBillPreview(null);
    try {
      const calculatedData = await calculateBillForClient(client, startDate, endDate);
      setBillPreview(calculatedData);
    } catch (error) {
      console.error("Error calculating bill:", error);
      showError("Could not calculate bill.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveBill = async () => {
    if (!billPreview) {
      showError("Please calculate a bill first.");
      return;
    }
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'bills'), {
        ...billPreview,
        billingMonth: startDate.substring(0, 7),
        generatedAt: serverTimestamp(),
      });
      const savedDoc = await getDoc(docRef);
      if (savedDoc.exists()) {
        setSavedBillDoc({ id: savedDoc.id, ...savedDoc.data() });
      }
      setBillSaved(true);
    } catch (error) {
      console.error("Error saving bill:", error);
      showError("Failed to save the bill.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!client) return <div className="p-8 text-center">Client not found.</div>;

  return (
    <div>
      <Link to={`/clients/${clientId}`} className="text-red-600 hover:underline my-6 mx-8 block">&larr; Back to Client Details</Link>
      <div className="px-8 pb-8">
        <h1 className="text-3xl font-bold">Generate Bill</h1>
        <h2 className="text-xl text-gray-600">for {client.name}</h2>

        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">1. Select Billing Period</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium">Start Date</label>
              <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full input-style" />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium">End Date</label>
              <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full input-style" />
            </div>
          </div>
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="mt-4 w-full sm:w-auto bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-red-400"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Bill'}
          </button>
        </div>

        {billPreview && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">2. Review & Confirm</h3>
            <div className="mt-4 space-y-2 border-t pt-4">
              {client?.customerType === 'subscribed' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscription Lunches:</span>
                    <span className="font-medium">{billPreview.details.lunchesDelivered} x ₹{billPreview.details.lunchPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscription Dinners:</span>
                    <span className="font-medium">{billPreview.details.dinnersDelivered} x ₹{billPreview.details.dinnerPrice}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Meal Type:</span>
                    <span className="font-medium">{billPreview.details.mainOrder?.mealType || client?.plan?.mealType || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{billPreview.details.mainOrder?.orderDate || client?.plan?.date || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">OnDemand Tiffin Price:</span>
                    <span className="font-medium">₹{billPreview.details.mainOrderAmount || 0}</span>
                  </div>
                </>
              )}
              {billPreview.details.extraOrdersCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Extra Single Orders:</span>
                  <span className="font-medium">{billPreview.details.extraOrdersCount} Tiffin(s) (+ ₹{billPreview.details.extraOrdersAmount})</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                <span>Total Amount:</span>
                <span className="text-red-600">₹{billPreview.finalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            {!billSaved ? (
              <button
                onClick={handleSaveBill}
                disabled={isSaving}
                className="mt-6 w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 disabled:bg-red-400"
              >
                {isSaving ? 'Saving...' : 'Confirm & Generate Bill'}
              </button>
            ) : (
              <div className="mt-6 w-full flex justify-center">
                <GeneratePDFButton bill={savedBillDoc || billPreview} client={client} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
