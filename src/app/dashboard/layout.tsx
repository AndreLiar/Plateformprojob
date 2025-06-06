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
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react'; // User icon for profile/logout area
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LogoutButton from '@/components/dashboard/LogoutButton';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={['recruiter']}>
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
             {/* User profile and logout could go here */}
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsible=icon]:hidden">
                 <p className="text-sm font-medium text-sidebar-foreground">Recruiter Name</p> {/* Placeholder */}
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
