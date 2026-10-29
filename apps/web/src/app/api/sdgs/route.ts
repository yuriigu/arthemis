import { NextResponse } from "next/server";

import { ServerApiError, serverRequest } from "@/lib/api-server";
import { getAuthToken } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json(
      { message: "Sessão não encontrada." },
      { status: 401 },
    );
  }

  try {
    const sdgs = await serverRequest("/sdgs", { token });
    return NextResponse.json(sdgs);
  } catch (error) {
    if (error instanceof ServerApiError) {
      return NextResponse.json(
        error.body ?? { message: "Não foi possível processar a solicitação." },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}
