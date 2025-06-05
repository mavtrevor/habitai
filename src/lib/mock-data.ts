
import type { UserProfile, Badge } from '@/types';

// --- User (Structure Reference / Default for new profiles) ---
export const mockUser: UserProfile = {
  id: 'user123', // This will be replaced by Firebase Auth UID
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  timezone: 'America/New_York',
  preferences: {
    preferredTimes: ['morning', 'evening'],
    goalCategories: ['fitness', 'productivity'],
  },
  createdAt: new Date().toISOString(),
  avatarUrl: 'https://placehold.co/100x100.png',
  earnedBadgeIds: [], // Example: ['badge1', 'badge3']
};

// --- Static Badge Definitions ---
// These define the types of badges available in the system.
// Earned badges for a user will be stored as an array of IDs in their Firestore profile.
export const mockBadges: Badge[] = [
  { id: 'badge1', name: '7-Day Streak', description: 'Completed a habit for 7 days in a row.', icon: 'Award' },
  { id: 'badge2', name: 'Early Bird', description: 'Completed a morning habit 5 times.', icon: 'Sunrise' },
  { id: 'badge3', name: 'Perfect Week', description: 'Completed all daily habits for a week.', icon: 'CheckCircle2'},
  { id: 'badge4', name: 'Hydration Hero', description: 'Drank 8 glasses of water daily for 5 days.', icon: 'CupSoda' },
  { id: 'badge5', name: 'First Post', description: 'Shared your first post in the community.', icon: 'Send' },
  { id: 'badge6', name: 'Challenge Starter', description: 'Joined your first challenge.', icon: 'Trophy' },
  { id: 'badge7', name: 'Month of Consistency', description: 'Maintained a daily habit for 30 days.', icon: 'CalendarCheck' },
  { id: 'badge8', name: 'AI Powered', description: 'Used an AI suggestion to complete a task.', icon: 'Wand2' },
];

// All other dynamic mock data (habits, posts, challenges, notifications)
// and their manipulation functions (localStorage logic etc.) are removed.
// Data will now be handled by Firebase Firestore.
