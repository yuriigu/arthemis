import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

export const dynamic = "force-dynamic";

function isSecureRequest(request: Request): boolean {
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();

  return forwardedProtocol
    ? forwardedProtocol === "https"
    : new URL(request.url).protocol === "https:";
}

function clearSessionCookie(response: NextResponse, request: Request): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  });
}

/** Remove a sessão local; a revogação do JWT fica a cargo do backend. */
export async function POST(request: Request): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response, request);
  return response;
}

/** Recuperação usada pelo Server Component quando o cookie expirou. */
export async function GET(request: Request): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookie(response, request);
  return response;
}

export const DELETE = POST;
