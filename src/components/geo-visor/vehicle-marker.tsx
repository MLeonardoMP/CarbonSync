import { Truck, Ship, TrainFront } from 'lucide-react';
import type { Mode } from '@/types';
import { cn } from '@/lib/utils';

interface VehicleMarkerProps {
  mode: Mode;
  isSelected?: boolean;
  status?: string;
}

export function VehicleMarker({ mode, isSelected = false, status }: VehicleMarkerProps) {
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

  const getStatusColor = () => {
    switch (status) {
      case 'In Transit':
        return 'border-green-500 text-green-600 bg-green-50/80';
      case 'Loading':
        return 'border-blue-500 text-blue-600 bg-blue-50/80';
      case 'Delayed':
        return 'border-red-500 text-red-600 bg-red-50/80';
      case 'Unloading':
        return 'border-orange-500 text-orange-600 bg-orange-50/80';
      default:
        return 'border-primary text-primary bg-background/80';
    }
  };

  return (
    <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-sm transition-all hover:scale-110 relative",
        isSelected
            ? "scale-110 border-accent text-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
            : getStatusColor()
    )}>
      {getIcon()}
      {status === 'In Transit' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}
      {status === 'Delayed' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce" />
      )}
    </div>
  );
}
