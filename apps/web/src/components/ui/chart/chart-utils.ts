import type { LineChartDataPoint, LineChartSeries } from "@/components/ui/chart";

export function getChartBounds(data: LineChartDataPoint[], series: LineChartSeries[]) {
  const values = data.flatMap((point) => series.map(({ key }) => Number(point[key])).filter(Number.isFinite));
  return { min: Math.min(0, ...values), max: Math.max(1, ...values) };
}

export function formatChartDate(value: Date, locale = "pt-BR") {
  return value.toLocaleDateString(locale, { month: "short", year: "numeric" });
}
