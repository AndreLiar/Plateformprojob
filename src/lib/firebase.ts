
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
const googleProvider = new GoogleAuthProvider(); // This can be initialized regardless
let firebaseSuccessfullyInitialized = false;

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appIdFirebase = process.env.NEXT_PUBLIC_FIREBASE_APP_ID; // Renamed to avoid conflict with 'app' variable

let canInitialize = true;
let errorMessage = '';

if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
  canInitialize = false;
  errorMessage = 'Firebase configuration error: NEXT_PUBLIC_FIREBASE_API_KEY is missing, not a string, or empty.';
} else if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
  canInitialize = false;
  errorMessage = 'Firebase configuration error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing, not a string, or empty.';
} else if (!authDomain || typeof authDomain !== 'string' || authDomain.trim() === '') {
  canInitialize = false;
  errorMessage = 'Firebase configuration error: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing, not a string, or empty.';
}
// Add other critical checks if necessary

if (!canInitialize) {
  console.error(errorMessage + ' Please ensure it is correctly set in your environment variables. Firebase will not be initialized.');
} else {
  const firebaseConfig = {
    apiKey: apiKey!.trim(),
    authDomain: authDomain!.trim(),
    projectId: projectId!.trim(),
    storageBucket: storageBucket,
    messagingSenderId: messagingSenderId,
    appId: appIdFirebase,
  };

  try {
    // Check if all essential config values are present for initializeApp
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
        throw new Error("One or more critical Firebase config values (apiKey, authDomain, projectId, appId) are missing for initialization.");
    }
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseSuccessfullyInitialized = true;
    console.log("Firebase initialized successfully.");
  } catch (error: any) {
    console.error("Firebase initialization failed:", error.message || error);
    // firebaseSuccessfullyInitialized remains false
    app = undefined;
    auth = undefined;
    db = undefined;
  }
}

export { app, auth, db, googleProvider, firebaseSuccessfullyInitialized };
