
'use client';

import { Globe, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Projection } from 'react-map-gl';

interface MapProjectionControlProps {
  currentProjection: Projection['name'];
  onProjectionChange: (projection: Projection['name']) => void;
}

export function MapProjectionControl({ currentProjection, onProjectionChange }: MapProjectionControlProps) {
  const isGlobe = currentProjection === 'globe';

  const toggleProjection = () => {
    onProjectionChange(isGlobe ? 'mercator' : 'globe');
  };

  return (
    <div className="absolute top-2 right-[calc(2.5rem+0.5rem)] z-10">
      <Button variant="secondary" size="icon" className="h-10 w-10 shadow-md" onClick={toggleProjection} title={`Switch to ${isGlobe ? '2D Map' : '3D Globe'} View`}>
        {isGlobe ? <MapIcon className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
        <span className="sr-only">Toggle {isGlobe ? 'Map View' : 'Globe View'}</span>
      </Button>
    </div>
  );
}
