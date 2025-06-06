
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { getAuth } from '@/lib/firebase/client'; // Changed import
import { HabitProgressCard } from '@/components/dashboard/habit-progress-card';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { StreaksOverview } from '@/components/dashboard/streaks-overview';
import { AIInsightsCard } from '@/components/dashboard/ai-insights-card';
import { BadgesOverview } from '@/components/dashboard/badges-overview';
import { getUserHabits, getUserBadges } from '@/lib/firebase';
import type { Habit, Badge } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks';

export default function DashboardPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [habitsDataString, setHabitsDataString] = useState<string>("[]");
  
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authInstance = getAuth(); // Get auth instance
    const unsubscribe = onAuthStateChanged(authInstance, (user) => { // Use the instance
      setCurrentFirebaseUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentFirebaseUser) {
        setHabits([]);
        setBadges([]);
        setHabitsDataString("[]");
        setIsDataLoading(false); 
        if (!isAuthLoading && currentFirebaseUser === null) { 
             
        }
        return;
      }

      setIsDataLoading(true);
      setError(null);
      try {
        const [fetchedHabits, fetchedBadges] = await Promise.all([
          getUserHabits(currentFirebaseUser.uid),
          getUserBadges(currentFirebaseUser.uid) 
        ]);

        setHabits(fetchedHabits);
        setBadges(fetchedBadges);
        setHabitsDataString(JSON.stringify(fetchedHabits.map(h => ({ title: h.title, progress: h.progress.length, streak: h.streak }))));
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to load dashboard data.");
        setHabits([]);
        setBadges([]);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (currentFirebaseUser !== undefined) {
      fetchDashboardData();
    }
  }, [currentFirebaseUser, isAuthLoading]);


  const weeklyProgress = React.useMemo(() => {
    if (!habits || habits.length === 0) return [0,0,0,0]; 
    return [
      habits.length > 0 ? (habits[0].progress.filter(p => p.completed).length / (habits[0].progress.length || 1)) * 100 : 60,
      75, 
      70,
      85
    ];
  }, [habits]);

  if (isAuthLoading || currentFirebaseUser === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentFirebaseUser && !isAuthLoading) {
    return (
      <div className="text-center py-10">
        <p>Please sign in to view your dashboard.</p>
        <Button asChild className="mt-4">
          <Link href="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }
  
  if (isDataLoading) {
     return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner userName={currentFirebaseUser?.displayName || "User"} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StreaksOverview habits={habits} />
        <BadgesOverview badges={badges} />
        {currentFirebaseUser && <AIInsightsCard habitsData={habitsDataString} userId={currentFirebaseUser.uid} />}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProgressChart weeklyProgress={weeklyProgress} />
        </div>
        <div className="lg:col-span-2">
          <UpcomingTasks habits={habits} />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold font-headline">Your Habits</h2>
          <Button asChild variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
            <Link href="/habits/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Habit
            </Link>
          </Button>
        </div>
        {habits.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {habits.map((habit) => (
              <HabitProgressCard key={habit.id} habit={habit} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg shadow">
            <p className="mb-2">You haven&apos;t added any habits yet.</p>
            <Button asChild>
              <Link href="/habits/create">Create Your First Habit</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
