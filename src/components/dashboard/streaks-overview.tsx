
'use client';
import type { FC } from 'react';
import React from 'react';
import type { Habit } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface StreaksOverviewProps {
  habits: Habit[];
}

const StreaksOverviewComponent: FC<StreaksOverviewProps> = ({ habits }) => {
  const longestStreak = React.useMemo(() => Math.max(0, ...habits.map(h => h.streak)), [habits]);
  const activeStreaks = React.useMemo(() => habits.filter(h => h.streak > 0).length, [habits]);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
         <CardTitle className="text-lg font-semibold font-headline flex items-center">
          <Flame className="mr-2 h-5 w-5 text-orange-500" /> Streaks
        </CardTitle>
        <CardDescription>Your current habit momentum.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Longest Current Streak:</span>
          <span className="text-lg font-bold text-primary">{longestStreak} {longestStreak === 1 ? 'day' : 'days'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Active Streaks:</span>
          <span className="text-lg font-bold text-primary">{activeStreaks}</span>
        </div>
        {habits.filter(h => h.streak > 0).slice(0,2).map(habit => (
             <div key={habit.id} className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                <span className="font-medium text-foreground">{habit.title}:</span> {habit.streak} days
             </div>
        ))}
      </CardContent>
    </Card>
  );
}

export const StreaksOverview = React.memo(StreaksOverviewComponent);
StreaksOverview.displayName = 'StreaksOverview';
