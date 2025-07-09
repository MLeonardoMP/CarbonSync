#!/usr/bin/env python3
"""
Enhanced Maritime Route Service for Logistics App
Uses AI to extract coordinates and create segment-focused optimal routes
"""

import subprocess
import json
import tempfile
import os
import sys
import requests
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum

class SegmentType(Enum):
    SEA = "sea"
    LAND = "land"

@dataclass
class Coordinate:
    lon: float
    lat: float

@dataclass
class RouteSegment:
    type: SegmentType
    origin: Coordinate
    destination: Coordinate
    waypoints: List[Coordinate]
    description: str
    distance_km: float

@dataclass
class EnhancedRoute:
    segments: List[RouteSegment]
    total_distance_km: float
    total_waypoints: int
    route_description: str

class CoordinateExtractor:
    """Uses AI/geocoding to extract coordinates from place names"""
    
    @staticmethod
    def get_coordinates(place_name: str) -> Optional[Coordinate]:
        """
        Extract coordinates from place name using Nominatim (OpenStreetMap)
        In production, this could be enhanced with AI/LLM integration
        """
        try:
            # Use Nominatim geocoding service
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': place_name,
                'format': 'json',
                'limit': 1,
                'addressdetails': 1
            }
            headers = {
                'User-Agent': 'CarbonSync-LogisticsPlanner/1.0'
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) > 0:
                result = data[0]
                return Coordinate(
                    lon=float(result['lon']),
                    lat=float(result['lat'])
                )
            
            return None
            
        except Exception as e:
            print(f"Error geocoding {place_name}: {e}")
            return None

