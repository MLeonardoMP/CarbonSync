#!/usr/bin/env python3
"""
Test script for enhanced route planning with smart land-only decisions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.ai.enhanced_maritime_routes import EnhancedRouteCalculator, route_to_json
import json

def test_domestic_routes():
    """Test that domestic routes prefer land-only transport"""
    calculator = EnhancedRouteCalculator()
    
    test_cases = [
        {
            "name": "Colombia Domestic - Bogotá to Medellín",
            "origin": "Bogotá, Colombia",
            "destination": "Medellín, Colombia",
            "expected": "land-only",
            "description": "Should use direct truck route for domestic Colombian journey"
        },
        {
            "name": "Colombia Domestic - Bogotá to Cali", 
            "origin": "Bogotá, Colombia",
            "destination": "Cali, Colombia",
            "expected": "land-only",
            "description": "Should use direct truck route within Colombia"
        },
        {
            "name": "Short International - Miami to Havana",
            "origin": "Miami, USA",
            "destination": "Havana, Cuba", 
            "expected": "sea",
            "description": "Should use sea route due to water crossing"
        },
        {
            "name": "Long International - New York to London",
            "origin": "New York, USA",
            "destination": "London, UK",
            "expected": "sea",
            "description": "Should use sea route for trans-Atlantic"
        }
    ]
    
    print("🚛 Testing Enhanced Route Planning with Smart Mode Selection")
    print("=" * 60)
    
    for test_case in test_cases:
        print(f"\n📍 Test: {test_case['name']}")
        print(f"Route: {test_case['origin']} → {test_case['destination']}")
        print(f"Expected: {test_case['expected']} transport")
        print(f"Reason: {test_case['description']}")
        
        try:
            route = calculator.calculate_enhanced_route(test_case['origin'], test_case['destination'])
            
            if route:
                print(f"✅ Route calculated: {route.route_description}")
                print(f"📏 Total distance: {route.total_distance_km:.1f} km")
                print(f"🔗 Segments: {len(route.segments)}")
                
                # Analyze route composition
                land_segments = [s for s in route.segments if s.type.value == 'land']
                sea_segments = [s for s in route.segments if s.type.value == 'sea']
                
                if len(route.segments) == 1 and land_segments:
                    actual_type = "land-only"
                    print(f"🚛 Route type: LAND-ONLY truck transport")
                elif sea_segments:
                    actual_type = "multimodal"
                    print(f"🚢 Route type: MULTIMODAL (sea + land)")
                else:
                    actual_type = "land-only"
                    print(f"🚛 Route type: LAND-ONLY")
                
                # Segment details
                for i, segment in enumerate(route.segments):
                    print(f"  Segment {i+1}: {segment.type.value.upper()} - {segment.description}")
                    print(f"    Distance: {segment.distance_km:.1f} km")
                
                # Validation
                if test_case['expected'] == 'land-only' and actual_type == 'land-only':
                    print("✅ PASS: Correctly chose land-only transport")
                elif test_case['expected'] == 'sea' and actual_type == 'multimodal':
                    print("✅ PASS: Correctly chose multimodal transport")
                else:
                    print(f"❌ FAIL: Expected {test_case['expected']}, got {actual_type}")
                    
            else:
                print("❌ Failed to calculate route")
                
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print("-" * 40)

if __name__ == "__main__":
    test_domestic_routes()
