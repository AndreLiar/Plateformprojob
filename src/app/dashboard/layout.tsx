
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
import SidebarNav from '@/components/dashboard/SidebarNav';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <AuthGuard 
      allowedRoles={['recruiter']}
      delegateAuthToNestedLayout={{ candidate: ['/dashboard/candidate'] }}
    >
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4 flex items-center justify-between">
            <Link href="/dashboard" className="font-headline text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              PlatformPro
            </Link>
             <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <RecruiterInfo />
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

// Client component to display recruiter info, as useAuth needs to be in client context
function RecruiterInfo() {
  const { userProfile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex w-full cursor-pointer items-center gap-2 rounded-md hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>{userProfile?.displayName?.charAt(0) || userProfile?.email?.charAt(0)?.toUpperCase() || 'R'}</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-sidebar-foreground">{userProfile?.displayName || userProfile?.email || 'Recruiter'}</p>
            </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-56 bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground">
          <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userProfile?.displayName || 'Recruiter'}</p>
                  <p className="text-xs leading-none text-sidebar-foreground/80">{userProfile?.email}</p>
              </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer focus:bg-sidebar-primary focus:text-sidebar-primary-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
          </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
