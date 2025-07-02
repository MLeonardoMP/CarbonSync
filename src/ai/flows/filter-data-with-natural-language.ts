'use server';
/**
 * @fileOverview A natural language query processor for filtering vehicle data.
 *
 * - filterDataWithNaturalLanguage - A function that processes a natural language query and returns a filter.
 * - FilterDataWithNaturalLanguageInput - The input type for the filterDataWithNaturalLanguage function.
 * - FilterDataWithNaturalLanguageOutput - The return type for the filterDataWithNaturalLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterDataWithNaturalLanguageInputSchema = z.object({
  query: z.string().describe('The natural language query to filter data.'),
});
export type FilterDataWithNaturalLanguageInput = z.infer<typeof FilterDataWithNaturalLanguageInputSchema>;

const FilterDataWithNaturalLanguageOutputSchema = z.object({
  filter: z.string().describe('A string representation of the filter to apply to the data.'),
});
export type FilterDataWithNaturalLanguageOutput = z.infer<typeof FilterDataWithNaturalLanguageOutputSchema>;

export async function filterDataWithNaturalLanguage(input: FilterDataWithNaturalLanguageInput): Promise<FilterDataWithNaturalLanguageOutput> {
  return filterDataWithNaturalLanguageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'filterDataWithNaturalLanguagePrompt',
  input: {schema: FilterDataWithNaturalLanguageInputSchema},
  output: {schema: FilterDataWithNaturalLanguageOutputSchema},
  prompt: `You are an AI assistant that helps users filter vehicle data based on natural language queries.

  The vehicle data includes information such as mode (truck, rail, sea), region, carrier, emission threshold, etc.

  Your task is to convert the natural language query into a filter string that can be used to filter the data.

  For example, if the query is "show all shipments over 5 tons CO2", the filter string should be "emissions > 5".

  If the query is "show all trucks in Europe", the filter string should be "mode = 'truck' AND region = 'Europe'".

  Make sure that the filter string is valid and can be used to filter the data.

  Query: {{{query}}}
  `, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  }
});

const filterDataWithNaturalLanguageFlow = ai.defineFlow(
  {
    name: 'filterDataWithNaturalLanguageFlow',
    inputSchema: FilterDataWithNaturalLanguageInputSchema,
    outputSchema: FilterDataWithNaturalLanguageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
