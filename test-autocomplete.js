/**
 * Test the location autocomplete functionality
 */

import { searchLocations, getLocationByName, LOCATIONS_DATABASE } from '../src/lib/locations-data.js';

console.log('=== Location Autocomplete Test ===\n');

// Test 1: Search for "mia" should return Miami
console.log('Test 1: Search for "mia"');
const miaResults = searchLocations('mia', 5);
console.log('Results:', miaResults.map(l => `${l.name} (${l.type}, ${l.country})`));
console.log('Expected: Should include Miami\n');

// Test 2: Search for "fra" should return Frankfurt
console.log('Test 2: Search for "fra"');
const fraResults = searchLocations('fra', 5);
console.log('Results:', fraResults.map(l => `${l.name} (${l.type}, ${l.country})`));
console.log('Expected: Should include Frankfurt\n');

// Test 3: Search for "sha" should return Shanghai
console.log('Test 3: Search for "sha"');
const shaResults = searchLocations('sha', 5);
console.log('Results:', shaResults.map(l => `${l.name} (${l.type}, ${l.country})`));
console.log('Expected: Should include Shanghai\n');

// Test 4: Case insensitive search
console.log('Test 4: Case insensitive - "TOKYO"');
const tokyoResults = searchLocations('TOKYO', 5);
console.log('Results:', tokyoResults.map(l => `${l.name} (${l.type}, ${l.country})`));
console.log('Expected: Should include Tokyo\n');

// Test 5: Alias matching
console.log('Test 5: Alias matching - "LA"');
const laResults = searchLocations('LA', 5);
console.log('Results:', laResults.map(l => `${l.name} (${l.type}, ${l.country})`));
console.log('Expected: Should include Los Angeles\n');

// Test 6: Partial matching
console.log('Test 6: Partial matching - "port"');
const portResults = searchLocations('port', 8);
console.log('Results:', portResults.map(l => `${l.name} (${l.type}, ${l.country})`));
console.log('Expected: Should include various ports\n');

// Test 7: Get location by exact name
console.log('Test 7: Get exact location - "Shanghai"');
const shanghai = getLocationByName('Shanghai');
console.log('Result:', shanghai ? `${shanghai.name} (${shanghai.type}, ${shanghai.country})` : 'Not found');
console.log('Expected: Shanghai (port, China)\n');

// Test 8: Database size
console.log('Test 8: Database statistics');
const totalLocations = LOCATIONS_DATABASE.length;
const portCount = LOCATIONS_DATABASE.filter(l => l.type === 'port').length;
const cityCount = LOCATIONS_DATABASE.filter(l => l.type === 'city').length;
const airportCount = LOCATIONS_DATABASE.filter(l => l.type === 'airport').length;
const hubCount = LOCATIONS_DATABASE.filter(l => l.type === 'logistics_hub' || l.type === 'warehouse').length;

console.log(`Total locations: ${totalLocations}`);
console.log(`Ports: ${portCount}`);
console.log(`Cities: ${cityCount}`);
console.log(`Airports: ${airportCount}`);
console.log(`Logistics hubs/warehouses: ${hubCount}`);

console.log('\n=== Test Complete ===');
