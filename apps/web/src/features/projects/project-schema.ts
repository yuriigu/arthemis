import type { ProjectFormData } from "./project-form";
import { isValidGeoJSON } from "@/lib/geojson";
import { isIucnEcosystemCode } from "./iucn-codes";

export type ProjectValidationErrors = Record<string, string[]>;

export function validateProject(value: ProjectFormData): ProjectValidationErrors {
  const errors: ProjectValidationErrors = {};
  const addError = (field: string, message: string) => {
    errors[field] = [...(errors[field] ?? []), message];
  };

  if (!value.proponent_id || value.proponent_id.trim().length === 0) {
    addError("proponent_id", "Selecione uma organização válida.");
  }

  const start = value.lifetime_start ? new Date(value.lifetime_start).getTime() : NaN;
  const end = value.lifetime_end ? new Date(value.lifetime_end).getTime() : NaN;
  if (value.lifetime_start && !Number.isFinite(start)) {
    addError("lifetime_start", "Informe uma data de início válida.");
  }
  if (value.lifetime_end && !Number.isFinite(end)) {
    addError("lifetime_end", "Informe uma data de término válida.");
  } else if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
    addError("lifetime_end", "A data de término deve ser posterior ao início.");
  }

  value.locations.forEach((location, index) => {
    if (location.ecosystemCode && !isIucnEcosystemCode(location.ecosystemCode)) {
      addError(
        `locations.${index}.ecosystemCode`,
        "Escolha um código IUCN da lista.",
      );
    }
    if (String(location.extent_ha).trim() !== "") {
      const extent = Number(location.extent_ha);
      if (!Number.isFinite(extent) || extent < 0.01) {
        addError(
          `locations.${index}.extent_ha`,
          "A área deve ser igual ou superior a 0,01 hectare.",
        );
      }
    }
    if (location.position != null && !isValidGeoJSON(location.position)) {
      addError(
        `locations.${index}.position`,
        "Envie um arquivo GeoJSON válido para esta localização.",
      );
    }
  });

  value.indicators.forEach((indicator, index) => {
    if (
      String(indicator.value_baseline).trim() !== "" &&
      !Number.isFinite(Number(indicator.value_baseline))
    ) {
      addError(
        `indicators.${index}.value_baseline`,
        "Informe um valor baseline numérico.",
      );
    }
    if (
      String(indicator.value_reference).trim() !== "" &&
      !Number.isFinite(Number(indicator.value_reference))
    ) {
      addError(
        `indicators.${index}.value_reference`,
        "Informe um valor de referência numérico.",
      );
    }
    if (
      indicator.component &&
      indicator.component !== "composition" &&
      indicator.component !== "structure"
    ) {
      addError(
        `indicators.${index}.component`,
        "Escolha o componente do indicador.",
      );
    }
    if (
      indicator.direction &&
      indicator.direction !== "increases_with_condition" &&
      indicator.direction !== "decreases_with_condition"
    ) {
      addError(
        `indicators.${index}.direction`,
        "Escolha a direção do indicador.",
      );
    }
    if (
      indicator.threshold.trim() &&
      !Number.isFinite(Number(indicator.threshold))
    ) {
      addError(
        `indicators.${index}.threshold`,
        "O limiar deve ser um número.",
      );
    }
  });

  return errors;
}
 