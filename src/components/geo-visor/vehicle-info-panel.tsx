'use client';

import type { Vehicle } from '@/types';
import { format } from 'date-fns';
import { Leaf, Gauge, CalendarClock, Percent, Ship, Truck, TrainFront, Route } from 'lucide-react';

interface VehicleInfoPopupProps {
  vehicle: Vehicle;
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
        </div>
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground">{value}</p>
        </div>
    </div>
);

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between py-2.5 text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium text-right text-foreground">{value}</p>
    </div>
);

const ModeIcon = ({ mode }: { mode: Vehicle['mode'] }) => {
    switch (mode) {
        case 'truck': return <Truck className="h-4 w-4" />;
        case 'sea': return <Ship className="h-4 w-4" />;
        case 'rail': return <TrainFront className="h-4 w-4" />;
        default: return null;
    }
};

export function VehicleInfoPopup({ vehicle }: VehicleInfoPopupProps) {
  return (
    <div className="font-sans">
        {/* Header */}
        <div className="mb-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground">{vehicle.id}</h3>
                <div className="flex items-center gap-2 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    <ModeIcon mode={vehicle.mode} />
                    <span className="capitalize">{vehicle.mode}</span>
                </div>
            </div>
            <p className="text-sm text-muted-foreground">{vehicle.type}</p>
        </div>

        {/* Route */}
        <div className="mb-4 flex items-center justify-between gap-2 text-sm text-muted-foreground border-y border-border/50 py-2">
            <span className="font-medium text-foreground truncate">{vehicle.origin}</span>
            <Route className="h-4 w-4 shrink-0" />
            <span className="font-medium text-foreground truncate">{vehicle.destination}</span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
            <InfoItem icon={Gauge} label="Speed" value={`${vehicle.speed} km/h`} />
            <InfoItem icon={Leaf} label="CO2e" value={`${vehicle.co2e} tons`} />
            <InfoItem icon={CalendarClock} label="ETA" value={format(new Date(vehicle.eta), "MMM d, h:mm a")} />
            <InfoItem icon={Percent} label="Load" value={`${(vehicle.loadFactor * 100).toFixed(0)}%`} />
        </div>

        {/* Details */}
        <div className="divide-y divide-border/50 border-t border-border/50">
            <DetailRow label="Carrier" value={vehicle.carrier} />
            <DetailRow label="Region" value={vehicle.region} />
            <DetailRow label="Fuel Type" value={vehicle.fuelType} />
            <DetailRow label="Cost per km" value={`$${vehicle.costPerKm.toFixed(2)}`} />
            <DetailRow label="Last Updated" value={format(new Date(vehicle.lastUpdated), "MMM d, h:mm a")} />
        </div>
    </div>
  );
}
