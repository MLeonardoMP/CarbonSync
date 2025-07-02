'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { calculateCo2Emissions, type CalculateCo2EmissionsOutput } from '@/ai/flows/calculate-co2-emissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, PlusCircle, Trash2, Wind, Route, TrendingUp } from 'lucide-react';

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

export function CO2CalculatorClient() {
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

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
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
      </div>

      <div className="lg:col-span-2">
         <h3 className="mb-4 text-xl font-semibold">Calculation Result</h3>
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
                                        <Wind className="h-4 w-4 text-primary" />
                                        <div>
                                            <p className="font-medium">{leg.estimatedCO2eEmissions.toLocaleString()} kg</p>
                                            <p className="text-xs text-muted-foreground">CO2e</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Route className="h-4 w-4 text-primary" />
                                         <div>
                                            <p className="font-medium">{leg.distanceKm.toLocaleString()} km</p>
                                            <p className="text-xs text-muted-foreground">Distance</p>
                                        </div>
                                    </div>
                                    { leg.distanceKm > 0 &&
                                    <div className="flex items-center gap-2 text-sm">
                                        <TrendingUp className="h-4 w-4 text-primary" />
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
                 <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed bg-card text-center">
                    <p className="text-muted-foreground">Enter journey details to calculate emissions.</p>
                 </div>
            )}
         </div>
      </div>
    </div>
  );
}
