"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName, loginAuthUser } from "@/lib/api/server";

export async function loginAction(formData: FormData) {
  const username = formData.get("username");
  const password = formData.get("password");

  if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
    redirect("/login?error=invalid");
  }

  let payload;
  try {
    payload = await loginAuthUser({ username: username.trim(), password });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error.status === 401 || error.status === 400)
    ) {
      redirect("/login?error=credentials");
    }
    throw error;
  }

  if (!payload.token) {
    throw new Error("A API de autenticação retornou uma resposta inválida.");
  }

  const cookieStore = await cookies();
  cookieStore.set(authCookieName, payload.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);
  redirect("/login");
}
