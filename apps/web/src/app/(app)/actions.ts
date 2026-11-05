"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addProjectProponents,
  createActivities,
  createIndicators,
  createLocations,
  createObservations,
  createOrganization,
  createProject,
  createUser,
  deleteObservation,
  deleteOrganization,
  deleteProject,
  deleteUser,
  updateOrganization,
  updateObservation,
  updateUser,
  type UserRole,
} from "@/lib/api/server";
import {
  requireAuthToken,
  requiredFormString,
  requireUuid,
} from "@/lib/api/server";
import { isValidGeoJSON } from "@/components/ui/form/ObservationFormSchema";

function isUserRole(role: string): role is UserRole {
  return role === "admin" || role === "manager" || role === "visitor";
}

export async function createOrganizationAction(formData: FormData) {
  const token = await requireAuthToken();
  await createOrganization({
    name: requiredFormString(formData, "name"),
    email: requiredFormString(formData, "email"),
  }, token);
  revalidatePath("/organizations");
  redirect("/organizations?success=created");
}

export async function updateOrganizationAction(formData: FormData) {
  const token = await requireAuthToken();
  const id = requireUuid(requiredFormString(formData, "id"), "organização");
  await updateOrganization(id, {
    name: requiredFormString(formData, "name"),
    email: requiredFormString(formData, "email"),
  }, token);
  revalidatePath("/organizations");
  redirect("/organizations?success=updated");
}

export async function deleteOrganizationAction(formData: FormData) {
  const token = await requireAuthToken();
  const id = requireUuid(requiredFormString(formData, "id"), "organização");
  await deleteOrganization(id, token);
  revalidatePath("/organizations");
  redirect("/organizations?success=deleted");
}

export async function createUserAction(formData: FormData) {
  const token = await requireAuthToken();
  const role = requiredFormString(formData, "role");
  if (!isUserRole(role)) {
    throw new Error("O perfil selecionado é inválido.");
  }

  await createUser({
    proponentId: requireUuid(requiredFormString(formData, "proponent_id"), "organização"),
    username: requiredFormString(formData, "username"),
    email: requiredFormString(formData, "email"),
    password: requiredFormString(formData, "password"),
    role,
  }, token);
  revalidatePath("/users");
  redirect("/users?success=created");
}

export async function updateUserAction(formData: FormData) {
  const token = await requireAuthToken();
  const id = requireUuid(requiredFormString(formData, "id"), "usuário");
  const role = requiredFormString(formData, "role");
  if (!isUserRole(role)) {
    throw new Error("O perfil selecionado é inválido.");
  }

  await updateUser(id, {
    proponentId: requireUuid(requiredFormString(formData, "proponent_id"), "organização"),
    username: requiredFormString(formData, "username"),
    email: requiredFormString(formData, "email"),
    role,
  }, token);
  revalidatePath("/users");
  redirect("/users?success=updated");
}

export async function deleteUserAction(formData: FormData) {
  const token = await requireAuthToken();
  const id = requireUuid(requiredFormString(formData, "id"), "usuário");
  await deleteUser(id, token);
  revalidatePath("/users");
  redirect("/users?success=deleted");
}

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
  }>;
}

function parseProject(formData: FormData): SubmittedProject {
  const serialized = requiredFormString(formData, "project_data");
  const value: unknown = JSON.parse(serialized);
  if (typeof value !== "object" || value === null) {
    throw new Error("Os dados do projeto são inválidos.");
  }

  const data = value as Partial<SubmittedProject>;
  if (
    typeof data.name !== "string" ||
    typeof data.proponent_id !== "string" ||
    typeof data.lifetime_start !== "string" ||
    typeof data.lifetime_end !== "string" ||
    typeof data.justification !== "string" ||
    !Array.isArray(data.project_proponents) ||
    !Array.isArray(data.project_sdgs) ||
    !Array.isArray(data.locations) ||
    !Array.isArray(data.activities) ||
    !Array.isArray(data.indicators)
  ) {
    throw new Error("Os dados enviados para o projeto estão incompletos.");
  }
  if (!Number.isFinite(Date.parse(data.lifetime_start)) || !Number.isFinite(Date.parse(data.lifetime_end))) {
    throw new Error("Informe datas válidas para a vigência do projeto.");
  }
  if (Date.parse(data.lifetime_end) < Date.parse(data.lifetime_start)) {
    throw new Error("A data de término deve ser posterior à data de início.");
  }

  return data as SubmittedProject;
}

function finiteNumber(value: number | string, field: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`O campo "${field}" deve ser numérico.`);
  return number;
}

