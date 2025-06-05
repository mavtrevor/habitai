
'use client';

import type { FC } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { generateAIInsights } from '@/lib/firebase'; 
import type { GenerateAIInsightsInput } from '@/ai/flows/generate-ai-insights';

interface AIInsightsCardProps {
  habitsData: string; 
  userId: string | null; // Accept userId as a prop
}

const AIInsightsCardComponent: FC<AIInsightsCardProps> = ({ habitsData, userId }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!userId) {
      setError("User ID not provided. Cannot fetch insights.");
      setIsLoading(false);
      setInsights(null);
      return;
    }
    if (!habitsData || habitsData === "[]") {
      setInsights("No habit data available to generate insights. Start tracking some habits!");
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const input: GenerateAIInsightsInput = { userId: userId, habitsData };
      const result = await generateAIInsights(input);
      setInsights(result.insights);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI insights. Please try again.');
      console.error(err);
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  }, [habitsData, userId]);

  useEffect(() => {
    // Fetch insights when userId or habitsData changes and userId is available
    if (userId) { 
      fetchInsights();
    } else if (userId === null) { // Explicitly no user
        setInsights(null);
        setError("User not available for insights.");
        setIsLoading(false);
    }
    // If userId is undefined (still loading from parent), do nothing, wait for it to be null or a string
  }, [fetchInsights, userId]); 

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold font-headline flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" /> AI Insights
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={isLoading || !userId}>
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
          <p className="text-sm text-muted-foreground">No insights available at the moment. Ensure you have tracked habits and are logged in.</p>
        )}
      </CardContent>
    </Card>
  );
}
export const AIInsightsCard = React.memo(AIInsightsCardComponent);
AIInsightsCard.displayName = 'AIInsightsCard';
