import { NextResponse } from "next/server";

import { ServerApiError, serverRequest } from "@/lib/api-server";
import { getAuthToken } from "@/lib/auth/server";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ServerApiError) {
    return NextResponse.json(
      error.body ?? { message: "Não foi possível processar a solicitação." },
      { status: error.status },
    );
  }
  return NextResponse.json({ message: "Erro interno." }, { status: 500 });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    return NextResponse.json(
      await serverRequest(`/proponents/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body,
        token,
      }),
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "Corpo inválido." }, { status: 400 });
    }
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });

  try {
    const { id } = await params;
    await serverRequest(`/proponents/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