export async function createProjectAction(formData: FormData) {
  const token = await requireAuthToken();
  const data = parseProject(formData);
  const proponentId = requireUuid(data.proponent_id, "organização");
  const sdgIds = data.project_sdgs.map((id) => requireUuid(id, "ODS"));

  const projectId = await createProject({
    proponentId,
    name: data.name.trim(),
    justification: data.justification.trim(),
    lifetimeStart: data.lifetime_start,
    lifetimeEnd: data.lifetime_end,
    sdgIds,
  }, token);
  requireUuid(projectId, "projeto criado");

  if (data.project_proponents.length) {
    await addProjectProponents(projectId, data.project_proponents.map((item) => ({
      proponentId: requireUuid(item.proponent_id, "organização relacionada"),
      role: item.role.trim(),
    })), token);
  }

  const locationIds = data.locations.length
    ? await createLocations(data.locations.map((location) => ({
      projectId,
      ecosystem: location.ecosystem.trim(),
      country: location.country.trim(),
      extent: finiteNumber(location.extent_ha, "extensão"),
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
      name: activity.name.trim(),
      description: activity.description.trim(),
      justification: activity.justification.trim(),
      locationIds: activity.location_ids.map((id) => {
        const locationId = locationIdsByFormId.get(id);
        if (!locationId) throw new Error("Uma atividade referencia uma localização inválida.");
        return locationId;
      }),
    })), token)
    : [];
  if (activityIds.length !== data.activities.length) {
    throw new Error("A API não retornou todos os IDs das atividades criadas.");
  }
  const activityIdsByFormId = new Map(
    data.activities.map((activity, index) => [activity.id, activityIds[index]]),
  );

  if (data.indicators.length) {
    await createIndicators(data.indicators.map((indicator) => {
      const activityId = activityIdsByFormId.get(indicator.activity_id);
      const locationId = locationIdsByFormId.get(indicator.location_id);
      if (!activityId || !locationId) {
        throw new Error("Um indicador referencia uma atividade ou localização inválida.");
      }
      return {
        activityId,
        locationId,
        name: indicator.name.trim(),
        unit: indicator.unit.trim(),
        valueBaseline: finiteNumber(indicator.value_baseline, "valor baseline"),
        valueReference: finiteNumber(indicator.value_reference, "valor de referência"),
        observationMethod: indicator.observation_method.trim(),
        justification: indicator.justification.trim(),
      };
    }), token);
  }

  revalidatePath("/projects");
  redirect("/projects?success=created");
}

export async function deleteProjectAction(formData: FormData) {
  const token = await requireAuthToken();
  const id = requireUuid(requiredFormString(formData, "id"), "projeto");
  await deleteProject(id, token);
  revalidatePath("/projects");
  redirect("/projects?success=deleted");
}

function parseObservationPosition(formData: FormData) {
  const serialized = formData.get("position");
  if (typeof serialized !== "string" || !serialized.trim()) return undefined;
  const position: unknown = JSON.parse(serialized);
  if (!isValidGeoJSON(position)) {
    throw new Error("A posição deve conter um GeoJSON válido.");
  }
  return position;
}

function observationInput(formData: FormData) {
  const date = requiredFormString(formData, "date");
  if (!Number.isFinite(Date.parse(date))) {
    throw new Error("Informe uma data válida para a observação.");
  }
  const value = Number(requiredFormString(formData, "value"));
  if (!Number.isFinite(value)) {
    throw new Error("O valor da observação deve ser numérico.");
  }

  const position = parseObservationPosition(formData);
  return {
    indicatorId: requireUuid(requiredFormString(formData, "indicator_id"), "indicador"),
    value,
    date,
    ...(position === undefined ? {} : { position }),
  };
}

export async function createObservationAction(formData: FormData) {
  const token = await requireAuthToken();
  const ids = await createObservations([observationInput(formData)], token);
  if (ids.length !== 1) {
    throw new Error("A API não confirmou a criação da observação.");
  }
  revalidatePath("/observations");
  revalidatePath("/search");
  redirect("/observations?success=created");
}

export async function updateObservationAction(formData: FormData) {
  const token = await requireAuthToken();
  const id = requireUuid(requiredFormString(formData, "id"), "observação");
  await updateObservation(id, observationInput(formData), token);
  revalidatePath("/observations");
  revalidatePath("/search");
  revalidatePath("/projects");
  redirect("/observations?success=updated");
}

export async function deleteObservationAction(formData: FormData) {
  const token = await requireAuthToken();
  const id = requireUuid(requiredFormString(formData, "id"), "observação");
  await deleteObservation(id, token);
  revalidatePath("/observations");
  revalidatePath("/search");
  revalidatePath("/projects");
  redirect("/observations?success=deleted");
}
