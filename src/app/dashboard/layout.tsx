
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
// import { Button } from '@/components/ui/button';
// import { User } from 'lucide-react'; // User icon for profile/logout area
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LogoutButton from '@/components/dashboard/LogoutButton';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth to get user's name


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // useAuth hook cannot be used directly in Server Components.
  // For displaying user info, either pass it from a Client Component parent
  // or make parts of this layout client components.
  // For now, keeping placeholder or fetching on client side in SidebarFooter if needed.

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
  const { userProfile } = useAuth();
  return (
    <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
      <Avatar className="h-8 w-8">
        <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
        <AvatarFallback>{userProfile?.displayName?.charAt(0) || userProfile?.email?.charAt(0)?.toUpperCase() || 'R'}</AvatarFallback>
      </Avatar>
      <div className="group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-medium text-sidebar-foreground">{userProfile?.displayName || userProfile?.email || 'Recruiter'}</p>
          <LogoutButton />
      </div>
    </div>
  );
}
