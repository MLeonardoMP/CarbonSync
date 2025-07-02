
'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { vehicles } from '@/lib/data';
import type { Mode, Region, Carrier } from '@/types';
import { useUser } from '@/hooks/use-user';

type Filters = {
  mode: Mode | 'all';
  region: Region | 'all';
  carrier: Carrier | 'all';
  emissions: number;
};

interface FilterBarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

const modes = ['all', ...[...new Set(vehicles.map((v) => v.mode))]];
const regions = ['all', ...[...new Set(vehicles.map((v) => v.region))]];
const carriers = ['all', ...[...new Set(vehicles.map((v) => v.carrier))]];

export function FilterBar({ filters, setFilters }: FilterBarProps) {
  const { role } = useUser();

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-3 rounded-none border bg-card p-3 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select value={filters.mode} onValueChange={(v) => handleFilterChange('mode', v)}>
          <SelectTrigger className="rounded-sm"><SelectValue placeholder="Mode" /></SelectTrigger>
          <SelectContent>{modes.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.region} onValueChange={(v) => handleFilterChange('region', v)}>
          <SelectTrigger className="rounded-sm"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
        {role !== 'carrier' && (
          <Select value={filters.carrier} onValueChange={(v) => handleFilterChange('carrier', v)}>
            <SelectTrigger className="rounded-sm"><SelectValue placeholder="Carrier" /></SelectTrigger>
            <SelectContent>{carriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="emissions-slider" className="text-sm">Max CO2e: {filters.emissions} tons</Label>
          <Slider
            id="emissions-slider"
            min={0}
            max={10}
            step={0.5}
            value={[filters.emissions]}
            onValueChange={(v) => handleFilterChange('emissions', v[0])}
          />
        </div>
      </div>
    </div>
  );
}
