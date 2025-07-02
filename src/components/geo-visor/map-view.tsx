'use client';

import React from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { useTheme } from 'next-themes';
import { VehicleMarker } from './vehicle-marker';
import { VehicleInfoPopup } from './vehicle-info-panel';
import type { Vehicle } from '@/types';

interface MapViewProps {
  mapboxToken: string;
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
  selectedVehicle: Vehicle | null;
  onClosePopup: () => void;
}

export function MapView({ mapboxToken, vehicles, onVehicleClick, selectedVehicle, onClosePopup }: MapViewProps) {
  const { resolvedTheme } = useTheme();
  const [mapStyle, setMapStyle] = React.useState('mapbox://styles/mapbox/dark-v11');

  React.useEffect(() => {
    // A slight delay to prevent map flashing during theme change
    const timer = setTimeout(() => {
      setMapStyle(resolvedTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
    }, 100);
    return () => clearTimeout(timer);
  }, [resolvedTheme]);

  return (
    <Map
      key={mapStyle} // Force map re-render on style change
      mapboxAccessToken={mapboxToken}
      initialViewState={{
        longitude: -20,
        latitude: 40,
        zoom: 2,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyle}
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
          <VehicleMarker mode={vehicle.mode} />
        </Marker>
      ))}

      {selectedVehicle && (
        <Popup
            longitude={selectedVehicle.position.lng}
            latitude={selectedVehicle.position.lat}
            onClose={onClosePopup}
            closeOnClick={false}
            anchor="bottom"
        >
            <VehicleInfoPopup vehicle={selectedVehicle} />
        </Popup>
      )}
    </Map>
  );
}
