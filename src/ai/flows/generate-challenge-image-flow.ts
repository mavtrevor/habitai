
'use server';
/**
 * @fileOverview A Genkit flow to generate an image for a challenge based on a prompt.
 *
 * - generateChallengeImage - Generates an image and returns its data URI.
 * - GenerateChallengeImageInput - Input schema for the flow.
 * - GenerateChallengeImageOutput - Output schema for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChallengeImageInputSchema = z.object({
  prompt: z.string().describe('A descriptive prompt for generating the challenge image. Should include title, category, and keywords.'),
});
export type GenerateChallengeImageInput = z.infer<typeof GenerateChallengeImageInputSchema>;

const GenerateChallengeImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The data URI of the generated image. Expected format: "data:image/png;base64,<encoded_data>".'),
});
export type GenerateChallengeImageOutput = z.infer<typeof GenerateChallengeImageOutputSchema>;

export async function generateChallengeImage(input: GenerateChallengeImageInput): Promise<GenerateChallengeImageOutput> {
  return generateChallengeImageFlow(input);
}

const generateChallengeImageFlow = ai.defineFlow(
  {
    name: 'generateChallengeImageFlow',
    inputSchema: GenerateChallengeImageInputSchema,
    outputSchema: GenerateChallengeImageOutputSchema,
  },
  async (input) => {
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // Ensure this model supports image generation
        prompt: input.prompt,
        config: {
          responseModalities: ['IMAGE'], // Request only IMAGE as output if TEXT is not needed
        },
      });

      if (media && media.url) {
        return { imageUrl: media.url };
      } else {
        throw new Error('Image generation did not return a valid media URL.');
      }
    } catch (error) {
      console.error('Error in generateChallengeImageFlow:', error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
