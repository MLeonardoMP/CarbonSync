'use server';

/**
 * @fileOverview Enhanced AI flow for segment-focused logistics planning with maritime routes
 *
 * - planEnhancedLogisticsJourney - A function that handles enhanced logistics planning with route segments
 * - PlanEnhancedLogisticsJourneyInput - The input type for the enhanced planning function
 * - PlanEnhancedLogisticsJourneyOutput - The return type for the enhanced planning function
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { EnhancedRouteService, type EnhancedRoute } from '@/lib/enhanced-route-service';

const JourneyLegSchema = z.object({
  origin: z.string().describe('The starting point of the journey leg.'),
  destination: z.string().describe('The destination point of the journey leg.'),
  cargoWeightTons: z.number().optional().describe('The weight of the cargo in tons.'),
});

const PlanEnhancedLogisticsJourneyInputSchema = z.object({
  legs: z.array(JourneyLegSchema).describe('The list of legs in the user-defined journey.'),
});
export type PlanEnhancedLogisticsJourneyInput = z.infer<typeof PlanEnhancedLogisticsJourneyInputSchema>;

const RouteSegmentSchema = z.object({
  type: z.enum(['sea', 'land']).describe('The type of the route segment'),
  origin: z.object({ lat: z.number(), lon: z.number() }).describe('Origin coordinates'),
  destination: z.object({ lat: z.number(), lon: z.number() }).describe('Destination coordinates'),
  waypoints: z.array(z.object({ lat: z.number(), lon: z.number() })).describe('Route waypoints'),
  description: z.string().describe('Description of the route segment'),
  distance_km: z.number().describe('Distance of the segment in kilometers'),
  estimatedCO2eEmissions: z.number().describe('Estimated CO2e emissions for this segment in kg'),
  estimatedTime: z.string().describe('Estimated travel time for this segment'),
  estimatedCost: z.number().describe('Estimated cost for this segment in USD'),
});

const EnhancedRouteSchema = z.object({
  segments: z.array(RouteSegmentSchema).describe('The route segments'),
  total_distance_km: z.number().describe('Total distance in kilometers'),
  total_waypoints: z.number().describe('Total number of waypoints'),
  route_description: z.string().describe('Description of the complete route'),
  totalCO2eEmissions: z.number().describe('Total estimated CO2e emissions in kg'),
  totalEstimatedTime: z.string().describe('Total estimated travel time'),
  totalEstimatedCost: z.number().describe('Total estimated cost in USD'),
});

const PlanEnhancedLogisticsJourneyOutputSchema = z.object({
  calculatedRoute: EnhancedRouteSchema.describe("The enhanced route with segment details"),
  routeGeometry: z.string().describe('GeoJSON FeatureCollection representing all route segments as a JSON string'),
  analysis: z.object({
    seaDistance: z.number().describe('Total sea distance in km'),
    landDistance: z.number().describe('Total land distance in km'),
    seaSegmentCount: z.number().describe('Number of sea segments'),
    landSegmentCount: z.number().describe('Number of land segments'),
    majorPorts: z.array(z.string()).describe('Major ports used in the route'),
  }).describe('Analysis of the route composition'),
});
export type PlanEnhancedLogisticsJourneyOutput = z.infer<typeof PlanEnhancedLogisticsJourneyOutputSchema>;

export async function planEnhancedLogisticsJourney(
  input: PlanEnhancedLogisticsJourneyInput
): Promise<PlanEnhancedLogisticsJourneyOutput> {
  const routeService = new EnhancedRouteService();
  
  // For now, handle single leg journeys (can be extended to multi-leg)
  const leg = input.legs[0];
  if (!leg) {
    throw new Error('At least one journey leg is required');
  }

  // Calculate the enhanced route using our Python service
  const routeResult = await routeService.calculateEnhancedRoute(leg.origin, leg.destination);
  
  if (!routeResult.success || !routeResult.route) {
    throw new Error(`Failed to calculate route: ${routeResult.error}`);
  }

  const enhancedRoute = routeResult.route;

  // Use AI to enhance the route with emissions, cost, and time estimates
  const enhancedOutput = await planEnhancedLogisticsJourneyFlow({
    route: enhancedRoute,
    cargoWeightTons: leg.cargoWeightTons
  });

  // Generate GeoJSON for the route
  const geoJson = routeService.routeToGeoJSON(enhancedRoute);

  return {
    ...enhancedOutput,
    routeGeometry: JSON.stringify(geoJson)
  };
}

const enhancedPrompt = ai.definePrompt({
  name: 'enhanceLogisticsRoutePrompt',
  input: {
    schema: z.object({
      route: z.object({
        segments: z.array(z.object({
          type: z.string(),
          description: z.string(),
          distance_km: z.number(),
          waypoints: z.array(z.object({ lon: z.number(), lat: z.number() }))
        })),
        total_distance_km: z.number(),
        total_waypoints: z.number(),
        route_description: z.string()
      }),
      cargoWeightTons: z.number().optional()
    })
  },
  output: { schema: PlanEnhancedLogisticsJourneyOutputSchema },
  prompt: `You are an expert logistics analyst specializing in segment-focused route planning and emissions calculation.

Given the following route with segments, calculate detailed emissions, costs, and time estimates for each segment and provide a comprehensive analysis.

**Route Information:**
- Description: {{route.route_description}}
- Total Distance: {{route.total_distance_km}} km
- Total Waypoints: {{route.total_waypoints}}
- Cargo Weight: {{#if cargoWeightTons}}{{cargoWeightTons}} tons{{else}}Not specified{{/if}}

**Route Segments:**
{{#each route.segments}}
- Segment {{@index}}: {{type}} - {{description}} ({{distance_km}} km, {{waypoints.length}} waypoints)
{{/each}}

**Task Requirements:**

1. **Emissions Calculation**: For each segment, calculate CO2e emissions based on:
   - Sea segments: Use maritime shipping emission factors (~10-40g CO2e per ton-km depending on vessel type)
   - Land segments: Use appropriate land transport (truck: ~60-150g CO2e per ton-km, rail: ~20-40g CO2e per ton-km)
   - Consider cargo weight if provided, use average cargo weight if not specified

2. **Time Estimation**: For each segment, estimate travel time based on:
   - Sea segments: Average speed 15-25 knots
   - Land segments: Average speed 60-80 km/h for trucks, 50-100 km/h for rail

3. **Cost Estimation**: For each segment, estimate costs based on:
   - Sea segments: $50-200 per TEU per 1000km depending on route
   - Land segments: $1-3 per km for trucking, $0.5-1.5 per km for rail

4. **Route Analysis**: Provide analysis including:
   - Total sea vs land distance breakdown
   - Count of sea vs land segments
   - Major ports identified in the route

Use realistic industry standards and provide practical estimates. The route has been optimized for the most practical combination of sea and land transport.

Return the enhanced route with all calculated values and analysis.`,
});

const planEnhancedLogisticsJourneyFlow = ai.defineFlow(
  {
    name: 'planEnhancedLogisticsJourneyFlow',
    inputSchema: z.object({
      route: z.object({
        segments: z.array(z.object({
          type: z.string(),
          description: z.string(),
          distance_km: z.number(),
          waypoints: z.array(z.object({ lon: z.number(), lat: z.number() }))
        })),
        total_distance_km: z.number(),
        total_waypoints: z.number(),
        route_description: z.string()
      }),
      cargoWeightTons: z.number().optional()
    }),
    outputSchema: PlanEnhancedLogisticsJourneyOutputSchema,
  },
  async (input) => {
    const { output } = await enhancedPrompt(input);
    return output!;
  }
);
