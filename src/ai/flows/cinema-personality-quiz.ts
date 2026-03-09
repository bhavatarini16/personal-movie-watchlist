
'use server';
/**
 * @fileOverview An AI agent that determines a user's cinema personality based on a structured 10-question quiz.
 *
 * - cinemaPersonalityQuiz - A function that handles the cinema personality quiz process.
 * - CinemaPersonalityQuizInput - The input type for the cinemaPersonalityQuiz function.
 * - CinemaPersonalityQuizOutput - The return type for the cinemaPersonalityQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CinemaPersonalityQuizInputSchema = z.object({
  answers: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).describe('A list of questions and the user\'s chosen answers from the MCQ quiz.')
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
    .describe('A brief, engaging explanation of the determined cinema personality type.'),
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
  prompt: `You are an expert cinema personality analyzer. Your goal is to determine a user's unique 'cinema personality' based on their answers to a 10-question MCQ quiz.

User Quiz Answers:
{{#each answers}}
Q: {{{this.question}}}
A: {{{this.answer}}}
{{/each}}

Based on these specific preferences regarding pacing, genre, narrative structure, and visual style, categorize the user into a fitting personality type. 

Example types include but are not limited to: 'Action Addict', 'Sci-Fi Thinker', 'Drama Lover', 'Comedy Relaxer', 'Arthouse Aficionado', 'Thriller Seeker', 'Fantasy Fanatic', 'Horror Hound', 'Indie Explorer', 'Documentary Devotee', 'Emotional Story Lover'.

Provide a concise, catchy name for the personality type and a short, engaging description.
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
