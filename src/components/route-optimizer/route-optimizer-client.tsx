
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Map, { Source, Layer, type MapRef, NavigationControl, FullscreenControl } from 'react-map-gl';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import { useTheme } from 'next-themes';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@/hooks/use-user';
import { Lock, Bot, Wind, DollarSign, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { suggestEmissionOptimizedRoutes, type SuggestEmissionOptimizedRoutesOutput } from '@/ai/flows/suggest-emission-optimized-routes';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapStyleControl } from '@/components/geo-visor/map-style-control';

const routeSchema = z.object({
  origin: z.string().min(2, 'Origin is required'),
  destination: z.string().min(2, 'Destination is required'),
  modeOfTransport: z.enum(['truck', 'rail', 'sea']),
  cargoWeightTons: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.coerce.number().optional()
  ),
  priority: z.enum(['emissions', 'cost', 'speed']),
});

type Suggestion = SuggestEmissionOptimizedRoutesOutput['suggestions'][0];

export function RouteOptimizerClient({ mapboxToken }: { mapboxToken: string }) {
  const { role } = useUser();
  const { resolvedTheme } = useTheme();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const mapRef = useRef<MapRef>(null);

  const [mapStyle, setMapStyle] = React.useState('mapbox://styles/mapbox/dark-v11');

  React.useEffect(() => {
    const isDefaultThemeStyle = mapStyle.includes('dark-v11') || mapStyle.includes('light-v11');
    if (isDefaultThemeStyle) {
      const newDefault = resolvedTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
      if (mapStyle !== newDefault) {
        setMapStyle(newDefault);
      }
    }
  }, [resolvedTheme, mapStyle]);


  const form = useForm<z.infer<typeof routeSchema>>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      origin: '',
      destination: '',
      modeOfTransport: 'truck',
      priority: 'emissions',
      cargoWeightTons: '',
    },
  });

  if (role === 'carrier') {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-12 text-center shadow-sm">
          <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This feature is only available for Admin and Analyst roles.
          </p>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
    setTimeout(() => {
        mapRef.current?.resize();
    }, 300); // match transition duration
  };

  const onSubmit = async (values: z.infer<typeof routeSchema>) => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setSelectedSuggestion(null);
    try {
      const result = await suggestEmissionOptimizedRoutes(values);
      setSuggestions(result.suggestions);
      if (result.suggestions.length > 0) {
        setSelectedSuggestion(result.suggestions[0]);
      }
    } catch (e) {
      setError('Failed to get route suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const geoJsonData: FeatureCollection<LineString> | null = useMemo(() => {
    if (suggestions.length === 0) return null;
    
    const features: Feature<LineString>[] = suggestions.map((s) => {
        try {
            const geometry: LineString = JSON.parse(s.routeGeometry);
            return {
                type: 'Feature',
                properties: {
                    id: s.routeDescription, // Using description as a unique ID for the feature
                    ...s,
                },
                geometry: geometry,
            };
        } catch (e) {
            console.error("Failed to parse route geometry", s.routeGeometry);
            return null;
        }
    }).filter((f): f is Feature<LineString> => f !== null);

    return { type: 'FeatureCollection', features };
  }, [suggestions]);

  return (
    <div className="h-full w-full flex">
       <aside className={cn(
        "relative h-full shrink-0 overflow-y-auto border-r border-border/50 bg-background transition-[width,padding,border] duration-300 ease-in-out",
        isSidebarOpen ? "w-full p-4 md:w-[420px]" : "w-0 p-0 border-transparent"
      )}>
            <ScrollArea className={cn(
                "h-full transition-opacity duration-300",
                isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                <div className="flex flex-col gap-6 pr-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-accent" />
                            Route Optimizer
                            </CardTitle>
                            <CardDescription>Enter details to find the most efficient routes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                control={form.control}
                                name="origin"
                                render={({ field }) => (
                                    <FormItem><FormLabel>Origin</FormLabel><FormControl><Input placeholder="e.g., Port of Los Angeles" {...field} /></FormControl><FormMessage /></FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="destination"
                                render={({ field }) => (
                                    <FormItem><FormLabel>Destination</FormLabel><FormControl><Input placeholder="e.g., Chicago Railyard" {...field} /></FormControl><FormMessage /></FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="modeOfTransport"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Mode of Transport</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                        <SelectItem value="truck">Truck</SelectItem>
                                        <SelectItem value="rail">Rail</SelectItem>
                                        <SelectItem value="sea">Sea</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="cargoWeightTons"
                                render={({ field }) => (
                                    <FormItem><FormLabel>Cargo Weight (tons)</FormLabel><FormControl><Input type="number" placeholder="Optional, e.g., 20" {...field} /></FormControl><FormMessage /></FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Optimization Priority</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                        <SelectItem value="emissions">Lowest Emissions</SelectItem>
                                        <SelectItem value="cost">Lowest Cost</SelectItem>
                                        <SelectItem value="speed">Fastest Route</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Optimizing...' : 'Find Routes'}
                                </Button>
                            </form>
                            </Form>
                        </CardContent>
                    </Card>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold tracking-tight">Suggested Routes</h3>
                        {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                        
                        {isLoading && Array.from({ length: 2 }).map((_, i) => (
                            <Card key={i}><CardContent className="p-6 space-y-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></CardContent></Card>
                        ))}
                        {suggestions.map((s, i) => (
                            <Card 
                                key={i} 
                                onClick={() => setSelectedSuggestion(s)}
                                className={cn("cursor-pointer transition-all", selectedSuggestion?.routeDescription === s.routeDescription ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50")}
                            >
                            <CardHeader>
                                <CardTitle className="text-base">Option {i + 1}</CardTitle>
                                <p className="text-sm text-muted-foreground">{s.routeDescription}</p>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-3">
                                <div className="flex items-center gap-2">
                                <Wind className="h-5 w-5 text-accent" />
                                <div>
                                    <p className="text-sm font-medium">{s.estimatedCO2eEmissions} kg</p>
                                    <p className="text-xs text-muted-foreground">CO2e Emissions</p>
                                </div>
                                </div>
                                <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-accent" />
                                <div>
                                    <p className="text-sm font-medium">{s.estimatedTime}</p>
                                    <p className="text-xs text-muted-foreground">Est. Time</p>
                                </div>
                                </div>
                                <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-accent" />
                                <div>
                                    <p className="text-sm font-medium">${s.estimatedCost.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Est. Cost</p>
                                </div>
                                </div>
                            </CardContent>
                            </Card>
                        ))}
                        {!isLoading && suggestions.length === 0 && !error && (
                            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed bg-card text-center">
                            <p className="text-muted-foreground">Enter details to find optimized routes.</p>
                            </div>
                        )}
                    </div>
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
            <Map
                ref={mapRef}
                key={mapStyle}
                mapboxAccessToken={mapboxToken}
                initialViewState={{ longitude: -98, latitude: 39, zoom: 3 }}
                mapStyle={mapStyle}
            >
             <NavigationControl position="top-left" />
             <FullscreenControl position="top-left" />
             <MapStyleControl currentStyle={mapStyle} onStyleChange={setMapStyle} />
             {geoJsonData && (
                <Source id="routes-data" type="geojson" data={geoJsonData}>
                    <Layer
                        id="routes-lines"
                        type="line"
                        paint={{
                            'line-color': [
                                'case',
                                ['==', ['get', 'id'], selectedSuggestion?.routeDescription || ''],
                                'hsl(var(--primary))',
                                'hsl(var(--border))'
                            ],
                            'line-width': [
                                'case',
                                ['==', ['get', 'id'], selectedSuggestion?.routeDescription || ''],
                                4,
                                2
                            ],
                            'line-opacity': [
                                'case',
                                ['==', ['get', 'id'], selectedSuggestion?.routeDescription || ''],
                                1,
                                0.7
                            ]
                        }}
                    />
                </Source>
             )}
            </Map>
        </main>
    </div>
  );
}
