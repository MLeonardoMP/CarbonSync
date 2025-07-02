'use client';

import React, { useState, useMemo } from 'react';
import { vehicles } from '@/lib/data';
import type { Vehicle, Mode, Region, Carrier } from '@/types';
import { FilterBar } from './filter-bar';
import { MapView } from './map-view';
import { VehicleInfoPanel } from './vehicle-info-panel';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { filterDataWithNaturalLanguage } from '@/ai/flows/filter-data-with-natural-language';

export function GeoVisorClient({ apiKey }: { apiKey: string }) {
  const { role, carrier: userCarrier } = useUser();
  const [filters, setFilters] = useState({
    mode: 'all' as Mode | 'all',
    region: 'all' as Region | 'all',
    carrier: 'all' as Carrier | 'all',
    emissions: 10,
  });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();

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
      if (filters.carrier !== 'all' && v.carrier !== filters.carrier) return false;
      if (v.co2e > filters.emissions) return false;
      return true;
    });
  }, [filters, role, userCarrier]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.24))] flex-col gap-4">
        <FilterBar filters={filters} setFilters={setFilters} onAiSearch={handleAiSearch} />
        <div className="flex-1 rounded-lg border shadow-sm overflow-hidden">
            <MapView
                apiKey={apiKey}
                vehicles={filteredVehicles}
                onVehicleClick={setSelectedVehicle}
            />
        </div>
        <VehicleInfoPanel
            vehicle={selectedVehicle}
            isOpen={!!selectedVehicle}
            onOpenChange={(open) => !open && setSelectedVehicle(null)}
        />
    </div>
  );
}
