
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'recruiter' | 'candidate'>;
}

export default function AuthGuard({ children, allowedRoles = ['recruiter'] }: AuthGuardProps) {
  const { user, userProfile, loading, firebaseInitializationError } = useAuth();
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    if (firebaseInitializationError) {
      // Firebase not set up, auth won't work.
      // No redirection needed here, error message will be shown.
      return;
    }

    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (userProfile && !allowedRoles.includes(userProfile.role)) {
        toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page." });
        router.replace('/');
      }
    }
  }, [user, userProfile, loading, router, allowedRoles, firebaseInitializationError, toast]);

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

  if (loading || (!firebaseInitializationError && !user) || (!firebaseInitializationError && userProfile && !allowedRoles.includes(userProfile.role))) {
    // Show loader if loading, or if not initialized yet and no error, or if role mismatch before redirect.
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return <>{children}</>;
}
