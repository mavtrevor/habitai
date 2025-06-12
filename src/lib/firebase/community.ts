
// --- External Imports ---
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc as firebaseDeleteDoc,
  query,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  writeBatch,
  increment
} from 'firebase/firestore';

// --- Internal Imports ---
import { requireAuth, requireFirestore, nowISO } from './utils';
import { getUserProfile } from './users';
import type { CommunityPost, Comment } from '@/types';

// --- Community Post Functions ---
export const getCommunityPosts = async (
  // lastVisiblePost?: CommunityPost, // Placeholder for pagination
  count = 10
): Promise<CommunityPost[]> => {
  const db = requireFirestore();
  const postsFbCollection = collection(db, 'posts');
  // TODO: Implement pagination using lastVisiblePost if provided
  const q = query(postsFbCollection, orderBy('createdAt', 'desc'), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as CommunityPost));
};

export const addCommunityPost = async (
  postData: Omit<CommunityPost, 'id' | 'createdAt' | 'userName' | 'userAvatarUrl' | 'likes' | 'commentsCount' | 'userId'>
): Promise<CommunityPost> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const userProfile = await getUserProfile(user.uid); // Fetch user profile
  if (!userProfile) throw new Error('User profile not found');

  const now = nowISO();
  const newPostPayload = {
    ...postData,
    userId: user.uid,
    userName: userProfile.name, // Use name from profile
    userAvatarUrl: userProfile.avatarUrl || '', // Use avatar from profile
    likes: [],
    commentsCount: 0,
    createdAt: now,
  };
  const postsFbCollection = collection(db, 'posts');
  const docRef = await addDoc(postsFbCollection, newPostPayload);
  return { id: docRef.id, ...newPostPayload };
};

export const likePost = async (postId: string, userIdToToggle: string): Promise<CommunityPost | undefined> => {
  const db = requireFirestore();
  const postRef = doc(db, `posts/${postId}`);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return undefined;

  const postData = postSnap.data() as CommunityPost;
  let newLikesArray: string[];

  if (postData.likes.includes(userIdToToggle)) {
    newLikesArray = postData.likes.filter(id => id !== userIdToToggle);
    await updateDoc(postRef, { likes: arrayRemove(userIdToToggle), lastUpdatedAt: nowISO() });
  } else {
    newLikesArray = [...postData.likes, userIdToToggle];
    await updateDoc(postRef, { likes: arrayUnion(userIdToToggle), lastUpdatedAt: nowISO() });
  }
  return { ...postData, id: postId, likes: newLikesArray }; // Return optimistic update
};

export const deletePost = async (postId: string): Promise<void> => {
  const db = requireFirestore();
  // TODO: Add rule to ensure only post owner can delete
  // Consider deleting subcollections like comments if done client-side or use a Firebase Function
  const postRef = doc(db, 'posts', postId);
  await firebaseDeleteDoc(postRef);
};


// --- Comment Functions ---
export const addComment = async (
  postId: string,
  commentContent: string
): Promise<Comment> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated to add comment");

  const userProfile = await getUserProfile(user.uid);
  if (!userProfile) throw new Error("User profile not found for comment author");

  const now = nowISO();
  const newCommentPayload: Omit<Comment, 'id'> = {
    postId,
    userId: user.uid,
    userName: userProfile.name,
    userAvatarUrl: userProfile.avatarUrl || '',
    content: commentContent,
    createdAt: now,
  };

  const postRef = doc(db, 'posts', postId);
  const commentsRef = collection(postRef, 'comments');
  
  const batch = writeBatch(db);
  const commentDocRef = doc(commentsRef); // Create a new doc ref for the comment
  batch.set(commentDocRef, newCommentPayload);
  batch.update(postRef, { commentsCount: increment(1), lastUpdatedAt: nowISO() });

  await batch.commit();
  return { id: commentDocRef.id, ...newCommentPayload };
};

export const getCommentsForPost = async (postId: string): Promise<Comment[]> => {
  const db = requireFirestore();
  const commentsRef = collection(db, 'posts', postId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc')); // Oldest comments first
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as Comment));
};

export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  const db = requireFirestore();
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated to delete comment");

  const postRef = doc(db, 'posts', postId);
  const commentRef = doc(postRef, 'comments', commentId);

  // Optional: Check if user is owner of comment before deleting
  // const commentSnap = await getDoc(commentRef);
  // if (commentSnap.exists() && commentSnap.data().userId !== user.uid) {
  //   throw new Error("User not authorized to delete this comment");
  // }

  const batch = writeBatch(db);
  batch.delete(commentRef);
  batch.update(postRef, { commentsCount: increment(-1), lastUpdatedAt: nowISO() });
  
  await batch.commit();
};
