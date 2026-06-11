// src/utils/milestones.js
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const MILESTONE_VALUES = [10, 30, 50, 100];

export const MILESTONE_COPY = {
  10:  { emoji: '🎉', label: '10 Tiffins!',  message: 'has had 10 tiffins with you — welcome to the MealBox family!' },
  30:  { emoji: '🌟', label: '30 Tiffins!',  message: 'has completed 30 tiffins — a loyal customer!' },
  50:  { emoji: '🏅', label: '50 Tiffins!',  message: 'has reached 50 tiffins — incredible loyalty!' },
  100: { emoji: '🏆', label: '100 Tiffins!', message: 'has hit 100 tiffins — a MealBox legend!' },
};

// Called after lockMealSlot — fires-and-forgets per customer
export const checkAndWriteMilestone = async (customerId, ownerId, customerName, customerPhone = '') => {
  // Count all locked records for this customer (single-collection query, auto-indexed)
  const lockedSnap = await getDocs(
    query(collection(db, 'clients', customerId, 'dailyRecords'), where('status', '==', 'locked'))
  );
  const count = lockedSnap.size;

  if (!MILESTONE_VALUES.includes(count)) return null;

  // Idempotent: don't write duplicate notification for same customer + milestone
  const existingSnap = await getDocs(
    query(
      collection(db, 'notifications'),
      where('customerId', '==', customerId),
      where('milestone', '==', count)
    )
  );
  if (!existingSnap.empty) return null;

  await addDoc(collection(db, 'notifications'), {
    ownerId,
    customerId,
    customerName,
    customerPhone,
    type: 'milestone',
    milestone: count,
    read: false,
    createdAt: serverTimestamp(),
  });

  return count;
};
