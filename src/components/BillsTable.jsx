// src/components/BillsTable.jsx
import { db } from '../config/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import GeneratePDFButton from './GeneratePDFButton';

export default function BillsTable({ bills, clients, onStatusChange }) {


  const handleToggleStatus = async (billId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    if (!window.confirm(`Are you sure you want to mark this bill as ${newStatus}?`)) return;
    try {
      const billDocRef = doc(db, 'bills', billId);
      await updateDoc(billDocRef, { status: newStatus });
      onStatusChange();
    } catch (error) {
      console.error("Error updating bill status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm("Are you sure you want to delete this bill? This action cannot be undone.")) return;
    try {
      const billDocRef = doc(db, 'bills', billId);
      await deleteDoc(billDocRef);
      onStatusChange();
    } catch (error) {
      console.error("Error deleting bill:", error);
      alert("Failed to delete bill. Please try again.");
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
          {bills.map((bill) => {
            const client = clients.find(c => c.id === bill.clientId);
            if (!client) return null;

            return (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{bill.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-lg text-gray-900">₹{bill.finalAmount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {bill.deliveredDays} of {bill.totalDaysInMonth} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {bill.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleToggleStatus(bill.id, bill.status)}
                    className={
                      bill.status === 'paid'
                        ? 'text-yellow-600 hover:text-yellow-900 mr-2'
                        : 'text-green-600 hover:text-green-900 mr-2'
                    }
                    title={bill.status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                  >
                    {bill.status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                  </button>
                  <button
                    onClick={() => handleDeleteBill(bill.id)}
                    className="text-red-600 hover:text-red-900 mr-2"
                    title="Delete Bill"
                  >
                    Delete
                  </button>
                  <GeneratePDFButton bill={bill} client={client} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
}