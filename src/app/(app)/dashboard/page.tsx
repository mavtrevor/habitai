
import { HabitProgressCard } from '@/components/dashboard/habit-progress-card';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { StreaksOverview } from '@/components/dashboard/streaks-overview';
import { AIInsightsCard } from '@/components/dashboard/ai-insights-card';
import { BadgesOverview } from '@/components/dashboard/badges-overview';
import { getUserHabits, getUserBadges, getCurrentUser } from '@/lib/firebase';
import type { Habit, Badge } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks';

// Data fetching at the page level (Server Component)
const getDashboardData = async () => {
  const currentUser = await getCurrentUser(); // Needed for fetching user-specific data
  if (!currentUser) {
    return { habits: [], badges: [], userId: null, habitsDataString: "[]" };
  }

  const habits = await getUserHabits(currentUser.id);
  const badges = await getUserBadges(currentUser.id); // Fetches earned badges
  
  return {
    habits: habits,
    badges: badges,
    userId: currentUser.id,
    habitsDataString: JSON.stringify(habits.map(h => ({title: h.title, progress: h.progress.length, streak: h.streak}))) // Minimized data for AI
  };
};

export default async function DashboardPage() {
  const { habits, badges, userId, habitsDataString } = await getDashboardData();

  if (!userId) {
    // Handle case where user is not authenticated, though AppLayout should ideally protect this route
    // For now, redirect or show a message. This might be better handled in middleware or layout.
    return (
      <div className="text-center py-10">
        <p>Please sign in to view your dashboard.</p>
        <Button asChild className="mt-4">
          <Link href="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }
  
  // Example data for weekly progress chart (last 4 weeks)
  // This should be calculated based on actual habit progress over time from Firestore
  const weeklyProgress = [
    // Placeholder: Calculate actual weekly progress based on habit.progress dates
    habits.length > 0 ? (habits[0].progress.filter(p => p.completed).length / (habits[0].progress.length || 1)) * 100 : 60,
    75, 
    70, 
    85
  ];


  return (
    <div className="space-y-6">
      <WelcomeBanner />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StreaksOverview habits={habits} />
        <BadgesOverview badges={badges} /> {/* Pass fetched earned badges */}
        <AIInsightsCard habitsData={habitsDataString} />
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
