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

  async calculateEnhancedRoute(origin: string, destination: string): Promise<EnhancedRouteResponse> {
    try {
      // First get the route from Python script
      const pythonResult = await this.calculatePythonRoute(origin, destination);
      
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

  private async calculatePythonRoute(origin: string, destination: string): Promise<EnhancedRouteResponse> {
    return new Promise((resolve) => {
      // Try different Python commands based on the platform
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      
      const pythonProcess = spawn(pythonCommand, [this.pythonScriptPath, 'calculate_route', origin, destination], {
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
          const result = JSON.parse(outputData);
          resolve({
            success: true,
            route: result
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to parse route data: ${error}`
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
   * Normalize longitude coordinates to handle International Date Line crossing
   */
  private normalizeLongitudeCrossing(coordinates: Array<[number, number]>): Array<[number, number]> {
    if (coordinates.length < 2) return coordinates;
    
    const normalized: Array<[number, number]> = [coordinates[0]];
    
    for (let i = 1; i < coordinates.length; i++) {
      const prevLon = normalized[normalized.length - 1][0];
      const [currLon, currLat] = coordinates[i];
      
      const lonDiff = currLon - prevLon;
      let adjustedLon = currLon;
      
      if (lonDiff > 180) {
        // Crossing from east to west (e.g., 179° to -179°)
        adjustedLon = currLon - 360;
      } else if (lonDiff < -180) {
        // Crossing from west to east (e.g., -179° to 179°)
        adjustedLon = currLon + 360;
      }
      
      normalized.push([adjustedLon, currLat]);
    }
    
    return normalized;
  }

  /**
   * Convert enhanced route to GeoJSON for map visualization
   */
  routeToGeoJSON(route: EnhancedRoute): any {
    const features = route.segments.map((segment, index) => {
      // Convert waypoints to coordinate array
      const coordinates = segment.waypoints.map(wp => [wp.lon, wp.lat] as [number, number]);
      
      // Normalize coordinates to handle International Date Line crossing
      const normalizedCoordinates = this.normalizeLongitudeCrossing(coordinates);
      
      return {
        type: 'Feature',
        properties: {
          id: `segment-${index}`,
          type: segment.type,
          description: segment.description,
          distance_km: segment.distance_km,
          waypoint_count: segment.waypoints.length
        },
        geometry: {
          type: 'LineString',
          coordinates: normalizedCoordinates
        }
      };
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
