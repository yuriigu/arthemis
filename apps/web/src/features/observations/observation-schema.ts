import { isValidGeoJSON } from "@/lib/geojson";

export { isValidGeoJSON } from "@/lib/geojson";

export function validateObservation(value: {
  indicator_id: string | number;
  value: string | number;
  date: string | Date;
  position: unknown;
}) {
  const errors: string[] = [];
  if (String(value.indicator_id).trim().length === 0) errors.push("Selecione um indicador válido.");
  if (!Number.isFinite(Number(value.value))) errors.push("Valor deve ser um número.");
  if (!Number.isFinite(new Date(value.date).getTime())) errors.push("Data deve ser válida.");
  if (value.position != null && value.position !== "" && !isValidGeoJSON(value.position)) {
    errors.push("Posição deve conter GeoJSON válido.");
  }
  return errors;
}
