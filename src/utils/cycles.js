// src/utils/cycles.js
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const getMonthRange = (month) => {
  const [year, mon] = month.split('-').map(Number);
  const nextMon = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`;
  return { start: `${month}-01`, end: `${nextMon}-01` };
};

const aggregateCycleData = async (customerId, month) => {
  const { start, end } = getMonthRange(month);

  const snap = await getDocs(
    query(
      collection(db, 'clients', customerId, 'dailyRecords'),
      where('date', '>=', start),
      where('date', '<', end)
    )
  );

  const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const delivered = records.filter(r => r.status === 'locked' || r.status === 'delivered');
  const skipped = records.filter(r => r.status === 'skipped');
  const totalAmount = delivered.reduce((s, r) => s + (r.dayTotal || r.basePriceSnapshot || 0), 0);
  const first = records[0];

  return {
    totalDelivered: delivered.length,
    totalSkipped: skipped.length,
    totalAmount,
    ownerId: first?.ownerId || '',
    customerName: first?.customerName || '',
  };
};

export const generateCycle = async (customerId, month, fallbackOwnerId = '', fallbackName = '') => {
  const { totalDelivered, totalSkipped, totalAmount, ownerId, customerName } =
    await aggregateCycleData(customerId, month);

  // Don't create a cycle document if there are no deliveries — avoids confusing ₹0 bills
  if (totalDelivered === 0) {
    return { totalDelivered: 0, totalAmount: 0 };
  }

  const cycleRef = doc(db, 'clients', customerId, 'cycles', month);
  const existing = await getDoc(cycleRef);

  if (existing.exists()) {
    await updateDoc(cycleRef, {
      totalDelivered,
      totalSkipped,
      totalAmount,
      lastRecalculated: serverTimestamp(),
    });
  } else {
    await setDoc(cycleRef, {
      customerId,
      customerName: customerName || fallbackName,
      ownerId: ownerId || fallbackOwnerId,
      month,
      status: 'open',
      totalDelivered,
      totalSkipped,
      totalAmount,
      paymentMode: null,
      paidAt: null,
      settledAt: null,
      generatedAt: serverTimestamp(),
      lastRecalculated: serverTimestamp(),
    });
  }

  return { totalDelivered, totalAmount };
};

// Recalculate totals only — preserves status and payment info (for retroactive adjustments)
export const recalculateCycle = async (customerId, month) => {
  const { totalDelivered, totalSkipped, totalAmount } = await aggregateCycleData(customerId, month);
  const cycleRef = doc(db, 'clients', customerId, 'cycles', month);
  const existing = await getDoc(cycleRef);

  if (existing.exists()) {
    await updateDoc(cycleRef, { totalDelivered, totalSkipped, totalAmount, lastRecalculated: serverTimestamp() });
  } else {
    await generateCycle(customerId, month);
  }
};

export const markCyclePaid = async (customerId, month, paymentMode) => {
  await updateDoc(doc(db, 'clients', customerId, 'cycles', month), {
    status: 'paid',
    paymentMode,
    paidAt: serverTimestamp(),
  });
};

export const settleCycle = async (customerId, month, fallbackOwnerId = '', fallbackName = '') => {
  const { totalDelivered, totalSkipped, totalAmount, ownerId, customerName } =
    await aggregateCycleData(customerId, month);

  const cycleRef = doc(db, 'clients', customerId, 'cycles', month);
  const existing = await getDoc(cycleRef);

  if (existing.exists()) {
    await updateDoc(cycleRef, {
      status: 'settled',
      totalDelivered,
      totalSkipped,
      totalAmount,
      settledAt: serverTimestamp(),
      lastRecalculated: serverTimestamp(),
    });
  } else {
    await setDoc(cycleRef, {
      customerId,
      customerName: customerName || fallbackName,
      ownerId: ownerId || fallbackOwnerId,
      month,
      status: 'settled',
      totalDelivered,
      totalSkipped,
      totalAmount,
      paymentMode: null,
      paidAt: null,
      settledAt: serverTimestamp(),
      generatedAt: serverTimestamp(),
      lastRecalculated: serverTimestamp(),
    });
  }

  return { totalDelivered, totalAmount };
};

export const getMonthLabel = (month) => {
  const [year, mon] = month.split('-');
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${MONTHS[parseInt(mon) - 1]} ${year}`;
};

export const getFullMonthLabel = (month) => {
  const [year, mon] = month.split('-');
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${MONTHS[parseInt(mon) - 1]} ${year}`;
};

export const getPrevMonth = (month) => {
  const [year, mon] = month.split('-').map(Number);
  return mon === 1 ? `${year - 1}-12` : `${year}-${String(mon - 1).padStart(2, '0')}`;
};

export const getNextMonth = (month) => {
  const [year, mon] = month.split('-').map(Number);
  return mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`;
};

// Aggregates billingModifiers across all daily records in a month
// Returns e.g. [{ type:'extraChapati', qty:5, rate:7, total:35 }, ...]
export const fetchModifierBreakdown = async (clientId, month) => {
  const { start, end } = getMonthRange(month);
  const snap = await getDocs(
    query(
      collection(db, 'clients', clientId, 'dailyRecords'),
      where('date', '>=', start),
      where('date', '<', end)
    )
  );

  const totals = {};
  snap.docs.forEach(d => {
    (d.data().billingModifiers || []).forEach(m => {
      if (!totals[m.type]) totals[m.type] = { type: m.type, qty: 0, rate: m.rate, total: 0 };
      totals[m.type].qty += m.qty || 1;
      totals[m.type].total += m.total || 0;
    });
  });

  return Object.values(totals);
};

export const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
