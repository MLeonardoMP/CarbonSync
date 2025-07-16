
'use client';

import type { Vehicle } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Leaf, Gauge, CalendarClock, Percent, Ship, Truck, TrainFront, Route, ArrowLeft, Package, Activity, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
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
    <div className="flex justify-between py-3 text-sm">
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

interface VehicleDetailsProps {
    vehicle: Vehicle;
    onBack: () => void;
}

export function VehicleDetails({ vehicle, onBack }: VehicleDetailsProps) {
  const statusColor = {
    'In Transit': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'Loading': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'Unloading': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'Delayed': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    'On Schedule': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  };

  const capacityUtilization = vehicle.capacity && vehicle.currentLoad 
    ? (vehicle.currentLoad / vehicle.capacity) * 100 
    : vehicle.loadFactor * 100;

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 border-b">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <div className="flex-1">
                <h3 className="font-bold text-base text-foreground">{vehicle.id}</h3>
                <p className="text-sm text-muted-foreground">{vehicle.type}</p>
            </div>
            <div className="flex items-center gap-2">
                {vehicle.status && (
                    <Badge className={cn(
                        "text-xs px-2 py-1",
                        statusColor[vehicle.status as keyof typeof statusColor] || "bg-gray-100 text-gray-800"
                    )}>
                        {vehicle.status}
                    </Badge>
                )}
                <div className="flex items-center gap-2 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    <ModeIcon mode={vehicle.mode} />
                    <span className="capitalize">{vehicle.mode}</span>
                </div>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground truncate">{vehicle.origin}</span>
                <Route className="h-4 w-4 shrink-0 mx-2" />
                <span className="font-medium text-foreground truncate">{vehicle.destination}</span>
            </div>

            {/* Real-time Status */}
            <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Live Status</span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <span className="text-muted-foreground">Position:</span>
                        <div className="font-mono font-medium">
                            {vehicle.position.lat.toFixed(4)}, {vehicle.position.lng.toFixed(4)}
                        </div>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Updated:</span>
                        <div className="font-medium">
                            {format(new Date(vehicle.lastUpdated), "HH:mm:ss")}
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                <InfoItem icon={Gauge} label="Speed" value={`${vehicle.speed} km/h`} />
                <InfoItem icon={Leaf} label="CO2e" value={`${vehicle.co2e} tons`} />
                <InfoItem icon={CalendarClock} label="ETA" value={format(new Date(vehicle.eta), "MMM d, h:mm a")} />
                <InfoItem icon={Percent} label="Load" value={`${capacityUtilization.toFixed(0)}%`} />
            </div>

            {/* Cargo Information */}
            {(vehicle.cargoType || vehicle.capacity) && (
                <>
                    <Separator />
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Cargo Information
                        </h4>
                        {vehicle.cargoType && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">{vehicle.cargoType}</span>
                            </div>
                        )}
                        {vehicle.capacity && vehicle.currentLoad && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Capacity Utilization:</span>
                                    <span className="font-medium">{capacityUtilization.toFixed(1)}%</span>
                                </div>
                                <Progress value={capacityUtilization} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{vehicle.currentLoad} tons loaded</span>
                                    <span>{vehicle.capacity} tons capacity</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <Separator />

            <div className="divide-y">
                <DetailRow label="Carrier" value={vehicle.carrier} />
                <DetailRow label="Region" value={vehicle.region} />
                <DetailRow label="Fuel Type" value={vehicle.fuelType} />
                <DetailRow label="Cost per km" value={`$${vehicle.costPerKm.toFixed(2)}`} />
                <DetailRow label="Last Updated" value={format(new Date(vehicle.lastUpdated), "MMM d, h:mm a")} />
            </div>

            {/* Alerts/Warnings */}
            {vehicle.status === 'Delayed' && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Shipment Delayed</span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                        This shipment is experiencing delays. ETA has been updated.
                    </p>
                </div>
            )}
        </div>
    </div>
  );
}
