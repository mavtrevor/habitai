// This is a mock Firebase service.
// In a real application, you would use the Firebase SDK.
import { mockUser, mockHabits, mockPosts, mockChallenges, mockBadges, mockNotifications, getMockAIInsights, getMockHabitMicroTask } from './mock-data';
import type { UserProfile, Habit, CommunityPost, Challenge, Badge, Notification } from '@/types';
import type { GenerateAIInsightsInput, GenerateAIInsightsOutput } from '@/ai/flows/generate-ai-insights';
import type { SuggestHabitMicroTaskInput, SuggestHabitMicroTaskOutput } from '@/ai/flows/suggest-habit-micro-task';

// Simulate a delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Authentication
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  await delay(300);
  return mockUser;
};

export const signInWithEmail = async (email: string, pass: string): Promise<UserProfile | null> => {
  await delay(500);
  if (email === 'user@example.com' && pass === 'password') return mockUser;
  throw new Error('Invalid credentials');
}

export const signUpWithEmail = async (name:string, email: string, pass: string): Promise<UserProfile | null> => {
  await delay(500);
  if (email === 'new@example.com') {
    return { ...mockUser, email, name, id: 'newUser123' };
  }
  throw new Error('Email already exists');
}

export const signInWithGoogle = async (): Promise<UserProfile | null> => {
  await delay(500);
  return mockUser;
}

export const signInWithApple = async (): Promise<UserProfile | null> => {
  await delay(500);
  return mockUser;
}

export const signOut = async (): Promise<void> => {
  await delay(200);
  return;
}


// Mock Firestore
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
  const progressIndex = habit.progress.findIndex(p => p.date.startsWith(date.substring(0,10))); // Check date part only

  if (progressIndex > -1) {
    habit.progress[progressIndex].completed = completed;
  } else {
    habit.progress.push({ date, completed });
  }
  // Simplified streak calculation
  if (completed) {
    habit.streak +=1;
  } else {
    // More complex streak logic would be needed here for resets.
    // For this mock, if a day is marked incomplete, we might reset streak or just not increment.
    // Let's simplify: if marked incomplete after being complete, streak could decrease or reset.
    // For now, just increment on complete.
  }
  mockHabits[habitIndex] = habit;
  return habit;
};


export const getCommunityPosts = async (): Promise<CommunityPost[]> => {
  await delay(700);
  return [...mockPosts].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addCommunityPost = async (post: Omit<CommunityPost, 'id' | 'createdAt' | 'userName' | 'userAvatarUrl' | 'likes' | 'commentsCount'>): Promise<CommunityPost> => {
  await delay(400);
  const newPost: CommunityPost = {
    ...post,
    id: `post${Date.now()}`,
    userName: mockUser.name,
    userAvatarUrl: mockUser.avatarUrl,
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
  // In a real app, this would check user's achievements
  return mockBadges.filter(b => b.earnedAt); // Only return earned badges
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  await delay(300);
  if (userId === mockUser.id) return mockUser;
  return null;
}

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> => {
  await delay(400);
  if (userId === mockUser.id) {
    Object.assign(mockUser, data);
    return { ...mockUser };
  }
  return null;
}

// Mock AI Flow Calls
export const generateAIInsights = async (input: GenerateAIInsightsInput): Promise<GenerateAIInsightsOutput> => {
  // In a real app, you would call the Genkit flow directly.
  // For now, we use the mock function from mock-data.ts
  return getMockAIInsights(input.habitsData);
};

export const suggestHabitMicroTask = async (input: SuggestHabitMicroTaskInput): Promise<SuggestHabitMicroTaskOutput> => {
  // In a real app, you would call the Genkit flow directly.
  // For now, we use the mock function from mock-data.ts
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
