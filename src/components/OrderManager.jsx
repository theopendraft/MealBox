// src/components/OrderManager.jsx
import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

export default function OrderManager({ client }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for the new order form
  const [orderDate, setOrderDate] = useState(getTodayDateString());
  const [mealType, setMealType] = useState('lunch');
  const [price, setPrice] = useState(client.plan?.lunch?.price || '');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-update price when mealType changes
  useEffect(() => {
    if (mealType === 'lunch') {
      setPrice(client.plan?.lunch?.price || '');
    } else {
      setPrice(client.plan?.dinner?.price || '');
    }
  }, [mealType, client.plan]);

  // Real-time listener for single orders
  useEffect(() => {
    if (!client) return;
    const ordersQuery = query(
      collection(db, 'clients', client.id, 'orders'),
      orderBy('orderDate', 'desc')
    );
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [client]);

  const handleAddOrder = async (e) => {
    e.preventDefault();
    if (!price || price <= 0) {
      alert("Please enter a valid price for the tiffin.");
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'clients', client.id, 'orders'), {
        orderDate,
        mealType,
        price: Number(price),
        status: 'scheduled', // or 'delivered'
        createdAt: new Date(),
      });
      // Reset form
      setOrderDate(getTodayDateString());
    } catch (error) {
      console.error("Error adding order:", error);
      alert("Failed to add order.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrder = async (orderId, orderDate, mealType) => {
    if (window.confirm(`Are you sure you want to cancel the ${mealType} order for ${orderDate}?`)) {
      try {
        await deleteDoc(doc(db, 'clients', client.id, 'orders', orderId));
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to cancel order.");
      }
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Single Tiffin Orders</h2>
      <form onSubmit={handleAddOrder} className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600">Use this to add a guest meal or an order for an on-demand client.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="mt-1 w-full input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium">Meal</label>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="mt-1 w-full input-style">
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Price (₹)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" className="mt-1 w-full input-style" />
          </div>
        </div>
        <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
          {isSaving ? 'Adding...' : '+ Add Tiffin Order'}
        </button>
      </form>

      <h3 className="text-lg font-medium mt-6 mb-2">Order History</h3>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {loading && <p>Loading history...</p>}
        {!loading && orders.length === 0 && <p className="text-gray-500">No single orders found.</p>}
        {orders.map(order => (
          <div key={order.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
            <div>
              <p className="font-medium">{order.orderDate}</p>
              <p className="text-sm text-gray-600 capitalize">{order.mealType}</p>
            </div>
            <div className="flex items-center space-x-2">
              <p className="font-semibold">₹{order.price}</p>
              <button
                onClick={() => handleDeleteOrder(order.id, order.orderDate, order.mealType)}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                title="Cancel Order"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}