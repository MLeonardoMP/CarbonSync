import { Truck, Ship, TrainFront } from 'lucide-react';
import type { Mode } from '@/types';
import { cn } from '@/lib/utils';

interface VehicleMarkerProps {
  mode: Mode;
  isSelected?: boolean;
}

export function VehicleMarker({ mode, isSelected = false }: VehicleMarkerProps) {
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
    <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background/80 shadow-lg backdrop-blur-sm transition-all hover:scale-110",
        isSelected
            ? "scale-110 border-accent text-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
            : "border-primary text-primary"
    )}>
      {getIcon()}
    </div>
  );
}
