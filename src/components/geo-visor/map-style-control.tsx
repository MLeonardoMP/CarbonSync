
'use client';

import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const mapStyles = [
  { name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
  { name: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12' },
  { name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
  { name: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
];

interface MapStyleControlProps {
  currentStyle: string;
  onStyleChange: (styleUrl: string) => void;
}

export function MapStyleControl({ currentStyle, onStyleChange }: MapStyleControlProps) {
  return (
    <div className="absolute top-2 right-2 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="h-10 w-10 shadow-md">
            <Layers className="h-5 w-5" />
            <span className="sr-only">Change map style</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={currentStyle} onValueChange={onStyleChange}>
            {mapStyles.map((style) => (
              <DropdownMenuRadioItem key={style.name} value={style.url}>
                {style.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
