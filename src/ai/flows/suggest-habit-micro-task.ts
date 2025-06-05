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
  goal: z.string().describe('The user-defined habit goal (e.g., exercise daily).'),
  times: z.array(z.string()).describe('The available times for the user to perform the habit (e.g., [\