'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { VehicleMarker } from './vehicle-marker';
import type { Vehicle } from '@/types';

interface MapViewProps {
  apiKey: string;
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

const mapStyles = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#7c93a3" },
      { "lightness": "-10" }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry",
    "stylers": [
      { "visibility": "on" }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#a0a4a5" }
    ]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#a0a4a5" }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.fill",
    "stylers": [
      { "color": "#f0f4f9" }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#a0a4a5" }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "all",
    "stylers": [
      { "color": "#ffffff" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "all",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "all",
    "stylers": [
      { "color": "#7dcdcd" }
    ]
  }
];

export function MapView({ apiKey, vehicles, onVehicleClick }: MapViewProps) {
  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={{ lat: 40, lng: -20 }}
        defaultZoom={3}
        mapId="a2b4a8f8c8d8a8f8"
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        styles={mapStyles}
      >
        {vehicles.map((vehicle) => (
          <AdvancedMarker
            key={vehicle.id}
            position={vehicle.position}
            onClick={() => onVehicleClick(vehicle)}
          >
            <VehicleMarker mode={vehicle.mode} />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
