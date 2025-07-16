
'use client';

import React from 'react';
import Map, { Marker, NavigationControl, FullscreenControl, type MapRef, type Projection } from 'react-map-gl';
import { useTheme } from 'next-themes';
import { VehicleMarker } from './vehicle-marker';
import { MapStyleControl } from './map-style-control';
import { MapProjectionControl } from './map-projection-control';
import type { Vehicle } from '@/types';

interface MapViewProps {
  mapboxToken: string;
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle | null) => void;
  selectedVehicle: Vehicle | null;
}

export const MapView = React.forwardRef<MapRef, MapViewProps>(
  ({ mapboxToken, vehicles, onVehicleClick, selectedVehicle }, ref) => {
    const { resolvedTheme } = useTheme();
    const [mapStyle, setMapStyle] = React.useState('mapbox://styles/mapbox/dark-v11');
    const [projection, setProjection] = React.useState<Projection['name']>('mercator');
    const [viewState, setViewState] = React.useState({
      longitude: -20,
      latitude: 40,
      zoom: 2,
      pitch: 0,
      bearing: 0,
    });

    React.useEffect(() => {
      const isDefaultThemeStyle = mapStyle.includes('dark-v11') || mapStyle.includes('light-v11');
      if (isDefaultThemeStyle) {
        const newDefault = resolvedTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
        if (mapStyle !== newDefault) {
          setMapStyle(newDefault);
        }
      }
    }, [resolvedTheme, mapStyle]);

    return (
      <Map
        ref={ref}
        key={`${mapStyle}-${projection}`}
        mapboxAccessToken={mapboxToken}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        projection={{ name: projection }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        onClick={() => onVehicleClick(null)} // Allow deselecting by clicking the map
      >
        <NavigationControl position="top-left" />
        <FullscreenControl position="top-left" />
        <MapStyleControl currentStyle={mapStyle} onStyleChange={setMapStyle} />
        <MapProjectionControl currentProjection={projection} onProjectionChange={setProjection} />
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
            <VehicleMarker 
              mode={vehicle.mode} 
              isSelected={selectedVehicle?.id === vehicle.id}
              status={vehicle.status}
            />
          </Marker>
        ))}
      </Map>
    );
  }
);
MapView.displayName = 'MapView';
