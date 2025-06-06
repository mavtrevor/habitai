
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { type Auth, getAuth as getFirebaseAuthInstance } from 'firebase/auth';
import { type Firestore, getFirestore as getFirebaseFirestoreInstance } from 'firebase/firestore';
// import { Functions, getFunctions } from 'firebase/functions'; // Uncomment if you use Functions
// import { FirebaseStorage, getStorage } from 'firebase/storage'; // Uncomment if you use Storage

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let appInstance: FirebaseApp;

function getFirebaseApp(): FirebaseApp {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      appInstance = initializeApp(firebaseConfig);
    } else {
      appInstance = getApp();
    }
    return appInstance;
  }
  // Fallback for server-side, though client SDK primarily for client
  // This might need adjustment based on server-side auth patterns if used
  if (!getApps().length) {
    // console.warn("Initializing Firebase App on server. Ensure this is intended.");
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

function getAuth(): Auth {
  return getFirebaseAuthInstance(getFirebaseApp());
}

function getFirestore(): Firestore {
  return getFirebaseFirestoreInstance(getFirebaseApp());
}

// let functions: Functions;
// let storage: FirebaseStorage;
// if (typeof window !== 'undefined') {
//   functions = getFunctions(getFirebaseApp());
//   storage = getStorage(getFirebaseApp());
// }


export { getFirebaseApp, getAuth, getFirestore /*, functions, storage */ };
