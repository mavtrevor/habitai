
import { getAuth, getFirestore } from './firebase/client';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc as firebaseDeleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  limit,
  setDoc
} from 'firebase/firestore';

import { mockUser as defaultUserSchema, mockBadges as staticBadgeDefinitions } from './mock-data';
import type { UserProfile, Habit, CommunityPost, Challenge, Badge, Notification } from '@/types';

// Actual Genkit flow imports
import { generateAIInsights as genkitGenerateAIInsights, type GenerateAIInsightsInput, type GenerateAIInsightsOutput } from '@/ai/flows/generate-ai-insights';
import { suggestHabitMicroTask as genkitSuggestHabitMicroTask, type SuggestHabitMicroTaskInput, type SuggestHabitMicroTaskOutput } from '@/ai/flows/suggest-habit-micro-task';
import { getPexelsImageForChallenge } from '@/app/(app)/challenges/actions';


// --- Firebase Auth Wrappers ---

export const signInWithEmail = async (email: string, pass: string): Promise<FirebaseAuthUser> => {
  const authInstance = getAuth();
  if (!authInstance) throw new Error("Firebase auth not initialized");
  const userCredential = await signInWithEmailAndPassword(authInstance, email, pass);
  await getUserProfile(userCredential.user.uid); // Ensure profile exists or is created
  return userCredential.user;
};

export const signUpWithEmail = async (name: string, email: string, pass: string): Promise<FirebaseAuthUser> => {
  const authInstance = getAuth();
  if (!authInstance) throw new Error("Firebase auth not initialized");
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, pass);
  const user = userCredential.user;

  await firebaseUpdateProfile(user, { displayName: name });
  await createUserProfileDocument(user, { name });

  await firebaseSendEmailVerification(user);
  await firebaseSignOut(authInstance);
  return user;
};

export const signInWithGoogle = async (): Promise<FirebaseAuthUser> => {
  const authInstance = getAuth();
  if (!authInstance) throw new Error("Firebase auth not initialized");
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(authInstance, provider);
  await createUserProfileDocument(result.user);
  return result.user;
};

export const signOut = async (): Promise<void> => {
  const authInstance = getAuth();
  if (!authInstance) throw new Error("Firebase auth not initialized");
  await firebaseSignOut(authInstance);
};

export const sendEmailVerification = async (user: FirebaseAuthUser): Promise<void> => {
  if (!user) throw new Error("User object required for sending verification email.");
  await firebaseSendEmailVerification(user);
};


// --- User Profile ---

export const createUserProfileDocument = async (user: FirebaseAuthUser, additionalData: Partial<UserProfile> = {}) => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const userRef = doc(firestoreInstance, `users/${user.uid}`);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    const { email, displayName, photoURL, metadata } = user;
    const now = Timestamp.now().toDate().toISOString();
    const createdAt = metadata.creationTime ? new Date(metadata.creationTime).toISOString() : now;

    const profileData: UserProfile = {
      id: user.uid,
      name: displayName || additionalData.name || 'New User',
      email: email || '',
      avatarUrl: photoURL || defaultUserSchema.avatarUrl,
      createdAt: createdAt,
      lastUpdatedAt: now,
      timezone: additionalData.timezone || defaultUserSchema.timezone,
      preferences: additionalData.preferences || defaultUserSchema.preferences,
      earnedBadgeIds: [],
    };
    try {
      await setDoc(userRef, profileData);
    } catch (error) {
      console.error("Error creating user profile: ", error);
      throw error;
    }
  }
  return getUserProfile(user.uid);
};

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const authInstance = getAuth();
  const firebaseUser = authInstance?.currentUser;
  if (!firebaseUser) return null;
  return getUserProfile(firebaseUser.uid);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  if (!userId) return null;
  const userRef = doc(firestoreInstance, `users/${userId}`);
  const userSnapshot = await getDoc(userRef);
  if (userSnapshot.exists()) {
    return userSnapshot.data() as UserProfile;
  } else {
    console.warn(`No profile document found for user ${userId}. Attempting to create from Auth.`);
    const authInstance = getAuth();
    const firebaseUser = authInstance?.currentUser;
    if (firebaseUser && firebaseUser.uid === userId) {
        return createUserProfileDocument(firebaseUser);
    }
    return null;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const userRef = doc(firestoreInstance, `users/${userId}`);

  // Ensure only defined values are passed to updateDoc
  const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      (acc as any)[key] = value;
    }
    return acc;
  }, {} as Partial<UserProfile>);

  const dataWithTimestamp = {
    ...cleanData,
    lastUpdatedAt: Timestamp.now().toDate().toISOString(),
  };

  await updateDoc(userRef, dataWithTimestamp);
  return getUserProfile(userId);
};


