'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserNav } from '@/components/layout/user-nav';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from './app-sidebar';
import { useSidebar, SidebarTrigger } from '../ui/sidebar';
import { Logo } from '../shared/logo';
import { usePathname } from 'next/navigation';
import { mockNotifications } from '@/lib/mock-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { useEffect, useState } from 'react';

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/habits/create')) return 'Create New Habit';
  if (pathname.startsWith('/habits')) return 'My Habits';
  if (pathname.startsWith('/community')) return 'Community';
  if (pathname.startsWith('/challenges')) return 'Challenges';
  if (pathname.startsWith('/progress')) return 'Progress Insights';
  if (pathname.startsWith('/profile')) return 'My Profile';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'HabitAI';
};


export function AppHeader() {
  const { isMobile, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
        {isMobile && (
          <SidebarTrigger className="md:hidden" />
        )}
        {!isMobile && <div className="w-8"/>} 
      
      <div className="flex-1">
        <h1 className="text-xl font-semibold font-headline hidden md:block">{pageTitle}</h1>
         {isMobile && <Logo size="small" />}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <form className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search habits, posts..."
            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] rounded-full"
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                 <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 && <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>}
              {notifications.map((notif) => (
                <DropdownMenuItem key={notif.id} onSelect={() => markAsRead(notif.id)} className={`flex flex-col items-start ${!notif.read ? 'font-semibold':''}`}>
                  <Link href={notif.link || '#'} className="w-full">
                    <p className="text-sm truncate">{notif.message}</p>
                    <p className={`text-xs ${notif.read ? 'text-muted-foreground' : 'text-primary'}`}>{new Date(notif.createdAt).toLocaleTimeString()}</p>
                  </Link>
                </DropdownMenuItem>
              ))}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center">
              <Link href="/notifications" className="text-sm text-primary">View all notifications</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <UserNav />
      </div>
    </header>
  );
}
