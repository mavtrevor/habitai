
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
  EmailAuthProvider,
  linkWithCredential,
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

export const linkEmailAndPasswordToCurrentUser = async (password: string): Promise<void> => {
  const auth = requireAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No user is currently signed in.");
  }
  if (!user.email) {
    throw new Error("Current user does not have an email address. Cannot link email/password.");
  }

  // Check if user already has a password provider
  const hasPasswordProvider = user.providerData.some(
    (provider) => provider.providerId === EmailAuthProvider.PROVIDER_ID
  );

  if (hasPasswordProvider) {
    throw new Error("An email/password account is already linked. To change password, use password reset flow.");
  }

  const credential = EmailAuthProvider.credential(user.email, password);

  try {
    await linkWithCredential(user, credential);
  } catch (error: any) {
    if (error.code === 'auth/credential-already-in-use') {
      // This error means the email/password combination might already exist as a separate account.
      // Firebase's default behavior for linkWithCredential will try to link,
      // but if the email is verified on another account, it might fail or behave unexpectedly.
      // More robust handling might involve signing in with the credential and then linking the Google account to it,
      // but that's a more complex flow. For now, we'll relay a specific message.
      throw new Error("This email and password combination may already be in use by another account.");
    }
    if (error.code === 'auth/email-already-in-use' && error.message.includes('An account already exists')) {
        // This specific wording from Firebase implies the email is linked to another user,
        // often if the user tried to link a Google account to an existing email/password account
        // where the email was different, or if there's an existing email/password user with that email.
        throw new Error("This email address is already associated with another account. Please use a different method or contact support.");
    }
    throw error; // Re-throw other errors
  }
};
