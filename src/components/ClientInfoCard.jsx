// src/components/ClientInfoCard.jsx
import { useState, useEffect } from 'react';
import { collection, doc, updateDoc, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useToast } from './ui/Toast';
import { useSettings } from '../hooks/useSettings';
import AddClientModal from './AddClientModal';

const STATUSES = [
  { key: 'active',   label: 'Active',      dot: 'bg-green-500' },
  { key: 'paused',   label: 'Paused',      dot: 'bg-amber-400' },
  { key: 'inactive', label: 'Inactive',    dot: 'bg-gray-400'  },
];

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const formatPauseRange = (p) => {
  if (p.startDate === p.endDate) return p.startDate;
  return `${p.startDate} – ${p.endDate}`;
};

export default function ClientInfoCard({ client, onClientUpdate }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showPauseForm, setShowPauseForm] = useState(false);
  const [pauses, setPauses] = useState([]);
  const [pauseStart, setPauseStart] = useState('');
  const [pauseEnd, setPauseEnd] = useState('');
  const [pauseMeal, setPauseMeal] = useState('both');
  const [isSavingPause, setIsSavingPause] = useState(false);
  const { showSuccess, showError } = useToast();
  const { settings } = useSettings();
  const planMap = Object.fromEntries((settings.plans || []).map(p => [p.id, p]));

  useEffect(() => {
    if (!client?.id) return;
    getDocs(collection(db, 'clients', client.id, 'pauses'))
      .then(snap => setPauses(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
  }, [client?.id]);

  if (!client) return null;

  const plan = planMap[client.planType];
  const currentStatusIndex = STATUSES.findIndex(s => s.key === (client.status || 'active'));

  const handleStatusChange = async (key) => {
    if (key === client.status || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateDoc(doc(db, 'clients', client.id), { status: key });
      showSuccess(`${client.name} marked as ${key}.`);
      if (onClientUpdate) onClientUpdate({ ...client, status: key });
    } catch {
      showError('Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddPause = async () => {
    if (!pauseStart || !pauseEnd || new Date(pauseStart) > new Date(pauseEnd)) {
      showError('Please select a valid date range.');
      return;
    }
    setIsSavingPause(true);
    try {
      const docRef = await addDoc(collection(db, 'clients', client.id, 'pauses'), {
        startDate: pauseStart, endDate: pauseEnd, mealType: pauseMeal, createdAt: serverTimestamp(),
      });
      setPauses(prev => [...prev, { id: docRef.id, startDate: pauseStart, endDate: pauseEnd, mealType: pauseMeal }]);
      setPauseStart(''); setPauseEnd(''); setPauseMeal('both');
      setShowPauseForm(false);
      showSuccess('Pause added.');
    } catch {
      showError('Failed to add pause.');
    } finally {
      setIsSavingPause(false);
    }
  };

  const handleDeletePause = async (pauseId) => {
    try {
      await deleteDoc(doc(db, 'clients', client.id, 'pauses', pauseId));
      setPauses(prev => prev.filter(p => p.id !== pauseId));
      showSuccess('Pause removed.');
    } catch {
      showError('Failed to remove pause.');
    }
  };

  const inputCls = 'flex-1 px-3 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none';

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.04] overflow-hidden">

        {/* Header: name + edit */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white text-xl font-bold truncate">{client.name}</h2>
                {plan && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${plan?.badgeColor ?? 'bg-gray-500 text-white'}`}>
                    {plan.label} · ₹{plan.price}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-col gap-0.5">
                <span className="text-red-100 text-sm">📞 {client.phone}</span>
                <span className="text-red-100 text-sm">📍 {client.address}</span>
                {client.routeArea && <span className="text-red-200 text-xs">{client.routeArea} · {client.deliveryTimePreference}</span>}
              </div>
            </div>
            <button
              onClick={() => setIsEditOpen(true)}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0 active:scale-95"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-5 space-y-5">

          {/* Status segmented control */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Status</p>
            <div className="bg-gray-100 rounded-xl p-1 flex gap-0.5">
              {STATUSES.map(s => (
                <button
                  key={s.key}
                  onClick={() => handleStatusChange(s.key)}
                  disabled={isUpdatingStatus}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
                    client.status === s.key || (!client.status && s.key === 'active')
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pause accordion (only for subscribed clients) */}
          {client.customerType !== 'ondemand' && (
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowPauseForm(v => !v)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors active:bg-gray-100"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">⏸</span>
                  Pause Delivery
                  {pauses.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">{pauses.length}</span>
                  )}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showPauseForm ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {showPauseForm && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-200">
                  {/* Active pauses as chips */}
                  {pauses.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3">
                      {pauses.map(p => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-xl"
                        >
                          {formatPauseRange(p)}
                          {p.mealType && p.mealType !== 'both' && (
                            <span className="text-amber-500">· {p.mealType}</span>
                          )}
                          <button
                            onClick={() => handleDeletePause(p.id)}
                            className="ml-0.5 text-amber-400 hover:text-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add new pause form */}
                  <div className="pt-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">From</label>
                        <input type="date" value={pauseStart} onChange={e => setPauseStart(e.target.value)} className={inputCls} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">To</label>
                        <input type="date" value={pauseEnd} onChange={e => setPauseEnd(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {[['both','Both'],['lunch','Lunch'],['dinner','Dinner']].map(([val, lbl]) => (
                        <button key={val} type="button" onClick={() => setPauseMeal(val)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all active:scale-95 ${
                            pauseMeal === val ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 bg-white'
                          }`}
                        >{lbl}</button>
                      ))}
                    </div>
                    <button
                      onClick={handleAddPause}
                      disabled={isSavingPause || !pauseStart || !pauseEnd}
                      className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-red-700 active:scale-[0.97] transition-all"
                    >
                      {isSavingPause ? 'Saving…' : '+ Add Pause'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Plan details */}
          {plan && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Plan</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
                <p className="text-sm text-gray-600">{plan.description}</p>
                {client.customerType !== 'ondemand' && client.deliverySchedule && (
                  <div className="flex gap-1.5">
                    {DAYS.map((d, i) => (
                      <span key={d} className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                        client.deliverySchedule[d] ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {DAY_SHORT[i].slice(0, 2)}
                      </span>
                    ))}
                  </div>
                )}
                {client.customerType === 'ondemand' && client.plan?.date && (
                  <p className="text-sm text-gray-500">Order date: {client.plan.date}</p>
                )}
                {client.customerType !== 'ondemand' && client.startDate && (
                  <div className="flex items-center gap-3 pt-1 border-t border-gray-200 text-xs text-gray-500">
                    <span>📅 Started {client.startDate}</span>
                    {client.endDate
                      ? <span>→ Ends {client.endDate}</span>
                      : <span className="text-green-600 font-medium">· Ongoing</span>
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preferences */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Kitchen Preferences</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">Spice: <strong className="text-gray-900">{client.preferences?.spiceLevel || '—'}</strong></span>
                <span className="text-gray-600">Rice: <strong className="text-gray-900">{client.preferences?.riceVolume || client.preferences?.rice || '—'}</strong></span>
              </div>
              {client.preferences?.notes && (
                <p className="mt-2 text-sm text-gray-500 italic">"{client.preferences.notes}"</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {isEditOpen && (
        <AddClientModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={(updated) => { setIsEditOpen(false); if (onClientUpdate) onClientUpdate(updated); }}
          clientToEdit={client}
        />
      )}
    </>
  );
}
