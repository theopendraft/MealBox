// src/components/ClientTable.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from './ui/Toast';
import { useSettings } from '../hooks/useSettings';
import { deleteClientAndData } from '../utils/deleteClient';

const STATUS_DOT = {
  active:   'bg-green-500',
  paused:   'bg-amber-400',
  inactive: 'bg-gray-400',
};

export default function ClientTable({ clients, onDeleteSuccess, onEditClick }) {
  const { showSuccess, showError } = useToast();
  const { settings } = useSettings();
  const planMap = Object.fromEntries((settings.plans || []).map(p => [p.id, p]));
  const [confirmingId, setConfirmingId] = useState(null);

  const requestDelete = (id) => {
    setConfirmingId(id);
    setTimeout(() => setConfirmingId(null), 4000);
  };

  const handleDelete = async (id, name) => {
    setConfirmingId(null);
    try {
      // Cascade-delete client + all subcollections (dailyRecords, cycles, pauses, orders)
      // so Kitchen/Delivery pages no longer show this client's data
      await deleteClientAndData(id);
      showSuccess(`${name} and all their records deleted.`);
      onDeleteSuccess();
    } catch {
      showError('Failed to delete client.');
    }
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-3">👥</div>
        <p className="text-sm font-medium">No clients yet</p>
        <p className="text-xs mt-1">Tap the + button to add one</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map(client => {
        const plan = planMap[client.planType];
        const status = client.status || 'active';

        return (
          <div key={client.id}
            className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
            <Link
              to={`/clients/${client.id}`}
              className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
            >
              {/* Status dot */}
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[status] || STATUS_DOT.active}`} />

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{client.name}</span>
                  {plan && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${plan?.badgeColor ?? 'bg-gray-500 text-white'}`}>
                      {plan.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">{client.phone}</span>
                  {client.routeArea && (
                    <span className="text-xs text-gray-400">📍 {client.routeArea}</span>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Actions */}
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => onEditClick(client)}
                className="flex-1 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
              >
                Edit
              </button>
              <div className="w-px bg-gray-100" />
              {confirmingId === client.id ? (
                <div className="flex-1 flex">
                  <button
                    onClick={() => handleDelete(client.id, client.name)}
                    className="flex-1 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="flex-1 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => requestDelete(client.id)}
                  className="flex-1 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
