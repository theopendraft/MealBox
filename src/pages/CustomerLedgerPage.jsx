// src/pages/CustomerLedgerPage.jsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { PLAN_TYPES, PLAN_BADGE } from '../config/plans';
import { updateRecordStatus } from '../utils/dailyRecords';
import {
  generateCycle, recalculateCycle, getMonthLabel, getFullMonthLabel,
  getPrevMonth, getNextMonth, getCurrentMonth,
} from '../utils/cycles';
import { buildBillLink } from '../utils/whatsapp';
import { useToast } from '../components/ui/Toast';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const buildCalendarDays = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayFirst = (firstDay + 6) % 7; // Mon=0 … Sun=6
  const cells = Array(mondayFirst).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
};

const getNextMonthStr = (month) => {
  const [year, mon] = month.split('-').map(Number);
  return mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`;
};

const STATUS_CELL = {
  delivered: 'bg-green-500 text-white',
  locked:    'bg-green-600 text-white',
  skipped:   'bg-gray-300 text-gray-600',
  pending:   'bg-orange-100 text-orange-600 ring-2 ring-orange-300',
};

export default function CustomerLedgerPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const { showSuccess, showError, showInfo } = useToast();

  const [client, setClient] = useState(null);
  const [records, setRecords] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [adjustingRecord, setAdjustingRecord] = useState(null);
  const [generatingCycle, setGeneratingCycle] = useState(false);
  const [buildingWA, setBuildingWA] = useState(false);
  const [confirmAdjust, setConfirmAdjust] = useState(false);

  // Fetch client once
  useEffect(() => {
    if (!clientId) return;
    getDoc(doc(db, 'clients', clientId)).then(snap => {
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() });
    });
  }, [clientId]);

  // Real-time daily records for selected month
  useEffect(() => {
    if (!clientId) return;
    setRecords(null);

    const nextMonthStr = getNextMonthStr(selectedMonth);
    const q = query(
      collection(db, 'clients', clientId, 'dailyRecords'),
      where('date', '>=', `${selectedMonth}-01`),
      where('date', '<', nextMonthStr),
      orderBy('date', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Ledger records error:', err);
      setRecords([]);
    });

    return unsub;
  }, [clientId, selectedMonth]);

  // Real-time cycle for selected month
  useEffect(() => {
    if (!clientId) return;
    const cycleRef = doc(db, 'clients', clientId, 'cycles', selectedMonth);
    const unsub = onSnapshot(cycleRef, (snap) => {
      setCycle(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return unsub;
  }, [clientId, selectedMonth]);

  // Computed totals from daily records
  const computed = useMemo(() => {
    if (!records) return { total: 0, delivered: 0, skipped: 0, pending: 0 };
    const delivered = records.filter(r => r.status === 'locked' || r.status === 'delivered');
    const skipped = records.filter(r => r.status === 'skipped');
    const pending = records.filter(r => r.status === 'pending');
    const total = delivered.reduce((s, r) => s + (r.dayTotal || r.basePriceSnapshot || 0), 0);
    return { total, delivered: delivered.length, skipped: skipped.length, pending: pending.length };
  }, [records]);

  const recordsByDate = useMemo(() => {
    if (!records) return {};
    return records.reduce((acc, r) => { acc[r.date] = r; return acc; }, {});
  }, [records]);

  // Calendar structure
  const [calYear, calMonth0] = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    return [y, m - 1]; // 0-indexed month for Date
  }, [selectedMonth]);

  const calCells = useMemo(() => buildCalendarDays(calYear, calMonth0), [calYear, calMonth0]);

  const handleGenerateCycle = async () => {
    if (!client) return;
    setGeneratingCycle(true);
    try {
      const result = await generateCycle(clientId, selectedMonth, currentUser.uid, client.name);
      showSuccess(`Bill generated: ${result.totalDelivered} days, ₹${result.totalAmount}`);
    } catch (err) {
      console.error(err);
      showError('Failed to generate bill.');
    } finally {
      setGeneratingCycle(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!client || !cycle) return;
    setBuildingWA(true);
    try {
      const link = buildBillLink(client, cycle, records || [], settings);
      window.open(link, '_blank');
    } finally {
      setBuildingWA(false);
    }
  };

  const handleAdjustRecord = async () => {
    if (!adjustingRecord) return;
    try {
      await updateRecordStatus(adjustingRecord, 'skipped');
      await recalculateCycle(clientId, selectedMonth);
      showSuccess(`${adjustingRecord.date} removed from bill.`);
    } catch (err) {
      console.error(err);
      showError('Failed to adjust record.');
    } finally {
      setAdjustingRecord(null);
      setConfirmAdjust(false);
    }
  };

  const currentMonth = getCurrentMonth();
  const isCurrentMonth = selectedMonth === currentMonth;

  const getCellDateStr = (day) => {
    const m = String(calMonth0 + 1).padStart(2, '0');
    return `${calYear}-${m}-${String(day).padStart(2, '0')}`;
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/clients/${clientId}`)}
          className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 font-bold text-lg transition-colors"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{client.name}</h1>
          <p className="text-xs text-gray-400">Monthly Ledger</p>
        </div>
        {client.planType && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PLAN_BADGE[client.planType]}`}>
            {PLAN_TYPES[client.planType]?.label}
          </span>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
        <button
          onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 font-bold transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <div className="font-semibold text-gray-900">{getFullMonthLabel(selectedMonth)}</div>
          {cycle && (
            <div className={`text-xs mt-0.5 font-medium ${
              cycle.status === 'paid' ? 'text-green-600' :
              cycle.status === 'settled' ? 'text-blue-600' : 'text-orange-500'
            }`}>
              {cycle.status === 'paid' ? `✓ Paid via ${cycle.paymentMode}` :
               cycle.status === 'settled' ? 'Settled' : 'Bill open'}
            </div>
          )}
        </div>
        <button
          onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
          disabled={isCurrentMonth}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 font-bold transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          →
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{computed.delivered}</div>
          <div className="text-xs text-green-600 mt-0.5">Delivered</div>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-red-700">₹{computed.total}</div>
          <div className="text-xs text-red-600 mt-0.5">{cycle ? 'Bill total' : 'Running total'}</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{computed.skipped}</div>
          <div className="text-xs text-gray-500 mt-0.5">Skipped</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_HEADERS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {calCells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const dateStr = getCellDateStr(day);
            const record = recordsByDate[dateStr];
            const isToday = dateStr === new Date().toISOString().split('T')[0].replace(/-/g, '-');
            const isPast = dateStr < new Date().toISOString().split('T')[0];
            const isDelivered = record?.status === 'delivered' || record?.status === 'locked';
            const canAdjust = isDelivered;

            return (
              <button
                key={day}
                onClick={() => canAdjust && setAdjustingRecord(record)}
                disabled={!canAdjust}
                className={`
                  relative flex flex-col items-center justify-center rounded-xl aspect-square text-xs font-semibold transition-all
                  ${record ? STATUS_CELL[record.status] || 'bg-gray-50 text-gray-400' : isPast ? 'bg-gray-50 text-gray-300' : 'bg-white text-gray-300'}
                  ${isToday && !record ? 'ring-2 ring-red-400 text-red-500' : ''}
                  ${canAdjust ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-default'}
                `}
              >
                <span>{day}</span>
                {isDelivered && record?.dayTotal && (
                  <span className="text-[9px] opacity-90">₹{record.dayTotal}</span>
                )}
                {record?.status === 'skipped' && <span className="text-[9px]">Skip</span>}
                {record?.status === 'pending' && <span className="text-[9px]">·</span>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-green-500" /> Delivered
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-gray-300" /> Skipped
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-orange-100 ring-1 ring-orange-300" /> Pending
          </div>
        </div>
      </div>

      {/* Day-by-day list */}
      {records && records.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Day Details</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {[...records].reverse().map(record => {
              const plan = PLAN_TYPES[record.planType];
              const extras = record.billingModifiers || [];
              const chapati = extras.filter(m => m.type === 'extraChapati').reduce((s, m) => s + m.qty, 0);
              const hasCurd = extras.some(m => m.type === 'extraCurd');
              const hasSide = extras.some(m => m.type === 'extraSide');
              const isDelivered = record.status === 'delivered' || record.status === 'locked';

              return (
                <div
                  key={record.id}
                  className={`flex items-center justify-between px-4 py-3 ${isDelivered ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                  onClick={() => isDelivered && setAdjustingRecord(record)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{record.date.substring(5).replace('-', '/')}</span>
                      {record.status === 'locked' && <span className="text-xs text-blue-500">🔒</span>}
                      {record.status === 'skipped' && <span className="text-xs text-gray-400">Skipped</span>}
                      {record.status === 'pending' && <span className="text-xs text-orange-500">Pending</span>}
                    </div>
                    {isDelivered && (
                      <div className="text-xs text-gray-400 mt-0.5 flex gap-2 flex-wrap">
                        <span>{plan?.label || record.planType}</span>
                        {chapati > 0 && <span className="text-orange-500">+{chapati} roti</span>}
                        {hasCurd && <span className="text-teal-500">+Curd</span>}
                        {hasSide && <span className="text-purple-500">+Side</span>}
                      </div>
                    )}
                  </div>
                  {isDelivered && (
                    <div className="text-sm font-bold text-gray-800">₹{record.dayTotal || record.basePriceSnapshot}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bill actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
        {cycle?.status === 'paid' ? (
          <div className="text-center py-2">
            <div className="text-green-600 font-semibold text-lg">✓ Paid — ₹{cycle.totalAmount}</div>
            <div className="text-xs text-gray-400 mt-1">via {cycle.paymentMode} · {cycle.status}</div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">
                  {cycle ? 'Bill generated' : 'Ready to bill'}
                </div>
                <div className="text-xl font-bold text-gray-900">
                  ₹{cycle ? cycle.totalAmount : computed.total}
                </div>
              </div>
              <button
                onClick={handleGenerateCycle}
                disabled={generatingCycle || computed.delivered === 0}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {generatingCycle ? 'Generating…' : cycle ? '↻ Refresh Bill' : '⚡ Generate Bill'}
              </button>
            </div>

            {cycle && (
              <button
                onClick={handleSendWhatsApp}
                disabled={buildingWA}
                className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>💬</span>
                {buildingWA ? 'Opening WhatsApp…' : `Send Bill on WhatsApp · ₹${cycle.totalAmount}`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Retroactive adjustment bottom sheet */}
      {adjustingRecord && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setAdjustingRecord(null); setConfirmAdjust(false); }} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-2xl mx-auto p-6 pb-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">{adjustingRecord.date}</h2>
            <div className="text-sm text-gray-500 mb-1">
              {PLAN_TYPES[adjustingRecord.planType]?.label || adjustingRecord.planType} — ₹{adjustingRecord.dayTotal || adjustingRecord.basePriceSnapshot}
            </div>
            {(adjustingRecord.billingModifiers || []).length > 0 && (
              <div className="text-xs text-gray-400 mb-4">
                {adjustingRecord.billingModifiers.map((m, i) => (
                  <span key={i} className="mr-2">
                    {m.type === 'extraChapati' ? `+${m.qty} roti` : m.type === 'extraCurd' ? '+Curd' : '+Side'}
                  </span>
                ))}
              </div>
            )}
            <div className={`rounded-2xl p-4 mb-5 ${confirmAdjust ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              {!confirmAdjust ? (
                <>
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    Customer says this delivery didn't happen?
                  </p>
                  <p className="text-xs text-gray-500">
                    Marking as skipped removes ₹{adjustingRecord.dayTotal || adjustingRecord.basePriceSnapshot} from the bill and recalculates the total.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-red-700 font-medium mb-1">
                    This action is logged and reduces the bill by ₹{adjustingRecord.dayTotal || adjustingRecord.basePriceSnapshot}.
                  </p>
                  <p className="text-xs text-red-500">Are you sure?</p>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setAdjustingRecord(null); setConfirmAdjust(false); }}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              {!confirmAdjust ? (
                <button
                  onClick={() => setConfirmAdjust(true)}
                  className="flex-1 py-3 rounded-2xl bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition-colors"
                >
                  Mark as Skipped
                </button>
              ) : (
                <button
                  onClick={handleAdjustRecord}
                  className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Yes, Remove from Bill
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
