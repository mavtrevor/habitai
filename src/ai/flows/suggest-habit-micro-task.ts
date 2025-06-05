'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting actionable micro-tasks related to user-defined habit goals, available times, and preferences.
 *
 * - suggestHabitMicroTask - A function that suggests a micro-task for a given habit.
 * - SuggestHabitMicroTaskInput - The input type for the suggestHabitMicroTask function.
 * - SuggestHabitMicroTaskOutput - The return type for the suggestHabitMicroTask function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestHabitMicroTaskInputSchema = z.object({
  goal: z.string().describe('The user-defined habit goal (e.g., "exercise daily").'),
  times: z.array(z.string()).describe('The available times for the user to perform the habit (e.g., ["morning", "afternoon", "evening", "anytime"]).'),
  preferences: z.object({
    difficulty: z.string().describe('The preferred difficulty for the micro-task (e.g., "easy", "medium", "challenging").')
  }).describe('User preferences for task generation.')
});
export type SuggestHabitMicroTaskInput = z.infer<typeof SuggestHabitMicroTaskInputSchema>;

const SuggestHabitMicroTaskOutputSchema = z.object({
  microTaskSuggestion: z.string().describe('An AI-generated micro-task suggestion tailored to the user\'s habit goal, available times, and preferences.'),
});
export type SuggestHabitMicroTaskOutput = z.infer<typeof SuggestHabitMicroTaskOutputSchema>;

export async function suggestHabitMicroTask(input: SuggestHabitMicroTaskInput): Promise<SuggestHabitMicroTaskOutput> {
  return suggestHabitMicroTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestHabitMicroTaskPrompt',
  input: {schema: SuggestHabitMicroTaskInputSchema},
  output: {schema: SuggestHabitMicroTaskOutputSchema},
  prompt: `You are an AI assistant specialized in helping users break down their habit goals into small, actionable micro-tasks.

Given the user's habit goal: {{{goal}}}
Their available times are: {{#if times}} {{#each times}} "{{this}}" {{/each}} {{else}} Not specified {{/if}}
Their preferred task difficulty is: {{preferences.difficulty}}

Suggest a single, concrete, and actionable micro-task that the user can perform. The task should be relevant to their goal, fit their available times (if specified), and match their preferred difficulty.
The suggestion should be concise and direct.
Example: If goal is "read more", times are ["evening"], difficulty "easy", suggest: "Read one page of a book tonight before bed."
`,
});

const suggestHabitMicroTaskFlow = ai.defineFlow(
  {
    name: 'suggestHabitMicroTaskFlow',
    inputSchema: SuggestHabitMicroTaskInputSchema,
    outputSchema: SuggestHabitMicroTaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
