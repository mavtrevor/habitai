
'use client';

import type { FC } from 'react';
import React, { useState, useCallback } from 'react';
import type { Habit } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, TrendingUp, Zap, Edit3, ListChecks, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateHabitProgress } from '@/lib/firebase'; // Use the real Firebase function

interface HabitProgressCardProps {
  habit: Habit;
}

const IconComponent: FC<{ name?: string } & LucideIcons.LucideProps> = React.memo(({ name, ...props }) => {
  if (!name || !(name in LucideIcons)) {
    return <ListChecks {...props} />; // Default icon
  }
  const Icon = LucideIcons[name as keyof typeof LucideIcons] as LucideIcons.LucideIcon;
  return <Icon {...props} />;
});
IconComponent.displayName = 'IconComponent';


const HabitProgressCardComponent: FC<HabitProgressCardProps> = ({ habit: initialHabit }) => {
  const [habit, setHabit] = useState(initialHabit);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Update derived state when habit prop changes (e.g. parent list re-fetches)
  React.useEffect(() => {
    setHabit(initialHabit);
  }, [initialHabit]);

  const todayISO = new Date().toISOString();
  const todayDateOnly = todayISO.slice(0,10);
  
  const completedToday = habit.progress.find(p => p.date.startsWith(todayDateOnly))?.completed ?? false;
  
  const completionRate = habit.progress.length > 0 
    ? (habit.progress.filter(p => p.completed).length / habit.progress.length) * 100
    : 0;

  const handleMarkAsDone = useCallback(async () => {
    setIsUpdating(true);
    try {
      const updatedHabitFromStore = await updateHabitProgress(habit.id, todayISO, true);
      if (updatedHabitFromStore) {
        setHabit(updatedHabitFromStore); 
      }
      toast({ title: "Habit Updated!", description: `${habit.title} marked as completed for today.`});
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update habit.", variant: "destructive"});
      console.error("Error updating habit:", error);
    } finally {
      setIsUpdating(false);
    }
  }, [toast, habit.title, habit.id, todayISO]);


  return (
    <Card id={habit.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
             <IconComponent name={habit.icon} className="h-6 w-6" style={{color: habit.color || 'hsl(var(--primary))'}} />
            <CardTitle className="text-lg font-semibold font-headline">{habit.title}</CardTitle>
          </div>
          {completedToday && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        </div>
        <CardDescription className="text-xs h-10 overflow-y-auto">{habit.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} aria-label={`${habit.title} progress: ${Math.round(completionRate)}%`} className="h-2" />
        </div>
        {habit.aiSuggestedTask && (
          <div className="mt-2 p-2 bg-secondary/30 rounded-md text-xs text-secondary-foreground">
            <p className="flex items-start">
              <Zap className="h-3 w-3 mr-1.5 mt-0.5 text-accent flex-shrink-0" /> 
              <strong>AI Task:</strong>{' '}{habit.aiSuggestedTask}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2 pt-3 border-t">
        <div className="text-sm text-muted-foreground flex items-center justify-center">
            <TrendingUp className="h-4 w-4 mr-1 text-primary" /> Streak: {habit.streak} {habit.frequency === 'daily' ? 'days' : 'times'}
        </div>
        <div className="flex justify-center gap-2 w-full">
          <Button variant="outline" size="sm" asChild className="flex-grow-0">
            <Link href={`/habits/edit/${habit.id}`}>
              <Edit3 className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Edit</span>
            </Link>
          </Button>
          {!completedToday ? (
            <Button 
              size="sm" 
              onClick={handleMarkAsDone} 
              disabled={isUpdating}
              className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1 justify-center"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              {isUpdating ? "Updating..." : "Mark as Done"}
            </Button>
          ) : (
             <Button size="sm" variant="ghost" disabled className="text-green-600 flex-1 justify-center">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Completed!
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export const HabitProgressCard = React.memo(HabitProgressCardComponent);
HabitProgressCard.displayName = 'HabitProgressCard';
