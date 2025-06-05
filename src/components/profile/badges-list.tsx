import type { Badge as BadgeType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react'; // Default icon
import * as LucideIcons from 'lucide-react'; // Import all icons
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BadgesListProps {
  badges: BadgeType[];
}

const IconComponent = ({ name, ...props }: { name?: string } & LucideIcons.LucideProps) => {
  if (!name || !(name in LucideIcons)) {
    return <Award {...props} />; // Default icon
  }
  const Icon = LucideIcons[name as keyof typeof LucideIcons] as LucideIcons.LucideIcon;
  return <Icon {...props} />;
};

export function BadgesList({ badges }: BadgesListProps) {
  const earnedBadges = badges.filter(b => b.earnedAt);
  const upcomingBadges = badges.filter(b => !b.earnedAt);


  if (badges.length === 0) {
    return <p className="text-muted-foreground">No badges available yet. Keep striving!</p>;
  }

  return (
    <TooltipProvider>
    <div className="space-y-8">
        {earnedBadges.length > 0 && (
            <div>
                <h3 className="text-lg font-semibold mb-4">Earned Badges ({earnedBadges.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {earnedBadges.map(badge => (
                    <Tooltip key={badge.id}>
                        <TooltipTrigger asChild>
                            <Card className="text-center p-4 flex flex-col items-center justify-center aspect-square shadow-md hover:shadow-lg transition-shadow bg-card">
                                <IconComponent name={badge.icon} className="h-10 w-10 text-yellow-500 mb-2" />
                                <p className="text-xs font-medium truncate w-full">{badge.name}</p>
                                {badge.earnedAt && <p className="text-xs text-muted-foreground">{new Date(badge.earnedAt).toLocaleDateString()}</p>}
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg">
                            <p className="font-semibold">{badge.name}</p>
                            <p className="text-xs">{badge.description}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
                </div>
            </div>
        )}

        {upcomingBadges.length > 0 && (
             <div>
                <h3 className="text-lg font-semibold mb-4">Upcoming Badges ({upcomingBadges.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {upcomingBadges.map(badge => (
                    <Tooltip key={badge.id}>
                        <TooltipTrigger asChild>
                            <Card className="text-center p-4 flex flex-col items-center justify-center aspect-square shadow-md hover:shadow-lg transition-shadow bg-muted/30 opacity-70">
                                <IconComponent name={badge.icon} className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-xs font-medium truncate w-full">{badge.name}</p>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg">
                            <p className="font-semibold">{badge.name}</p>
                            <p className="text-xs">{badge.description}</p>
                            <p className="text-xs text-primary mt-1">Keep going to earn this badge!</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
                </div>
            </div>
        )}
         {earnedBadges.length === 0 && upcomingBadges.length === 0 && (
             <p className="text-muted-foreground">No badges to display at the moment.</p>
         )}
    </div>
    </TooltipProvider>
  );
}
