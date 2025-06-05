
'use client'; 

import { HabitProgressCard } from '@/components/dashboard/habit-progress-card';
import { getUserHabits } from '@/lib/firebase'; // Use the "API" function
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
import React, { useState, useEffect, useCallback } from 'react';

export default function HabitsListPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Add more states for filters as needed, e.g.,
  // const [filterStatus, setFilterStatus] = useState<string | null>(null); 
  // const [sortBy, setSortBy] = useState<string>('lastUpdated');

  const loadHabits = useCallback(async () => {
    setIsLoading(true);
    try {
      let userHabits = await getUserHabits('user123'); // Fetch habits for mock user

      if (searchTerm) {
        userHabits = userHabits.filter(habit =>
            habit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (habit.description && habit.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Implement filtering and sorting logic here based on filterStatus and sortBy states
      // For example:
      // if (filterStatus === 'active') { ... }
      // if (sortBy === 'A-Z') { userHabits.sort(...); }

      setHabits(userHabits);
    } catch (error) {
      console.error("Failed to load habits:", error);
      setHabits([]); // Set to empty or show error message
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm /*, filterStatus, sortBy */]); // Add dependencies

  useEffect(() => {
    loadHabits();
  }, [loadHabits]); // Reload when loadHabits function reference changes (due to its dependencies)

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
            <Input 
              placeholder="Search habits..." 
              className="pl-8 w-full" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
              {/* Example filter items - implement state and logic for these */}
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
