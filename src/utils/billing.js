// src/utils/billing.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export const calculateBillForClient = async (
  client,
  startDateStr,
  endDateStr
) => {
  // Use the provided start and end dates
  const periodStart = new Date(
    Date.UTC(
      new Date(startDateStr).getFullYear(),
      new Date(startDateStr).getMonth(),
      new Date(startDateStr).getDate()
    )
  );
  const periodEnd = new Date(
    Date.UTC(
      new Date(endDateStr).getFullYear(),
      new Date(endDateStr).getMonth(),
      new Date(endDateStr).getDate()
    )
  );
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const pausesSnapshot = await getDocs(
    query(collection(db, "clients", client.id, "pauses"))
  );
  const pauses = pausesSnapshot.docs.map((doc) => doc.data());

  let lunchesDelivered = 0;
  let dinnersDelivered = 0;
  for (
    let d = new Date(periodStart);
    d <= periodEnd;
    d.setDate(d.getDate() + 1)
  ) {
    const dateStr = d.toISOString().split("T")[0];
    if (
      (client.plan?.startDate && dateStr < client.plan.startDate) ||
      (client.plan?.endDate && dateStr > client.plan.endDate)
    )
      continue;
    const dayName = dayNames[d.getUTCDay()];
    if (!client.deliverySchedule || !client.deliverySchedule[dayName]) continue;
    if (client.plan?.lunch?.subscribed) {
      const isPaused = pauses.some(
        (p) =>
          (p.mealType === "lunch" || p.mealType === "both") &&
          dateStr >= p.startDate &&
          dateStr <= p.endDate
      );
      if (!isPaused) lunchesDelivered++;
    }
    if (client.plan?.dinner?.subscribed) {
      const isPaused = pauses.some(
        (p) =>
          (p.mealType === "dinner" || p.mealType === "both") &&
          dateStr >= p.startDate &&
          dateStr <= p.endDate
      );
      if (!isPaused) dinnersDelivered++;
    }
  }

  const lunchPrice = client.plan?.lunch?.price || 0;
  const dinnerPrice = client.plan?.dinner?.price || 0;
  // This calculates the bill from the subscription
  let subscriptionAmount =
    lunchesDelivered * lunchPrice + dinnersDelivered * dinnerPrice;

  // --- NEW LOGIC: Fetch and add single orders ---
  let extraOrdersAmount = 0;
  const ordersQuery = query(
    collection(db, "clients", client.id, "orders"),
    where("orderDate", ">=", startDateStr),
    where("orderDate", "<=", endDateStr)
  );
  const ordersSnapshot = await getDocs(ordersQuery);
  const extraOrders = ordersSnapshot.docs.map((doc) => doc.data());

  if (extraOrders.length > 0) {
    extraOrdersAmount = extraOrders.reduce(
      (sum, order) => sum + order.price,
      0
    );
  }

  // The final amount is the sum of both
  const finalAmount = subscriptionAmount + extraOrdersAmount;

  if (finalAmount >= 0) {
    return {
      clientId: client.id,
      clientName: client.name,
      ownerId: client.ownerId,
      billingPeriod: { start: startDateStr, end: endDateStr },
      finalAmount,
      status: "unpaid",
      details: {
        lunchesDelivered,
        dinnersDelivered,
        lunchPrice,
        dinnerPrice,
        extraOrdersCount: extraOrders.length,
        extraOrdersAmount,
      },
    };
  }
  return null;
};
