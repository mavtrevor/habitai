
'use server';

/**
 * @fileOverview Generates AI insights about user habit progress.
 *
 * - generateAIInsights - A function that generates personalized insights based on user habit data.
 * - GenerateAIInsightsInput - The input type for the generateAIInsights function.
 * - GenerateAIInsightsOutput - The return type for the generateAIInsights function.
 */

import {ai}from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAIInsightsInputSchema = z.object({
  userId: z.string().describe('The ID of the user to generate insights for.'),
  habitsData: z.string().describe('Stringified JSON array of the user habits data.'),
});
export type GenerateAIInsightsInput = z.infer<typeof GenerateAIInsightsInputSchema>;

const GenerateAIInsightsOutputSchema = z.object({
  insights: z.string().describe('AI-generated insights about the user habits progress.'),
});
export type GenerateAIInsightsOutput = z.infer<typeof GenerateAIInsightsOutputSchema>;

export async function generateAIInsights(input: GenerateAIInsightsInput): Promise<GenerateAIInsightsOutput> {
  return generateAIInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAIInsightsPrompt',
  input: {schema: GenerateAIInsightsInputSchema},
  output: {schema: GenerateAIInsightsOutputSchema},
  prompt: `You are an AI assistant that analyzes user habit data and provides personalized insights to help users optimize their habit-building strategy.

  Analyze the following user habit data:
  {{habitsData}}

  Provide insights that identify patterns in the user's behavior, such as the best times for completing tasks, most consistent habits, or potential areas for improvement.
`,
});

const generateAIInsightsFlow = ai.defineFlow(
  {
    name: 'generateAIInsightsFlow',
    inputSchema: GenerateAIInsightsInputSchema,
    outputSchema: GenerateAIInsightsOutputSchema,
  },
  async (input) => {
    const {output, errors} = await prompt(input);
     if (errors && errors.length > 0) {
      console.error('Error from generateAIInsightsPrompt:', errors);
      throw new Error(errors.map(e => e.message || String(e)).join(', '));
    }
    if (!output) {
      console.error('No output from generateAIInsightsPrompt for input:', input);
      throw new Error('AI failed to generate insights. The model might have returned an empty response.');
    }
    return output;
  }
);

