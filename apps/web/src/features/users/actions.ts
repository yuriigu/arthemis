"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createUser,
  deleteUser,
  requireAuthToken,
  requiredFormString,
  requireUuid,
  updateUser,
  type UserRole,
} from "@/lib/api/server";

function isUserRole(role: string): role is UserRole {
  return role === "admin" || role === "manager" || role === "visitor";
}

export async function createUserAction(formData: FormData) {
  const token = await requireAuthToken();
  const role = requiredFormString(formData, "role");
  if (!isUserRole(role)) throw new Error("O perfil selecionado é inválido.");

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
  if (!isUserRole(role)) throw new Error("O perfil selecionado é inválido.");

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
