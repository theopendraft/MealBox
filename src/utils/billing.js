// src/utils/billing.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export const calculateBillForClient = async (
  client,
  startDateStr,
  endDateStr
) => {
  // On-demand client: use plan data + any additional single orders
  if (client.customerType === "ondemand") {
    let mainOrderAmount = 0;
    let planOrder = null;

    // Check if client's main on-demand order falls within billing period
    if (client.plan?.date && client.plan?.price) {
      const planDate = client.plan.date;
      if (planDate >= startDateStr && planDate <= endDateStr) {
        mainOrderAmount = client.plan.price;
        planOrder = {
          orderDate: planDate,
          mealType: client.plan.mealType,
          price: client.plan.price,
        };
      }
    }

    // Also fetch any additional single tiffin orders
    const ordersSnapshot = await getDocs(
      collection(db, "clients", client.id, "orders")
    );
    const allOrdersRaw = ordersSnapshot.docs.map((doc) => doc.data());
    const extraOrders = allOrdersRaw.filter((order) => {
      let orderDateStr = null;
      if (typeof order.orderDate === "string") {
        orderDateStr = order.orderDate;
      } else if (
        order.orderDate &&
        typeof order.orderDate.toDate === "function"
      ) {
        const d = order.orderDate.toDate();
        orderDateStr = d.toISOString().slice(0, 10);
      }
      return (
        orderDateStr &&
        orderDateStr >= startDateStr &&
        orderDateStr <= endDateStr
      );
    });

    const extraOrdersAmount = extraOrders.reduce(
      (sum, order) => sum + (order.price || 0),
      0
    );

    const finalAmount = mainOrderAmount + extraOrdersAmount;

    return {
      clientId: client.id,
      clientName: client.name,
      ownerId: client.ownerId,
      billingPeriod: { start: startDateStr, end: endDateStr },
      finalAmount,
      status: "unpaid",
      details: {
        lunchesDelivered: 0,
        dinnersDelivered: 0,
        lunchPrice: 0,
        dinnerPrice: 0,
        // Main on-demand order details
        mainOrder: planOrder,
        mainOrderAmount,
        // Extra single orders details
        extraOrdersCount: extraOrders.length,
        extraOrdersAmount,
        extraOrders: extraOrders,
      },
    };
  }

  // Subscription client: original logic
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
