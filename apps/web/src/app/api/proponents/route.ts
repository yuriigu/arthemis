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
  if (!token) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });

  const search = new URL(request.url).searchParams.get("search")?.trim();
  const path = search ? `/proponents?search=${encodeURIComponent(search)}` : "/proponents";

  try {
    return NextResponse.json(await serverRequest(path, { token }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });

  try {
    const body: unknown = await request.json();
    const proponent = await serverRequest("/proponents", {
      method: "POST",
      body,
      token,
    });
    return NextResponse.json(proponent, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "Corpo inválido." }, { status: 400 });
    }
    return errorResponse(error);
  }
}
