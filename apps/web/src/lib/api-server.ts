const DEFAULT_API_URL = "http://localhost:8081";

/**
 * URL usada apenas pelo runtime Node do Next para falar com o NestJS.
 * `NEXT_PUBLIC_API_URL` continua sendo a URL usada pelo browser e deve apontar
 * para o proxy interno (`/api`) do frontend.
 */
export const API_SERVER_BASE_URL = (
  process.env.API_INTERNAL_URL ??
  process.env.API_URL ??
  DEFAULT_API_URL
).replace(/\/+$/, "");

export class ServerApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ServerApiError";
    this.status = status;
    this.body = body;
  }
}

export type ServerApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

function resolveServerUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_SERVER_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Requisição HTTP do servidor Next para o NestJS, sem expor o JWT ao client. */
export async function serverRequest<T>(
  path: string,
  options: ServerApiRequestOptions = {},
): Promise<T> {
  const { body, headers, token, cache = "no-store", ...rest } = options;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(resolveServerUrl(path), {
      ...rest,
      cache,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch (error) {
    throw new ServerApiError(
      error instanceof Error ? error.message : "Falha de comunicação com a API",
      503,
      null,
    );
  }

  if (!response.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text().catch(() => null);
    }
    throw new ServerApiError(
      `Requisição ao backend falhou: ${response.status} ${response.statusText}`,
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