class PortFinder:
    """Finds nearest major ports for inland locations"""
    
    # Major world ports database
    MAJOR_PORTS = {
        "shanghai": {"name": "Shanghai", "lon": 121.8, "lat": 31.2, "country": "China"},
        "rotterdam": {"name": "Rotterdam", "lon": 4.5, "lat": 51.9, "country": "Netherlands"},
        "singapore": {"name": "Singapore", "lon": 103.8, "lat": 1.3, "country": "Singapore"},
        "los_angeles": {"name": "Los Angeles", "lon": -118.2, "lat": 34.1, "country": "USA"},
        "hamburg": {"name": "Hamburg", "lon": 10.0, "lat": 53.6, "country": "Germany"},
        "buenaventura": {"name": "Buenaventura", "lon": -77.0, "lat": 3.9, "country": "Colombia"},
        "callao": {"name": "Callao", "lon": -77.1, "lat": -12.1, "country": "Peru"},
        "antwerp": {"name": "Antwerp", "lon": 4.4, "lat": 51.2, "country": "Belgium"},
        "hong_kong": {"name": "Hong Kong", "lon": 114.2, "lat": 22.3, "country": "Hong Kong"},
        "dubai": {"name": "Dubai", "lon": 55.3, "lat": 25.3, "country": "UAE"},
        "new_york": {"name": "New York", "lon": -74.0, "lat": 40.7, "country": "USA"},
        "yokohama": {"name": "Yokohama", "lon": 139.6, "lat": 35.4, "country": "Japan"},
        # African ports
        "cape_town": {"name": "Cape Town", "lon": 18.4, "lat": -33.9, "country": "South Africa"},
        "durban": {"name": "Durban", "lon": 31.0, "lat": -29.9, "country": "South Africa"},
        "lagos": {"name": "Lagos", "lon": 3.4, "lat": 6.5, "country": "Nigeria"},
        "alexandria": {"name": "Alexandria", "lon": 29.9, "lat": 31.2, "country": "Egypt"},
        "casablanca": {"name": "Casablanca", "lon": -7.6, "lat": 33.6, "country": "Morocco"},
        "dakar": {"name": "Dakar", "lon": -17.4, "lat": 14.7, "country": "Senegal"},
        # Additional major ports
        "mumbai": {"name": "Mumbai", "lon": 72.8, "lat": 19.1, "country": "India"},
        "chennai": {"name": "Chennai", "lon": 80.3, "lat": 13.1, "country": "India"},
        "sydney": {"name": "Sydney", "lon": 151.2, "lat": -33.9, "country": "Australia"},
        "vancouver": {"name": "Vancouver", "lon": -123.1, "lat": 49.3, "country": "Canada"},
        "santos": {"name": "Santos", "lon": -46.3, "lat": -23.9, "country": "Brazil"}
    }
    
    @staticmethod
    def find_nearest_port(coord: Coordinate, exclude_country: Optional[str] = None) -> Dict:
        """Find the nearest major port to a given coordinate"""
        min_distance = float('inf')
        nearest_port = None
        
        for port_data in PortFinder.MAJOR_PORTS.values():
            if exclude_country and port_data['country'] == exclude_country:
                continue
                
            # Simple distance calculation (Haversine would be more accurate)
            distance = ((coord.lon - port_data['lon']) ** 2 + (coord.lat - port_data['lat']) ** 2) ** 0.5
            
            if distance < min_distance:
                min_distance = distance
                nearest_port = port_data
        
        return nearest_port
    
    @staticmethod
    def is_port_city(place_name: str) -> bool:
        """Check if a place name is a known port city"""
        place_lower = place_name.lower().replace(" ", "_")
        return any(port_name in place_lower or place_lower in port_name 
                  for port_name in PortFinder.MAJOR_PORTS.keys())
    
    @staticmethod
    def is_likely_coastal_city(place_name: str, coord: Coordinate) -> bool:
        """
        Check if a place is likely a coastal city that can serve as a port.
        This includes both known major ports and other coastal cities.
        """
        # First check if it's a known port
        if PortFinder.is_port_city(place_name):
            return True
        
        # Check for common coastal city patterns in the name
        coastal_indicators = [
            "port", "harbor", "harbour", "bay", "beach", "coast", "marine", 
            "naval", "marina", "wharf", "dock", "pier", "cape", "inlet"
        ]
        
        place_lower = place_name.lower()
        for indicator in coastal_indicators:
            if indicator in place_lower:
                return True
        
        # For major cities, we can also check if they're near the ocean
        # This is a simplified check - a more sophisticated version could use 
        # actual coastline data
        major_coastal_cities = {
            "cape town", "lagos", "alexandria", "casablanca", "dakar", "mombasa",
            "freetown", "accra", "cotonou", "libreville", "douala", "luanda",
            "maputo", "dar es salaam", "djibouti", "port said", "suez",
            "tunis", "algiers", "rabat", "nouakchott", "conakry", "bissau",
            "banjul", "praia", "sao tome", "malabo", "porto novo", "lome",
            "abidjan", "yamoussoukro", "monrovia", "boston", "miami", "seattle",
            "san francisco", "san diego", "portland", "charleston", "savannah",
            "jacksonville", "tampa", "mobile", "new orleans", "galveston",
            "corpus christi", "brownsville", "baltimore", "philadelphia",
            "norfolk", "wilmington", "barcelona", "valencia", "bilbao",
            "vigo", "cadiz", "malaga", "almeria", "cartagena", "palma",
            "las palmas", "santa cruz", "marseille", "nice", "toulon",
            "brest", "le havre", "calais", "dunkirk", "bordeaux", "nantes",
            "saint nazaire", "genoa", "naples", "palermo", "venice", "trieste",
            "livorno", "bari", "brindisi", "taranto", "catania", "messina",
            "cagliari", "olbia", "porto torres", "piraeus", "thessaloniki",
            "patras", "volos", "kavala", "alexandria", "istanbul", "izmir",
            "mersin", "antalya", "trabzon", "samsun", "sinop", "zonguldak"
        }
        
        return place_lower in major_coastal_cities

