// src/components/BillsTable.jsx
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function BillsTable({ bills, onStatusChange }) {

  const handleMarkAsPaid = async (billId) => {
    if (!window.confirm("Are you sure you want to mark this bill as paid?")) return;

    try {
      const billDocRef = doc(db, 'bills', billId);
      await updateDoc(billDocRef, {
        status: 'paid'
      });
      onStatusChange(); // Refresh the list in the parent component
    } catch (error) {
      console.error("Error updating bill status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <div className="overflow-x-auto shadow-md rounded-lg mt-8">
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
          {bills.map((bill) => (
            <tr key={bill.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{bill.clientName}</td>
              <td className="px-6 py-4 whitespace-nowrap font-bold text-lg text-gray-900">₹{bill.finalAmount}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {bill.deliveredDays} of {bill.totalDaysInMonth} days
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {bill.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {bill.status === 'unpaid' && (
                  <button 
                    onClick={() => handleMarkAsPaid(bill.id)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Mark as Paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}