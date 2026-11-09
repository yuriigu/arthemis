import type { LineChartDataPoint, LineChartSeries } from "@/components/ui/chart";

export interface ProjectLifetimeRange {
  lifetimeStart: string | null;
  lifetimeEnd: string | null;
}

export function parseEndOfDayUtc(dateString: string | null): number {
  if (!dateString) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(dateString);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  const d = new Date(parsed);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999);
}

export function isProjectActiveAt(project: ProjectLifetimeRange, timestamp: number): boolean {
  const start = project.lifetimeStart
    ? Date.parse(project.lifetimeStart)
    : Number.NEGATIVE_INFINITY;
  const end = parseEndOfDayUtc(project.lifetimeEnd);
  return (
    (Number.isFinite(start) ? start : Number.NEGATIVE_INFINITY) <= timestamp &&
    end >= timestamp
  );
}

export function getChartBounds(data: LineChartDataPoint[], series: LineChartSeries[]) {
  const values = data.flatMap((point) => series.map(({ key }) => Number(point[key])).filter(Number.isFinite));
  const rawMax = Math.max(0, ...values);
  const step = rawMax <= 4 ? 1 : Math.ceil(rawMax / 4);
  const max = Math.max(3, Math.ceil((rawMax + (rawMax === 0 ? 3 : 0)) / step) * step);
  return { min: 0, max, step };
}

export function getIntegerTicks(max: number, step: number): number[] {
  const safeStep = Math.max(1, Math.round(step));
  const count = Math.max(1, Math.round(max / safeStep));
  return Array.from({ length: count + 1 }, (_, index) => index * safeStep);
}

export function formatChartDate(value: Date, locale = "pt-BR", includeYear = false) {
  const month = value
    .toLocaleDateString(locale, { month: "short", timeZone: "UTC" })
    .replace(/\.$/, "")
    .toUpperCase();
  if (!includeYear) return month;
  const shortYear = String(value.getUTCFullYear()).slice(-2);
  return `${month}/${shortYear}`;
}

export function formatTooltipMonth(value: Date, locale = "pt-BR") {
  const formatted = value.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Generates a smooth SVG path using Monotone Cubic Hermite interpolation
 * so curves look smooth like analytics charts without ever overshooting
 * or dipping below zero on flat segments.
 */
export function buildSmoothLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const [{ y }] = points;
    return `M 0 ${y} L 100 ${y}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  const n = points.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const slopes: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const deltaX = points[i + 1].x - points[i].x;
    const deltaY = points[i + 1].y - points[i].y;
    dx.push(deltaX);
    dy.push(deltaY);
    slopes.push(deltaX === 0 ? 0 : deltaY / deltaX);
  }

  const tangents: number[] = new Array(n).fill(0);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (slopes[i - 1] + slopes[i]) / 2;
    }
  }

  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / slopes[i];
      const beta = tangents[i + 1] / slopes[i];
      const hypot = Math.hypot(alpha, beta);
      if (hypot > 3) {
        const tau = 3 / hypot;
        tangents[i] = tau * alpha * slopes[i];
        tangents[i + 1] = tau * beta * slopes[i];
      }
    }
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const seg = dx[i] / 3;
    const cp1x = p0.x + seg;
    const cp1y = p0.y + tangents[i] * seg;
    const cp2x = p1.x - seg;
    const cp2y = p1.y - tangents[i + 1] * seg;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  return path;
}

