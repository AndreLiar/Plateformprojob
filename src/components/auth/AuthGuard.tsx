
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'recruiter' | 'candidate'>;
}

export default function AuthGuard({ children, allowedRoles = ['recruiter'] }: AuthGuardProps) {
  const { user, userProfile, loading, firebaseInitializationError, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (firebaseInitializationError) {
      return;
    }

    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user && !userProfile) {
        // User is authenticated, but profile is not loaded/found in Firestore.
        toast({ 
          variant: "destructive", 
          title: "Profile Issue", 
          description: "Your user profile could not be loaded. You will be logged out. Please try signing up or logging in again." 
        });
        // Logout the user as their state is inconsistent.
        // Wrap in a try-catch if logout can throw, though current implementation doesn't.
        const performLogout = async () => {
          await logout();
          router.replace('/login'); // Send to login after logout
        };
        performLogout();
      } else if (userProfile && !allowedRoles.includes(userProfile.role)) {
        toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page." });
        router.replace('/');
      }
    }
  }, [user, userProfile, loading, router, allowedRoles, firebaseInitializationError, toast, logout]);

  if (firebaseInitializationError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen p-4 text-center">
        <h2 className="text-2xl font-semibold text-destructive mb-4">Authentication Unavailable</h2>
        <p className="text-muted-foreground">
          Firebase is not configured correctly. Please check the environment variables.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          (e.g., NEXT_PUBLIC_FIREBASE_API_KEY)
        </p>
      </div>
    );
  }

  // Show loader if still loading, or if user is not yet available (and no firebase error)
  // This state will persist until useEffect can redirect or confirm access.
  if (loading || (!user && !firebaseInitializationError)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // At this point, loading is false, and user is supposedly available.
  // The useEffect handles redirects for:
  // 1. No user -> /login
  // 2. User but no profile -> logout then /login
  // 3. Profile but role mismatch -> /
  // If none of the above, then access is granted.
  if (user && userProfile && allowedRoles.includes(userProfile.role)) {
    return <>{children}</>;
  }

  // Fallback: Show loader while useEffect processes and redirects.
  // This covers the brief period where conditions for rendering children are not yet met,
  // but a redirect is imminent.
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
