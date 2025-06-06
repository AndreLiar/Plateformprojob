"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'recruiter' | 'candidate'>;
}

export default function AuthGuard({ children, allowedRoles = ['recruiter'] }: AuthGuardProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (userProfile && !allowedRoles.includes(userProfile.role)) {
        // If role is not allowed, redirect to a relevant page or homepage
        // For now, redirecting to home if role mismatch.
        // Could also show an "Access Denied" page.
        toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page." });
        router.replace('/');
      }
    }
  }, [user, userProfile, loading, router, allowedRoles]);

  if (loading || !user || (userProfile && !allowedRoles.includes(userProfile.role))) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
