import type { ProjectFormData } from "./project-form";
import { isValidGeoJSON } from "@/lib/geojson";

export type ProjectValidationErrors = Record<string, string[]>;

export function validateProject(value: ProjectFormData): ProjectValidationErrors {
  const errors: ProjectValidationErrors = {};
  const addError = (field: string, message: string) => {
    errors[field] = [...(errors[field] ?? []), message];
  };

  if (!value.proponent_id) {
    addError("proponent_id", "Selecione uma organização válida.");
  }
  if (value.name.trim().length < 2 || value.name.length > 150) {
    addError("name", "O nome deve ter entre 2 e 150 caracteres.");
  }

  const start = new Date(value.lifetime_start).getTime();
  const end = new Date(value.lifetime_end).getTime();
  if (!Number.isFinite(start)) {
    addError("lifetime_start", "Informe uma data de início válida.");
  }
  if (!Number.isFinite(end)) {
    addError("lifetime_end", "Informe uma data de término válida.");
  } else if (Number.isFinite(start) && end < start) {
    addError("lifetime_end", "A data de término deve ser posterior ao início.");
  }

  if (value.justification.trim().length < 10) {
    addError("justification", "A justificativa deve ter pelo menos 10 caracteres.");
  }
  if (!value.project_sdgs.length) {
    addError("project_sdgs", "Selecione pelo menos um ODS.");
  }

  value.project_proponents.forEach((proponent, index) => {
    if (!proponent.proponent_id) {
      addError(
        `project_proponents.${index}.proponent_id`,
        "Selecione a organização vinculada.",
      );
    }
    if (proponent.role.trim().length < 5) {
      addError(
        `project_proponents.${index}.role`,
        "Informe uma função com pelo menos 5 caracteres.",
      );
    }
  });

  if (!value.locations.length) {
    addError("locations", "Adicione ao menos uma localização.");
  }
  value.locations.forEach((location, index) => {
    if (location.ecosystem.trim().length < 2) {
      addError(
        `locations.${index}.ecosystem`,
        "Informe um ecossistema com pelo menos 2 caracteres.",
      );
    }
    if (location.country.trim().length < 2) {
      addError(
        `locations.${index}.country`,
        "Informe um país com pelo menos 2 caracteres.",
      );
    }
    const extent = Number(location.extent_ha);
    if (!Number.isFinite(extent) || extent < 0.01) {
      addError(
        `locations.${index}.extent_ha`,
        "A área deve ser igual ou superior a 0,01 hectare.",
      );
    }
    if (!isValidGeoJSON(location.position)) {
      addError(
        `locations.${index}.position`,
        "Envie um arquivo GeoJSON válido para esta localização.",
      );
    }
    if (!value.indicators.some((indicator) => indicator.location_id === location.id)) {
      addError(
        `locations.${index}.ecosystem`,
        "Vincule esta localização a pelo menos um indicador.",
      );
    }
  });

  if (!value.activities.length) {
    addError("activities", "Adicione ao menos uma atividade.");
  }
  value.activities.forEach((activity, index) => {
    if (activity.name.trim().length < 2) {
      addError(
        `activities.${index}.name`,
        "O nome deve ter pelo menos 2 caracteres.",
      );
    }
    if (activity.description.trim().length < 5) {
      addError(
        `activities.${index}.description`,
        "A descrição deve ter pelo menos 5 caracteres.",
      );
    }
    if (activity.justification.trim().length < 5) {
      addError(
        `activities.${index}.justification`,
        "A justificativa deve ter pelo menos 5 caracteres.",
      );
    }
    if (!activity.location_ids.length) {
      addError(
        `activities.${index}.location_ids`,
        "Vincule pelo menos uma localização à atividade.",
      );
    }
    if (!value.indicators.some((indicator) => indicator.activity_id === activity.id)) {
      addError(
        `activities.${index}.name`,
        "Vincule esta atividade a pelo menos um indicador.",
      );
    }
  });

  if (!value.indicators.length) {
    addError("indicators", "Adicione ao menos um indicador.");
  }
  value.indicators.forEach((indicator, index) => {
    if (!value.locations.some((location) => location.id === indicator.location_id)) {
      addError(
        `indicators.${index}.location_id`,
        "Selecione uma localização válida.",
      );
    }
    if (!value.activities.some((activity) => activity.id === indicator.activity_id)) {
      addError(
        `indicators.${index}.activity_id`,
        "Selecione uma atividade válida.",
      );
    }
    if (indicator.name.trim().length < 2) {
      addError(`indicators.${index}.name`, "O nome deve ter pelo menos 2 caracteres.");
    }
    if (!indicator.unit.trim()) {
      addError(`indicators.${index}.unit`, "Informe a unidade do indicador.");
    }
    if (!Number.isFinite(Number(indicator.value_baseline))) {
      addError(
        `indicators.${index}.value_baseline`,
        "Informe um valor baseline numérico.",
      );
    }
    if (!Number.isFinite(Number(indicator.value_reference))) {
      addError(
        `indicators.${index}.value_reference`,
        "Informe um valor de referência numérico.",
      );
    }
    if (indicator.observation_method.trim().length < 10) {
      addError(
        `indicators.${index}.observation_method`,
        "O método deve ter pelo menos 10 caracteres.",
      );
    }
    if (indicator.justification.trim().length < 10) {
      addError(
        `indicators.${index}.justification`,
        "A justificativa deve ter pelo menos 10 caracteres.",
      );
    }
  });

  return errors;
}
