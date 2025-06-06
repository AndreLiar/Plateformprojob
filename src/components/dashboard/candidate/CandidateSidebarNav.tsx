
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { UserCircle, Briefcase /* Add more relevant icons */ } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard/candidate/profile', label: 'My Profile', icon: UserCircle },
  { href: '/dashboard/candidate/applied-jobs', label: 'Applied Jobs', icon: Briefcase },
  // Future items: Saved Jobs, Settings etc.
];

export default function CandidateSidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href === '/dashboard/candidate/profile' && pathname === '/dashboard/candidate')}
              className={cn(
                "w-full justify-start",
                (pathname === item.href || (item.href === '/dashboard/candidate/profile' && pathname === '/dashboard/candidate')) && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
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
