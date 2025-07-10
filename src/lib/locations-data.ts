/**
 * Location data for autocomplete functionality
 * Includes major ports, cities, warehouses, and logistics hubs worldwide
 */

export interface Location {
  name: string;
  type: 'port' | 'city' | 'warehouse' | 'airport' | 'logistics_hub';
  country: string;
  aliases?: string[];
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export const LOCATIONS_DATABASE: Location[] = [
  // Major Ports
  { name: "Shanghai", type: "port", country: "China", aliases: ["Shanghai Port", "CNSHA"] },
  { name: "Singapore", type: "port", country: "Singapore", aliases: ["Singapore Port", "SGSIN"] },
  { name: "Rotterdam", type: "port", country: "Netherlands", aliases: ["Rotterdam Port", "NLRTM"] },
  { name: "Los Angeles", type: "port", country: "USA", aliases: ["LA", "Los Angeles Port", "USLAX"] },
  { name: "Hamburg", type: "port", country: "Germany", aliases: ["Hamburg Port", "DEHAM"] },
  { name: "Antwerp", type: "port", country: "Belgium", aliases: ["Antwerp Port", "BEANR"] },
  { name: "Hong Kong", type: "port", country: "Hong Kong", aliases: ["Hong Kong Port", "HKHKG"] },
  { name: "Dubai", type: "port", country: "UAE", aliases: ["Dubai Port", "AEDXB", "Jebel Ali"] },
  { name: "Buenaventura", type: "port", country: "Colombia", aliases: ["Buenaventura Port", "COBUN"] },
  { name: "Callao", type: "port", country: "Peru", aliases: ["Callao Port", "PECLL", "Lima Port"] },
  { name: "Long Beach", type: "port", country: "USA", aliases: ["Long Beach Port", "USLGB"] },
  { name: "New York", type: "port", country: "USA", aliases: ["New York Port", "USNYC", "NYC"] },
  { name: "Yokohama", type: "port", country: "Japan", aliases: ["Yokohama Port", "JPYOK"] },
  { name: "Tokyo", type: "port", country: "Japan", aliases: ["Tokyo Port", "JPTYO"] },
  { name: "Cape Town", type: "port", country: "South Africa", aliases: ["Cape Town Port", "ZACPT"] },
  { name: "Durban", type: "port", country: "South Africa", aliases: ["Durban Port", "ZADUR"] },
  { name: "Santos", type: "port", country: "Brazil", aliases: ["Santos Port", "BRSTS"] },
  { name: "Valparaiso", type: "port", country: "Chile", aliases: ["Valparaiso Port", "CLVAP"] },
  { name: "Vancouver", type: "port", country: "Canada", aliases: ["Vancouver Port", "CAVAN"] },
  { name: "Seattle", type: "port", country: "USA", aliases: ["Seattle Port", "USSEA"] },
  { name: "Miami", type: "port", country: "USA", aliases: ["Miami Port", "USMIA"] },
  { name: "Norfolk", type: "port", country: "USA", aliases: ["Norfolk Port", "USNFK"] },
  { name: "Savannah", type: "port", country: "USA", aliases: ["Savannah Port", "USSAV"] },
  { name: "Charleston", type: "port", country: "USA", aliases: ["Charleston Port", "USCHS"] },
  { name: "Le Havre", type: "port", country: "France", aliases: ["Le Havre Port", "FRLEH"] },
  { name: "Marseille", type: "port", country: "France", aliases: ["Marseille Port", "FRMRS"] },
  { name: "Barcelona", type: "port", country: "Spain", aliases: ["Barcelona Port", "ESBCN"] },
  { name: "Valencia", type: "port", country: "Spain", aliases: ["Valencia Port", "ESVLC"] },
  { name: "Genoa", type: "port", country: "Italy", aliases: ["Genoa Port", "ITGOA"] },
  { name: "Naples", type: "port", country: "Italy", aliases: ["Naples Port", "ITNAL"] },
  { name: "Piraeus", type: "port", country: "Greece", aliases: ["Piraeus Port", "GRPIR", "Athens Port"] },
  { name: "Istanbul", type: "port", country: "Turkey", aliases: ["Istanbul Port", "TRIST"] },
  { name: "Vladivostok", type: "port", country: "Russia", aliases: ["Vladivostok Port", "RUVVO"] },
  { name: "Mumbai", type: "port", country: "India", aliases: ["Mumbai Port", "INMAA", "Bombay"] },
  { name: "Chennai", type: "port", country: "India", aliases: ["Chennai Port", "INMAA", "Madras"] },
  { name: "Karachi", type: "port", country: "Pakistan", aliases: ["Karachi Port", "PKKAR"] },
  { name: "Colombo", type: "port", country: "Sri Lanka", aliases: ["Colombo Port", "LKCMB"] },

  // Major Cities
  { name: "London", type: "city", country: "UK", aliases: ["Greater London"] },
  { name: "Paris", type: "city", country: "France", aliases: ["Paris France"] },
  { name: "Berlin", type: "city", country: "Germany", aliases: ["Berlin Germany"] },
  { name: "Madrid", type: "city", country: "Spain", aliases: ["Madrid Spain"] },
  { name: "Rome", type: "city", country: "Italy", aliases: ["Roma"] },
  { name: "Moscow", type: "city", country: "Russia", aliases: ["Moskva"] },
  { name: "Beijing", type: "city", country: "China", aliases: ["Peking"] },
  { name: "Delhi", type: "city", country: "India", aliases: ["New Delhi"] },
  { name: "Bogota", type: "city", country: "Colombia", aliases: ["Bogotá", "Santa Fe de Bogotá"] },
  { name: "Lima", type: "city", country: "Peru", aliases: ["Lima Peru"] },
  { name: "Mexico City", type: "city", country: "Mexico", aliases: ["CDMX", "Ciudad de México"] },
  { name: "São Paulo", type: "city", country: "Brazil", aliases: ["Sao Paulo"] },
  { name: "Buenos Aires", type: "city", country: "Argentina", aliases: ["CABA"] },
  { name: "Santiago", type: "city", country: "Chile", aliases: ["Santiago Chile"] },
  { name: "Toronto", type: "city", country: "Canada", aliases: ["Toronto Canada"] },
  { name: "Montreal", type: "city", country: "Canada", aliases: ["Montréal"] },
  { name: "Chicago", type: "city", country: "USA", aliases: ["Chicago IL"] },
  { name: "Houston", type: "city", country: "USA", aliases: ["Houston TX"] },
  { name: "Denver", type: "city", country: "USA", aliases: ["Denver CO"] },
  { name: "Atlanta", type: "city", country: "USA", aliases: ["Atlanta GA"] },
  { name: "Salt Lake City", type: "city", country: "USA", aliases: ["SLC", "Salt Lake"] },
  { name: "Phoenix", type: "city", country: "USA", aliases: ["Phoenix AZ"] },
  { name: "Las Vegas", type: "city", country: "USA", aliases: ["Vegas", "Las Vegas NV"] },
  { name: "San Francisco", type: "city", country: "USA", aliases: ["SF", "San Francisco CA"] },
  { name: "Portland", type: "city", country: "USA", aliases: ["Portland OR"] },
  { name: "Boston", type: "city", country: "USA", aliases: ["Boston MA"] },
  { name: "Philadelphia", type: "city", country: "USA", aliases: ["Philly", "Philadelphia PA"] },
  { name: "Detroit", type: "city", country: "USA", aliases: ["Detroit MI"] },
  { name: "Minneapolis", type: "city", country: "USA", aliases: ["Minneapolis MN", "Twin Cities"] },
  { name: "Dallas", type: "city", country: "USA", aliases: ["Dallas TX"] },
  { name: "Memphis", type: "city", country: "USA", aliases: ["Memphis TN"] },
  { name: "Nashville", type: "city", country: "USA", aliases: ["Nashville TN"] },
  { name: "Kansas City", type: "city", country: "USA", aliases: ["KC", "Kansas City MO"] },
  { name: "St. Louis", type: "city", country: "USA", aliases: ["Saint Louis", "St Louis MO"] },
  { name: "Cincinnati", type: "city", country: "USA", aliases: ["Cincinnati OH"] },
  { name: "Columbus", type: "city", country: "USA", aliases: ["Columbus OH"] },
  { name: "Cleveland", type: "city", country: "USA", aliases: ["Cleveland OH"] },
  { name: "Pittsburgh", type: "city", country: "USA", aliases: ["Pittsburgh PA"] },
  { name: "Indianapolis", type: "city", country: "USA", aliases: ["Indy", "Indianapolis IN"] },
  { name: "Milwaukee", type: "city", country: "USA", aliases: ["Milwaukee WI"] },

  // Major Airports (important for cargo)
  { name: "Frankfurt", type: "airport", country: "Germany", aliases: ["Frankfurt Airport", "FRA", "Frankfurt am Main"] },
  { name: "Memphis Airport", type: "airport", country: "USA", aliases: ["MEM", "FedEx Hub"] },
  { name: "Louisville", type: "airport", country: "USA", aliases: ["Louisville Airport", "SDF", "UPS Hub"] },
  { name: "Anchorage", type: "airport", country: "USA", aliases: ["Anchorage Airport", "ANC"] },
  { name: "Paris Charles de Gaulle", type: "airport", country: "France", aliases: ["CDG", "Roissy"] },
  { name: "Amsterdam Schiphol", type: "airport", country: "Netherlands", aliases: ["AMS", "Schiphol"] },
  { name: "Hong Kong Airport", type: "airport", country: "Hong Kong", aliases: ["HKG", "Chek Lap Kok"] },
  { name: "Incheon", type: "airport", country: "South Korea", aliases: ["ICN", "Seoul Airport"] },
  { name: "Dubai Airport", type: "airport", country: "UAE", aliases: ["DXB"] },
  { name: "Doha", type: "airport", country: "Qatar", aliases: ["DOH", "Hamad Airport"] },

  // Logistics Hubs & Warehouses
  { name: "Joliet", type: "logistics_hub", country: "USA", aliases: ["Joliet IL", "CenterPoint Joliet"] },
  { name: "Edison", type: "logistics_hub", country: "USA", aliases: ["Edison NJ"] },
  { name: "Riverside", type: "logistics_hub", country: "USA", aliases: ["Riverside CA", "Inland Empire"] },
  { name: "Ontario", type: "logistics_hub", country: "USA", aliases: ["Ontario CA"] },
  { name: "Laredo", type: "logistics_hub", country: "USA", aliases: ["Laredo TX"] },
  { name: "El Paso", type: "logistics_hub", country: "USA", aliases: ["El Paso TX"] },
  { name: "Brownsville", type: "logistics_hub", country: "USA", aliases: ["Brownsville TX"] },
  { name: "Nogales", type: "logistics_hub", country: "USA", aliases: ["Nogales AZ"] },
  { name: "Duisburg", type: "logistics_hub", country: "Germany", aliases: ["Duisburg Port"] },
  { name: "Venlo", type: "logistics_hub", country: "Netherlands", aliases: ["Venlo Logistics"] },
  { name: "Zaragoza", type: "logistics_hub", country: "Spain", aliases: ["Zaragoza Logistics"] },

  // Additional Strategic Locations
  { name: "Suez Canal", type: "logistics_hub", country: "Egypt", aliases: ["Suez", "Port Said"] },
  { name: "Panama Canal", type: "logistics_hub", country: "Panama", aliases: ["Panama", "Colon"] },
  { name: "Strait of Malacca", type: "logistics_hub", country: "Malaysia", aliases: ["Malacca", "Port Klang"] },
  { name: "Gibraltar", type: "logistics_hub", country: "Gibraltar", aliases: ["Strait of Gibraltar"] },
];

/**
 * Search locations based on query string
 */
export function searchLocations(query: string, limit: number = 10): Location[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // First, find exact matches and prefix matches
  const exactMatches = LOCATIONS_DATABASE.filter(location => 
    location.name.toLowerCase().startsWith(normalizedQuery)
  );
  
  // Then find matches in aliases
  const aliasMatches = LOCATIONS_DATABASE.filter(location => 
    !exactMatches.includes(location) && 
    location.aliases?.some(alias => alias.toLowerCase().includes(normalizedQuery))
  );
  
  // Finally, find partial matches in names
  const partialMatches = LOCATIONS_DATABASE.filter(location => 
    !exactMatches.includes(location) && 
    !aliasMatches.includes(location) &&
    location.name.toLowerCase().includes(normalizedQuery)
  );
  
  // Combine results with priority: exact matches first, then alias matches, then partial matches
  const results = [...exactMatches, ...aliasMatches, ...partialMatches];
  
  return results.slice(0, limit);
}

/**
 * Get location by exact name match
 */
export function getLocationByName(name: string): Location | null {
  const normalizedName = name.toLowerCase().trim();
  
  return LOCATIONS_DATABASE.find(location => 
    location.name.toLowerCase() === normalizedName ||
    location.aliases?.some(alias => alias.toLowerCase() === normalizedName)
  ) || null;
}

/**
 * Get all locations of a specific type
 */
export function getLocationsByType(type: Location['type']): Location[] {
  return LOCATIONS_DATABASE.filter(location => location.type === type);
}

/**
 * Get locations by country
 */
export function getLocationsByCountry(country: string): Location[] {
  const normalizedCountry = country.toLowerCase().trim();
  return LOCATIONS_DATABASE.filter(location => 
    location.country.toLowerCase() === normalizedCountry
  );
}
