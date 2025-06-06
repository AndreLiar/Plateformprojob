
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
const googleProvider = new GoogleAuthProvider();
let firebaseSuccessfullyInitialized = false; // Default to false

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appIdFirebase = process.env.NEXT_PUBLIC_FIREBASE_APP_ID; // Renamed to avoid conflict with 'app' variable

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
  // Firebase App ID is also critical for initialization
  canInitialize = false;
  initWarningMessage = 'NEXT_PUBLIC_FIREBASE_APP_ID is missing, not a string, or empty.';
}


if (!canInitialize) {
  console.warn(`Firebase configuration error: ${initWarningMessage} Firebase will not be initialized. Application will run in a degraded mode where Firebase features are unavailable. Please ensure it is correctly set in your environment variables (e.g., in your .env.local file or Firebase Studio project settings).`);
  // firebaseSuccessfullyInitialized remains false
  // app, auth, db remain undefined
} else {
  const firebaseConfig = {
    apiKey: apiKey!.trim(), // Known to be valid string here due to checks above
    authDomain: authDomain!.trim(), // Known to be valid string here
    projectId: projectId!.trim(), // Known to be valid string here
    storageBucket: storageBucket, // This can be undefined or empty if not used
    messagingSenderId: messagingSenderId, // This can be undefined or empty if not used
    appId: appIdFirebase!.trim(), // Known to be valid string here
  };

  try {
    // All critical values for firebaseConfig are validated by `canInitialize` check.
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseSuccessfullyInitialized = true;
    // console.log("Firebase initialized successfully."); // Optional: for confirming success
  } catch (error: any) {
    // This catch is for errors during Firebase SDK's own initialization, e.g. invalid values even if present
    console.warn("Firebase SDK initialization failed:", error.message || error, ". Firebase will not be initialized. App will run in a degraded mode.");
    firebaseSuccessfullyInitialized = false; // Ensure this is explicitly false on any SDK init error
    app = undefined;
    auth = undefined;
    db = undefined;
  }
}

export { app, auth, db, googleProvider, firebaseSuccessfullyInitialized };
