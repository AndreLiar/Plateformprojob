
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth'; // Removed GoogleAuthProvider
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
// const googleProvider = new GoogleAuthProvider(); // Removed GoogleAuthProvider initialization
let firebaseSuccessfullyInitialized = false; // Default to false

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appIdFirebase = process.env.NEXT_PUBLIC_FIREBASE_APP_ID; 

let canInitialize = true;
let initWarningMessage = '';

// Check for critical environment variables
if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
  canInitialize = false;
  initWarningMessage = 'NEXT_PUBLIC_FIREBASE_API_KEY is missing, not a string, or empty.';
} else if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
  canInitialize = false;
  initWarningMessage = 'NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing, not a string, or empty.';
} else if (!authDomain || typeof authDomain !== 'string' || authDomain.trim() === '') {
  canInitialize = false;
  initWarningMessage = 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing, not a string, or empty.';
} else if (!appIdFirebase || typeof appIdFirebase !== 'string' || appIdFirebase.trim() === '') {
  canInitialize = false;
  initWarningMessage = 'NEXT_PUBLIC_FIREBASE_APP_ID is missing, not a string, or empty.';
}


if (!canInitialize) {
  console.warn(`Firebase configuration error: ${initWarningMessage} Firebase will not be initialized. Application will run in a degraded mode where Firebase features are unavailable. Please ensure it is correctly set in your environment variables (e.g., in your .env.local file or Firebase Studio project settings).`);
  // firebaseSuccessfullyInitialized remains false
  // app, auth, db remain undefined
} else {
  const firebaseConfig = {
    apiKey: apiKey!.trim(), 
    authDomain: authDomain!.trim(), 
    projectId: projectId!.trim(), 
    storageBucket: storageBucket, 
    messagingSenderId: messagingSenderId, 
    appId: appIdFirebase!.trim(), 
  };

  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseSuccessfullyInitialized = true;
  } catch (error: any) {
    console.warn("Firebase SDK initialization failed:", error.message || error, ". Firebase will not be initialized. App will run in a degraded mode.");
    firebaseSuccessfullyInitialized = false; 
    app = undefined;
    auth = undefined;
    db = undefined;
  }
}

export { app, auth, db, firebaseSuccessfullyInitialized }; // Removed googleProvider from exports
