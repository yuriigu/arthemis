"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  addProjectProponents,
  ApiError,
  createActivities,
  createIndicators,
  createLocations,
  createProject,
  deleteProject,
  requireAuthToken,
  requiredFormString,
  requireUuid,
  transitionProject,
} from "@/lib/api/server";
import type { ProjectActionState } from "@/lib/types";
import { createMonitoringPeriod, verifyMonitoringPeriod } from "@/lib/api/server";

interface SubmittedProject {
  name: string;
  proponent_id: string;
  lifetime_start: string;
  lifetime_end: string;
  justification: string;
  project_proponents: Array<{ proponent_id: string; role: string }>;
  project_sdgs: string[];
  locations: Array<{
    id: string;
    ecosystem: string;
    ecosystemCode: string;
    extent_ha: number | string;
    country: string;
    position: unknown;
  }>;
  activities: Array<{
    id: string;
    name: string;
    description: string;
    justification: string;
    location_ids: string[];
  }>;
  indicators: Array<{
    location_id: string;
    activity_id: string;
    name: string;
    unit: string;
    value_baseline: number | string;
    value_reference: number | string;
    observation_method: string;
    justification: string;
    component: string;
    direction: string;
    threshold: string;
    referenceSource: string;
  }>;
}

function parseProject(formData: FormData): SubmittedProject {
  const serialized = requiredFormString(formData, "project_data");
  const value: unknown = JSON.parse(serialized);
  if (typeof value !== "object" || value === null) {
    throw new Error("Os dados do projeto são inválidos.");
  }

  const data = value as Partial<SubmittedProject>;
  if (typeof data.proponent_id !== "string" || !data.proponent_id.trim()) {
    throw new Error("Selecione a organização responsável pelo projeto.");
  }

  const lifetimeStart = typeof data.lifetime_start === "string" ? data.lifetime_start : "";
  const lifetimeEnd = typeof data.lifetime_end === "string" ? data.lifetime_end : "";
  if (lifetimeStart && !Number.isFinite(Date.parse(lifetimeStart))) {
    throw new Error("Informe uma data de início válida para a vigência do projeto.");
  }
  if (lifetimeEnd && !Number.isFinite(Date.parse(lifetimeEnd))) {
    throw new Error("Informe uma data de término válida para a vigência do projeto.");
  }
  if (lifetimeStart && lifetimeEnd && Date.parse(lifetimeEnd) < Date.parse(lifetimeStart)) {
    throw new Error("A data de término deve ser posterior à data de início.");
  }

  return {
    name: typeof data.name === "string" ? data.name : "",
    proponent_id: data.proponent_id,
    lifetime_start: lifetimeStart,
    lifetime_end: lifetimeEnd,
    justification: typeof data.justification === "string" ? data.justification : "",
    project_proponents: Array.isArray(data.project_proponents) ? data.project_proponents : [],
    project_sdgs: Array.isArray(data.project_sdgs) ? data.project_sdgs : [],
    locations: Array.isArray(data.locations) ? data.locations : [],
    activities: Array.isArray(data.activities) ? data.activities : [],
    indicators: Array.isArray(data.indicators) ? data.indicators : [],
  };
}

function finiteNumber(value: number | string, field: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`O campo "${field}" deve ser numérico.`);
  return number;
}

