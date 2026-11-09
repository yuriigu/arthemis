import type { ProjectFormData } from "./project-form";
import { isValidGeoJSON } from "@/lib/geojson";

export function validateProject(value: ProjectFormData) {
  const errors: string[] = [];
  if (!value.proponent_id) errors.push("Selecione uma organização válida.");
  if (value.name.trim().length < 2 || value.name.length > 150) errors.push("O nome deve ter entre 2 e 150 caracteres.");
  if (!value.lifetime_start || !value.lifetime_end || new Date(value.lifetime_start) > new Date(value.lifetime_end)) errors.push("Informe um período de vigência válido.");
  if (value.justification.trim().length < 10) errors.push("A justificativa deve ter pelo menos 10 caracteres.");
  if (!value.project_sdgs.length) errors.push("O projeto deve conter pelo menos um ODS.");
  if (value.project_proponents.some((proponent) => !proponent.proponent_id || proponent.role.trim().length < 5)) errors.push("Verifique as organizações vinculadas ao projeto.");
  if (!value.locations.length || !value.activities.length || !value.indicators.length) errors.push("Adicione ao menos uma localização, atividade e indicador.");
  for (const location of value.locations) {
    if (location.ecosystem.trim().length < 2 || location.country.trim().length < 2 || Number(location.extent_ha) < 0.01 || !isValidGeoJSON(location.position)) errors.push("Verifique os dados e o GeoJSON de cada localização.");
  }
  for (const activity of value.activities) {
    if (activity.name.trim().length < 2 || activity.description.trim().length < 5 || activity.justification.trim().length < 5 || activity.location_ids.length < 1) errors.push("Complete os dados de cada atividade e vincule ao menos um local.");
  }
  for (const indicator of value.indicators) {
    if (!indicator.location_id || !indicator.activity_id || indicator.name.trim().length < 2 || !indicator.unit || indicator.observation_method.trim().length < 10 || indicator.justification.trim().length < 10 || !Number.isFinite(Number(indicator.value_baseline)) || !Number.isFinite(Number(indicator.value_reference))) errors.push("Complete os dados e vínculos de cada indicador.");
  }
  const locationIds = new Set(value.indicators.map((indicator) => indicator.location_id));
  const activityIds = new Set(value.indicators.map((indicator) => indicator.activity_id));
  if (value.locations.some((location) => !locationIds.has(location.id))) errors.push("Cada localização deve estar vinculada a um indicador.");
  if (value.activities.some((activity) => !activityIds.has(activity.id))) errors.push("Cada atividade deve estar vinculada a um indicador.");
  return [...new Set(errors)];
}
