
'use client';

import type { FC } from 'react';
import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltipContent, ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { TrendingUp } from 'lucide-react';

interface ProgressChartProps {
  weeklyProgress: number[]; 
}

const chartConfig = {
  completionRate: {
    label: "Completion %",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const ProgressChartComponent: FC<ProgressChartProps> = ({ weeklyProgress }) => {
  const chartData = React.useMemo(() => weeklyProgress.map((rate, index) => ({
    week: `Week ${index + 1}`,
    completionRate: rate,
  })), [weeklyProgress]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold font-headline flex items-center">
           <TrendingUp className="mr-2 h-5 w-5 text-primary" /> Weekly Progress
        </CardTitle>
        <CardDescription>Your habit completion rates over the last 4 weeks.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}> {/* Changed left margin from -25 to 0 */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="week" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                fontSize={12}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="completionRate" fill="var(--color-completionRate)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const ProgressChart = React.memo(ProgressChartComponent);
ProgressChart.displayName = 'ProgressChart';
