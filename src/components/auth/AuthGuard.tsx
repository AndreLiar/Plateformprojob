
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from '@/lib/types'; // For role type

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'recruiter' | 'candidate'>;
  /**
   * If the user's role matches a key in this object,
   * and the current pathname starts with one of the corresponding string prefixes,
   * this AuthGuard will permit access, deferring to a potentially more specific
   * AuthGuard in a nested layout.
   * Example: { candidate: ['/dashboard/candidate'] }
   */
  delegateAuthToNestedLayout?: Partial<Record<UserProfile['role'], string[]>>;
}

export default function AuthGuard({ children, allowedRoles = ['recruiter'], delegateAuthToNestedLayout }: AuthGuardProps) {
  const { user, userProfile, loading: authLoading, firebaseInitializationError, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // No need to reset isRedirecting here, as it's set only when a redirect occurs.
    // It should be true only during the redirection process.

    if (firebaseInitializationError || authLoading) {
      return; // Wait for Firebase init or auth state
    }

    if (!user) {
      if (pathname !== '/login' && pathname !== '/signup') { // Avoid redirect loop if already on auth pages
        router.replace('/login');
        setIsRedirecting(true);
      }
      return;
    }

    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Profile Issue",
        description: "Your user profile could not be loaded. Logging out."
      });
      logout().finally(() => { // Ensure logout completes before redirect
        router.replace('/login');
        setIsRedirecting(true);
      });
      return;
    }

    if (typeof userProfile.role === 'undefined') {
      toast({
        variant: "destructive",
        title: "Profile Issue",
        description: "User role is not defined. Logging out."
      });
      logout().finally(() => {
        router.replace('/login');
        setIsRedirecting(true);
      });
      return;
    }

    const currentRole = userProfile.role;

    // Delegation Check: If current role and path match a delegation rule, allow access.
    if (delegateAuthToNestedLayout && delegateAuthToNestedLayout[currentRole]) {
      const prefixesToDelegate = delegateAuthToNestedLayout[currentRole]!;
      for (const prefix of prefixesToDelegate) {
        if (pathname.startsWith(prefix)) {
          setIsRedirecting(false); // Access is delegated, not redirecting.
          return; // Allow children to render, nested guard will handle.
        }
      }
    }

    // Strict Role Check for this guard's segment (if not delegated)
    if (!allowedRoles.includes(currentRole)) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: `Redirecting... Your role: '${currentRole}'. Required: '${allowedRoles.join("', '")}'. Path: ${pathname}`
      });

      // Redirect to appropriate dashboard or home
      if (currentRole === 'candidate') {
        router.replace('/dashboard/candidate/profile');
      } else if (currentRole === 'recruiter') {
        router.replace('/dashboard');
      } else {
        router.replace('/');
      }
      setIsRedirecting(true);
      return;
    }

    // If all checks pass for this guard (role allowed or delegated and no other issues)
    setIsRedirecting(false);

  }, [user, userProfile, authLoading, router, allowedRoles, delegateAuthToNestedLayout, pathname, firebaseInitializationError, toast, logout]);


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

  if (authLoading || isRedirecting) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading, not redirecting, and useEffect determined access is granted (or delegated)
  // Render children only if user and profile are loaded and checks passed.
  // The checks in useEffect (setting isRedirecting or returning early for delegation)
  // determine if we should reach this point to render children.
  if (user && userProfile && !isRedirecting) {
     return <>{children}</>;
  }
  
  // Fallback loader if conditions for rendering children are not met and not explicitly redirecting.
  // This could happen if useEffect hasn't completed its first run, or an unexpected state.
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
