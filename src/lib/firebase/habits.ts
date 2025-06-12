
// --- External Imports ---
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc as firebaseDeleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

// --- Internal Imports ---
import { requireAuth, requireFirestore, nowISO } from './utils';
import type { Habit } from '@/types';

// --- Habit Functions ---
export const getUserHabits = async (userId: string): Promise<Habit[]> => {
  const db = requireFirestore();
  if (!userId) return [];
  const habitsRef = collection(db, `users/${userId}/habits`);
  const q = query(habitsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Habit));
};

export const getHabitById = async (userId: string, habitId: string): Promise<Habit | undefined> => {
  const db = requireFirestore();
  if (!userId || !habitId) return undefined;
  const habitRef = doc(db, `users/${userId}/habits/${habitId}`);
  const snapshot = await getDoc(habitRef);
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Habit) : undefined;
};

export const addHabit = async (
  habitData: Omit<Habit, 'id' | 'createdAt' | 'progress' | 'streak' | 'userId' | 'lastUpdatedAt'>
): Promise<Habit> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const now = nowISO();
  const newHabitPayload = {
    ...habitData,
    userId: user.uid,
    progress: [],
    streak: 0,
    createdAt: now,
    lastUpdatedAt: now,
  };
  const habitsRef = collection(db, `users/${user.uid}/habits`);
  const docRef = await addDoc(habitsRef, newHabitPayload);
  return { id: docRef.id, ...newHabitPayload };
};

export const updateHabit = async (habitData: Habit): Promise<Habit | undefined> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user || user.uid !== habitData.userId) throw new Error('Unauthorized or mismatched user');

  const habitRef = doc(db, `users/${user.uid}/habits/${habitData.id}`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...payloadWithoutId } = { // Exclude id from the payload written to Firestore
    ...habitData,
    lastUpdatedAt: nowISO(),
  };
  await updateDoc(habitRef, payloadWithoutId);
  return { ...payloadWithoutId, id: habitData.id }; // Return the full habit object with id
};

export const updateHabitProgress = async (
  habitId: string,
  dateISO: string, // Expecting ISO string for consistency
  completed: boolean
): Promise<Habit | undefined> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const habitRef = doc(db, `users/${user.uid}/habits/${habitId}`);
  const habitSnap = await getDoc(habitRef);
  if (!habitSnap.exists()) throw new Error('Habit not found');
  
  const habit = { id: habitSnap.id, ...habitSnap.data() } as Habit;
  let { progress, streak = 0 } = habit;

  const dateOnly = dateISO.substring(0,10); // Use YYYY-MM-DD for comparison to find existing entry
  const progressIndex = progress.findIndex(p => p.date.startsWith(dateOnly));

  if (progressIndex > -1) {
    // Entry for today exists, update it if completion status changed
    if (progress[progressIndex].completed !== completed) {
        progress[progressIndex] = { ...progress[progressIndex], completed, date: dateISO }; // Update with full ISO date
        if (completed) streak++;
        else if (streak > 0) streak--; // Only decrement if it was previously completed and now isn't
    }
  } else {
    // No entry for today, add new one
    progress.push({ date: dateISO, completed });
    if (completed) streak++;
  }
  
  // Sort progress by date to ensure consistency, though for simple append this might not be strictly needed
  progress.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


  const updatedFields = {
    progress,
    streak,
    lastUpdatedAt: nowISO(),
  };

  await updateDoc(habitRef, updatedFields);
  return { ...habit, ...updatedFields };
};

export const deleteHabit = async (userId: string, habitId: string): Promise<void> => {
  const db = requireFirestore();
  if (!userId || !habitId) throw new Error('User ID and Habit ID are required');
  const habitRef = doc(db, `users/${userId}/habits/${habitId}`);
  await firebaseDeleteDoc(habitRef);
};
