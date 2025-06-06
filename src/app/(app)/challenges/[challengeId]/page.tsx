
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getAuth } from '@/lib/firebase/client';
import { getChallengeById } from '@/lib/firebase';
import type { Challenge } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, ArrowLeft, CalendarDays, Users, Tag, ListChecks } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = typeof params.challengeId === 'string' ? params.challengeId : undefined;
  
  const [challenge, setChallenge] = useState<Challenge | null | undefined>(undefined); // undefined initially, null if not found, Challenge if found
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true); // For challenge data
  const [error, setError] = useState<string | null>(null);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);

  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setCurrentFirebaseUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!currentFirebaseUser) {
      router.push('/auth');
      return;
    }

    if (!challengeId) {
      setError("Challenge ID not found in URL.");
      setIsDataLoading(false);
      setChallenge(null);
      return;
    }

    setIsDataLoading(true);
    const fetchChallenge = async () => {
      try {
        const fetchedChallenge = await getChallengeById(challengeId);
        if (fetchedChallenge) {
          setChallenge(fetchedChallenge);
        } else {
          setError("Challenge not found or you don't have permission to view it.");
          setChallenge(null);
        }
      } catch (err: any) {
        console.error("Error fetching challenge details:", err);
        setError(err.message || "Failed to load challenge details.");
        setChallenge(null);
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchChallenge();

  }, [challengeId, router, currentFirebaseUser, isAuthLoading]);

  if (isAuthLoading || currentFirebaseUser === undefined || (isDataLoading && challenge === undefined) ) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-10">
         <Card className="shadow-xl bg-destructive/10 border-destructive">
           <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold font-headline flex items-center justify-center text-destructive">
                    <Trophy className="mr-3 h-7 w-7" />
                    Error Loading Challenge
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive/80 mb-6">{error}</p>
                <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!challenge && !isDataLoading) { // Challenge not found, and not loading anymore
    return (
        <div className="max-w-4xl mx-auto text-center py-10">
             <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl font-bold font-headline flex items-center justify-center">
                        <Trophy className="mr-3 h-7 w-7 text-muted-foreground" />
                        Challenge Not Found
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">The challenge you are looking for does not exist or could not be loaded.</p>
                     <Button variant="outline" onClick={() => router.back()} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  // If challenge is null here, it means it was not found, handled above.
  // So, challenge should be valid from this point.
  if (!challenge) return null; // Should be caught by above logic.

  const startDate = parseISO(challenge.startDate);
  const endDate = parseISO(challenge.endDate);
  const daysRemaining = differenceInDays(endDate, new Date());
  const totalDays = Math.max(1, differenceInDays(endDate, startDate)); // Ensure totalDays is at least 1 to prevent division by zero
  const progress = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100)) : (daysRemaining < 0 ? 100 : 0);


  return (
    <div className="max-w-3xl mx-auto pb-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
      </Button>
      <Card className="shadow-2xl overflow-hidden">
        {challenge.imageUrl && (
          <div className="relative w-full h-60 md:h-80">
            <Image 
                src={challenge.imageUrl} 
                alt={challenge.title} 
                fill
                style={{objectFit: 'cover'}}
                data-ai-hint={challenge.dataAiHint || "challenge banner"}
                priority
            />
          </div>
        )}
        <CardHeader className="pt-6">
          <CardTitle className="text-2xl md:text-4xl font-bold font-headline flex items-center">
            <Trophy className="mr-3 h-8 w-8 text-yellow-500" />
            {challenge.title}
          </CardTitle>
          {challenge.category && (
            <CardDescription className="flex items-center text-sm mt-1">
                <Tag className="mr-1.5 h-4 w-4 text-muted-foreground"/> Category: {challenge.category}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
          
          <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center text-sm">
              <CalendarDays className="mr-2 h-5 w-5 text-primary" />
              <div>
                <span className="font-semibold">Runs from: </span> {format(startDate, 'MMMM d, yyyy')}
                <span className="font-semibold"> to </span> {format(endDate, 'MMMM d, yyyy')}
              </div>
            </div>
            {daysRemaining >= 0 ? (
                <p className="text-sm text-primary"><span className="font-semibold">{daysRemaining}</span> days remaining</p>
            ) : (
                <p className="text-sm text-destructive font-semibold">This challenge has ended.</p>
            )}
            <Progress value={progress} aria-label={`${challenge.title} progress: ${Math.round(progress)}%`} className="h-2" />
          </div>

          <div className="flex items-center text-muted-foreground">
            <Users className="mr-2 h-5 w-5" /> 
            <span className="font-semibold text-foreground mr-1">{challenge.participantIds.length}</span> Participants
          </div>
          
          {challenge.leaderboardPreview && challenge.leaderboardPreview.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <ListChecks className="mr-2 h-5 w-5 text-primary"/>
                Leaderboard Highlights
              </h3>
              <ul className="space-y-2">
                {challenge.leaderboardPreview.slice(0, 5).map(entry => (
                  <li key={entry.userId} className="flex items-center justify-between p-2.5 bg-card rounded-md shadow-sm hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.avatarUrl} alt={entry.userName} data-ai-hint="person avatar"/>
                        <AvatarFallback>{entry.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{entry.userName}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{entry.score} pts</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button className="w-full md:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 px-6">
            <Trophy className="mr-2 h-5 w-5" /> Join Challenge
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
