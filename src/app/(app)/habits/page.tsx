
'use client'; 

import React, { useState, useEffect, useCallback } from 'react';
import { HabitProgressCard } from '@/components/dashboard/habit-progress-card';
import { getUserHabits, getCurrentUser } from '@/lib/firebase';
import type { Habit } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function HabitsListPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  // TODO: Implement filter states
  // const [filterStatus, setFilterStatus] = useState<string | null>(null); 
  // const [sortBy, setSortBy] = useState<string>('lastUpdated');

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUserId(currentUser.id);
      } else {
        // Handle user not logged in, e.g., redirect or show message
        setIsLoading(false); 
      }
    };
    fetchUser();
  }, []);

  const loadHabits = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setHabits([]);
      return;
    }
    setIsLoading(true);
    try {
      let userHabits = await getUserHabits(userId);

      if (searchTerm) {
        userHabits = userHabits.filter(habit =>
            habit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (habit.description && habit.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // TODO: Implement filtering and sorting logic here
      // Example:
      // if (sortBy === 'lastUpdatedAt') {
      //   userHabits.sort((a, b) => new Date(b.lastUpdatedAt || b.createdAt).getTime() - new Date(a.lastUpdatedAt || a.createdAt).getTime());
      // }


      setHabits(userHabits);
    } catch (error) {
      console.error("Failed to load habits:", error);
      setHabits([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, searchTerm /*, filterStatus, sortBy */]);

  useEffect(() => {
    if (userId) { // Only load habits if userId is available
      loadHabits();
    }
  }, [loadHabits, userId]);

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
  
  if (!userId && !isLoading) {
     return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold font-headline">My Habits</h1>
        <p className="text-muted-foreground">Please sign in to manage your habits.</p>
         <Button asChild><Link href="/auth">Sign In</Link></Button>
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
              {/* TODO: Implement filter items - state and logic */}
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
          <h3 className="text-xl font-semibold mb-2">No Habits Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No habits match your search." : "Start building positive habits by creating your first one."}
          </p>
          <Button asChild>
            <Link href="/habits/create">Create Your First Habit</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
