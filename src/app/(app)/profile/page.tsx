import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockUser, mockBadges, mockChallenges, mockHabits } from "@/lib/mock-data";
import { UserSettingsForm } from "@/components/profile/user-settings-form";
import { BadgesList } from "@/components/profile/badges-list";
import { ChallengeCard } from "@/components/community/challenge-card";
import { Edit3, User, ShieldCheck, Trophy, Activity } from "lucide-react";
import Link from "next/link";
import { HabitProgressCard } from "@/components/dashboard/habit-progress-card";

export default async function ProfilePage() {
  // In a real app, fetch user-specific data
  const user = mockUser;
  const badges = mockBadges; // All badges for now, filter earned in BadgesList
  const joinedChallenges = mockChallenges.filter(c => c.participants.includes(user.id));
  const userHabits = mockHabits.filter(h => h.userId === user.id);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary via-primary/90 to-accent p-8 text-primary-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
              <AvatarFallback className="text-3xl bg-background text-primary">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold font-headline">{user.name}</h1>
              <p className="opacity-90">{user.email}</p>
              <p className="text-xs opacity-80 mt-1">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <Button variant="outline" size="sm" asChild className="ml-auto text-foreground bg-background/80 hover:bg-background">
              <Link href="/profile/edit"> {/* Assuming an edit page or modal trigger */}
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-card p-1 rounded-lg shadow">
          <TabsTrigger value="overview" className="flex items-center gap-1"><Activity className="h-4 w-4"/>Overview</TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1"><User className="h-4 w-4"/>Settings</TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-1"><ShieldCheck className="h-4 w-4"/>Badges</TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-1"><Trophy className="h-4 w-4"/>Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-semibold font-headline">Activity Overview</CardTitle>
                    <CardDescription>A quick look at your active habits and progress.</CardDescription>
                </CardHeader>
                <CardContent>
                    {userHabits.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {userHabits.slice(0,3).map((habit) => ( // Show first 3 habits
                            <HabitProgressCard key={habit.id} habit={habit} />
                        ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No active habits to display. <Link href="/habits/create" className="text-primary hover:underline">Create one now!</Link></p>
                    )}
                    {userHabits.length > 3 && 
                        <Button variant="link" asChild className="mt-4 text-primary"><Link href="/habits">View all habits</Link></Button>
                    }
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold font-headline">Profile Settings</CardTitle>
              <CardDescription>Manage your account details and preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserSettingsForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <Card>
             <CardHeader>
                <CardTitle className="text-xl font-semibold font-headline">Your Badges</CardTitle>
                <CardDescription>Celebrate your achievements and milestones.</CardDescription>
            </CardHeader>
            <CardContent>
                <BadgesList badges={badges} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="mt-6">
          <Card>
             <CardHeader>
                <CardTitle className="text-xl font-semibold font-headline">Joined Challenges</CardTitle>
                <CardDescription>Track your progress in ongoing challenges.</CardDescription>
            </CardHeader>
            <CardContent>
                {joinedChallenges.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {joinedChallenges.map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                </div>
                ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">You haven't joined any challenges yet.</p>
                    <Button asChild variant="link" className="text-primary">
                    <Link href="/community?tab=challenges">Explore Challenges</Link>
                    </Button>
                </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
