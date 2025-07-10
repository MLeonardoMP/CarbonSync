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
        "santos": {"name": "Santos", "lon": -46.3, "lat": -23.9, "country": "Brazil"},
        # Additional European ports
        "le_havre": {"name": "Le Havre", "lon": 0.1, "lat": 49.5, "country": "France"},
        "piraeus": {"name": "Piraeus", "lon": 23.6, "lat": 37.9, "country": "Greece"},
        "genova": {"name": "Genova", "lon": 8.9, "lat": 44.4, "country": "Italy"},
        "valencia": {"name": "Valencia", "lon": -0.4, "lat": 39.5, "country": "Spain"},
        "felixstowe": {"name": "Felixstowe", "lon": 1.3, "lat": 51.9, "country": "UK"},
        "bremerhaven": {"name": "Bremerhaven", "lon": 8.6, "lat": 53.5, "country": "Germany"},
        # Additional Asian ports
        "busan": {"name": "Busan", "lon": 129.0, "lat": 35.1, "country": "South Korea"},
        "tokyo": {"name": "Tokyo", "lon": 139.7, "lat": 35.7, "country": "Japan"},
        "kobe": {"name": "Kobe", "lon": 135.2, "lat": 34.7, "country": "Japan"},
        "port_klang": {"name": "Port Klang", "lon": 101.4, "lat": 3.0, "country": "Malaysia"},
        "tanjung_pelepas": {"name": "Tanjung Pelepas", "lon": 103.5, "lat": 1.4, "country": "Malaysia"},
        "jakarta": {"name": "Jakarta", "lon": 106.8, "lat": -6.1, "country": "Indonesia"},
        "colombo": {"name": "Colombo", "lon": 79.8, "lat": 6.9, "country": "Sri Lanka"},
        "karachi": {"name": "Karachi", "lon": 67.0, "lat": 24.9, "country": "Pakistan"},
        "haifa": {"name": "Haifa", "lon": 34.9, "lat": 32.8, "country": "Israel"},
        "beirut": {"name": "Beirut", "lon": 35.5, "lat": 33.8, "country": "Lebanon"},
        # Additional North American ports
        "long_beach": {"name": "Long Beach", "lon": -118.2, "lat": 33.8, "country": "USA"},
        "seattle": {"name": "Seattle", "lon": -122.3, "lat": 47.6, "country": "USA"},
        "new_orleans": {"name": "New Orleans", "lon": -90.1, "lat": 29.9, "country": "USA"},
        "charleston": {"name": "Charleston", "lon": -79.9, "lat": 32.8, "country": "USA"},
        "savannah": {"name": "Savannah", "lon": -81.1, "lat": 32.1, "country": "USA"},
        "miami": {"name": "Miami", "lon": -80.2, "lat": 25.8, "country": "USA"},
        "montreal": {"name": "Montreal", "lon": -73.6, "lat": 45.5, "country": "Canada"},
        # Additional South American ports
        "valparaiso": {"name": "Valparaiso", "lon": -71.6, "lat": -33.0, "country": "Chile"},
        "buenos_aires": {"name": "Buenos Aires", "lon": -58.7, "lat": -34.6, "country": "Argentina"},
        "rio_de_janeiro": {"name": "Rio de Janeiro", "lon": -43.2, "lat": -22.9, "country": "Brazil"},
        "guayaquil": {"name": "Guayaquil", "lon": -79.9, "lat": -2.2, "country": "Ecuador"},
        "cartagena": {"name": "Cartagena", "lon": -75.5, "lat": 10.4, "country": "Colombia"},
        "veracruz": {"name": "Veracruz", "lon": -96.1, "lat": 19.2, "country": "Mexico"},
        "manzanillo": {"name": "Manzanillo", "lon": -104.3, "lat": 19.0, "country": "Mexico"},
        # Additional African ports
        "dar_es_salaam": {"name": "Dar es Salaam", "lon": 39.3, "lat": -6.8, "country": "Tanzania"},
        "mombasa": {"name": "Mombasa", "lon": 39.7, "lat": -4.0, "country": "Kenya"},
        "abidjan": {"name": "Abidjan", "lon": -4.0, "lat": 5.3, "country": "Ivory Coast"},
        "tema": {"name": "Tema", "lon": 0.0, "lat": 5.6, "country": "Ghana"},
        "lome": {"name": "Lome", "lon": 1.2, "lat": 6.1, "country": "Togo"},
        "algiers": {"name": "Algiers", "lon": 3.0, "lat": 36.8, "country": "Algeria"},
        "tunis": {"name": "Tunis", "lon": 10.2, "lat": 36.8, "country": "Tunisia"},
        # Additional Oceania ports
        "melbourne": {"name": "Melbourne", "lon": 144.9, "lat": -37.8, "country": "Australia"},
        "brisbane": {"name": "Brisbane", "lon": 153.0, "lat": -27.5, "country": "Australia"},
        "adelaide": {"name": "Adelaide", "lon": 138.6, "lat": -34.9, "country": "Australia"},
        "auckland": {"name": "Auckland", "lon": 174.8, "lat": -36.8, "country": "New Zealand"},
        "wellington": {"name": "Wellington", "lon": 174.8, "lat": -41.3, "country": "New Zealand"},
        # Additional Middle Eastern ports
        "jeddah": {"name": "Jeddah", "lon": 39.2, "lat": 21.5, "country": "Saudi Arabia"},
        "dammam": {"name": "Dammam", "lon": 50.1, "lat": 26.4, "country": "Saudi Arabia"},
        "doha": {"name": "Doha", "lon": 51.5, "lat": 25.3, "country": "Qatar"},
        "kuwait_city": {"name": "Kuwait City", "lon": 47.9, "lat": 29.4, "country": "Kuwait"},
        "bandar_abbas": {"name": "Bandar Abbas", "lon": 56.3, "lat": 27.2, "country": "Iran"},
        "muscat": {"name": "Muscat", "lon": 58.4, "lat": 23.6, "country": "Oman"},
        # Additional Baltic and Scandinavian ports
        "helsinki": {"name": "Helsinki", "lon": 24.9, "lat": 60.2, "country": "Finland"},
        "stockholm": {"name": "Stockholm", "lon": 18.1, "lat": 59.3, "country": "Sweden"},
        "copenhagen": {"name": "Copenhagen", "lon": 12.6, "lat": 55.7, "country": "Denmark"},
        "oslo": {"name": "Oslo", "lon": 10.7, "lat": 59.9, "country": "Norway"},
        "riga": {"name": "Riga", "lon": 24.1, "lat": 56.9, "country": "Latvia"},
        "tallinn": {"name": "Tallinn", "lon": 24.7, "lat": 59.4, "country": "Estonia"},
        "st_petersburg": {"name": "St. Petersburg", "lon": 30.3, "lat": 59.9, "country": "Russia"},
        # Caribbean and Central American ports
        "san_juan": {"name": "San Juan", "lon": -66.1, "lat": 18.5, "country": "Puerto Rico"},
        "kingston": {"name": "Kingston", "lon": -76.8, "lat": 18.0, "country": "Jamaica"},
        "port_of_spain": {"name": "Port of Spain", "lon": -61.5, "lat": 10.7, "country": "Trinidad and Tobago"},
        "panama_city": {"name": "Panama City", "lon": -79.5, "lat": 9.0, "country": "Panama"},
        "colon": {"name": "Colon", "lon": -79.9, "lat": 9.4, "country": "Panama"},
        "puerto_limon": {"name": "Puerto Limon", "lon": -83.0, "lat": 10.0, "country": "Costa Rica"},
        # Additional major Chinese ports
        "tianjin": {"name": "Tianjin", "lon": 117.2, "lat": 39.1, "country": "China"},
        "qingdao": {"name": "Qingdao", "lon": 120.4, "lat": 36.1, "country": "China"},
        "guangzhou": {"name": "Guangzhou", "lon": 113.3, "lat": 23.1, "country": "China"},
        "shenzhen": {"name": "Shenzhen", "lon": 114.1, "lat": 22.5, "country": "China"},
        "ningbo": {"name": "Ningbo", "lon": 121.5, "lat": 29.9, "country": "China"},
        "dalian": {"name": "Dalian", "lon": 121.6, "lat": 38.9, "country": "China"},
        "xiamen": {"name": "Xiamen", "lon": 118.1, "lat": 24.5, "country": "China"},
        # Additional Indian Ocean ports
        "visakhapatnam": {"name": "Visakhapatnam", "lon": 83.3, "lat": 17.7, "country": "India"},
        "kandla": {"name": "Kandla", "lon": 70.2, "lat": 23.0, "country": "India"},
        "cochin": {"name": "Cochin", "lon": 76.2, "lat": 10.0, "country": "India"},
        "tuticorin": {"name": "Tuticorin", "lon": 78.1, "lat": 8.8, "country": "India"},
        "paradip": {"name": "Paradip", "lon": 86.6, "lat": 20.3, "country": "India"},
        "chittagong": {"name": "Chittagong", "lon": 91.8, "lat": 22.3, "country": "Bangladesh"},
        "port_sudan": {"name": "Port Sudan", "lon": 37.2, "lat": 19.6, "country": "Sudan"},
        "djibouti": {"name": "Djibouti", "lon": 43.1, "lat": 11.6, "country": "Djibouti"},
        "aden": {"name": "Aden", "lon": 45.0, "lat": 12.8, "country": "Yemen"},
        "sohar": {"name": "Sohar", "lon": 56.7, "lat": 24.4, "country": "Oman"},
        # Additional Southeast Asian ports
        "ho_chi_minh": {"name": "Ho Chi Minh City", "lon": 106.7, "lat": 10.8, "country": "Vietnam"},
        "haiphong": {"name": "Haiphong", "lon": 106.7, "lat": 20.9, "country": "Vietnam"},
        "manila": {"name": "Manila", "lon": 121.0, "lat": 14.6, "country": "Philippines"},
        "cebu": {"name": "Cebu", "lon": 123.9, "lat": 10.3, "country": "Philippines"},
        "bangkok": {"name": "Bangkok", "lon": 100.5, "lat": 13.8, "country": "Thailand"},
        "laem_chabang": {"name": "Laem Chabang", "lon": 100.9, "lat": 13.1, "country": "Thailand"},
        "yangon": {"name": "Yangon", "lon": 96.2, "lat": 16.8, "country": "Myanmar"},
        "sihanoukville": {"name": "Sihanoukville", "lon": 103.5, "lat": 10.6, "country": "Cambodia"},
        # Additional Russian and Arctic ports
        "vladivostok": {"name": "Vladivostok", "lon": 131.9, "lat": 43.1, "country": "Russia"},
        "novorossiysk": {"name": "Novorossiysk", "lon": 37.8, "lat": 44.7, "country": "Russia"},
        "kaliningrad": {"name": "Kaliningrad", "lon": 20.5, "lat": 54.7, "country": "Russia"},
        "arkhangelsk": {"name": "Arkhangelsk", "lon": 40.5, "lat": 64.5, "country": "Russia"},
        "murmansk": {"name": "Murmansk", "lon": 33.1, "lat": 68.9, "country": "Russia"},
        # Additional Mediterranean ports
        "barcelona": {"name": "Barcelona", "lon": 2.2, "lat": 41.4, "country": "Spain"},
        "marseille": {"name": "Marseille", "lon": 5.4, "lat": 43.3, "country": "France"},
        "naples": {"name": "Naples", "lon": 14.3, "lat": 40.8, "country": "Italy"},
        "venice": {"name": "Venice", "lon": 12.3, "lat": 45.4, "country": "Italy"},
        "istanbul": {"name": "Istanbul", "lon": 29.0, "lat": 41.0, "country": "Turkey"},
        "izmir": {"name": "Izmir", "lon": 27.1, "lat": 38.4, "country": "Turkey"},
        "mersin": {"name": "Mersin", "lon": 34.6, "lat": 36.8, "country": "Turkey"},
        "limassol": {"name": "Limassol", "lon": 33.0, "lat": 34.7, "country": "Cyprus"},
        "malta": {"name": "Malta", "lon": 14.5, "lat": 35.9, "country": "Malta"},
        "palermo": {"name": "Palermo", "lon": 13.4, "lat": 38.1, "country": "Italy"},
        # Additional North African ports
        "rabat": {"name": "Rabat", "lon": -6.8, "lat": 34.0, "country": "Morocco"},
        "tangier": {"name": "Tangier", "lon": -5.8, "lat": 35.8, "country": "Morocco"},
        "oran": {"name": "Oran", "lon": -0.6, "lat": 35.7, "country": "Algeria"},
        "sfax": {"name": "Sfax", "lon": 10.8, "lat": 34.7, "country": "Tunisia"},
        "benghazi": {"name": "Benghazi", "lon": 20.1, "lat": 32.1, "country": "Libya"},
        "tripoli": {"name": "Tripoli", "lon": 13.2, "lat": 32.9, "country": "Libya"},
        # Additional West African ports
        "freetown": {"name": "Freetown", "lon": -13.2, "lat": 8.5, "country": "Sierra Leone"},
        "conakry": {"name": "Conakry", "lon": -13.7, "lat": 9.5, "country": "Guinea"},
        "bissau": {"name": "Bissau", "lon": -15.6, "lat": 11.9, "country": "Guinea-Bissau"},
        "banjul": {"name": "Banjul", "lon": -16.6, "lat": 13.5, "country": "Gambia"},
        "nouakchott": {"name": "Nouakchott", "lon": -15.9, "lat": 18.1, "country": "Mauritania"},
        "cotonou": {"name": "Cotonou", "lon": 2.4, "lat": 6.4, "country": "Benin"},
        "porto_novo": {"name": "Porto Novo", "lon": 2.6, "lat": 6.5, "country": "Benin"},
        "libreville": {"name": "Libreville", "lon": 9.5, "lat": 0.4, "country": "Gabon"},
        "douala": {"name": "Douala", "lon": 9.7, "lat": 4.0, "country": "Cameroon"},
        "malabo": {"name": "Malabo", "lon": 8.8, "lat": 3.8, "country": "Equatorial Guinea"},
        # Additional East African ports
        "port_said": {"name": "Port Said", "lon": 32.3, "lat": 31.3, "country": "Egypt"},
        "suez": {"name": "Suez", "lon": 32.5, "lat": 29.9, "country": "Egypt"},
        "massawa": {"name": "Massawa", "lon": 39.5, "lat": 15.6, "country": "Eritrea"},
        "berbera": {"name": "Berbera", "lon": 45.0, "lat": 10.4, "country": "Somalia"},
        "mogadishu": {"name": "Mogadishu", "lon": 45.3, "lat": 2.0, "country": "Somalia"},
        "kilifi": {"name": "Kilifi", "lon": 39.8, "lat": -3.6, "country": "Kenya"},
        "tanga": {"name": "Tanga", "lon": 39.1, "lat": -5.1, "country": "Tanzania"},
        "zanzibar": {"name": "Zanzibar", "lon": 39.2, "lat": -6.2, "country": "Tanzania"},
        "nacala": {"name": "Nacala", "lon": 40.7, "lat": -14.5, "country": "Mozambique"},
        "maputo": {"name": "Maputo", "lon": 32.6, "lat": -25.9, "country": "Mozambique"},
        "beira": {"name": "Beira", "lon": 34.8, "lat": -19.8, "country": "Mozambique"},
        "antsiranana": {"name": "Antsiranana", "lon": 49.3, "lat": -12.3, "country": "Madagascar"},
        "toamasina": {"name": "Toamasina", "lon": 49.4, "lat": -18.2, "country": "Madagascar"},
        "port_louis": {"name": "Port Louis", "lon": 57.5, "lat": -20.2, "country": "Mauritius"},
        "victoria": {"name": "Victoria", "lon": 55.5, "lat": -4.6, "country": "Seychelles"},
        # Additional Southern African ports
        "luanda": {"name": "Luanda", "lon": 13.2, "lat": -8.8, "country": "Angola"},
        "lobito": {"name": "Lobito", "lon": 13.5, "lat": -12.4, "country": "Angola"},
        "walvis_bay": {"name": "Walvis Bay", "lon": 14.5, "lat": -22.9, "country": "Namibia"},
        "port_elizabeth": {"name": "Port Elizabeth", "lon": 25.6, "lat": -33.9, "country": "South Africa"},
        "east_london": {"name": "East London", "lon": 27.9, "lat": -33.0, "country": "South Africa"},
        "richards_bay": {"name": "Richards Bay", "lon": 32.0, "lat": -28.8, "country": "South Africa"},
        "mossel_bay": {"name": "Mossel Bay", "lon": 22.1, "lat": -34.2, "country": "South Africa"},
        # Additional Pacific Island ports
        "suva": {"name": "Suva", "lon": 178.4, "lat": -18.1, "country": "Fiji"},
        "lautoka": {"name": "Lautoka", "lon": 177.5, "lat": -17.6, "country": "Fiji"},
        "noumea": {"name": "Noumea", "lon": 166.4, "lat": -22.3, "country": "New Caledonia"},
        "papeete": {"name": "Papeete", "lon": -149.6, "lat": -17.5, "country": "French Polynesia"},
        "port_vila": {"name": "Port Vila", "lon": 168.3, "lat": -17.7, "country": "Vanuatu"},
        "nuku_alofa": {"name": "Nuku'alofa", "lon": -175.2, "lat": -21.1, "country": "Tonga"},
        "apia": {"name": "Apia", "lon": -171.8, "lat": -13.8, "country": "Samoa"},
        "port_moresby": {"name": "Port Moresby", "lon": 147.2, "lat": -9.4, "country": "Papua New Guinea"},
        "honiara": {"name": "Honiara", "lon": 159.9, "lat": -9.4, "country": "Solomon Islands"},
        # Additional Canadian ports
        "halifax": {"name": "Halifax", "lon": -63.6, "lat": 44.6, "country": "Canada"},
        "saint_john": {"name": "Saint John", "lon": -66.1, "lat": 45.3, "country": "Canada"},
        "thunder_bay": {"name": "Thunder Bay", "lon": -89.2, "lat": 48.4, "country": "Canada"},
        "prince_rupert": {"name": "Prince Rupert", "lon": -130.3, "lat": 54.3, "country": "Canada"},
        "churchill": {"name": "Churchill", "lon": -94.2, "lat": 58.8, "country": "Canada"},
        # Additional Central and South American ports
        "acapulco": {"name": "Acapulco", "lon": -99.9, "lat": 16.9, "country": "Mexico"},
        "puerto_vallarta": {"name": "Puerto Vallarta", "lon": -105.2, "lat": 20.6, "country": "Mexico"},
        "salina_cruz": {"name": "Salina Cruz", "lon": -95.2, "lat": 16.2, "country": "Mexico"},
        "progreso": {"name": "Progreso", "lon": -89.7, "lat": 21.3, "country": "Mexico"},
        "puerto_cortes": {"name": "Puerto Cortes", "lon": -87.9, "lat": 15.8, "country": "Honduras"},
        "acajutla": {"name": "Acajutla", "lon": -89.8, "lat": 13.6, "country": "El Salvador"},
        "puerto_quetzal": {"name": "Puerto Quetzal", "lon": -90.8, "lat": 13.9, "country": "Guatemala"},
        "puerto_barrios": {"name": "Puerto Barrios", "lon": -88.6, "lat": 15.7, "country": "Guatemala"},
        "bluefields": {"name": "Bluefields", "lon": -83.8, "lat": 12.0, "country": "Nicaragua"},
        "la_ceiba": {"name": "La Ceiba", "lon": -86.8, "lat": 15.8, "country": "Honduras"},
        "bridgetown": {"name": "Bridgetown", "lon": -59.6, "lat": 13.1, "country": "Barbados"},
        "st_johns": {"name": "St. John's", "lon": -61.9, "lat": 17.1, "country": "Antigua and Barbuda"},
        "castries": {"name": "Castries", "lon": -61.0, "lat": 14.0, "country": "Saint Lucia"},
        "roseau": {"name": "Roseau", "lon": -61.4, "lat": 15.3, "country": "Dominica"},
        "st_georges": {"name": "St. George's", "lon": -61.8, "lat": 12.1, "country": "Grenada"},
        "paramaribo": {"name": "Paramaribo", "lon": -55.2, "lat": 5.9, "country": "Suriname"},
        "cayenne": {"name": "Cayenne", "lon": -52.3, "lat": 4.9, "country": "French Guiana"},
        "georgetown_guyana": {"name": "Georgetown", "lon": -58.2, "lat": 6.8, "country": "Guyana"},
        "fortaleza": {"name": "Fortaleza", "lon": -38.5, "lat": -3.7, "country": "Brazil"},
        "recife": {"name": "Recife", "lon": -34.9, "lat": -8.1, "country": "Brazil"},
        "salvador": {"name": "Salvador", "lon": -38.5, "lat": -12.9, "country": "Brazil"},
        "vitoria": {"name": "Vitoria", "lon": -40.3, "lat": -20.3, "country": "Brazil"},
        "paranagua": {"name": "Paranagua", "lon": -48.5, "lat": -25.5, "country": "Brazil"},
        "itajai": {"name": "Itajai", "lon": -48.7, "lat": -26.9, "country": "Brazil"},
        "rio_grande": {"name": "Rio Grande", "lon": -52.1, "lat": -32.0, "country": "Brazil"},
        "montevideo": {"name": "Montevideo", "lon": -56.2, "lat": -34.9, "country": "Uruguay"},
        "la_plata": {"name": "La Plata", "lon": -57.9, "lat": -34.9, "country": "Argentina"},
        "bahia_blanca": {"name": "Bahia Blanca", "lon": -62.3, "lat": -38.7, "country": "Argentina"},
        "puerto_madryn": {"name": "Puerto Madryn", "lon": -65.0, "lat": -42.8, "country": "Argentina"},
        "ushuaia": {"name": "Ushuaia", "lon": -68.3, "lat": -54.8, "country": "Argentina"},
        "antofagasta": {"name": "Antofagasta", "lon": -70.4, "lat": -23.6, "country": "Chile"},
        "iquique": {"name": "Iquique", "lon": -70.1, "lat": -20.2, "country": "Chile"},
        "arica": {"name": "Arica", "lon": -70.3, "lat": -18.5, "country": "Chile"},
        "talcahuano": {"name": "Talcahuano", "lon": -73.1, "lat": -36.7, "country": "Chile"},
        "puerto_montt": {"name": "Puerto Montt", "lon": -72.9, "lat": -41.5, "country": "Chile"},
        "punta_arenas": {"name": "Punta Arenas", "lon": -70.9, "lat": -53.1, "country": "Chile"},
        "esmeraldas": {"name": "Esmeraldas", "lon": -79.7, "lat": 1.0, "country": "Ecuador"},
        "manta": {"name": "Manta", "lon": -80.7, "lat": -0.9, "country": "Ecuador"},
        "salaverry": {"name": "Salaverry", "lon": -78.9, "lat": -8.2, "country": "Peru"},
        "paita": {"name": "Paita", "lon": -81.1, "lat": -5.1, "country": "Peru"},
        "ilo": {"name": "Ilo", "lon": -71.3, "lat": -17.6, "country": "Peru"},
        "santa_marta": {"name": "Santa Marta", "lon": -74.2, "lat": 11.2, "country": "Colombia"},
        "barranquilla": {"name": "Barranquilla", "lon": -74.8, "lat": 11.0, "country": "Colombia"},
        "puerto_cabello": {"name": "Puerto Cabello", "lon": -68.0, "lat": 10.5, "country": "Venezuela"},
        "maracaibo": {"name": "Maracaibo", "lon": -71.6, "lat": 10.7, "country": "Venezuela"},
        "la_guaira": {"name": "La Guaira", "lon": -66.9, "lat": 10.6, "country": "Venezuela"},
        # Major river-accessible ports (connected to sea via rivers)
        "toronto": {"name": "Toronto", "lon": -79.4, "lat": 43.7, "country": "Canada"},
        "quebec_city": {"name": "Quebec City", "lon": -71.2, "lat": 46.8, "country": "Canada"},
        "detroit": {"name": "Detroit", "lon": -83.0, "lat": 42.3, "country": "USA"},
        "cleveland": {"name": "Cleveland", "lon": -81.7, "lat": 41.5, "country": "USA"},
        "buffalo": {"name": "Buffalo", "lon": -78.9, "lat": 42.9, "country": "USA"},
        "milwaukee": {"name": "Milwaukee", "lon": -87.9, "lat": 43.0, "country": "USA"},
        "chicago": {"name": "Chicago", "lon": -87.6, "lat": 41.9, "country": "USA"},
        "duluth": {"name": "Duluth", "lon": -92.1, "lat": 46.8, "country": "USA"},
        "baton_rouge": {"name": "Baton Rouge", "lon": -91.2, "lat": 30.4, "country": "USA"},
        "memphis": {"name": "Memphis", "lon": -90.0, "lat": 35.1, "country": "USA"},
        "st_louis": {"name": "St. Louis", "lon": -90.2, "lat": 38.6, "country": "USA"},
        "pittsburgh": {"name": "Pittsburgh", "lon": -80.0, "lat": 40.4, "country": "USA"},
        "cincinnati": {"name": "Cincinnati", "lon": -84.5, "lat": 39.1, "country": "USA"},
        "louisville": {"name": "Louisville", "lon": -85.8, "lat": 38.3, "country": "USA"},
        "huntington": {"name": "Huntington", "lon": -82.4, "lat": 38.4, "country": "USA"},
        "evansville": {"name": "Evansville", "lon": -87.6, "lat": 37.9, "country": "USA"},
        "paducah": {"name": "Paducah", "lon": -88.6, "lat": 37.1, "country": "USA"},
        "cairo": {"name": "Cairo", "lon": -89.2, "lat": 37.0, "country": "USA"},
        "minneapolis": {"name": "Minneapolis", "lon": -93.3, "lat": 44.9, "country": "USA"},
        "st_paul": {"name": "St. Paul", "lon": -93.1, "lat": 44.9, "country": "USA"},
        "davenport": {"name": "Davenport", "lon": -90.6, "lat": 41.5, "country": "USA"},
        "dubuque": {"name": "Dubuque", "lon": -90.7, "lat": 42.5, "country": "USA"},
        "prairie_du_chien": {"name": "Prairie du Chien", "lon": -91.1, "lat": 43.1, "country": "USA"},
        "la_crosse": {"name": "La Crosse", "lon": -91.2, "lat": 43.8, "country": "USA"},
        "winona": {"name": "Winona", "lon": -91.6, "lat": 44.0, "country": "USA"},
        "clinton": {"name": "Clinton", "lon": -90.2, "lat": 41.8, "country": "USA"},
        "muscatine": {"name": "Muscatine", "lon": -91.0, "lat": 41.4, "country": "USA"},
        "keokuk": {"name": "Keokuk", "lon": -91.4, "lat": 40.4, "country": "USA"},
        "hannibal": {"name": "Hannibal", "lon": -91.4, "lat": 39.7, "country": "USA"},
        "natchez": {"name": "Natchez", "lon": -91.4, "lat": 31.6, "country": "USA"},
        "vicksburg": {"name": "Vicksburg", "lon": -90.9, "lat": 32.4, "country": "USA"},
        "greenville": {"name": "Greenville", "lon": -91.1, "lat": 33.4, "country": "USA"},
        "helena": {"name": "Helena", "lon": -90.6, "lat": 34.5, "country": "USA"},
        "cape_girardeau": {"name": "Cape Girardeau", "lon": -89.5, "lat": 37.3, "country": "USA"},
        "quincy": {"name": "Quincy", "lon": -91.4, "lat": 39.9, "country": "USA"},
        "burlington": {"name": "Burlington", "lon": -91.1, "lat": 40.8, "country": "USA"},
        "fort_madison": {"name": "Fort Madison", "lon": -91.3, "lat": 40.6, "country": "USA"},
        "rock_island": {"name": "Rock Island", "lon": -90.6, "lat": 41.5, "country": "USA"},
        "moline": {"name": "Moline", "lon": -90.5, "lat": 41.5, "country": "USA"},
        # Major European river ports
        "bremen": {"name": "Bremen", "lon": 8.8, "lat": 53.1, "country": "Germany"},
        "cologne": {"name": "Cologne", "lon": 6.9, "lat": 50.9, "country": "Germany"},
        "dusseldorf": {"name": "Dusseldorf", "lon": 6.8, "lat": 51.2, "country": "Germany"},
        "duisburg": {"name": "Duisburg", "lon": 6.8, "lat": 51.4, "country": "Germany"},
        "mainz": {"name": "Mainz", "lon": 8.3, "lat": 50.0, "country": "Germany"},
        "mannheim": {"name": "Mannheim", "lon": 8.5, "lat": 49.5, "country": "Germany"},
        "ludwigshafen": {"name": "Ludwigshafen", "lon": 8.4, "lat": 49.5, "country": "Germany"},
        "frankfurt": {"name": "Frankfurt", "lon": 8.7, "lat": 50.1, "country": "Germany"},
        "karlsruhe": {"name": "Karlsruhe", "lon": 8.4, "lat": 49.0, "country": "Germany"},
        "strasbourg": {"name": "Strasbourg", "lon": 7.7, "lat": 48.6, "country": "France"},
        "basel": {"name": "Basel", "lon": 7.6, "lat": 47.6, "country": "Switzerland"},
        "mulhouse": {"name": "Mulhouse", "lon": 7.3, "lat": 47.7, "country": "France"},
        "amsterdam": {"name": "Amsterdam", "lon": 4.9, "lat": 52.4, "country": "Netherlands"},
        "utrecht": {"name": "Utrecht", "lon": 5.1, "lat": 52.1, "country": "Netherlands"},
        "arnhem": {"name": "Arnhem", "lon": 5.9, "lat": 52.0, "country": "Netherlands"},
        "nijmegen": {"name": "Nijmegen", "lon": 5.9, "lat": 51.8, "country": "Netherlands"},
        "emmerich": {"name": "Emmerich", "lon": 6.2, "lat": 51.8, "country": "Germany"},
        "wesel": {"name": "Wesel", "lon": 6.6, "lat": 51.7, "country": "Germany"},
        "rees": {"name": "Rees", "lon": 6.4, "lat": 51.8, "country": "Germany"},
        "xanten": {"name": "Xanten", "lon": 6.5, "lat": 51.7, "country": "Germany"},
        "kleve": {"name": "Kleve", "lon": 6.1, "lat": 51.8, "country": "Germany"},
        "liege": {"name": "Liege", "lon": 5.6, "lat": 50.6, "country": "Belgium"},
        "maastricht": {"name": "Maastricht", "lon": 5.7, "lat": 50.8, "country": "Netherlands"},
        "rouen": {"name": "Rouen", "lon": 1.1, "lat": 49.4, "country": "France"},
        "paris": {"name": "Paris", "lon": 2.3, "lat": 48.9, "country": "France"},
        "brussels": {"name": "Brussels", "lon": 4.4, "lat": 50.8, "country": "Belgium"},
        "ghent": {"name": "Ghent", "lon": 3.7, "lat": 51.1, "country": "Belgium"},
        "bruges": {"name": "Bruges", "lon": 3.2, "lat": 51.2, "country": "Belgium"},
        "ostend": {"name": "Ostend", "lon": 2.9, "lat": 51.2, "country": "Belgium"},
        "zeebrugge": {"name": "Zeebrugge", "lon": 3.2, "lat": 51.3, "country": "Belgium"},
        "terneuzen": {"name": "Terneuzen", "lon": 3.8, "lat": 51.3, "country": "Netherlands"},
        "vlissingen": {"name": "Vlissingen", "lon": 3.6, "lat": 51.4, "country": "Netherlands"},
        # Major Asian river ports
        "nanjing": {"name": "Nanjing", "lon": 118.8, "lat": 32.1, "country": "China"},
        "wuhan": {"name": "Wuhan", "lon": 114.3, "lat": 30.6, "country": "China"},
        "chongqing": {"name": "Chongqing", "lon": 106.5, "lat": 29.6, "country": "China"},
        "yichang": {"name": "Yichang", "lon": 111.3, "lat": 30.7, "country": "China"},
        "jiujiang": {"name": "Jiujiang", "lon": 115.9, "lat": 29.7, "country": "China"},
        "anqing": {"name": "Anqing", "lon": 117.0, "lat": 30.5, "country": "China"},
        "wuhu": {"name": "Wuhu", "lon": 118.4, "lat": 31.3, "country": "China"},
        "maanshan": {"name": "Maanshan", "lon": 118.5, "lat": 31.7, "country": "China"},
        "tongling": {"name": "Tongling", "lon": 117.8, "lat": 30.9, "country": "China"},
        "chizhou": {"name": "Chizhou", "lon": 117.5, "lat": 30.7, "country": "China"},
        "huangshi": {"name": "Huangshi", "lon": 115.0, "lat": 30.2, "country": "China"},
        "ezhou": {"name": "Ezhou", "lon": 114.9, "lat": 30.4, "country": "China"},
        "huanggang": {"name": "Huanggang", "lon": 114.9, "lat": 30.4, "country": "China"},
        "jingzhou": {"name": "Jingzhou", "lon": 112.2, "lat": 30.4, "country": "China"},
        "yueyang": {"name": "Yueyang", "lon": 113.1, "lat": 29.4, "country": "China"},
        "changsha": {"name": "Changsha", "lon": 112.9, "lat": 28.2, "country": "China"},
        # Major South American river ports
        "manaus": {"name": "Manaus", "lon": -60.0, "lat": -3.1, "country": "Brazil"},
        "santarem": {"name": "Santarem", "lon": -54.7, "lat": -2.4, "country": "Brazil"},
        "belem": {"name": "Belem", "lon": -48.5, "lat": -1.5, "country": "Brazil"},
        "macapa": {"name": "Macapa", "lon": -51.1, "lat": 0.0, "country": "Brazil"},
        "porto_velho": {"name": "Porto Velho", "lon": -63.9, "lat": -8.8, "country": "Brazil"},
        "iquitos": {"name": "Iquitos", "lon": -73.2, "lat": -3.7, "country": "Peru"},
        "leticia": {"name": "Leticia", "lon": -69.9, "lat": -4.2, "country": "Colombia"},
        "tabatinga": {"name": "Tabatinga", "lon": -69.9, "lat": -4.3, "country": "Brazil"},
        "tefe": {"name": "Tefe", "lon": -64.7, "lat": -3.4, "country": "Brazil"},
        "coari": {"name": "Coari", "lon": -63.1, "lat": -4.1, "country": "Brazil"},
        "itacoatiara": {"name": "Itacoatiara", "lon": -58.4, "lat": -3.1, "country": "Brazil"},
        "parintins": {"name": "Parintins", "lon": -56.7, "lat": -2.6, "country": "Brazil"},
        "obidos": {"name": "Obidos", "lon": -55.5, "lat": -1.9, "country": "Brazil"},
        "almeirim": {"name": "Almeirim", "lon": -52.6, "lat": -1.5, "country": "Brazil"},
        "monte_alegre": {"name": "Monte Alegre", "lon": -54.1, "lat": -2.0, "country": "Brazil"},
        "prainha": {"name": "Prainha", "lon": -53.5, "lat": -1.8, "country": "Brazil"},
        "gurupa": {"name": "Gurupa", "lon": -51.6, "lat": -1.4, "country": "Brazil"},
        "breves": {"name": "Breves", "lon": -50.5, "lat": -1.7, "country": "Brazil"},
        "abaetetuba": {"name": "Abaetetuba", "lon": -48.9, "lat": -1.7, "country": "Brazil"},
        "barcarena": {"name": "Barcarena", "lon": -48.6, "lat": -1.6, "country": "Brazil"},
        "tucurui": {"name": "Tucurui", "lon": -49.7, "lat": -3.8, "country": "Brazil"},
        "altamira": {"name": "Altamira", "lon": -52.2, "lat": -3.2, "country": "Brazil"},
        "itaituba": {"name": "Itaituba", "lon": -56.0, "lat": -4.3, "country": "Brazil"},
        # African river ports
        "aswan": {"name": "Aswan", "lon": 32.9, "lat": 24.1, "country": "Egypt"},
        "luxor": {"name": "Luxor", "lon": 32.6, "lat": 25.7, "country": "Egypt"},
        "cairo_port": {"name": "Cairo Port", "lon": 31.2, "lat": 30.1, "country": "Egypt"},
        "khartoum": {"name": "Khartoum", "lon": 32.5, "lat": 15.5, "country": "Sudan"},
        "juba": {"name": "Juba", "lon": 31.6, "lat": 4.9, "country": "South Sudan"},
        "malakal": {"name": "Malakal", "lon": 31.7, "lat": 9.5, "country": "South Sudan"},
        "renk": {"name": "Renk", "lon": 32.8, "lat": 11.8, "country": "South Sudan"},
        "kodok": {"name": "Kodok", "lon": 32.1, "lat": 9.9, "country": "South Sudan"},
        "bor": {"name": "Bor", "lon": 31.6, "lat": 6.2, "country": "South Sudan"},
        "mongalla": {"name": "Mongalla", "lon": 31.8, "lat": 5.2, "country": "South Sudan"},
        "kisangani": {"name": "Kisangani", "lon": 25.2, "lat": 0.5, "country": "Democratic Republic of Congo"},
        "kinshasa": {"name": "Kinshasa", "lon": 15.3, "lat": -4.3, "country": "Democratic Republic of Congo"},
        "brazzaville": {"name": "Brazzaville", "lon": 15.3, "lat": -4.3, "country": "Republic of Congo"},
        "bangui": {"name": "Bangui", "lon": 18.6, "lat": 4.4, "country": "Central African Republic"},
        "bamako": {"name": "Bamako", "lon": -8.0, "lat": 12.6, "country": "Mali"},
        "gao": {"name": "Gao", "lon": -0.0, "lat": 16.3, "country": "Mali"},
        "timbuktu": {"name": "Timbuktu", "lon": -3.0, "lat": 16.8, "country": "Mali"},
        "mopti": {"name": "Mopti", "lon": -4.2, "lat": 14.5, "country": "Mali"},
        "segou": {"name": "Segou", "lon": -6.3, "lat": 13.4, "country": "Mali"},
        "kayes": {"name": "Kayes", "lon": -11.4, "lat": 14.4, "country": "Mali"},
        "niamey": {"name": "Niamey", "lon": 2.1, "lat": 13.5, "country": "Niger"},
        "tillaberi": {"name": "Tillaberi", "lon": 1.5, "lat": 14.2, "country": "Niger"},
        "ayorou": {"name": "Ayorou", "lon": 0.9, "lat": 14.7, "country": "Niger"},
        "ansongo": {"name": "Ansongo", "lon": 0.5, "lat": 15.7, "country": "Mali"},
        "dire": {"name": "Dire", "lon": -3.4, "lat": 16.3, "country": "Mali"},
        "tonka": {"name": "Tonka", "lon": -3.1, "lat": 16.1, "country": "Mali"},
        "goundam": {"name": "Goundam", "lon": -3.7, "lat": 16.4, "country": "Mali"},
        "rharous": {"name": "Rharous", "lon": -2.0, "lat": 16.9, "country": "Mali"},
        "bourem": {"name": "Bourem", "lon": -0.4, "lat": 16.9, "country": "Mali"},
        "ansongo": {"name": "Ansongo", "lon": 0.5, "lat": 15.7, "country": "Mali"},
        # Russian river ports
        "moscow": {"name": "Moscow", "lon": 37.6, "lat": 55.8, "country": "Russia"},
        "nizhny_novgorod": {"name": "Nizhny Novgorod", "lon": 44.0, "lat": 56.3, "country": "Russia"},
        "kazan": {"name": "Kazan", "lon": 49.1, "lat": 55.8, "country": "Russia"},
        "samara": {"name": "Samara", "lon": 50.1, "lat": 53.2, "country": "Russia"},
        "saratov": {"name": "Saratov", "lon": 46.0, "lat": 51.5, "country": "Russia"},
        "volgograd": {"name": "Volgograd", "lon": 44.5, "lat": 48.7, "country": "Russia"},
        "astrakhan": {"name": "Astrakhan", "lon": 48.0, "lat": 46.3, "country": "Russia"},
        "ulyanovsk": {"name": "Ulyanovsk", "lon": 48.4, "lat": 54.3, "country": "Russia"},
        "cheboksary": {"name": "Cheboksary", "lon": 47.2, "lat": 56.1, "country": "Russia"},
        "yaroslavl": {"name": "Yaroslavl", "lon": 39.9, "lat": 57.6, "country": "Russia"},
        "kostroma": {"name": "Kostroma", "lon": 40.9, "lat": 57.8, "country": "Russia"},
        "tver": {"name": "Tver", "lon": 35.9, "lat": 56.9, "country": "Russia"},
        "ryazan": {"name": "Ryazan", "lon": 39.7, "lat": 54.6, "country": "Russia"},
        "rostov_on_don": {"name": "Rostov-on-Don", "lon": 39.7, "lat": 47.2, "country": "Russia"},
        "krasnoyarsk": {"name": "Krasnoyarsk", "lon": 92.9, "lat": 56.0, "country": "Russia"},
        "irkutsk": {"name": "Irkutsk", "lon": 104.3, "lat": 52.3, "country": "Russia"},
        "khabarovsk": {"name": "Khabarovsk", "lon": 135.1, "lat": 48.5, "country": "Russia"},
        "komsomolsk_on_amur": {"name": "Komsomolsk-on-Amur", "lon": 137.0, "lat": 50.6, "country": "Russia"},
        "blagoveshchensk": {"name": "Blagoveshchensk", "lon": 127.5, "lat": 50.3, "country": "Russia"},
        "nikolayevsk_on_amur": {"name": "Nikolayevsk-on-Amur", "lon": 140.7, "lat": 53.1, "country": "Russia"},
        # Indian subcontinent river ports
        "kolkata": {"name": "Kolkata", "lon": 88.4, "lat": 22.6, "country": "India"},
        "haldia": {"name": "Haldia", "lon": 88.1, "lat": 22.1, "country": "India"},
        "karimganj": {"name": "Karimganj", "lon": 92.4, "lat": 24.9, "country": "India"},
        "pandu": {"name": "Pandu", "lon": 91.7, "lat": 26.1, "country": "India"},
        "dhubri": {"name": "Dhubri", "lon": 89.9, "lat": 26.0, "country": "India"},
        "jogighopa": {"name": "Jogighopa", "lon": 90.6, "lat": 26.4, "country": "India"},
        "guwahati": {"name": "Guwahati", "lon": 91.7, "lat": 26.1, "country": "India"},
        "silghat": {"name": "Silghat", "lon": 92.9, "lat": 26.8, "country": "India"},
        "neamatighat": {"name": "Neamatighat", "lon": 94.2, "lat": 27.2, "country": "India"},
        "dibrugarh": {"name": "Dibrugarh", "lon": 95.0, "lat": 27.5, "country": "India"},
        "sadiya": {"name": "Sadiya", "lon": 95.7, "lat": 27.8, "country": "India"},
        "varanasi": {"name": "Varanasi", "lon": 83.0, "lat": 25.3, "country": "India"},
        "allahabad": {"name": "Allahabad", "lon": 81.8, "lat": 25.4, "country": "India"},
        "patna": {"name": "Patna", "lon": 85.1, "lat": 25.6, "country": "India"},
        "bhagalpur": {"name": "Bhagalpur", "lon": 87.0, "lat": 25.2, "country": "India"},
        "farakka": {"name": "Farakka", "lon": 87.9, "lat": 24.8, "country": "India"},
        "sahibganj": {"name": "Sahibganj", "lon": 87.6, "lat": 25.2, "country": "India"},
        "rajmahal": {"name": "Rajmahal", "lon": 87.8, "lat": 25.0, "country": "India"},
        "sultanganj": {"name": "Sultanganj", "lon": 86.7, "lat": 25.2, "country": "India"},
        "munger": {"name": "Munger", "lon": 86.5, "lat": 25.4, "country": "India"},
        "buxar": {"name": "Buxar", "lon": 83.9, "lat": 25.6, "country": "India"},
        "ghazipur": {"name": "Ghazipur", "lon": 83.6, "lat": 25.6, "country": "India"},
        "mirzapur": {"name": "Mirzapur", "lon": 82.6, "lat": 25.1, "country": "India"},
        "chunar": {"name": "Chunar", "lon": 82.9, "lat": 25.1, "country": "India"},
        
        # Additional European ports - Mediterranean
        "malaga": {"name": "Málaga", "lon": -4.4, "lat": 36.7, "country": "Spain"},
        "cadiz": {"name": "Cádiz", "lon": -6.3, "lat": 36.5, "country": "Spain"},
        "seville": {"name": "Seville", "lon": -6.0, "lat": 37.4, "country": "Spain"},
        "huelva": {"name": "Huelva", "lon": -6.9, "lat": 37.3, "country": "Spain"},
        "algeciras": {"name": "Algeciras", "lon": -5.5, "lat": 36.1, "country": "Spain"},
        "tarragona": {"name": "Tarragona", "lon": 1.2, "lat": 41.1, "country": "Spain"},
        "castellon": {"name": "Castellón", "lon": 0.0, "lat": 39.9, "country": "Spain"},
        "alicante": {"name": "Alicante", "lon": -0.5, "lat": 38.3, "country": "Spain"},
        "cartagena_spain": {"name": "Cartagena", "lon": -1.0, "lat": 37.6, "country": "Spain"},
        "almeria": {"name": "Almería", "lon": -2.5, "lat": 36.8, "country": "Spain"},
        "motril": {"name": "Motril", "lon": -3.5, "lat": 36.7, "country": "Spain"},
        "gibraltar": {"name": "Gibraltar", "lon": -5.4, "lat": 36.1, "country": "Gibraltar"},
        "ceuta": {"name": "Ceuta", "lon": -5.3, "lat": 35.9, "country": "Spain"},
        "melilla": {"name": "Melilla", "lon": -2.9, "lat": 35.3, "country": "Spain"},
        
        # Additional Italian ports
        "la_spezia": {"name": "La Spezia", "lon": 9.8, "lat": 44.1, "country": "Italy"},
        "livorno": {"name": "Livorno", "lon": 10.3, "lat": 43.5, "country": "Italy"},
        "civitavecchia": {"name": "Civitavecchia", "lon": 11.8, "lat": 42.1, "country": "Italy"},
        "salerno": {"name": "Salerno", "lon": 14.8, "lat": 40.7, "country": "Italy"},
        "brindisi": {"name": "Brindisi", "lon": 17.9, "lat": 40.6, "country": "Italy"},
        "bari": {"name": "Bari", "lon": 16.9, "lat": 41.1, "country": "Italy"},
        "ancona": {"name": "Ancona", "lon": 13.5, "lat": 43.6, "country": "Italy"},
        "ravenna": {"name": "Ravenna", "lon": 12.2, "lat": 44.4, "country": "Italy"},
        "trieste": {"name": "Trieste", "lon": 13.8, "lat": 45.6, "country": "Italy"},
        "catania": {"name": "Catania", "lon": 15.1, "lat": 37.5, "country": "Italy"},
        "messina": {"name": "Messina", "lon": 15.6, "lat": 38.2, "country": "Italy"},
        "reggio_calabria": {"name": "Reggio Calabria", "lon": 15.6, "lat": 38.1, "country": "Italy"},
        "cagliari": {"name": "Cagliari", "lon": 9.1, "lat": 39.2, "country": "Italy"},
        "olbia": {"name": "Olbia", "lon": 9.5, "lat": 40.9, "country": "Italy"},
        "porto_torres": {"name": "Porto Torres", "lon": 8.4, "lat": 40.8, "country": "Italy"},
        
        # Additional French ports
        "nice": {"name": "Nice", "lon": 7.3, "lat": 43.7, "country": "France"},
        "cannes": {"name": "Cannes", "lon": 7.0, "lat": 43.6, "country": "France"},
        "toulon": {"name": "Toulon", "lon": 5.9, "lat": 43.1, "country": "France"},
        "sete": {"name": "Sète", "lon": 3.7, "lat": 43.4, "country": "France"},
        "montpellier": {"name": "Montpellier", "lon": 3.9, "lat": 43.6, "country": "France"},
        "nantes": {"name": "Nantes", "lon": -1.6, "lat": 47.2, "country": "France"},
        "la_rochelle": {"name": "La Rochelle", "lon": -1.2, "lat": 46.2, "country": "France"},
        "bordeaux": {"name": "Bordeaux", "lon": -0.6, "lat": 44.8, "country": "France"},
        "bayonne": {"name": "Bayonne", "lon": -1.5, "lat": 43.5, "country": "France"},
        "brest": {"name": "Brest", "lon": -4.5, "lat": 48.4, "country": "France"},
        "saint_nazaire": {"name": "Saint-Nazaire", "lon": -2.2, "lat": 47.3, "country": "France"},
        "lorient": {"name": "Lorient", "lon": -3.4, "lat": 47.7, "country": "France"},
        "cherbourg": {"name": "Cherbourg", "lon": -1.6, "lat": 49.6, "country": "France"},
        "calais": {"name": "Calais", "lon": 1.9, "lat": 50.9, "country": "France"},
        "dunkirk": {"name": "Dunkirk", "lon": 2.4, "lat": 51.0, "country": "France"},
        "dieppe": {"name": "Dieppe", "lon": 1.1, "lat": 49.9, "country": "France"},
        
        # Additional Northern European ports
        "stavanger": {"name": "Stavanger", "lon": 5.7, "lat": 58.9, "country": "Norway"},
        "bergen": {"name": "Bergen", "lon": 5.3, "lat": 60.4, "country": "Norway"},
        "trondheim": {"name": "Trondheim", "lon": 10.4, "lat": 63.4, "country": "Norway"},
        "tromso": {"name": "Tromsø", "lon": 18.9, "lat": 69.6, "country": "Norway"},
        "hammerfest": {"name": "Hammerfest", "lon": 23.7, "lat": 70.7, "country": "Norway"},
        "kirkenes": {"name": "Kirkenes", "lon": 30.0, "lat": 69.7, "country": "Norway"},
        "alesund": {"name": "Ålesund", "lon": 6.2, "lat": 62.5, "country": "Norway"},
        "kristiansand": {"name": "Kristiansand", "lon": 8.0, "lat": 58.1, "country": "Norway"},
        "larvik": {"name": "Larvik", "lon": 10.0, "lat": 59.1, "country": "Norway"},
        "moss": {"name": "Moss", "lon": 10.7, "lat": 59.4, "country": "Norway"},
        "fredrikstad": {"name": "Fredrikstad", "lon": 10.9, "lat": 59.2, "country": "Norway"},
        "halden": {"name": "Halden", "lon": 11.4, "lat": 59.1, "country": "Norway"},
        "drammen": {"name": "Drammen", "lon": 10.2, "lat": 59.7, "country": "Norway"},
        "tonsberg": {"name": "Tønsberg", "lon": 10.4, "lat": 59.3, "country": "Norway"},
        "sandefjord": {"name": "Sandefjord", "lon": 10.2, "lat": 59.1, "country": "Norway"},
        "porsgrunn": {"name": "Porsgrunn", "lon": 9.7, "lat": 59.1, "country": "Norway"},
        "skien": {"name": "Skien", "lon": 9.6, "lat": 59.2, "country": "Norway"},
        "arendal": {"name": "Arendal", "lon": 8.8, "lat": 58.5, "country": "Norway"},
        "grimstad": {"name": "Grimstad", "lon": 8.6, "lat": 58.3, "country": "Norway"},
        "flekkefjord": {"name": "Flekkefjord", "lon": 6.7, "lat": 58.3, "country": "Norway"},
        "egersund": {"name": "Egersund", "lon": 6.0, "lat": 58.4, "country": "Norway"},
        "haugesund": {"name": "Haugesund", "lon": 5.3, "lat": 59.4, "country": "Norway"},
        
        # Additional Swedish ports
        "gothenburg": {"name": "Gothenburg", "lon": 11.9, "lat": 57.7, "country": "Sweden"},
        "malmo": {"name": "Malmö", "lon": 13.0, "lat": 55.6, "country": "Sweden"},
        "helsingborg": {"name": "Helsingborg", "lon": 12.7, "lat": 56.0, "country": "Sweden"},
        "karlshamn": {"name": "Karlshamn", "lon": 14.9, "lat": 56.2, "country": "Sweden"},
        "karlskrona": {"name": "Karlskrona", "lon": 15.6, "lat": 56.2, "country": "Sweden"},
        "kalmar": {"name": "Kalmar", "lon": 16.4, "lat": 56.7, "country": "Sweden"},
        "visby": {"name": "Visby", "lon": 18.3, "lat": 57.6, "country": "Sweden"},
        "norrkoping": {"name": "Norrköping", "lon": 16.2, "lat": 58.6, "country": "Sweden"},
        "sodertalje": {"name": "Södertälje", "lon": 17.6, "lat": 59.2, "country": "Sweden"},
        "vasteras": {"name": "Västerås", "lon": 16.5, "lat": 59.6, "country": "Sweden"},
        "gavle": {"name": "Gävle", "lon": 17.1, "lat": 60.7, "country": "Sweden"},
        "sundsvall": {"name": "Sundsvall", "lon": 17.3, "lat": 62.4, "country": "Sweden"},
        "harnosand": {"name": "Härnösand", "lon": 17.9, "lat": 62.6, "country": "Sweden"},
        "ornskoldsvik": {"name": "Örnsköldsvik", "lon": 18.7, "lat": 63.3, "country": "Sweden"},
        "umea": {"name": "Umeå", "lon": 20.3, "lat": 63.8, "country": "Sweden"},
        "skelleftea": {"name": "Skellefteå", "lon": 21.0, "lat": 64.8, "country": "Sweden"},
        "pitea": {"name": "Piteå", "lon": 21.5, "lat": 65.3, "country": "Sweden"},
        "lulea": {"name": "Luleå", "lon": 22.1, "lat": 65.6, "country": "Sweden"},
        "haparanda": {"name": "Haparanda", "lon": 24.1, "lat": 65.8, "country": "Sweden"},
        
        # Additional Finnish ports
        "turku": {"name": "Turku", "lon": 22.3, "lat": 60.4, "country": "Finland"},
        "tampere": {"name": "Tampere", "lon": 23.8, "lat": 61.5, "country": "Finland"},
        "pori": {"name": "Pori", "lon": 21.8, "lat": 61.5, "country": "Finland"},
        "rauma": {"name": "Rauma", "lon": 21.5, "lat": 61.1, "country": "Finland"},
        "naantali": {"name": "Naantali", "lon": 22.0, "lat": 60.5, "country": "Finland"},
        "hanko": {"name": "Hanko", "lon": 22.9, "lat": 59.8, "country": "Finland"},
        "kotka": {"name": "Kotka", "lon": 26.9, "lat": 60.5, "country": "Finland"},
        "hamina": {"name": "Hamina", "lon": 27.2, "lat": 60.6, "country": "Finland"},
        "loviisa": {"name": "Loviisa", "lon": 26.2, "lat": 60.5, "country": "Finland"},
        "porvoo": {"name": "Porvoo", "lon": 25.7, "lat": 60.4, "country": "Finland"},
        "vaasa": {"name": "Vaasa", "lon": 21.6, "lat": 63.1, "country": "Finland"},
        "kokkola": {"name": "Kokkola", "lon": 23.1, "lat": 63.8, "country": "Finland"},
        "oulu": {"name": "Oulu", "lon": 25.5, "lat": 65.0, "country": "Finland"},
        "kemi": {"name": "Kemi", "lon": 24.6, "lat": 65.7, "country": "Finland"},
        "tornio": {"name": "Tornio", "lon": 24.1, "lat": 65.8, "country": "Finland"},
        
        # Additional Danish ports
        "aarhus": {"name": "Aarhus", "lon": 10.2, "lat": 56.2, "country": "Denmark"},
        "aalborg": {"name": "Aalborg", "lon": 9.9, "lat": 57.0, "country": "Denmark"},
        "esbjerg": {"name": "Esbjerg", "lon": 8.5, "lat": 55.5, "country": "Denmark"},
        "fredericia": {"name": "Fredericia", "lon": 9.8, "lat": 55.6, "country": "Denmark"},
        "odense": {"name": "Odense", "lon": 10.4, "lat": 55.4, "country": "Denmark"},
        "kolding": {"name": "Kolding", "lon": 9.5, "lat": 55.5, "country": "Denmark"},
        "vejle": {"name": "Vejle", "lon": 9.5, "lat": 55.7, "country": "Denmark"},
        "horsens": {"name": "Horsens", "lon": 9.9, "lat": 55.9, "country": "Denmark"},
        "randers": {"name": "Randers", "lon": 10.0, "lat": 56.5, "country": "Denmark"},
        "viborg": {"name": "Viborg", "lon": 9.4, "lat": 56.5, "country": "Denmark"},
        "thisted": {"name": "Thisted", "lon": 8.7, "lat": 56.9, "country": "Denmark"},
        "skagen": {"name": "Skagen", "lon": 10.6, "lat": 57.7, "country": "Denmark"},
        "frederikshavn": {"name": "Frederikshavn", "lon": 10.5, "lat": 57.4, "country": "Denmark"},
        "hirtshals": {"name": "Hirtshals", "lon": 9.9, "lat": 57.6, "country": "Denmark"},
        "hanstholm": {"name": "Hanstholm", "lon": 8.6, "lat": 57.1, "country": "Denmark"},
        
        # Additional UK and Irish ports
        "liverpool": {"name": "Liverpool", "lon": -2.9, "lat": 53.4, "country": "UK"},
        "manchester": {"name": "Manchester", "lon": -2.2, "lat": 53.5, "country": "UK"},
        "hull": {"name": "Hull", "lon": -0.3, "lat": 53.7, "country": "UK"},
        "grimsby": {"name": "Grimsby", "lon": -0.1, "lat": 53.6, "country": "UK"},
        "immingham": {"name": "Immingham", "lon": -0.2, "lat": 53.6, "country": "UK"},
        "southampton": {"name": "Southampton", "lon": -1.4, "lat": 50.9, "country": "UK"},
        "portsmouth": {"name": "Portsmouth", "lon": -1.1, "lat": 50.8, "country": "UK"},
        "dover": {"name": "Dover", "lon": 1.3, "lat": 51.1, "country": "UK"},
        "ramsgate": {"name": "Ramsgate", "lon": 1.4, "lat": 51.3, "country": "UK"},
        "sheerness": {"name": "Sheerness", "lon": 0.8, "lat": 51.4, "country": "UK"},
        "tilbury": {"name": "Tilbury", "lon": 0.4, "lat": 51.5, "country": "UK"},
        "harwich": {"name": "Harwich", "lon": 1.3, "lat": 51.9, "country": "UK"},
        "great_yarmouth": {"name": "Great Yarmouth", "lon": 1.7, "lat": 52.6, "country": "UK"},
        "king_s_lynn": {"name": "King's Lynn", "lon": 0.4, "lat": 52.8, "country": "UK"},
        "boston": {"name": "Boston", "lon": -0.0, "lat": 52.9, "country": "UK"},
        "goole": {"name": "Goole", "lon": -0.9, "lat": 53.7, "country": "UK"},
        "preston": {"name": "Preston", "lon": -2.7, "lat": 53.8, "country": "UK"},
        "fleetwood": {"name": "Fleetwood", "lon": -3.0, "lat": 53.9, "country": "UK"},
        "heysham": {"name": "Heysham", "lon": -2.9, "lat": 54.0, "country": "UK"},
        "barrow": {"name": "Barrow-in-Furness", "lon": -3.2, "lat": 54.1, "country": "UK"},
        "workington": {"name": "Workington", "lon": -3.5, "lat": 54.6, "country": "UK"},
        "whitehaven": {"name": "Whitehaven", "lon": -3.6, "lat": 54.5, "country": "UK"},
        "glasgow": {"name": "Glasgow", "lon": -4.3, "lat": 55.9, "country": "UK"},
        "greenock": {"name": "Greenock", "lon": -4.8, "lat": 55.9, "country": "UK"},
        "leith": {"name": "Leith", "lon": -3.2, "lat": 55.9, "country": "UK"},
        "edinburgh": {"name": "Edinburgh", "lon": -3.2, "lat": 55.9, "country": "UK"},
        "aberdeen": {"name": "Aberdeen", "lon": -2.1, "lat": 57.1, "country": "UK"},
        "peterhead": {"name": "Peterhead", "lon": -1.8, "lat": 57.5, "country": "UK"},
        "fraserburgh": {"name": "Fraserburgh", "lon": -2.0, "lat": 57.7, "country": "UK"},
        "inverness": {"name": "Inverness", "lon": -4.2, "lat": 57.5, "country": "UK"},
        "thurso": {"name": "Thurso", "lon": -3.5, "lat": 58.6, "country": "UK"},
        "kirkwall": {"name": "Kirkwall", "lon": -2.9, "lat": 59.0, "country": "UK"},
        "lerwick": {"name": "Lerwick", "lon": -1.1, "lat": 60.2, "country": "UK"},
        "stornoway": {"name": "Stornoway", "lon": -6.4, "lat": 58.2, "country": "UK"},
        "ullapool": {"name": "Ullapool", "lon": -5.2, "lat": 57.9, "country": "UK"},
        "mallaig": {"name": "Mallaig", "lon": -5.8, "lat": 57.0, "country": "UK"},
        "oban": {"name": "Oban", "lon": -5.5, "lat": 56.4, "country": "UK"},
        "campbeltown": {"name": "Campbeltown", "lon": -5.6, "lat": 55.4, "country": "UK"},
        "stranraer": {"name": "Stranraer", "lon": -5.0, "lat": 54.9, "country": "UK"},
        "belfast": {"name": "Belfast", "lon": -5.9, "lat": 54.6, "country": "UK"},
        "londonderry": {"name": "Londonderry", "lon": -7.3, "lat": 55.0, "country": "UK"},
        "coleraine": {"name": "Coleraine", "lon": -6.7, "lat": 55.1, "country": "UK"},
        "larne": {"name": "Larne", "lon": -5.8, "lat": 54.9, "country": "UK"},
        "bangor": {"name": "Bangor", "lon": -5.7, "lat": 54.7, "country": "UK"},
        "newry": {"name": "Newry", "lon": -6.3, "lat": 54.2, "country": "UK"},
        "warrenpoint": {"name": "Warrenpoint", "lon": -6.3, "lat": 54.1, "country": "UK"},
        "dublin": {"name": "Dublin", "lon": -6.2, "lat": 53.3, "country": "Ireland"},
        "cork": {"name": "Cork", "lon": -8.5, "lat": 51.9, "country": "Ireland"},
        "waterford": {"name": "Waterford", "lon": -7.1, "lat": 52.3, "country": "Ireland"},
        "limerick": {"name": "Limerick", "lon": -8.6, "lat": 52.7, "country": "Ireland"},
        "galway": {"name": "Galway", "lon": -9.0, "lat": 53.3, "country": "Ireland"},
        "sligo": {"name": "Sligo", "lon": -8.5, "lat": 54.3, "country": "Ireland"},
        "dundalk": {"name": "Dundalk", "lon": -6.4, "lat": 54.0, "country": "Ireland"},
        "drogheda": {"name": "Drogheda", "lon": -6.3, "lat": 53.7, "country": "Ireland"},
        "wexford": {"name": "Wexford", "lon": -6.5, "lat": 52.3, "country": "Ireland"},
        "new_ross": {"name": "New Ross", "lon": -6.9, "lat": 52.4, "country": "Ireland"},
        "foynes": {"name": "Foynes", "lon": -8.9, "lat": 52.6, "country": "Ireland"},
        "shannon": {"name": "Shannon", "lon": -8.9, "lat": 52.7, "country": "Ireland"},
        "westport": {"name": "Westport", "lon": -9.5, "lat": 53.8, "country": "Ireland"},
        "ballina": {"name": "Ballina", "lon": -9.2, "lat": 54.1, "country": "Ireland"},
        "killybegs": {"name": "Killybegs", "lon": -8.4, "lat": 54.6, "country": "Ireland"},
        "donegal": {"name": "Donegal", "lon": -8.1, "lat": 54.7, "country": "Ireland"},
        
        # Additional Caribbean ports
        "havana": {"name": "Havana", "lon": -82.4, "lat": 23.1, "country": "Cuba"},
        "santiago_de_cuba": {"name": "Santiago de Cuba", "lon": -75.8, "lat": 20.0, "country": "Cuba"},
        "cienfuegos": {"name": "Cienfuegos", "lon": -80.4, "lat": 22.1, "country": "Cuba"},
        "mariel": {"name": "Mariel", "lon": -82.8, "lat": 22.9, "country": "Cuba"},
        "nuevitas": {"name": "Nuevitas", "lon": -77.3, "lat": 21.5, "country": "Cuba"},
        "antilla": {"name": "Antilla", "lon": -75.8, "lat": 20.9, "country": "Cuba"},
        "santo_domingo": {"name": "Santo Domingo", "lon": -69.9, "lat": 18.5, "country": "Dominican Republic"},
        "puerto_plata": {"name": "Puerto Plata", "lon": -70.7, "lat": 19.8, "country": "Dominican Republic"},
        "la_romana": {"name": "La Romana", "lon": -68.9, "lat": 18.4, "country": "Dominican Republic"},
        "san_pedro_de_macoris": {"name": "San Pedro de Macorís", "lon": -69.3, "lat": 18.5, "country": "Dominican Republic"},
        "port_au_prince": {"name": "Port-au-Prince", "lon": -72.3, "lat": 18.5, "country": "Haiti"},
        "cap_haitien": {"name": "Cap-Haïtien", "lon": -72.2, "lat": 19.8, "country": "Haiti"},
        "gonaives": {"name": "Gonaïves", "lon": -72.7, "lat": 19.4, "country": "Haiti"},
        "nassau": {"name": "Nassau", "lon": -77.3, "lat": 25.1, "country": "Bahamas"},
        "freeport": {"name": "Freeport", "lon": -78.7, "lat": 26.5, "country": "Bahamas"},
        "belize_city": {"name": "Belize City", "lon": -88.2, "lat": 17.5, "country": "Belize"},
        "dangriga": {"name": "Dangriga", "lon": -88.2, "lat": 16.9, "country": "Belize"},
        "punta_gorda": {"name": "Punta Gorda", "lon": -88.8, "lat": 16.1, "country": "Belize"},
        "san_pedro": {"name": "San Pedro", "lon": -87.9, "lat": 17.9, "country": "Belize"},
        "caye_caulker": {"name": "Caye Caulker", "lon": -88.0, "lat": 17.7, "country": "Belize"},
        
        # Additional Pacific ports
        "vladivostok": {"name": "Vladivostok", "lon": 131.9, "lat": 43.1, "country": "Russia"},
        "petropavlovsk": {"name": "Petropavlovsk-Kamchatsky", "lon": 158.6, "lat": 53.0, "country": "Russia"},
        "magadan": {"name": "Magadan", "lon": 150.8, "lat": 59.6, "country": "Russia"},
        "anadyr": {"name": "Anadyr", "lon": 177.5, "lat": 64.7, "country": "Russia"},
        "provideniya": {"name": "Provideniya", "lon": -173.2, "lat": 64.4, "country": "Russia"},
        "nome": {"name": "Nome", "lon": -165.4, "lat": 64.5, "country": "USA"},
        "kotzebue": {"name": "Kotzebue", "lon": -162.6, "lat": 66.9, "country": "USA"},
        "barrow": {"name": "Utqiagvik (Barrow)", "lon": -156.8, "lat": 71.3, "country": "USA"},
        "prudhoe_bay": {"name": "Prudhoe Bay", "lon": -148.3, "lat": 70.3, "country": "USA"},
        "dutch_harbor": {"name": "Dutch Harbor", "lon": -166.5, "lat": 53.9, "country": "USA"},
        "kodiak": {"name": "Kodiak", "lon": -152.4, "lat": 57.8, "country": "USA"},
        "homer": {"name": "Homer", "lon": -151.5, "lat": 59.6, "country": "USA"},
        "valdez": {"name": "Valdez", "lon": -146.3, "lat": 61.1, "country": "USA"},
        "whittier": {"name": "Whittier", "lon": -148.7, "lat": 60.8, "country": "USA"},
        "seward": {"name": "Seward", "lon": -149.4, "lat": 60.1, "country": "USA"},
        "haines": {"name": "Haines", "lon": -135.4, "lat": 59.2, "country": "USA"},
        "skagway": {"name": "Skagway", "lon": -135.3, "lat": 59.5, "country": "USA"},
        "juneau": {"name": "Juneau", "lon": -134.4, "lat": 58.3, "country": "USA"},
        "sitka": {"name": "Sitka", "lon": -135.2, "lat": 57.1, "country": "USA"},
        "petersburg": {"name": "Petersburg", "lon": -133.0, "lat": 56.8, "country": "USA"},
        "wrangell": {"name": "Wrangell", "lon": -132.4, "lat": 56.5, "country": "USA"},
        "ketchikan": {"name": "Ketchikan", "lon": -131.6, "lat": 55.3, "country": "USA"},
        "prince_of_wales": {"name": "Prince of Wales", "lon": -133.0, "lat": 55.6, "country": "USA"},
        "metlakatla": {"name": "Metlakatla", "lon": -131.6, "lat": 55.1, "country": "USA"},
        "hydaburg": {"name": "Hydaburg", "lon": -132.8, "lat": 55.2, "country": "USA"},
        "craig": {"name": "Craig", "lon": -133.1, "lat": 55.5, "country": "USA"},
        "klawock": {"name": "Klawock", "lon": -133.1, "lat": 55.6, "country": "USA"},
        "thorne_bay": {"name": "Thorne Bay", "lon": -132.5, "lat": 55.7, "country": "USA"},
        "hollis": {"name": "Hollis", "lon": -132.6, "lat": 55.5, "country": "USA"},
        "kasaan": {"name": "Kasaan", "lon": -132.4, "lat": 55.5, "country": "USA"},
        "coffman_cove": {"name": "Coffman Cove", "lon": -132.8, "lat": 56.0, "country": "USA"},
        "naukati": {"name": "Naukati", "lon": -133.2, "lat": 55.9, "country": "USA"},
        "whale_pass": {"name": "Whale Pass", "lon": -133.1, "lat": 56.1, "country": "USA"},
        "point_baker": {"name": "Point Baker", "lon": -133.6, "lat": 56.4, "country": "USA"},
        "port_protection": {"name": "Port Protection", "lon": -133.6, "lat": 56.3, "country": "USA"},
        "elfin_cove": {"name": "Elfin Cove", "lon": -136.3, "lat": 58.2, "country": "USA"},
        "gustavus": {"name": "Gustavus", "lon": -135.7, "lat": 58.4, "country": "USA"},
        "pelican": {"name": "Pelican", "lon": -136.2, "lat": 57.9, "country": "USA"},
        "tenakee_springs": {"name": "Tenakee Springs", "lon": -135.2, "lat": 57.8, "country": "USA"},
        "angoon": {"name": "Angoon", "lon": -134.6, "lat": 57.5, "country": "USA"},
        "kake": {"name": "Kake", "lon": -133.9, "lat": 56.9, "country": "USA"},
        "kupreanof": {"name": "Kupreanof", "lon": -133.0, "lat": 56.8, "country": "USA"},
        "port_alexander": {"name": "Port Alexander", "lon": -134.6, "lat": 56.2, "country": "USA"},
        "meyers_chuck": {"name": "Meyers Chuck", "lon": -132.3, "lat": 56.1, "country": "USA"},
        "ketchikan_gateway": {"name": "Ketchikan Gateway", "lon": -131.6, "lat": 55.4, "country": "USA"},
        "saxman": {"name": "Saxman", "lon": -131.6, "lat": 55.3, "country": "USA"},
        "mountain_point": {"name": "Mountain Point", "lon": -131.6, "lat": 55.1, "country": "USA"},
        "mud_bay": {"name": "Mud Bay", "lon": -131.4, "lat": 55.1, "country": "USA"},
        "knudson_cove": {"name": "Knudson Cove", "lon": -131.7, "lat": 55.4, "country": "USA"},
        "clover_pass": {"name": "Clover Pass", "lon": -131.8, "lat": 55.4, "country": "USA"},
        "herring_cove": {"name": "Herring Cove", "lon": -131.9, "lat": 55.4, "country": "USA"},
        "rotschild": {"name": "Rotschild", "lon": -132.0, "lat": 55.4, "country": "USA"},
        "seal_cove": {"name": "Seal Cove", "lon": -132.0, "lat": 55.4, "country": "USA"},
        "george_inlet": {"name": "George Inlet", "lon": -131.6, "lat": 55.2, "country": "USA"},
        "pennock_island": {"name": "Pennock Island", "lon": -131.7, "lat": 55.3, "country": "USA"},
        "gravina_island": {"name": "Gravina Island", "lon": -131.7, "lat": 55.2, "country": "USA"},
        "annette_island": {"name": "Annette Island", "lon": -131.6, "lat": 55.0, "country": "USA"},
        "duke_island": {"name": "Duke Island", "lon": -131.3, "lat": 54.9, "country": "USA"},
        "percy_island": {"name": "Percy Island", "lon": -131.1, "lat": 54.8, "country": "USA"},
        "tree_point": {"name": "Tree Point", "lon": -131.0, "lat": 54.8, "country": "USA"},
        "foggy_bay": {"name": "Foggy Bay", "lon": -131.0, "lat": 54.7, "country": "USA"},
        "cape_fox": {"name": "Cape Fox", "lon": -131.1, "lat": 54.8, "country": "USA"},
        "mary_island": {"name": "Mary Island", "lon": -131.2, "lat": 55.1, "country": "USA"},
        "dall_island": {"name": "Dall Island", "lon": -133.0, "lat": 54.9, "country": "USA"},
        "long_island": {"name": "Long Island", "lon": -133.1, "lat": 54.9, "country": "USA"},
        "sukkwan_island": {"name": "Sukkwan Island", "lon": -133.3, "lat": 55.1, "country": "USA"},
        "noyes_island": {"name": "Noyes Island", "lon": -133.7, "lat": 55.5, "country": "USA"},
        "lulu_island": {"name": "Lulu Island", "lon": -133.6, "lat": 55.4, "country": "USA"},
        "baker_island": {"name": "Baker Island", "lon": -133.6, "lat": 55.3, "country": "USA"},
        "san_juan_bautista": {"name": "San Juan Bautista", "lon": -133.7, "lat": 55.4, "country": "USA"},
        "tuxekan": {"name": "Tuxekan", "lon": -133.3, "lat": 55.7, "country": "USA"},
        "labouchere_bay": {"name": "Labouchere Bay", "lon": -133.4, "lat": 55.5, "country": "USA"},
        "sea_otter_sound": {"name": "Sea Otter Sound", "lon": -133.0, "lat": 55.8, "country": "USA"},
        "klawock_inlet": {"name": "Klawock Inlet", "lon": -133.1, "lat": 55.6, "country": "USA"},
        "sarkar_cove": {"name": "Sarkar Cove", "lon": -133.1, "lat": 55.7, "country": "USA"},
        "shakan": {"name": "Shakan", "lon": -133.0, "lat": 55.7, "country": "USA"},
        "red_bay": {"name": "Red Bay", "lon": -133.0, "lat": 55.8, "country": "USA"},
        "point_baker_2": {"name": "Point Baker 2", "lon": -133.6, "lat": 56.4, "country": "USA"}
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
    
    This function normalizes coordinates to [-180, 180] range and preserves
    the original coordinate structure for proper route visualization.
    The TypeScript side will handle splitting for map rendering.
    """
    if len(coordinates) < 2:
        return coordinates
    
    # Normalize all coordinates to [-180, 180] range
    normalized = []
    for coord in coordinates:
        lon, lat = coord[0], coord[1]
        
        # Normalize longitude to stay within -180 to +180 range
        while lon > 180:
            lon -= 360
        while lon < -180:
            lon += 360
            
        normalized.append([lon, lat])
    
    return normalized

def get_maritime_route(from_lon: float, from_lat: float, to_lon: float, to_lat: float, resolution: int = 5) -> Optional[List[List[float]]]:
    """
    Get maritime route coordinates between two points using SeaRoute
    
    Args:
        from_lon: Origin longitude
        from_lat: Origin latitude
        to_lon: Destination longitude
        to_lat: Destination latitude
        resolution: Route resolution in kilometers (default: 5km for high detail)
    
    Returns:
        List of coordinate pairs [lon, lat] representing the maritime route
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
    
    def __init__(self, debug=False, sea_route_resolution=5):
        self.coordinate_extractor = CoordinateExtractor()
        self.port_finder = PortFinder()
        self.debug = debug
        self.sea_route_resolution = sea_route_resolution
    
    def _debug_print(self, message):
        """Print debug message only when debug mode is enabled"""
        if self.debug:
            print(message, file=sys.stderr)  # Use stderr for debug output
    
    def calculate_enhanced_route(self, origin_name: str, destination_name: str) -> Optional[EnhancedRoute]:
        """
        Calculate an enhanced route with smart mode selection based on practicality
        """
        # Step 1: Extract coordinates for origin and destination
        origin_coord = self.coordinate_extractor.get_coordinates(origin_name)
        destination_coord = self.coordinate_extractor.get_coordinates(destination_name)
        
        if not origin_coord or not destination_coord:
            self._debug_print(f"Failed to get coordinates for {origin_name} or {destination_name}")
            return None
        
        # Step 2: Smart route analysis
        route_analysis = self._analyze_route_requirements(origin_name, destination_name, origin_coord, destination_coord)
        
        segments = []
        route_description = ""
        
        if route_analysis['recommended_mode'] == 'land_only':
            # Direct land route is optimal
            route_description = f"Land-only route: {origin_name} -> {destination_name}"
            segments = self._create_land_route(origin_coord, destination_coord, origin_name, destination_name)
            
        elif route_analysis['recommended_mode'] == 'sea_only':
            # Sea route between ports
            route_description = f"Sea route: {origin_name} -> {destination_name}"
            segments = self._create_sea_route(origin_coord, destination_coord, origin_name, destination_name)
            
        elif route_analysis['recommended_mode'] == 'multimodal':
            # Multimodal route is justified
            if route_analysis['origin_is_port'] and route_analysis['destination_is_port']:
                route_description = f"Port to Port: {origin_name} -> {destination_name}"
                segments = self._create_sea_route(origin_coord, destination_coord, origin_name, destination_name)
            elif not route_analysis['origin_is_port'] and not route_analysis['destination_is_port']:
                route_description = f"Multimodal route: {origin_name} -> {destination_name}"
                segments = self._create_land_sea_land_route(origin_coord, destination_coord, origin_name, destination_name)
            elif route_analysis['origin_is_port'] and not route_analysis['destination_is_port']:
                route_description = f"Port to Inland: {origin_name} -> {destination_name}"
                segments = self._create_sea_land_route(origin_coord, destination_coord, origin_name, destination_name)
            else:
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
    
    def _analyze_route_requirements(self, origin_name: str, destination_name: str, origin_coord: Coordinate, destination_coord: Coordinate) -> Dict:
        """
        Analyze route requirements to determine the most practical transport mode
        """
        # Get basic information
        origin_is_port = self.port_finder.is_port_city(origin_name)
        destination_is_port = self.port_finder.is_port_city(destination_name)
        
        # Calculate straight-line distance
        direct_distance_km = self._calculate_haversine_distance(origin_coord, destination_coord)
        
        # Extract country information (simple heuristic)
        origin_country = self._extract_country(origin_name)
        destination_country = self._extract_country(destination_name)
        
        # Check if it's a domestic route
        is_domestic = origin_country and destination_country and origin_country.lower() == destination_country.lower()
        
        # Check if there's a major water body crossing
        requires_water_crossing = self._requires_water_crossing(origin_coord, destination_coord, origin_country, destination_country)
        
        # Determine recommended mode based on smart criteria
        recommended_mode = self._determine_optimal_mode(
            is_domestic, direct_distance_km, requires_water_crossing, 
            origin_is_port, destination_is_port, origin_country, destination_country
        )
        
        return {
            'recommended_mode': recommended_mode,
            'is_domestic': is_domestic,
            'direct_distance_km': direct_distance_km,
            'requires_water_crossing': requires_water_crossing,
            'origin_is_port': origin_is_port,
            'destination_is_port': destination_is_port,
            'origin_country': origin_country,
            'destination_country': destination_country
        }
    
    def _extract_country(self, place_name: str) -> Optional[str]:
        """Extract country from place name (simple heuristic)"""
        # Look for common country patterns
        place_lower = place_name.lower()
        
        # Common country mappings
        country_patterns = {
            'colombia': ['colombia', 'bogotá', 'medellin', 'medellín', 'cali', 'barranquilla', 'cartagena'],
            'usa': ['usa', 'united states', 'miami', 'new york', 'los angeles', 'chicago', 'denver', 'salt lake city'],
            'brazil': ['brazil', 'brasil', 'são paulo', 'rio de janeiro', 'santos', 'salvador'],
            'spain': ['spain', 'españa', 'madrid', 'barcelona', 'valencia', 'sevilla'],
            'uk': ['uk', 'united kingdom', 'london', 'manchester', 'liverpool', 'glasgow'],
            'germany': ['germany', 'deutschland', 'hamburg', 'berlin', 'munich', 'frankfurt'],
            'china': ['china', 'shanghai', 'beijing', 'guangzhou', 'shenzhen'],
            'cuba': ['cuba', 'havana', 'habana']
        }
        
        for country, patterns in country_patterns.items():
            if any(pattern in place_lower for pattern in patterns):
                return country
        
        # If place name contains country, try to extract it
        if ',' in place_name:
            parts = [p.strip() for p in place_name.split(',')]
            if len(parts) >= 2:
                return parts[-1]  # Last part is usually country
        
        return None
    
    def _requires_water_crossing(self, origin: Coordinate, destination: Coordinate, origin_country: Optional[str], destination_country: Optional[str]) -> bool:
        """Determine if route requires crossing major water bodies"""
        
        # Specific water crossing cases
        water_crossings = [
            # US to Cuba/Caribbean
            ('usa', 'cuba'),
            ('usa', 'jamaica'),
            ('usa', 'bahamas'),
            
            # Europe to Americas
            ('uk', 'usa'), ('germany', 'usa'), ('spain', 'usa'),
            ('uk', 'brazil'), ('germany', 'brazil'), ('spain', 'brazil'),
            
            # Asia to Americas/Europe
            ('china', 'usa'), ('china', 'uk'), ('china', 'germany'),
            ('japan', 'usa'), ('japan', 'uk'),
            
            # Australia to anywhere
            ('australia', 'usa'), ('australia', 'uk'), ('australia', 'china'),
        ]
        
        if origin_country and destination_country:
            country_pair = (origin_country.lower(), destination_country.lower())
            reverse_pair = (destination_country.lower(), origin_country.lower())
            
            return country_pair in water_crossings or reverse_pair in water_crossings
        
        # Geographic heuristics for major water crossings
        # Atlantic crossing (longitude difference > 60 degrees and crossing prime meridian)
        if abs(origin.lon - destination.lon) > 60:
            # Likely crossing Atlantic or Pacific
            return True
        
        # Caribbean/Gulf crossings (specific coordinate ranges)
        if (origin.lat > 20 and origin.lat < 30 and origin.lon > -90 and origin.lon < -75 and
            destination.lat > 20 and destination.lat < 30 and destination.lon > -85 and destination.lon < -70):
            return True
        
        return False
    
    def _determine_optimal_mode(self, is_domestic: bool, distance_km: float, requires_water_crossing: bool, 
                               origin_is_port: bool, destination_is_port: bool, 
                               origin_country: Optional[str], destination_country: Optional[str]) -> str:
        """Determine the optimal transport mode based on route characteristics"""
        
        # Rule 1: Domestic routes under 1500km should prefer land-only
        if is_domestic and distance_km < 1500:
            return 'land_only'
        
        # Rule 2: Routes requiring water crossing should use sea transport
        if requires_water_crossing:
            if origin_is_port and destination_is_port:
                return 'sea_only'
            else:
                return 'multimodal'
        
        # Rule 3: Short international routes without water crossing prefer land
        if distance_km < 800:  # Short distance
            return 'land_only'
        
        # Rule 4: Port-to-port routes over 1000km prefer sea
        if origin_is_port and destination_is_port and distance_km > 1000:
            return 'sea_only'
        
        # Rule 5: Very long distances (>2500km) without clear land connectivity
        if distance_km > 2500:
            # Check for continental connectivity
            if self._are_continentally_connected(origin_country, destination_country):
                return 'land_only'
            else:
                return 'multimodal'
        
        # Rule 6: Medium distances (800-2500km) - prefer land for continental routes
        if distance_km <= 2500:
            if self._are_continentally_connected(origin_country, destination_country):
                return 'land_only'
            else:
                return 'multimodal'
        
        # Default to multimodal for complex cases
        return 'multimodal'
    
    def _are_continentally_connected(self, country1: Optional[str], country2: Optional[str]) -> bool:
        """Check if two countries are on the same continent with good land connectivity"""
        if not country1 or not country2:
            return False
        
        continental_groups = {
            'north_america': ['usa', 'canada', 'mexico'],
            'south_america': ['colombia', 'brazil', 'argentina', 'chile', 'peru', 'ecuador', 'venezuela'],
            'europe': ['uk', 'germany', 'france', 'spain', 'italy', 'netherlands', 'belgium'],
            'asia': ['china', 'japan', 'india', 'south korea', 'singapore', 'thailand'],
        }
        
        for continent, countries in continental_groups.items():
            if country1.lower() in countries and country2.lower() in countries:
                return True
        
        return False
    
    def _calculate_haversine_distance(self, coord1: Coordinate, coord2: Coordinate) -> float:
        """Calculate the great circle distance between two points on Earth"""
        import math
        
        # Convert to radians
        lat1, lon1 = math.radians(coord1.lat), math.radians(coord1.lon)
        lat2, lon2 = math.radians(coord2.lat), math.radians(coord2.lon)
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth's radius in km
        r = 6371
        
        return c * r
    
    def _create_land_route(self, origin: Coordinate, destination: Coordinate, origin_name: str, destination_name: str) -> List[RouteSegment]:
        """Create a direct land-only route between two points"""
        waypoints = [origin, destination]
        distance = self._calculate_distance(waypoints)
        
        return [RouteSegment(
            type=SegmentType.LAND,
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            description=f"Land: {origin_name} -> {destination_name}",
            distance_km=distance
        )]
    
    def _create_sea_route(self, origin: Coordinate, destination: Coordinate, origin_name: str, destination_name: str) -> List[RouteSegment]:
        """Create a sea-only route between two ports"""
        waypoints_raw = get_maritime_route(origin.lon, origin.lat, destination.lon, destination.lat, self.sea_route_resolution)
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
        sea_waypoints_raw = get_maritime_route(origin_port.lon, origin_port.lat, destination_port.lon, destination_port.lat, self.sea_route_resolution)
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
        sea_waypoints_raw = get_maritime_route(origin.lon, origin.lat, destination_port.lon, destination_port.lat, self.sea_route_resolution)
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
        sea_waypoints_raw = get_maritime_route(origin_port.lon, origin_port.lat, destination.lon, destination.lat, self.sea_route_resolution)
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
    # Check if running as command line tool
    if len(sys.argv) >= 4 and sys.argv[1] == "calculate_route":
        origin = sys.argv[2]
        destination = sys.argv[3]
        sea_route_resolution = int(sys.argv[4]) if len(sys.argv) >= 5 else 5
        
        # When called as API, disable debug output to keep JSON clean
        calculator = EnhancedRouteCalculator(debug=False, sea_route_resolution=sea_route_resolution)
        route = calculator.calculate_enhanced_route(origin, destination)
        if route:
            print(json.dumps(route_to_json(route)))
        else:
            print(json.dumps({"error": "Failed to calculate route"}))
        sys.exit(0)
    
    # Interactive testing mode with debug enabled
    calculator = EnhancedRouteCalculator(debug=True)
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
