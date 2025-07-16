'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import type { MapRef } from 'react-map-gl';

import { vehicles as initialVehicles, updateAllVehiclePositions } from '@/lib/data';
import type { Vehicle, Mode, Region, Carrier } from '@/types';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { filterDataWithNaturalLanguage } from '@/ai/flows/filter-data-with-natural-language';

import { StatsCard } from './stats-card';
import { EmissionsChart } from './emissions-chart';
import { FilterBar } from '@/components/geo-visor/filter-bar';
import { MapView } from '@/components/geo-visor/map-view';
import { VehicleDetails } from './vehicle-details';

import { Truck, Ship, Leaf, Globe, Bot, Send, ChevronLeft, ChevronRight, Activity, Clock, Navigation } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GearsmapLogo } from '@/components/icons/gearsmap-logo';
import { cn } from '@/lib/utils';

const searchSchema = z.object({
  query: z.string().min(3, 'Query must be at least 3 characters'),
});


export function DashboardClient({ mapboxToken }: { mapboxToken: string }) {
  const { role, carrier: userCarrier } = useUser();
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Real-time vehicle position updates
  useEffect(() => {
    if (!isRealTimeActive) return;

    const interval = setInterval(() => {
      setVehicles(currentVehicles => updateAllVehiclePositions(currentVehicles)); // Don't use seed for client-side updates
      setLastUpdateTime(format(new Date(), 'HH:mm:ss'));
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isRealTimeActive]);

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
    }, 300);
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Apply role-based filtering
      if (role === 'carrier' && userCarrier && v.carrier !== userCarrier) {
        return false;
      }
      
      // Apply filter bar filters
      if (filters.mode !== 'all' && v.mode !== filters.mode) return false;
      if (filters.region !== 'all' && v.region !== filters.region) return false;
      if (role !== 'carrier' && filters.carrier !== 'all' && v.carrier !== filters.carrier) return false;
      if (v.co2e > filters.emissions) return false;
      
      return true;
    });
  }, [filters, role, userCarrier, vehicles]);
  
  const totalEmissions = useMemo(
    () => filteredVehicles.reduce((acc, v) => acc + v.co2e, 0).toFixed(2),
    [filteredVehicles]
  );

  const totalVehicles = useMemo(() => filteredVehicles.length, [filteredVehicles]);

  // Real-time statistics
  const liveStats = useMemo(() => {
    const inTransit = filteredVehicles.filter(v => v.status === 'In Transit').length;
    const loading = filteredVehicles.filter(v => v.status === 'Loading').length;
    const delayed = filteredVehicles.filter(v => v.status === 'Delayed').length;
    const totalCapacity = filteredVehicles.reduce((acc, v) => acc + (v.capacity || 0), 0);
    const totalLoad = filteredVehicles.reduce((acc, v) => acc + (v.currentLoad || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0;

    return {
      inTransit,
      loading,
      delayed,
      utilizationRate: utilizationRate.toFixed(1)
    };
  }, [filteredVehicles]);

  // Active routes by mode
  const activeRoutes = useMemo(() => {
    const routesByMode = {
      sea: filteredVehicles.filter(v => v.mode === 'sea' && v.status === 'In Transit').length,
      truck: filteredVehicles.filter(v => v.mode === 'truck' && v.status === 'In Transit').length,
      rail: filteredVehicles.filter(v => v.mode === 'rail' && v.status === 'In Transit').length
    };
    return routesByMode;
  }, [filteredVehicles]);

  const emissionsByMode = useMemo(() => {
    const modes: Mode[] = ['truck', 'rail', 'sea'];
    return modes.map(mode => ({
      name: mode.charAt(0).toUpperCase() + mode.slice(1),
      emissions: filteredVehicles
        .filter(v => v.mode === mode)
        .reduce((acc, v) => acc + v.co2e, 0),
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

  const handleVehicleClick = (vehicle: Vehicle | null) => {
    if (selectedVehicle?.id === vehicle?.id) {
        setSelectedVehicle(null);
    } else {
        setSelectedVehicle(vehicle);
    }
  }


  return (
    <div className="flex h-full w-full">
      <aside className={cn(
        "relative h-full shrink-0 bg-background border-r transition-[width] duration-300 ease-in-out",
        isSidebarOpen ? "w-full md:w-[420px]" : "w-0 border-transparent"
      )}>
        <div className={cn(
          "h-full transition-opacity duration-300 overflow-hidden",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          {selectedVehicle ? (
            <VehicleDetails vehicle={selectedVehicle} onBack={() => setSelectedVehicle(null)} />
          ) : (
            <div className="flex flex-col gap-6 p-4 overflow-y-auto h-full">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold tracking-tight">
                            Real Time
                        </h2>
                        <div className="flex items-center gap-1">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                isRealTimeActive ? "bg-green-500" : "bg-gray-400"
                            )} />
                            <span className="text-xs text-muted-foreground">
                                {isRealTimeActive ? 'LIVE' : 'PAUSED'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsRealTimeActive(!isRealTimeActive)}
                        >
                            {isRealTimeActive ? 'Pause' : 'Resume'}
                        </Button>
                    </div>
                </div>
                
                <FilterBar filters={filters} setFilters={setFilters} />

                {/* Live Status Overview */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4" />
                            Live Status Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
                                <div className="font-bold text-green-700 dark:text-green-300">{liveStats.inTransit}</div>
                                <div className="text-green-600 dark:text-green-400">In Transit</div>
                            </div>
                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                                <div className="font-bold text-blue-700 dark:text-blue-300">{liveStats.loading}</div>
                                <div className="text-blue-600 dark:text-blue-400">Loading</div>
                            </div>
                            <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                                <div className="font-bold text-red-700 dark:text-red-300">{liveStats.delayed}</div>
                                <div className="text-red-600 dark:text-red-400">Delayed</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Fleet Utilization</span>
                                <span className="font-medium">{liveStats.utilizationRate}%</span>
                            </div>
                            <Progress value={parseFloat(liveStats.utilizationRate)} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                {/* Active Routes by Mode */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Navigation className="h-4 w-4" />
                            Active Routes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Ship className="h-3 w-3 text-blue-500" />
                                    <span>Sea Routes</span>
                                </div>
                                <Badge variant="secondary">{activeRoutes.sea}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-3 w-3 text-green-500" />
                                    <span>Land Routes</span>
                                </div>
                                <Badge variant="secondary">{activeRoutes.truck}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-orange-500" />
                                    <span>Rail Routes</span>
                                </div>
                                <Badge variant="secondary">{activeRoutes.rail}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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

                {/* Real-time Shipment Summary */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4" />
                            Real-time Shipment Summary
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-auto" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-2">
                                <div className="text-muted-foreground">Major Sea Routes</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span>Pacific Crossing</span>
                                        <Badge variant="outline" className="text-xs">8 Active</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Atlantic Crossing</span>
                                        <Badge variant="outline" className="text-xs">12 Active</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Asia-Europe</span>
                                        <Badge variant="outline" className="text-xs">15 Active</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-muted-foreground">Land Corridors</div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span>US Continental</span>
                                        <Badge variant="outline" className="text-xs">6 Active</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>European Network</span>
                                        <Badge variant="outline" className="text-xs">9 Active</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Silk Road</span>
                                        <Badge variant="outline" className="text-xs">4 Active</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-2 border-t text-xs text-center text-muted-foreground">
                            Updates every 3 seconds{isClient && lastUpdateTime && ` • Last update: ${lastUpdateTime}`}
                        </div>
                    </CardContent>
                </Card>
                
                {/* Powered by footer */}
                <div className="mt-auto pt-4 border-t">
                    <a
                        href="https://gearsmap.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span className="font-medium">Powered by</span>
                        <GearsmapLogo className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    </a>
                </div>
            </div>
          )}
        </div>
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
          onVehicleClick={handleVehicleClick}
          selectedVehicle={selectedVehicle}
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
