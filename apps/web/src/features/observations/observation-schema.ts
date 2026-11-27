import { isValidGeoJSON } from "@/lib/geojson";
import type { MonitoringPeriod } from "@/lib/types";

export { isValidGeoJSON } from "@/lib/geojson";

export function validateObservation(value: {
  indicator_id?: string | number;
  value?: string | number;
  period_id?: string;
  date?: string | Date;
  position?: unknown;
},periods: MonitoringPeriod[] = [],
) 
{
  const errors: string[] = [];
  if (value.value !== undefined && String(value.value).trim() !== "" && !Number.isFinite(Number(value.value))) {
    errors.push("Valor deve ser um número.");
  }
  if (value.date && !Number.isFinite(new Date(value.date).getTime())) {
    errors.push("Data deve ser válida.");
  }
  if (value.position != null && value.position !== "" && !isValidGeoJSON(value.position)) {
    errors.push("Posição deve conter GeoJSON válido.");
  }

  const period = value.period_id ? periods.find((item) => item.id === value.period_id) : undefined;
  if (period && value.date) {
    const date = new Date(value.date);
    if (Number.isFinite(date.getTime()) && (date < new Date(period.startDate) || date > new Date(period.endDate))) {
      errors.push("A data está fora do período escolhido.");
    }
  }
  return errors;
}
