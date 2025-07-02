
'use client';

import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Map, { Source, Layer, Marker } from 'react-map-gl';
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
import { PlusCircle, Trash2, Wind, Route, MapPin, Bot, DollarSign, Clock, Lock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

const legSchema = z.object({
  origin: z.string().min(2, 'Origin is required.'),
  destination: z.string().min(2, 'Destination is required.'),
  modeOfTransport: z.enum(['truck', 'rail', 'sea', 'air']),
  cargoWeightTons: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().positive('Must be a positive number').optional()
  ),
});

const plannerSchema = z.object({
  legs: z.array(legSchema).min(1, 'At least one journey leg is required.'),
  priority: z.enum(['emissions', 'cost', 'speed']),
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

  const [mapStyle, setMapStyle] = React.useState('mapbox://styles/mapbox/dark-v11');

  React.useEffect(() => {
    const timer = setTimeout(() => {
        setMapStyle(resolvedTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
    }, 100);
    return () => clearTimeout(timer);
  }, [resolvedTheme]);


  const form = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
    defaultValues: {
      legs: [{ origin: '', destination: '', modeOfTransport: 'truck', cargoWeightTons: '' }],
      priority: 'emissions',
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
    
    const suggestionFeatures: Feature<LineString>[] = result.suggestedRoutes.map((s) => {
        try {
            const geometry: LineString = JSON.parse(s.routeGeometry);
            return {
                type: 'Feature',
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
    }).filter((f): f is Feature<LineString> => f !== null);

    return { type: 'FeatureCollection' as const, features: [...userRouteFeatures, ...suggestionFeatures] };
  }, [result]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14))] w-full">
      <aside className="h-full w-full shrink-0 overflow-y-auto border-r border-border/50 bg-background p-4 md:w-[420px]">
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 pr-4">
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
                                  <FormField control={form.control} name={`legs.${index}.modeOfTransport`} render={({ field }) => (<FormItem><FormLabel>Transport Mode</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="truck">Truck</SelectItem><SelectItem value="rail">Rail</SelectItem><SelectItem value="sea">Sea</SelectItem><SelectItem value="air">Air</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                  <FormField control={form.control} name={`legs.${index}.cargoWeightTons`} render={({ field }) => (<FormItem><FormLabel>Weight (tons)</FormLabel><FormControl><Input type="number" placeholder="Optional" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                  </div>
                                  {fields.length > 1 && (<Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-7 w-7" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>)}
                              </Card>
                              ))}
                          </div>
                          <Button type="button" variant="outline" className="w-full" onClick={() => append({ origin: '', destination: '', modeOfTransport: 'truck', cargoWeightTons: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Leg</Button>
                          <FormField control={form.control} name="priority" render={({ field }) => (<FormItem><FormLabel>Optimization Priority</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="emissions">Lowest Emissions</SelectItem><SelectItem value="cost">Lowest Cost</SelectItem><SelectItem value="speed">Fastest Route</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Planning...' : 'Calculate & Optimize'}</Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>

                {/* RESULTS SECTION */}
                <div className="space-y-4">
                    {isLoading && (
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></CardContent></Card>
                    )}
                    {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                    
                    {result && (
                      <>
                        {/* User's Route Calculation */}
                        <Card>
                            <CardHeader><CardTitle>Your Route Calculation</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center rounded-md bg-muted p-4">
                                    <p className="text-sm text-muted-foreground">Total Estimated Emissions</p>
                                    <p className="text-xl font-bold text-primary">
                                        {result.calculatedRoute.totalCO2eEmissions.toLocaleString()} kg
                                    </p>
                                </div>
                                <p className="font-semibold text-sm">Emissions Breakdown</p>
                                {result.calculatedRoute.emissionBreakdown.map((leg, i) => (
                                    <div key={`breakdown-${i}`} className="rounded-md border p-3">
                                        <p className="font-semibold text-sm">{leg.legDescription}</p>
                                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            <div className="flex items-center gap-2 text-xs"><Wind className="h-4 w-4 text-accent" /><span>{leg.estimatedCO2eEmissions.toLocaleString()} kg CO2e</span></div>
                                            <div className="flex items-center gap-2 text-xs"><Route className="h-4 w-4 text-accent" /><span>{leg.distanceKm.toLocaleString()} km</span></div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        
                        {/* AI Suggestions */}
                        <Card>
                          <CardHeader><CardTitle>AI-Suggested Alternatives</CardTitle></CardHeader>
                          <CardContent className="space-y-4">
                            {result.suggestedRoutes.length === 0 && <p className="text-sm text-muted-foreground">No alternative routes could be generated.</p>}
                            {result.suggestedRoutes.map((s, i) => (
                                <Card key={`suggestion-${i}`} onClick={() => setSelectedSuggestion(s)} className={cn("cursor-pointer transition-shadow", selectedSuggestion?.routeDescription === s.routeDescription ? "ring-2 ring-primary" : "ring-1 ring-transparent hover:ring-1 hover:ring-primary/60")}>
                                <CardHeader className="p-4"><CardTitle className="text-base">Option {i + 1}</CardTitle><p className="text-xs text-muted-foreground">{s.routeDescription}</p></CardHeader>
                                <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-3">
                                    <div className="flex items-center gap-2"><Wind className="h-4 w-4 text-accent" /><div><p className="text-xs font-medium">{s.estimatedCO2eEmissions} kg</p><p className="text-xs text-muted-foreground">CO2e</p></div></div>
                                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /><div><p className="text-xs font-medium">{s.estimatedTime}</p><p className="text-xs text-muted-foreground">Time</p></div></div>
                                    <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-accent" /><div><p className="text-xs font-medium">${s.estimatedCost.toLocaleString()}</p><p className="text-xs text-muted-foreground">Cost</p></div></div>
                                </CardContent>
                                </Card>
                            ))}
                          </CardContent>
                        </Card>
                      </>
                    )}

                    {!isLoading && !result && !error && (
                        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed bg-card text-center">
                            <p className="text-muted-foreground">Results will be displayed here.</p>
                        </div>
                    )}
                </div>
            </div>
        </ScrollArea>
      </aside>
      <main className="relative flex-1">
        <Map
          key={mapStyle}
          mapboxAccessToken={mapboxToken}
          initialViewState={{ longitude: -30, latitude: 35, zoom: 1.5 }}
          mapStyle={mapStyle}
        >
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
