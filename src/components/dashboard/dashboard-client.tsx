
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { MapRef } from 'react-map-gl';

import { vehicles } from '@/lib/data';
import type { Vehicle, Mode, Region, Carrier } from '@/types';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { filterDataWithNaturalLanguage } from '@/ai/flows/filter-data-with-natural-language';

import { StatsCard } from './stats-card';
import { EmissionsChart } from './emissions-chart';
import { FilterBar } from '@/components/geo-visor/filter-bar';
import { MapView } from '@/components/geo-visor/map-view';

import { Truck, Ship, Leaf, Globe, Bot, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const searchSchema = z.object({
  query: z.string().min(3, 'Query must be at least 3 characters'),
});


export function DashboardClient({ mapboxToken }: { mapboxToken: string }) {
  const { role, carrier: userCarrier } = useUser();
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const mapRef = useRef<MapRef>(null);

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' },
  });
  const { isSubmitting } = form.formState;

  const [filters, setFilters] = useState({
    mode: 'all' as Mode | 'all',
    region: 'all' as Region | 'all',
    carrier: 'all' as Carrier | 'all',
    emissions: 10,
  });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const handleAiSearch = async (values: z.infer<typeof searchSchema>) => {
    try {
      const result = await filterDataWithNaturalLanguage({ query: values.query });
      toast({
        title: 'AI Filter Generated',
        description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4"><code className="text-white">{result.filter}</code></pre>,
      });
      // In a real app, you would parse `result.filter` and apply it to the `filters` state.
      setPopoverOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Search Failed',
        description: 'Could not process the natural language query.',
      });
    }
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
    setTimeout(() => {
        mapRef.current?.resize();
    }, 300); // match transition duration
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
    <div className="flex h-[calc(100vh-theme(spacing.14))] w-full">
      <aside className={cn(
        "relative h-full shrink-0 overflow-y-auto border-r bg-background transition-[width,padding,border] duration-300 ease-in-out",
        isSidebarOpen ? "w-full p-4 md:w-[420px]" : "w-0 p-0 border-transparent"
      )}>
        <ScrollArea className={cn(
          "h-full transition-opacity duration-300",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            <div className="flex flex-col gap-6 pr-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-bold tracking-tight">
                        Dashboard
                    </h2>
                    <div className="flex items-center space-x-2">
                        <Select defaultValue="month">
                            <SelectTrigger className="w-full sm:w-[180px]">
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
                
                <FilterBar filters={filters} setFilters={setFilters} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                
                <EmissionsChart
                    data={emissionsByMode}
                    title="Emissions by Transport Mode"
                    xAxisKey="name"
                    dataKeys={['emissions']}
                    colors={['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))']}
                />
                {role !== 'carrier' && (
                    <EmissionsChart
                        data={emissionsByCarrier}
                        title="Emissions by Carrier"
                        xAxisKey="name"
                        dataKeys={['emissions']}
                        colors={['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']}
                    />
                )}
            </div>
        </ScrollArea>
      </aside>

      <main className="relative flex-1">
         <Button
            variant="secondary"
            size="icon"
            onClick={toggleSidebar}
            className="absolute top-1/2 -translate-y-1/2 left-2 z-10 h-6 w-6 rounded-full shadow-md"
          >
            {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="sr-only">Toggle sidebar</span>
        </Button>
         <MapView
          ref={mapRef}
          mapboxToken={mapboxToken}
          vehicles={filteredVehicles}
          onVehicleClick={setSelectedVehicle}
          selectedVehicle={selectedVehicle}
          onClosePopup={() => setSelectedVehicle(null)}
        />
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute bottom-6 right-6 z-10 h-10 w-10 rounded-full shadow-lg"
                >
                    <Bot className="h-5 w-5" />
                    <span className="sr-only">AI Assistant</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-lg p-0" align="end">
              <div className="flex h-[400px] flex-col">
                <div className="border-b p-3">
                  <h4 className="text-sm font-medium leading-none">AI Assistant</h4>
                  <p className="text-xs text-muted-foreground">
                    Use natural language to filter map data.
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                        <Bot className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-xs text-muted-foreground">
                            Ask me to filter data. For example: "Show all trucks in Europe"
                        </p>
                    </div>
                  </div>
                </div>
                <div className="border-t bg-background p-3">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAiSearch)} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name="query"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                placeholder="Type your message..." 
                                {...field} 
                                className="h-8 rounded-sm" 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (form.formState.isValid) {
                                      form.handleSubmit(handleAiSearch)();
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isSubmitting} size="icon" className="h-8 w-8 shrink-0 rounded-sm">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </PopoverContent>
        </Popover>
      </main>
    </div>
  );
}
