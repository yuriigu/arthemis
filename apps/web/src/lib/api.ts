/**
 * Cliente HTTP base do Arthemis.
 *
 * - Usa `fetch` nativo (sem dependências externas).
 * - Base: variável de ambiente `NEXT_PUBLIC_API_URL`.
 * - Headers comuns: `Accept`/`Content-Type: application/json`.
 * - Suporte a token Bearer por requisição (`token`) ou por `setTokenGetter`
 *   para integrações server-side. A sessão web usa o cookie HTTP-only
 *   `arthemis_token` e não persiste JWT em `localStorage`.
 */

const DEFAULT_API_URL = "http://localhost:3000/api";

/** URL base do backend, sem barra final. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
).replace(/\/+$/, "");

type TokenGetter = () => string | null;

/**
 * A sessão normal não expõe o token ao JavaScript. Este getter permanece
 * disponível para chamadas server-side ou integrações que precisem fornecer
 * um Bearer explicitamente.
 */
let tokenGetter: TokenGetter = () => null;

/** Lê o token Bearer fornecido pela estratégia atual. */
export function getAuthToken(): string | null {
  return tokenGetter();
}

/** Substitui a estratégia de resolução do token (ex.: cookie de sessão). */
export function setTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

/** Erro lançado quando a API responde com status fora de 2xx. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  /** Payload serializado automaticamente como JSON (ou `FormData` cru). */
  body?: unknown;
  /**
   * Token Bearer desta requisição.
   * `undefined` usa o token global; `null` força requisição sem token.
   */
  token?: string | null;
};

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Executa uma requisição e retorna o corpo tipado em JSON. */
export async function request<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers, token, ...rest } = options;
  const resolvedToken = token === undefined ? tokenGetter() : token;

  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (resolvedToken) {
    finalHeaders.set("Authorization", `Bearer ${resolvedToken}`);
  }

  const response = await fetch(resolveUrl(path), {
    ...rest,
    credentials: rest.credentials ?? "include",
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (!response.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text().catch(() => null);
    }
    throw new ApiError(
      `Requisição falhou: ${response.status} ${response.statusText}`,
      response.status,
      errorBody,
    );
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return (await response.text()) as T;
  }
  return (await response.json()) as T;
}

/** Atalhos verbais para as requisições mais comuns. */
export const api = {
  get: <T>(path: string, options?: ApiRequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, options?: ApiRequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: "POST" }),
  put: <T>(path: string, options?: ApiRequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: "PUT" }),
  patch: <T>(path: string, options?: ApiRequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: "PATCH" }),
  delete: <T>(path: string, options?: ApiRequestOptions): Promise<T> =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export default api;
