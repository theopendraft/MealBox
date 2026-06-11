// src/utils/delivery.js
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export const getTodayDeliveries = async (ownerId) => {
  const todayStr = getTodayDateString();
  const todayDayName = DAY_NAMES[new Date().getDay()];
  const finalList = [];

  const clientsQuery = query(
    collection(db, 'clients'),
    where('ownerId', '==', ownerId),
    where('status', '==', 'active')
  );
  const clientsSnapshot = await getDocs(clientsQuery);

  for (const clientDoc of clientsSnapshot.docs) {
    const client = { id: clientDoc.id, ...clientDoc.data() };

    if (client.customerType === 'ondemand') {
      if (client.plan?.date === todayStr && client.plan?.mealType) {
        finalList.push({
          ...client,
          mealType: client.plan.mealType,
          orderType: 'main',
          price: client.plan.price || 0
        });
      }
    }

    if (client.customerType === 'subscribed' && client.deliverySchedule?.[todayDayName]) {
      const pausesSnapshot = await getDocs(collection(db, 'clients', client.id, 'pauses'));
      let lunchPaused = false;
      let dinnerPaused = false;

      for (const pauseDoc of pausesSnapshot.docs) {
        const p = pauseDoc.data();
        if (todayStr >= p.startDate && todayStr <= p.endDate) {
          if (p.mealType === 'lunch' || p.mealType === 'both') lunchPaused = true;
          if (p.mealType === 'dinner' || p.mealType === 'both') dinnerPaused = true;
        }
      }

      if (client.plan?.lunch?.subscribed && !lunchPaused) {
        finalList.push({
          ...client,
          mealType: 'lunch',
          orderType: 'subscription',
          price: client.plan.lunch.price || 0
        });
      }

      if (client.plan?.dinner?.subscribed && !dinnerPaused) {
        finalList.push({
          ...client,
          mealType: 'dinner',
          orderType: 'subscription',
          price: client.plan.dinner.price || 0
        });
      }
    }

    const ordersSnapshot = await getDocs(collection(db, 'clients', client.id, 'orders'));
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      let orderDateStr = order.orderDate;
      if (order.orderDate && typeof order.orderDate.toDate === 'function') {
        orderDateStr = order.orderDate.toDate().toISOString().slice(0, 10);
      }
      if (orderDateStr === todayStr && order.mealType) {
        finalList.push({
          ...client,
          mealType: order.mealType,
          orderType: 'single',
          price: order.price || 0
        });
      }
    }
  }

  return finalList;
};
