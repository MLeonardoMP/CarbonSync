import type { Vehicle, Carrier, Region, Mode } from '@/types';

// Enhanced mock data with predefined routes for real-time tracking
export interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface VehicleRoute {
  id: string;
  points: RoutePoint[];
  currentIndex: number;
  direction: 1 | -1; // 1 for forward, -1 for backward
}

// Predefined shipping routes for realistic simulation
const shippingRoutes = {
  // Major sea routes
  transpacific: [
    { lat: 35.6762, lng: 139.6503, name: "Tokyo" },
    { lat: 34.0522, lng: -118.2437, name: "Los Angeles" }
  ],
  transatlantic: [
    { lat: 51.9072, lng: 4.4633, name: "Rotterdam" },
    { lat: 40.7505, lng: -73.9934, name: "New York" }
  ],
  asia_europe: [
    { lat: 1.3521, lng: 103.8198, name: "Singapore" },
    { lat: 25.2048, lng: 55.2708, name: "Dubai" },
    { lat: 29.9167, lng: 31.2000, name: "Suez Canal" },
    { lat: 51.9072, lng: 4.4633, name: "Rotterdam" }
  ],
  mediterranean: [
    { lat: 41.9028, lng: 12.4964, name: "Rome" },
    { lat: 36.8065, lng: 10.1815, name: "Tunis" },
    { lat: 33.5731, lng: 7.5898, name: "Casablanca" }
  ],
  
  // Land routes (trucks/rail)
  us_transcontinental: [
    { lat: 40.7128, lng: -74.0060, name: "New York" },
    { lat: 41.8781, lng: -87.6298, name: "Chicago" },
    { lat: 39.7392, lng: -104.9903, name: "Denver" },
    { lat: 34.0522, lng: -118.2437, name: "Los Angeles" }
  ],
  european_corridor: [
    { lat: 52.5200, lng: 13.4050, name: "Berlin" },
    { lat: 50.0755, lng: 14.4378, name: "Prague" },
    { lat: 47.4979, lng: 19.0402, name: "Budapest" },
    { lat: 44.4268, lng: 26.1025, name: "Bucharest" }
  ],
  asian_silk_road: [
    { lat: 39.9042, lng: 116.4074, name: "Beijing" },
    { lat: 41.2995, lng: 69.2401, name: "Tashkent" },
    { lat: 41.7151, lng: 44.8271, name: "Tbilisi" },
    { lat: 52.5200, lng: 13.4050, name: "Berlin" }
  ],
  china_europe_rail: [
    { lat: 31.2304, lng: 121.4737, name: "Shanghai" },
    { lat: 43.8256, lng: 87.6168, name: "Urumqi" },
    { lat: 51.1694, lng: 71.4491, name: "Nur-Sultan" },
    { lat: 55.7558, lng: 37.6173, name: "Moscow" },
    { lat: 52.5200, lng: 13.4050, name: "Berlin" }
  ]
};

const routeNames = Object.keys(shippingRoutes) as (keyof typeof shippingRoutes)[];

// A simple seeded random number generator to ensure consistent data between server and client renders.
let seed = 1;
function seededRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Reset seed for consistent data generation
export function resetSeed() {
  seed = 1;
}

const carriers: Carrier[] = ['EcoHaul', 'SwiftTrans', 'AquaGlide', 'RailForward'];
const regions: Region[] = ['North America', 'Europe', 'Asia'];
const modes: Mode[] = ['truck', 'rail', 'sea'];
const fuelTypes = {
  truck: ['Diesel', 'Electric'],
  rail: ['Diesel', 'Electric'],
  sea: ['Marine Gas Oil', 'LNG'],
};

const statuses = ['In Transit', 'Loading', 'Unloading', 'Delayed', 'On Schedule'];
const cargoTypes = ['Container', 'Bulk Cargo', 'Oil Tanker', 'Vehicle Carrier', 'Dry Goods', 'Refrigerated'];

// Create vehicle routes mapping
const vehicleRoutes: Map<string, VehicleRoute> = new Map();

// Enhanced vehicle generation with realistic routes
const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

