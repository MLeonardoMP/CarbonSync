'use server';

/**
 * @fileOverview An AI agent that suggests routes optimized for emissions.
 *
 * - suggestEmissionOptimizedRoutes - A function that suggests routes optimized for emissions.
 * - SuggestEmissionOptimizedRoutesInput - The input type for the suggestEmissionOptimizedRoutes function.
 * - SuggestEmissionOptimizedRoutesOutput - The return type for the suggestEmissionOptimizedRoutes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestEmissionOptimizedRoutesInputSchema = z.object({
  origin: z.string().describe('The starting point of the route.'),
  destination: z.string().describe('The destination point of the route.'),
  modeOfTransport: z
    .enum(['truck', 'rail', 'sea'])
    .describe('The mode of transport to be used.'),
  cargoWeightTons: z
    .number()
    .describe('The weight of the cargo in tons.')
    .optional(),
  fuelType: z.string().describe('The fuel type being used.').optional(),
  priority: z
    .enum(['cost', 'speed', 'emissions'])
    .describe(
      'The priority for route optimization.  If emissions is chosen, routes will be optimized for emissions. If cost is chosen, routes will be optimized for cost. If speed is chosen, routes will be optimized for speed.'
    ),
});
export type SuggestEmissionOptimizedRoutesInput = z.infer<
  typeof SuggestEmissionOptimizedRoutesInputSchema
>;

const RouteSuggestionSchema = z.object({
  routeDescription: z
    .string()
    .describe('A description of the suggested route.'),
  estimatedCO2eEmissions: z
    .number()
    .describe('The estimated CO2e emissions for the route in kilograms.'),
  estimatedTime: z
    .string()
    .describe('The estimated travel time for the route.'),
  estimatedCost: z
    .number()
    .describe('The estimated cost for the route in USD.'),
});

const SuggestEmissionOptimizedRoutesOutputSchema = z.object({
  suggestions: z.array(RouteSuggestionSchema).describe(
    'A list of suggested routes, optimized for emissions, including descriptions, estimated emissions, travel time, and cost.'
  ),
});
export type SuggestEmissionOptimizedRoutesOutput = z.infer<
  typeof SuggestEmissionOptimizedRoutesOutputSchema
>;

export async function suggestEmissionOptimizedRoutes(
  input: SuggestEmissionOptimizedRoutesInput
): Promise<SuggestEmissionOptimizedRoutesOutput> {
  return suggestEmissionOptimizedRoutesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestEmissionOptimizedRoutesPrompt',
  input: {schema: SuggestEmissionOptimizedRoutesInputSchema},
  output: {schema: SuggestEmissionOptimizedRoutesOutputSchema},
  prompt: `You are an AI assistant that suggests routes optimized for emissions.

You will be given the origin, destination, mode of transport, cargo weight, fuel type and the priority and you will suggest routes optimized for the priority specified.

Origin: {{{origin}}}
Destination: {{{destination}}}
Mode of Transport: {{{modeOfTransport}}}
Cargo Weight (tons): {{{cargoWeightTons}}}
Fuel Type: {{{fuelType}}}
Priority: {{{priority}}}

Suggest routes optimized for the priority provided, including a description of the route, the estimated CO2e emissions in kilograms, the estimated travel time, and the estimated cost in USD.`,
});

const suggestEmissionOptimizedRoutesFlow = ai.defineFlow(
  {
    name: 'suggestEmissionOptimizedRoutesFlow',
    inputSchema: SuggestEmissionOptimizedRoutesInputSchema,
    outputSchema: SuggestEmissionOptimizedRoutesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
