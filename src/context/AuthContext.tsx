
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth as firebaseAuth, db as firebaseDb, firebaseSuccessfullyInitialized } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from 'firebase/firestore'; 
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  firebaseInitializationError: boolean;
  refreshUserProfile: () => Promise<void>; // Added refresh function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseInitializationError, setFirebaseInitializationError] = useState(!firebaseSuccessfullyInitialized);

  const fetchUserProfile = useCallback(async (currentFirebaseUser: FirebaseUser) => {
    if (!firebaseDb) {
        setUserProfile(null);
        return;
    }
    const userDocRef = doc(firebaseDb, 'users', currentFirebaseUser.uid);
    try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
        } else {
            console.warn(`User profile for ${currentFirebaseUser.uid} not found in Firestore. Setting userProfile to null.`);
            setUserProfile(null);
        }
    } catch (error) {
        console.error("Error fetching user profile in AuthContext:", error);
        setUserProfile(null);
    }
  }, []);


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

    if (firebaseAuth && firebaseDb) { 
      const unsubscribe = firebaseAuth.onAuthStateChanged(async (currentFirebaseUser) => {
        setLoading(true);
        if (currentFirebaseUser) {
          setUser(currentFirebaseUser);
          await fetchUserProfile(currentFirebaseUser);
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
  }, [fetchUserProfile]);


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
  
  const refreshUserProfile = useCallback(async () => {
    if (user) { // user is the FirebaseUser from auth state
      setLoading(true); // Indicate loading
      await fetchUserProfile(user);
      setLoading(false);
    }
  }, [user, fetchUserProfile]);


  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout, firebaseInitializationError, refreshUserProfile }}>
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
