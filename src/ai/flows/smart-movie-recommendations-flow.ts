'use server';
/**
 * @fileOverview A Genkit flow for generating smart movie recommendations.
 *
 * - smartMovieRecommendations - A function that handles the movie recommendation process.
 * - SmartMovieRecommendationsInput - The input type for the smartMovieRecommendations function.
 * - SmartMovieRecommendationsOutput - The return type for the smartMovieRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartMovieRecommendationsInputSchema = z.object({
  watchedMovies: z.array(
    z.object({
      title: z.string().describe('The title of the movie.'),
      genres: z.array(z.string()).describe('A list of genres for the movie.'),
      rating: z
        .number()
        .min(1)
        .max(10)
        .describe('The user\'s personal rating for the movie (1-10).'),
    })
  ).describe('A list of movies the user has watched, along with their genres and personal ratings.'),
  favoriteGenres: z.array(z.string()).describe('A list of genres the user explicitly considers their favorites.'),
});
export type SmartMovieRecommendationsInput = z.infer<typeof SmartMovieRecommendationsInputSchema>;

const SmartMovieRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string().describe('The title of the recommended movie.'),
      reason: z.string().describe('A brief explanation of why this movie is recommended.'),
    })
  ).describe('A list of movie recommendations tailored to the user\'s preferences.'),
});
export type SmartMovieRecommendationsOutput = z.infer<typeof SmartMovieRecommendationsOutputSchema>;

export async function smartMovieRecommendations(
  input: SmartMovieRecommendationsInput
): Promise<SmartMovieRecommendationsOutput> {
  return smartMovieRecommendationsFlow(input);
}

const recommendMoviesPrompt = ai.definePrompt({
  name: 'recommendMoviesPrompt',
  input: { schema: SmartMovieRecommendationsInputSchema },
  output: { schema: SmartMovieRecommendationsOutputSchema },
  prompt: `You are an expert movie recommender.

Based on the user's watched movies, their ratings, and their favorite genres, suggest new movies they would enjoy. Provide a brief reason for each recommendation, explicitly linking it to their stated preferences.

Here is the user's watched movie history:
{{#if watchedMovies}}
{{#each watchedMovies}}
- Title: {{{this.title}}}, Genres: {{#each this.genres}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, My Rating: {{{this.rating}}}/10
{{/each}}
{{else}}
No watched movies provided.
{{/if}}

Here are the user's explicitly favorite genres:
{{#if favoriteGenres}}
{{#each favoriteGenres}}
- {{{this}}}
{{/each}}
{{else}}
No favorite genres provided.
{{/if}}

Provide 3-5 movie recommendations in JSON format, each with a 'title' and a 'reason' explaining why it's a good fit based on the provided information.`,
});

const smartMovieRecommendationsFlow = ai.defineFlow(
  {
    name: 'smartMovieRecommendationsFlow',
    inputSchema: SmartMovieRecommendationsInputSchema,
    outputSchema: SmartMovieRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await recommendMoviesPrompt(input);
    return output!;
  }
);
