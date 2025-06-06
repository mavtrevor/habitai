
'use client'; 

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserProfile, getUserBadges, getChallenges as fetchChallenges, getUserHabits } from "@/lib/firebase";
import type { UserProfile as UserProfileType, Badge as BadgeType, Challenge as ChallengeType, Habit } from '@/types';
import { UserSettingsForm } from "@/components/profile/user-settings-form";
import { BadgesList } from "@/components/profile/badges-list";
import { ChallengeCard } from "@/components/community/challenge-card";
import { HabitProgressCard } from "@/components/dashboard/habit-progress-card";
import { Edit3, User, ShieldCheck, Trophy, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [joinedChallenges, setJoinedChallenges] = useState<ChallengeType[]>([]);
  const [userHabits, setUserHabits] = useState<Habit[]>([]);
  
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true); // For profile data, badges, etc.

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentFirebaseUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentFirebaseUser) {
        setUserProfile(null);
        setBadges([]);
        setJoinedChallenges([]);
        setUserHabits([]);
        setIsDataLoading(false);
        return;
      }

      setIsDataLoading(true);
      try {
        const fetchedUserProfile = await getUserProfile(currentFirebaseUser.uid);
        setUserProfile(fetchedUserProfile); // This can be null if profile doesn't exist

        if (fetchedUserProfile) { // Only fetch related data if profile exists
          const [fetchedBadges, allChallenges, fetchedHabits] = await Promise.all([
            getUserBadges(currentFirebaseUser.uid),
            fetchChallenges(), // Assuming getChallenges is general and not user-specific at fetch time
            getUserHabits(currentFirebaseUser.uid)
          ]);
          
          setBadges(fetchedBadges);
          setUserHabits(fetchedHabits);
          setJoinedChallenges(allChallenges.filter(c => c.participantIds.includes(currentFirebaseUser.uid)));
        } else {
            // Handle case where user exists in Auth but not in Firestore profiles
            setBadges([]);
            setJoinedChallenges([]);
            setUserHabits([]);
        }

      } catch (error) {
        console.error("Error fetching profile data:", error);
        setUserProfile(null); // Reset on error
      } finally {
        setIsDataLoading(false);
      }
    };
    
    // Only fetch data if auth state is determined (i.e., not undefined)
    if (currentFirebaseUser !== undefined) {
      fetchProfileData();
    }
  }, [currentFirebaseUser]);

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }

  if (isAuthLoading || currentFirebaseUser === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentFirebaseUser && !isAuthLoading) {
    return (
      <div className="text-center py-10">
        <p>Please sign in to view your profile.</p>
        <Button asChild className="mt-4">
          <Link href="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }
  
  // User is authenticated, now check data loading status
  if (isDataLoading) {
     return (
      <div className="space-y-8">
        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary via-primary/90 to-accent p-8 text-primary-foreground">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <div className="text-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading profile data...</p>
        </div>
      </div>
    );
  }
  
  if (!userProfile && !isDataLoading) {
     return (
      <div className="text-center py-10">
        <p className="text-destructive">Could not load user profile. It might not exist or there was an error.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary via-primary/90 to-accent p-8 text-primary-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} data-ai-hint="person portrait" />
              <AvatarFallback className="text-3xl bg-background text-primary">{getInitials(userProfile.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold font-headline">{userProfile.name}</h1>
              <p className="opacity-90">{userProfile.email}</p>
              <p className="text-xs opacity-80 mt-1">Member since {new Date(userProfile.createdAt).toLocaleDateString()}</p>
            </div>
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
                        {userHabits.slice(0,3).map((habit) => (
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
              <UserSettingsForm user={userProfile} />
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
                <BadgesList badgesData={badges} />
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
