
'use client';
import type { FC } from 'react';
import React from 'react';
import type { Badge as BadgeType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import * as LucideIcons from 'lucide-react';

interface BadgesOverviewProps {
  badges: BadgeType[]; // These are already filtered earned badges from the dashboard page
}

const IconComponent: FC<{ name?: string } & LucideIcons.LucideProps> = React.memo(({ name, ...props }) => {
  if (!name || !(name in LucideIcons)) {
    return <Award {...props} />; // Default icon
  }
  const Icon = LucideIcons[name as keyof typeof LucideIcons] as LucideIcons.LucideIcon;
  return <Icon {...props} />;
});
IconComponent.displayName = 'IconComponent';


const BadgesOverviewComponent: FC<BadgesOverviewProps> = ({ badges }) => {
  const recentBadges = badges.slice(0, 3); // Show 3 most recent/earned badges

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold font-headline flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5 text-yellow-500" /> Badges Earned
        </CardTitle>
        <CardDescription>Milestones you've achieved.</CardDescription>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No badges earned yet. Keep going!</p>
        ) : (
          <div className="space-y-2">
            {recentBadges.map(badge => (
              <div key={badge.id} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-md">
                <IconComponent name={badge.icon} className="h-6 w-6 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  {badge.earnedAt && <p className="text-xs text-muted-foreground/70">Earned: {new Date(badge.earnedAt).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        {badges.length > 3 && (
          <Button variant="link" asChild className="mt-2 p-0 h-auto text-primary">
            <Link href="/profile?tab=badges">View all {badges.length} badges</Link>
          </Button>
        )}
         {badges.length > 0 && badges.length <=3 && (
             <Button variant="link" asChild className="mt-2 p-0 h-auto text-primary">
                <Link href="/profile?tab=badges">View Badges</Link>
            </Button>
         )}
      </CardContent>
    </Card>
  );
}

export const BadgesOverview = React.memo(BadgesOverviewComponent);
BadgesOverview.displayName = 'BadgesOverview';
