/**
 * Enhanced Route Service for segment-focused logistics planning
 */

import { spawn } from 'child_process';
import path from 'path';

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

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), 'src', 'ai', 'enhanced_maritime_routes.py');
  }

  async calculateEnhancedRoute(origin: string, destination: string): Promise<EnhancedRouteResponse> {
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