// Updated logic to ensure vehicles match their routes
// Ensure fallback route selection if no routes match the mode criteria
export const vehicles: Vehicle[] = Array.from({ length: 50 }, (_, i) => {
  const mode = modes[Math.floor(seededRandom() * modes.length)];
  const region = regions[Math.floor(seededRandom() * regions.length)];
  const carrier = carriers[Math.floor(seededRandom() * carriers.length)];

  let vehicleType: string;
  let specificFuelTypes: ('Diesel' | 'Electric' | 'Marine Gas Oil' | 'LNG')[];

  // Select appropriate route based on mode
  let selectedRoute: RoutePoint[];
  if (mode === 'sea') {
    const seaRoutes = Object.keys(shippingRoutes).filter(route => route.includes('sea'));
    selectedRoute = seaRoutes.length > 0
      ? shippingRoutes[seaRoutes[Math.floor(seededRandom() * seaRoutes.length)] as keyof typeof shippingRoutes]
      : shippingRoutes.transpacific; // Fallback to transpacific route
  } else {
    const landRoutes = Object.keys(shippingRoutes).filter(route => !route.includes('sea'));
    selectedRoute = landRoutes.length > 0
      ? shippingRoutes[landRoutes[Math.floor(seededRandom() * landRoutes.length)] as keyof typeof shippingRoutes]
      : shippingRoutes.us_transcontinental; // Fallback to US transcontinental route
  }

  const currentIndex = Math.floor(seededRandom() * selectedRoute.length);
  const currentPosition = selectedRoute[currentIndex];

  // Create route for this vehicle
  const vehicleId = `VEH-${1000 + i}`;
  vehicleRoutes.set(vehicleId, {
    id: vehicleId,
    points: selectedRoute,
    currentIndex,
    direction: 1
  });

  switch(mode) {
    case 'truck':
      vehicleType = `Truck ${String.fromCharCode(65 + (i % 5))}-${i+1}`;
      specificFuelTypes = fuelTypes.truck as any;
      break;
    case 'rail':
      vehicleType = `Train ${i+1}`;
      specificFuelTypes = fuelTypes.rail as any;
      break;
    case 'sea':
      vehicleType = `Ship ${String.fromCharCode(65 + (i % 3))}-Class`;
      specificFuelTypes = fuelTypes.sea as any;
      break;
    default:
      vehicleType = `Vehicle ${i+1}`;
      specificFuelTypes = ['Diesel'];
      break;
  }

  const fuelType = specificFuelTypes[Math.floor(seededRandom() * specificFuelTypes.length)];
  const status = statuses[Math.floor(seededRandom() * statuses.length)];
  const cargoType = cargoTypes[Math.floor(seededRandom() * cargoTypes.length)];

  return {
    id: vehicleId,
    type: vehicleType,
    mode: mode,
    speed: Math.floor(seededRandom() * 80) + 20,
    timestamp: new Date(baseTime - seededRandom() * 1000 * 60 * 60 * 24).toISOString(),
    co2e: parseFloat((seededRandom() * 10).toFixed(2)),
    eta: new Date(baseTime + seededRandom() * 1000 * 60 * 60 * 48).toISOString(),
    fuelType: fuelType,
    carrier: carrier,
    origin: selectedRoute[0]?.name || `${region} Port ${i % 5 + 1}`,
    destination: selectedRoute[selectedRoute.length - 1]?.name || `${regions[(regions.indexOf(region) + 1) % regions.length]} Hub ${i % 3 + 1}`,
    lastUpdated: new Date(baseTime - seededRandom() * 1000 * 60 * 10).toISOString(),
    position: currentPosition,
    region: region,
    loadFactor: parseFloat(seededRandom().toFixed(2)),
    costPerKm: parseFloat((seededRandom() * 2 + 0.5).toFixed(2)),
    status,
    cargoType,
    capacity: Math.floor(seededRandom() * 1000) + 100,
    currentLoad: Math.floor(seededRandom() * 800) + 50
  };
});

// Export vehicle routes for real-time updates
export { vehicleRoutes };

// Function to interpolate between two points
export function interpolatePosition(point1: RoutePoint, point2: RoutePoint, progress: number): RoutePoint {
  return {
    lat: point1.lat + (point2.lat - point1.lat) * progress,
    lng: point1.lng + (point2.lng - point1.lng) * progress
  };
}

// Function to update vehicle position along its route
export function updateVehiclePosition(vehicleId: string, vehicles: Vehicle[], timestamp?: string): Vehicle[] {
  const route = vehicleRoutes.get(vehicleId);
  if (!route) return vehicles;

  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return vehicles;

  // Move to next point in route
  const nextIndex = route.currentIndex + route.direction;
  
  // Reverse direction if at end of route
  if (nextIndex >= route.points.length) {
    route.direction = -1;
    route.currentIndex = route.points.length - 2;
  } else if (nextIndex < 0) {
    route.direction = 1;
    route.currentIndex = 1;
  } else {
    route.currentIndex = nextIndex;
  }

  // Update vehicle position
  const newPosition = route.points[route.currentIndex];
  const updatedVehicles = vehicles.map(v => 
    v.id === vehicleId 
      ? { 
          ...v, 
          position: newPosition,
          lastUpdated: timestamp || v.lastUpdated
        }
      : v
  );

  return updatedVehicles;
}

// Function to update all vehicles
export function updateAllVehiclePositions(vehicles: Vehicle[], seed?: number): Vehicle[] {
  let updatedVehicles = [...vehicles];
  
  // Use seeded random or vehicle index for deterministic behavior during SSR
  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const shouldMove = seed !== undefined 
      ? ((seed + i) % 10) < 3  // 30% chance based on seed
      : Math.random() < 0.3;   // 30% chance with Math.random for client-side only
    
    if (shouldMove) {
      const timestamp = seed !== undefined 
        ? new Date(baseTime + seed * 1000).toISOString()  // Deterministic timestamp for SSR
        : new Date().toISOString();  // Current timestamp for client-side
      
      updatedVehicles = updateVehiclePosition(vehicle.id, updatedVehicles, timestamp);
    }
  }
  
  return updatedVehicles;
}
