// src/components/AddClientModal.jsx
import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const initialFormData = {
  name: '',
  phone: '',
  address: '',
  planName: 'Monthly Lunch',
  planPrice: '',
  rotiCount: 4,
};

export default function AddClientModal({ isOpen, onClose, onSuccess, clientToEdit }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (clientToEdit) {
      // Pre-fill the form for "Edit" mode, safely accessing nested properties
      setFormData({
        name: clientToEdit.name || '',
        phone: clientToEdit.phone || '',
        address: clientToEdit.address || '',
        planName: clientToEdit.plan?.name || 'Monthly Lunch',
        planPrice: clientToEdit.plan?.price || '',
        rotiCount: clientToEdit.preferences?.rotiCount || 4,
      });
    } else {
      // Reset the form for "Add" mode
      setFormData(initialFormData);
    }
  }, [clientToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Error: You must be logged in.");
      return;
    }
    setIsSaving(true);
    try {
      const dataPayload = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        plan: { name: formData.planName, price: Number(formData.planPrice) },
        preferences: { rotiCount: Number(formData.rotiCount) },
      };

      if (clientToEdit) {
        // UPDATE logic
        const clientDocRef = doc(db, 'clients', clientToEdit.id);
        await updateDoc(clientDocRef, dataPayload);
      } else {
        // ADD logic
        const fullPayload = {
          ...dataPayload,
          status: 'active',
          ownerId: currentUser.uid,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'clients'), fullPayload);
      }
      onSuccess(); // Triggers refresh and close in the parent component
    } catch (error) {
      console.error("Error saving client: ", error);
      alert("Failed to save client.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl z-50 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">
          {clientToEdit ? 'Edit Client' : 'Add New Client'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input type="tel" name="phone" id="phone" required value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <textarea name="address" id="address" required value={formData.address} onChange={handleChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="planPrice" className="block text-sm font-medium text-gray-700">Plan Price (₹)</label>
              <input type="number" name="planPrice" id="planPrice" required value={formData.planPrice} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="rotiCount" className="block text-sm font-medium text-gray-700">Roti Count</label>
              <input type="number" name="rotiCount" id="rotiCount" required value={formData.rotiCount} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">
              {isSaving ? 'Saving...' : (clientToEdit ? 'Save Changes' : 'Save Client')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}