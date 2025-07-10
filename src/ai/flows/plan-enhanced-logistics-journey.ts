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
    riskAssessment: z.object({
      overall: z.enum(['low', 'medium', 'high']).describe('Overall route risk level'),
      factors: z.array(z.string()).describe('Key risk factors identified'),
      mitigations: z.array(z.string()).describe('Recommended risk mitigations')
    }).describe('Risk assessment for the route'),
    optimizations: z.object({
      alternativeRoutes: z.array(z.string()).describe('Suggested alternative routes'),
      timingRecommendations: z.array(z.string()).describe('Optimal timing suggestions'),
      costSavingOpportunities: z.array(z.string()).describe('Potential cost savings')
    }).describe('Route optimization suggestions'),
    marketConditions: z.object({
      fuelPrices: z.string().describe('Current fuel price trends'),
      portCongestion: z.string().describe('Port congestion status'),
      seasonalFactors: z.string().describe('Seasonal considerations')
    }).describe('Current market and operational conditions')
  }).describe('Enhanced analysis of the route composition with real-world intelligence'),
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

  // Validate the route and identify potential issues
  const validation = routeService.validateRoute(enhancedRoute);
  
  // Use AI to enhance the route with emissions, cost, and time estimates
  // Include validation results for better decision making
  const enhancedOutput = await planEnhancedLogisticsJourneyFlow({
    route: enhancedRoute,
    cargoWeightTons: leg.cargoWeightTons,
    validation: validation
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
      cargoWeightTons: z.number().optional(),
      routeResearch: z.string().optional().describe('Research data about the route conditions, ports, and logistics information')
    })
  },
  output: { schema: PlanEnhancedLogisticsJourneyOutputSchema },
  prompt: `You are an expert logistics analyst with access to real-time maritime and logistics intelligence, specializing in intelligent route optimization that considers both land-only and multimodal solutions.

**IMPORTANT ROUTING PHILOSOPHY:**
- The route calculation system now uses intelligent mode selection - it will AUTOMATICALLY choose land-only for domestic/short routes
- For domestic routes (same country), the system defaults to single truck segments for optimal efficiency
- Sea routes are only used when they provide clear advantages: crossing water bodies, or long international distances
- When you see a single land segment, this represents an optimal direct truck route

Given the following route with segments and research data, calculate detailed emissions, costs, and time estimates for each segment while validating the transport mode decisions.

**Route Information:**
- Description: {{route.route_description}}
- Total Distance: {{route.total_distance_km}} km
- Total Waypoints: {{route.total_waypoints}}
- Cargo Weight: {{#if cargoWeightTons}}{{cargoWeightTons}} tons{{else}}Not specified{{/if}}

**Route Segments:**
{{#each route.segments}}
- Segment {{@index}}: {{type}} - {{description}} ({{distance_km}} km, {{waypoints.length}} waypoints)
{{/each}}

{{#if routeResearch}}
**Real-time Route Intelligence:**
{{routeResearch}}
{{/if}}

**Enhanced Task Requirements:**

1. **Route Mode Validation & Optimization**: 
   - VALIDATE that the chosen route type is optimal and efficient for the journey
   - For single land segments: This represents an optimal direct truck route - calculate accordingly
   - For multimodal routes: Validate that sea segments provide clear value (water crossing, long distance)
   - Provide alternative recommendations if the route type could be improved

2. **Intelligent Emissions Calculation**: For each segment, calculate CO2e emissions considering:
   - **Land segments**: Truck transport efficiency in the region (~60-120g CO2e per ton-km depending on infrastructure)
   - **Sea segments**: Maritime efficiency for justified routes (~10-40g CO2e per ton-km)
   - Regional transport standards and fuel efficiency
   - Real-world operational factors from research data

3. **Practical Time Estimation**: For each segment, estimate travel time considering:
   - **Land segments**: Regional highway quality, traffic patterns, border procedures
   - **Sea segments**: Port operations, weather, canal transit times (only when appropriate)
   - Domestic vs international routing differences
   - Infrastructure capabilities and limitations

4. **Realistic Cost Estimation**: For each segment, estimate costs based on:
   - Local and regional trucking rates
   - Maritime rates (only when sea transport is justified)
   - Fuel costs and regional variations
   - Port fees and handling charges (when applicable)
   - Border crossing and documentation costs

5. **Route Optimization Analysis**: Provide enhanced analysis including:
   - Assessment of route efficiency and mode selection appropriateness
   - Infrastructure and timing optimization suggestions
   - Risk factors specific to the chosen transport modes
   - Cost-benefit analysis of current route vs alternatives

**SPECIFIC GUIDANCE FOR ROUTE TYPES:**
- **Single land segment**: Optimal direct truck route - estimate accordingly with realistic highway speeds and costs
- **Multimodal with sea segments**: Validate sea segments are justified by water crossings or significant distance/cost benefits
- **Short domestic routes**: Should typically be single land segments with competitive truck rates

Use the research data to provide realistic, current industry insights and make intelligent recommendations about transport mode selection. Prioritize practical, efficient, and cost-effective routing decisions.

Return the enhanced route with all calculated values, mode optimization recommendations, and strategic analysis.`,
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
      cargoWeightTons: z.number().optional(),
      validation: z.object({
        isValid: z.boolean(),
        warnings: z.array(z.string()),
        suggestions: z.array(z.string())
      }).optional()
    }),
    outputSchema: PlanEnhancedLogisticsJourneyOutputSchema,
  },
  async (input) => {
    // First, research the route to gather real-time logistics intelligence using Gemini 2.0's web access
    const routeResearch = await ai.generate({
      prompt: `Please search the web for current information about the following logistics route and provide actionable intelligence:

Route: ${input.route.route_description}
Segments: ${input.route.segments.map((s, i) => `${i+1}. ${s.type} - ${s.description}`).join(', ')}

${input.validation ? `
Route Validation Issues:
- Valid: ${input.validation.isValid}
- Warnings: ${input.validation.warnings.join(', ')}
- Suggestions: ${input.validation.suggestions.join(', ')}
` : ''}

Research Requirements:
1. Current port conditions, congestion levels, and operational status for major ports in this route
2. Seasonal weather patterns, current conditions, and optimal timing for this route
3. Geopolitical considerations, safety concerns, and any route disruptions
4. Infrastructure status, capacity limitations, and recent developments
5. Current shipping rates, fuel costs, and market conditions affecting this route
6. Alternative routes, optimization opportunities, or recommended changes
7. Any recent incidents, closures, or significant changes affecting these segments

Focus on practical, current information that would directly impact routing decisions, costs, timing, and safety. Look for recent news, port authorities' announcements, shipping industry reports, and weather forecasts.

Provide a comprehensive summary of findings that will help optimize the route planning.`,
      model: 'googleai/gemini-2.0-flash',
      config: {
        temperature: 0.3,
      },
    });

    const researchData = routeResearch.text || '';

    // Now enhance the route with this research data
    const { output } = await enhancedPrompt({
      route: input.route,
      cargoWeightTons: input.cargoWeightTons,
      routeResearch: researchData
    });
    
    return output!;
  }
);
