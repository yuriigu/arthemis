import type { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'arthemis_token';

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
}
