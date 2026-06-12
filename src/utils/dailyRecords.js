// src/utils/dailyRecords.js
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getDayName = () =>
  ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];

// "07:00 PM" or "08:00 PM" → dinner, everything else → lunch
const detectMealSlot = (timePreference = '') =>
  (timePreference.startsWith('07:') || timePreference.startsWith('08:')) ? 'dinner' : 'lunch';

export const createTodayRecords = async (ownerId, planMap = {}) => {
  const dateStr = getTodayStr();
  const dayName = getDayName();

  const clientsSnap = await getDocs(
    query(collection(db, 'clients'), where('ownerId', '==', ownerId), where('status', '==', 'active'))
  );

  let created = 0;
  let alreadyExist = 0;

  for (const clientDoc of clientsSnap.docs) {
    const client = { id: clientDoc.id, ...clientDoc.data() };
    const planType = client.planType || 'regular';
    const plan = planMap[planType];
    if (!plan) continue;

    if (client.customerType === 'ondemand') {
      if (client.plan?.date !== dateStr) continue;
    } else {
      if (!client.deliverySchedule?.[dayName]) continue;
      if (client.startDate && dateStr < client.startDate) continue;
      if (client.endDate && dateStr > client.endDate) continue;
    }

    const pausesSnap = await getDocs(collection(db, 'clients', client.id, 'pauses'));
    let isPaused = false;
    for (const p of pausesSnap.docs) {
      const pd = p.data();
      if (dateStr >= pd.startDate && dateStr <= pd.endDate) { isPaused = true; break; }
    }
    if (isPaused) continue;

    const recordRef = doc(db, 'clients', client.id, 'dailyRecords', dateStr);
    const existing = await getDoc(recordRef);
    if (existing.exists()) { alreadyExist++; continue; }

    await setDoc(recordRef, {
      date: dateStr,
      customerId: client.id,
      ownerId,
      customerName: client.name,
      phone: client.phone || '',
      routeArea: client.routeArea || '',
      planType,
      basePriceSnapshot: plan.price,
      status: 'pending',
      billingModifiers: [],
      kitchenOverrides: null,
      dayTotal: plan.price,
      mealSlot: detectMealSlot(client.deliveryTimePreference),
      deliveryTimePreference: client.deliveryTimePreference || '12:00 PM - 01:00 PM',
      defaultSpice: client.preferences?.spiceLevel || 'Medium',
      defaultRice: client.preferences?.riceVolume || client.preferences?.rice || 'Normal',
      chapatis: plan.chapatis,
      notes: client.preferences?.notes || '',
    });

    created++;
  }

  return { created, alreadyExist, date: dateStr };
};

export const lockMealSlot = async (records, mealSlot) => {
  const toClose = records.filter(r => r.mealSlot === mealSlot && r.status === 'delivered');
  for (const r of toClose) {
    await updateDoc(doc(db, 'clients', r.customerId, 'dailyRecords', r.date), { status: 'locked' });
  }
  return toClose.length;
};

export const updateRecordStatus = async (record, status) => {
  await updateDoc(doc(db, 'clients', record.customerId, 'dailyRecords', record.date), { status });
};

export const updateRecordModifiers = async (record, billingModifiers, kitchenOverrides) => {
  const extraTotal = billingModifiers.reduce((s, m) => s + m.total, 0);
  await updateDoc(doc(db, 'clients', record.customerId, 'dailyRecords', record.date), {
    billingModifiers,
    kitchenOverrides,
    dayTotal: record.basePriceSnapshot + extraTotal,
  });
};
