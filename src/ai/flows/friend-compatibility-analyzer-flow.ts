'use server';
/**
 * @fileOverview This file implements the Genkit flow for the Friend Compatibility Analyzer feature.
 * It compares two users' movie watching habits to determine a compatibility score,
 * identify shared movies, and generate AI-powered movie suggestions they both might enjoy.
 *
 * - analyzeFriendCompatibility - The main function to analyze friend compatibility.
 * - FriendCompatibilityAnalyzerInput - The input type for the analysis.
 * - FriendCompatibilityAnalyzerOutput - The output type for the analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MovieSchema = z.object({
  title: z.string().describe('The title of the movie.'),
  genres: z.array(z.string()).describe('A list of genres for the movie.'),
  rating: z.number().min(1).max(10).describe('The user\'s rating for the movie (1-10).'),
});

const FriendCompatibilityAnalyzerInputSchema = z.object({
  user1Movies: z.array(MovieSchema).describe('List of movies watched by the first user.'),
  user2Movies: z.array(MovieSchema).describe('List of movies watched by the second user.'),
});
export type FriendCompatibilityAnalyzerInput = z.infer<typeof FriendCompatibilityAnalyzerInputSchema>;

const FriendCompatibilityAnalyzerOutputSchema = z.object({
  compatibilityScore: z.number().min(0).max(100).describe('A score from 0 to 100 indicating movie taste compatibility between the two users.'),
  sharedMovies: z.array(z.string()).describe('A list of movie titles that both users have watched.'),
  suggestedMovies: z.array(z.string()).describe('A list of AI-generated movie suggestions that both users might enjoy watching together.'),
});
export type FriendCompatibilityAnalyzerOutput = z.infer<typeof FriendCompatibilityAnalyzerOutputSchema>;

// Helper function to extract unique genres from a list of movies
function getUniqueGenres(movies: z.infer<typeof MovieSchema>[]): Set<string> {
  const genres = new Set<string>();
  movies.forEach(movie => {
    movie.genres.forEach(genre => genres.add(genre.toLowerCase()));
  });
  return genres;
}

// Helper function to summarize user preferences for the LLM prompt
function summarizeUserPreferences(userMovies: z.infer<typeof MovieSchema>[], userName: string): string {
  const genres = Array.from(getUniqueGenres(userMovies));
  const topRatedMovies = userMovies
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map(m => `${m.title} (Rated ${m.rating}/10)`);

  let summary = `${userName} has watched ${userMovies.length} movies. `;
  if (genres.length > 0) {
    summary += `Their preferred genres include: ${genres.join(', ')}. `;
  }
  if (topRatedMovies.length > 0) {
    summary += `Some of their highly rated movies are: ${topRatedMovies.join(', ')}.`;
  } else {
    summary += `No movies with ratings were provided.`;
  }
  return summary;
}


const friendCompatibilityPrompt = ai.definePrompt({
  name: 'friendCompatibilityPrompt',
  input: {
    schema: z.object({
      user1Summary: z.string().describe('A summary of the first user\'s movie preferences.'),
      user2Summary: z.string().describe('A summary of the second user\'s movie preferences.'),
      sharedGenres: z.array(z.string()).describe('A list of genres common to both users.'),
      uniqueGenres: z.array(z.string()).describe('A list of all unique genres across both users.'),
    }),
  },
  output: {
    schema: z.object({
      suggestedMovies: z.array(z.string()).describe('A list of movie titles both users would enjoy.'),
    }),
  },
  prompt: `You are an expert movie recommender. Your task is to suggest movies that two friends would both enjoy watching together, based on their movie watching habits and preferences.

Friend 1's preferences:
{{{user1Summary}}}

Friend 2's preferences:
{{{user2Summary}}}

They share common interests in these genres: {{{sharedGenres}}}

Considering their individual preferences and shared interests, suggest 5-7 distinct movie titles that they both would likely enjoy.
The suggestions should ideally lean towards their common genres ({{{sharedGenres}}}), but also consider their unique genre interests ({{{uniqueGenres}}}) to offer some variety.
Do not suggest movies already present in their watched lists (implicitly handled by the prompt, as we're giving a summary, not full lists).
Respond with a JSON object containing a single key "suggestedMovies", which is an array of strings representing the movie titles.`,
});

const friendCompatibilityAnalyzerFlow = ai.defineFlow(
  {
    name: 'friendCompatibilityAnalyzerFlow',
    inputSchema: FriendCompatibilityAnalyzerInputSchema,
    outputSchema: FriendCompatibilityAnalyzerOutputSchema,
  },
  async (input) => {
    const { user1Movies, user2Movies } = input;

    // 1. Identify shared movies
    const user1Titles = new Set(user1Movies.map(m => m.title.toLowerCase()));
    // Using a Map to preserve original casing of shared movie titles.
    const user2TitleMap = new Map(user2Movies.map(m => [m.title.toLowerCase(), m.title]));

    const sharedMovies: string[] = [];
    user1Movies.forEach(m => {
      if (user2TitleMap.has(m.title.toLowerCase())) {
        sharedMovies.push(user2TitleMap.get(m.title.toLowerCase())!);
      }
    });

    // 2. Calculate compatibility score
    const user1UniqueGenres = getUniqueGenres(user1Movies);
    const user2UniqueGenres = getUniqueGenres(user2Movies);

    const allGenres = new Set<string>();
    user1UniqueGenres.forEach(genre => allGenres.add(genre));
    user2UniqueGenres.forEach(genre => allGenres.add(genre));

    let sharedGenreCount = 0;
    const sharedGenresArray: string[] = [];
    user1UniqueGenres.forEach(genre => {
      if (user2UniqueGenres.has(genre)) {
        sharedGenreCount++;
        sharedGenresArray.push(genre);
      }
    });

    // Simple compatibility score calculation:
    // Weighted average of shared genres and shared movies
    let genreCompatibilityRatio = 0;
    if (allGenres.size > 0) {
      genreCompatibilityRatio = sharedGenreCount / allGenres.size;
    }

    // A small boost for shared movies, capped to prevent over-inflating
    // Assuming 5 shared movies is a good indication, contributing max points for this part
    const sharedMoviesRatio = Math.min(sharedMovies.length / 5, 1);

    // Combine them, genre compatibility is more significant
    const compatibilityScore = Math.round((genreCompatibilityRatio * 70 + sharedMoviesRatio * 30));

    // Ensure score is within 0-100 bounds
    const finalCompatibilityScore = Math.max(0, Math.min(100, compatibilityScore));

    // 3. Generate movie suggestions using the LLM
    const user1Summary = summarizeUserPreferences(user1Movies, 'Friend 1');
    const user2Summary = summarizeUserPreferences(user2Movies, 'Friend 2');
    const uniqueGenres = Array.from(allGenres);

    const { output } = await friendCompatibilityPrompt({
      user1Summary,
      user2Summary,
      sharedGenres: sharedGenresArray,
      uniqueGenres: uniqueGenres,
    });

    return {
      compatibilityScore: finalCompatibilityScore,
      sharedMovies,
      suggestedMovies: output!.suggestedMovies,
    };
  }
);

export async function analyzeFriendCompatibility(
  input: FriendCompatibilityAnalyzerInput
): Promise<FriendCompatibilityAnalyzerOutput> {
  return friendCompatibilityAnalyzerFlow(input);
}
