
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HabitCreatorForm } from '@/components/habits/habit-creator-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getHabitById } from '@/lib/firebase';
import type { Habit } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EditHabitPage() {
  const params = useParams();
  const router = useRouter();
  const habitId = typeof params.habitId === 'string' ? params.habitId : undefined;
  
  const [habit, setHabit] = useState<Habit | null | undefined>(undefined); // undefined for loading, null for not found
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (habitId) {
      setIsLoading(true);
      setError(null);
      getHabitById(habitId)
        .then(fetchedHabit => {
          if (fetchedHabit) {
            setHabit(fetchedHabit);
          } else {
            setHabit(null); // Habit not found
            setError(`Habit with ID "${habitId}" not found.`);
          }
        })
        .catch(err => {
          console.error("Failed to fetch habit for editing:", err);
          setError("Failed to load habit details. Please try again.");
          setHabit(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Handle case where habitId is not available or invalid - though route structure should ensure it
      setError("Invalid habit ID.");
      setIsLoading(false);
      setHabit(null);
    }
  }, [habitId]);

  if (isLoading) {
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

  if (error || !habit) {
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

    