
'use client';
import type { FC } from 'react';
import React from 'react';
import type { Challenge } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarDays, Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Progress } from '../ui/progress';
import { differenceInDays, format } from 'date-fns';

interface ChallengeCardProps {
  challenge: Challenge;
}

const ChallengeCardComponent: FC<ChallengeCardProps> = ({ challenge }) => {
  const daysRemaining = differenceInDays(new Date(challenge.endDate), new Date());
  const totalDays = differenceInDays(new Date(challenge.endDate), new Date(challenge.startDate));
  const progress = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100)) : 0;
  
  const categoryColor = challenge.category === 'Fitness' ? 'bg-green-500' : 
                        challenge.category === 'Wellness' ? 'bg-blue-500' :
                        'bg-purple-500'; // default

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden bg-card">
      {challenge.imageUrl && (
        <div className="relative h-40 w-full">
          <Image 
            src={challenge.imageUrl} 
            alt={challenge.title} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint={challenge.dataAiHint || "challenge banner"}
          />
           {challenge.category && (
            <span className={`absolute top-2 right-2 text-xs text-white px-2 py-1 rounded-full ${categoryColor} shadow-md`}>
              {challenge.category}
            </span>
          )}
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold font-headline">{challenge.title}</CardTitle>
        <CardDescription className="text-xs h-10 overflow-hidden text-ellipsis">{challenge.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <CalendarDays className="h-3 w-3" />
            <span>{format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d, yyyy')}</span>
            {daysRemaining > 0 && <span className="ml-auto font-medium text-primary">{daysRemaining} days left</span>}
            {daysRemaining <= 0 && <span className="ml-auto font-medium text-destructive">Ended</span>}
          </div>
          <Progress value={progress} aria-label={`${challenge.title} progress: ${progress}%`} className="h-1.5" />
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <Users className="h-3 w-3 mr-1" /> {challenge.participants.length} Participants
        </div>
         {challenge.leaderboard.length > 0 && (
          <div className="text-xs text-muted-foreground">
             <p className="font-medium mb-1 flex items-center"><Trophy className="h-3 w-3 mr-1 text-yellow-500"/> Top Participant:</p>
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={challenge.leaderboard[0].avatarUrl} data-ai-hint="person avatar"/>
                <AvatarFallback>{challenge.leaderboard[0].userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{challenge.leaderboard[0].userName} - {challenge.leaderboard[0].score} pts</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-3">
        <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href={`/challenges/${challenge.id}`}>View Challenge</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export const ChallengeCard = React.memo(ChallengeCardComponent);
ChallengeCard.displayName = 'ChallengeCard';
