
// --- External Imports ---
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  writeBatch,
} from 'firebase/firestore';

// --- Internal Imports ---
import { requireFirestore, nowISO } from './utils';
import type { Notification } from '@/types';

// --- Notification Functions ---
export const getNotifications = async (
  userId: string,
  count = 10 // Default to fetching 10 notifications
): Promise<Notification[]> => {
  const db = requireFirestore();
  if (!userId) return [];
  const notificationsRef = collection(db, `users/${userId}/notifications`);
  const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Notification));
};

export const addNotification = async (
  userId: string,
  notificationData: Omit<Notification, 'id' | 'createdAt' | 'userId' | 'read'>
): Promise<Notification> => {
  const db = requireFirestore();
  if (!userId) throw new Error('User ID is required to add a notification.');
  
  const notificationsRef = collection(db, `users/${userId}/notifications`);
  const now = nowISO();
  const newNotificationPayload = {
    ...notificationData,
    userId, // Ensure userId is part of the document data itself
    read: false,
    createdAt: now,
  };
  const docRef = await addDoc(notificationsRef, newNotificationPayload);
  return { id: docRef.id, ...newNotificationPayload };
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<boolean> => {
  const db = requireFirestore();
  if (!userId || !notificationId) return false;
  const notificationRef = doc(db, `users/${userId}/notifications/${notificationId}`);
  try {
    await updateDoc(notificationRef, { read: true });
    return true;
  } catch (error) {
    console.error('Error marking notification as read: ', error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  const db = requireFirestore();
  if (!userId) return false;
  
  const notificationsRef = collection(db, `users/${userId}/notifications`);
  const q = query(notificationsRef, where('read', '==', false)); // Query for unread notifications
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return true; // No unread notifications to mark
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach(docData => {
    batch.update(docData.ref, { read: true });
  });

  try {
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read: ', error);
    return false;
  }
};
