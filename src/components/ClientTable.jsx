// src/components/ClientTable.jsx
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default function ClientTable({ clients, onDeleteSuccess, onEditClick }) {

  // Handles the deletion of a client document
  const handleDelete = async (clientId, clientName) => {
    // Ask for confirmation before proceeding with a destructive action
    if (window.confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      try {
        // Create a reference to the specific client document in Firestore
        const clientDocRef = doc(db, 'clients', clientId);

        // Delete the document from Firestore
        await deleteDoc(clientDocRef);

        // Call the success callback function passed from the parent to refresh the list
        onDeleteSuccess();
      } catch (error) {
        console.error("Error deleting client: ", error);
        alert("Failed to delete client. Please try again.");
      }
    }
  };

  // If there are no clients, display a user-friendly message
  if (clients.length === 0) {
    return <p className="text-center text-gray-500 py-10">No clients found. Add a new client to get started!</p>;
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link to={`/clients/${client.id}`} className="hover:underline">
                  <div className="text-sm font-medium text-indigo-600">{client.name}</div>
                </Link>
                <div className="text-sm text-gray-500">{client.address}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {client.plan && (client.plan.lunch || client.plan.dinner) ? (
                  <>
                    <div className="text-sm text-gray-900">
                      {client.plan.lunch?.subscribed ? `Lunch: ₹${client.plan.lunch.price}` : ''}
                      {client.plan.lunch?.subscribed && client.plan.dinner?.subscribed ? ' | ' : ''}
                      {client.plan.dinner?.subscribed ? `Dinner: ₹${client.plan.dinner.price}` : ''}
                    </div>
                    {(client.plan.startDate || client.plan.endDate) && (
                      <div className="text-xs text-gray-500">
                        {client.plan.startDate ? `From: ${client.plan.startDate}` : ''}
                        {client.plan.startDate && client.plan.endDate ? ' - ' : ''}
                        {client.plan.endDate ? `To: ${client.plan.endDate}` : ''}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">On-demand</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {client.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEditClick(client)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(client.id, client.name)}
                  className="text-red-600 hover:text-red-900 ml-4"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}