import type { Vehicle, Carrier, Region, Mode } from '@/types';

// A simple seeded random number generator to ensure consistent data between server and client renders.
let seed = 1;
function seededRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

const carriers: Carrier[] = ['EcoHaul', 'SwiftTrans', 'AquaGlide', 'RailForward'];
const regions: Region[] = ['North America', 'Europe', 'Asia'];
const modes: Mode[] = ['truck', 'rail', 'sea'];
const fuelTypes = {
  truck: ['Diesel', 'Electric'],
  rail: ['Diesel', 'Electric'],
  sea: ['Marine Gas Oil', 'LNG'],
};

const generateRandomCoordinates = (region: Region) => {
  const bounds = {
    'North America': { lat: [25, 60], lng: [-125, -65] },
    'Europe': { lat: [35, 70], lng: [-10, 40] },
    'Asia': { lat: [0, 70], lng: [60, 140] },
  };
  const latRange = bounds[region].lat;
  const lngRange = bounds[region].lng;
  return {
    lat: seededRandom() * (latRange[1] - latRange[0]) + latRange[0],
    lng: seededRandom() * (lngRange[1] - lngRange[0]) + lngRange[0],
  };
};

const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

export const vehicles: Vehicle[] = Array.from({ length: 50 }, (_, i) => {
  const mode = modes[Math.floor(seededRandom() * modes.length)];
  const region = regions[Math.floor(seededRandom() * regions.length)];
  const carrier = carriers[Math.floor(seededRandom() * carriers.length)];
  
  let vehicleType: string, specificFuelTypes: ('Diesel' | 'Electric' | 'Marine Gas Oil' | 'LNG')[];

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
  }
  
  const fuelType = specificFuelTypes[Math.floor(seededRandom() * specificFuelTypes.length)];

  return {
    id: `VEH-${1000 + i}`,
    type: vehicleType,
    mode: mode,
    speed: Math.floor(seededRandom() * 80) + 20,
    timestamp: new Date(baseTime - seededRandom() * 1000 * 60 * 60 * 24).toISOString(),
    co2e: parseFloat((seededRandom() * 10).toFixed(2)),
    eta: new Date(baseTime + seededRandom() * 1000 * 60 * 60 * 48).toISOString(),
    fuelType: fuelType,
    carrier: carrier,
    origin: `${region} Port ${i % 5 + 1}`,
    destination: `${regions[(regions.indexOf(region) + 1) % regions.length]} Hub ${i % 3 + 1}`,
    lastUpdated: new Date(baseTime - seededRandom() * 1000 * 60 * 10).toISOString(),
    position: generateRandomCoordinates(region),
    region: region,
    loadFactor: parseFloat(seededRandom().toFixed(2)),
    costPerKm: parseFloat((seededRandom() * 2 + 0.5).toFixed(2)),
  };
});
