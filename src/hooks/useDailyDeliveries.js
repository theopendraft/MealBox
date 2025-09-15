// src/hooks/useDailyDeliveries.js
import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

export function useDailyDeliveries() {
  const [deliveryList, setDeliveryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const generateDeliveryList = async () => {
      setLoading(true);
      const todayStr = getTodayDateString();
      const finalList = [];
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const todayDayName = dayNames[new Date().getDay()];

      try {
        const clientsQuery = query(
          collection(db, "clients"),
          where("ownerId", "==", currentUser.uid),
          where("status", "==", "active")
        );
        const activeClientsSnapshot = await getDocs(clientsQuery);

        for (const clientDoc of activeClientsSnapshot.docs) {
          const client = { id: clientDoc.id, ...clientDoc.data() };

          // --- LOGIC FOR SUBSCRIBED CLIENTS ---
          if (client.customerType === "subscribed") {
            // Basic checks for subscription period and weekly schedule
            if (
              (client.plan?.startDate && todayStr < client.plan.startDate) ||
              (client.plan?.endDate && todayStr > client.plan.endDate)
            )
              continue;
            if (
              !client.deliverySchedule ||
              !client.deliverySchedule[todayDayName]
            )
              continue;

            const pausesSnapshot = await getDocs(
              query(collection(db, "clients", client.id, "pauses"))
            );
            const pauses = pausesSnapshot.docs.map((doc) => doc.data());

            // Check for Lunch
            if (client.plan?.lunch?.subscribed) {
              const isPaused = pauses.some(
                (p) =>
                  (p.mealType === "lunch" || p.mealType === "both") &&
                  todayStr >= p.startDate &&
                  todayStr <= p.endDate
              );
              if (!isPaused) {
                finalList.push({ client, meal: "Lunch", type: "Subscription" });
              }
            }

            // Check for Dinner
            if (client.plan?.dinner?.subscribed) {
              const isPaused = pauses.some(
                (p) =>
                  (p.mealType === "dinner" || p.mealType === "both") &&
                  todayStr >= p.startDate &&
                  todayStr <= p.endDate
              );
              if (!isPaused) {
                finalList.push({
                  client,
                  meal: "Dinner",
                  type: "Subscription",
                });
              }
            }
          }

          // --- NEW LOGIC: Check for single orders for ALL clients ---
          const ordersQuery = query(
            collection(db, "clients", client.id, "orders"),
            where("orderDate", "==", todayStr)
          );
          const ordersSnapshot = await getDocs(ordersQuery);

          if (!ordersSnapshot.empty) {
            ordersSnapshot.forEach((orderDoc) => {
              const order = orderDoc.data();
              finalList.push({
                client,
                meal: order.mealType,
                type: "Single Order",
                price: order.price,
              });
            });
          }
        }
        setDeliveryList(finalList);
      } catch (error) {
        console.error("Error generating delivery list:", error);
      } finally {
        setLoading(false);
      }
    };

    generateDeliveryList();
  }, [currentUser]);

  return { deliveryList, loading };
}
