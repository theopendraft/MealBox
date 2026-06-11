// src/pages/BillingPage.jsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, collectionGroup, doc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { PLAN_TYPES, PLAN_BADGE } from '../config/plans';
import {
  generateCycle, markCyclePaid, settleCycle,
  getFullMonthLabel, getPrevMonth, getNextMonth, getCurrentMonth,
} from '../utils/cycles';
import { buildBillLink, buildReminderLink } from '../utils/whatsapp';
import { useToast } from '../components/ui/Toast';
import BillPDFButton from '../components/BillPDFButton';

const PAYMENT_MODES = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'upi',  label: '📱 UPI' },
  { value: 'bank', label: '🏦 Bank' },
];

// Returns "YYYY-MM-30" (or last day if month < 30 days)
const getDueStr = (month) => {
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${month}-${String(Math.min(30, lastDay)).padStart(2, '0')}`;
};

const getTodayStr = () => new Date().toISOString().slice(0, 10);

const formatDueDate = (dueStr) => {
  const [, m, d] = dueStr.split('-');
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`;
};

export default function BillingPage() {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  const [clients, setClients] = useState([]);
  const [cycles, setCycles] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [generatingAll, setGeneratingAll] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(null);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [settlingClient, setSettlingClient] = useState(null);
  const [confirmingSettle, setConfirmingSettle] = useState(null);
  const [waLoading, setWaLoading] = useState(null);

  // Due-date logic
  const dueStr = getDueStr(selectedMonth);
  const todayStr = getTodayStr();
  const currentMonth = getCurrentMonth();
  const isCurrentMonth = selectedMonth === currentMonth;
  const isPastDue = todayStr > dueStr && selectedMonth <= currentMonth;

  // Real-time client listener (all statuses — so deactivated clients still show in billing history)
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      query(collection(db, 'clients'), where('ownerId', '==', currentUser.uid)),
      (snap) => setClients(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Billing clients error:', err)
    );
    return unsub;
  }, [currentUser]);

  // Real-time cycles for selected month
  useEffect(() => {
    if (!currentUser) return;
    setCycles({});
    const unsub = onSnapshot(
      query(
        collectionGroup(db, 'cycles'),
        where('ownerId', '==', currentUser.uid),
        where('month', '==', selectedMonth)
      ),
      (snap) => {
        const map = {};
        snap.docs.forEach(d => { map[d.data().customerId] = { id: d.id, ...d.data() }; });
        setCycles(map);
      },
      (err) => {
        console.error('Cycles snapshot error:', err);
        if (err.code === 'failed-precondition') {
          showError('Cycles index is still building. Please wait a moment and refresh.');
        }
      }
    );
    return unsub;
  }, [currentUser, selectedMonth]);

  // Clients that belong in the selected month's billing
  const billingClients = useMemo(() => {
    const monthStart = `${selectedMonth}-01`;
    const [y, m] = selectedMonth.split('-').map(Number);
    const monthEnd = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;

    return clients.filter(c => {
      if (c.status !== 'active' && c.status !== 'paused') return false;

      if (c.customerType === 'ondemand') {
        // Show only in the month of their order date
        return c.plan?.date >= monthStart && c.plan?.date < monthEnd;
      }

      // Subscribed: must have started before the month ended
      if (c.startDate && c.startDate >= monthEnd) return false;
      // Subscribed: must not have ended before the month started
      if (c.endDate && c.endDate < monthStart) return false;
      return true;
    });
  }, [clients, selectedMonth]);

  const summary = useMemo(() => {
    const cycleList = Object.values(cycles);
    return {
      outstanding: cycleList.filter(c => c.status === 'open' || c.status === 'settled').reduce((s, c) => s + c.totalAmount, 0),
      collected:   cycleList.filter(c => c.status === 'paid').reduce((s, c) => s + c.totalAmount, 0),
    };
  }, [cycles]);

  const unpaidClients = useMemo(
    () => billingClients.filter(c => { const cy = cycles[c.id]; return !cy || cy.status === 'open' || cy.status === 'settled'; }),
    [billingClients, cycles]
  );

  const paidClients = useMemo(
    () => billingClients.filter(c => cycles[c.id]?.status === 'paid'),
    [billingClients, cycles]
  );

  // Clients with no cycle doc yet (need bill generated)
  const ungenerated = unpaidClients.filter(c => !cycles[c.id]);

  const handleGenerate = async (client) => {
    setGeneratingIds(prev => new Set([...prev, client.id]));
    try {
      const result = await generateCycle(client.id, selectedMonth, currentUser.uid, client.name);
      if (result.totalDelivered === 0) {
        showInfo(`${client.name}: No locked deliveries in ${getFullMonthLabel(selectedMonth)}. Complete Kitchen → Delivery → Lock first.`);
      } else {
        showSuccess(`${client.name}: ₹${result.totalAmount} (${result.totalDelivered} days)`);
      }
    } catch (err) {
      console.error(err);
      showError(`Failed to generate bill for ${client.name}.`);
    } finally {
      setGeneratingIds(prev => { const s = new Set(prev); s.delete(client.id); return s; });
    }
  };

  const handleGenerateAll = async () => {
    if (ungenerated.length === 0) { showInfo('All bills already generated.'); return; }
    setGeneratingAll(true);
    let done = 0, skipped = 0;
    for (const c of ungenerated) {
      try {
        const r = await generateCycle(c.id, selectedMonth, currentUser.uid, c.name);
        if (r.totalDelivered > 0) done++;
        else skipped++;
      } catch (err) {
        console.error(`Failed for ${c.name}:`, err);
      }
    }
    if (done > 0) showSuccess(`Generated ${done} bill${done !== 1 ? 's' : ''}.${skipped > 0 ? ` (${skipped} had no deliveries yet)` : ''}`);
    else showInfo(`No deliveries found for ${skipped} client${skipped !== 1 ? 's' : ''}. Use Kitchen → Delivery pages first.`);
    setGeneratingAll(false);
  };

  const handleSendWhatsApp = async (client, cycle) => {
    setWaLoading(client.id);
    try {
      const link = buildBillLink(client, cycle, [], settings);
      window.open(link, '_blank');
    } catch (err) {
      showError('Failed to build WhatsApp link.');
    } finally {
      setWaLoading(null);
    }
  };

  const handleMarkPaid = (client, cycle) => {
    setMarkingPaid({ clientId: client.id, customerName: client.name, amount: cycle.totalAmount });
    setPaymentMode('cash');
  };

  const confirmMarkPaid = async () => {
    if (!markingPaid) return;
    try {
      await markCyclePaid(markingPaid.clientId, selectedMonth, paymentMode);
      showSuccess(`${markingPaid.customerName} — ${getFullMonthLabel(selectedMonth)} marked paid via ${paymentMode}.`);
    } catch (err) {
      showError('Failed to mark as paid.');
    } finally {
      setMarkingPaid(null);
    }
  };

  const handleSettleNow = async (client) => {
    setSettlingClient(client.id);
    try {
      const result = await generateCycle(client.id, selectedMonth, currentUser.uid, client.name);
      if (result.totalDelivered === 0) {
        showInfo('No deliveries to settle for this client.');
        return;
      }
      setConfirmingSettle({ clientId: client.id, name: client.name, ...result });
    } catch {
      showError('Failed to calculate settlement.');
    } finally {
      setSettlingClient(null);
    }
  };

  const confirmSettle = async () => {
    if (!confirmingSettle) return;
    try {
      await settleCycle(confirmingSettle.clientId, selectedMonth, currentUser.uid, confirmingSettle.name);
      await updateDoc(doc(db, 'clients', confirmingSettle.clientId), { status: 'inactive' });
      showSuccess(`${confirmingSettle.name} settled — ₹${confirmingSettle.totalAmount}. Marked inactive.`);
    } catch {
      showError('Failed to settle.');
    } finally {
      setConfirmingSettle(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-500 mt-0.5">{getFullMonthLabel(selectedMonth)}</p>
        </div>
        {ungenerated.length > 0 && (
          <button
            onClick={handleGenerateAll}
            disabled={generatingAll}
            className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {generatingAll ? 'Generating…' : `⚡ Generate All (${ungenerated.length})`}
          </button>
        )}
      </div>

      {/* Month navigation + due date */}
      <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 font-bold transition-colors">←</button>
          <span className="font-semibold text-gray-800">{getFullMonthLabel(selectedMonth)}</span>
          <button onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
            disabled={isCurrentMonth}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 font-bold transition-colors disabled:opacity-30 disabled:pointer-events-none">→</button>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            isPastDue
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {isPastDue ? '🔴 Overdue — was due' : '🗓 Due by'} {formatDueDate(dueStr)}
          </span>
          {isCurrentMonth && (
            <span className="text-xs text-gray-400">
              Day {parseInt(todayStr.slice(8))} of month
            </span>
          )}
        </div>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-700">₹{summary.outstanding.toLocaleString('en-IN')}</div>
          <div className="text-xs text-orange-600 mt-0.5 font-medium">Outstanding</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">₹{summary.collected.toLocaleString('en-IN')}</div>
          <div className="text-xs text-green-600 mt-0.5 font-medium">Collected</div>
        </div>
      </div>

      {/* Overdue banner */}
      {isPastDue && unpaidClients.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {unpaidClients.length} client{unpaidClients.length !== 1 ? 's' : ''} unpaid past due date
            </p>
            <p className="text-xs text-red-600 mt-0.5">Generate bills and collect payments</p>
          </div>
        </div>
      )}

      {/* "How billing works" hint — only when all clients have 0 deliveries */}
      {billingClients.length > 0 && ungenerated.length === billingClients.length && (
        <div className="bg-blue-50 rounded-2xl px-4 py-3 text-sm text-blue-700">
          <strong>How billing works:</strong> Go to Kitchen → start the day → mark deliveries on Delivery page → lock the slot. Then come back here to generate bills.
        </div>
      )}

      {/* Unpaid section */}
      {unpaidClients.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unpaid</span>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{unpaidClients.length}</span>
          </div>

          {unpaidClients.map(client => {
            const cycle = cycles[client.id];
            const plan = PLAN_TYPES[client.planType];
            const isGenerating = generatingIds.has(client.id);
            const isWaLoading = waLoading === client.id;
            const clientOverdue = isPastDue && (!cycle || cycle.totalAmount === 0);

            return (
              <div key={client.id} className={`bg-white rounded-2xl ring-1 shadow-sm p-4 ${
                clientOverdue ? 'ring-red-200' : 'ring-black/[0.04]'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="font-semibold text-gray-900 hover:text-red-600 transition-colors text-left"
                      >
                        {client.name}
                      </button>
                      {plan && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_BADGE[client.planType]}`}>
                          {plan.label} · ₹{plan.price}/day
                        </span>
                      )}
                      {clientOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Overdue</span>
                      )}
                    </div>
                    {cycle ? (
                      <div className="text-sm text-gray-500 mt-0.5">{cycle.totalDelivered} days delivered</div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-0.5">Bill not yet generated</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {cycle ? (
                      <div className="text-xl font-bold text-gray-900">₹{cycle.totalAmount}</div>
                    ) : (
                      <div className="text-sm text-gray-400">—</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/clients/${client.id}/ledger`)}
                    className="flex-1 min-w-0 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
                  >
                    📋 Ledger
                  </button>
                  {!cycle ? (
                    <button
                      onClick={() => handleGenerate(client)}
                      disabled={isGenerating}
                      className="flex-1 py-2 rounded-xl bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 disabled:opacity-50 transition-colors"
                    >
                      {isGenerating ? '…' : '⚡ Generate'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSendWhatsApp(client, cycle)}
                        disabled={isWaLoading}
                        className="flex-1 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 disabled:opacity-50 transition-colors"
                      >
                        {isWaLoading ? '…' : '💬 WhatsApp'}
                      </button>
                      <BillPDFButton client={client} cycle={cycle} />
                      <button
                        onClick={() => handleMarkPaid(client, cycle)}
                        className="flex-1 py-2 rounded-xl bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition-colors"
                      >
                        ✓ Paid
                      </button>
                    </>
                  )}
                </div>

                {client.status === 'active' && cycle && cycle.status !== 'settled' && (
                  <button
                    onClick={() => handleSettleNow(client)}
                    disabled={settlingClient === client.id}
                    className="mt-2 w-full py-1.5 rounded-xl border border-gray-200 text-xs text-gray-400 hover:text-amber-600 hover:border-amber-300 transition-colors disabled:opacity-50"
                  >
                    {settlingClient === client.id ? 'Calculating…' : 'Settle Now (mid-month exit)'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paid section */}
      {paidClients.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Paid</span>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{paidClients.length}</span>
          </div>
          {paidClients.map(client => {
            const cycle = cycles[client.id];
            const plan = PLAN_TYPES[client.planType];
            return (
              <div key={client.id} className="bg-white rounded-2xl ring-1 ring-black/[0.04] shadow-sm px-4 py-3 opacity-80">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{client.name}</span>
                      {plan && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_BADGE[client.planType]}`}>
                          {plan.label}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-green-600 mt-0.5">
                      ✓ Paid via {cycle?.paymentMode} · {cycle?.totalDelivered} days · Next due {formatDueDate(getDueStr(getNextMonth(selectedMonth)))}
                    </div>
                  </div>
                  <div className="font-bold text-gray-700">₹{cycle?.totalAmount}</div>
                </div>
                {cycle && (
                  <div className="mt-2 flex">
                    <BillPDFButton client={client} cycle={cycle} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {billingClients.length === 0 && (
        <div className="bg-white rounded-2xl ring-1 ring-black/[0.04] p-10 text-center shadow-sm">
          <div className="text-4xl mb-3">₹</div>
          <p className="text-gray-500">No clients for this month.</p>
          <button onClick={() => navigate('/clients')} className="mt-4 text-red-600 font-semibold text-sm hover:underline">
            Add a client →
          </button>
        </div>
      )}

      {/* Mark as Paid bottom sheet */}
      {markingPaid && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setMarkingPaid(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-2xl mx-auto p-6 pb-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Mark as Paid</h2>
            <p className="text-sm text-gray-500 mb-5">
              {markingPaid.customerName} · ₹{markingPaid.amount} · {getFullMonthLabel(selectedMonth)}
            </p>
            <div className="mb-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Payment Mode</div>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_MODES.map(mode => (
                  <button key={mode.value} onClick={() => setPaymentMode(mode.value)}
                    className={`py-3 rounded-2xl text-sm font-semibold transition-all ${
                      paymentMode === mode.value ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMarkingPaid(null)}
                className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={confirmMarkPaid}
                className="flex-1 py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors">
                Confirm Paid · ₹{markingPaid.amount}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Settle Now confirmation */}
      {confirmingSettle && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setConfirmingSettle(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-2xl mx-auto p-6 pb-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Settle Now</h2>
            <p className="text-sm text-gray-500 mb-4">
              {confirmingSettle.name} · {getFullMonthLabel(selectedMonth)}
            </p>
            <div className="bg-amber-50 rounded-2xl p-4 mb-5">
              <div className="text-sm text-amber-800 font-semibold">
                {confirmingSettle.totalDelivered} days delivered = ₹{confirmingSettle.totalAmount}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                This creates a final bill for this month and marks the client inactive. They can be reactivated later.
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmingSettle(null)}
                className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={confirmSettle}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors">
                Settle & Deactivate
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
