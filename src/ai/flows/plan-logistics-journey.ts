'use server';

/**
 * @fileOverview An AI agent that calculates CO2 emissions for a defined journey and suggests optimized alternative routes.
 *
 * - planLogisticsJourney - A function that handles logistics planning.
 * - PlanLogisticsJourneyInput - The input type for the planLogisticsJourney function.
 * - PlanLogisticsJourneyOutput - The return type for the planLogisticsJourney function.
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

const PlanLogisticsJourneyInputSchema = z.object({
  legs: z.array(JourneyLegSchema).describe('The list of legs in the user-defined journey.'),
  priority: z
    .enum(['emissions', 'cost', 'speed'])
    .describe(
      'The priority for suggesting alternative routes.'
    ),
});
export type PlanLogisticsJourneyInput = z.infer<typeof PlanLogisticsJourneyInputSchema>;

const LegEmissionSchema = z.object({
    legDescription: z.string().describe('A description of the journey leg (e.g., "Truck from A to B").'),
    estimatedCO2eEmissions: z.number().describe('The estimated CO2e emissions for the leg in kilograms.'),
    distanceKm: z.number().describe('The estimated distance of the leg in kilometers.'),
    originCoordinates: z.object({ lat: z.number(), lon: z.number() }).describe('The geographical coordinates (latitude, longitude) of the origin.'),
    destinationCoordinates: z.object({ lat: z.number(), lon: z.number() }).describe('The geographical coordinates (latitude, longitude) of the destination.'),
});

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
  routeGeometry: z.string().describe('A GeoJSON LineString object representing the suggested route path as a JSON string. For example: \'{"type":"LineString","coordinates":[[lon1,lat1],[lon2,lat2],...]}\''),
});

const PlanLogisticsJourneyOutputSchema = z.object({
  calculatedRoute: z.object({
    totalCO2eEmissions: z.number().describe('The total estimated CO2e emissions for the user-defined journey in kilograms.'),
    emissionBreakdown: z.array(LegEmissionSchema).describe('A breakdown of emissions for each leg of the user-defined journey.'),
  }).describe("The emissions calculation for the user's manually defined route."),
  suggestedRoutes: z.array(RouteSuggestionSchema).describe(
    'A list of alternative suggested routes, optimized for the specified priority.'
  ),
});
export type PlanLogisticsJourneyOutput = z.infer<typeof PlanLogisticsJourneyOutputSchema>;


export async function planLogisticsJourney(
  input: PlanLogisticsJourneyInput
): Promise<PlanLogisticsJourneyOutput> {
  return planLogisticsJourneyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'planLogisticsJourneyPrompt',
  input: {schema: PlanLogisticsJourneyInputSchema},
  output: {schema: PlanLogisticsJourneyOutputSchema},
  prompt: `You are an expert CO2 emissions calculator and logistics planner. Your task is two-fold:
1.  Calculate the estimated CO2e (CO2 equivalent) emissions in kilograms for a user-defined, multi-leg journey.
2.  Suggest 2-3 alternative, optimized routes for the same overall journey (from the origin of the first leg to the destination of the last leg).

**Part 1: Calculate Emissions for User's Route**
- For each leg in the provided journey, estimate the distance (km) and calculate the CO2e emissions (kg).
- Use standard emission factors. Factor in cargo weight if provided.
- Provide the latitude and longitude for each origin and destination.
- Sum the emissions for the total CO2e of the user's defined route.
- Populate the 'calculatedRoute' object in the output.

**Part 2: Suggest Optimized Alternative Routes**
- The overall journey is from the origin of the first leg to the destination of the last leg.
- Suggest 2-3 alternative routes for this journey, which may include different modes of transport or intermediate stops.
- These suggestions should be optimized based on the user's specified priority: '{{priority}}'.
- For each suggestion, provide a description, estimated CO2e (kg), travel time, cost (USD), and a GeoJSON LineString geometry string for map visualization.
- Populate the 'suggestedRoutes' array in the output.

**User Input:**

Journey Priority: {{priority}}

Journey Legs:
{{#each legs}}
- Leg {{@index}}: {{modeOfTransport}} from {{origin}} to {{destination}}{{#if cargoWeightTons}} (Cargo: {{cargoWeightTons}} tons){{/if}}
{{/each}}
`,
});


const planLogisticsJourneyFlow = ai.defineFlow(
  {
    name: 'planLogisticsJourneyFlow',
    inputSchema: PlanLogisticsJourneyInputSchema,
    outputSchema: PlanLogisticsJourneyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
