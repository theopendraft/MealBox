// src/components/BillsTable.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import GeneratePDFButton from './GeneratePDFButton';
import { useToast } from './ui/Toast';

export default function BillsTable({ bills, clients, onStatusChange }) {
  const { showSuccess, showError } = useToast();
  const [confirming, setConfirming] = useState(null); // { billId, action: 'toggle'|'delete', currentStatus }

  const requestConfirm = (billId, action, currentStatus = null) => {
    setConfirming({ billId, action, currentStatus });
    setTimeout(() => setConfirming(null), 4000);
  };

  const handleToggleStatus = async () => {
    if (!confirming) return;
    const { billId, currentStatus } = confirming;
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    setConfirming(null);
    try {
      await updateDoc(doc(db, 'bills', billId), { status: newStatus });
      showSuccess(`Bill marked as ${newStatus}.`);
      onStatusChange();
    } catch (error) {
      console.error("Error updating bill status:", error);
      showError("Failed to update status. Please try again.");
    }
  };

  const handleDeleteBill = async () => {
    if (!confirming) return;
    const { billId } = confirming;
    setConfirming(null);
    try {
      await deleteDoc(doc(db, 'bills', billId));
      showSuccess("Bill deleted.");
      onStatusChange();
    } catch (error) {
      console.error("Error deleting bill:", error);
      showError("Failed to delete bill. Please try again.");
    }
  };

  const handleConfirm = () => {
    if (confirming?.action === 'toggle') handleToggleStatus();
    else if (confirming?.action === 'delete') handleDeleteBill();
  };

  return (
    <div className="overflow-x-auto shadow-md rounded-lg mt-8">
      {confirming && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <p className="text-sm font-medium text-amber-800">
            {confirming.action === 'delete'
              ? 'Delete this bill permanently?'
              : `Mark bill as ${confirming.currentStatus === 'paid' ? 'unpaid' : 'paid'}?`
            }
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bills.map((bill) => {
            const client = clients.find(c => c.id === bill.clientId);
            if (!client) return null;

            return (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  <Link to={`/bills/${bill.id}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                    {bill.clientName}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-lg text-gray-900">
                  <Link to={`/bills/${bill.id}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                    ₹{bill.finalAmount}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Link to={`/bills/${bill.id}`} className="text-gray-500 hover:text-gray-700">
                    {bill.deliveredDays} of {bill.totalDaysInMonth} days
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => requestConfirm(bill.id, 'toggle', bill.status)}
                    className={bill.status === 'paid' ? 'text-yellow-600 hover:text-yellow-900 mr-2' : 'text-green-600 hover:text-green-900 mr-2'}
                  >
                    {bill.status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                  </button>
                  <button
                    onClick={() => requestConfirm(bill.id, 'delete')}
                    className="text-red-600 hover:text-red-900 mr-2"
                  >
                    Delete
                  </button>
                  <GeneratePDFButton bill={bill} client={client} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
