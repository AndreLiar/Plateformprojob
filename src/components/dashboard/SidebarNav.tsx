
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { PlusCircle, Briefcase, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/post-job', label: 'Post New Job', icon: PlusCircle },
  { href: '/dashboard/my-jobs', label: 'My Jobs', icon: Briefcase },
  // { href: '/dashboard/settings', label: 'Settings', icon: Settings }, // Example for future extension
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href === '/dashboard/my-jobs' && pathname === '/dashboard')}
              className={cn(
                "w-full justify-start",
                (pathname === item.href || (item.href === '/dashboard' && pathname.endsWith('/my-jobs'))) && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
              )}
              tooltip={{ children: item.label, side: 'right', align: 'center' }}
            >
              <a>
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
