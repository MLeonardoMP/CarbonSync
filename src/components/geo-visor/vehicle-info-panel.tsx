'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { Vehicle } from '@/types';
import { format } from 'date-fns';

interface VehicleInfoPanelProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between border-b py-3 text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium text-right">{value}</p>
    </div>
);

export function VehicleInfoPanel({ vehicle, isOpen, onOpenChange }: VehicleInfoPanelProps) {
  if (!vehicle) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="mb-4">
          <SheetTitle>{vehicle.id} - {vehicle.type}</SheetTitle>
          <SheetDescription>
            {vehicle.origin} to {vehicle.destination}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-2">
            <InfoRow label="Carrier" value={vehicle.carrier} />
            <InfoRow label="Mode" value={<span className="capitalize">{vehicle.mode}</span>} />
            <InfoRow label="Region" value={vehicle.region} />
            <InfoRow label="Speed" value={`${vehicle.speed} km/h`} />
            <InfoRow label="Current CO2e" value={`${vehicle.co2e} tons`} />
            <InfoRow label="ETA" value={format(new Date(vehicle.eta), "MMM d, yyyy, h:mm a")} />
            <InfoRow label="Fuel Type" value={vehicle.fuelType} />
            <InfoRow label="Load Factor" value={`${(vehicle.loadFactor * 100).toFixed(0)}%`} />
            <InfoRow label="Cost per km" value={`$${vehicle.costPerKm.toFixed(2)}`} />
            <InfoRow label="Last Updated" value={format(new Date(vehicle.lastUpdated), "MMM d, h:mm a")} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
