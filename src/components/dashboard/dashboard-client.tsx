'use client';

import { useMemo } from 'react';
import { useUser } from '@/hooks/use-user';
import { vehicles } from '@/lib/data';
import type { Vehicle, Mode } from '@/types';
import { StatsCard } from './stats-card';
import { EmissionsChart } from './emissions-chart';
import { Truck, Ship, TrainFront, Leaf, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DashboardClient() {
  const { role, carrier } = useUser();

  const filteredVehicles = useMemo(() => {
    if (role === 'carrier' && carrier) {
      return vehicles.filter((v) => v.carrier === carrier);
    }
    return vehicles;
  }, [role, carrier]);

  const totalEmissions = useMemo(
    () => filteredVehicles.reduce((acc, v) => acc + v.co2e, 0).toFixed(2),
    [filteredVehicles]
  );

  const totalVehicles = useMemo(() => filteredVehicles.length, [filteredVehicles]);

  const emissionsByMode = useMemo(() => {
    const modes: Mode[] = ['truck', 'rail', 'sea'];
    return modes.map(mode => ({
      name: mode.charAt(0).toUpperCase() + mode.slice(1),
      emissions: filteredVehicles
        .filter(v => v.mode === mode)
        .reduce((acc, v) => acc + v.co2e, 0)
        .toFixed(2),
    }));
  }, [filteredVehicles]);

  const emissionsByCarrier = useMemo(() => {
    const carriers = [...new Set(vehicles.map(v => v.carrier))];
    return carriers.map(carrierName => ({
      name: carrierName,
      emissions: vehicles
        .filter(v => v.carrier === carrierName)
        .reduce((acc, v) => acc + v.co2e, 0),
    }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome, <span className="capitalize">{role}</span>!
        </h2>
        <div className="flex items-center space-x-2">
            <Select defaultValue="month">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total CO2e Emissions"
          value={`${totalEmissions} tons`}
          icon={Leaf}
          description="Across all shipments"
        />
        <StatsCard
          title="Total Active Vehicles"
          value={String(totalVehicles)}
          icon={Truck}
          description="Currently in transit"
        />
         <StatsCard
          title="Carbon Intensity"
          value="125 g/ton-km"
          icon={Globe}
          description="Average across network"
        />
         <StatsCard
          title="Total Shipments"
          value="1,234"
          icon={Ship}
          description="Completed this month"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <EmissionsChart
          data={emissionsByMode}
          title="Emissions by Transport Mode"
          xAxisKey="name"
          dataKeys={['emissions']}
          colors={['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))']}
        />
        {role !== 'carrier' && (
          <EmissionsChart
            data={emissionsByCarrier}
            title="Emissions by Carrier"
            xAxisKey="name"
            dataKeys={['emissions']}
            colors={['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', '#a855f7']}
          />
        )}
      </div>
    </div>
  );
}
