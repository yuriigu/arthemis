import { isValidGeoJSON } from "@/lib/geojson";
import type { MonitoringPeriod } from "@/lib/types";

export { isValidGeoJSON } from "@/lib/geojson";

export function validateObservation(value: {
  indicator_id: string | number;
  value: string | number;
  period_id?: string;
  date: string | Date;
  position: unknown;
},periods: MonitoringPeriod[] = [],
) 
{
  const errors: string[] = [];
  if (String(value.indicator_id).trim().length === 0) errors.push("Selecione um indicador válido.");
  if (!Number.isFinite(Number(value.value))) errors.push("Valor deve ser um número.");
  if (!Number.isFinite(new Date(value.date).getTime())) errors.push("Data deve ser válida.");
  if (value.position != null && value.position !== "" && !isValidGeoJSON(value.position)) {
    errors.push("Posição deve conter GeoJSON válido.");
  }
  if (!value.period_id?.trim()) {
  errors.push("Selecione um período de monitoramento.");
}

const period = periods.find((item) => item.id === value.period_id);
if (period && value.date) {
  const date = new Date(value.date);
  if (date < new Date(period.startDate) || date > new Date(period.endDate)) {
    errors.push("A data está fora do período escolhido.");
  }
}
  return errors;
}
