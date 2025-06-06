
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
  deleteDoc as firebaseDeleteDoc, // Renamed to avoid conflict
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
import { generateChallengeImage as genkitGenerateChallengeImage, type GenerateChallengeImageInput, type GenerateChallengeImageOutput } from '@/ai/flows/generate-challenge-image-flow';


// --- User Profile ---
export const createUserProfileDocument = async (user: FirebaseAuthUser, additionalData: Partial<UserProfile> = {}) => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const userRef = doc(firestoreInstance, `users/${user.uid}`);
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
  const { id, ...payloadWithoutId } = updatedPayload; 
  await updateDoc(habitRef, payloadWithoutId);
  return updatedPayload;
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
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const postsFbCollection = collection(firestoreInstance, 'posts');
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

export const addChallenge = async (challengeDataInput: Omit<Challenge, 'id' | 'createdAt' | 'creatorId' | 'participantIds' | 'leaderboardPreview'>): Promise<Challenge> => {
  const firestoreInstance = getFirestore();
  const authInstance = getAuth();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  const user = authInstance.currentUser;
  if (!user) throw new Error("User not authenticated for creating challenge");

  let finalImageUrl = challengeDataInput.imageUrl;
  // Retain the user-provided or category-derived hint for general purpose, even if AI image is generated
  let finalDataAiHint = challengeDataInput.dataAiHint || challengeDataInput.category?.toLowerCase() || 'challenge image'; 

  if (!finalImageUrl && challengeDataInput.title) {
    console.log("No image URL provided, attempting AI generation...");
    try {
      const imagePrompt = `A high-quality, vibrant, and inspiring stock photo for a community challenge. Title: "${challengeDataInput.title}". Category: ${challengeDataInput.category}. Keywords: ${finalDataAiHint}. The image should be visually appealing and relevant. Avoid text in the image.`;
      const generatedImageResult = await genkitGenerateChallengeImage({ prompt: imagePrompt });
      if (generatedImageResult.imageUrl) {
        finalImageUrl = generatedImageResult.imageUrl;
        // The dataAiHint for the challenge itself remains based on user input or category,
        // as this describes the challenge, not necessarily the exact generated image.
        // The <img> tag will use this hint.
      } else {
        console.warn("AI image generation did not return a URL, using placeholder.");
        finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title)}`;
      }
    } catch (genError) {
      console.warn("AI image generation failed, using placeholder:", genError);
      finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(challengeDataInput.title)}`;
    }
  } else if (!finalImageUrl) {
    // Fallback if no user-provided URL and title is somehow missing (though form should validate title)
    finalImageUrl = `https://placehold.co/600x400.png?text=Challenge`;
  }


  const challengesFbCollection = collection(firestoreInstance, 'challenges');
  const now = Timestamp.now();
  const newChallengePayload = {
    ...challengeDataInput,
    imageUrl: finalImageUrl,
    dataAiHint: finalDataAiHint.split(' ').slice(0, 2).join(' '), // Ensure hint is max 2 words for the <img> tag
    creatorId: user.uid,
    participantIds: [user.uid], 
    leaderboardPreview: [],
    createdAt: now.toDate().toISOString(),
  };
  const docRef = await addDoc(challengesFbCollection, newChallengePayload);
  return { id: docRef.id, ...newChallengePayload };
};

export const joinChallenge = async (challengeId: string, userId: string): Promise<Challenge | undefined> => {
  const firestoreInstance = getFirestore();
  if (!firestoreInstance) throw new Error("Firestore not initialized");
  if (!userId) throw new Error("User not authenticated to join challenge");
  if (!challengeId) throw new Error("Challenge ID is required");

  const challengeRef = doc(firestoreInstance, 'challenges', challengeId);
  
  try {
    await updateDoc(challengeRef, {
      participantIds: arrayUnion(userId)
    });
    // Re-fetch the challenge to return its updated state
    const updatedChallengeSnap = await getDoc(challengeRef);
    if (updatedChallengeSnap.exists()) {
      return { id: updatedChallengeSnap.id, ...updatedChallengeSnap.data() } as Challenge;
    }
    return undefined;
  } catch (error) {
    console.error("Error joining challenge:", error);
    throw error; // Re-throw to be caught by the UI
  }
};


// --- Badges ---
export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  const userProfile = await getUserProfile(userId);
  if (!userProfile || !userProfile.earnedBadgeIds) return [];

  return staticBadgeDefinitions.filter(badgeDef => userProfile.earnedBadgeIds!.includes(badgeDef.id))
    .map(badge => ({...badge, earnedAt: userProfile.createdAt })); // Note: earnedAt should be specific to badge, not user creation. This is a simplification.
};

export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
    const firestoreInstance = getFirestore();
    if (!firestoreInstance) throw new Error("Firestore not initialized");
    const userRef = doc(firestoreInstance, `users/${userId}`);
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
    
    if (snapshot.empty) return true;

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
