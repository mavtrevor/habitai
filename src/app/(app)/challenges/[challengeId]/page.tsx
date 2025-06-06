
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getAuth } from '@/lib/firebase/client';
import { getChallengeById, joinChallenge as firebaseJoinChallenge } from '@/lib/firebase';
import type { Challenge } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, ArrowLeft, CalendarDays, Users, Tag, ListChecks, CheckCircle, UserPlus, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const challengeId = typeof params.challengeId === 'string' ? params.challengeId : undefined;
  
  const [challenge, setChallenge] = useState<Challenge | null | undefined>(undefined);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

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
          if (currentFirebaseUser && fetchedChallenge.participantIds.includes(currentFirebaseUser.uid)) {
            setHasJoined(true);
          } else {
            setHasJoined(false);
          }
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

  useEffect(() => {
    if (challenge && currentFirebaseUser) {
      setHasJoined(challenge.participantIds.includes(currentFirebaseUser.uid));
    }
  }, [challenge, currentFirebaseUser]);


  const handleJoinChallenge = useCallback(async () => {
    if (!currentFirebaseUser || !challenge) {
      toast({ title: "Error", description: "Cannot join challenge. User or challenge data missing.", variant: "destructive"});
      return;
    }
    if (hasJoined) {
      toast({ title: "Already Joined", description: "You are already a participant in this challenge.", variant: "default"});
      return;
    }

    setIsJoining(true);
    try {
      const updatedChallenge = await firebaseJoinChallenge(challenge.id, currentFirebaseUser.uid);
      if (updatedChallenge) {
        setChallenge(updatedChallenge); 
        setHasJoined(true);
        toast({ title: "Successfully Joined!", description: `You've joined the "${challenge.title}" challenge.`});
      } else {
        throw new Error("Failed to update challenge after joining.");
      }
    } catch (err: any) {
      console.error("Error joining challenge:", err);
      toast({ title: "Join Failed", description: err.message || "Could not join the challenge.", variant: "destructive"});
    } finally {
      setIsJoining(false);
    }
  }, [currentFirebaseUser, challenge, hasJoined, toast]);

  const handleShareChallenge = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.clipboard) {
      toast({ title: "Share Failed", description: "Cannot access clipboard to copy link.", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied!", description: "Challenge link copied to your clipboard." });
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast({ title: "Share Failed", description: "Could not copy link to clipboard.", variant: "destructive" });
    }
  }, [toast]);


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

  if (!challenge && !isDataLoading) { 
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
  
  if (!challenge) return null;

  const startDate = parseISO(challenge.startDate);
  const endDate = parseISO(challenge.endDate);
  const daysRemaining = differenceInDays(endDate, new Date());
  const totalDays = Math.max(1, differenceInDays(endDate, startDate)); 
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
        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row gap-2">
          <Button 
            className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 px-6 flex-1"
            onClick={handleJoinChallenge}
            disabled={isJoining || hasJoined || daysRemaining < 0}
          >
            {isJoining ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : hasJoined ? (
              <CheckCircle className="mr-2 h-5 w-5" />
            ) : (
              <UserPlus className="mr-2 h-5 w-5" />
            )}
            {isJoining ? "Joining..." : hasJoined ? "Already Joined" : (daysRemaining < 0 ? "Challenge Ended" : "Join Challenge")}
          </Button>
           <Button 
            variant="outline"
            className="w-full sm:w-auto text-lg py-3 px-6"
            onClick={handleShareChallenge}
          >
            <Share2 className="mr-2 h-5 w-5" />
            Share Challenge
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

