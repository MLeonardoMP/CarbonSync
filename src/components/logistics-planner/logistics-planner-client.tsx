'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Map, { Source, Layer, Marker, type MapRef, NavigationControl, FullscreenControl, type Projection } from 'react-map-gl';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import { useTheme } from 'next-themes';

import { planLogisticsJourney, type PlanLogisticsJourneyOutput } from '@/ai/flows/plan-logistics-journey';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Wind, Route, MapPin, Bot, DollarSign, Clock, Lock, ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { Separator } from '@/components/ui/separator';
import { MapStyleControl } from '@/components/geo-visor/map-style-control';
import { MapProjectionControl } from '@/components/geo-visor/map-projection-control';
import { GearsmapLogo } from '@/components/icons/gearsmap-logo';

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
type Suggestion = PlanLogisticsJourneyOutput['suggestedRoutes'][0];

export function LogisticsPlannerClient({ mapboxToken }: { mapboxToken: string }) {
  const { role } = useUser();
  const { resolvedTheme } = useTheme();
  const [result, setResult] = useState<PlanLogisticsJourneyOutput | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
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
    }, 300); // match transition duration
  };

  const onSubmit = async (values: PlannerFormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSelectedSuggestion(null);
    try {
      const response = await planLogisticsJourney(values);
      setResult(response);
      if (response.suggestedRoutes.length > 0) {
        setSelectedSuggestion(response.suggestedRoutes[0]);
      }
    } catch (e) {
      setError('Failed to plan journey. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderSavings = (original: number, suggested: number) => {
    const difference = original - suggested;
    if (difference > 0) {
        return <ArrowDown className="h-4 w-4 text-accent" />;
    }
    if (difference < 0) {
        return <ArrowUp className="h-4 w-4 text-destructive" />;
    }
    return <div className="w-4 h-4" />; // Placeholder for alignment
  };

  const geoJsonData = useMemo(() => {
    if (!result) return null;

    const userRouteFeatures = result.calculatedRoute.emissionBreakdown.flatMap(leg => ({
        type: 'Feature' as const,
        properties: { id: 'user-defined-leg', type: 'user-defined'},
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [leg.originCoordinates.lon, leg.originCoordinates.lat],
            [leg.destinationCoordinates.lon, leg.destinationCoordinates.lat]
          ]
        }
    }));
    
    const suggestionFeatures = result.suggestedRoutes.map((s) => {
        try {
            const geometry: LineString = JSON.parse(s.routeGeometry);
            return {
                type: 'Feature' as const,
                properties: {
                    id: s.routeDescription,
                    type: 'suggestion',
                    ...s,
                },
                geometry: geometry,
            };
        } catch (e) {
            console.error("Failed to parse route geometry", s.routeGeometry);
            return null;
        }
    }).filter((f): f is NonNullable<typeof f> => f !== null);

    return { type: 'FeatureCollection' as const, features: [...userRouteFeatures, ...suggestionFeatures] };
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
            <div className="flex flex-col gap-6 pr-4 min-h-full">
                <div className="flex-1">
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-accent" />
                        Logistics Planner
                    </CardTitle>
                    <CardDescription>
                        Define a journey to calculate its emissions and get AI-optimized alternative routes.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <div className="space-y-4">
                              {fields.map((field, index) => (
                              <Card key={field.id} className="relative bg-muted/50 p-4">
                                  <FormLabel className="text-sm font-medium">Leg {index + 1}</FormLabel>
                                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  <FormField control={form.control} name={`legs.${index}.origin`} render={({ field }) => (<FormItem><FormLabel>Origin</FormLabel><FormControl><Input placeholder="e.g., Shanghai" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                  <FormField control={form.control} name={`legs.${index}.destination`} render={({ field }) => (<FormItem><FormLabel>Destination</FormLabel><FormControl><Input placeholder="e.g., Rotterdam" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                  <FormField control={form.control} name={`legs.${index}.cargoWeightTons`} render={({ field }) => (<FormItem><FormLabel>Weight (tons)</FormLabel><FormControl><Input type="number" placeholder="Optional" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                  </div>
                                  {fields.length > 1 && (<Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>)}
                              </Card>
                              ))}
                          </div>
                          <Button type="button" variant="outline" className="w-full" onClick={() => append({ origin: '', destination: '', cargoWeightTons: undefined })}><PlusCircle className="mr-2 h-4 w-4" />Add Leg</Button>
                          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Planning...' : 'Calculate & Optimize'}</Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
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
            <Source id="route-data" type="geojson" data={geoJsonData}>
              <Layer
                id="user-route-lines"
                type="line"
                filter={['==', ['get', 'type'], 'user-defined']}
                paint={{
                  'line-color': 'hsl(var(--accent))',
                  'line-width': 3,
                  'line-dasharray': [2, 2],
                  'line-opacity': 0.8
                }}
              />
              <Layer
                  id="suggestion-routes-lines"
                  type="line"
                  filter={['==', ['get', 'type'], 'suggestion']}
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
                          5,
                          3
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
          {result?.calculatedRoute.emissionBreakdown.map((leg, i) => (
            <React.Fragment key={`marker-${i}`}>
              <Marker longitude={leg.originCoordinates.lon} latitude={leg.originCoordinates.lat}>
                <MapPin className="h-6 w-6 text-accent" fill="hsl(var(--accent))" stroke="hsl(var(--background))"/>
              </Marker>
              <Marker longitude={leg.destinationCoordinates.lon} latitude={leg.destinationCoordinates.lat}>
                <MapPin className="h-6 w-6 text-accent" fill="hsl(var(--accent))" stroke="hsl(var(--background))"/>
              </Marker>
            </React.Fragment>
          ))}
        </Map>
      </main>
    </div>
  );
}
