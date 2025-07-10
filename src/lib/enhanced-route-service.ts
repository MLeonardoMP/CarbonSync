/**
 * Enhanced Route Service for segment-focused logistics planning
 */

import { spawn } from 'child_process';
import path from 'path';
import mbxClient from '@mapbox/mapbox-sdk';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';

export interface Coordinate {
  lon: number;
  lat: number;
}

export interface RouteSegment {
  type: 'sea' | 'land';
  origin: Coordinate;
  destination: Coordinate;
  waypoints: Coordinate[];
  description: string;
  distance_km: number;
}

export interface EnhancedRoute {
  segments: RouteSegment[];
  total_distance_km: number;
  total_waypoints: number;
  route_description: string;
}

export interface EnhancedRouteResponse {
  success: boolean;
  route?: EnhancedRoute;
  error?: string;
}

export class EnhancedRouteService {
  private pythonScriptPath: string;
  private mapboxClient: any;
  private directionsService: any;

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), 'src', 'ai', 'enhanced_maritime_routes.py');
    
    // Initialize Mapbox client if token is available
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (mapboxToken) {
      this.mapboxClient = mbxClient({ accessToken: mapboxToken });
      this.directionsService = mbxDirections(this.mapboxClient);
    }
  }

  async calculateEnhancedRoute(origin: string, destination: string, seaRouteResolution: number = 5): Promise<EnhancedRouteResponse> {
    try {
      // First get the route from Python script
      const pythonResult = await this.calculatePythonRoute(origin, destination, seaRouteResolution);
      
      if (!pythonResult.success || !pythonResult.route) {
        return pythonResult;
      }

      // Enhance land segments with Mapbox routing if available
      if (this.directionsService) {
        const enhancedSegments = await this.enhanceLandSegments(pythonResult.route.segments);
        pythonResult.route.segments = enhancedSegments;
        
        // Recalculate totals
        pythonResult.route.total_distance_km = enhancedSegments.reduce((sum: number, segment: RouteSegment) => sum + segment.distance_km, 0);
        pythonResult.route.total_waypoints = enhancedSegments.reduce((sum: number, segment: RouteSegment) => sum + segment.waypoints.length, 0);
      }

      return pythonResult;
    } catch (error) {
      return {
        success: false,
        error: `Route calculation failed: ${error}`
      };
    }
  }

  private async calculatePythonRoute(origin: string, destination: string, seaRouteResolution: number = 5): Promise<EnhancedRouteResponse> {
    return new Promise((resolve) => {
      // Try different Python commands based on the platform
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      
      const pythonProcess = spawn(pythonCommand, [this.pythonScriptPath, 'calculate_route', origin, destination, seaRouteResolution.toString()], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({
            success: false,
            error: `Route calculation failed: ${errorData || 'Unknown error'}`
          });
          return;
        }

        try {
          // Extract JSON from output - look for the first { and last } to isolate JSON
          const lines = outputData.trim().split('\n');
          let jsonString = '';
          
          // Find the line that starts with { - this should be our JSON
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('{') && trimmedLine.includes('"segments"')) {
              jsonString = trimmedLine;
              break;
            }
          }
          
          if (!jsonString) {
            // Fallback: try to parse the entire output
            jsonString = outputData.trim();
          }
          
          const result = JSON.parse(jsonString);
          resolve({
            success: true,
            route: result
          });
        } catch (error) {
          console.error('Python output:', outputData);
          console.error('Parse error:', error);
          resolve({
            success: false,
            error: `Failed to parse route data: ${error}. Output: ${outputData.substring(0, 200)}...`
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to start route calculation: ${error.message}`
        });
      });
    });
  }

  private async enhanceLandSegments(segments: RouteSegment[]): Promise<RouteSegment[]> {
    const enhancedSegments: RouteSegment[] = [];

    for (const segment of segments) {
      if (segment.type === 'land' && this.directionsService) {
        try {
          // Use Mapbox Directions API for land segments
          const response = await this.directionsService.getDirections({
            profile: 'driving',
            waypoints: [
              { coordinates: [segment.origin.lon, segment.origin.lat] },
              { coordinates: [segment.destination.lon, segment.destination.lat] }
            ],
            geometries: 'geojson',
            overview: 'full'
          }).send();

          const route = response.body.routes[0];
          if (route) {
            const distanceKm = route.distance / 1000; // Convert meters to kilometers
            const durationHours = route.duration / 3600; // Convert seconds to hours
            
            // Calculate CO2 emissions for land transport (truck: ~150g CO2e per km)
            const co2EmissionsKg = distanceKm * 0.15;

            // Convert route geometry to waypoints
            const waypoints: Coordinate[] = route.geometry.coordinates.map(([lon, lat]: [number, number]) => ({
              lon,
              lat
            }));

            enhancedSegments.push({
              ...segment,
              waypoints,
              distance_km: distanceKm,
              description: `${segment.description} (Enhanced: ${distanceKm.toFixed(1)} km, ${durationHours.toFixed(1)} hours, ${co2EmissionsKg.toFixed(2)} kg CO2e)`
            });
          } else {
            // Fallback to original segment if Mapbox fails
            enhancedSegments.push(segment);
          }
        } catch (error) {
          console.error('Error enhancing land segment with Mapbox:', error);
          // Fallback to original segment if Mapbox fails
          enhancedSegments.push(segment);
        }
      } else {
        // Keep sea segments unchanged
        enhancedSegments.push(segment);
      }
    }

    return enhancedSegments;
  }

  /**
   * Normalize coordinates and split at dateline crossings to prevent rendering artifacts
   */
  private normalizeLongitudeCrossing(coordinates: Array<[number, number]>): Array<Array<[number, number]>> {
    if (coordinates.length < 2) return [coordinates];
    
    // First normalize all coordinates to [-180, 180] range
    const normalized = coordinates.map(([lon, lat]): [number, number] => {
      let normalizedLon = lon;
      while (normalizedLon > 180) normalizedLon -= 360;
      while (normalizedLon < -180) normalizedLon += 360;
      return [normalizedLon, lat];
    });
    
    // Split into multiple segments when crossing the dateline
    const segments: Array<Array<[number, number]>> = [];
    let currentSegment: Array<[number, number]> = [normalized[0]];
    
    for (let i = 1; i < normalized.length; i++) {
      const prevLon = currentSegment[currentSegment.length - 1][0];
      const [currLon, currLat] = normalized[i];
      
      // Check if we're crossing the dateline (difference > 180°)
      const lonDiff = Math.abs(currLon - prevLon);
      
      if (lonDiff > 180) {
        // We're crossing the dateline, end current segment and start new one
        if (currentSegment.length > 1) {
          segments.push([...currentSegment]);
        }
        currentSegment = [[currLon, currLat]];
      } else {
        // No crossing, continue current segment
        currentSegment.push([currLon, currLat]);
      }
    }
    
    // Add the final segment
    if (currentSegment.length > 1) {
      segments.push(currentSegment);
    } else if (currentSegment.length === 1 && segments.length > 0) {
      // If we have a single point left, add it to the last segment
      if (segments[segments.length - 1].length > 0) {
        segments[segments.length - 1].push(currentSegment[0]);
      }
    }
    
    // If no segments were created, return the original normalized coordinates
    return segments.length > 0 ? segments : [normalized];
  }

  /**
   * Convert enhanced route to GeoJSON for map visualization
   */
  routeToGeoJSON(route: EnhancedRoute): any {
    const features: any[] = [];
    
    route.segments.forEach((segment, segmentIndex) => {
      // Convert waypoints to coordinate array
      const coordinates = segment.waypoints.map(wp => [wp.lon, wp.lat] as [number, number]);
      
      // Normalize coordinates and split at dateline crossings
      const coordinateSegments = this.normalizeLongitudeCrossing(coordinates);
      
      // Create a separate feature for each coordinate segment to handle dateline crossing
      coordinateSegments.forEach((coordSegment, subIndex) => {
        if (coordSegment.length >= 2) {
          features.push({
            type: 'Feature',
            properties: {
              id: `segment-${segmentIndex}-${subIndex}`,
              type: segment.type,
              description: segment.description,
              distance_km: segment.distance_km,
              waypoint_count: segment.waypoints.length,
              segment_index: segmentIndex,
              sub_segment: subIndex
            },
            geometry: {
              type: 'LineString',
              coordinates: coordSegment
            }
          });
        }
      });
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Get all waypoints with their segment type for map rendering
   */
  getWaypointsWithType(route: EnhancedRoute): Array<Coordinate & { type: 'sea' | 'land' }> {
    const waypoints: Array<Coordinate & { type: 'sea' | 'land' }> = [];
    
    route.segments.forEach(segment => {
      segment.waypoints.forEach(waypoint => {
        waypoints.push({
          lon: waypoint.lon,
          lat: waypoint.lat,
          type: segment.type
        });
      });
    });

    return waypoints;
  }

  /**
   * Validate route segments and identify potential issues
   */
  validateRoute(route: EnhancedRoute): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for extremely long segments that might indicate problematic routing
    route.segments.forEach((segment, index) => {
      if (segment.distance_km > 15000) {
        warnings.push(`Segment ${index + 1}: Unusually long ${segment.type} segment (${segment.distance_km.toFixed(0)} km)`);
        if (segment.type === 'sea') {
          suggestions.push(`Consider breaking down the sea route via intermediate ports for segment ${index + 1}`);
        } else {
          suggestions.push(`Consider multimodal transport options for long land segment ${index + 1}`);
        }
      }

      // Check for segments with very few waypoints (might indicate oversimplified routes)
      if (segment.waypoints.length < 3 && segment.distance_km > 1000) {
        warnings.push(`Segment ${index + 1}: Few waypoints for long distance might indicate oversimplified route`);
        suggestions.push(`Request more detailed routing for segment ${index + 1} to avoid obstacles`);
      }

      // Check for potential International Date Line crossing issues
      const lons = segment.waypoints.map(wp => wp.lon);
      const hasDateLineCrossing = lons.some(lon => Math.abs(lon) > 170) && 
                                  (Math.max(...lons) - Math.min(...lons)) > 180;
      
      if (hasDateLineCrossing) {
        warnings.push(`Segment ${index + 1}: Potential International Date Line crossing detected`);
        suggestions.push(`Verify routing accuracy for trans-Pacific segment ${index + 1}`);
      }
    });

    // Check for inefficient sea-land-sea patterns
    const segmentTypes = route.segments.map(s => s.type);
    for (let i = 0; i < segmentTypes.length - 2; i++) {
      if (segmentTypes[i] === 'sea' && segmentTypes[i+1] === 'land' && segmentTypes[i+2] === 'sea') {
        const landSegment = route.segments[i+1];
        if (landSegment.distance_km < 100) {
          warnings.push(`Short land bridge detected between sea segments (${landSegment.distance_km.toFixed(0)} km)`);
          suggestions.push(`Evaluate if sea route around this land bridge would be more efficient`);
        }
      }
    }

    // Check for balanced multimodal usage
    const totalSeaDistance = route.segments
      .filter(s => s.type === 'sea')
      .reduce((sum, s) => sum + s.distance_km, 0);
    
    const totalLandDistance = route.segments
      .filter(s => s.type === 'land')
      .reduce((sum, s) => sum + s.distance_km, 0);

    const seaPercentage = (totalSeaDistance / route.total_distance_km) * 100;
    
    if (seaPercentage > 90) {
      suggestions.push(`Route is heavily sea-focused (${seaPercentage.toFixed(1)}%). Consider if land connections could offer benefits.`);
    } else if (seaPercentage < 10) {
      suggestions.push(`Route is heavily land-focused (${(100-seaPercentage).toFixed(1)}% land). Consider if sea transport could be more efficient.`);
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }
}

// Test function for development
export async function testEnhancedRoutes() {
  const service = new EnhancedRouteService();
  
  const testCases = [
    { origin: 'Shanghai', destination: 'Bogota' },
    { origin: 'Shanghai', destination: 'Rotterdam' },
    { origin: 'Bogota', destination: 'Salt Lake City' },
    { origin: 'Denver', destination: 'Hamburg' }
  ];

  console.log('=== Enhanced Route Service Testing ===\n');

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.origin} → ${testCase.destination}`);
    
    try {
      const result = await service.calculateEnhancedRoute(testCase.origin, testCase.destination);
      
      if (result.success && result.route) {
        console.log(`✓ ${result.route.route_description}`);
        console.log(`  Total Distance: ${result.route.total_distance_km.toFixed(1)} km`);
        console.log(`  Total Waypoints: ${result.route.total_waypoints}`);
        console.log(`  Segments: ${result.route.segments.length}`);
        
        result.route.segments.forEach((segment, i) => {
          console.log(`    ${i + 1}. ${segment.type.toUpperCase()}: ${segment.description}`);
          console.log(`       Distance: ${segment.distance_km.toFixed(1)} km, Waypoints: ${segment.waypoints.length}`);
        });
      } else {
        console.log(`✗ ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Error: ${error}`);
    }
    
    console.log('');
  }
}
