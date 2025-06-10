
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getAuth } from '@/lib/firebase/client';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firebase';
import type { Notification as NotificationType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BellRing, Info, Users, Award, CheckCheck, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const getNotificationIcon = (type: NotificationType['type'], className?: string) => {
  const baseClasses = "h-5 w-5 flex-shrink-0";
  const combinedClassName = cn(baseClasses, className);
  switch (type) {
    case 'reminder':
      return <BellRing className={cn(combinedClassName, "text-blue-500")} />;
    case 'milestone':
      return <Award className={cn(combinedClassName, "text-yellow-500")} />;
    case 'social':
      return <MessageSquare className={cn(combinedClassName, "text-purple-500")} />; // Using MessageSquare for social
    case 'info':
    default:
      return <Info className={cn(combinedClassName, "text-gray-500")} />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setCurrentFirebaseUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchNotifications = useCallback(async (userId: string) => {
    setIsDataLoading(true);
    setError(null);
    try {
      // Fetch a larger number of notifications for this page, e.g., 100
      const fetchedNotifications = await getNotifications(userId, 100);
      setNotifications(fetchedNotifications);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Failed to load notifications.");
      setNotifications([]);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentFirebaseUser) {
      fetchNotifications(currentFirebaseUser.uid);
    } else if (!isAuthLoading && currentFirebaseUser === null) {
      setNotifications([]);
      router.push('/auth'); // Redirect to login if not authenticated
    }
  }, [currentFirebaseUser, isAuthLoading, fetchNotifications, router]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    if (!currentFirebaseUser) return;
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    try {
      await markNotificationAsRead(currentFirebaseUser.uid, notificationId);
    } catch (err: any) {
      setNotifications(originalNotifications); // Revert on error
      toast({ title: "Error", description: "Could not mark notification as read.", variant: "destructive" });
    }
  }, [currentFirebaseUser, notifications, toast]);

  const handleMarkAllRead = useCallback(async () => {
    if (!currentFirebaseUser || notifications.every(n => n.read)) return;
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await markAllNotificationsAsRead(currentFirebaseUser.uid);
      toast({ title: "All notifications marked as read." });
    } catch (err: any) {
      setNotifications(originalNotifications); // Revert on error
      toast({ title: "Error", description: "Could not mark all as read.", variant: "destructive" });
    }
  }, [currentFirebaseUser, notifications, toast]);


  if (isAuthLoading || currentFirebaseUser === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <BellRing className="mr-3 h-8 w-8 text-primary" />
          Notifications
        </h1>
        {notifications.length > 0 && unreadCount > 0 && (
          <Button onClick={handleMarkAllRead} variant="outline" size="sm" disabled={isDataLoading || isAuthLoading}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Alerts</CardTitle>
          <CardDescription>
            {isDataLoading && notifications.length === 0 ? "Loading notifications..." :
             notifications.length === 0 && !error ? "You have no notifications yet." :
             unreadCount > 0 ? `You have ${unreadCount} unread notification(s).` : 
             error ? "" : "All caught up!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isDataLoading && notifications.length === 0 ? (
             <div className="flex flex-1 items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-destructive text-center py-10">{error}</p>
          ) : notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">You have no new notifications.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh_-_22rem)] sm:h-[calc(100vh_-_20rem)] pr-1">
              <ul className="space-y-3">
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={cn(
                      "p-3 rounded-lg border flex items-start gap-3 transition-colors",
                      notif.read ? "bg-card hover:bg-muted/30" : "bg-primary/10 hover:bg-primary/20 border-primary/30",
                    )}
                  >
                    {getNotificationIcon(notif.type, notif.read ? "text-muted-foreground" : "")}
                    <div className="flex-grow">
                      <Link href={notif.link || '#'}
                        onClick={(e) => {
                          if (!notif.read) handleMarkAsRead(notif.id);
                          if (!notif.link) {
                            e.preventDefault(); 
                          } else {
                            // Allow navigation but ensure state updates happen.
                            // If navigation is too fast, state update might not reflect.
                            // For complex scenarios, consider router.push after await markAsRead.
                          }
                        }}
                        className={cn(
                            "block text-sm focus:outline-none focus:ring-1 focus:ring-ring rounded-sm -m-0.5 p-0.5", 
                            !notif.read ? "font-semibold text-foreground" : "text-foreground/80",
                            notif.link ? "hover:underline" : "cursor-default"
                        )}
                      >
                        {notif.message}
                      </Link>
                      <p className={cn("text-xs mt-0.5", notif.read ? "text-muted-foreground" : "text-primary/90")}>
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-xs h-auto p-1.5 text-primary hover:text-primary/80"
                        title="Mark as read"
                      >
                        Mark Read
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
