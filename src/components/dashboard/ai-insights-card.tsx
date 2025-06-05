
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
}

const AIInsightsCardComponent: FC<AIInsightsCardProps> = ({ habitsData }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const input: GenerateAIInsightsInput = { userId: 'user123', habitsData }; // Mock userId
      const result = await generateAIInsights(input);
      setInsights(result.insights);
    } catch (err) {
      setError('Failed to load AI insights. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [habitsData]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold font-headline flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" /> AI Insights
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={isLoading}>
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
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : insights ? (
          <p className="text-sm text-foreground">{insights}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No insights available at the moment.</p>
        )}
      </CardContent>
    </Card>
  );
}
export const AIInsightsCard = React.memo(AIInsightsCardComponent);
AIInsightsCard.displayName = 'AIInsightsCard';
