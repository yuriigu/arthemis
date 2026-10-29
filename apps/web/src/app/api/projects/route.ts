import { NextResponse } from "next/server";

import { ServerApiError, serverRequest } from "@/lib/api-server";
import { getAuthToken } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ServerApiError) {
    return NextResponse.json(
      error.body ?? { message: "Não foi possível processar a solicitação." },
      { status: error.status },
    );
  }
  return NextResponse.json({ message: "Erro interno." }, { status: 500 });
}

export async function GET(request: Request): Promise<NextResponse> {
  const token = await getAuthToken();
  if (!token)
    return NextResponse.json(
      { message: "Sessão não encontrada." },
      { status: 401 },
    );

  const searchParams = new URL(request.url).searchParams;

  try {
    const params = new URLSearchParams();
    for (const key of ["page", "limit", "search"]) {
      const value = searchParams.get(key)?.trim();
      if (value) params.set(key, value);
    }

    const query = params.toString();
    const suffix = query ? `?${query}` : "";
    const result = await serverRequest(`/projects${suffix}`, { token });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = await getAuthToken();
  if (!token)
    return NextResponse.json(
      { message: "Sessão não encontrada." },
      { status: 401 },
    );

  try {
    const body: unknown = await request.json();
    const project = await serverRequest("/projects", {
      method: "POST",
      body,
      token,
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "Corpo inválido." }, { status: 400 });
    }
    return errorResponse(error);
  }
}
