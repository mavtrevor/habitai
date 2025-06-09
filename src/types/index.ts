
export interface UserProfile {
  id: string; // Firebase Auth UID
  name: string;
  email: string; // From Firebase Auth
  timezone?: string;
  preferences?: {
    preferredTimes?: string[];
    goalCategories?: string[];
  };
  createdAt: string; // ISO date string, from Firebase Auth or Firestore
  avatarUrl?: string; // From Firebase Auth or Firestore
  earnedBadgeIds?: string[]; // Array of IDs of earned badges
  lastUpdatedAt?: string; // ISO date string
}

export interface Habit {
  id: string; // Firestore document ID
  userId: string; // Firebase Auth UID
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | string; // string for custom frequency
  progress: Array<{ date: string; completed: boolean }>; // ISO date string
  streak: number;
  createdAt: string; // ISO date string, server timestamp
  color?: string; // Optional color for the habit
  icon?: string; // Optional icon name (from lucide-react)
  aiSuggestedTask?: string;
  lastUpdatedAt?: string; // ISO date string, server timestamp
}

export interface Badge {
  id: string; // Corresponds to an ID in mockBadges or a 'badges' collection
  name: string;
  description: string;
  icon: string; // Icon name (from lucide-react) or SVG path
  earnedAt?: string; // ISO date string - This will be on the UserProfile's earnedBadgeMap or similar
}

export interface Challenge {
  id: string; // Firestore document ID
  creatorId: string; // Firebase Auth UID of the user who created the challenge
  title: string;
  description: string;
  participantIds: string[]; // userIds
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  leaderboardPreview?: Array<{ userId: string; score: number; userName: string; avatarUrl?: string }>;
  imageUrl?: string;
  dataAiHint?: string;
  category?: string;
  createdAt: string; // ISO date string, server timestamp
  lastUpdatedAt?: string; // ISO date string
}

export interface CommunityPost {
  id:string; // Firestore document ID
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  content: string;
  habitId?: string; // Optional link to a habit
  likes: string[]; // userIds who liked the post
  commentsCount: number;
  createdAt: string; // ISO date string, server timestamp
  imageUrl?: string; // Optional image for the post
  dataAiHint?: string;
}

export interface Notification {
  id: string; // Firestore document ID
  userId: string; // To whom this notification belongs
  message: string;
  type: 'reminder' | 'milestone' | 'info' | 'social';
  read: boolean;
  createdAt: string; // ISO date string, server timestamp
  link?: string; // Optional link to navigate to
  relatedEntityId?: string; // e.g., habitId, postId, challengeId
}
