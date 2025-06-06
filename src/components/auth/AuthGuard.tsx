
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; // Added useState
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'recruiter' | 'candidate'>;
}

export default function AuthGuard({ children, allowedRoles = ['recruiter'] }: AuthGuardProps) {
  const { user, userProfile, loading: authLoading, firebaseInitializationError, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Reset redirecting state if authLoading or firebaseInitializationError changes,
    // or if user/userProfile changes significantly (e.g., logout)
    setIsRedirecting(false);

    if (firebaseInitializationError || authLoading) {
      // Still waiting for Firebase to init or auth state to load
      return;
    }

    if (!user) {
      // No user, definitely redirect to login
      router.replace('/login');
      setIsRedirecting(true);
      return;
    }

    // User is authenticated, check profile
    if (!userProfile) {
      // User is authenticated, but profile is not loaded/found in Firestore.
      // This could be a transient state if authLoading just turned false,
      // but if it persists, it's an issue.
      toast({
        variant: "destructive",
        title: "Profile Issue",
        description: "Your user profile could not be loaded. Logging out."
      });
      const performLogout = async () => {
        await logout();
        // No explicit redirect here, relying on auth state change to trigger the !user block
      };
      performLogout();
      setIsRedirecting(true); // Indicate redirection is happening due to logout
      return;
    }

    // User and userProfile are available, and authLoading is false.
    if (typeof userProfile.role === 'undefined') {
      toast({
        variant: "destructive",
        title: "Profile Issue",
        description: "User role is not defined. Logging out."
      });
      const performLogout = async () => {
        await logout();
      };
      performLogout();
      setIsRedirecting(true);
      return;
    }

    if (typeof userProfile.role === 'string' && !allowedRoles.includes(userProfile.role)) {
      const actualRole = userProfile.role;
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: `Redirecting... Your role: '${actualRole}'. Required: '${allowedRoles.join("', '")}'.`
      });

      if (actualRole === 'candidate') {
        router.replace('/dashboard/candidate/profile');
      } else if (actualRole === 'recruiter') {
        router.replace('/dashboard');
      } else {
        router.replace('/');
      }
      setIsRedirecting(true);
      return;
    }

    // If all checks pass and no redirect was needed, ensure isRedirecting is false.
    // This is mostly handled by the reset at the beginning of useEffect.

  }, [user, userProfile, authLoading, router, allowedRoles, firebaseInitializationError, toast, logout]);

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

  // Show loader if auth is loading OR if the guard has initiated a redirect.
  if (authLoading || isRedirecting) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated, profile is loaded, role is correct, and not redirecting:
  if (user && userProfile && typeof userProfile.role === 'string' && allowedRoles.includes(userProfile.role)) {
    return <>{children}</>;
  }

  // Fallback loader if conditions for rendering children are not met AND
  // not covered by authLoading or isRedirecting.
  // This indicates an unexpected state, possibly while auth state is transitioning.
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
