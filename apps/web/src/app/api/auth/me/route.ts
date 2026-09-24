import { NextResponse } from "next/server";

import { getAuthToken, getAuthUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/** Perfil derivado do cookie HttpOnly, sem expor o token ao JavaScript. */
export async function GET(): Promise<NextResponse> {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json(
      { message: "Sessão não encontrada." },
      { status: 401 },
    );
  }

  try {
    const user = await getAuthUser(token);
    if (!user) {
      return NextResponse.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 },
      );
    }
    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { message: "Não foi possível validar a sessão." },
      { status: 503 },
    );
  }
}
