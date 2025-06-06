import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
  throw new Error(
    'Firebase configuration error: NEXT_PUBLIC_FIREBASE_API_KEY is missing, not a string, or empty. ' +
    'Please ensure it is correctly set in your environment variables (e.g., in your .env.local file or Firebase Studio project settings).'
  );
}

// Ensure other critical environment variables are also present and valid
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
  throw new Error(
    'Firebase configuration error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing, not a string, or empty. ' +
    'Please ensure it is correctly set in your environment variables.'
  );
}

const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
if (!authDomain || typeof authDomain !== 'string' || authDomain.trim() === '') {
  throw new Error(
    'Firebase configuration error: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing, not a string, or empty. ' +
    'Please ensure it is correctly set in your environment variables.'
  );
}


const firebaseConfig = {
  apiKey: apiKey.trim(), // Use the validated and trimmed apiKey
  authDomain: authDomain.trim(),
  projectId: projectId.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
