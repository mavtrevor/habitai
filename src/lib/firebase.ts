
// This file now serves as the main barrel export for all Firebase-related functions.

export * from './firebase/utils';
export * from './firebase/client'; // Keep client export for direct use if needed (e.g. getAuth instance)
export * from './firebase/auth';
export * from './firebase/users';
export * from './firebase/habits';
export * from './firebase/community';
export * from './firebase/challenges';
export * from './firebase/badges';
export * from './firebase/notifications';
export * from './firebase/ai';

// Also re-export mock data if it was previously accessed via firebase.ts
// However, it's better to import mock data directly from '@/lib/mock-data'
// For now, I'll assume it's imported directly where needed.
// export * from './mock-data'; // Example, if needed.

// Re-export specific types if they were conventionally exported from here,
// though generally types are imported directly from '@/types'.
// export type { UserProfile, Habit, Badge, Challenge, CommunityPost, Notification } from '@/types';
