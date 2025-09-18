// src/pages/DailyDeliveryPage.jsx
import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function DailyDeliveryPage() {
  const [deliveryList, setDeliveryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    // Adjust for Indian Standard Time (IST) if needed, but for date-only comparison, this is usually fine.
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const generateDeliveryList = async () => {
      if (!currentUser) return;

      const todayStr = getTodayDateString();
      const finalList = [];

      try {
        // 1. Fetch all clients whose status is 'active'
        const clientsQuery = query(collection(db, 'clients'), where('ownerId', '==', currentUser.uid), where('status', '==', 'active'));
        const activeClientsSnapshot = await getDocs(clientsQuery);
        const activeClients = activeClientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. For each active client, check their pauses
        for (const client of activeClients) {
          const pausesCollectionRef = collection(db, 'clients', client.id, 'pauses');
          const pausesSnapshot = await getDocs(pausesCollectionRef);
          
          let isPausedToday = false;
          if (!pausesSnapshot.empty) {
            for (const pauseDoc of pausesSnapshot.docs) {
              const pauseData = pauseDoc.data();
              // 3. The Core Logic: Check if today is within any pause period
              if (todayStr >= pauseData.startDate && todayStr <= pauseData.endDate) {
                isPausedToday = true;
                break; // Found a pause that includes today, no need to check further
              }
            }
          }
          
          // 4. If the client is not paused, add them to the final list
          if (!isPausedToday) {
            finalList.push(client);
          }
        }
        
        setDeliveryList(finalList);

      } catch (error) {
        console.error("Error generating delivery list:", error);
      } finally {
        setLoading(false);
      }
    };

    generateDeliveryList();
  }, [currentUser]);

  if (loading) {
    return <div className="p-8 text-center">Generating Today's Delivery List...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Daily Delivery List</h1>
      <p className="text-gray-600 mb-6">Date: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="bg-red-600 text-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-4xl font-extrabold">{deliveryList.length}</h2>
        <p className="font-medium">Total Tiffins to be Delivered Today</p>
      </div>

      <div className="space-y-4">
        {deliveryList.length > 0 ? (
          deliveryList.map((client, index) => (
            <div key={client.id} className="bg-white p-4 rounded-lg shadow-md flex items-start gap-4">
              <div className="bg-gray-200 text-gray-700 font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">{index + 1}</div>
              <div>
                <h3 className="text-lg font-semibold">{client.name}</h3>
                <p className="text-gray-600">{client.address}</p>
                <p className="text-sm text-gray-500 mt-1"><strong>Phone:</strong> {client.phone}</p>
                <p className="text-sm text-red-600 font-medium mt-1">
                  <strong>Preferences:</strong> {client.preferences.rotiCount} Roti
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-10">No deliveries scheduled for today.</p>
        )}
      </div>
    </div>
  );
}