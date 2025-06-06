"use client";

import AuthGuard from '@/components/auth/AuthGuard';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import CandidateSidebarNav from '@/components/dashboard/candidate/CandidateSidebarNav';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LogoutButton from '@/components/dashboard/LogoutButton';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth to get user's name

export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile } = useAuth(); // Get user profile to display name

  return (
    <AuthGuard allowedRoles={['candidate']}>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4 flex items-center justify-between">
            <Link href="/dashboard/candidate" className="font-headline text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              PlatformPro
            </Link>
             <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden" />
          </SidebarHeader>
          <SidebarContent>
            <CandidateSidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>{userProfile?.displayName?.charAt(0) || userProfile?.email?.charAt(0)?.toUpperCase() || 'C'}</AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsible=icon]:hidden">
                 <p className="text-sm font-medium text-sidebar-foreground">{userProfile?.displayName || userProfile?.email || 'Candidate'}</p>
                 <LogoutButton />
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
