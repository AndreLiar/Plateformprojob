"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          // Create new user profile if it doesn't exist (e.g. first social login)
          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'recruiter', // Default role
            createdAt: serverTimestamp() as any, // Will be converted by Firestore
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
  }, []);

  const logout = async () => {
    setLoading(true);
    await auth.signOut();
    setUser(null);
    setUserProfile(null);
    setLoading(false);
  };
  
  // Function to explicitly set user profile after signup to ensure role is set immediately
  const fetchSetUserProfile = async (firebaseUser: FirebaseUser, role: 'recruiter' | 'candidate' = 'recruiter') => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let profileData: UserProfile;
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        profileData = userDocSnap.data() as UserProfile;
    } else {
        profileData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role,
            createdAt: serverTimestamp() as any,
        };
        await setDoc(userDocRef, profileData);
    }
    setUserProfile(profileData);
    return profileData;
  };


  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
