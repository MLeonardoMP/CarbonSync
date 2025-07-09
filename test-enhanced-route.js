import { EnhancedRouteService } from '../lib/enhanced-route-service';

async function testService() {
  const service = new EnhancedRouteService();
  
  console.log('Testing Enhanced Route Service...');
  
  try {
    const result = await service.calculateEnhancedRoute('Shanghai', 'Bogota');
    
    if (result.success && result.route) {
      console.log('✓ Route calculation successful!');
      console.log(`Route: ${result.route.route_description}`);
      console.log(`Total Distance: ${result.route.total_distance_km.toFixed(1)} km`);
      console.log(`Total Waypoints: ${result.route.total_waypoints}`);
      console.log(`Segments: ${result.route.segments.length}`);
      
      result.route.segments.forEach((segment, i) => {
        console.log(`  ${i + 1}. ${segment.type.toUpperCase()}: ${segment.description}`);
        console.log(`     Distance: ${segment.distance_km.toFixed(1)} km, Waypoints: ${segment.waypoints.length}`);
      });
      
      // Test GeoJSON conversion
      const geoJson = service.routeToGeoJSON(result.route);
      console.log(`\nGeoJSON Features: ${geoJson.features.length}`);
      
      // Test waypoints with type
      const waypointsWithType = service.getWaypointsWithType(result.route);
      const seaWaypoints = waypointsWithType.filter(w => w.type === 'sea').length;
      const landWaypoints = waypointsWithType.filter(w => w.type === 'land').length;
      console.log(`Sea waypoints: ${seaWaypoints}, Land waypoints: ${landWaypoints}`);
    } else {
      console.log(`✗ Error: ${result.error}`);
    }
  } catch (error) {
    console.log(`✗ Exception: ${error}`);
  }
}

testService();