async function performProjectCreation(formData: FormData): Promise<ProjectActionState> {
  const token = await requireAuthToken();
  const data = parseProject(formData);
  const proponentId = requireUuid(data.proponent_id, "organização");
  const sdgIds = data.project_sdgs.map((id) => requireUuid(id, "ODS"));

  const projectId = await createProject({
    proponentId,
    ...(data.name.trim() ? { name: data.name.trim() } : {}),
    ...(data.justification.trim() ? { justification: data.justification.trim() } : {}),
    ...(data.lifetime_start ? { lifetimeStart: data.lifetime_start } : {}),
    ...(data.lifetime_end ? { lifetimeEnd: data.lifetime_end } : {}),
    ...(sdgIds.length ? { sdgIds } : {}),
  }, token);
  requireUuid(projectId, "projeto criado");

  if (data.project_proponents.length) {
    const validProponents = data.project_proponents.filter((item) => item.proponent_id.trim());
    if (validProponents.length) {
      await addProjectProponents(projectId, validProponents.map((item) => ({
        proponentId: requireUuid(item.proponent_id, "organização relacionada"),
        role: item.role.trim(),
      })), token);
    }
  }

  const locationIds = data.locations.length
    ? await createLocations(data.locations.map((location) => ({
      projectId,
      ...(location.ecosystem.trim() ? { ecosystem: location.ecosystem.trim() } : {}),
      ...(location.ecosystemCode ? { ecosystemCode: location.ecosystemCode } : {}),
      ...(location.country.trim() ? { country: location.country.trim() } : {}),
      ...(String(location.extent_ha).trim() !== ""
        ? { extent: finiteNumber(location.extent_ha, "extensão") }
        : {}),
      ...(location.position && typeof location.position === "object"
        ? { position: location.position }
        : {}),
    })), token)
    : [];
  if (locationIds.length !== data.locations.length) {
    throw new Error("A API não retornou todos os IDs das localizações criadas.");
  }
  const locationIdsByFormId = new Map(
    data.locations.map((location, index) => [location.id, locationIds[index]]),
  );

  const activityIds = data.activities.length
    ? await createActivities(data.activities.map((activity) => ({
      projectId,
      ...(activity.name.trim() ? { name: activity.name.trim() } : {}),
      ...(activity.description.trim() ? { description: activity.description.trim() } : {}),
      ...(activity.justification.trim() ? { justification: activity.justification.trim() } : {}),
      locationIds: activity.location_ids
        .map((id) => locationIdsByFormId.get(id))
        .filter((id): id is string => Boolean(id)),
    })), token)
    : [];
  if (activityIds.length !== data.activities.length) {
    throw new Error("A API não retornou todos os IDs das atividades criadas.");
  }
  const activityIdsByFormId = new Map(
    data.activities.map((activity, index) => [activity.id, activityIds[index]]),
  );

  const validIndicators = data.indicators.filter((indicator) =>
    activityIdsByFormId.has(indicator.activity_id),
  );
  if (validIndicators.length) {
    await createIndicators(validIndicators.map((indicator) => {
      const activityId = activityIdsByFormId.get(indicator.activity_id)!;
      const locationId = indicator.location_id
        ? locationIdsByFormId.get(indicator.location_id)
        : undefined;
      return {
        activityId,
        ...(locationId ? { locationId } : {}),
        ...(indicator.name.trim() ? { name: indicator.name.trim() } : {}),
        ...(indicator.unit.trim() ? { unit: indicator.unit.trim() } : {}),
        ...(indicator.component ? { component: indicator.component } : {}),
        ...(indicator.direction ? { direction: indicator.direction } : {}),
        ...(indicator.threshold.trim()
          ? { threshold: Number(indicator.threshold) }
          : {}),
        ...(indicator.referenceSource.trim()
          ? { referenceSource: indicator.referenceSource.trim() }
          : {}),
        ...(String(indicator.value_baseline).trim() !== ""
          ? { valueBaseline: finiteNumber(indicator.value_baseline, "valor baseline") }
          : {}),
        ...(String(indicator.value_reference).trim() !== ""
          ? { valueReference: finiteNumber(indicator.value_reference, "valor de referência") }
          : {}),
        ...(indicator.observation_method.trim()
          ? { observationMethod: indicator.observation_method.trim() }
          : {}),
        ...(indicator.justification.trim()
          ? { justification: indicator.justification.trim() }
          : {}),
      };
    }), token);
  }

  revalidatePath("/projects");
  redirect("/projects?success=created");
}

export async function createProjectAction(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  try {
    return await performProjectCreation(formData);
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o projeto. Tente novamente.",
    };
  }
}

export async function deleteProjectAction(formData: FormData) {
  const token = await requireAuthToken();
  const id = requireUuid(requiredFormString(formData, "id"), "projeto");
  try {
    await deleteProject(id, token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) throw error;
    redirect("/projects?error=referenced");
  }
  revalidatePath("/projects");
  redirect("/projects?success=deleted");
}

export async function createPeriodAction(formData: FormData) {
  const token = await requireAuthToken();
  const projectId = requireUuid(requiredFormString(formData, "projectId"), "projeto");
  try {
    await createMonitoringPeriod(
      {
        projectId,
        startDate: requiredFormString(formData, "startDate"),
        endDate: requiredFormString(formData, "endDate"),
        yearT: Number(requiredFormString(formData, "yearT")),
      },
      token,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o período";
    redirect(`/projects/${projectId}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function verifyPeriodAction(formData: FormData) {
  const token = await requireAuthToken();
  const id = requireUuid(requiredFormString(formData, "id"), "período");
  const projectId = requireUuid(requiredFormString(formData, "projectId"), "projeto");
  await verifyMonitoringPeriod(id, token);
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}
 
 
export async function transitionProjectAction(formData: FormData) {
  const token = await requireAuthToken();
  const id = requireUuid(requiredFormString(formData, "id"), "projeto");
  const to = requiredFormString(formData, "to");

  try {
    await transitionProject(id, to, token);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível alterar o status";
    redirect(`/projects/${id}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}?success=status`);
}
