// src/utils/deleteClient.js
// Cascade-deletes a client and ALL their subcollection data from Firestore.
// Firestore does NOT auto-delete subcollections when the parent doc is deleted.
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const deleteClientAndData = async (clientId) => {
  const subcollections = ['dailyRecords', 'cycles', 'pauses', 'orders'];

  // Fetch all subcollection docs in parallel
  const snaps = await Promise.all(
    subcollections.map(sub => getDocs(collection(db, 'clients', clientId, sub)))
  );

  // Delete everything in parallel — subcollection docs + the client doc itself
  await Promise.all([
    ...snaps.flatMap(snap => snap.docs.map(d => deleteDoc(d.ref))),
    deleteDoc(doc(db, 'clients', clientId)),
  ]);
};
