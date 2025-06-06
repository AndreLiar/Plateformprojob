
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, LayoutDashboard, LogOut, Briefcase, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, userProfile, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-headline font-bold text-primary">
          PlatformPro Jobs
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          {loading ? (
            <div className="h-9 w-24 rounded-md bg-muted animate-pulse" /> 
          ) : user && userProfile ? ( // Ensure userProfile is also loaded
            <>
              <Button variant="ghost" asChild>
                <Link href="/jobs">
                  <Search className="mr-2 h-4 w-4" /> Browse Jobs
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href={userProfile.role === 'recruiter' ? "/dashboard" : "/dashboard/candidate"}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : ( // Handles both non-logged-in users and logged-in users before profile loads
            <>
              <Button variant="ghost" asChild>
                <Link href="/jobs">
                  <Search className="mr-2 h-4 w-4" /> Browse Jobs
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button variant="default" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