// --- Habits ---

export const getUserHabits = async (userId: string): Promise<Habit[]> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  if (!userId) return [];
  const habitsRef = collection(firestoreInstance, `users/${userId}/habits`);
  const q = query(habitsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Habit));
};

export const getHabitById = async (userId: string, habitId: string): Promise<Habit | undefined> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  if (!userId || !habitId) return undefined;
  const habitRef = doc(firestoreInstance, `users/${userId}/habits/${habitId}`);
  const snapshot = await getDoc(habitRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Habit : undefined;
};

export const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'progress' | 'streak' | 'userId' | 'lastUpdatedAt'>): Promise<Habit> => {
  const firestoreInstance = getFirestore();
  const authInstance = getAuth();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const user = authInstance.currentUser;
  if (!user) throw new Error("User not authenticated");

  const habitsRef = collection(firestoreInstance, `users/${user.uid}/habits`);
  const now = Timestamp.now().toDate().toISOString();
  const newHabitPayload = {
    ...habitData,
    userId: user.uid,
    progress: [],
    streak: 0,
    createdAt: now,
    lastUpdatedAt: now,
  };
  const docRef = await addDoc(habitsRef, newHabitPayload);
  return { id: docRef.id, ...newHabitPayload } as Habit;
};

export const updateHabit = async (habitData: Habit): Promise<Habit | undefined> => {
  const firestoreInstance = getFirestore();
  const authInstance = getAuth();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const user = authInstance.currentUser;
  if (!user || user.uid !== habitData.userId) throw new Error("Unauthorized or mismatched user");

  const habitRef = doc(firestoreInstance, `users/${user.uid}/habits/${habitData.id}`);
  const updatedPayload = {
    ...habitData,
    lastUpdatedAt: Timestamp.now().toDate().toISOString(),
  };
  // Firestore updateDoc expects an object of fields to update, not the full object with id.
  const { id, ...payloadWithoutId } = updatedPayload;
  await updateDoc(habitRef, payloadWithoutId);
  return updatedPayload; // Return the full habit object with the new timestamp
};


export const updateHabitProgress = async (habitId: string, dateISO: string, completed: boolean): Promise<Habit | undefined> => {
  const firestoreInstance = getFirestore();
  const authInstance = getAuth();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const user = authInstance.currentUser;
  if (!user) throw new Error("User not authenticated");

  const habitRef = doc(firestoreInstance, `users/${user.uid}/habits/${habitId}`);
  const habitSnap = await getDoc(habitRef);

  if (!habitSnap.exists()) throw new Error("Habit not found");

  const habit = { id: habitSnap.id, ...habitSnap.data() } as Habit;
  let progress = [...habit.progress];
  let streak = habit.streak || 0;

  const dateOnly = dateISO.substring(0, 10);
  const progressIndex = progress.findIndex(p => p.date.startsWith(dateOnly));

  if (progressIndex > -1) {
    // Only update streak if completion status actually changes
    if (progress[progressIndex].completed !== completed) {
        progress[progressIndex] = { ...progress[progressIndex], completed, date: dateISO }; // Update date to full ISO string in case it was just dateOnly
        if (completed) streak++; else if (streak > 0) streak--; // Decrement streak only if it was positive
    }
  } else {
    // New progress entry for the day
    progress.push({ date: dateISO, completed });
    if (completed) streak++;
  }

  const updatedFields = {
    progress,
    streak,
    lastUpdatedAt: Timestamp.now().toDate().toISOString(),
  };

  await updateDoc(habitRef, updatedFields);
  return { ...habit, ...updatedFields }; // Return the merged habit data
};

export const deleteHabit = async (userId: string, habitId: string): Promise<void> => {
    const firestoreInstance = getFirestore();
    if (!firestoreInstance) throw new Error("Firestore not initialized");
    if (!userId || !habitId) throw new Error("User ID and Habit ID are required");

    const habitRef = doc(firestoreInstance, `users/${userId}/habits/${habitId}`);
    await firebaseDeleteDoc(habitRef);
};


// --- Community Posts ---

export const getCommunityPosts = async (lastVisiblePost?: CommunityPost, count: number = 10): Promise<CommunityPost[]> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const postsFbCollection = collection(firestoreInstance, 'posts');
  // TODO: Implement pagination using lastVisiblePost if provided
  let q = query(postsFbCollection, orderBy('createdAt', 'desc'), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as CommunityPost));
};

