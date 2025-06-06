
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getAuth } from '@/lib/firebase/client';
import { getCurrentUser, getUserHabits } from '@/lib/firebase';
import type { Habit } from '@/types';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { HabitProgressCard } from '@/components/dashboard/habit-progress-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, BarChart3, ListChecks } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Example: Calculate weekly progress for the chart based on habit data
const calculateWeeklyProgress = (habits: Habit[]): number[] => {
  if (!habits || habits.length === 0) return [0, 0, 0, 0];
  // This is a placeholder. A more sophisticated calculation would be needed
  // based on actual habit completion dates and frequencies over several weeks.
  // For now, let's derive something simple from the first 4 habits if available,
  // or just return some dummy data.
  const rates = habits.slice(0, 4).map(habit => {
    const totalEntries = habit.progress.length;
    const completedEntries = habit.progress.filter(p => p.completed).length;
    return totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;
  });
  while (rates.length < 4) {
    rates.push(rates.length > 0 ? rates[rates.length-1] * 0.9 : Math.random() * 50 + 50); // Pad with some decreasing values or random
  }
  return rates;
};


export default function ProgressInsightsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setCurrentFirebaseUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchHabitData = async () => {
      if (!currentFirebaseUser) {
        setHabits([]);
        setIsDataLoading(false);
        return;
      }

      setIsDataLoading(true);
      setError(null);
      try {
        const fetchedHabits = await getUserHabits(currentFirebaseUser.uid);
        setHabits(fetchedHabits);
      } catch (err: any) {
        console.error("Error fetching habit data for insights:", err);
        setError(err.message || "Failed to load habit data.");
        setHabits([]);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (currentFirebaseUser !== undefined) { // Only fetch if auth state is determined
      fetchHabitData();
    }
  }, [currentFirebaseUser]);

  const weeklyProgress = React.useMemo(() => calculateWeeklyProgress(habits), [habits]);

  if (isAuthLoading || currentFirebaseUser === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentFirebaseUser && !isAuthLoading) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold font-headline flex items-center justify-center">
          <BarChart3 className="mr-3 h-8 w-8 text-primary" />
          Progress Insights
        </h1>
        <p className="text-muted-foreground">Please sign in to view your progress insights.</p>
        <Button asChild><Link href="/auth">Sign In</Link></Button>
      </div>
    );
  }
  
  if (isDataLoading && currentFirebaseUser) {
     return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error && currentFirebaseUser) {
    return (
      <div className="text-center py-10 text-destructive">
        <h1 className="text-3xl font-bold font-headline mb-4">Progress Insights</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline flex items-center">
        <BarChart3 className="mr-3 h-8 w-8 text-primary" />
        Progress Insights
      </h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Overall Progress Trends</CardTitle>
          <CardDescription>Visualize your habit completion rates over time.</CardDescription>
        </CardHeader>
        <CardContent>
          {habits.length > 0 ? (
            <ProgressChart weeklyProgress={weeklyProgress} />
          ) : (
            <p className="text-muted-foreground">No habit data available to display trends. <Link href="/habits/create" className="text-primary hover:underline">Start a new habit!</Link></p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Habit Details</CardTitle>
          <CardDescription>Review individual habit performance.</CardDescription>
        </CardHeader>
        <CardContent>
          {habits.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {habits.map((habit) => (
                <HabitProgressCard key={habit.id} habit={habit} />
              ))}
            </div>
          ) : (
             <div className="text-center py-8 text-muted-foreground bg-card rounded-lg shadow-sm">
                <ListChecks className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="mb-2">You haven&apos;t added any habits yet.</p>
                <Button asChild variant="secondary">
                  <Link href="/habits/create">Create Your First Habit</Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for more advanced insights or charts */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Streaks & Consistency</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">More detailed streak analysis coming soon...</p>
        </CardContent>
      </Card> */}
    </div>
  );
}
