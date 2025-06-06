
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
        const performLogout = async () => {
          await logout();
          router.replace('/login');
        };
        performLogout();
      } else if (userProfile) {
        if (typeof userProfile.role === 'undefined') {
          // Role is missing from the profile object
          toast({
            variant: "destructive",
            title: "Profile Issue",
            description: "User role is not defined in your profile. You will be logged out. Please contact support or try signing up again."
          });
          const performLogout = async () => {
            await logout();
            router.replace('/login');
          };
          performLogout();
        } else if (typeof userProfile.role === 'string' && !allowedRoles.includes(userProfile.role)) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: `You do not have permission to view this page. Your role: '${userProfile.role}'. Required: '${allowedRoles.join("', '")}'.`
          });
          router.replace('/'); // Or a more appropriate redirect like /login or candidate-specific denied page
        }
        // If role is valid and in allowedRoles, access is implicitly granted by reaching the render stage
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

  if (loading || (!user && !firebaseInitializationError)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Check conditions for rendering children
  if (user && userProfile && typeof userProfile.role === 'string' && allowedRoles.includes(userProfile.role)) {
    return <>{children}</>;
  }

  // Fallback: Show loader while useEffect processes and redirects or determines access.
  // This state should ideally be brief or covered by the conditions above.
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

