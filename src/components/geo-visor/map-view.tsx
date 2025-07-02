'use client';

import Map, { Marker } from 'react-map-gl';
import { VehicleMarker } from './vehicle-marker';
import type { Vehicle } from '@/types';

interface MapViewProps {
  mapboxToken: string;
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

export function MapView({ mapboxToken, vehicles, onVehicleClick }: MapViewProps) {
  return (
    <Map
      mapboxAccessToken={mapboxToken}
      initialViewState={{
        longitude: -20,
        latitude: 40,
        zoom: 2,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
    >
      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          longitude={vehicle.position.lng}
          latitude={vehicle.position.lat}
          anchor="center"
          onClick={(e) => {
            // stop event propagation to prevent map click event
            e.originalEvent.stopPropagation();
            onVehicleClick(vehicle);
          }}
        >
          <VehicleMarker mode={vehicle.mode} />
        </Marker>
      ))}
    </Map>
  );
}
