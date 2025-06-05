
'use client';

import type { Habit } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, TrendingUp, Zap, Edit3, ListChecks } from 'lucide-react'; // Added ListChecks
import * as LucideIcons from 'lucide-react'; // Import all icons
import { useToast } from '@/hooks/use-toast';
// import { updateHabitProgress } from '@/lib/firebase'; // Mocked
import { useState } from 'react';

interface HabitProgressCardProps {
  habit: Habit;
}

const IconComponent = ({ name, ...props }: { name?: string } & LucideIcons.LucideProps) => {
  if (!name || !(name in LucideIcons)) {
    return <ListChecks {...props} />; // Default icon
  }
  const Icon = LucideIcons[name as keyof typeof LucideIcons] as LucideIcons.LucideIcon;
  return <Icon {...props} />;
};


export function HabitProgressCard({ habit: initialHabit }: HabitProgressCardProps) {
  const [habit, setHabit] = useState(initialHabit);
  const { toast } = useToast();

  const completedToday = habit.progress.find(p => p.date.startsWith(new Date().toISOString().slice(0,10)))?.completed ?? false;
  
  const completionRate = habit.progress.length > 0 
    ? (habit.progress.filter(p => p.completed).length / habit.progress.length) * 100
    : 0;

  const handleMarkAsDone = async () => {
    // const todayISO = new Date().toISOString();
    // try {
    //   const updatedHabit = await updateHabitProgress(habit.id, todayISO, true);
    //   if (updatedHabit) setHabit(updatedHabit);
    //   toast({ title: "Habit Updated!", description: `${habit.title} marked as completed for today.`});
    // } catch (error) {
    //   toast({ title: "Error", description: "Could not update habit.", variant: "destructive"});
    // }
    // Mock update
    const todayISO = new Date().toISOString();
    const updatedHabit = { ...habit };
    const todayProgressIndex = updatedHabit.progress.findIndex(p => p.date.startsWith(todayISO.slice(0,10)));
    if (todayProgressIndex > -1) {
        updatedHabit.progress[todayProgressIndex].completed = true;
    } else {
        updatedHabit.progress.push({date: todayISO, completed: true});
    }
    updatedHabit.streak = (updatedHabit.streak || 0) + 1;
    setHabit(updatedHabit);
    toast({ title: "Habit Updated!", description: `${habit.title} marked as completed for today.`});
  };


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
        <CardDescription className="text-xs">{habit.description}</CardDescription>
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
            <p className="flex items-start"><Zap className="h-3 w-3 mr-1.5 mt-0.5 text-accent flex-shrink-0" /> <strong>AI Task:</strong> {habit.aiSuggestedTask}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t">
        <div className="text-sm text-muted-foreground flex items-center">
            <TrendingUp className="h-4 w-4 mr-1 text-primary" /> Streak: {habit.streak} {habit.frequency === 'daily' ? 'days' : 'times'}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
            <Link href={`/habits/edit/${habit.id}`}> {/* Assuming an edit page */}
              <Edit3 className="h-3 w-3 sm:mr-1" /> <span className="hidden sm:inline">Edit</span>
            </Link>
          </Button>
          {!completedToday ? (
            <Button size="sm" onClick={handleMarkAsDone} className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1 sm:flex-none">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Mark as Done
            </Button>
          ) : (
             <Button size="sm" variant="ghost" disabled className="text-green-600 flex-1 sm:flex-none">
              Completed!
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
