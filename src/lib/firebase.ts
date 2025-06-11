// --- External Imports ---
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
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  limit,
  setDoc,
} from 'firebase/firestore';

// --- Internal Imports ---
import { getAuth, getFirestore } from './firebase/client';
import { mockUser as defaultUserSchema, mockBadges as staticBadgeDefinitions } from './mock-data';
import type { UserProfile, Habit, CommunityPost, Challenge, Badge, Notification } from '@/types';
import {
  generateAIInsights as genkitGenerateAIInsights,
  type GenerateAIInsightsInput,
  type GenerateAIInsightsOutput,
} from '@/ai/flows/generate-ai-insights';
import {
  suggestHabitMicroTask as genkitSuggestHabitMicroTask,
  type SuggestHabitMicroTaskInput,
  type SuggestHabitMicroTaskOutput,
} from '@/ai/flows/suggest-habit-micro-task';
import { getPexelsImageForChallenge } from '@/app/(app)/challenges/actions';

// --- Helpers ---
const requireAuth = () => {
  const auth = getAuth();
  if (!auth) throw new Error('Firebase auth not initialized');
  return auth;
};
const requireFirestore = () => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');
  return db;
};
const nowISO = () => Timestamp.now().toDate().toISOString();

// --- Auth ---
export const signInWithEmail = async (email: string, pass: string): Promise<FirebaseAuthUser> => {
  const auth = requireAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  await getUserProfile(userCredential.user.uid);
  return userCredential.user;
};

export const signUpWithEmail = async (name: string, email: string, pass: string): Promise<FirebaseAuthUser> => {
  const auth = requireAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  await firebaseUpdateProfile(user, { displayName: name });
  await createUserProfileDocument(user, { name });
  await firebaseSendEmailVerification(user);
  await firebaseSignOut(auth);

  return user;
};

export const signInWithGoogle = async (): Promise<FirebaseAuthUser> => {
  const auth = requireAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await createUserProfileDocument(result.user);
  return result.user;
};

export const signOut = async (): Promise<void> => {
  const auth = requireAuth();
  await firebaseSignOut(auth);
};

export const sendEmailVerification = async (user: FirebaseAuthUser): Promise<void> => {
  if (!user) throw new Error('User object required for sending verification email.');
  await firebaseSendEmailVerification(user);
};

// --- User Profile ---
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
      name: displayName || additionalData.name || 'New User',
      email: email || '',
      avatarUrl: photoURL || defaultUserSchema.avatarUrl,
      createdAt,
      lastUpdatedAt: now,
      timezone: additionalData.timezone || defaultUserSchema.timezone,
      preferences: additionalData.preferences || defaultUserSchema.preferences,
      earnedBadgeIds: [],
    };

    try {
      await setDoc(userRef, profileData);
    } catch (error) {
      console.error('Error creating user profile: ', error);
      throw error;
    }
  }

  return getUserProfile(user.uid);
};

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const auth = requireAuth();
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  return getUserProfile(firebaseUser.uid);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const db = requireFirestore();
  if (!userId) return null;
  const userRef = doc(db, `users/${userId}`);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    return userSnapshot.data() as UserProfile;
  } else {
    console.warn(`No profile document found for user ${userId}. Attempting to create from Auth.`);
    const auth = requireAuth();
    const firebaseUser = auth.currentUser;
    if (firebaseUser && firebaseUser.uid === userId) {
      return createUserProfileDocument(firebaseUser);
    }
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<UserProfile>
): Promise<UserProfile | null> => {
  const db = requireFirestore();
  const userRef = doc(db, `users/${userId}`);

  // Remove undefined keys
  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  const dataWithTimestamp = {
    ...cleanData,
    lastUpdatedAt: nowISO(),
  };

  await updateDoc(userRef, dataWithTimestamp);
  return getUserProfile(userId);
};

// --- Habits ---
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
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Habit : undefined;
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
  const { id, ...payloadWithoutId } = {
    ...habitData,
    lastUpdatedAt: nowISO(),
  };
  await updateDoc(habitRef, payloadWithoutId);
  return { ...payloadWithoutId, id };
};

