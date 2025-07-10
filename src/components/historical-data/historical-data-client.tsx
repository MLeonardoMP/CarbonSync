'use client';

import React, { useState, useMemo } from 'react';
import { subDays, subWeeks, subMonths, subYears, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

import { vehicles } from '@/lib/data';
import type { Vehicle, Mode, Region, Carrier } from '@/types';
import { useUser } from '@/hooks/use-user';

import { StatsCard } from '../dashboard/stats-card';
import { EmissionsChart } from '../dashboard/emissions-chart';

import { BarChart3, TrendingDown, TrendingUp, Calendar, Package, Truck, Ship, Plane, Zap, Globe, Factory } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GearsmapLogo } from '@/components/icons/gearsmap-logo';
import { cn } from '@/lib/utils';

export function HistoricalDataClient() {
  const { role, carrier: userCarrier } = useUser();
  
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [comparisonPeriod, setComparisonPeriod] = useState<'previous' | 'year_ago'>('previous');

  // Enhanced mock data for beautiful historical analytics
  const mockHistoricalData = useMemo(() => {
    const generateData = (timeRange: string) => {
      const baseEmissions = 2840;
      const variations = {
        week: { current: baseEmissions * 0.25, previous: baseEmissions * 0.28, yearAgo: baseEmissions * 0.22 },
        month: { current: baseEmissions, previous: baseEmissions * 1.12, yearAgo: baseEmissions * 0.89 },
        quarter: { current: baseEmissions * 3.1, previous: baseEmissions * 3.3, yearAgo: baseEmissions * 2.8 },
        year: { current: baseEmissions * 12.2, previous: baseEmissions * 13.1, yearAgo: baseEmissions * 11.5 }
      };

      const data = variations[timeRange as keyof typeof variations];
      const currentEmissions = data.current + (Math.random() - 0.5) * 100;
      const comparisonEmissions = comparisonPeriod === 'previous' ? data.previous : data.yearAgo;
      
      return {
        current: {
          emissions: currentEmissions,
          vehicles: Math.floor(currentEmissions / 3.2),
          shipments: Math.floor(currentEmissions / 2.1),
          fuelConsumption: currentEmissions * 0.42,
          carbonOffset: currentEmissions * 0.08,
          efficiency: 3.2 + (Math.random() - 0.5) * 0.4
        },
        comparison: {
          emissions: comparisonEmissions,
          vehicles: Math.floor(comparisonEmissions / 3.2),
          shipments: Math.floor(comparisonEmissions / 2.1),
          fuelConsumption: comparisonEmissions * 0.42,
          carbonOffset: comparisonEmissions * 0.08,
          efficiency: 3.1 + (Math.random() - 0.5) * 0.4
        }
      };
    };

    return generateData(timeRange);
  }, [timeRange, comparisonPeriod]);

  const calculateChange = (current: number, comparison: number) => {
    return comparison > 0 ? ((current - comparison) / comparison) * 100 : 0;
  };

  const emissionsChange = calculateChange(mockHistoricalData.current.emissions, mockHistoricalData.comparison.emissions);
  const vehiclesChange = calculateChange(mockHistoricalData.current.vehicles, mockHistoricalData.comparison.vehicles);
  const shipmentsChange = calculateChange(mockHistoricalData.current.shipments, mockHistoricalData.comparison.shipments);
  const efficiencyChange = calculateChange(mockHistoricalData.current.efficiency, mockHistoricalData.comparison.efficiency);

  // Mock emissions trend data
  const emissionsTrendData = useMemo(() => {
    const periods = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
    const data = [];
    const baseValue = mockHistoricalData.current.emissions / periods;
    
    for (let i = 0; i < Math.min(periods, 12); i++) {
      data.push({
        name: timeRange === 'week' ? `Day ${i + 1}` : 
              timeRange === 'month' ? `Week ${i + 1}` :
              timeRange === 'quarter' ? `Month ${i + 1}` :
              `Month ${i + 1}`,
        emissions: baseValue + (Math.random() - 0.5) * baseValue * 0.3,
        previous: baseValue * 1.1 + (Math.random() - 0.5) * baseValue * 0.3
      });
    }
    return data;
  }, [timeRange, mockHistoricalData]);

  // Mock route performance data
  const routePerformanceData = [
    { route: 'Shanghai → Rotterdam', emissions: 2450, efficiency: 92, shipments: 156, trend: 'improving' },
    { route: 'Los Angeles → Hamburg', emissions: 1890, efficiency: 88, shipments: 134, trend: 'stable' },
    { route: 'Singapore → Long Beach', emissions: 2100, efficiency: 85, shipments: 142, trend: 'declining' },
    { route: 'Dubai → New York', emissions: 1650, efficiency: 90, shipments: 98, trend: 'improving' },
    { route: 'Busan → Southampton', emissions: 1780, efficiency: 87, shipments: 112, trend: 'stable' }
  ];

  // Mock carrier performance data
  const carrierPerformanceData = [
    { name: 'Maersk Line', emissions: 1245, efficiency: 94, share: 28, trend: 'up' },
    { name: 'MSC', emissions: 1120, efficiency: 91, share: 25, trend: 'up' },
    { name: 'COSCO', emissions: 980, efficiency: 89, share: 22, trend: 'stable' },
    { name: 'CMA CGM', emissions: 495, efficiency: 87, share: 15, trend: 'down' },
    { name: 'Hapag-Lloyd', emissions: 445, efficiency: 86, share: 10, trend: 'stable' }
  ];

  return (
    <div className="flex h-full w-full">
      <div className="w-full h-full overflow-y-auto">
        <div className="flex flex-col gap-6 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold tracking-tight">
              Historical Data Analytics
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

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total CO2e Emissions"
              value={`${mockHistoricalData.current.emissions.toFixed(1)} tons`}
              icon={Factory}
              description={`${emissionsChange >= 0 ? '+' : ''}${emissionsChange.toFixed(1)}% vs ${comparisonPeriod === 'previous' ? 'previous' : 'year ago'}`}
            />
            <StatsCard
              title="Active Vehicles"
              value={String(mockHistoricalData.current.vehicles)}
              icon={Truck}
              description={`${vehiclesChange >= 0 ? '+' : ''}${vehiclesChange.toFixed(1)}% change`}
            />
            <StatsCard
              title="Total Shipments"
              value={mockHistoricalData.current.shipments.toLocaleString()}
              icon={Package}
              description={`${shipmentsChange >= 0 ? '+' : ''}${shipmentsChange.toFixed(1)}% shipments processed`}
            />
            <StatsCard
              title="Efficiency Rating"
              value={`${mockHistoricalData.current.efficiency.toFixed(1)} tons/km`}
              icon={efficiencyChange < 0 ? TrendingDown : TrendingUp}
              description={`${efficiencyChange >= 0 ? '+' : ''}${efficiencyChange.toFixed(1)}% efficiency`}
            />
          </div>

          {/* Enhanced Charts Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Emissions Trend Analysis
                </CardTitle>
                <CardDescription>
                  Historical emissions data with comparative analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmissionsChart
                  data={emissionsTrendData}
                  title=""
                  xAxisKey="name"
                  dataKeys={['emissions', 'previous']}
                  colors={['hsl(var(--chart-1))', 'hsl(var(--chart-2))']}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
                <CardDescription>
                  Key metrics comparison across periods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {mockHistoricalData.current.emissions.toFixed(0)}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Current Period</div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                      {mockHistoricalData.comparison.emissions.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Comparison Period</div>
                  </div>
                </div>
                
                <div className={cn(
                  "flex justify-between items-center p-4 rounded-lg border-l-4",
                  emissionsChange >= 0 
                    ? "bg-red-50 dark:bg-red-950/20 border-red-500" 
                    : "bg-green-50 dark:bg-green-950/20 border-green-500"
                )}>
                  <div>
                    <div className="text-sm font-medium">Emissions Change</div>
                    <div className="text-xs text-muted-foreground">vs comparison period</div>
                  </div>
                  <div className={cn(
                    "text-xl font-bold flex items-center gap-2",
                    emissionsChange >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                  )}>
                    {emissionsChange >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    {emissionsChange >= 0 ? '+' : ''}{emissionsChange.toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route Performance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Top Route Performance
              </CardTitle>
              <CardDescription>
                Detailed analysis of high-traffic shipping routes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routePerformanceData.map((route, index) => (
                  <div key={route.route} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold">{route.route}</div>
                        <Badge variant={route.trend === 'improving' ? 'default' : route.trend === 'declining' ? 'destructive' : 'secondary'}>
                          {route.trend}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{route.shipments} shipments</span>
                          <span>{route.emissions.toLocaleString()} tons CO2e</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs">Efficiency:</span>
                          <Progress value={route.efficiency} className="w-20 h-2" />
                          <span className="text-xs font-medium">{route.efficiency}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Carrier Performance Analysis */}
          {role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Carrier Performance Analysis
                </CardTitle>
                <CardDescription>
                  Comprehensive carrier efficiency and emissions breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {carrierPerformanceData.map((carrier, index) => (
                    <div key={carrier.name} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-semibold">{carrier.name}</div>
                            <Badge variant="outline">{carrier.share}% market share</Badge>
                          </div>
                          <div className={cn(
                            "flex items-center gap-1 text-xs",
                            carrier.trend === 'up' ? "text-green-600 dark:text-green-400" :
                            carrier.trend === 'down' ? "text-red-600 dark:text-red-400" :
                            "text-gray-600 dark:text-gray-400"
                          )}>
                            {carrier.trend === 'up' ? <TrendingUp className="h-3 w-3" /> :
                             carrier.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : 
                             <div className="w-3 h-3" />}
                            {carrier.trend}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-muted-foreground">Emissions</div>
                            <div className="font-semibold">{carrier.emissions.toLocaleString()} tons</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Efficiency</div>
                            <div className="font-semibold">{carrier.efficiency}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Carbon Offset
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {mockHistoricalData.current.carbonOffset.toFixed(1)} tons
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {((mockHistoricalData.current.carbonOffset / mockHistoricalData.current.emissions) * 100).toFixed(1)}% of total emissions
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Fuel Consumption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {mockHistoricalData.current.fuelConsumption.toFixed(0)} L
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  {((mockHistoricalData.current.fuelConsumption - mockHistoricalData.comparison.fuelConsumption) / mockHistoricalData.comparison.fuelConsumption * 100).toFixed(1)}% vs comparison
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Global Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {(mockHistoricalData.current.emissions / 1000).toFixed(2)}%
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Of global shipping emissions
                </div>
              </CardContent>
            </Card>
          </div>
          
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
