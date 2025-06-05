
import { auth } from './firebase/client';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification, // Renamed to avoid conflict if re-exporting
  updateProfile,
  type User
} from 'firebase/auth';

import { mockUser, mockHabits, mockPosts, mockChallenges, mockBadges, mockNotifications, getMockAIInsights, getMockHabitMicroTask } from './mock-data';
import type { UserProfile, Habit, CommunityPost, Challenge, Badge, Notification } from '@/types';
import type { GenerateAIInsightsInput, GenerateAIInsightsOutput } from '@/ai/flows/generate-ai-insights';
import type { SuggestHabitMicroTaskInput, SuggestHabitMicroTaskOutput } from '@/ai/flows/suggest-habit-micro-task';

// Simulate a delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Firebase Auth functions
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  await delay(50);
  const firebaseUser = auth?.currentUser;
  if (firebaseUser) {
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      avatarUrl: firebaseUser.photoURL || mockUser.avatarUrl,
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      timezone: mockUser.timezone,
      preferences: mockUser.preferences
    };
  }
  return null;
};

export const signInWithEmail = async (email: string, pass: string): Promise<User> => {
  if (!auth) throw new Error("Firebase auth not initialized");
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
};

export const signUpWithEmail = async (name: string, email: string, pass: string): Promise<User> => {
  if (!auth) throw new Error("Firebase auth not initialized");
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  if (name) {
    await updateProfile(user, { displayName: name });
  }

  await firebaseSendEmailVerification(user);
  await firebaseSignOut(auth);

  return user;
};

export const signInWithGoogle = async (): Promise<User> => {
  if (!auth) throw new Error("Firebase auth not initialized");
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signOut = async (): Promise<void> => {
  if (!auth) throw new Error("Firebase auth not initialized");
  await firebaseSignOut(auth);
};

// Export sendEmailVerification so it can be used in the AuthForm
export const sendEmailVerification = async (user: User): Promise<void> => {
  if (!auth) throw new Error("Firebase auth not initialized");
  await firebaseSendEmailVerification(user);
};


// Mock Firestore / Other functions (remain as is for now)
export const getUserHabits = async (userId: string): Promise<Habit[]> => {
  await delay(500);
  return mockHabits.filter(habit => habit.userId === userId);
};

export const addHabit = async (habit: Omit<Habit, 'id' | 'createdAt' | 'progress' | 'streak'>): Promise<Habit> => {
  await delay(300);
  const newHabit: Habit = {
    ...habit,
    id: `habit${Date.now()}`,
    createdAt: new Date().toISOString(),
    progress: [],
    streak: 0,
  };
  mockHabits.push(newHabit);
  return newHabit;
};

export const updateHabitProgress = async (habitId: string, date: string, completed: boolean): Promise<Habit | undefined> => {
  await delay(200);
  const habitIndex = mockHabits.findIndex(h => h.id === habitId);
  if (habitIndex === -1) return undefined;

  const habit = mockHabits[habitIndex];
  const progressIndex = habit.progress.findIndex(p => p.date.startsWith(date.substring(0,10)));

  if (progressIndex > -1) {
    habit.progress[progressIndex].completed = completed;
  } else {
    habit.progress.push({ date, completed });
  }
  if (completed) {
    habit.streak +=1;
  }
  mockHabits[habitIndex] = habit;
  return habit;
};


export const getCommunityPosts = async (): Promise<CommunityPost[]> => {
  await delay(700);
  return [...mockPosts].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addCommunityPost = async (postData: Omit<CommunityPost, 'id' | 'createdAt' | 'userName' | 'userAvatarUrl' | 'likes' | 'commentsCount'>): Promise<CommunityPost> => {
  await delay(400);
  const firebaseUser = auth?.currentUser;
  const newPost: CommunityPost = {
    ...postData,
    id: `post${Date.now()}`,
    userId: firebaseUser?.uid || mockUser.id, // Use real user ID if available
    userName: firebaseUser?.displayName || mockUser.name,
    userAvatarUrl: firebaseUser?.photoURL || mockUser.avatarUrl,
    likes: [],
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  };
  mockPosts.unshift(newPost);
  return newPost;
}

export const likePost = async (postId: string, userId: string): Promise<CommunityPost | undefined> => {
  await delay(100);
  const post = mockPosts.find(p => p.id === postId);
  if (!post) return undefined;
  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(id => id !== userId);
  } else {
    post.likes.push(userId);
  }
  return post;
}

export const getChallenges = async (): Promise<Challenge[]> => {
  await delay(600);
  return mockChallenges;
};

export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  await delay(400);
  return mockBadges.filter(b => b.earnedAt);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  await delay(300);
  const firebaseUser = auth?.currentUser;
  if (firebaseUser && firebaseUser.uid === userId) {
     return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      avatarUrl: firebaseUser.photoURL || mockUser.avatarUrl,
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      timezone: mockUser.timezone,
      preferences: mockUser.preferences
    };
  }
  if (userId === mockUser.id && !firebaseUser) return mockUser;
  return null;
}

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> => {
  await delay(400);
  const firebaseUser = auth?.currentUser;
  if (firebaseUser && firebaseUser.uid === userId) {
    // Example: await updateProfile(firebaseUser, { displayName: data.name, photoURL: data.avatarUrl });
    Object.assign(mockUser, data);
    return { ...mockUser, ...data, id: userId, email: firebaseUser.email || mockUser.email };
  }
  return null;
}

// Mock AI Flow Calls
export const generateAIInsights = async (input: GenerateAIInsightsInput): Promise<GenerateAIInsightsOutput> => {
  return getMockAIInsights(input.habitsData);
};

export const suggestHabitMicroTask = async (input: SuggestHabitMicroTaskInput): Promise<SuggestHabitMicroTaskOutput> => {
  const result = await getMockHabitMicroTask(input.goal, input.times, input.preferences?.difficulty || 'medium');
  return { microTaskSuggestion: result.suggestion };
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  await delay(300);
  return mockNotifications.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  await delay(100);
  const notification = mockNotifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    return true;
  }
  return false;
}
