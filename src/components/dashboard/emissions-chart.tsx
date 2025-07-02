'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmissionsChartProps<T> {
  data: T[];
  title: string;
  xAxisKey: keyof T;
  dataKeys: (keyof T)[];
  colors: string[];
}

export function EmissionsChart<T extends object>({
  data,
  title,
  xAxisKey,
  dataKeys,
  colors,
}: EmissionsChartProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={xAxisKey as string}
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }}
              />
              <Legend iconSize={10} />
              {dataKeys.map((key, index) => (
                <Bar
                  key={key as string}
                  dataKey={key as string}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
