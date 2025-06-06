
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
import { differenceInDays, format, parseISO } from 'date-fns'; // Ensure parseISO for string dates

interface ChallengeCardProps {
  challenge: Challenge;
}

const ChallengeCardComponent: FC<ChallengeCardProps> = ({ challenge }) => {
  const startDate = parseISO(challenge.startDate);
  const endDate = parseISO(challenge.endDate);
  const daysRemaining = differenceInDays(endDate, new Date());
  const totalDays = differenceInDays(endDate, startDate);
  const progress = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100)) : 0;
  
  const categoryColor = challenge.category === 'Fitness' ? 'bg-green-500' : 
                        challenge.category === 'Wellness' ? 'bg-blue-500' :
                        challenge.category === 'Learning' ? 'bg-yellow-500' :
                        challenge.category === 'Productivity' ? 'bg-purple-500' :
                        'bg-gray-500'; // default

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden bg-card">
      {challenge.imageUrl && (
        <div className="relative h-40 w-full">
          <Image 
            src={challenge.imageUrl} 
            alt={challenge.title} 
            fill // Use fill for responsive images in a sized container
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes
            style={{objectFit: 'cover'}}
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
            <span>{format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}</span>
            {daysRemaining > 0 && <span className="ml-auto font-medium text-primary">{daysRemaining} days left</span>}
            {daysRemaining <= 0 && !challenge.endDate.startsWith("0001-01-01") && <span className="ml-auto font-medium text-destructive">Ended</span>}
          </div>
          {totalDays > 0 && <Progress value={progress} aria-label={`${challenge.title} progress: ${progress}%`} className="h-1.5" />}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <Users className="h-3 w-3 mr-1" /> {challenge.participantIds.length} Participants
        </div>
         {challenge.leaderboardPreview && challenge.leaderboardPreview.length > 0 && (
          <div className="text-xs text-muted-foreground">
             <p className="font-medium mb-1 flex items-center"><Trophy className="h-3 w-3 mr-1 text-yellow-500"/> Top Participant:</p>
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={challenge.leaderboardPreview[0].avatarUrl} data-ai-hint="person avatar"/>
                <AvatarFallback>{challenge.leaderboardPreview[0].userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{challenge.leaderboardPreview[0].userName} - {challenge.leaderboardPreview[0].score} pts</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-3">
        <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href={`/challenges/${challenge.id}`}>View Details</Link> 
        </Button>
      </CardFooter>
    </Card>
  );
}

export const ChallengeCard = React.memo(ChallengeCardComponent);
ChallengeCard.displayName = 'ChallengeCard';
