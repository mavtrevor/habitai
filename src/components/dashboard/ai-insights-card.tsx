
'use client';

import type { FC } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { generateAIInsights, getCurrentUser } from '@/lib/firebase'; // Use the real Genkit flow wrapper
import type { GenerateAIInsightsInput } from '@/ai/flows/generate-ai-insights';

interface AIInsightsCardProps {
  // habitsData is passed from DashboardPage which prepares a minimized string
  habitsData: string; 
}

const AIInsightsCardComponent: FC<AIInsightsCardProps> = ({ habitsData }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const user = await getCurrentUser();
        if (user) setCurrentUserId(user.id);
        else {
            setError("User not authenticated."); // Handle if user somehow logs out while component is mounted
            setIsLoading(false);
        }
    };
    fetchUser();
  }, []);

  const fetchInsights = useCallback(async () => {
    if (!currentUserId) {
        // setError("Cannot fetch insights without user ID."); // Already handled by initial check
        return;
    }
    if (!habitsData || habitsData === "[]") {
      setInsights("No habit data available to generate insights. Start tracking some habits!");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const input: GenerateAIInsightsInput = { userId: currentUserId, habitsData };
      const result = await generateAIInsights(input); // Calls the actual Genkit flow
      setInsights(result.insights);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI insights. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [habitsData, currentUserId]);

  useEffect(() => {
    if (currentUserId) { // Fetch insights only when userId and habitsData are available
      fetchInsights();
    }
  }, [fetchInsights, currentUserId]); // Depend on currentUserId

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold font-headline flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" /> AI Insights
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={isLoading || !currentUserId}>
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
        <CardDescription>Personalized tips to optimize your habits.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : insights ? (
          <p className="text-sm text-foreground whitespace-pre-line">{insights}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No insights available at the moment.</p>
        )}
      </CardContent>
    </Card>
  );
}
export const AIInsightsCard = React.memo(AIInsightsCardComponent);
AIInsightsCard.displayName = 'AIInsightsCard';
