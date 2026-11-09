"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ApiError,
  createOrganization,
  deleteOrganization,
  requireAuthToken,
  requiredFormString,
  requireUuid,
  updateOrganization,
} from "@/lib/api/server";

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
  try {
    await deleteOrganization(id, token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) throw error;
    redirect("/organizations?error=referenced");
  }
  revalidatePath("/organizations");
  redirect("/organizations?success=deleted");
}
