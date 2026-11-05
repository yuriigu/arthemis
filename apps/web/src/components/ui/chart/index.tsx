"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LineChartDataPoint {
  date: Date;
  [key: string]: Date | number;
}
export interface LineChartSeries {
  key: string;
  label: string;
  color: string;
}
export interface LineChartProps {
  title: string;
  description?: string;
  data: LineChartDataPoint[];
  series: LineChartSeries[];
  footerTitle?: string;
  footerDescription?: string;
  selectedPeriod?: string;
  periodOptions?: readonly string[];
  onPeriodChange?: (period: string) => void;
  className?: string;
  dotted?: boolean;
}
export interface PieChartSlice {
  label: string;
  value: number;
  color: string;
}
export interface PieChartProps {
  title: string;
  description?: string;
  slices: PieChartSlice[];
  footerTitle?: string;
  footerDescription?: string;
  className?: string;
}
export type ChartConfig = Record<string, { label?: string; color?: string }>;
export function ChartContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full", className)} {...props} />;
}
export function ChartTooltip({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="tooltip" className={cn("rounded-md border bg-card p-2 text-sm shadow", className)} {...props}>{children}</div>;
}
export const ChartStyle = () => null;
export { ChartContainer as Container, ChartTooltip as Tooltip };

export function LineChart({ title, description, data, series, footerTitle, footerDescription, selectedPeriod, periodOptions, onPeriodChange, className, dotted = false }: LineChartProps) {
  const values = data.flatMap((row) => series.map((item) => Number(row[item.key])).filter(Number.isFinite));
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const points = (key: string) => data.map((row, index) => {
    const x = data.length <= 1 ? 50 : 8 + (index / (data.length - 1)) * 84;
    const value = Number(row[key]) || 0;
    const y = 88 - ((value - min) / (max - min || 1)) * 76;
    return `${x},${y}`;
  }).join(" ");
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><CardTitle>{title}</CardTitle>{description && <CardDescription className="mt-1">{description}</CardDescription>}</div>
          {selectedPeriod && periodOptions?.length && onPeriodChange && <div className="flex flex-wrap gap-1">{periodOptions.map((period) => <Button key={period} size="sm" variant={selectedPeriod === period ? "default" : "secondary"} onClick={() => onPeriodChange(period)}>{period}</Button>)}</div>}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{series.map((item) => <span key={item.key} className="flex items-center gap-2 text-sm"><span className="size-3 rounded-sm" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
      </CardHeader>
      <CardContent className="flex-1">
        {data.length ? <svg role="img" aria-label={title} viewBox="0 0 100 100" preserveAspectRatio="none" className="h-64 w-full overflow-visible">
          {[12, 31, 50, 69, 88].map((y) => <line key={y} x1="5" x2="95" y1={y} y2={y} stroke="#e2e8f0" strokeWidth=".5" />)}
          {series.map((item) => <polyline key={item.key} points={points(item.key)} fill="none" stroke={item.color} strokeWidth="1.5" strokeDasharray={dotted ? "3 2" : undefined} vectorEffect="non-scaling-stroke" />)}
        </svg> : <p className="grid h-64 place-items-center text-sm text-muted-foreground">Sem dados para exibir.</p>}
      </CardContent>
      {(footerTitle || footerDescription) && <CardFooter className="flex-col items-start gap-1 text-sm">{footerTitle && <strong>{footerTitle} ↗</strong>}{footerDescription && <span className="text-muted-foreground">{footerDescription}</span>}</CardFooter>}
    </Card>
  );
}

function arcPath(start: number, end: number, radius: number) {
  const point = (angle: number) => [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)];
  const [sx, sy] = point(start);
  const [ex, ey] = point(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M 50 50 L ${sx} ${sy} A ${radius} ${radius} 0 ${large} 1 ${ex} ${ey} Z`;
}

export function PieChart({ title, description, slices, footerTitle, footerDescription, className }: PieChartProps) {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const arcs = slices.filter((slice) => slice.value > 0).reduce<{
    cursor: number;
    slices: Array<{ label: string; value: number; color: string; start: number; end: number }>;
  }>((result, slice) => {
    const end = result.cursor + (slice.value / total) * Math.PI * 2;
    return {
      cursor: end,
      slices: [...result.slices, { ...slice, start: result.cursor, end }],
    };
  }, { cursor: -Math.PI / 2, slices: [] }).slices;
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="items-center text-center"><CardTitle>{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">{slices.map((slice) => <span key={slice.label} className="flex items-center gap-2 text-sm"><span className="size-3 rounded-sm" style={{ backgroundColor: slice.color }} />{slice.label}</span>)}</div>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        {total > 0 ? <svg
          role="img"
          aria-label={`${title}: ${arcs.map((slice) => `${slice.label}: ${slice.value}`).join(", ")}`}
          viewBox="0 0 100 100"
          className="aspect-square max-h-64 w-full"
        >
          {arcs.map((slice) => {
            const { start, end } = slice;
            if (slice.value === total) return <circle key={slice.label} cx="50" cy="50" r="47" fill={slice.color} />;
            return <path key={slice.label} d={arcPath(start, end, 47)} fill={slice.color} />;
          })}
        </svg> : <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>}
      </CardContent>
      {(footerTitle || footerDescription) && <CardFooter className="flex-col gap-1 text-sm">{footerTitle && <strong>{footerTitle} ↗</strong>}{footerDescription && <span className="text-muted-foreground">{footerDescription}</span>}</CardFooter>}
    </Card>
  );
}

export function MetricCard({ title, value, description, className }: { title: string; value: React.ReactNode; description?: string; className?: string }) {
  return <Card className={className}><CardHeader><CardDescription>{title}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader></Card>;
}
