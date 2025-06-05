import type { UserProfile, Habit, CommunityPost, Challenge, Badge, Notification } from '@/types';

export const mockUser: UserProfile = {
  id: 'user123',
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  timezone: 'America/New_York',
  preferences: {
    preferredTimes: ['morning', 'evening'],
    goalCategories: ['fitness', 'productivity'],
  },
  createdAt: new Date().toISOString(),
  avatarUrl: 'https://placehold.co/100x100.png',
};

export const mockHabits: Habit[] = [
  {
    id: 'habit1',
    userId: 'user123',
    title: 'Drink 8 glasses of water',
    description: 'Stay hydrated throughout the day.',
    frequency: 'daily',
    progress: [
      { date: new Date(Date.now() - 86400000 * 2).toISOString(), completed: true },
      { date: new Date(Date.now() - 86400000).toISOString(), completed: true },
      { date: new Date().toISOString(), completed: false },
    ],
    streak: 2,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    color: 'blue',
    icon: 'Droplet',
    aiSuggestedTask: "Have a glass of water first thing in the morning."
  },
  {
    id: 'habit2',
    userId: 'user123',
    title: 'Read for 30 minutes',
    description: 'Expand knowledge and relax.',
    frequency: 'daily',
    progress: [
      { date: new Date(Date.now() - 86400000 * 3).toISOString(), completed: true },
      { date: new Date(Date.now() - 86400000 * 2).toISOString(), completed: false },
      { date: new Date(Date.now() - 86400000).toISOString(), completed: true },
      { date: new Date().toISOString(), completed: true },
    ],
    streak: 2, // Streak reset due to missed day, then 2 consecutive days
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    color: 'purple',
    icon: 'BookOpen',
    aiSuggestedTask: "Read a chapter of 'Atomic Habits' before bed."
  },
  {
    id: 'habit3',
    userId: 'user123',
    title: 'Morning Run',
    description: 'Energize the day with a 3km run.',
    frequency: '3 times a week',
    progress: [
       { date: new Date(Date.now() - 86400000 * 6).toISOString(), completed: true }, // Monday
       { date: new Date(Date.now() - 86400000 * 4).toISOString(), completed: true }, // Wednesday
       { date: new Date(Date.now() - 86400000 * 2).toISOString(), completed: true }, // Friday
    ],
    streak: 3,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    color: 'green',
    icon: 'Zap',
    aiSuggestedTask: "Try a new running route around the park today."
  },
];

export const mockBadges: Badge[] = [
  { id: 'badge1', name: '7-Day Streak', description: 'Completed a habit for 7 days in a row.', icon: 'Award', earnedAt: new Date().toISOString() },
  { id: 'badge2', name: 'Early Bird', description: 'Completed a morning habit 5 times.', icon: 'Sunrise' },
  { id: 'badge3', name: 'Perfect Week', description: 'Completed all daily habits for a week.', icon: 'CheckCircle2', earnedAt: new Date(Date.now() - 86400000 * 3).toISOString()},
  { id: 'badge4', name: 'Hydration Hero', description: 'Drank 8 glasses of water daily for 5 days.', icon: 'CupSoda' },
];

export const mockChallenges: Challenge[] = [
  {
    id: 'challenge1',
    title: '30-Day Meditation Challenge',
    description: 'Meditate for at least 10 minutes daily for 30 days.',
    participants: ['user123', 'user456', 'user789'],
    startDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 25).toISOString(),
    leaderboard: [
      { userId: 'user456', score: 5, userName: 'Jane Smith', avatarUrl: 'https://placehold.co/50x50.png?text=JS' },
      { userId: 'user123', score: 4, userName: 'Alex Doe', avatarUrl: 'https://placehold.co/50x50.png?text=AD' },
      { userId: 'user789', score: 3, userName: 'Chris Lee', avatarUrl: 'https://placehold.co/50x50.png?text=CL' },
    ],
    imageUrl: 'https://placehold.co/600x300.png',
    dataAiHint: 'meditation nature',
    category: 'Wellness'
  },
  {
    id: 'challenge2',
    title: '10k Steps a Day',
    description: 'Achieve 10,000 steps every day for a month.',
    participants: ['user123', 'userABC'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    leaderboard: [],
    imageUrl: 'https://placehold.co/600x300.png',
    dataAiHint: 'running shoes',
    category: 'Fitness'
  },
];

export const mockPosts: CommunityPost[] = [
  {
    id: 'post1',
    userId: 'user456',
    userName: 'Jane Smith',
    userAvatarUrl: 'https://placehold.co/50x50.png?text=JS',
    content: 'Just finished day 5 of the meditation challenge! Feeling so much calmer already. #meditation #wellness',
    likes: ['user123', 'user789'],
    commentsCount: 2,
    createdAt: new Date(Date.now() - 86400000 / 2).toISOString(),
    imageUrl: 'https://placehold.co/400x200.png',
    dataAiHint: 'yoga sunset'
  },
  {
    id: 'post2',
    userId: 'user123',
    userName: 'Alex Doe',
    userAvatarUrl: mockUser.avatarUrl,
    content: 'Struggling to hit my water intake goal today. Any tips for remembering to drink more water?',
    habitId: 'habit1',
    likes: ['userABC'],
    commentsCount: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'post3',
    userId: 'user789',
    userName: 'Chris Lee',
    userAvatarUrl: 'https://placehold.co/50x50.png?text=CL',
    content: 'Excited to start the 10k steps challenge! Let\'s do this! 🏃‍♂️',
    likes: ['user123', 'user456', 'userABC'],
    commentsCount: 1,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockNotifications: Notification[] = [
  { id: 'notif1', message: 'Reminder: Time for your 30-minute read!', type: 'reminder', read: false, createdAt: new Date().toISOString(), link: '/habits/habit2' },
  { id: 'notif2', message: 'Congratulations! You earned the "7-Day Streak" badge!', type: 'milestone', read: true, createdAt: new Date(Date.now() - 8640000).toISOString(), link: '/profile?tab=badges' },
  { id: 'notif3', message: 'The "10k Steps a Day" challenge has just started!', type: 'info', read: false, createdAt: new Date(Date.now() - 3600000).toISOString(), link: '/community?tab=challenges' },
];

// Mock API call for AI Insights
export const getMockAIInsights = async (habitsData: string): Promise<{ insights: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  // Basic logic based on habitsData string length or keywords for variety.
  if (habitsData.includes("water")) {
    return { insights: "You're doing great with hydration! Keep it up. Try adding a slice of lemon for a change." };
  }
  if (habitsData.length > 100) {
    return { insights: "Consistency is key! You've been active on multiple habits. Consider focusing on one area for even better results this week." };
  }
  return { insights: "You're making good progress. Remember to celebrate small wins! Consider setting a new micro-goal for your toughest habit." };
};

// Mock API call for Habit Micro-Task Suggestion
export const getMockHabitMicroTask = async (goal: string, times: string[], difficulty: string): Promise<{ suggestion: string }> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
  return { suggestion: `For your goal "${goal}", try this ${difficulty} task: Take a 10-minute walk ${times.includes("evening") ? "this evening" : "during your next break"} to clear your head.` };
};