export const updateHabitProgress = async (
  habitId: string,
  dateISO: string,
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

  const dateOnly = dateISO.substring(0, 10);
  const progressIndex = progress.findIndex(p => p.date.startsWith(dateOnly));

  if (progressIndex > -1) {
    if (progress[progressIndex].completed !== completed) {
      progress[progressIndex] = { ...progress[progressIndex], completed, date: dateISO };
      if (completed) streak++;
      else if (streak > 0) streak--;
    }
  } else {
    progress.push({ date: dateISO, completed });
    if (completed) streak++;
  }

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

// --- Community Posts ---
export const getCommunityPosts = async (
  lastVisiblePost?: CommunityPost,
  count = 10
): Promise<CommunityPost[]> => {
  const db = requireFirestore();
  const postsFbCollection = collection(db, 'posts');
  // TODO: Implement pagination using lastVisiblePost if provided
  const q = query(postsFbCollection, orderBy('createdAt', 'desc'), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as CommunityPost));
};

export const addCommunityPost = async (
  postData: Omit<CommunityPost, 'id' | 'createdAt' | 'userName' | 'userAvatarUrl' | 'likes' | 'commentsCount' | 'userId'>
): Promise<CommunityPost> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const userProfile = await getUserProfile(user.uid);
  if (!userProfile) throw new Error('User profile not found');

  const now = nowISO();
  const newPostPayload = {
    ...postData,
    userId: user.uid,
    userName: userProfile.name,
    userAvatarUrl: userProfile.avatarUrl || '',
    likes: [],
    commentsCount: 0,
    createdAt: now,
  };
  const postsFbCollection = collection(db, 'posts');
  const docRef = await addDoc(postsFbCollection, newPostPayload);
  return { id: docRef.id, ...newPostPayload };
};

export const likePost = async (postId: string, userIdToToggle: string): Promise<CommunityPost | undefined> => {
  const db = requireFirestore();
  const postRef = doc(db, `posts/${postId}`);
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
  const db = requireFirestore();
  const postRef = doc(db, 'posts', postId);
  await firebaseDeleteDoc(postRef);
};

