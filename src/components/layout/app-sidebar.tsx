'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Users2,
  UserCircle,
  Settings,
  LogOut,
  Award,
  BarChart3
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  useSidebar
} from "@/components/ui/sidebar";
import { Separator } from '../ui/separator';
import React from 'react';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/habits', label: 'My Habits', icon: ListChecks },
  { href: '/habits/create', label: 'New Habit', icon: PlusCircle },
  { href: '/community', label: 'Community', icon: Users2 },
  { href: '/challenges', label: 'Challenges', icon: Award },
  { href: '/progress', label: 'Progress Insights', icon: BarChart3 }
];

const userNavItems = [
  { href: '/profile', label: 'Profile', icon: UserCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { open, isMobile } = useSidebar();
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);


  if (!hydrated && !isMobile) { // Prevent flash of skeleton on desktop during SSR/hydration mismatch
    return (
      <Sidebar>
        <SidebarHeader>
          <Logo showText={open} className="mb-2"/>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {[...Array(5)].map((_,i) => <SidebarMenuSkeleton key={i} showIcon />)}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    );
  }
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Logo showText={open} />
      </SidebarHeader>

      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <Separator className="my-2"/>

      <SidebarFooter className="p-2">
        <SidebarMenu>
            {userNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                >
                    <a>
                    <item.icon />
                    <span>{item.label}</span>
                    </a>
                </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
                 {/* For mock purposes, this will redirect to auth page */}
                <Link href="/auth" passHref legacyBehavior>
                    <SidebarMenuButton asChild tooltip="Log Out">
                        <a>
                        <LogOut />
                        <span>Log Out</span>
                        </a>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
