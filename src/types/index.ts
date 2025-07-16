export type UserRole = 'admin' | 'carrier' | 'analyst';

export type Carrier = 'EcoHaul' | 'SwiftTrans' | 'AquaGlide' | 'RailForward';

export type Region = 'North America' | 'Europe' | 'Asia';

export type Mode = 'truck' | 'rail' | 'sea' | 'air';

export type Vehicle = {
  id: string;
  type: string;
  mode: Mode;
  speed: number;
  timestamp: string;
  co2e: number;
  eta: string;
  fuelType: 'Diesel' | 'Electric' | 'Marine Gas Oil' | 'LNG';
  carrier: Carrier;
  origin: string;
  destination: string;
  lastUpdated: string;
  position: {
    lat: number;
    lng: number;
  };
  region: Region;
  loadFactor: number;
  costPerKm: number;
  status?: string;
  cargoType?: string;
  capacity?: number;
  currentLoad?: number;
};