export const addCommunityPost = async (postData: Omit<CommunityPost, 'id' | 'createdAt' | 'userName' | 'userAvatarUrl' | 'likes' | 'commentsCount' | 'userId'>): Promise<CommunityPost> => {
  const firestoreInstance = getFirestore();
  const authInstance = getAuth();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const user = authInstance.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userProfile = await getUserProfile(user.uid);
  if (!userProfile) throw new Error("User profile not found");

  const postsFbCollection = collection(firestoreInstance, 'posts');
  const now = Timestamp.now().toDate().toISOString();
  const newPostPayload = {
    ...postData,
    userId: user.uid,
    userName: userProfile.name,
    userAvatarUrl: userProfile.avatarUrl || '',
    likes: [],
    commentsCount: 0,
    createdAt: now,
  };
  const docRef = await addDoc(postsFbCollection, newPostPayload);
  return { id: docRef.id, ...newPostPayload };
};

export const likePost = async (postId: string, userIdToToggle: string): Promise<CommunityPost | undefined> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const postRef = doc(firestoreInstance, `posts/${postId}`);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return undefined;

  const postData = postSnap.data() as CommunityPost;
  let newLikesArray: string[];

  if (postData.likes.includes(userIdToToggle)) {
    newLikesArray = postData.likes.filter(id => id !== userIdToToggle);
    await updateDoc(postRef, { likes: arrayRemove(userIdToToggle) });
  } else {
    newLikesArray = [...postData.likes, userIdToToggle];
    await updateDoc(postRef, { likes: arrayUnion(userIdToToggle) });
  }
  return { ...postData, id: postId, likes: newLikesArray };
};

export const deletePost = async (postId: string): Promise<void> => {
    const firestoreInstance = getFirestore();
    if (!firestoreInstance) throw new Error("Firestore not initialized");
    // Optional: Add check if current user is the post owner before deleting
    const postRef = doc(firestoreInstance, 'posts', postId);
    await firebaseDeleteDoc(postRef);
};


// --- Challenges ---

export const getChallenges = async (): Promise<Challenge[]> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const challengesFbCollection = collection(firestoreInstance, 'challenges');
  const q = query(challengesFbCollection, orderBy('startDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Challenge));
};

export const getChallengeById = async (challengeId: string): Promise<Challenge | undefined> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  if (!challengeId) return undefined;
  const challengeRef = doc(firestoreInstance, 'challenges', challengeId);
  const snapshot = await getDoc(challengeRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Challenge : undefined;
};

export const addChallenge = async (challengeDataInput: Omit<Challenge, 'id' | 'createdAt' | 'creatorId' | 'participantIds' | 'leaderboardPreview' | 'lastUpdatedAt'>): Promise<Challenge> => {
  const firestoreInstance = getFirestore();
  const authInstance = getAuth();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const user = authInstance.currentUser;
  if (!user) throw new Error("User not authenticated for creating challenge");

  let finalImageUrl = challengeDataInput.imageUrl;
  let finalDataAiHint = challengeDataInput.dataAiHint || challengeDataInput.category?.toLowerCase() || 'challenge image';

  if (!finalImageUrl && challengeDataInput.title) {
    console.log("No image URL provided by user, attempting Pexels fetch...");
    try {
      const pexelsQueryParts = [challengeDataInput.title, challengeDataInput.category, challengeDataInput.dataAiHint].filter(Boolean);
      const pexelsQuery = pexelsQueryParts.join(' ').trim();

      if (pexelsQuery) {
        const pexelsImageUrl = await getPexelsImageForChallenge(pexelsQuery);
        if (pexelsImageUrl) {
          finalImageUrl = pexelsImageUrl;
          console.log("Pexels image fetched successfully:", finalImageUrl);
        } else {
          console.warn("Pexels did not return an image or API key missing, using placeholder.");
          finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title)}`;
        }
      } else {
        console.warn("Cannot form Pexels query (title is primary), using placeholder.");
        finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title || "Challenge")}`;
      }
    } catch (pexelsError) {
      console.error("Pexels API call failed, using placeholder:", pexelsError);
      finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title)}`;
    }
  } else if (!finalImageUrl) {
    finalImageUrl = `https://placehold.co/600x400.png?text=Challenge`;
  }

  const challengesFbCollection = collection(firestoreInstance, 'challenges');
  const now = Timestamp.now().toDate().toISOString();
  const newChallengePayload: Omit<Challenge, 'id'> = {
    ...challengeDataInput,
    imageUrl: finalImageUrl,
    dataAiHint: finalDataAiHint.split(' ').slice(0, 2).join(' '),
    creatorId: user.uid,
    participantIds: [user.uid],
    leaderboardPreview: [],
    createdAt: now,
    lastUpdatedAt: now,
  };
  const docRef = await addDoc(challengesFbCollection, newChallengePayload);
  return { id: docRef.id, ...newChallengePayload };
};

