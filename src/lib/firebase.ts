
import { auth, firestore } from './firebase/client';
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
  deleteDoc,
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

// --- User Profile ---
export const createUserProfileDocument = async (user: FirebaseAuthUser, additionalData: Partial<UserProfile> = {}) => {
  if (!firestore) throw new Error("Firestore not initialized");
  const userRef = doc(firestore, `users/${user.uid}`);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    const { email, displayName, photoURL, metadata } = user;
    const createdAt = metadata.creationTime ? new Date(metadata.creationTime).toISOString() : new Date().toISOString();
    const profileData: UserProfile = {
      id: user.uid,
      name: displayName || additionalData.name || 'New User',
      email: email || '',
      avatarUrl: photoURL || defaultUserSchema.avatarUrl,
      createdAt: createdAt,
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
  const firebaseUser = auth?.currentUser;
  if (!firebaseUser) return null;
  return getUserProfile(firebaseUser.uid);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!firestore) throw new Error("Firestore not initialized");
  if (!userId) return null;
  const userRef = doc(firestore, `users/${userId}`);
  const userSnapshot = await getDoc(userRef);
  if (userSnapshot.exists()) {
    return userSnapshot.data() as UserProfile;
  } else {
    console.warn(`No profile document found for user ${userId}. Attempting to create from Auth.`);
    const firebaseUser = auth?.currentUser;
    if (firebaseUser && firebaseUser.uid === userId) {
        return createUserProfileDocument(firebaseUser);
    }
    return null;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> => {
  if (!firestore) throw new Error("Firestore not initialized");
  const userRef = doc(firestore, `users/${userId}`);
  const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      (acc as any)[key] = value;
    }
    return acc;
  }, {} as Partial<UserProfile>);

  await updateDoc(userRef, cleanData);
  return getUserProfile(userId);
};

// --- Firebase Auth wrappers ---
export const signInWithEmail = async (email: string, pass: string): Promise<FirebaseAuthUser> => {
  if (!auth) throw new Error("Firebase auth not initialized");
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  await getUserProfile(userCredential.user.uid);
  return userCredential.user;
};

export const signUpWithEmail = async (name: string, email: string, pass: string): Promise<FirebaseAuthUser> => {
  if (!auth) throw new Error("Firebase auth not initialized");
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  await firebaseUpdateProfile(user, { displayName: name });
  await createUserProfileDocument(user, { name }); 
  
  await firebaseSendEmailVerification(user);
  await firebaseSignOut(auth); 
  return user;
};

export const signInWithGoogle = async (): Promise<FirebaseAuthUser> => {
  if (!auth) throw new Error("Firebase auth not initialized");
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await createUserProfileDocument(result.user); 
  return result.user;
};

export const signOut = async (): Promise<void> => {
  if (!auth) throw new Error("Firebase auth not initialized");
  await firebaseSignOut(auth);
};

export const sendEmailVerification = async (user: FirebaseAuthUser): Promise<void> => {
  if (!auth) throw new Error("Firebase auth not initialized");
  await firebaseSendEmailVerification(user);
};


