
'use client'; // Make it a client component

import { HabitProgressCard } from '@/components/dashboard/habit-progress-card';
import { mockHabits } from '@/lib/mock-data';
import type { Habit } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter, Search, ListChecks } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import React, { useState, useEffect } from 'react'; // Import React hooks

export default function HabitsListPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load habits
  const loadHabits = () => {
    setIsLoading(true);
    // In a real app, this would be an async fetch.
    // For mock data, we filter the imported mockHabits array.
    // Assuming 'user123' for the mock setup.
    const userHabits = mockHabits.filter(habit => habit.userId === 'user123');
    setHabits(userHabits);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHabits();
    // Adding mockHabits to dependency array to re-run if the array reference were to change,
    // though for direct mutation, the component re-rendering due to navigation is what helps.
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold font-headline">My Habits</h1>
        </div>
        <div className="text-center py-12">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">My Habits</h1>
        <div className="flex flex-col xs:flex-row gap-2 items-stretch xs:items-center w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search habits..." className="pl-8 w-full" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full xs:w-auto justify-start xs:justify-center">
                <ListFilter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Active</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Completed Today</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Archived</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
               <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Last Updated</DropdownMenuItem>
              <DropdownMenuItem>A-Z</DropdownMenuItem>
              <DropdownMenuItem>Streak</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild className="w-full xs:w-auto">
            <Link href="/habits/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Habit
            </Link>
          </Button>
        </div>
      </div>

      {habits.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => (
            <HabitProgressCard key={habit.id} habit={habit} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Habits Yet</h3>
          <p className="text-muted-foreground mb-4">Start building positive habits by creating your first one.</p>
          <Button asChild>
            <Link href="/habits/create">Create Your First Habit</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
