// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
// import { Firestore, getFirestore } from 'firebase/firestore'; // Uncomment if you use Firestore
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

let app: FirebaseApp;
let auth: Auth;
// let firestore: Firestore;
// let functions: Functions;
// let storage: FirebaseStorage;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // firestore = getFirestore(app);
  // functions = getFunctions(app);
  // storage = getStorage(app);
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
  // firestore = getFirestore(app);
  // functions = getFunctions(app);
  // storage = getStorage(app);
}

// @ts-ignore
export { app, auth /*, firestore, functions, storage */ };
