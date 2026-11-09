"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createObservations,
  deleteObservation,
  requireAuthToken,
  requiredFormString,
  requireUuid,
  updateObservation,
} from "@/lib/api/server";
import { isValidGeoJSON } from "@/lib/geojson";

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
