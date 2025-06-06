
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { HabitCreatorForm } from '@/components/habits/habit-creator-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getHabitById } from '@/lib/firebase';
import type { Habit } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Edit3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EditHabitPage() {
  const params = useParams();
  const router = useRouter();
  const habitId = typeof params.habitId === 'string' ? params.habitId : undefined;
  
  const [habit, setHabit] = useState<Habit | null | undefined>(undefined); 
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentFirebaseUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchHabitData = async () => {
      if (!currentFirebaseUser) {
        if (!isAuthLoading) { // Only set error if auth is resolved and no user
            setError("User not authenticated. Please sign in.");
            router.push('/auth'); 
        }
        setHabit(null);
        setIsDataLoading(false);
        return;
      }

      if (!habitId) {
        setError("Invalid habit ID.");
        setHabit(null);
        setIsDataLoading(false);
        return;
      }
      
      setIsDataLoading(true);
      setError(null);
      try {
        const fetchedHabit = await getHabitById(currentFirebaseUser.uid, habitId);
        if (fetchedHabit) {
          setHabit(fetchedHabit);
        } else {
          setHabit(null);
          setError(`Habit with ID "${habitId}" not found or you don't have permission to edit it.`);
        }
      } catch (err) {
        console.error("Failed to fetch habit for editing:", err);
        setError("Failed to load habit details. Please try again.");
        setHabit(null);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (!isAuthLoading) { // Only proceed if auth state is determined
        fetchHabitData();
    }
  }, [habitId, router, currentFirebaseUser, isAuthLoading]);

  if (isAuthLoading || currentFirebaseUser === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isDataLoading && currentFirebaseUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || (!habit && !isDataLoading)) { // Check !isDataLoading to ensure error isn't shown prematurely
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <Card className="shadow-xl bg-destructive/10 border-destructive">
           <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold font-headline flex items-center justify-center text-destructive">
                    <AlertTriangle className="mr-3 h-7 w-7" />
                    Error Loading Habit
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive/80 mb-6">{error || "The habit could not be found or loaded."}</p>
                <Button asChild>
                    <Link href="/habits">Go to Habits List</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!habit) { // Should be caught by above, but as a fallback
    return <div className="max-w-2xl mx-auto text-center py-10"><p>Habit not found.</p></div>;
  }


  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold font-headline flex items-center">
            <Edit3 className="mr-3 h-7 w-7 text-primary" />
            Edit Habit
          </CardTitle>
          <CardDescription>
            Modify the details of your habit: "{habit.title}".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HabitCreatorForm habitToEdit={habit} mode="edit" />
        </CardContent>
      </Card>
    </div>
  );
}
