export const AUTH_COOKIE_NAME = "arthemis_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24;
export const LOGIN_PATH = "/login";
export const DASHBOARD_PATH = "/dashboard";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthUserPayload = {
  id: string;
  name?: string;
  email: string;
  role: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type AuthLoginResponse = {
  authenticated: true;
};

function optionalString(value: string | Date | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

/**
 * O backend atual ainda não possui o campo `name`. Mantemos o contrato do
 * frontend e fazemos fallback para o prefixo do e-mail até a API expor um
 * nome explícito.
 */
export function normalizeAuthUser(payload: AuthUserPayload): AuthUser {
  const name = payload.name?.trim() || payload.email.split("@")[0] || payload.email;

  return {
    id: payload.id,
    name,
    email: payload.email,
    role: payload.role,
    createdAt: optionalString(payload.createdAt),
    updatedAt: optionalString(payload.updatedAt),
  };
}
