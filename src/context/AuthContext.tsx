
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth as firebaseAuth, db as firebaseDb, firebaseSuccessfullyInitialized } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from 'firebase/firestore'; // Added Timestamp
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  firebaseInitializationError: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseInitializationError, setFirebaseInitializationError] = useState(!firebaseSuccessfullyInitialized);

  useEffect(() => {
    if (!firebaseSuccessfullyInitialized) {
      setLoading(false);
      setUser(null);
      setUserProfile(null);
      setFirebaseInitializationError(true);
      console.warn("AuthContext: Firebase not initialized correctly. Auth features will be disabled.");
      return; 
    }
    
    setFirebaseInitializationError(false);

    if (firebaseAuth && firebaseDb) { // Ensure firebaseDb is also checked
      const unsubscribe = firebaseAuth.onAuthStateChanged(async (currentFirebaseUser) => {
        setLoading(true);
        if (currentFirebaseUser) {
          setUser(currentFirebaseUser);
          const userDocRef = doc(firebaseDb, 'users', currentFirebaseUser.uid);
          try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setUserProfile(userDocSnap.data() as UserProfile);
            } else {
              // If profile doesn't exist in Firestore, set userProfile to null.
              // The signup flow (AuthForm) is responsible for creating the initial profile.
              // If an authenticated user has no profile, it's an issue to be handled.
              console.warn(`User profile for ${currentFirebaseUser.uid} not found in Firestore. Setting userProfile to null.`);
              setUserProfile(null);
            }
          } catch (error) {
            console.error("Error fetching user profile in AuthContext:", error);
            setUserProfile(null); // Set to null on error
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
      setUser(null);
      setUserProfile(null);
      setFirebaseInitializationError(true);
      console.warn("AuthContext: Firebase auth or db object is missing. Auth features disabled.");
    }
  }, []);


  const logout = async () => {
    if (!firebaseSuccessfullyInitialized || !firebaseAuth) {
      console.warn("Logout called but Firebase auth is not initialized.");
      setUser(null);
      setUserProfile(null);
      return;
    }
    setLoading(true);
    try {
      await firebaseAuth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // This function is not currently used but kept for potential future use (e.g. admin role setting)
  const fetchSetUserProfile = async (currentFirebaseUser: FirebaseUser, role: 'recruiter' | 'candidate' = 'recruiter') => {
    if (!firebaseSuccessfullyInitialized || !firebaseDb) {
        console.warn("Cannot fetch/set user profile: Firebase DB not initialized.");
        return null;
    }
    const userDocRef = doc(firebaseDb, 'users', currentFirebaseUser.uid);
    let profileData: UserProfile;
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        profileData = userDocSnap.data() as UserProfile;
    } else {
        profileData = {
            uid: currentFirebaseUser.uid,
            email: currentFirebaseUser.email,
            displayName: currentFirebaseUser.displayName,
            role,
            createdAt: serverTimestamp() as Timestamp, // Ensured Timestamp type
        };
        await setDoc(userDocRef, profileData);
    }
    setUserProfile(profileData);
    return profileData;
  };


  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout, firebaseInitializationError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthInternal = (): AuthContextType => { 
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthInternal must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = useAuthInternal;
