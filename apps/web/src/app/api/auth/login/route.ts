import { NextResponse } from "next/server";

import { ServerApiError, serverRequest } from "@/lib/api-server";
import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  type AuthLoginResponse,
} from "@/lib/auth/constants";

export const dynamic = "force-dynamic";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

function errorMessage(status: number): string {
  if (status === 400) return "Credenciais inválidas.";
  if (status === 401) return "E-mail ou senha incorretos.";
  return "Erro interno. Tente novamente.";
}

function isSecureRequest(request: Request): boolean {
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();

  return forwardedProtocol
    ? forwardedProtocol === "https"
    : new URL(request.url).protocol === "https:";
}

/**
 * Proxy do login para o NestJS. O access_token nunca é devolvido ao browser:
 * ele é escrito diretamente no cookie HttpOnly da resposta.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ message: errorMessage(400) }, { status: 400 });
  }

  if (
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    !body.email.trim() ||
    !body.password
  ) {
    return NextResponse.json({ message: errorMessage(400) }, { status: 400 });
  }

  try {
    const result = await serverRequest<{ access_token?: unknown }>("/auth/login", {
      method: "POST",
      body: { email: body.email.trim(), password: body.password },
    });

    if (typeof result.access_token !== "string" || !result.access_token) {
      return NextResponse.json({ message: errorMessage(500) }, { status: 500 });
    }

    const response = NextResponse.json<AuthLoginResponse>({
      authenticated: true,
    });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: result.access_token,
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
    return response;
  } catch (error) {
    const status =
      error instanceof ServerApiError &&
      (error.status === 400 || error.status === 401)
        ? error.status
        : 500;
    return NextResponse.json({ message: errorMessage(status) }, { status });
  }
}
