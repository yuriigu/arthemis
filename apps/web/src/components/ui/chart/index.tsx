"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildSmoothLinePath,
  formatChartDate,
  formatTooltipMonth,
  getChartBounds,
  getIntegerTicks,
} from "./chart-utils";

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
  totalLabel?: string;
  emptySliceNote?: string;
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

function formatProjectCount(count: number) {
  return `${count} ${count === 1 ? "projeto" : "projetos"}`;
}

export function LineChart({
  title,
  description,
  data,
  series,
  footerTitle,
  footerDescription,
  selectedPeriod,
  periodOptions,
  onPeriodChange,
  className,
  dotted = false,
}: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    seriesKey?: string;
  } | null>(null);

  const { min, max, step } = getChartBounds(data, series);
  const ticks = getIntegerTicks(max, step).reverse(); // Top (max) to bottom (0)

  const years = new Set(data.map((row) => row.date.getUTCFullYear()));
  const includeYearInAxis = years.size > 1 || data.length > 12 || data.length === 1;
  const labelStep = data.length > 12 ? Math.ceil(data.length / 8) : 1;

  const getPointCoords = (row: LineChartDataPoint, index: number, key: string) => {
    const x = data.length <= 1 ? 50 : 4 + (index / (data.length - 1)) * 92;
    const rawValue = Number(row[key]);
    const value = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;
    const y = 92 - ((value - min) / (max - min || 1)) * 84;
    return { x, y, value };
  };

  const seriesPoints = series.map((item) => ({
    ...item,
    coords: data.map((row, index) => getPointCoords(row, index, item.key)),
  }));

  const activePointInfo = (() => {
    if (hoveredPoint === null || !data[hoveredPoint.index]) return null;
    const row = data[hoveredPoint.index];
    const x = data.length <= 1 ? 50 : 4 + (hoveredPoint.index / (data.length - 1)) * 92;
    const items = series.map((s) => {
      const coord = getPointCoords(row, hoveredPoint.index, s.key);
      return { ...s, ...coord };
    });
    const focused = hoveredPoint.seriesKey
      ? items.find((item) => item.key === hoveredPoint.seriesKey) ?? items[0]
      : items.reduce((highest, item) => (item.y < highest.y ? item : highest), items[0]);
    return {
      index: hoveredPoint.index,
      date: row.date,
      x,
      y: focused ? focused.y : 50,
      focused,
      items,
    };
  })();

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {series.map((item) => (
                <span key={item.key} className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className="size-3 rounded-full shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
            {selectedPeriod && periodOptions?.length && onPeriodChange && (
              <div
                role="group"
                aria-label="Filtro de período"
                className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
              >
                {periodOptions.map((period) => {
                  const isSelected = selectedPeriod === period;
                  return (
                    <Button
                      key={period}
                      type="button"
                      size="sm"
                      variant={isSelected ? "default" : "ghost"}
                      aria-pressed={isSelected}
                      className={cn(
                        "h-7 px-2.5 text-xs font-semibold transition-all",
                        !isSelected && "text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => onPeriodChange(period)}
                    >
                      {period}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-4">
        {data.length ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[2.25rem_1fr] items-stretch gap-2">
              {/* Eixo Y com valores inteiros */}
              <div
                aria-hidden="true"
                className="relative h-64 select-none text-right text-xs font-medium text-muted-foreground"
              >
                {ticks.map((tick) => {
                  const yPercent = 92 - ((tick - min) / (max - min || 1)) * 84;
                  return (
                    <span
                      key={tick}
                      className="absolute right-1 -translate-y-1/2 tabular-nums"
                      style={{ top: `${yPercent}%` }}
                    >
                      {tick}
                    </span>
                  );
                })}
              </div>

              {/* Área de plotagem */}
              <div
                className="relative h-64 w-full select-none"
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Linhas horizontais tracejadas de referência */}
                {ticks.map((tick) => {
                  const yPercent = 92 - ((tick - min) / (max - min || 1)) * 84;
                  return (
                    <div
                      key={tick}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/70"
                      style={{ top: `${yPercent}%` }}
                    />
                  );
                })}

                {/* Curvas suaves em SVG */}
                <svg
                  role="img"
                  aria-label={title}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                >
                  {seriesPoints.map((item) => {
                    const pathData = buildSmoothLinePath(item.coords);
                    return (
                      <path
                        key={item.key}
                        d={pathData}
                        fill="none"
                        stroke={item.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={dotted || data.length === 1 ? "4 3" : undefined}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </svg>

                {/* Linha vertical guia ao passar o mouse */}
                {activePointInfo && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-[6%] w-px -translate-x-1/2 bg-foreground/20"
                    style={{ left: `${activePointInfo.x}%` }}
                  />
                )}

                {/* Marcadores circulares nos pontos */}
                {seriesPoints.map((serie, serieIdx) =>
                  serie.coords.map((point, index) => {
                    const isHovered =
                      hoveredPoint?.index === index &&
                      (!hoveredPoint.seriesKey || hoveredPoint.seriesKey === serie.key);

                    // Verifica se outra série anterior tem exatamente o mesmo valor neste mês
                    const hasOverlap = seriesPoints
                      .slice(0, serieIdx)
                      .some((prev) => prev.coords[index]?.value === point.value);

                    return (
                      <button
                        key={`${serie.key}-${index}`}
                        type="button"
                        aria-label={`${formatTooltipMonth(data[index].date)} - ${serie.label}: ${formatProjectCount(point.value)}`}
                        onMouseEnter={() => setHoveredPoint({ index, seriesKey: serie.key })}
                        onFocus={() => setHoveredPoint({ index, seriesKey: serie.key })}
                        onBlur={() => setHoveredPoint(null)}
                        className={cn(
                          "group absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1.5 focus:outline-none",
                          isHovered ? "z-20" : "z-10",
                        )}
                        style={{
                          left: `${point.x}%`,
                          top: `${point.y}%`,
                        }}
                      >
                        <span
                          className={cn(
                            "block rounded-full border-2 border-white shadow-sm transition-transform duration-150 dark:border-sage-green-50",
                            hasOverlap ? "size-2.5" : "size-3",
                            isHovered && "scale-125 ring-4 ring-foreground/15",
                          )}
                          style={{ backgroundColor: serie.color }}
                        />
                      </button>
                    );
                  }),
                )}

                {/* Tooltip flutuante estilo card claro */}
                {activePointInfo && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full pb-2.5 transition-all duration-100"
                    style={{
                      left: `${Math.min(88, Math.max(12, activePointInfo.x))}%`,
                      top: `${Math.max(14, activePointInfo.y)}%`,
                    }}
                  >
                    <div className="relative min-w-44 rounded-lg border border-sage-green-200 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-lg">
                      <p className="mb-1! font-semibold text-slate-700">
                        {formatTooltipMonth(activePointInfo.date)}
                      </p>
                      <div className="space-y-1">
                        {activePointInfo.items.map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="flex items-center gap-1.5 text-slate-600">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              {item.label}:
                            </span>
                            <strong className="font-semibold tabular-nums text-slate-900">
                              {formatProjectCount(item.value)}
                            </strong>
                          </div>
                        ))}
                      </div>
                      <span
                        aria-hidden="true"
                        className="absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Eixo X com meses */}
            <div className="grid grid-cols-[2.25rem_1fr] gap-2">
              <div />
              <div className="relative h-6 w-full select-none text-[11px] font-medium tracking-wider text-muted-foreground">
                {data.map((row, index) => {
                  const isFirst = index === 0;
                  const isLast = index === data.length - 1;
                  const shouldShow =
                    data.length <= 12 ||
                    isFirst ||
                    isLast ||
                    (index % labelStep === 0 && data.length - 1 - index >= Math.floor(labelStep / 2));

                  if (!shouldShow) return null;

                  const x = data.length <= 1 ? 50 : 4 + (index / (data.length - 1)) * 92;
                  return (
                    <span
                      key={row.date.toISOString()}
                      className="absolute top-1 -translate-x-1/2 whitespace-nowrap uppercase"
                      style={{ left: `${x}%` }}
                    >
                      {formatChartDate(row.date, "pt-BR", includeYearInAxis)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid h-64 place-items-center rounded-lg border border-dashed border-border/60 p-6 text-center">
            <p className="mb-0! text-sm text-muted-foreground">
              Nenhum projeto cadastrado para exibir o histórico mensal.
            </p>
          </div>
        )}
      </CardContent>

      {(footerTitle || footerDescription) && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          {footerTitle && <strong>{footerTitle} ↗</strong>}
          {footerDescription && <span className="text-muted-foreground">{footerDescription}</span>}
        </CardFooter>
      )}
    </Card>
  );
}

function donutArcPath(start: number, end: number, outerRadius: number, innerRadius: number) {
  const outerStart = [50 + outerRadius * Math.cos(start), 50 + outerRadius * Math.sin(start)];
  const outerEnd = [50 + outerRadius * Math.cos(end), 50 + outerRadius * Math.sin(end)];
  const innerEnd = [50 + innerRadius * Math.cos(end), 50 + innerRadius * Math.sin(end)];
  const innerStart = [50 + innerRadius * Math.cos(start), 50 + innerRadius * Math.sin(start)];
  const largeArc = end - start > Math.PI ? 1 : 0;

  return [
    `M ${outerStart[0]} ${outerStart[1]}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd[0]} ${outerEnd[1]}`,
    `L ${innerEnd[0]} ${innerEnd[1]}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart[0]} ${innerStart[1]}`,
    "Z",
  ].join(" ");
}

export function PieChart({
  title,
  description,
  slices,
  totalLabel = "Total de projetos",
  emptySliceNote,
  footerTitle,
  footerDescription,
  className,
}: PieChartProps) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const sanitizedSlices = slices.map((slice) => ({
    ...slice,
    value: Math.max(0, Number(slice.value) || 0),
  }));
  const total = sanitizedSlices.reduce((sum, slice) => sum + slice.value, 0);

  const arcs = sanitizedSlices
    .filter((slice) => slice.value > 0)
    .reduce<{
      cursor: number;
      items: Array<{
        label: string;
        value: number;
        percentage: number;
        color: string;
        start: number;
        end: number;
        midAngle: number;
      }>;
    }>(
      (result, slice) => {
        const angle = (slice.value / total) * Math.PI * 2;
        const start = result.cursor;
        const end = start + angle;
        const percentage = Math.round((slice.value / total) * 100);
        return {
          cursor: end,
          items: [
            ...result.items,
            {
              ...slice,
              percentage,
              start,
              end,
              midAngle: start + angle / 2,
            },
          ],
        };
      },
      { cursor: -Math.PI / 2, items: [] },
    ).items;

  const hoveredSlice = hoveredLabel
    ? sanitizedSlices.find((s) => s.label === hoveredLabel) ?? null
    : null;
  const hoveredPercentage =
    hoveredSlice && total > 0 ? Math.round((hoveredSlice.value / total) * 100) : 0;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription className="mt-1">{description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-6 pt-2">
        {total > 0 ? (
          <>
            <div className="grid items-center gap-6 sm:grid-cols-[minmax(150px,180px)_1fr]">
              {/* Gráfico de Rosca (Donut Chart) com total central e tooltip */}
              <div
                className="relative mx-auto aspect-square w-44 sm:w-44"
                onMouseLeave={() => setHoveredLabel(null)}
              >
                <svg
                  role="img"
                  aria-label={`${title}: ${sanitizedSlices
                    .map((slice) => `${slice.label}: ${slice.value}`)
                    .join(", ")}`}
                  viewBox="0 0 100 100"
                  className="h-full w-full overflow-visible"
                >
                  {/* Trilha circular de fundo */}
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="none"
                    className="stroke-muted/60"
                    strokeWidth="14"
                  />

                  {arcs.map((slice) => {
                    const isHovered = hoveredLabel === slice.label;
                    if (slice.value === total) {
                      return (
                        <circle
                          key={slice.label}
                          cx="50"
                          cy="50"
                          r="36"
                          fill="none"
                          stroke={slice.color}
                          strokeWidth={isHovered ? "15.5" : "14"}
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredLabel(slice.label)}
                        />
                      );
                    }
                    return (
                      <path
                        key={slice.label}
                        d={donutArcPath(
                          slice.start,
                          slice.end,
                          isHovered ? 44.5 : 43,
                          isHovered ? 28.5 : 29,
                        )}
                        fill={slice.color}
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => setHoveredLabel(slice.label)}
                      />
                    );
                  })}
                </svg>

                {/* Valor total centralizado na rosca */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {totalLabel}
                  </span>
                  <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                    {total.toLocaleString("pt-BR")}
                  </span>
                </div>

                {/* Tooltip flutuante ao passar o mouse na rosca ou legenda */}
                {hoveredSlice && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full"
                  >
                    <div className="relative rounded-lg border border-sage-green-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-lg whitespace-nowrap">
                      <div className="font-bold tabular-nums">{hoveredPercentage}%</div>
                      <div className="text-[11px] text-slate-600">
                        {formatProjectCount(hoveredSlice.value)} · {hoveredSlice.label}
                      </div>
                      <span
                        aria-hidden="true"
                        className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Lista lateral com cores, quantidades e porcentagens */}
              <div className="space-y-3">
                {sanitizedSlices.map((slice) => {
                  const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
                  const isHovered = hoveredLabel === slice.label;
                  return (
                    <div
                      key={slice.label}
                      onMouseEnter={() => setHoveredLabel(slice.label)}
                      onMouseLeave={() => setHoveredLabel(null)}
                      className={cn(
                        "flex cursor-default items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors",
                        isHovered ? "border-border bg-muted/50" : "hover:bg-muted/30",
                      )}
                    >
                      <span className="flex items-center gap-2.5 font-medium">
                        <span
                          className="size-3.5 shrink-0 rounded-sm shadow-xs"
                          style={{ backgroundColor: slice.color }}
                        />
                        {slice.label}
                      </span>
                      <div className="flex items-center gap-2.5 tabular-nums">
                        <span className="text-xs text-muted-foreground">
                          {formatProjectCount(slice.value)}
                        </span>
                        <span className="min-w-10 text-right font-semibold text-foreground">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rodapé informativo de resumo */}
            <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-xs">
              {sanitizedSlices.map((slice) => (
                <div key={slice.label} className="space-y-0.5">
                  <span className="text-muted-foreground">{slice.label}</span>
                  <div className="text-sm font-semibold tabular-nums text-foreground">
                    {formatProjectCount(slice.value)}
                  </div>
                </div>
              ))}
              {emptySliceNote && (
                <p className="col-span-2 mb-0! pt-1 text-xs text-muted-foreground">
                  {emptySliceNote}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 p-6 text-center">
            <div className="grid size-24 place-items-center rounded-full border-8 border-dashed border-muted text-lg font-bold text-muted-foreground">
              0
            </div>
            <p className="mb-0! text-sm text-muted-foreground">
              Sem dados para exibir. Nenhum projeto cadastrado no momento.
            </p>
          </div>
        )}
      </CardContent>

      {(footerTitle || footerDescription) && (
        <CardFooter className="flex-col gap-1 text-sm">
          {footerTitle && <strong>{footerTitle} ↗</strong>}
          {footerDescription && <span className="text-muted-foreground">{footerDescription}</span>}
        </CardFooter>
      )}
    </Card>
  );
}

export function MetricCard({ title, value, description, className }: { title: string; value: React.ReactNode; description?: string; className?: string }) {
  return <Card className={className}><CardHeader><CardDescription>{title}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader></Card>;
}

