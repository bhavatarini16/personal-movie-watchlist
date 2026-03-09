'use server';
/**
 * @fileOverview An AI agent that determines a user's cinema personality based on their movie preferences.
 *
 * - cinemaPersonalityQuiz - A function that handles the cinema personality quiz process.
 * - CinemaPersonalityQuizInput - The input type for the cinemaPersonalityQuiz function.
 * - CinemaPersonalityQuizOutput - The return type for the cinemaPersonalityQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CinemaPersonalityQuizInputSchema = z.object({
  favoriteGenres: z
    .array(z.string())
    .describe('A list of the user\u0027s favorite movie genres.'),
  favoriteMovies: z
    .array(z.string())
    .describe(
      'A list of specific favorite movies provided by the user, and optionally why they like them.'
    ),
  movieExperience: z
    .string()
    .describe(
      'A description of what kind of movie experience the user seeks (e.g., excitement, thought-provoking, emotional).'
    ),
});
export type CinemaPersonalityQuizInput = z.infer<
  typeof CinemaPersonalityQuizInputSchema
>;

const CinemaPersonalityQuizOutputSchema = z.object({
  personalityType: z
    .string()
    .describe(
      'The cinema personality type (e.g., Action Addict, Sci-Fi Thinker, Drama Lover, Comedy Enthusiast, Arthouse Aficionado, Thriller Seeker).'
    ),
  description: z
    .string()
    .describe('A brief explanation of the determined cinema personality type.'),
});
export type CinemaPersonalityQuizOutput = z.infer<
  typeof CinemaPersonalityQuizOutputSchema
>;

export async function cinemaPersonalityQuiz(
  input: CinemaPersonalityQuizInput
): Promise<CinemaPersonalityQuizOutput> {
  return cinemaPersonalityQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cinemaPersonalityQuizPrompt',
  input: { schema: CinemaPersonalityQuizInputSchema },
  output: { schema: CinemaPersonalityQuizOutputSchema },
  prompt: `You are an expert cinema personality analyzer. Your goal is to determine a user's unique 'cinema personality' based on their movie preferences.

Consider the following information provided by the user:

Favorite Genres: {{#each favoriteGenres}}- {{{this}}}\n{{/each}}
Favorite Movies (and why): {{#each favoriteMovies}}- {{{this}}}\n{{/each}}
Desired Movie Experience: {{{movieExperience}}}

Based on these preferences, categorize the user into one of the following example personality types, or a similar fitting one: 'Action Addict', 'Sci-Fi Thinker', 'Drama Lover', 'Comedy Enthusiast', 'Arthouse Aficionado', 'Thriller Seeker', 'Fantasy Fanatic', 'Horror Hound', 'Documentary Devotee', 'Musical Maven'.

Provide a concise and engaging description for the determined personality type.
`,
});

const cinemaPersonalityQuizFlow = ai.defineFlow(
  {
    name: 'cinemaPersonalityQuizFlow',
    inputSchema: CinemaPersonalityQuizInputSchema,
    outputSchema: CinemaPersonalityQuizOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
