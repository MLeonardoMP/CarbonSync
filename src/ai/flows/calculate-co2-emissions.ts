'use server';

/**
 * @fileOverview An AI agent that calculates CO2 emissions for a multi-leg journey.
 *
 * - calculateCo2Emissions - A function that calculates CO2 emissions.
 * - CalculateCo2EmissionsInput - The input type for the calculateCo2Emissions function.
 * - CalculateCo2EmissionsOutput - The return type for the calculateCo2Emissions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JourneyLegSchema = z.object({
  origin: z.string().describe('The starting point of the journey leg.'),
  destination: z.string().describe('The destination point of the journey leg.'),
  modeOfTransport: z
    .enum(['truck', 'rail', 'sea', 'air'])
    .describe('The mode of transport for this leg.'),
  cargoWeightTons: z.number().optional().describe('The weight of the cargo in tons.'),
});

const CalculateCo2EmissionsInputSchema = z.object({
  legs: z.array(JourneyLegSchema).describe('The list of legs in the journey.'),
});
export type CalculateCo2EmissionsInput = z.infer<typeof CalculateCo2EmissionsInputSchema>;

const LegEmissionSchema = z.object({
    legDescription: z.string().describe('A description of the journey leg (e.g., "Truck from A to B").'),
    estimatedCO2eEmissions: z.number().describe('The estimated CO2e emissions for the leg in kilograms.'),
    distanceKm: z.number().describe('The estimated distance of the leg in kilometers.'),
});

const CalculateCo2EmissionsOutputSchema = z.object({
  totalCO2eEmissions: z.number().describe('The total estimated CO2e emissions for the entire journey in kilograms.'),
  emissionBreakdown: z.array(LegEmissionSchema).describe('A breakdown of emissions for each leg of the journey.'),
});
export type CalculateCo2EmissionsOutput = z.infer<typeof CalculateCo2EmissionsOutputSchema>;


export async function calculateCo2Emissions(
  input: CalculateCo2EmissionsInput
): Promise<CalculateCo2EmissionsOutput> {
  return calculateCo2EmissionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateCo2EmissionsPrompt',
  input: {schema: CalculateCo2EmissionsInputSchema},
  output: {schema: CalculateCo2EmissionsOutputSchema},
  prompt: `You are an expert CO2 emissions calculator for logistics. Your task is to calculate the estimated CO2e (CO2 equivalent) emissions in kilograms for a multi-leg journey.

You will be provided with a series of journey legs, each with an origin, destination, mode of transport, and optional cargo weight.

Use standard emission factors for each mode of transport. If cargo weight is provided, factor it into the calculation. If it's not, use an average for that mode.
First, for each leg, estimate the distance in kilometers between the origin and destination.
Then, calculate the CO2e emissions for that leg.
Finally, sum up the emissions for all legs to get the total.

Provide a breakdown of emissions for each leg, including a description of the leg, the estimated distance, and the estimated CO2e emissions. Also provide the total CO2e for the entire journey.

Journey Legs:
{{#each legs}}
- Leg {{@index}}: {{modeOfTransport}} from {{origin}} to {{destination}}{{#if cargoWeightTons}} (Cargo: {{cargoWeightTons}} tons){{/if}}
{{/each}}
`,
});


const calculateCo2EmissionsFlow = ai.defineFlow(
  {
    name: 'calculateCo2EmissionsFlow',
    inputSchema: CalculateCo2EmissionsInputSchema,
    outputSchema: CalculateCo2EmissionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
