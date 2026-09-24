import type { Request } from 'express';

/**
 * Contratos do módulo `auth`.
 *
 * Herdados do JWT gerado por `legacy/edge/services/auth/handlers/login.go`:
 * assinatura HS256, claims `sub` (UUID do usuário) e `role`, validade de 24h.
 * O `email` entra como claim adicional porque ele virou a credencial de login
 * (o legado usava `username` e não embutia identidade além do `sub`).
 */

/**
 * Claims emitidas no `access_token` do login.
 * Mesmas chaves do `jwt.MapClaims` legado (`sub`, `role` + `iat`/`exp`
 * automáticos), com `email` somado ao payload.
 */
export interface JwtPayload {
  /** UUID do usuário — mesma identidade da claim `sub` do legado. */
  sub: string;
  email: string;
  role: string;
}

/** Resposta do `POST /auth/login` (200 OK). */
export interface AuthResponse {
  access_token: string;
}

/**
 * Usuário autenticado anexado a `request.user` pela `JwtStrategy`.
 * Equivale aos headers `X-User-Id`/`X-User-Role` que o `/validate` legado
 * repassava ao Traefik após validar o token.
 */
export type AuthenticatedUser = JwtPayload;

/** Request express com o usuário validado pelo `JwtAuthGuard`. */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
