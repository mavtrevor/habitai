
// --- External Imports ---
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseAuthUser } from 'firebase/auth';

// --- Internal Imports ---
import { requireAuth, requireFirestore, nowISO } from './utils';
import { mockUser as defaultUserSchema } from '../mock-data'; // Assuming mock-data is one level up
import type { UserProfile } from '@/types';

// --- User Profile Functions ---
export const createUserProfileDocument = async (
  user: FirebaseAuthUser,
  additionalData: Partial<UserProfile> = {}
): Promise<UserProfile | null> => {
  const db = requireFirestore();
  const userRef = doc(db, `users/${user.uid}`);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    const { email, displayName, photoURL, metadata } = user;
    const now = nowISO();
    const createdAt = metadata.creationTime ? new Date(metadata.creationTime).toISOString() : now;

    const profileData: UserProfile = {
      id: user.uid,
      name: displayName || additionalData.name || defaultUserSchema.name || 'New User',
      email: email || '',
      avatarUrl: photoURL || defaultUserSchema.avatarUrl,
      createdAt,
      lastUpdatedAt: now,
      timezone: additionalData.timezone || defaultUserSchema.timezone,
      preferences: additionalData.preferences || defaultUserSchema.preferences,
      earnedBadgeIds: [], // Start with no badges
    };

    try {
      await setDoc(userRef, profileData);
      return profileData; // Return the created profile data
    } catch (error) {
      console.error('Error creating user profile: ', error);
      throw error; // Re-throw to allow calling function to handle
    }
  } else {
    // If profile already exists, just return it
     return userSnapshot.data() as UserProfile;
  }
};

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const auth = requireAuth();
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  return getUserProfile(firebaseUser.uid);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const db = requireFirestore();
  if (!userId) {
    console.warn("getUserProfile called with no userId");
    return null;
  }
  const userRef = doc(db, `users/${userId}`);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    return userSnapshot.data() as UserProfile;
  } else {
    // Attempt to create profile if it doesn't exist and we have an auth user
    // This handles cases where a user might be authenticated but their Firestore doc wasn't created
    console.warn(`No profile document found for user ${userId}. Attempting to create if auth user matches.`);
    const auth = requireAuth();
    const currentAuthUser = auth.currentUser;
    if (currentAuthUser && currentAuthUser.uid === userId) {
        return createUserProfileDocument(currentAuthUser);
    }
    console.warn(`Could not find or create profile for ${userId}.`);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<UserProfile>
): Promise<UserProfile | null> => {
  const db = requireFirestore();
  const userRef = doc(db, `users/${userId}`);

  // Remove undefined keys to prevent Firestore errors
  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  
  const dataWithTimestamp = {
    ...cleanData,
    lastUpdatedAt: nowISO(),
  };

  await updateDoc(userRef, dataWithTimestamp);
  return getUserProfile(userId); // Return the updated profile
};
