// src/pages/DeliveryRoutePage.jsx
import { useEffect, useState, useCallback, memo } from 'react';
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { getTodayStr, updateRecordStatus, lockMealSlot } from '../utils/dailyRecords';
import { ListSkeleton } from '../components/ui/Skeleton';
import { checkAndWriteMilestone } from '../utils/milestones';
import ModifierPanel from '../components/ModifierPanel';
import { useToast } from '../components/ui/Toast';

const STATUS_ACCENT = {
  pending:   'bg-gray-300',
  delivered: 'bg-green-400',
  skipped:   'bg-amber-400',
  locked:    'bg-blue-400',
};

const STATUS_PILL = {
  pending:   'bg-gray-100 text-gray-500',
  delivered: 'bg-green-100 text-green-700',
  skipped:   'bg-amber-100 text-amber-600',
  locked:    'bg-blue-100 text-blue-600',
};

export default function DeliveryRoutePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const planMap = Object.fromEntries((settings.plans || []).map(p => [p.id, p]));
  const { showSuccess, showError } = useToast();

  const [records, setRecords] = useState(null);
  const [activeTab, setActiveTab] = useState('lunch');
  const [modifierRecord, setModifierRecord] = useState(null);
  const [closingConfirm, setClosingConfirm] = useState(null); // 'lunch' | 'dinner' | null
  const [closingSlot, setClosingSlot] = useState(null);

  const dateStr = getTodayStr();

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collectionGroup(db, 'dailyRecords'),
      where('ownerId', '==', currentUser.uid),
      where('date', '==', dateStr)
    );

    const unsub = onSnapshot(q, (snap) => {
      const recs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(recs);
    }, (err) => {
      console.error('Delivery snapshot error:', err);
      setRecords([]);
    });

    return unsub;
  }, [currentUser, dateStr]);

  // Auto-switch tab to whichever slot has records
  useEffect(() => {
    if (!records) return;
    const lunchCount = records.filter(r => r.mealSlot === 'lunch').length;
    const dinnerCount = records.filter(r => r.mealSlot === 'dinner').length;
    if (lunchCount === 0 && dinnerCount > 0) setActiveTab('dinner');
  }, [records]);

  const getSlotRecords = (slot) => (records || []).filter(r => r.mealSlot === slot);

  const getSlotStats = (slot) => {
    const recs = getSlotRecords(slot);
    const done = recs.filter(r => r.status === 'delivered' || r.status === 'locked').length;
    return { total: recs.length, done };
  };

  const handleStatusChange = useCallback(async (record, status) => {
    if (record.status === 'locked') return;
    try {
      await updateRecordStatus(record, status);
    } catch (err) {
      console.error(err);
      showError('Failed to update. Please try again.');
    }
  }, [showError]);

  const handleModify = useCallback((record) => setModifierRecord(record), []);

  const handleConfirmClose = async (slot) => {
    setClosingConfirm(null);
    setClosingSlot(slot);
    try {
      // Capture who is being locked before the status changes
      const beingLocked = (records || []).filter(r => r.mealSlot === slot && r.status === 'delivered');

      const locked = await lockMealSlot(records, slot);
      const label = slot.charAt(0).toUpperCase() + slot.slice(1);
      showSuccess(`${label} closed — ${locked} record${locked !== 1 ? 's' : ''} locked.`);

      // Fire-and-forget milestone checks for each customer that just got locked
      beingLocked.forEach(r => {
        checkAndWriteMilestone(r.customerId, r.ownerId, r.customerName, r.phone || '').catch(console.error);
      });
    } catch (err) {
      console.error(err);
      showError('Failed to close deliveries.');
    } finally {
      setClosingSlot(null);
    }
  };

  const isLoading = records === null;
  const hasRecords = !isLoading && records.length > 0;

  const tabRecords = getSlotRecords(activeTab);
  const tabStats = getSlotStats(activeTab);
  const isSlotAllLocked = tabRecords.length > 0 && tabRecords.every(r => r.status === 'locked');

  const grouped = tabRecords.reduce((acc, r) => {
    const area = r.routeArea || 'Other';
    if (!acc[area]) acc[area] = [];
    acc[area].push(r);
    return acc;
  }, {});

  const pendingInSlot = tabRecords.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/kitchen')}
          className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors font-bold text-lg"
          title="Back to Kitchen"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Delivery Route</h1>
          <p className="text-xs text-gray-400">{dateStr}</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && <ListSkeleton count={6} />}

      {/* No records */}
      {!isLoading && !hasRecords && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-600 mb-5">No delivery records found for today.</p>
          <button
            onClick={() => navigate('/kitchen')}
            className="text-red-600 font-semibold hover:underline text-sm"
          >
            Go to Kitchen View to start the day →
          </button>
        </div>
      )}

      {hasRecords && (
        <>
          {/* Meal slot tabs */}
          {(() => {
            const lunchStats = getSlotStats('lunch');
            const dinnerStats = getSlotStats('dinner');
            if (lunchStats.total === 0 || dinnerStats.total === 0) return null;
            return (
              <div className="flex gap-1.5 bg-gray-100 p-1 rounded-2xl">
                {['lunch', 'dinner'].map(slot => {
                  const s = getSlotStats(slot);
                  const allDone = s.done === s.total;
                  return (
                    <button
                      key={slot}
                      onClick={() => setActiveTab(slot)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                        activeTab === slot ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      <span>{slot === 'lunch' ? '☀️' : '🌙'} {slot.charAt(0).toUpperCase() + slot.slice(1)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${allDone ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {s.done}/{s.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Progress */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">{tabStats.done} of {tabStats.total} delivered</span>
              <span className="font-semibold text-green-600">
                {tabStats.total ? Math.round((tabStats.done / tabStats.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 rounded-full h-2 transition-all duration-500"
                style={{ width: `${tabStats.total ? (tabStats.done / tabStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Delivery cards grouped by area */}
          {Object.entries(grouped).map(([area, areaRecs]) => (
            <div key={area} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  📍 {area}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">
                  {areaRecs.filter(r => r.status === 'delivered' || r.status === 'locked').length}/{areaRecs.length}
                </span>
              </div>
              {areaRecs.map(record => (
                <DeliveryCard
                  key={record.customerId}
                  record={record}
                  planMap={planMap}
                  onStatusChange={handleStatusChange}
                  onModify={handleModify}
                />
              ))}
            </div>
          ))}

          {/* Close slot section */}
          {!isSlotAllLocked && (
            <div className="pt-2 pb-4">
              {closingConfirm === activeTab ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    {pendingInSlot > 0
                      ? `${pendingInSlot} deliveries are still pending. Lock anyway?`
                      : `Lock all ${activeTab} deliveries?`}
                  </p>
                  <p className="text-xs text-amber-600 mb-4">
                    Locked records feed into billing. This can't be undone easily.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setClosingConfirm(null)}
                      className="flex-1 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmClose(activeTab)}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                    >
                      Yes, Lock {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setClosingConfirm(activeTab)}
                  disabled={closingSlot === activeTab}
                  className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-red-300 hover:text-red-600 transition-all disabled:opacity-50"
                >
                  {closingSlot === activeTab
                    ? 'Locking…'
                    : `🔒 Close ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Deliveries`}
                </button>
              )}
            </div>
          )}

          {isSlotAllLocked && (
            <div className="text-center py-4 text-sm text-blue-600 font-semibold">
              🔒 {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} deliveries are locked
            </div>
          )}
        </>
      )}

      {/* Modifier bottom sheet */}
      {modifierRecord && (
        <ModifierPanel
          record={modifierRecord}
          settings={settings}
          onClose={() => setModifierRecord(null)}
          onSaved={() => setModifierRecord(null)}
        />
      )}
    </div>
  );
}

const DeliveryCard = memo(function DeliveryCard({ record, planMap, onStatusChange, onModify }) {
  const plan = planMap[record.planType];
  const isLocked = record.status === 'locked';
  const isDelivered = record.status === 'delivered';
  const isSkipped = record.status === 'skipped';

  const effectiveSpice = record.kitchenOverrides?.spiceLevel || record.defaultSpice;
  const effectiveRice = record.kitchenOverrides?.riceVolume || record.defaultRice;
  const spiceOverridden = !!record.kitchenOverrides?.spiceLevel;
  const riceOverridden = !!record.kitchenOverrides?.riceVolume;

  const extraChapati = (record.billingModifiers || [])
    .filter(m => m.type === 'extraChapati')
    .reduce((s, m) => s + (m.qty || 0), 0);
  const hasCurd = (record.billingModifiers || []).some(m => m.type === 'extraCurd');
  const hasSide = (record.billingModifiers || []).some(m => m.type === 'extraSide');
  const hasModifiers = extraChapati > 0 || hasCurd || hasSide;

  return (
    <div className={`relative bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.04] p-4 pl-5 transition-all overflow-hidden ${isDelivered || isLocked ? 'opacity-75' : ''}`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${STATUS_ACCENT[record.status] || STATUS_ACCENT.pending}`} />
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{record.customerName}</span>
            {plan && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${planMap[record.planType]?.badgeColor ?? 'bg-gray-500 text-white'}`}>
                {plan.label}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_PILL[record.status] || STATUS_PILL.pending}`}>
              {record.status === 'locked' ? '🔒 Locked' : record.status ? (record.status.charAt(0).toUpperCase() + record.status.slice(1)) : 'Pending'}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-500">
            <span className={spiceOverridden ? 'text-red-600 font-medium' : ''}>
              🌶️ {effectiveSpice}
            </span>
            <span className={riceOverridden ? 'text-blue-600 font-medium' : ''}>
              🍚 {effectiveRice}
            </span>
            {extraChapati > 0 && (
              <span className="text-orange-600 font-semibold">+{extraChapati} chapati</span>
            )}
            {hasCurd && <span className="text-teal-600 font-semibold">+Curd</span>}
            {hasSide && <span className="text-purple-600 font-semibold">+Side</span>}
            {record.notes && <span className="text-gray-400 italic">"{record.notes}"</span>}
          </div>

          <div className="mt-1.5 text-sm font-bold text-gray-800">
            ₹{record.dayTotal || record.basePriceSnapshot}
            {hasModifiers && (
              <span className="text-xs text-gray-400 font-normal ml-1.5">
                (base ₹{record.basePriceSnapshot})
              </span>
            )}
          </div>
        </div>
      </div>

      {!isLocked && (
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onStatusChange(record, isDelivered ? 'pending' : 'delivered')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              isDelivered
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
            }`}
          >
            {isDelivered ? '✓ Delivered' : 'Delivered'}
          </button>
          <button
            onClick={() => onStatusChange(record, isSkipped ? 'pending' : 'skipped')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              isSkipped
                ? 'bg-amber-400 text-white hover:bg-amber-500'
                : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700'
            }`}
          >
            {isSkipped ? 'Skipped' : 'Skip'}
          </button>
          <button
            onClick={() => onModify(record)}
            className="w-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700 transition-all text-lg font-bold"
            title="Add modifiers"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
});
