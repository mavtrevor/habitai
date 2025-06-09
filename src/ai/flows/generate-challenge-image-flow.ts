
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
      const {media, errors, output: textOutputForDebug} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', 
        prompt: input.prompt,
        config: {
          responseModalities: ['IMAGE', 'TEXT'], // Ensure TEXT is included as per Genkit docs for image models
        },
      });

      if (errors && errors.length > 0) {
        console.error('Errors during image generation call:', errors);
        const errorMessages = errors.map(e => e.message || String(e)).join(', ');
        // Include textOutputForDebug if available and relevant for debugging certain types of errors
        console.error('Text output (if any) during image generation error:', textOutputForDebug);
        throw new Error(`AI model returned errors: ${errorMessages}`);
      }

      if (media && media.url) {
        return { imageUrl: media.url };
      } else {
        console.error('Image generation did not return a valid media URL. Text output (if any):', textOutputForDebug);
        throw new Error('Image generation did not return a valid media URL, and no specific errors were reported by the model.');
      }
    } catch (error) {
      console.error('Error in generateChallengeImageFlow:', error);
      // Ensure we don't just re-wrap an already specific error message too generically
      if (error instanceof Error && error.message.startsWith('AI model returned errors:')) {
          throw error;
      }
      if (error instanceof Error && error.message.includes('Image generation did not return a valid media URL')) {
          throw error;
      }
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
