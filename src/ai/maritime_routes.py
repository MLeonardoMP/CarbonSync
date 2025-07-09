#!/usr/bin/env python3
"""
Maritime Route Calculator for Logistics App
Simple client to get route coordinates between two points
"""

import subprocess
import json
import tempfile
import os

def get_maritime_route(from_lon, from_lat, to_lon, to_lat, resolution=20):
    """
    Get maritime route coordinates between two points
    
    Args:
        from_lon, from_lat: Origin coordinates
        to_lon, to_lat: Destination coordinates  
        resolution: Route resolution in km (5, 10, 20, 50, 100)
    
    Returns:
        List of [longitude, latitude] coordinate pairs or None if failed
    """
    
    # Path to SeaRoute in this project
    script_dir = os.path.dirname(os.path.abspath(__file__))
    searoute_dir = os.path.join(script_dir, 'searoute')
    
    # Check if SeaRoute is setup
    if not os.path.exists(os.path.join(searoute_dir, 'searoute.jar')):
        raise FileNotFoundError(f"SeaRoute not found. Please copy searoute/ folder to {script_dir}")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create input file
        input_file = os.path.join(temp_dir, 'input.csv')
        output_file = os.path.join(temp_dir, 'output.geojson')
        
        with open(input_file, 'w') as f:
            f.write("route name,olon,olat,dlon,dlat\n")
            f.write(f"route,{from_lon},{from_lat},{to_lon},{to_lat}\n")
        
        # Run SeaRoute
        result = subprocess.run([
            'java', '-jar', 'searoute.jar',
            '-i', input_file, '-o', output_file, '-res', str(resolution)
        ], cwd=searoute_dir, capture_output=True, text=True)
        
        # Extract coordinates
        if result.returncode == 0 and os.path.exists(output_file):
            with open(output_file) as f:
                data = json.load(f)
            
            if data.get('features'):
                geometry = data['features'][0]['geometry']
                if geometry['type'] == 'MultiLineString':
                    # Flatten coordinate segments
                    coordinates = []
                    for segment in geometry['coordinates']:
                        coordinates.extend(segment)
                    return coordinates
    
    return None

def calculate_shipping_route(origin_port, destination_port):
    """
    Calculate shipping route between two ports
    
    Args:
        origin_port: Dict with 'name', 'lon', 'lat'
        destination_port: Dict with 'name', 'lon', 'lat'
    
    Returns:
        Dict with route information
    """
    
    coordinates = get_maritime_route(
        origin_port['lon'], origin_port['lat'],
        destination_port['lon'], destination_port['lat'],
        resolution=20  # Good balance of speed and accuracy
    )
    
    if coordinates:
        return {
            'success': True,
            'from_port': origin_port['name'],
            'to_port': destination_port['name'],
            'waypoints': coordinates,
            'total_waypoints': len(coordinates),
            'start_coord': coordinates[0],
            'end_coord': coordinates[-1]
        }
    else:
        return {
            'success': False,
            'error': f"Could not calculate route from {origin_port['name']} to {destination_port['name']}"
        }

# Example usage and testing
if __name__ == "__main__":
    print("=== Maritime Route Calculator ===")
    print()
    
    # Define some major ports
    ports = {
        'shanghai': {'name': 'Shanghai', 'lon': 121.8, 'lat': 31.2},
        'rotterdam': {'name': 'Rotterdam', 'lon': 4.5, 'lat': 51.9},
        'singapore': {'name': 'Singapore', 'lon': 103.8, 'lat': 1.3},
        'los_angeles': {'name': 'Los Angeles', 'lon': -118.2, 'lat': 34.1},
        'hamburg': {'name': 'Hamburg', 'lon': 10.0, 'lat': 53.6}
    }
    
    # Test route calculation
    print("Calculating route: Rotterdam → Shanghai")
    route = calculate_shipping_route(ports['rotterdam'], ports['shanghai'])
    
    if route['success']:
        print(f"✓ Route calculated successfully!")
        print(f"  From: {route['from_port']}")
        print(f"  To: {route['to_port']}")
        print(f"  Waypoints: {route['total_waypoints']}")
        print(f"  Start: [{route['start_coord'][0]:.3f}, {route['start_coord'][1]:.3f}]")
        print(f"  End: [{route['end_coord'][0]:.3f}, {route['end_coord'][1]:.3f}]")
        
        # Show first few waypoints
        print("  First 5 waypoints:")
        for i, coord in enumerate(route['waypoints'][:5]):
            print(f"    {i+1}. [{coord[0]:.3f}, {coord[1]:.3f}]")
            
    else:
        print(f"✗ {route['error']}")
    
    print()
    print("=== Testing Multiple Routes ===")
    
    test_routes = [
        ('hamburg', 'singapore'),
        ('los_angeles', 'rotterdam'),
        ('singapore', 'los_angeles')
    ]
    
    for from_port, to_port in test_routes:
        route = calculate_shipping_route(ports[from_port], ports[to_port])
        if route['success']:
            print(f"✓ {route['from_port']} → {route['to_port']}: {route['total_waypoints']} waypoints")
        else:
            print(f"✗ {ports[from_port]['name']} → {ports[to_port]['name']}: Failed")