// --- Habits ---
export const getUserHabits = async (userId: string): Promise<Habit[]> => {
  if (!firestore) throw new Error("Firestore not initialized");
  if (!userId) return [];
  const habitsRef = collection(firestore, `users/${userId}/habits`);
  const q = query(habitsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
};

export const getHabitById = async (userId: string, habitId: string): Promise<Habit | undefined> => {
  if (!firestore) throw new Error("Firestore not initialized");
  if (!userId || !habitId) return undefined;
  const habitRef = doc(firestore, `users/${userId}/habits/${habitId}`);
  const snapshot = await getDoc(habitRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Habit : undefined;
};

export const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'progress' | 'streak' | 'userId' | 'lastUpdatedAt'>): Promise<Habit> => {
  if (!firestore) throw new Error("Firestore not initialized");
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const habitsRef = collection(firestore, `users/${user.uid}/habits`);
  const now = Timestamp.now();
  const newHabitPayload = {
    ...habitData,
    userId: user.uid,
    progress: [],
    streak: 0,
    createdAt: now.toDate().toISOString(),
    lastUpdatedAt: now.toDate().toISOString(),
  };
  const docRef = await addDoc(habitsRef, newHabitPayload);
  return { id: docRef.id, ...newHabitPayload } as Habit;
};

export const updateHabit = async (habitData: Habit): Promise<Habit | undefined> => {
  if (!firestore) throw new Error("Firestore not initialized");
  const user = auth.currentUser;
  if (!user || user.uid !== habitData.userId) throw new Error("Unauthorized or mismatched user");
  
  const habitRef = doc(firestore, `users/${user.uid}/habits/${habitData.id}`);
  const updatedPayload = {
    ...habitData,
    lastUpdatedAt: Timestamp.now().toDate().toISOString(),
  };
  const { id, ...payloadWithoutId } = updatedPayload; 
  await updateDoc(habitRef, payloadWithoutId);
  return updatedPayload;
};

export const updateHabitProgress = async (habitId: string, dateISO: string, completed: boolean): Promise<Habit | undefined> => {
  if (!firestore) throw new Error("Firestore not initialized");
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const habitRef = doc(firestore, `users/${user.uid}/habits/${habitId}`);
  const habitSnap = await getDoc(habitRef);

  if (!habitSnap.exists()) throw new Error("Habit not found");

  const habit = { id: habitSnap.id, ...habitSnap.data() } as Habit;
  let progress = [...habit.progress];
  let streak = habit.streak || 0;

  const dateOnly = dateISO.substring(0, 10);
  const progressIndex = progress.findIndex(p => p.date.startsWith(dateOnly));

  if (progressIndex > -1) {
    if (progress[progressIndex].completed !== completed) {
        progress[progressIndex] = { ...progress[progressIndex], completed, date: dateISO };
        if (completed) streak++; else if (streak > 0) streak--;
    }
  } else {
    progress.push({ date: dateISO, completed });
    if (completed) streak++;
  }
  
  await updateDoc(habitRef, { 
    progress, 
    streak,
    lastUpdatedAt: Timestamp.now().toDate().toISOString(),
  });
  return { ...habit, progress, streak, lastUpdatedAt: Timestamp.now().toDate().toISOString() };
};


// --- Community Posts ---
export const getCommunityPosts = async (lastVisiblePost?: CommunityPost, count: number = 10): Promise<CommunityPost[]> => {
  if (!firestore) throw new Error("Firestore not initialized");
  const postsFbCollection = collection(firestore, 'posts');
  let q = query(postsFbCollection, orderBy('createdAt', 'desc'), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
};

export const addCommunityPost = async (postData: Omit<CommunityPost, 'id' | 'createdAt' | 'userName' | 'userAvatarUrl' | 'likes' | 'commentsCount' | 'userId'>): Promise<CommunityPost> => {
  if (!firestore) throw new Error("Firestore not initialized");
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  
  const userProfile = await getUserProfile(user.uid);
  if (!userProfile) throw new Error("User profile not found");

  const postsFbCollection = collection(firestore, 'posts');
  const now = Timestamp.now();
  const newPostPayload = {
    ...postData,
    userId: user.uid,
    userName: userProfile.name,
    userAvatarUrl: userProfile.avatarUrl || '',
    likes: [],
    commentsCount: 0,
    createdAt: now.toDate().toISOString(),
  };
  const docRef = await addDoc(postsFbCollection, newPostPayload);
  return { id: docRef.id, ...newPostPayload };
};

export const likePost = async (postId: string, userIdToToggle: string): Promise<CommunityPost | undefined> => {
  if (!firestore) throw new Error("Firestore not initialized");
  const postRef = doc(firestore, `posts/${postId}`);
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

// --- Challenges ---
export const getChallenges = async (): Promise<Challenge[]> => {
  if (!firestore) throw new Error("Firestore not initialized");
  const challengesFbCollection = collection(firestore, 'challenges');
  const q = query(challengesFbCollection, orderBy('startDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
};

// --- Badges ---
export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  const userProfile = await getUserProfile(userId);
  if (!userProfile || !userProfile.earnedBadgeIds) return [];

  return staticBadgeDefinitions.filter(badgeDef => userProfile.earnedBadgeIds!.includes(badgeDef.id))
    .map(badge => ({...badge, earnedAt: userProfile.createdAt }));
};

export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const userRef = doc(firestore, `users/${userId}`);
    await updateDoc(userRef, {
        earnedBadgeIds: arrayUnion(badgeId)
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
export const generateAIInsights = async (input: GenerateAIInsightsInput): Promise<GenerateAIInsightsOutput> => {
  return genkitGenerateAIInsights(input);
};

export const suggestHabitMicroTask = async (input: SuggestHabitMicroTaskInput): Promise<SuggestHabitMicroTaskOutput> => {
  const result = await genkitSuggestHabitMicroTask(input);
  return result;
};

// --- Notifications ---
export const getNotifications = async (userId: string, count: number = 10): Promise<Notification[]> => {
  if (!firestore) throw new Error("Firestore not initialized");
  if (!userId) return [];
  const notificationsRef = collection(firestore, `users/${userId}/notifications`);
  const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};

export const addNotification = async (userId: string, notificationData: Omit<Notification, 'id' | 'createdAt' | 'userId' | 'read'>): Promise<Notification> => {
  if (!firestore) throw new Error("Firestore not initialized");
  if(!userId) throw new Error("User ID is required to add a notification.");
  const notificationsRef = collection(firestore, `users/${userId}/notifications`);
  const now = Timestamp.now();
  const newNotificationPayload = {
    ...notificationData,
    userId,
    read: false,
    createdAt: now.toDate().toISOString(),
  };
  const docRef = await addDoc(notificationsRef, newNotificationPayload);
  return { id: docRef.id, ...newNotificationPayload };
};

export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<boolean> => {
  if (!firestore) throw new Error("Firestore not initialized");
  if (!userId || !notificationId) return false;
  const notificationRef = doc(firestore, `users/${userId}/notifications/${notificationId}`);
  try {
    await updateDoc(notificationRef, { read: true });
    return true;
  } catch (error) {
    console.error("Error marking notification as read: ", error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    if (!firestore) throw new Error("Firestore not initialized");
    if (!userId) return false;
    const notificationsRef = collection(firestore, `users/${userId}/notifications`);
    const q = query(notificationsRef, where("read", "==", false));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return true;

    const batch = writeBatch(firestore);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });

    try {
        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error marking all notifications as read: ", error);
        return false;
    }
};

