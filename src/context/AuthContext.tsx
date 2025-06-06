
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth as firebaseAuth, db as firebaseDb, firebaseSuccessfullyInitialized, googleProvider } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
      console.error("AuthContext: Firebase not initialized correctly. Auth features will be disabled.");
      return; 
    }
    
    setFirebaseInitializationError(false);

    if (firebaseAuth) {
      const unsubscribe = firebaseAuth.onAuthStateChanged(async (currentFirebaseUser) => {
        setLoading(true);
        if (currentFirebaseUser) {
          setUser(currentFirebaseUser);
          const userDocRef = doc(firebaseDb!, 'users', currentFirebaseUser.uid); // firebaseDb should be defined if firebaseSuccessfullyInitialized is true
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          } else {
            const newUserProfile: UserProfile = {
              uid: currentFirebaseUser.uid,
              email: currentFirebaseUser.email,
              displayName: currentFirebaseUser.displayName,
              role: 'recruiter', 
              createdAt: serverTimestamp() as any,
            };
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Fallback if firebaseAuth is somehow null despite firebaseSuccessfullyInitialized being true
      setLoading(false);
      setUser(null);
      setUserProfile(null);
      setFirebaseInitializationError(true); // Mark as error if auth object is missing
      console.error("AuthContext: Firebase auth object is missing even after successful initialization flag. Auth features disabled.");
    }
  }, []);


  const logout = async () => {
    if (!firebaseSuccessfullyInitialized || !firebaseAuth) {
      console.warn("Logout called but Firebase auth is not initialized.");
      setUser(null);
      setUserProfile(null);
      return;
    }
    setLoading(true); // Ensure loading state is managed during logout
    try {
      await firebaseAuth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error during logout:", error);
      // Optionally, inform the user about the logout error
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSetUserProfile = async (currentFirebaseUser: FirebaseUser, role: 'recruiter' | 'candidate' = 'recruiter') => {
    if (!firebaseSuccessfullyInitialized || !firebaseDb) {
        console.error("Cannot fetch/set user profile: Firebase DB not initialized.");
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
            createdAt: serverTimestamp() as any,
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

// useAuth hook remains the same as it's defined in a separate file (src/hooks/useAuth.ts)
// and just re-exports this context's consumer.
export const useAuthInternal = (): AuthContextType => { // Renamed to avoid conflict if useAuth is imported elsewhere
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthInternal must be used within an AuthProvider');
  }
  return context;
};

