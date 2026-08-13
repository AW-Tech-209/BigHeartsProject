import type { CookieOptions, Response } from 'express';

import type { AppConfigService } from '../config/app-config.service';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from './auth.constants';

/**
 * Opciones de la cookie del refresh token.
 *
 *  - `httpOnly`: JS no puede leerla → un XSS no roba el refresh token.
 *  - `secure` + `sameSite: 'none'` en producción: el frontend (Vercel) y la API
 *    (Render) viven en dominios distintos, así que la cookie es cross-site y el
 *    navegador solo la envía si es Secure (HTTPS) y SameSite=None.
 *  - En desarrollo (http://localhost) `secure` debe ser false y `sameSite:'lax'`
 *    basta, porque front y API comparten el sitio `localhost`.
 *  - `path` acotado a `/auth`: la cookie solo viaja a /auth/refresh y /auth/logout.
 */
function baseCookieOptions(config: AppConfigService): CookieOptions {
  const isProduction = !config.isDevelopment;
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: REFRESH_COOKIE_PATH,
  };
}

/** Planta la cookie del refresh token con su caducidad. */
export function setRefreshCookie(
  res: Response,
  config: AppConfigService,
  token: string,
  expiresAt: Date,
): void {
  const maxAge = Math.max(0, expiresAt.getTime() - Date.now());
  res.cookie(REFRESH_COOKIE_NAME, token, { ...baseCookieOptions(config), maxAge });
}

/** Borra la cookie del refresh token (logout). Mismas opciones, sin maxAge. */
export function clearRefreshCookie(res: Response, config: AppConfigService): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions(config));
}
