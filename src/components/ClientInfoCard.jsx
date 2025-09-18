// src/components/ClientInfoCard.jsx
import { useState } from 'react';
import AddClientModal from './AddClientModal';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';

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
      <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-red-700 text-2xl mb-2">
                {client.name}
              </CardTitle>
              <div className="space-y-1">
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {client.phone}
                </div>
                <div className="flex items-start text-gray-600">
                  <svg className="w-4 h-4 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="flex-1">{client.address}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Delivery: {client.deliveryTimePreference}
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              className="p-2 border-red-200 text-red-600 hover:bg-red-50"
              title="Edit Client Details"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Customer Type Badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${client.customerType === 'subscribed'
              ? 'bg-red-100 text-red-800'
              : 'bg-orange-100 text-orange-800'
              }`}>
              {client.customerType === 'subscribed' ? '📅 Subscription' : '⚡ On-Demand'}
            </span>
          </div>

          {/* Subscription/Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.customerType === 'ondemand' ? (
              <>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-2">Order Details</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-600">Date:</span>
                      <span className="font-medium">{client.plan?.date || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">Meal:</span>
                      <span className="font-medium capitalize">{client.plan?.mealType || 'N/A'}</span>
                    </div>
                    {client.plan?.price && (
                      <div className="flex justify-between border-t border-orange-200 pt-1 mt-2">
                        <span className="text-orange-600">Price:</span>
                        <span className="font-bold text-orange-800">₹{client.plan.price}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2">Subscription Period</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-red-600">Start:</span>
                      <span className="font-medium">{client.plan?.startDate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">End:</span>
                      <span className="font-medium">{client.plan?.endDate || 'Ongoing'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-2">Meal Plan</h3>
                  <div className="space-y-1 text-sm">
                    {client.plan?.lunch?.subscribed && (
                      <div className="flex justify-between">
                        <span className="text-orange-600">🍛 Lunch:</span>
                        <span className="font-bold">₹{client.plan.lunch.price}</span>
                      </div>
                    )}
                    {client.plan?.dinner?.subscribed && (
                      <div className="flex justify-between">
                        <span className="text-orange-600">🍽️ Dinner:</span>
                        <span className="font-bold">₹{client.plan.dinner.price}</span>
                      </div>
                    )}
                    {!client.plan?.lunch?.subscribed && !client.plan?.dinner?.subscribed && (
                      <span className="text-gray-500 text-xs">No meals selected</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Meal Preferences */}
          <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Preferences
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Roti:</span>
                <span className="font-medium">{client.preferences?.rotiCount || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rice:</span>
                <span className="font-medium">{client.preferences?.rice || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Spice:</span>
                <span className="font-medium">{client.preferences?.spiceLevel || 'N/A'}</span>
              </div>
            </div>
            {client.preferences?.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-gray-600 text-sm">Notes: </span>
                <span className="text-gray-800 text-sm italic">{client.preferences.notes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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