def normalize_longitude_crossing(coordinates: List[List[float]]) -> List[List[float]]:
    """
    Normalize longitude coordinates to handle International Date Line crossing.
    Fixes coordinates that go beyond -180/+180 range due to dateline crossing.
    """
    if len(coordinates) < 2:
        return coordinates
    
    normalized = []
    
    for coord in coordinates:
        lon, lat = coord[0], coord[1]
        
        # Normalize longitude to stay within -180 to +180 range
        while lon > 180:
            lon -= 360
        while lon < -180:
            lon += 360
            
        normalized.append([lon, lat])
    
    # Now handle continuity for map visualization
    if len(normalized) < 2:
        return normalized
        
    continuous = [normalized[0]]
    
    for i in range(1, len(normalized)):
        prev_lon = continuous[-1][0]
        curr_lon = normalized[i][0]
        curr_lat = normalized[i][1]
        
        # Calculate the difference between consecutive longitudes
        lon_diff = curr_lon - prev_lon
        
        # If the difference is greater than 180°, choose the shorter path
        if lon_diff > 180:
            # Cross the other way (subtract 360)
            adjusted_lon = curr_lon - 360
        elif lon_diff < -180:
            # Cross the other way (add 360)
            adjusted_lon = curr_lon + 360
        else:
            # No crossing, keep normalized longitude
            adjusted_lon = curr_lon
        
        continuous.append([adjusted_lon, curr_lat])
    
    return continuous

def get_maritime_route(from_lon: float, from_lat: float, to_lon: float, to_lat: float, resolution: int = 20) -> Optional[List[List[float]]]:
    """
    Get maritime route coordinates between two points using SeaRoute
    """
    # Path to SeaRoute in this project
    script_dir = os.path.dirname(os.path.abspath(__file__))
    searoute_dir = os.path.join(script_dir, 'searoute')
    
    # Check if SeaRoute is setup
    if not os.path.exists(os.path.join(searoute_dir, 'searoute.jar')):
        print(f"Warning: SeaRoute not found at {searoute_dir}")
        # Return a straight line as fallback
        return [[from_lon, from_lat], [to_lon, to_lat]]
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create input file
        input_file = os.path.join(temp_dir, 'input.csv')
        output_file = os.path.join(temp_dir, 'output.geojson')
        
        with open(input_file, 'w') as f:
            f.write("route name,olon,olat,dlon,dlat\n")
            f.write(f"route,{from_lon},{from_lat},{to_lon},{to_lat}\n")
        
        try:
            # Run SeaRoute
            result = subprocess.run([
                'java', '-jar', 'searoute.jar',
                '-i', input_file, '-o', output_file, '-res', str(resolution)
            ], cwd=searoute_dir, capture_output=True, text=True, timeout=30)
            
            # Extract coordinates
            if result.returncode == 0 and os.path.exists(output_file):
                with open(output_file) as f:
                    data = json.load(f)
                
                if data.get('features'):
                    geometry = data['features'][0]['geometry']
                    coordinates = None
                    
                    if geometry['type'] == 'MultiLineString':
                        # Flatten coordinate segments
                        coordinates = []
                        for segment in geometry['coordinates']:
                            coordinates.extend(segment)
                    elif geometry['type'] == 'LineString':
                        coordinates = geometry['coordinates']
                    
                    # Normalize coordinates to handle International Date Line crossing
                    if coordinates:
                        return normalize_longitude_crossing(coordinates)
            
        except subprocess.TimeoutExpired:
            print("SeaRoute calculation timed out")
        except Exception as e:
            print(f"Error running SeaRoute: {e}")
    
    # Fallback to straight line
    return [[from_lon, from_lat], [to_lon, to_lat]]

