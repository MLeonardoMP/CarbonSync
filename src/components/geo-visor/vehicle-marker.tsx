import { Truck, Ship, TrainFront } from 'lucide-react';
import type { Mode } from '@/types';

interface VehicleMarkerProps {
  mode: Mode;
}

export function VehicleMarker({ mode }: VehicleMarkerProps) {
  const getIcon = () => {
    switch (mode) {
      case 'truck':
        return <Truck className="h-5 w-5" />;
      case 'sea':
        return <Ship className="h-5 w-5" />;
      case 'rail':
        return <TrainFront className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background/80 text-primary shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
      {getIcon()}
    </div>
  );
}
