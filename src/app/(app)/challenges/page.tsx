
'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { ChallengeCard } from "@/components/community/challenge-card";
import { getChallenges } from "@/lib/firebase";
import type { Challenge } from '@/types';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentFirebaseUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchChallengeData = async () => {
      if (!currentFirebaseUser) {
        setChallenges([]);
        setIsDataLoading(false);
        return;
      }

      setIsDataLoading(true);
      try {
        const fetchedChallenges = await getChallenges();
        setChallenges(fetchedChallenges);
      } catch (error) {
        console.error("Error fetching challenges:", error);
        setChallenges([]);
      } finally {
        setIsDataLoading(false);
      }
    };

    // Only fetch data if auth state is determined (i.e., not undefined)
    if (currentFirebaseUser !== undefined) {
      fetchChallengeData();
    }
  }, [currentFirebaseUser]);

  if (isAuthLoading || currentFirebaseUser === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentFirebaseUser && !isAuthLoading) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold font-headline">Challenges</h1>
        <p className="text-muted-foreground">Please sign in to view and participate in challenges.</p>
        <Button asChild><Link href="/auth">Sign In</Link></Button>
      </div>
    );
  }

  if (isDataLoading && currentFirebaseUser) {
     return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">All Challenges</h1>
        <Button asChild variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
          <Link href="/challenges/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Challenge
          </Link>
        </Button>
      </div>

      {challenges.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Challenges Available</h3>
          <p className="text-muted-foreground mb-4">Check back later for new challenges or start your own!</p>
          <Button asChild>
            <Link href="/challenges/create">Create a Challenge</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
