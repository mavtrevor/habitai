
// --- External Imports ---
import { Timestamp } from 'firebase/firestore';

// --- Internal Imports ---
import { getAuth, getFirestore } from './client'; // Assuming client.ts is in the same directory

// --- Helpers ---
export const requireAuth = () => {
  const auth = getAuth();
  if (!auth) throw new Error('Firebase auth not initialized');
  return auth;
};

export const requireFirestore = () => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');
  return db;
};

export const nowISO = () => Timestamp.now().toDate().toISOString();
