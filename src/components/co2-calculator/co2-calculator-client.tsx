
'use client';

import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Map, { Source, Layer, Marker } from 'react-map-gl';
import type { FeatureCollection } from 'geojson';

import { calculateCo2Emissions, type CalculateCo2EmissionsOutput } from '@/ai/flows/calculate-co2-emissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, PlusCircle, Trash2, Wind, Route, TrendingUp, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const legSchema = z.object({
  origin: z.string().min(2, 'Origin is required.'),
  destination: z.string().min(2, 'Destination is required.'),
  modeOfTransport: z.enum(['truck', 'rail', 'sea', 'air']),
  cargoWeightTons: z.coerce.number().positive('Must be a positive number').optional(),
});

const calculatorSchema = z.object({
  legs: z.array(legSchema).min(1, 'At least one journey leg is required.'),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

export function CO2CalculatorClient({ mapboxToken }: { mapboxToken: string }) {
  const [result, setResult] = useState<CalculateCo2EmissionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      legs: [{ origin: '', destination: '', modeOfTransport: 'truck' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'legs',
  });

  const onSubmit = async (values: CalculatorFormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await calculateCo2Emissions({ legs: values.legs });
      setResult(response);
    } catch (e) {
      setError('Failed to calculate emissions. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const geoJsonData: FeatureCollection | null = useMemo(() => {
    if (!result) return null;
    
    const features = result.emissionBreakdown.flatMap(leg => ([
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [leg.originCoordinates.lon, leg.originCoordinates.lat],
            [leg.destinationCoordinates.lon, leg.destinationCoordinates.lat]
          ]
        }
      }
    ]));

    return { type: 'FeatureCollection', features };
  }, [result]);

  return (
    <div className="h-full w-full">
      <div className="absolute inset-0 z-0">
        <Map
          mapboxAccessToken={mapboxToken}
          initialViewState={{ longitude: -30, latitude: 35, zoom: 1.5 }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          {geoJsonData && (
            <Source id="route-data" type="geojson" data={geoJsonData}>
              <Layer
                id="route-lines"
                type="line"
                paint={{
                  'line-color': 'hsl(var(--primary))',
                  'line-width': 3,
                  'line-dasharray': [2, 2]
                }}
              />
            </Source>
          )}
          {result?.emissionBreakdown.map((leg, i) => (
            <React.Fragment key={i}>
              <Marker longitude={leg.originCoordinates.lon} latitude={leg.originCoordinates.lat}>
                <MapPin className="h-6 w-6 text-primary" fill="hsl(var(--accent))" stroke="hsl(var(--background))"/>
              </Marker>
              <Marker longitude={leg.destinationCoordinates.lon} latitude={leg.destinationCoordinates.lat}>
                <MapPin className="h-6 w-6 text-primary" fill="hsl(var(--accent))" stroke="hsl(var(--background))"/>
              </Marker>
            </React.Fragment>
          ))}
        </Map>
      </div>

      <aside className="absolute left-0 top-0 z-10 h-full w-full max-w-sm overflow-y-auto border-r border-border/50 bg-background/80 p-4 backdrop-blur-sm md:w-[420px]">
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 pr-4">
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-accent" />
                        CO2 Emissions Calculator
                    </CardTitle>
                    <CardDescription>
                        Add one or more journey legs to calculate the total CO2 emissions.
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
                                <FormField
                                    control={form.control}
                                    name={`legs.${index}.origin`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Origin</FormLabel>
                                        <FormControl><Input placeholder="e.g., Shanghai Port" {...field} /></FormControl>
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
                                        <FormControl><Input placeholder="e.g., Rotterdam" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`legs.${index}.modeOfTransport`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transport Mode</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="truck">Truck</SelectItem>
                                            <SelectItem value="rail">Rail</SelectItem>
                                            <SelectItem value="sea">Sea</SelectItem>
                                            <SelectItem value="air">Air</SelectItem>
                                        </SelectContent>
                                        </Select>
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
                                        <FormControl><Input type="number" placeholder="Optional" {...field} /></FormControl>
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
                                    className="absolute -top-2 -right-2 h-7 w-7"
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
                            onClick={() => append({ origin: '', destination: '', modeOfTransport: 'truck' })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Leg
                        </Button>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Calculating...' : 'Calculate Emissions'}
                        </Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Calculation Result</h3>
                    <div className="space-y-4">
                        {isLoading && (
                            <Card>
                                <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                                <CardContent className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </CardContent>
                            </Card>
                        )}
                        {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                        
                        {result && (
                            <>
                            <Card className="text-center">
                                <CardHeader>
                                <CardTitle>Total Estimated Emissions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-bold text-primary">
                                        {result.totalCO2eEmissions.toLocaleString()} kg
                                    </p>
                                    <p className="text-muted-foreground">CO2 Equivalent</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Emissions Breakdown</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    {result.emissionBreakdown.map((leg, i) => (
                                        <div key={i} className="rounded-md border p-4">
                                            <p className="font-semibold">{leg.legDescription}</p>
                                            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Wind className="h-4 w-4 text-accent" />
                                                    <div>
                                                        <p className="font-medium">{leg.estimatedCO2eEmissions.toLocaleString()} kg</p>
                                                        <p className="text-xs text-muted-foreground">CO2e</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Route className="h-4 w-4 text-accent" />
                                                    <div>
                                                        <p className="font-medium">{leg.distanceKm.toLocaleString()} km</p>
                                                        <p className="text-xs text-muted-foreground">Distance</p>
                                                    </div>
                                                </div>
                                                { leg.distanceKm > 0 &&
                                                <div className="flex items-center gap-2 text-sm">
                                                    <TrendingUp className="h-4 w-4 text-accent" />
                                                    <div>
                                                        <p className="font-medium">{(leg.estimatedCO2eEmissions / leg.distanceKm).toFixed(2)} kg/km</p>
                                                        <p className="text-xs text-muted-foreground">Intensity</p>
                                                    </div>
                                                </div>
                                                }
                                            </div>
                                        </div>
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
            </div>
        </ScrollArea>
      </aside>
    </div>
  );
}
