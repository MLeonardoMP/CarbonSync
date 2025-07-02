
'use client';

import React from 'react';
import Map, { Marker, type MapRef } from 'react-map-gl';
import { useTheme } from 'next-themes';
import { VehicleMarker } from './vehicle-marker';
import type { Vehicle } from '@/types';

interface MapViewProps {
  mapboxToken: string;
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
  selectedVehicle: Vehicle | null;
}

export const MapView = React.forwardRef<MapRef, MapViewProps>(
  ({ mapboxToken, vehicles, onVehicleClick, selectedVehicle }, ref) => {
    const { resolvedTheme } = useTheme();
    const [mapStyle, setMapStyle] = React.useState('mapbox://styles/mapbox/dark-v11');

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setMapStyle(resolvedTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
      }, 100);
      return () => clearTimeout(timer);
    }, [resolvedTheme]);

    return (
      <Map
        ref={ref}
        key={mapStyle}
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: -20,
          latitude: 40,
          zoom: 2,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        onClick={() => onVehicleClick(null as any)} // Allow deselecting by clicking the map
      >
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            longitude={vehicle.position.lng}
            latitude={vehicle.position.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onVehicleClick(vehicle);
            }}
          >
            <VehicleMarker mode={vehicle.mode} isSelected={selectedVehicle?.id === vehicle.id} />
          </Marker>
        ))}
      </Map>
    );
  }
);
MapView.displayName = 'MapView';
