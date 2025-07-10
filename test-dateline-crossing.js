/**
 * Test script to verify dateline crossing fixes
 */

// Mock route service to test the normalizeLongitudeCrossing function
class TestRouteService {
  normalizeLongitudeCrossing(coordinates) {
    if (coordinates.length < 2) return [coordinates];
    
    // First normalize all coordinates to [-180, 180] range
    const normalized = coordinates.map(([lon, lat]) => {
      let normalizedLon = lon;
      while (normalizedLon > 180) normalizedLon -= 360;
      while (normalizedLon < -180) normalizedLon += 360;
      return [normalizedLon, lat];
    });
    
    // Split into multiple segments when crossing the dateline
    const segments = [];
    let currentSegment = [normalized[0]];
    
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
}

// Test cases
const testService = new TestRouteService();

console.log('=== Testing Dateline Crossing Normalization ===\n');

// Test case 1: Normal route (no dateline crossing)
console.log('Test 1: Normal route (New York to London)');
const normalRoute = [
  [-74, 40.7],  // New York
  [-60, 45],    // Mid-Atlantic
  [-30, 50],    // Mid-Atlantic
  [0, 51.5]     // London
];
const normalResult = testService.normalizeLongitudeCrossing(normalRoute);
console.log('Input:', normalRoute);
console.log('Output segments:', normalResult.length);
console.log('Segments:', normalResult);
console.log('');

// Test case 2: Trans-Pacific route (crosses dateline)
console.log('Test 2: Trans-Pacific route (Los Angeles to Tokyo)');
const transPacific = [
  [-118, 34],   // Los Angeles
  [-150, 40],   // Mid-Pacific
  [-170, 41],   // Approaching dateline
  [-180, 40],   // At dateline
  [170, 39],    // Crossed dateline
  [140, 36],    // Approaching Japan
  [139.7, 35.7] // Tokyo
];
const pacificResult = testService.normalizeLongitudeCrossing(transPacific);
console.log('Input:', transPacific);
console.log('Output segments:', pacificResult.length);
console.log('Segments:', pacificResult);
console.log('');

// Test case 3: Route with coordinates outside normal range
console.log('Test 3: Route with out-of-range coordinates');
const outOfRange = [
  [200, 30],    // 200° longitude (should normalize to -160°)
  [370, 35],    // 370° longitude (should normalize to 10°)
  [-200, 40],   // -200° longitude (should normalize to 160°)
  [180, 45]     // At boundary
];
const rangeResult = testService.normalizeLongitudeCrossing(outOfRange);
console.log('Input:', outOfRange);
console.log('Output segments:', rangeResult.length);
console.log('Segments:', rangeResult);
console.log('');

console.log('=== Test Complete ===');
