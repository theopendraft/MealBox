// src/pages/DailyDeliveryPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTodayDeliveries, getTodayDateString } from '../utils/delivery';
import { TruckIcon } from '@heroicons/react/24/outline';

export default function DailyDeliveryPage() {
  const [deliveryList, setDeliveryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const list = await getTodayDeliveries(currentUser.uid);
        setDeliveryList(list);
      } catch (error) {
        console.error("Error generating delivery list:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const lunchList = deliveryList.filter(d => d.mealType === 'lunch');
  const dinnerList = deliveryList.filter(d => d.mealType === 'dinner');

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Generating today's delivery list...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Delivery List</h1>
        <p className="text-gray-500 mt-1">{today}</p>
      </div>

      {/* Summary Card */}
      <div className="bg-red-600 text-white rounded-xl p-6 flex items-center justify-between">
        <div>
          <p className="text-red-100 text-sm font-medium">Total Tiffins Today</p>
          <p className="text-5xl font-extrabold mt-1">{deliveryList.length}</p>
        </div>
        <TruckIcon className="h-16 w-16 text-red-400" />
      </div>

      {/* Counts by slot */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-700">{lunchList.length}</p>
          <p className="text-sm font-medium text-yellow-600 mt-1">Lunch</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-700">{dinnerList.length}</p>
          <p className="text-sm font-medium text-orange-600 mt-1">Dinner</p>
        </div>
      </div>

      {deliveryList.length === 0 ? (
        <div className="text-center py-16">
          <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No deliveries scheduled for today.</p>
        </div>
      ) : (
        <>
          {lunchList.length > 0 && (
            <DeliverySection title="Lunch" deliveries={lunchList} accentColor="yellow" />
          )}
          {dinnerList.length > 0 && (
            <DeliverySection title="Dinner" deliveries={dinnerList} accentColor="orange" />
          )}
        </>
      )}
    </div>
  );
}

function DeliverySection({ title, deliveries, accentColor }) {
  const colors = {
    yellow: 'bg-yellow-100 text-yellow-800',
    orange: 'bg-orange-100 text-orange-800',
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-3">
        {title} — {deliveries.length} deliveries
      </h2>
      <div className="space-y-3">
        {deliveries.map((delivery, index) => (
          <div
            key={`${delivery.id}-${delivery.mealType}-${index}`}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div className="bg-gray-100 text-gray-600 font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900">{delivery.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[accentColor]}`}>
                  {title}
                </span>
                {delivery.orderType === 'subscription' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Subscription
                  </span>
                )}
                {delivery.orderType === 'single' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Single Order
                  </span>
                )}
                {delivery.orderType === 'main' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    On-Demand
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{delivery.address}</p>
              {delivery.phone && (
                <p className="text-sm text-gray-400">📞 {delivery.phone}</p>
              )}
              {delivery.preferences?.rotiCount && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {delivery.preferences.rotiCount} Roti
                  {delivery.preferences.spiceLevel ? ` · ${delivery.preferences.spiceLevel} spice` : ''}
                  {delivery.preferences.ricePreference ? ` · ${delivery.preferences.ricePreference} rice` : ''}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-gray-900">₹{delivery.price}</p>
              {delivery.deliveryTimePreference && (
                <p className="text-xs text-gray-400 mt-0.5">{delivery.deliveryTimePreference}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
