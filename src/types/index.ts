
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  timezone?: string;
  preferences?: {
    preferredTimes?: string[];
    goalCategories?: string[];
  };
  createdAt: string; // ISO date string
  avatarUrl?: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | string; // string for custom frequency
  progress: Array<{ date: string; completed: boolean }>; // ISO date string
  streak: number;
  createdAt: string; // ISO date string
  color?: string; // Optional color for the habit
  icon?: string; // Optional icon name (from lucide-react)
  aiSuggestedTask?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name (from lucide-react) or SVG path
  earnedAt?: string; // ISO date string
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: string[]; // userIds
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  leaderboard: Array<{ userId: string; score: number; userName: string; avatarUrl?: string }>;
  imageUrl?: string;
  category?: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  content: string;
  habitId?: string; // Optional link to a habit
  likes: string[]; // userIds
  commentsCount: number;
  createdAt: string; // ISO date string
  imageUrl?: string; // Optional image for the post
}

export interface Notification {
  id: string;
  message: string;
  type: 'reminder' | 'milestone' | 'info';
  read: boolean;
  createdAt: string; // ISO date string
  link?: string; // Optional link to navigate to
}
