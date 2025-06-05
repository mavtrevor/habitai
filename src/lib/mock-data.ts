
import type { UserProfile, Habit, CommunityPost, Challenge, Badge, Notification } from '@/types';

// --- User ---
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

// --- Habits (with localStorage persistence) ---
const DEFAULT_HABITS: Habit[] = [
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
    streak: 2,
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
       { date: new Date(Date.now() - 86400000 * 6).toISOString(), completed: true },
       { date: new Date(Date.now() - 86400000 * 4).toISOString(), completed: true },
       { date: new Date(Date.now() - 86400000 * 2).toISOString(), completed: true },
    ],
    streak: 3,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    color: 'green',
    icon: 'Zap',
    aiSuggestedTask: "Try a new running route around the park today."
  },
];

const MOCK_HABITS_KEY = 'mockHabits_HabitAI_v1'; // Added a version to key to avoid conflicts with old data

const getHabitsFromLocalStorage = (): Habit[] => {
  if (typeof window !== 'undefined') {
    const storedHabits = localStorage.getItem(MOCK_HABITS_KEY);
    if (storedHabits) {
      try {
        return JSON.parse(storedHabits);
      } catch (e) {
        console.error("Error parsing habits from localStorage", e);
        localStorage.setItem(MOCK_HABITS_KEY, JSON.stringify(DEFAULT_HABITS));
        return [...DEFAULT_HABITS];
      }
    } else {
      localStorage.setItem(MOCK_HABITS_KEY, JSON.stringify(DEFAULT_HABITS));
      return [...DEFAULT_HABITS];
    }
  }
  return [...DEFAULT_HABITS]; // Return a copy for SSR or if window is not defined
};

const saveHabitsToLocalStorage = (habits: Habit[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_HABITS_KEY, JSON.stringify(habits));
  }
};

export const getMockHabits = (): Habit[] => {
  return getHabitsFromLocalStorage();
};

export const addMockHabit = (newHabitData: Omit<Habit, 'id' | 'createdAt' | 'progress' | 'streak' | 'userId'>): Habit => {
  const currentHabits = getHabitsFromLocalStorage();
  const newHabitEntry: Habit = {
    ...newHabitData,
    id: `habit${Date.now()}`,
    createdAt: new Date().toISOString(),
    progress: [],
    streak: 0,
    userId: 'user123' // Assuming mock user
  };
  const updatedHabits = [...currentHabits, newHabitEntry];
  saveHabitsToLocalStorage(updatedHabits);
  return newHabitEntry;
};

export const updateMockHabitProgressData = (habitId: string, date: string, completed: boolean): Habit | undefined => {
    const habits = getHabitsFromLocalStorage();
    const habitIndex = habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return undefined;

    const habit = { ...habits[habitIndex] }; // Work with a copy
    habit.progress = [...habit.progress]; // Copy progress array

    const todayISOStart = date.substring(0,10);
    const progressIndex = habit.progress.findIndex(p => p.date.startsWith(todayISOStart));

    if (progressIndex > -1) {
        habit.progress[progressIndex] = { ...habit.progress[progressIndex], completed };
    } else {
        habit.progress.push({ date, completed });
    }
    
    // Simplified streak logic: if completed today, increment. If marked not completed (or never completed today), it would reset or pause.
    // For this mock, we will only increment if 'completed' is true for *today*.
    // A real streak calculation would need to check consecutive days.
    const todayProgressEntry = habit.progress.find(p => p.date.startsWith(new Date().toISOString().slice(0,10)));
    if (todayProgressEntry?.completed) {
      // This simplistic streak update assumes this function is only called for *today's* progress.
      // And that if it was previously not complete and now is, streak increases.
      // A more robust version would check the *previous* day's status.
      // For now, if *any* 'completed:true' is set for today, it potentially increments.
      // Let's refine: streak only changes if *this specific action* marks today as complete when it wasn't.
      const oldCompletedStatus = habits[habitIndex].progress.find(p=>p.date.startsWith(todayISOStart))?.completed ?? false;
      if(completed && !oldCompletedStatus) {
        habit.streak = (habit.streak || 0) + 1;
      } else if (!completed && oldCompletedStatus) {
        // If un-marking as complete, streak should decrease or reset if it was based on this day.
        // This part is tricky for a simple mock. For now, let's say unmarking resets current day's contribution.
        // If this was the only day contributing to the streak, it would decrease.
        // To keep it simple for mock: if we uncheck, and streak was > 0, decrement.
        if (habit.streak > 0) habit.streak -=1;
      }

    } else if (!completed) {
       // If marking explicitly not complete for today, and a streak existed based on today.
       const oldCompletedStatus = habits[habitIndex].progress.find(p=>p.date.startsWith(todayISOStart))?.completed ?? false;
       if(oldCompletedStatus && habit.streak > 0) {
         habit.streak -= 1;
       }
    }


    habits[habitIndex] = habit;
    saveHabitsToLocalStorage(habits);
    return habit;
};


// --- Other Mock Data (remains in-memory for now unless specified otherwise) ---
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
  await new Promise(resolve => setTimeout(resolve, 1000)); 
  if (habitsData.includes("water")) {
    return { insights: "You're doing great with hydration! Keep it up. Try adding a slice of lemon for a change." };
  }
  if (habitsData.length > 100 && habitsData.length < 300) { // Adjusted length check
    return { insights: "Consistency is key! You've been active on multiple habits. Consider focusing on one area for even better results this week." };
  }
  return { insights: "You're making good progress. Remember to celebrate small wins! Consider setting a new micro-goal for your toughest habit." };
};

// Mock API call for Habit Micro-Task Suggestion
export const getMockHabitMicroTask = async (goal: string, times: string[], difficulty: string): Promise<{ suggestion: string }> => {
  await new Promise(resolve => setTimeout(resolve, 800)); 
  const timeSuggestion = times.length > 0 ? times.join(", ") : "your preferred time";
  return { suggestion: `For your goal "${goal}", try this ${difficulty} task: Take a 10-minute walk ${times.includes("evening") || timeSuggestion.includes("evening") ? "this evening" : `during ${timeSuggestion}`} to clear your head.` };
};
