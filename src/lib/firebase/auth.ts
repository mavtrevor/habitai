
// --- External Imports ---
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseAuthUser,
} from 'firebase/auth';

// --- Internal Imports ---
import { requireAuth } from './utils';
import { createUserProfileDocument, getUserProfile } from './users'; // For profile creation post-auth

// --- Auth Functions ---
export const signInWithEmail = async (email: string, pass: string): Promise<FirebaseAuthUser> => {
  const auth = requireAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  // Ensure profile exists or is created on sign-in, especially if it might not have been created during signup
  // This call also serves to fetch and potentially cache profile data if needed by other parts of app immediately after login
  await getUserProfile(userCredential.user.uid); 
  return userCredential.user;
};

export const signUpWithEmail = async (name: string, email: string, pass: string): Promise<FirebaseAuthUser> => {
  const auth = requireAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // Update Firebase Auth profile
  await firebaseUpdateProfile(user, { displayName: name });
  // Create Firestore user profile document
  await createUserProfileDocument(user, { name });
  // Send verification email
  await firebaseSendEmailVerification(user);
  // Sign out the user immediately after signup to force email verification before first login
  await firebaseSignOut(auth); 
  
  return user;
};

export const signInWithGoogle = async (): Promise<FirebaseAuthUser> => {
  const auth = requireAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  // Ensure profile document is created/updated on Google sign-in
  await createUserProfileDocument(result.user);
  return result.user;
};

export const signOut = async (): Promise<void> => {
  const auth = requireAuth();
  await firebaseSignOut(auth);
};

export const sendEmailVerification = async (user: FirebaseAuthUser): Promise<void> => {
  if (!user) throw new Error('User object required for sending verification email.');
  await firebaseSendEmailVerification(user);
};
