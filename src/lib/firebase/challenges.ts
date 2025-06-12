
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
  arrayUnion,
} from 'firebase/firestore';

// --- Internal Imports ---
import { requireAuth, requireFirestore, nowISO } from './utils';
import type { Challenge } from '@/types';
import { getPexelsImageForChallenge } from '@/app/(app)/challenges/actions'; // Adjust path as necessary

// --- Challenge Functions ---
export const getChallenges = async (): Promise<Challenge[]> => {
  const db = requireFirestore();
  const challengesFbCollection = collection(db, 'challenges');
  const q = query(challengesFbCollection, orderBy('startDate', 'desc')); // Or 'createdAt'
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Challenge));
};

export const getChallengeById = async (challengeId: string): Promise<Challenge | undefined> => {
  const db = requireFirestore();
  if (!challengeId) return undefined;
  const challengeRef = doc(db, 'challenges', challengeId);
  const snapshot = await getDoc(challengeRef);
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Challenge) : undefined;
};

export const addChallenge = async (
  challengeDataInput: Omit<Challenge, 'id' | 'createdAt' | 'creatorId' | 'participantIds' | 'leaderboardPreview' | 'lastUpdatedAt'>
): Promise<Challenge> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated for creating challenge');

  let finalImageUrl = challengeDataInput.imageUrl;
  // Ensure dataAiHint is max 2 words
  let finalDataAiHint = (challengeDataInput.dataAiHint || challengeDataInput.category?.toLowerCase() || 'challenge image').split(' ').slice(0, 2).join(' ');


  if (!finalImageUrl && challengeDataInput.title) {
    try {
      const pexelsQuery = [challengeDataInput.title, challengeDataInput.category, finalDataAiHint].filter(Boolean).join(' ').trim();
      if (pexelsQuery) {
        const pexelsImageUrl = await getPexelsImageForChallenge(pexelsQuery);
        finalImageUrl = pexelsImageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title || "Challenge")}`;
      } else {
         finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title || "Challenge")}`;
      }
    } catch (e) {
      console.error("Error fetching Pexels image, using placeholder:", e);
      finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title || "Challenge")}`;
    }
  } else if (!finalImageUrl) {
      finalImageUrl = `https://placehold.co/600x400.png?text=Challenge`;
  }
  

  const challengesFbCollection = collection(db, 'challenges');
  const now = nowISO();
  const newChallengePayload: Omit<Challenge, 'id'> = { // Ensure this matches Challenge type excluding 'id'
    ...challengeDataInput,
    imageUrl: finalImageUrl,
    dataAiHint: finalDataAiHint,
    creatorId: user.uid,
    participantIds: [user.uid], // Creator automatically joins
    leaderboardPreview: [],
    createdAt: now,
    lastUpdatedAt: now,
  };
  const docRef = await addDoc(challengesFbCollection, newChallengePayload);
  return { id: docRef.id, ...newChallengePayload };
};


export const updateChallenge = async (
  challengeId: string,
  dataToUpdate: Partial<Omit<Challenge, 'id' | 'createdAt' | 'creatorId' | 'participantIds' | 'leaderboardPreview' | 'lastUpdatedAt'>>
): Promise<Challenge | undefined> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const challengeRef = doc(db, 'challenges', challengeId);
  const challengeSnap = await getDoc(challengeRef);
  if (!challengeSnap.exists()) {
    throw new Error('Challenge not found.');
  }
  const existingChallengeData = challengeSnap.data();
  if (existingChallengeData.creatorId !== user.uid) {
    throw new Error('User is not authorized to update this challenge.');
  }

  let finalData = { ...dataToUpdate };

  // Image handling logic: if imageUrl is empty or undefined, and title is available, fetch from Pexels
  if ((finalData.imageUrl === '' || finalData.imageUrl === undefined) && (finalData.title || existingChallengeData.title)) {
    const queryTitle = finalData.title || existingChallengeData.title;
    const queryCategory = finalData.category || existingChallengeData.category;
    let queryHint = finalData.dataAiHint || existingChallengeData.dataAiHint || queryCategory?.toLowerCase() || 'challenge image';
    queryHint = queryHint.split(' ').slice(0, 2).join(' '); // Ensure hint is max 2 words

    try {
      const pexelsQuery = [queryTitle, queryCategory, queryHint].filter(Boolean).join(' ').trim();
      if (pexelsQuery) {
        const pexelsImageUrl = await getPexelsImageForChallenge(pexelsQuery);
        finalData.imageUrl = pexelsImageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(queryTitle)}`;
      } else {
        finalData.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(queryTitle)}`;
      }
      finalData.dataAiHint = queryHint;
    } catch (e) {
      console.error("Error fetching Pexels image during update, using placeholder:", e);
      finalData.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(queryTitle)}`;
      finalData.dataAiHint = queryHint;
    }
  } else if (finalData.imageUrl && finalData.dataAiHint) { // If both provided, ensure hint is max 2 words
     finalData.dataAiHint = finalData.dataAiHint.split(' ').slice(0, 2).join(' ');
  } else if (finalData.imageUrl && finalData.dataAiHint === undefined) { // Image URL provided, hint not, derive hint
     finalData.dataAiHint = (existingChallengeData.dataAiHint || finalData.category || existingChallengeData.category || 'challenge image').split(' ').slice(0,2).join(' ');
  }


  const updatePayload = {
    ...finalData,
    lastUpdatedAt: nowISO(),
  };

  await updateDoc(challengeRef, updatePayload);
  const updatedChallengeSnap = await getDoc(challengeRef);
  return updatedChallengeSnap.exists()
    ? ({ id: updatedChallengeSnap.id, ...updatedChallengeSnap.data() } as Challenge)
    : undefined;
};

export const joinChallenge = async (challengeId: string, userId: string): Promise<Challenge | undefined> => {
  const db = requireFirestore();
  if (!userId) throw new Error('User not authenticated to join challenge');
  if (!challengeId) throw new Error('Challenge ID is required');

  const challengeRef = doc(db, 'challenges', challengeId);
  
  // Security rules should enforce that a user can only add themselves.
  try {
    await updateDoc(challengeRef, {
      participantIds: arrayUnion(userId),
      lastUpdatedAt: nowISO(),
    });
    const updatedChallengeSnap = await getDoc(challengeRef);
    if (updatedChallengeSnap.exists()) {
      return { id: updatedChallengeSnap.id, ...updatedChallengeSnap.data() } as Challenge;
    }
    return undefined;
  } catch (error) {
    console.error("Error joining challenge:", error);
    // Rethrow or handle as specific error to be caught by UI
    throw error;
  }
};

export const deleteChallenge = async (challengeId: string): Promise<void> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const challengeRef = doc(db, 'challenges', challengeId);
  const challengeSnap = await getDoc(challengeRef);

  if (!challengeSnap.exists()) {
    throw new Error('Challenge not found.');
  }
  if (challengeSnap.data().creatorId !== user.uid) {
    throw new Error('User is not authorized to delete this challenge.');
  }
  // TODO: Add rule to ensure only challenge owner can delete
  await firebaseDeleteDoc(challengeRef);
};
