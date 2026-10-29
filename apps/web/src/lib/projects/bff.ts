import { NextResponse } from "next/server";

import { ServerApiError, serverRequest } from "@/lib/api-server";
import { getAuthToken } from "@/lib/auth/server";

export class BffInputError extends Error {}

export type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

export type EntityRouteContext = {
  params: Promise<{ id: string; entityId: string }>;
};

export async function projectApiRoute(
  action: (token: string) => Promise<unknown>,
  status = 200,
): Promise<NextResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { message: "Sessão não encontrada." },
        { status: 401 },
      );
    }

    return NextResponse.json(await action(token), { status });
  } catch (error) {
    if (error instanceof ServerApiError) {
      return NextResponse.json(
        error.body ?? { message: "Não foi possível processar a solicitação." },
        { status: error.status },
      );
    }
    if (error instanceof BffInputError || error instanceof SyntaxError) {
      return NextResponse.json(
        { message: error.message || "Corpo inválido." },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}

export async function readRequestObject(
  request: Request,
): Promise<Record<string, unknown>> {
  const body: unknown = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BffInputError("O corpo da solicitação deve ser um objeto.");
  }
  return body as Record<string, unknown>;
}

export async function listAll<T>(
  path: string,
  token: string,
): Promise<T[]> {
  const values: T[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const separator = path.includes("?") ? "&" : "?";
    const batch = await serverRequest<T[]>(`${path}${separator}${query}`, {
      token,
    });
    values.push(...batch);
    if (batch.length < limit) return values;
    page += 1;
  }
}

export async function getProjectActivity(
  id: string,
  token: string,
): Promise<{ id: string; projectId: string }> {
  return serverRequest<{ id: string; projectId: string }>(
    `/activities/${encodeURIComponent(id)}`,
    { token },
  );
}

export async function getProjectLocation(
  id: string,
  token: string,
): Promise<{ id: string; projectId: string }> {
  return serverRequest<{ id: string; projectId: string }>(
    `/locations/${encodeURIComponent(id)}`,
    { token },
  );
}

export async function getProjectIndicator(
  id: string,
  token: string,
): Promise<{ id: string; activityId: string; locationId: string }> {
  return serverRequest<{ id: string; activityId: string; locationId: string }>(
    `/indicators/${encodeURIComponent(id)}`,
    { token },
  );
}

export async function getProjectObservation(
  id: string,
  token: string,
): Promise<{ id: string; indicatorId: string }> {
  return serverRequest<{ id: string; indicatorId: string }>(
    `/observations/${encodeURIComponent(id)}`,
    { token },
  );
}

export async function assertProjectIndicator(
  projectId: string,
  indicatorId: string,
  token: string,
): Promise<void> {
  const indicator = await getProjectIndicator(indicatorId, token);
  const [activity, location] = await Promise.all([
    getProjectActivity(indicator.activityId, token),
    getProjectLocation(indicator.locationId, token),
  ]);
  if (activity.projectId !== projectId || location.projectId !== projectId) {
    throw new ServerApiError("Indicador não pertence ao projeto.", 404, null);
  }
}

export function projectMismatch(): ServerApiError {
  return new ServerApiError("Registro não pertence ao projeto.", 404, null);
}

export function invalidProjectInput(message: string): ServerApiError {
  return new ServerApiError(message, 400, { message });
}
