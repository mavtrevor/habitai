
// --- External Imports ---
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

// --- Internal Imports ---
import { requireFirestore, nowISO } from './utils';
import { getUserProfile } from './users';
import { addNotification } from './notifications';
import { mockBadges as staticBadgeDefinitions } from '../mock-data'; // Assuming mock-data is one level up
import type { Badge } from '@/types';

// --- Badge Functions ---
export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  const userProfile = await getUserProfile(userId);
  if (!userProfile || !userProfile.earnedBadgeIds?.length) {
    return [];
  }
  // Map earned badge IDs to full badge definitions
  return userProfile.earnedBadgeIds
    .map(badgeId => {
      const badgeDef = staticBadgeDefinitions.find(b => b.id === badgeId);
      // Add 'earnedAt' - using lastUpdatedAt for simplicity, or could store specific earnedAt timestamps
      return badgeDef ? { ...badgeDef, earnedAt: userProfile.lastUpdatedAt || userProfile.createdAt } : null;
    })
    .filter(Boolean) as Badge[]; // Filter out nulls if a badge ID wasn't found
};

export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
  const db = requireFirestore();
  const userRef = doc(db, `users/${userId}`);
  
  // Add badgeId to user's earnedBadgeIds array
  await updateDoc(userRef, {
    earnedBadgeIds: arrayUnion(badgeId),
    lastUpdatedAt: nowISO(),
  });

  // Add a notification for the earned badge
  const badge = staticBadgeDefinitions.find(b => b.id === badgeId);
  if (badge) {
    await addNotification(userId, {
      message: `Congratulations! You've earned the "${badge.name}" badge!`,
      type: 'milestone',
      link: '/profile?tab=badges', // Link to the badges tab on profile page
      relatedEntityId: badgeId,
    });
  }
};
