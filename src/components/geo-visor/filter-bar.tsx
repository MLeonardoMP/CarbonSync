'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Search } from 'lucide-react';
import { vehicles } from '@/lib/data';
import type { Mode, Region, Carrier } from '@/types';
import { useUser } from '@/hooks/use-user';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

type Filters = {
  mode: Mode | 'all';
  region: Region | 'all';
  carrier: Carrier | 'all';
  emissions: number;
};

interface FilterBarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onAiSearch: (query: string) => Promise<void>;
}

const modes = ['all', ...[...new Set(vehicles.map((v) => v.mode))]];
const regions = ['all', ...[...new Set(vehicles.map((v) => v.region))]];
const carriers = ['all', ...[...new Set(vehicles.map((v) => v.carrier))]];

const searchSchema = z.object({
  query: z.string().min(3, 'Query must be at least 3 characters'),
});

export function FilterBar({ filters, setFilters, onAiSearch }: FilterBarProps) {
  const { role } = useUser();
  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' },
  });

  const { isSubmitting } = form.formState;

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchSubmit = async (values: z.infer<typeof searchSchema>) => {
    await onAiSearch(values.query);
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm md:flex-row md:items-center">
      <div className="grid flex-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Select value={filters.mode} onValueChange={(v) => handleFilterChange('mode', v)}>
          <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
          <SelectContent>{modes.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.region} onValueChange={(v) => handleFilterChange('region', v)}>
          <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
        {role !== 'carrier' && (
          <Select value={filters.carrier} onValueChange={(v) => handleFilterChange('carrier', v)}>
            <SelectTrigger><SelectValue placeholder="Carrier" /></SelectTrigger>
            <SelectContent>{carriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        )}
        <div className="space-y-2">
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
      <div className="h-8 w-px bg-border hidden md:block mx-4" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSearchSubmit)} className="flex w-full gap-2 md:w-auto">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="AI: 'trucks in Europe over 5 tons'" {...field} />
                </FormControl>
                 <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            <Bot className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
