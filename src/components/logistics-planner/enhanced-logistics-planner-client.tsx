'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Map, { Source, Layer, Marker, type MapRef, NavigationControl, FullscreenControl, type Projection } from 'react-map-gl';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import { useTheme } from 'next-themes';

import { planEnhancedLogisticsJourney, type PlanEnhancedLogisticsJourneyOutput } from '@/ai/flows/plan-enhanced-logistics-journey';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Wind, Route, MapPin, Bot, Ship, Truck, BarChart3, Clock, DollarSign, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { Separator } from '@/components/ui/separator';
import { MapStyleControl } from '@/components/geo-visor/map-style-control';
import { MapProjectionControl } from '@/components/geo-visor/map-projection-control';
import { Badge } from '@/components/ui/badge';

const legSchema = z.object({
  origin: z.string().min(2, 'Origin is required.'),
  destination: z.string().min(2, 'Destination is required.'),
  cargoWeightTons: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().positive('Must be a positive number').optional()
  ),
});

const plannerSchema = z.object({
  legs: z.array(legSchema).min(1, 'At least one journey leg is required.'),
});

type PlannerFormValues = z.infer<typeof plannerSchema>;

export function EnhancedLogisticsPlannerClient({ mapboxToken }: { mapboxToken: string }) {
  const { role } = useUser();
  const { resolvedTheme } = useTheme();
  const [result, setResult] = useState<PlanEnhancedLogisticsJourneyOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const mapRef = useRef<MapRef>(null);

  const [mapStyle, setMapStyle] = React.useState('mapbox://styles/mapbox/dark-v11');
  const [projection, setProjection] = React.useState<Projection['name']>('mercator');
  const [viewState, setViewState] = React.useState({
    longitude: -30,
    latitude: 35,
    zoom: 1.5,
    pitch: 0,
    bearing: 0,
  });

  React.useEffect(() => {
    const isDefaultThemeStyle = mapStyle.includes('dark-v11') || mapStyle.includes('light-v11');
    if (isDefaultThemeStyle) {
      const newDefault = resolvedTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
      if (mapStyle !== newDefault) {
        setMapStyle(newDefault);
      }
    }
  }, [resolvedTheme, mapStyle]);

  const form = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
    defaultValues: {
      legs: [{ origin: '', destination: '', cargoWeightTons: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'legs',
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
    }, 300);
  };

  const onSubmit = async (values: PlannerFormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await planEnhancedLogisticsJourney(values);
      setResult(response);
      
      // Fit map to route bounds
      if (response.calculatedRoute.segments.length > 0) {
        const allWaypoints = response.calculatedRoute.segments.flatMap(s => s.waypoints);
        if (allWaypoints.length > 0) {
          const bounds = {
            minLng: Math.min(...allWaypoints.map(w => w.lon)),
            maxLng: Math.max(...allWaypoints.map(w => w.lon)),
            minLat: Math.min(...allWaypoints.map(w => w.lat)),
            maxLat: Math.max(...allWaypoints.map(w => w.lat))
          };
          
          mapRef.current?.fitBounds(
            [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
            { padding: 50, duration: 1000 }
          );
        }
      }
    } catch (e) {
      setError('Failed to plan enhanced journey. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const geoJsonData = useMemo(() => {
    if (!result) return null;

    try {
      return JSON.parse(result.routeGeometry);
    } catch (e) {
      console.error("Failed to parse route geometry", result.routeGeometry);
      return null;
    }
  }, [result]);

  return (
    <div className="flex h-full w-full">
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
                  Enhanced Logistics Planner
                </CardTitle>
                <CardDescription>
                  AI-powered segment-focused route planning with maritime and land transport optimization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <Card key={field.id} className="relative bg-muted/50 p-4">
                          <FormLabel className="text-sm font-medium">Journey {index + 1}</FormLabel>
                          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`legs.${index}.origin`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Origin</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Shanghai" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`legs.${index}.destination`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Destination</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Bogota" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`legs.${index}.cargoWeightTons`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Weight (tons)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Optional"
                                      {...field}
                                      value={field.value ?? ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </Card>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => append({ origin: '', destination: '', cargoWeightTons: undefined })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Journey
                    </Button>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Calculating Enhanced Route...' : 'Calculate Enhanced Route'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* RESULTS SECTION */}
            <div className="space-y-4">
              {isLoading && (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {result && (
                <>
                  {/* Route Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Route className="h-5 w-5 text-accent" />
                        Enhanced Route Overview
                      </CardTitle>
                      <CardDescription>{result.calculatedRoute.route_description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="rounded-md bg-muted p-3">
                          <p className="text-sm text-muted-foreground">Total Distance</p>
                          <p className="text-lg font-bold text-primary">
                            {result.calculatedRoute.total_distance_km.toLocaleString()} km
                          </p>
                        </div>
                        <div className="rounded-md bg-muted p-3">
                          <p className="text-sm text-muted-foreground">Total Emissions</p>
                          <p className="text-lg font-bold text-destructive">
                            {result.calculatedRoute.totalCO2eEmissions.toLocaleString()} kg CO2e
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <Clock className="h-4 w-4 mx-auto mb-1 text-accent" />
                          <p className="font-medium">{result.calculatedRoute.totalEstimatedTime}</p>
                          <p className="text-muted-foreground">Time</p>
                        </div>
                        <div className="text-center">
                          <DollarSign className="h-4 w-4 mx-auto mb-1 text-accent" />
                          <p className="font-medium">${result.calculatedRoute.totalEstimatedCost.toLocaleString()}</p>
                          <p className="text-muted-foreground">Cost</p>
                        </div>
                        <div className="text-center">
                          <MapPin className="h-4 w-4 mx-auto mb-1 text-accent" />
                          <p className="font-medium">{result.calculatedRoute.total_waypoints}</p>
                          <p className="text-muted-foreground">Waypoints</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Route Segments */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Route Segments</CardTitle>
                      <CardDescription>
                        {result.calculatedRoute.segments.length} segments optimized for efficiency
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.calculatedRoute.segments.map((segment, i) => (
                        <div key={`segment-${i}`} className="rounded-md border p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {segment.type === 'sea' ? (
                              <Ship className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Truck className="h-4 w-4 text-red-500" />
                            )}
                            <Badge variant={segment.type === 'sea' ? 'default' : 'secondary'}>
                              {segment.type.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{segment.description}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <Route className="h-3 w-3 text-muted-foreground" />
                              <span>{segment.distance_km.toFixed(1)} km</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Wind className="h-3 w-3 text-muted-foreground" />
                              <span>{segment.estimatedCO2eEmissions.toLocaleString()} kg CO2e</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{segment.estimatedTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span>${segment.estimatedCost.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Route Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-accent" />
                        Route Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Ship className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Sea Transport</span>
                          </div>
                          <p className="text-lg font-bold text-blue-600">
                            {result.analysis.seaDistance.toFixed(1)} km
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.analysis.seaSegmentCount} segment(s)
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Truck className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium">Land Transport</span>
                          </div>
                          <p className="text-lg font-bold text-red-600">
                            {result.analysis.landDistance.toFixed(1)} km
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.analysis.landSegmentCount} segment(s)
                          </p>
                        </div>
                      </div>
                      
                      {result.analysis.majorPorts.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Major Ports Used:</p>
                          <div className="flex flex-wrap gap-1">
                            {result.analysis.majorPorts.map((port, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {port}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {!isLoading && !result && !error && (
                <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed bg-card text-center">
                  <p className="text-muted-foreground">Enhanced route results will be displayed here.</p>
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
          key={`${mapStyle}-${projection}`}
          mapboxAccessToken={mapboxToken}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          projection={{name: projection}}
          mapStyle={mapStyle}
        >
          <NavigationControl position="top-left" />
          <FullscreenControl position="top-left" />
          <MapStyleControl currentStyle={mapStyle} onStyleChange={setMapStyle} />
          <MapProjectionControl currentProjection={projection} onProjectionChange={setProjection} />
          
          {geoJsonData && (
            <Source id="enhanced-route-data" type="geojson" data={geoJsonData}>
              {/* Sea route segments - Blue */}
              <Layer
                id="sea-route-lines"
                type="line"
                filter={['==', ['get', 'type'], 'sea']}
                paint={{
                  'line-color': '#3b82f6',
                  'line-width': 4,
                  'line-opacity': 0.8
                }}
              />
              
              {/* Land route segments - Red */}
              <Layer
                id="land-route-lines"
                type="line"
                filter={['==', ['get', 'type'], 'land']}
                paint={{
                  'line-color': '#ef4444',
                  'line-width': 4,
                  'line-dasharray': [2, 2],
                  'line-opacity': 0.8
                }}
              />
            </Source>
          )}
          
          {/* Add markers for segment endpoints */}
          {result?.calculatedRoute.segments.map((segment, i) => (
            <React.Fragment key={`markers-${i}`}>
              <Marker longitude={segment.origin.lon} latitude={segment.origin.lat}>
                <div className="relative">
                  <MapPin className="h-6 w-6 text-accent" fill="hsl(var(--accent))" stroke="hsl(var(--background))"/>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap">
                    {segment.type === 'sea' ? '🚢' : '🚛'} Start
                  </div>
                </div>
              </Marker>
              <Marker longitude={segment.destination.lon} latitude={segment.destination.lat}>
                <div className="relative">
                  <MapPin className="h-6 w-6 text-accent" fill="hsl(var(--accent))" stroke="hsl(var(--background))"/>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap">
                    {segment.type === 'sea' ? '🚢' : '🚛'} End
                  </div>
                </div>
              </Marker>
            </React.Fragment>
          ))}
        </Map>
      </main>
    </div>
  );
}
