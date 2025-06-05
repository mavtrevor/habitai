import { HabitProgressCard } from '@/components/dashboard/habit-progress-card';
import { mockHabits } from '@/lib/mock-data';
import type { Habit } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter } from 'lucide-react';
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
import { Search } from 'lucide-react';

// Mock data fetching for all habits
const getAllHabits = async (userId: string): Promise<Habit[]> => {
  // In a real app, fetch this data from Firebase
  return mockHabits.filter(habit => habit.userId === userId);
};

export default async function HabitsListPage() {
  // Assuming a mock user for now
  const habits = await getAllHabits('user123');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">My Habits</h1>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search habits..." className="pl-8 w-full sm:w-auto" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
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
          <Button asChild>
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