class EnhancedRouteCalculator:
    """Enhanced route calculator with segment-focused optimization"""
    
    def __init__(self):
        self.coordinate_extractor = CoordinateExtractor()
        self.port_finder = PortFinder()
    
    def calculate_enhanced_route(self, origin_name: str, destination_name: str) -> Optional[EnhancedRoute]:
        """
        Calculate an enhanced route with proper segmentation
        """
        # Step 1: Extract coordinates for origin and destination
        origin_coord = self.coordinate_extractor.get_coordinates(origin_name)
        destination_coord = self.coordinate_extractor.get_coordinates(destination_name)
        
        if not origin_coord or not destination_coord:
            print(f"Failed to get coordinates for {origin_name} or {destination_name}")
            return None
        
        # Step 2: Determine route type and segments
        origin_is_port = self.port_finder.is_port_city(origin_name)
        destination_is_port = self.port_finder.is_port_city(destination_name)
        
        segments = []
        route_description = ""
        
        if origin_is_port and destination_is_port:
            # Port to Port - Only sea route
            route_description = f"Port to Port: {origin_name} -> {destination_name}"
            segments = self._create_sea_route(origin_coord, destination_coord, origin_name, destination_name)
            
        elif not origin_is_port and not destination_is_port:
            # Inland to Inland - Land-Sea-Land route
            route_description = f"Inland to Inland: {origin_name} -> {destination_name}"
            segments = self._create_land_sea_land_route(origin_coord, destination_coord, origin_name, destination_name)
            
        elif origin_is_port and not destination_is_port:
            # Port to Inland - Sea-Land route
            route_description = f"Port to Inland: {origin_name} -> {destination_name}"
            segments = self._create_sea_land_route(origin_coord, destination_coord, origin_name, destination_name)
            
        else:  # not origin_is_port and destination_is_port
            # Inland to Port - Land-Sea route
            route_description = f"Inland to Port: {origin_name} -> {destination_name}"
            segments = self._create_land_sea_route(origin_coord, destination_coord, origin_name, destination_name)
        
        if not segments:
            return None
        
        # Calculate totals
        total_distance = sum(segment.distance_km for segment in segments)
        total_waypoints = sum(len(segment.waypoints) for segment in segments)
        
        return EnhancedRoute(
            segments=segments,
            total_distance_km=total_distance,
            total_waypoints=total_waypoints,
            route_description=route_description
        )
    
    def _create_sea_route(self, origin: Coordinate, destination: Coordinate, origin_name: str, destination_name: str) -> List[RouteSegment]:
        """Create a sea-only route between two ports"""
        waypoints_raw = get_maritime_route(origin.lon, origin.lat, destination.lon, destination.lat)
        if not waypoints_raw:
            return []
        
        waypoints = [Coordinate(lon=coord[0], lat=coord[1]) for coord in waypoints_raw]
        distance = self._calculate_distance(waypoints)
        
        return [RouteSegment(
            type=SegmentType.SEA,
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            description=f"Sea route: {origin_name} -> {destination_name}",
            distance_km=distance
        )]
    
    def _create_land_sea_land_route(self, origin: Coordinate, destination: Coordinate, origin_name: str, destination_name: str) -> List[RouteSegment]:
        """Create a land-sea-land route for inland to inland transportation"""
        segments = []
        
        # Find nearest ports
        origin_port_data = self.port_finder.find_nearest_port(origin)
        destination_port_data = self.port_finder.find_nearest_port(destination, exclude_country=origin_port_data.get('country'))
        
        if not origin_port_data or not destination_port_data:
            # Fallback to direct land route
            return self._create_land_route(origin, destination, origin_name, destination_name)
        
        origin_port = Coordinate(origin_port_data['lon'], origin_port_data['lat'])
        destination_port = Coordinate(destination_port_data['lon'], destination_port_data['lat'])
        
        # Segment 1: Land to origin port
        land_waypoints_1 = [origin, origin_port]
        segments.append(RouteSegment(
            type=SegmentType.LAND,
            origin=origin,
            destination=origin_port,
            waypoints=land_waypoints_1,
            description=f"Land: {origin_name} -> {origin_port_data['name']}",
            distance_km=self._calculate_distance(land_waypoints_1)
        ))
        
        # Segment 2: Sea route between ports
        sea_waypoints_raw = get_maritime_route(origin_port.lon, origin_port.lat, destination_port.lon, destination_port.lat)
        if sea_waypoints_raw:
            sea_waypoints = [Coordinate(lon=coord[0], lat=coord[1]) for coord in sea_waypoints_raw]
            segments.append(RouteSegment(
                type=SegmentType.SEA,
                origin=origin_port,
                destination=destination_port,
                waypoints=sea_waypoints,
                description=f"Sea: {origin_port_data['name']} -> {destination_port_data['name']}",
                distance_km=self._calculate_distance(sea_waypoints)
            ))
        
        # Segment 3: Destination port to land
        land_waypoints_2 = [destination_port, destination]
        segments.append(RouteSegment(
            type=SegmentType.LAND,
            origin=destination_port,
            destination=destination,
            waypoints=land_waypoints_2,
            description=f"Land: {destination_port_data['name']} -> {destination_name}",
            distance_km=self._calculate_distance(land_waypoints_2)
        ))
        
        return segments
    
    def _create_sea_land_route(self, origin: Coordinate, destination: Coordinate, origin_name: str, destination_name: str) -> List[RouteSegment]:
        """Create a sea-land route (port to inland)"""
        segments = []
        
        # Find nearest port to destination
        destination_port_data = self.port_finder.find_nearest_port(destination)
        if not destination_port_data:
            # Fallback to direct route
            return self._create_land_route(origin, destination, origin_name, destination_name)
        
        destination_port = Coordinate(destination_port_data['lon'], destination_port_data['lat'])
        
        # Segment 1: Sea route to destination port
        sea_waypoints_raw = get_maritime_route(origin.lon, origin.lat, destination_port.lon, destination_port.lat)
        if sea_waypoints_raw:
            sea_waypoints = [Coordinate(lon=coord[0], lat=coord[1]) for coord in sea_waypoints_raw]
            segments.append(RouteSegment(
                type=SegmentType.SEA,
                origin=origin,
                destination=destination_port,
                waypoints=sea_waypoints,
                description=f"Sea: {origin_name} -> {destination_port_data['name']}",
                distance_km=self._calculate_distance(sea_waypoints)
            ))
        
        # Segment 2: Land from port to destination
        land_waypoints = [destination_port, destination]
        segments.append(RouteSegment(
            type=SegmentType.LAND,
            origin=destination_port,
            destination=destination,
            waypoints=land_waypoints,
            description=f"Land: {destination_port_data['name']} -> {destination_name}",
            distance_km=self._calculate_distance(land_waypoints)
        ))
        
        return segments
    
    def _create_land_sea_route(self, origin: Coordinate, destination: Coordinate, origin_name: str, destination_name: str) -> List[RouteSegment]:
        """Create a land-sea route (inland to port)"""
        segments = []
        
        # Find nearest port to origin
        origin_port_data = self.port_finder.find_nearest_port(origin)
        if not origin_port_data:
            # Fallback to direct route
            return self._create_land_route(origin, destination, origin_name, destination_name)
        
        origin_port = Coordinate(origin_port_data['lon'], origin_port_data['lat'])
        
        # Segment 1: Land to origin port
        land_waypoints = [origin, origin_port]
        segments.append(RouteSegment(
            type=SegmentType.LAND,
            origin=origin,
            destination=origin_port,
            waypoints=land_waypoints,
            description=f"Land: {origin_name} -> {origin_port_data['name']}",
            distance_km=self._calculate_distance(land_waypoints)
        ))
        
        # Segment 2: Sea route from port to destination
        # Get raw coordinates first
        sea_waypoints_raw = get_maritime_route(origin_port.lon, origin_port.lat, destination.lon, destination.lat)
        if sea_waypoints_raw:
            # Convert to Coordinate objects
            sea_waypoints = [Coordinate(lon=coord[0], lat=coord[1]) for coord in sea_waypoints_raw]
            
            segments.append(RouteSegment(
                type=SegmentType.SEA,
                origin=origin_port,
                destination=destination,
                waypoints=sea_waypoints,
                description=f"Sea: {origin_port_data['name']} -> {destination_name}",
                distance_km=self._calculate_distance(sea_waypoints)
            ))
        
        return segments
    
    def _create_land_route(self, origin: Coordinate, destination: Coordinate, origin_name: str, destination_name: str) -> List[RouteSegment]:
        """Create a direct land route as fallback"""
        waypoints = [origin, destination]
        distance = self._calculate_distance(waypoints)
        
        return [RouteSegment(
            type=SegmentType.LAND,
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            description=f"Direct land route: {origin_name} -> {destination_name}",
            distance_km=distance
        )]
    
    def _calculate_distance(self, waypoints: List[Coordinate]) -> float:
        """Calculate approximate distance from waypoints (simplified)"""
        if len(waypoints) < 2:
            return 0.0
        
        total_distance = 0.0
        for i in range(len(waypoints) - 1):
            # Simple Euclidean distance * 111 km (approx km per degree)
            dx = waypoints[i+1].lon - waypoints[i].lon
            dy = waypoints[i+1].lat - waypoints[i].lat
            distance = ((dx * 111) ** 2 + (dy * 111) ** 2) ** 0.5
            total_distance += distance
        
        return total_distance

