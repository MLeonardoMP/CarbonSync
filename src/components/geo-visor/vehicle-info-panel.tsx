'use client';

import type { Vehicle } from '@/types';
import { format } from 'date-fns';

interface VehicleInfoPopupProps {
  vehicle: Vehicle;
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between border-b border-border/50 py-1.5 text-xs last:border-b-0">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium text-right text-foreground">{value}</p>
    </div>
);

export function VehicleInfoPopup({ vehicle }: VehicleInfoPopupProps) {
  return (
    <div className="w-64">
        <div className="mb-2">
            <h3 className="font-semibold">{vehicle.id} - {vehicle.type}</h3>
            <p className="text-sm text-muted-foreground">
                {vehicle.origin} to {vehicle.destination}
            </p>
        </div>
        <div className="space-y-1">
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
    </div>
  );
}
