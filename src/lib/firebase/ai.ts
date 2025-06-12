
// --- Internal Imports ---
import {
  generateAIInsights as genkitGenerateAIInsightsFlow,
  type GenerateAIInsightsInput,
  type GenerateAIInsightsOutput,
} from '@/ai/flows/generate-ai-insights';
import {
  suggestHabitMicroTask as genkitSuggestHabitMicroTaskFlow,
  type SuggestHabitMicroTaskInput,
  type SuggestHabitMicroTaskOutput,
} from '@/ai/flows/suggest-habit-micro-task';
// Import other AI flow wrappers if you create more

// --- AI Flow Wrapper Functions ---
export const generateAIInsights = async (
  input: GenerateAIInsightsInput
): Promise<GenerateAIInsightsOutput> => {
  // Potentially add pre-processing, logging, or error handling specific to Firebase context here
  return genkitGenerateAIInsightsFlow(input);
};

export const suggestHabitMicroTask = async (
  input: SuggestHabitMicroTaskInput
): Promise<SuggestHabitMicroTaskOutput> => {
  // Potentially add pre-processing, logging, or error handling specific to Firebase context here
  return genkitSuggestHabitMicroTaskFlow(input);
};