def route_to_json(route: EnhancedRoute) -> Dict[str, Any]:
    """Convert EnhancedRoute to JSON-serializable dictionary"""
    return {
        "segments": [
            {
                "type": segment.type.value,
                "origin": {"lon": segment.origin.lon, "lat": segment.origin.lat},
                "destination": {"lon": segment.destination.lon, "lat": segment.destination.lat},
                "waypoints": [{"lon": wp.lon, "lat": wp.lat} for wp in segment.waypoints],
                "description": segment.description,
                "distance_km": segment.distance_km
            }
            for segment in route.segments
        ],
        "total_distance_km": route.total_distance_km,
        "total_waypoints": route.total_waypoints,
        "route_description": route.route_description
    }

# Example usage and testing
if __name__ == "__main__":
    calculator = EnhancedRouteCalculator()
    
    # Check if running as command line tool
    if len(sys.argv) >= 4 and sys.argv[1] == "calculate_route":
        origin = sys.argv[2]
        destination = sys.argv[3]
        
        route = calculator.calculate_enhanced_route(origin, destination)
        if route:
            print(json.dumps(route_to_json(route)))
        else:
            print(json.dumps({"error": "Failed to calculate route"}))
        sys.exit(0)
    
    # Interactive testing mode
    test_routes = [
        ("Shanghai", "Bogota"),     # Port to inland
        ("Shanghai", "Rotterdam"),  # Port to port
        ("Bogota", "Salt Lake City"), # Inland to inland
        ("Denver", "Hamburg")       # Inland to port
    ]
    
    print("=== Enhanced Route Calculator Testing ===\n")
    
    for origin, destination in test_routes:
        print(f"Calculating route: {origin} -> {destination}")
        route = calculator.calculate_enhanced_route(origin, destination)
        
        if route:
            print(f"✓ {route.route_description}")
            print(f"  Total Distance: {route.total_distance_km:.1f} km")
            print(f"  Total Waypoints: {route.total_waypoints}")
            print(f"  Segments: {len(route.segments)}")
            
            for i, segment in enumerate(route.segments):
                print(f"    {i+1}. {segment.type.value.upper()}: {segment.description}")
                print(f"       Distance: {segment.distance_km:.1f} km, Waypoints: {len(segment.waypoints)}")
        else:
            print(f"✗ Failed to calculate route")
        
        print()
