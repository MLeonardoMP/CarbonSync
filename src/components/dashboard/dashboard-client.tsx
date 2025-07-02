'use client';

import React, { useState, useMemo } from 'react';
import { vehicles } from '@/lib/data';
import type { Vehicle, Mode, Region, Carrier } from '@/types';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { filterDataWithNaturalLanguage } from '@/ai/flows/filter-data-with-natural-language';

import { StatsCard } from './stats-card';
import { EmissionsChart } from './emissions-chart';
import { FilterBar } from '@/components/geo-visor/filter-bar';
import { MapView } from '@/components/geo-visor/map-view';
import { VehicleInfoPanel } from '@/components/geo-visor/vehicle-info-panel';

import { Truck, Ship, Leaf, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DashboardClient({ mapboxToken }: { mapboxToken: string }) {
  const { role, carrier: userCarrier } = useUser();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    mode: 'all' as Mode | 'all',
    region: 'all' as Region | 'all',
    carrier: 'all' as Carrier | 'all',
    emissions: 10,
  });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const handleAiSearch = async (query: string) => {
    try {
      const result = await filterDataWithNaturalLanguage({ query });
      toast({
        title: 'AI Filter Generated',
        description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4"><code className="text-white">{result.filter}</code></pre>,
      });
      // In a real app, you would parse `result.filter` and apply it to the `filters` state.
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Search Failed',
        description: 'Could not process the natural language query.',
      });
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (role === 'carrier' && userCarrier && v.carrier !== userCarrier) {
        return false;
      }
      if (filters.mode !== 'all' && v.mode !== filters.mode) return false;
      if (filters.region !== 'all' && v.region !== filters.region) return false;
      if (role !== 'carrier' && filters.carrier !== 'all' && v.carrier !== filters.carrier) return false;
      if (v.co2e > filters.emissions) return false;
      return true;
    });
  }, [filters, role, userCarrier]);
  
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
    const carriers = [...new Set(filteredVehicles.map(v => v.carrier))];
    return carriers.map(carrierName => ({
      name: carrierName,
      emissions: filteredVehicles
        .filter(v => v.carrier === carrierName)
        .reduce((acc, v) => acc + v.co2e, 0),
    }));
  }, [filteredVehicles]);


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
          description="Based on current filters"
        />
        <StatsCard
          title="Filtered Vehicles"
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

      <FilterBar filters={filters} setFilters={setFilters} onAiSearch={handleAiSearch} />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[500px] rounded-lg border shadow-sm overflow-hidden">
            <MapView
                mapboxToken={mapboxToken}
                vehicles={filteredVehicles}
                onVehicleClick={setSelectedVehicle}
            />
        </div>
        <div className="lg:col-span-1 space-y-4">
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

      <VehicleInfoPanel
          vehicle={selectedVehicle}
          isOpen={!!selectedVehicle}
          onOpenChange={(open) => !open && setSelectedVehicle(null)}
      />
    </div>
  );
}