export const updateChallenge = async (challengeId: string, dataToUpdate: Partial<Omit<Challenge, 'id' | 'createdAt' | 'creatorId' | 'participantIds' | 'leaderboardPreview' | 'lastUpdatedAt'>>): Promise<Challenge | undefined> => {
  const firestoreInstance = getFirestore();
  const authInstance = getAuth();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const user = authInstance.currentUser;
  if (!user) throw new Error("User not authenticated");

  const challengeRef = doc(firestoreInstance, 'challenges', challengeId);
  const challengeSnap = await getDoc(challengeRef);
  if (!challengeSnap.exists() || challengeSnap.data().creatorId !== user.uid) {
    throw new Error("Challenge not found or user is not the creator.");
  }

  let finalData = { ...dataToUpdate };

  // Handle image update logic (similar to addChallenge)
  if (dataToUpdate.imageUrl === '' || (dataToUpdate.imageUrl === undefined && dataToUpdate.title)) { // If imageUrl is explicitly cleared or not provided and title exists
    console.log("Image URL cleared or not provided, attempting Pexels fetch for update...");
    try {
      const queryTitle = dataToUpdate.title || challengeSnap.data().title;
      const queryCategory = dataToUpdate.category || challengeSnap.data().category;
      const queryHint = dataToUpdate.dataAiHint || challengeSnap.data().dataAiHint;
      const pexelsQueryParts = [queryTitle, queryCategory, queryHint].filter(Boolean);
      const pexelsQuery = pexelsQueryParts.join(' ').trim();

      if (pexelsQuery) {
        const pexelsImageUrl = await getPexelsImageForChallenge(pexelsQuery);
        if (pexelsImageUrl) {
          finalData.imageUrl = pexelsImageUrl;
          finalData.dataAiHint = (queryHint || queryCategory || 'challenge image').split(' ').slice(0,2).join(' ');
        } else {
          finalData.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(queryTitle)}`;
          finalData.dataAiHint = (queryHint || queryCategory || 'challenge image').split(' ').slice(0,2).join(' ');
        }
      } else {
        finalData.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(queryTitle || "Challenge")}`;
      }
    } catch (pexelsError) {
      console.error("Pexels API call failed during update, using placeholder:", pexelsError);
      finalData.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(dataToUpdate.title || challengeSnap.data().title)}`;
    }
  } else if (dataToUpdate.imageUrl && dataToUpdate.dataAiHint === undefined) {
    // If user provided an image URL but no new hint, try to keep old hint or derive
    finalData.dataAiHint = challengeSnap.data().dataAiHint || dataToUpdate.category?.toLowerCase() || 'challenge image';
  }
  if (finalData.dataAiHint) {
      finalData.dataAiHint = finalData.dataAiHint.split(' ').slice(0,2).join(' ');
  }


  const updatePayload = {
    ...finalData,
    lastUpdatedAt: Timestamp.now().toDate().toISOString(),
  };

  await updateDoc(challengeRef, updatePayload);
  const updatedChallengeSnap = await getDoc(challengeRef);
  return updatedChallengeSnap.exists() ? { id: updatedChallengeSnap.id, ...updatedChallengeSnap.data() } as Challenge : undefined;
};


export const joinChallenge = async (challengeId: string, userId: string): Promise<Challenge | undefined> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  if (!userId) throw new Error("User not authenticated to join challenge");
  if (!challengeId) throw new Error("Challenge ID is required");

  const challengeRef = doc(firestoreInstance, 'challenges', challengeId);

  try {
    await updateDoc(challengeRef, {
      participantIds: arrayUnion(userId),
      lastUpdatedAt: Timestamp.now().toDate().toISOString(),
    });
    const updatedChallengeSnap = await getDoc(challengeRef);
    if (updatedChallengeSnap.exists()) {
      return { id: updatedChallengeSnap.id, ...updatedChallengeSnap.data() } as Challenge;
    }
    return undefined;
  } catch (error) {
    console.error("Error joining challenge:", error);
    throw error;
  }
};

export const deleteChallenge = async (challengeId: string): Promise<void> => {
    const firestoreInstance = getFirestore();
    const authInstance = getAuth();
    if (!firestoreInstance) throw new Error("Firestore not initialized");
    const user = authInstance.currentUser;
    if (!user) throw new Error("User not authenticated");

    const challengeRef = doc(firestoreInstance, 'challenges', challengeId);
    const challengeSnap = await getDoc(challengeRef);

    if (!challengeSnap.exists()) {
        throw new Error("Challenge not found.");
    }
    if (challengeSnap.data().creatorId !== user.uid) {
        throw new Error("User is not authorized to delete this challenge.");
    }
    await firebaseDeleteDoc(challengeRef);
};


// --- Badges ---

export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  const userProfile = await getUserProfile(userId);
  if (!userProfile || !userProfile.earnedBadgeIds || userProfile.earnedBadgeIds.length === 0) return [];

  // For each earned badge ID, find its definition in staticBadgeDefinitions
  // and map it to a Badge object, potentially adding the earnedAt date if stored per badge.
  // For simplicity, we'll use the user's creation date as a placeholder for earnedAt
  // if specific earnedAt dates per badge aren't stored.
  return userProfile.earnedBadgeIds
    .map(badgeId => {
      const badgeDef = staticBadgeDefinitions.find(b => b.id === badgeId);
      if (badgeDef) {
        // TODO: Ideally, earnedAt would be stored with each badge ID in the user's profile.
        // For now, using user's creation date as a fallback or a generic date.
        return { ...badgeDef, earnedAt: userProfile.lastUpdatedAt || userProfile.createdAt };
      }
      return null;
    })
    .filter(badge => badge !== null) as Badge[];
};

export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
    const firestoreInstance = getFirestore();
    if (!firestoreInstance) throw new Error("Firestore not initialized");
    const userRef = doc(firestoreInstance, `users/${userId}`);
    await updateDoc(userRef, {
        earnedBadgeIds: arrayUnion(badgeId),
        lastUpdatedAt: Timestamp.now().toDate().toISOString(),
    });
    const badge = staticBadgeDefinitions.find(b => b.id === badgeId);
    if (badge) {
        addNotification(userId, {
            message: `Congratulations! You've earned the "${badge.name}" badge!`,
            type: 'milestone',
            link: '/profile?tab=badges', // Link to the badges tab on profile
            relatedEntityId: badgeId,
        });
    }
};


