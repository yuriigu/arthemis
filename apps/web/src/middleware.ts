import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAME,
  DASHBOARD_PATH,
  LOGIN_PATH,
} from "@/lib/auth/constants";

const PRIVATE_PREFIXES = ["/dashboard", "/proponents", "/usuarios"];

function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Proteção server-side de rotas privadas. A assinatura/validação completa do JWT
 * continua no backend; aqui verificamos a presença do cookie antes de renderizar
 * a rota, exatamente como o hook `arthemis_token` do legado.
 */
export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname, search } = request.nextUrl;

  if (!token && isPrivateRoute(pathname)) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    if (pathname !== DASHBOARD_PATH || search) {
      loginUrl.searchParams.set("from", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (token && pathname === LOGIN_PATH) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/proponents/:path*", "/usuarios/:path*"],
};
