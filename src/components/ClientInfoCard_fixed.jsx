// src/components/ClientInfoCard.jsx
import { useState } from 'react';
import AddClientModal from './AddClientModal';

export default function ClientInfoCard({ client, onClientUpdate }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!client) return null;

    const handleEditComplete = (updatedClient) => {
        setIsEditModalOpen(false);
        // Call the callback if provided to update parent component
        if (onClientUpdate) {
            onClientUpdate(updatedClient);
        }
    };

    return (
        <>
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                        <p className="text-gray-600 mt-2">{client.phone}</p>
                        <p className="text-gray-600">{client.address}</p>
                        <p className="text-sm text-gray-500 mt-1">Prefers delivery: {client.deliveryTimePreference}</p>
                    </div>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
                    >
                        Edit Details
                    </button>
                </div>

                <div className="mt-6 border-t pt-6 space-y-2">
                    <h2 className="text-xl font-semibold">Subscription Details</h2>
                    <p><strong>Type:</strong> <span className="capitalize">{client.customerType}</span></p>
                    {client.customerType === 'ondemand' ? (
                        <>
                            <p><strong>Order Date:</strong> {client.plan && client.plan.date ? client.plan.date : 'N/A'}</p>
                            <p><strong>Meal Type:</strong> {client.plan && client.plan.mealType ? (client.plan.mealType.charAt(0).toUpperCase() + client.plan.mealType.slice(1)) : 'N/A'}</p>
                            {client.plan && client.plan.price && (
                                <p><strong>Price:</strong> ₹{client.plan.price}</p>
                            )}
                        </>
                    ) : (
                        <>
                            <p><strong>Start Date:</strong> {client.plan?.startDate || 'N/A'}</p>
                            <p><strong>End Date:</strong> {client.plan?.endDate || 'Ongoing'}</p>
                        </>
                    )}
                    {/* Display Price for On-Demand or Subscription */}
                    <div className="space-y-1 pt-2">
                        {client.customerType === 'ondemand' ? (
                            client.plan?.mealType && client.plan?.price ? (
                                <p><strong>{client.plan.mealType.charAt(0).toUpperCase() + client.plan.mealType.slice(1)} Price:</strong> ₹{client.plan.price}</p>
                            ) : null
                        ) : (
                            <>
                                {client.plan?.lunch?.subscribed && (
                                    <p><strong>Lunch Price:</strong> ₹{client.plan.lunch.price}</p>
                                )}
                                {client.plan?.dinner?.subscribed && (
                                    <p><strong>Dinner Price:</strong> ₹{client.plan.dinner.price}</p>
                                )}
                            </>
                        )}
                    </div>
                    <p className="text-xs text-gray-600 pt-2"><strong>Notes:</strong> {client.preferences?.notes || 'N/A'}</p>
                </div>
            </div>

            {/* Edit Client Modal */}
            {isEditModalOpen && (
                <AddClientModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleEditComplete}
                    clientToEdit={client}
                    mode={client.customerType}
                />
            )}
        </>
    );
}