// --- AI Flow Calls ---

export const generateAIInsights = async (input: GenerateAIInsightsInput): Promise<GenerateAIInsightsOutput> => {
  return genkitGenerateAIInsights(input);
};

export const suggestHabitMicroTask = async (input: SuggestHabitMicroTaskInput): Promise<SuggestHabitMicroTaskOutput> => {
  const result = await genkitSuggestHabitMicroTask(input);
  return result;
};


// --- Notifications ---

export const getNotifications = async (userId: string, count: number = 10): Promise<Notification[]> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  if (!userId) return [];
  const notificationsRef = collection(firestoreInstance, `users/${userId}/notifications`);
  const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Notification));
};

export const addNotification = async (userId: string, notificationData: Omit<Notification, 'id' | 'createdAt' | 'userId' | 'read'>): Promise<Notification> => {
  const firestoreInstance = getFirestore();
  if(!firestoreInstance) throw new Error("Firestore not initialized");
  if(!userId) throw new Error("User ID is required to add a notification.");
  const notificationsRef = collection(firestoreInstance, `users/${userId}/notifications`);
  const now = Timestamp.now().toDate().toISOString();
  const newNotificationPayload = {
    ...notificationData,
    userId,
    read: false,
    createdAt: now,
  };
  const docRef = await addDoc(notificationsRef, newNotificationPayload);
  return { id: docRef.id, ...newNotificationPayload };
};

export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<boolean> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  if (!userId || !notificationId) return false;
  const notificationRef = doc(firestoreInstance, `users/${userId}/notifications/${notificationId}`);
  try {
    await updateDoc(notificationRef, { read: true });
    return true;
  } catch (error) {
    console.error("Error marking notification as read: ", error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    const firestoreInstance = getFirestore();
    if (!firestoreInstance) throw new Error("Firestore not initialized");
    if (!userId) return false;
    const notificationsRef = collection(firestoreInstance, `users/${userId}/notifications`);
    const q = query(notificationsRef, where("read", "==", false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return true; // No unread notifications

    const batch = writeBatch(firestoreInstance);
    snapshot.docs.forEach(docData => {
        batch.update(docData.ref, { read: true });
    });

    try {
        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error marking all notifications as read: ", error);
        return false;
    }
};
