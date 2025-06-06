
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getAuth } from '@/lib/firebase/client';
// import { getChallengeById } from '@/lib/firebase'; // We'll need this later
// import type { Challenge } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = typeof params.challengeId === 'string' ? params.challengeId : undefined;
  
  // const [challenge, setChallenge] = useState<Challenge | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true); // Combined loading state
  const [error, setError] = useState<string | null>(null);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);

  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setCurrentFirebaseUser(user);
      setIsLoading(false); // Initial auth check done
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return; // Wait for auth check

    if (!currentFirebaseUser) {
      router.push('/auth'); // Redirect if not logged in
      return;
    }

    if (!challengeId) {
      setError("Challenge ID not found in URL.");
      // setIsLoading(false); // Already handled by auth loading
      return;
    }

    // TODO: Fetch challenge details using challengeId
    // For now, just simulate loading completion
    // const fetchChallenge = async () => {
    //   try {
    //     const fetchedChallenge = await getChallengeById(challengeId); // Assuming this function will exist
    //     if (fetchedChallenge) {
    //       setChallenge(fetchedChallenge);
    //     } else {
    //       setError("Challenge not found.");
    //     }
    //   } catch (err: any) {
    //     setError(err.message || "Failed to load challenge details.");
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchChallenge();
    
    // Placeholder: Remove setIsLoading(false) once actual data fetching is implemented
    // setIsLoading(false); // Assuming data fetching would happen here

  }, [challengeId, router, currentFirebaseUser, isLoading]);

  if (isLoading || currentFirebaseUser === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold font-headline flex items-center">
            <Trophy className="mr-3 h-7 w-7 text-yellow-500" />
            Challenge Details
          </CardTitle>
          {challengeId && <CardDescription>Displaying details for challenge ID: {challengeId}</CardDescription>}
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive">{error}</p>}
          {/* Placeholder for challenge content */}
          <p className="text-muted-foreground">Challenge details will be displayed here. This is a placeholder.</p>
          {/* 
            Example structure for later:
            {challenge ? (
              <div>
                <h2 className="text-xl font-semibold">{challenge.title}</h2>
                <p>{challenge.description}</p>
                <p>Category: {challenge.category}</p>
                <p>Runs from {format(parseISO(challenge.startDate), 'PPP')} to {format(parseISO(challenge.endDate), 'PPP')}</p>
                <Image src={challenge.imageUrl || `https://placehold.co/600x300.png?text=${challenge.title}`} alt={challenge.title} width={600} height={300} className="rounded-md my-4" />
                
                <h3 className="font-semibold mt-4">Participants ({challenge.participantIds.length})</h3>
                <ul>
                  {challenge.participantIds.map(pid => <li key={pid}>{pid}</li>)}
                </ul>

                {challenge.leaderboardPreview && challenge.leaderboardPreview.length > 0 && (
                  <>
                    <h3 className="font-semibold mt-4">Leaderboard Preview</h3>
                    <ul>
                      {challenge.leaderboardPreview.map(entry => (
                        <li key={entry.userId}>{entry.userName}: {entry.score}</li>
                      ))}
                    </ul>
                  </>
                )}
                <Button className="mt-6">Join Challenge</Button>
              </div>
            ) : (
              <p>Loading challenge details...</p>
            )}
          */}
        </CardContent>
      </Card>
    </div>
  );
}
