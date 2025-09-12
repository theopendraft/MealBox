// src/pages/ClientDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function ClientDetailPage() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pauses, setPauses] = useState([]);
  
  // State for the "Add Pause" form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { clientId } = useParams();

  // Function to fetch all pause periods for the current client
  const fetchPauses = async () => {
    try {
      const pausesCollectionRef = collection(db, 'clients', clientId, 'pauses');
      const q = query(pausesCollectionRef, orderBy('startDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const pausesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPauses(pausesData);
    } catch (error) {
      console.error("Error fetching pauses:", error);
    }
  };

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      try {
        const clientDocRef = doc(db, 'clients', clientId);
        const docSnap = await getDoc(clientDocRef);

        if (docSnap.exists()) {
          setClient({ id: docSnap.id, ...docSnap.data() });
          await fetchPauses(); // Fetch pauses after getting client data
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching client details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  // Handler for submitting the new pause form
  const handleAddPause = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert("Please select both a start and an end date.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        alert("Start date cannot be after the end date.");
        return;
    }

    try {
      const pausesCollectionRef = collection(db, 'clients', clientId, 'pauses');
      await addDoc(pausesCollectionRef, {
        startDate,
        endDate,
        createdAt: serverTimestamp(),
      });
      // Reset form and refresh the list
      setStartDate('');
      setEndDate('');
      fetchPauses();
    } catch (error) {
      console.error("Error adding pause period: ", error);
      alert("Failed to add pause period.");
    }
  };

  if (loading) return <div className="p-8">Loading client details...</div>;
  if (!client) return <div className="p-8">Client not found.</div>;

  return (
    <div className="p-8">
      <Link to="/clients" className="text-indigo-600 hover:underline mb-6 block">&larr; Back to all clients</Link>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Client Details Card */}
        <div className="md:col-span-1 bg-white shadow-md rounded-lg p-6 h-fit">
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-600 mt-2">{client.phone}</p>
          <p className="text-gray-600">{client.address}</p>
          <div className="mt-6 border-t pt-6">
            <h2 className="text-xl font-semibold">Plan Details</h2>
            <p><strong>Plan:</strong> {client.plan.name}</p>
            <p><strong>Price:</strong> ₹{client.plan.price}</p>
            <p><strong>Preferences:</strong> {client.preferences.rotiCount} Roti</p>
          </div>
        </div>

        {/* Pause Management Card */}
        <div className="md:col-span-2 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Service Pauses</h2>
          
          {/* Add Pause Form */}
          <form onSubmit={handleAddPause} className="mb-8 p-4 border rounded-lg bg-gray-50 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div className="flex-1 w-full">
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 w-full sm:w-auto">Pause Service</button>
          </form>

          {/* List of Pauses */}
          <h3 className="text-xl font-semibold mb-2">Scheduled Pauses</h3>
          <div className="space-y-2">
            {pauses.length > 0 ? (
              pauses.map(pause => (
                <div key={pause.id} className="bg-gray-100 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <span className="font-medium">{pause.startDate}</span> to <span className="font-medium">{pause.endDate}</span>
                  </div>
                  {/* We can add a delete button here later */}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No pause periods scheduled for this client.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}