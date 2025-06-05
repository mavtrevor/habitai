
import { HabitProgressCard } from '@/components/dashboard/habit-progress-card';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { StreaksOverview } from '@/components/dashboard/streaks-overview';
import { AIInsightsCard } from '@/components/dashboard/ai-insights-card';
import { BadgesOverview } from '@/components/dashboard/badges-overview';
import { mockBadges } from '@/lib/mock-data'; // mockBadges is still directly exported
import { getUserHabits } from '@/lib/firebase'; // Import getUserHabits
import type { Habit, Badge } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks';

// Mock data fetching
const getDashboardData = async () => {
  // In a real app, fetch this data
  const habits = await getUserHabits('user123'); // Use getUserHabits for mock user
  return {
    habits: habits,
    badges: mockBadges.filter(b => b.earnedAt), // Only show earned badges
  };
};

export default async function DashboardPage() {
  const { habits, badges } = await getDashboardData();

  const habitProgressData = habits.map(habit => ({
    name: habit.title,
    // Simplified completion rate for the chart
    completionRate: Math.round((habit.progress.filter(p => p.completed).length / (habit.progress.length || 1)) * 100),
  }));
  
  // Example data for weekly progress chart (last 4 weeks)
  // This should be calculated based on actual habit progress over time
  const weeklyProgress = [60, 75, 70, 85];


  return (
    <div className="space-y-6">
      <WelcomeBanner />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StreaksOverview habits={habits} />
        <BadgesOverview badges={badges} />
        <AIInsightsCard habitsData={JSON.stringify(habits)} />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProgressChart weeklyProgress={weeklyProgress} />
        </div>
        <div className="lg:col-span-2">
          <QuickActions />
          <UpcomingTasks habits={habits} />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold font-headline">Your Habits</h2>
          <Button asChild variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
            <Link href="/habits/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Habit
            </Link>
          </Button>
        </div>
        {habits.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {habits.map((habit) => (
              <HabitProgressCard key={habit.id} habit={habit} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg shadow">
            <p className="mb-2">You haven&apos;t added any habits yet.</p>
            <Button asChild>
              <Link href="/habits/create">Create Your First Habit</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
