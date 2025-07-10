'use client';

import React, { useState, useMemo } from 'react';
import { subDays, subWeeks, subMonths, subYears, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

import { vehicles } from '@/lib/data';
import type { Vehicle, Mode, Region, Carrier } from '@/types';
import { useUser } from '@/hooks/use-user';

import { StatsCard } from '../dashboard/stats-card';
import { EmissionsChart } from '../dashboard/emissions-chart';

import { BarChart3, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GearsmapLogo } from '@/components/icons/gearsmap-logo';
import { cn } from '@/lib/utils';

export function HistoricalDataClient() {
  const { role, carrier: userCarrier } = useUser();
  
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [comparisonPeriod, setComparisonPeriod] = useState<'previous' | 'year_ago'>('previous');

  const getHistoricalData = useMemo(() => {
    const now = new Date();
    let currentInterval: { start: Date; end: Date };
    let comparisonInterval: { start: Date; end: Date };

    switch (timeRange) {
      case 'week':
        currentInterval = { start: subDays(now, 7), end: now };
        comparisonInterval = comparisonPeriod === 'previous' 
          ? { start: subDays(now, 14), end: subDays(now, 7) }
          : { start: subDays(subYears(now, 1), 7), end: subYears(now, 1) };
        break;
      case 'quarter':
        currentInterval = { start: subMonths(now, 3), end: now };
        comparisonInterval = comparisonPeriod === 'previous' 
          ? { start: subMonths(now, 6), end: subMonths(now, 3) }
          : { start: subMonths(subYears(now, 1), 3), end: subYears(now, 1) };
        break;
      case 'year':
        currentInterval = { start: subYears(now, 1), end: now };
        comparisonInterval = comparisonPeriod === 'previous' 
          ? { start: subYears(now, 2), end: subYears(now, 1) }
          : { start: subYears(now, 2), end: subYears(now, 1) };
        break;
      case 'month':
      default:
        currentInterval = { start: subMonths(now, 1), end: now };
        comparisonInterval = comparisonPeriod === 'previous' 
          ? { start: subMonths(now, 2), end: subMonths(now, 1) }
          : { start: subMonths(subYears(now, 1), 1), end: subYears(now, 1) };
        break;
    }

    const currentVehicles = vehicles.filter(v => 
      isWithinInterval(new Date(v.lastUpdated), currentInterval) &&
      (role === 'admin' || v.carrier === userCarrier)
    );

    const comparisonVehicles = vehicles.filter(v => 
      isWithinInterval(new Date(v.lastUpdated), comparisonInterval) &&
      (role === 'admin' || v.carrier === userCarrier)
    );

    const currentEmissions = currentVehicles.reduce((sum, v) => sum + v.co2e, 0);
    const comparisonEmissions = comparisonVehicles.reduce((sum, v) => sum + v.co2e, 0);
    
    const emissionsChange = comparisonEmissions > 0 
      ? ((currentEmissions - comparisonEmissions) / comparisonEmissions) * 100 
      : 0;

    return {
      current: {
        vehicles: currentVehicles,
        emissions: currentEmissions,
        vehicleCount: currentVehicles.length
      },
      comparison: {
        vehicles: comparisonVehicles,
        emissions: comparisonEmissions,
        vehicleCount: comparisonVehicles.length
      },
      changes: {
        emissions: emissionsChange,
        vehicles: comparisonVehicles.length > 0 
          ? ((currentVehicles.length - comparisonVehicles.length) / comparisonVehicles.length) * 100 
          : 0
      }
    };
  }, [timeRange, comparisonPeriod, role, userCarrier]);

  const { current, comparison, changes } = getHistoricalData;

  return (
    <div className="flex h-full w-full">
      <div className="w-full h-full overflow-y-auto">
        <div className="flex flex-col gap-6 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold tracking-tight">
              Historical Data
            </h2>
            <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as 'week' | 'month' | 'quarter' | 'year')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={comparisonPeriod} onValueChange={(value) => setComparisonPeriod(value as 'previous' | 'year_ago')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Compare with" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous">Previous Period</SelectItem>
                  <SelectItem value="year_ago">Year Ago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="Historical CO2e Emissions"
              value={`${current.emissions.toFixed(1)} tons`}
              icon={BarChart3}
              description={`${changes.emissions >= 0 ? '+' : ''}${changes.emissions.toFixed(1)}% vs comparison period`}
            />
            <StatsCard
              title="Vehicle Activity"
              value={String(current.vehicleCount)}
              icon={Calendar}
              description={`${changes.vehicles >= 0 ? '+' : ''}${changes.vehicles.toFixed(1)}% vs comparison period`}
            />
            <StatsCard
              title="Emissions Efficiency"
              value={current.vehicleCount > 0 ? `${(current.emissions / current.vehicleCount).toFixed(2)} tons/vehicle` : '0 tons/vehicle'}
              icon={changes.emissions - changes.vehicles < 0 ? TrendingDown : TrendingUp}
              description="Average emissions per vehicle"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Emissions Trend</CardTitle>
                <CardDescription>
                  Historical emissions data for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Emissions trend chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Period Comparison</CardTitle>
                <CardDescription>
                  Current vs {comparisonPeriod === 'previous' ? 'previous' : 'year ago'} period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Current Period</span>
                  <span className="text-lg font-bold">{current.emissions.toFixed(1)} tons</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Comparison Period</span>
                  <span className="text-lg font-bold">{comparison.emissions.toFixed(1)} tons</span>
                </div>
                <div className={cn(
                  "flex justify-between items-center p-3 rounded-lg",
                  changes.emissions >= 0 ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20"
                )}>
                  <span className="text-sm font-medium">Change</span>
                  <span className={cn(
                    "text-lg font-bold flex items-center gap-1",
                    changes.emissions >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                  )}>
                    {changes.emissions >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {changes.emissions >= 0 ? '+' : ''}{changes.emissions.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Activity Summary</CardTitle>
              <CardDescription>
                Breakdown of vehicle activity by mode and carrier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(['truck', 'ship', 'train'] as const).map(mode => {
                  const modeVehicles = current.vehicles.filter(v => v.mode === mode);
                  const modeEmissions = modeVehicles.reduce((sum, v) => sum + v.co2e, 0);
                  
                  return (
                    <div key={mode} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium capitalize">{mode}s</span>
                      <div className="text-right">
                        <div className="text-lg font-bold">{modeVehicles.length} vehicles</div>
                        <div className="text-sm text-muted-foreground">{modeEmissions.toFixed(1)} tons CO2e</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Powered by footer */}
          <div className="mt-auto">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <a
                  href="https://gearsmap.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="font-medium">Powered by</span>
                  <GearsmapLogo className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                  <span className="font-semibold">GearsMap</span>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
