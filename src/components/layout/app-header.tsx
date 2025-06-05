
'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Search, Menu, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserNav } from '@/components/layout/user-nav';
import { useSidebar, SidebarTrigger } from '../ui/sidebar';
import { Logo } from '../shared/logo';
import { usePathname } from 'next/navigation';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getCurrentUser } from '@/lib/firebase';
import type { Notification as NotificationType } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/habits/create')) return 'Create New Habit';
  if (pathname.startsWith('/habits/edit')) return 'Edit Habit';
  if (pathname.startsWith('/habits')) return 'My Habits';
  if (pathname.startsWith('/community')) return 'Community';
  if (pathname.startsWith('/challenges/create')) return 'Create Challenge';
  if (pathname.startsWith('/challenges')) return 'Challenges';
  if (pathname.startsWith('/progress')) return 'Progress Insights';
  if (pathname.startsWith('/profile')) return 'My Profile';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'HabitAI';
};


export function AppHeader() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        setIsLoadingNotifications(true);
        try {
          const fetchedNotifications = await getNotifications(user.id);
          setNotifications(fetchedNotifications);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          setIsLoadingNotifications(false);
        }
      } else {
        setNotifications([]);
        setIsLoadingNotifications(false); // No user, no notifications to load
      }
    };
    fetchUserAndNotifications();
  }, [pathname]); // Refetch if pathname changes, in case of SPA navigation keeping header mounted

  const handleMarkAsRead = async (id: string) => {
    if (!currentUserId) return;
    setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n)); // Optimistic update
    try {
        await markNotificationAsRead(currentUserId, id);
    } catch (error) {
        console.error("Error marking notification as read:", error);
        // Potentially revert optimistic update here or show toast
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUserId || unreadCount === 0) return;
    setNotifications(prev => prev.map(n => ({...n, read: true }))); // Optimistic update
    try {
        await markAllNotificationsAsRead(currentUserId);
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        // Potentially revert or show toast
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
            placeholder="Search..."
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
          <DropdownMenuContent align="end" className="w-80 md:w-96">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={handleMarkAllRead}>Mark all as read</Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {isLoadingNotifications ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <DropdownMenuItem disabled className="text-center text-muted-foreground py-4">No new notifications</DropdownMenuItem>
              ) : (
                notifications.map((notif) => (
                  <DropdownMenuItem 
                    key={notif.id} 
                    onSelect={(event) => { 
                      event.preventDefault(); // Prevent menu from closing immediately if it's a link
                      if (!notif.read) handleMarkAsRead(notif.id); 
                    }}
                    className={`flex flex-col items-start p-2.5 focus:bg-accent/50 ${!notif.read ? 'bg-primary/5 font-medium':''}`}
                    asChild
                  >
                    <Link href={notif.link || '#'} className="w-full block">
                      <p className={`text-sm truncate ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.message}</p>
                      <p className={`text-xs ${!notif.read ? 'text-primary' : 'text-muted-foreground/80'}`}>{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(notif.createdAt).toLocaleDateString()}</p>
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center p-0">
                   {/* Placeholder for a dedicated notifications page */}
                  <Button variant="link" asChild className="w-full text-primary">
                     <Link href="/notifications">View all notifications</Link>
                  </Button>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <UserNav />
      </div>
    </header>
  );
}