// --- Challenges ---
export const getChallenges = async (): Promise<Challenge[]> => {
  const db = requireFirestore();
  const challengesFbCollection = collection(db, 'challenges');
  const q = query(challengesFbCollection, orderBy('startDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Challenge));
};

export const getChallengeById = async (challengeId: string): Promise<Challenge | undefined> => {
  const db = requireFirestore();
  if (!challengeId) return undefined;
  const challengeRef = doc(db, 'challenges', challengeId);
  const snapshot = await getDoc(challengeRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Challenge : undefined;
};

export const addChallenge = async (
  challengeDataInput: Omit<Challenge, 'id' | 'createdAt' | 'creatorId' | 'participantIds' | 'leaderboardPreview' | 'lastUpdatedAt'>
): Promise<Challenge> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated for creating challenge');

  let finalImageUrl = challengeDataInput.imageUrl;
  let finalDataAiHint = challengeDataInput.dataAiHint || challengeDataInput.category?.toLowerCase() || 'challenge image';

  if (!finalImageUrl && challengeDataInput.title) {
    try {
      const pexelsQuery = [challengeDataInput.title, challengeDataInput.category, challengeDataInput.dataAiHint].filter(Boolean).join(' ').trim();
      if (pexelsQuery) {
        const pexelsImageUrl = await getPexelsImageForChallenge(pexelsQuery);
        finalImageUrl = pexelsImageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title)}`;
      } else {
        finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title || "Challenge")}`;
      }
    } catch {
      finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title)}`;
    }
  } else if (!finalImageUrl) {
    finalImageUrl = `https://placehold.co/600x400.png?text=Challenge`;
  }

  const challengesFbCollection = collection(db, 'challenges');
  const now = nowISO();
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
  if (!challengeSnap.exists() || challengeSnap.data().creatorId !== user.uid) {
    throw new Error('Challenge not found or user is not the creator.');
  }

  let finalData = { ...dataToUpdate };
  if (dataToUpdate.imageUrl === '' || (dataToUpdate.imageUrl === undefined && dataToUpdate.title)) {
    try {
      const queryTitle = dataToUpdate.title || challengeSnap.data().title;
      const queryCategory = dataToUpdate.category || challengeSnap.data().category;
      const queryHint = dataToUpdate.dataAiHint || challengeSnap.data().dataAiHint;
      const pexelsQuery = [queryTitle, queryCategory, queryHint].filter(Boolean).join(' ').trim();
      if (pexelsQuery) {
        const pexelsImageUrl = await getPexelsImageForChallenge(pexelsQuery);
        finalData.imageUrl = pexelsImageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(queryTitle)}`;
        finalData.dataAiHint = (queryHint || queryCategory || 'challenge image').split(' ').slice(0, 2).join(' ');
      } else {
        finalData.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(queryTitle || "Challenge")}`;
      }
    } catch {
      finalData.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(dataToUpdate.title || challengeSnap.data().title)}`;
    }
  } else if (dataToUpdate.imageUrl && dataToUpdate.dataAiHint === undefined) {
    finalData.dataAiHint = challengeSnap.data().dataAiHint || dataToUpdate.category?.toLowerCase() || 'challenge image';
  }
  if (finalData.dataAiHint) {
    finalData.dataAiHint = finalData.dataAiHint.split(' ').slice(0, 2).join(' ');
  }

  const updatePayload = {
    ...finalData,
    lastUpdatedAt: nowISO(),
  };

  await updateDoc(challengeRef, updatePayload);
  const updatedChallengeSnap = await getDoc(challengeRef);
  return updatedChallengeSnap.exists()
    ? { id: updatedChallengeSnap.id, ...updatedChallengeSnap.data() } as Challenge
    : undefined;
};

export const joinChallenge = async (challengeId: string, userId: string): Promise<Challenge | undefined> => {
  const db = requireFirestore();
  if (!userId) throw new Error('User not authenticated to join challenge');
  if (!challengeId) throw new Error('Challenge ID is required');

  const challengeRef = doc(db, 'challenges', challengeId);

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
    console.error('Error joining challenge:', error);
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

  if (!challengeSnap.exists()) throw new Error('Challenge not found.');
  if (challengeSnap.data().creatorId !== user.uid) throw new Error('User is not authorized to delete this challenge.');
  await firebaseDeleteDoc(challengeRef);
};

// --- Badges ---
export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  const userProfile = await getUserProfile(userId);
  if (!userProfile || !userProfile.earnedBadgeIds?.length) return [];
  return userProfile.earnedBadgeIds
    .map(badgeId => {
      const badgeDef = staticBadgeDefinitions.find(b => b.id === badgeId);
      return badgeDef
        ? { ...badgeDef, earnedAt: userProfile.lastUpdatedAt || userProfile.createdAt }
        : null;
    })
    .filter(Boolean) as Badge[];
};

export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
  const db = requireFirestore();
  const userRef = doc(db, `users/${userId}`);
  await updateDoc(userRef, {
    earnedBadgeIds: arrayUnion(badgeId),
    lastUpdatedAt: nowISO(),
  });
  const badge = staticBadgeDefinitions.find(b => b.id === badgeId);
  if (badge) {
    addNotification(userId, {
      message: `Congratulations! You've earned the "${badge.name}" badge!`,
      type: 'milestone',
      link: '/profile?tab=badges',
      relatedEntityId: badgeId,
    });
  }
};

// --- AI Flow Calls ---
export const generateAIInsights = async (
  input: GenerateAIInsightsInput
): Promise<GenerateAIInsightsOutput> => genkitGenerateAIInsights(input);

export const suggestHabitMicroTask = async (
  input: SuggestHabitMicroTaskInput
): Promise<SuggestHabitMicroTaskOutput> => genkitSuggestHabitMicroTask(input);

// --- Notifications ---
export const getNotifications = async (
  userId: string,
  count = 10
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
    userId,
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
  const q = query(notificationsRef, where('read', '==', false));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return true;

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