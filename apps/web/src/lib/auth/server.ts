import { cookies } from "next/headers";

import { API_SERVER_BASE_URL } from "@/lib/api-server";
import {
  AUTH_COOKIE_NAME,
  normalizeAuthUser,
  type AuthUser,
  type AuthUserPayload,
} from "@/lib/auth/constants";

/** Lê o token HTTP-only no servidor (Server Component/Route Handler). */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/** Valida o token no NestJS e retorna o perfil público normalizado. */
export async function getAuthUser(token: string): Promise<AuthUser | null> {
  const response = await fetch(`${API_SERVER_BASE_URL}/auth/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`Falha ao validar sessão: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as AuthUserPayload;
  return normalizeAuthUser(payload);
}

/** Recupera o usuário autenticado a partir do cookie do Request. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return getAuthUser(token);
}
