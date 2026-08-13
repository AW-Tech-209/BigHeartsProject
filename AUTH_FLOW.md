# Flujo de autenticación y sesión (HU-102)

Este documento fija el **punto de integración acordado entre backend (Dev A) y
frontend (Dev B)**: dónde vive cada token y cómo se renueva la sesión. Es la
referencia común; el contrato de tipos vive en `@academia/types`.

> Estado: el **backend (Dev A) está implementado y verificado**. Las tareas de
> frontend (Dev B) — pantalla de login, store de Zustand, interceptor de axios y
> guard de rutas — consumen exactamente este contrato.

## Decisión: dónde vive cada token

| Token                     | Dónde vive                                                           | Vida                               | Por qué                                                                                  |
| ------------------------- | -------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| **Access Token** (JWT)    | **En memoria** del frontend (store de Zustand, nunca `localStorage`) | 15 min (`JWT_ACCESS_EXPIRES_IN`)   | Corto: si se filtra, caduca pronto. En memoria = no lo roba un XSS desde disco.          |
| **Refresh Token** (opaco) | **Cookie `httpOnly`** que pone el backend                            | 30 días (`REFRESH_TOKEN_TTL_DAYS`) | `httpOnly` ⇒ JS no lo lee ⇒ un XSS no lo roba. En BD solo se guarda su **hash** SHA-256. |

- El **access token viaja en el cuerpo** de la respuesta de `login`/`refresh`
  (`accessToken` + `expiresIn`). El frontend lo manda en cada petición protegida
  como `Authorization: Bearer <accessToken>`.
- El **refresh token NO viaja en el cuerpo nunca**: solo en la cookie `httpOnly`
  `refresh_token`, con `Path=/auth` (solo se envía a `/auth/refresh` y
  `/auth/logout`).

## Contrato de endpoints

Todas las respuestas usan el envelope global `ApiResponse` (`{ success, data }`
o `{ success, error }`).

| Método | Ruta             | Cuerpo entrada    | `data` de salida                                   | Cookie                    |
| ------ | ---------------- | ----------------- | -------------------------------------------------- | ------------------------- |
| POST   | `/auth/register` | `RegisterInput`   | `{ user }`                                         | —                         |
| POST   | `/auth/login`    | `LoginInput`      | `AuthSession` = `{ user, accessToken, expiresIn }` | **set** `refresh_token`   |
| POST   | `/auth/refresh`  | — (usa la cookie) | `AuthSession`                                      | **rota** `refresh_token`  |
| POST   | `/auth/logout`   | — (usa la cookie) | `{ loggedOut: true }`                              | **borra** `refresh_token` |

`expiresIn` son **segundos** de validez del access token (p. ej. `900`).

## Renovación silenciosa (lo que hace Dev B)

1. El frontend guarda `accessToken` + `user` en memoria (Zustand) tras el login.
2. En cada petición añade `Authorization: Bearer <accessToken>`.
3. Interceptor de axios: ante un **401**, llama **una vez** a `POST /auth/refresh`
   (con `withCredentials: true` para que viaje la cookie), guarda el nuevo
   `accessToken` y **reintenta** la petición original. Si el refresh también da
   401 → sesión terminada → redirige a login.
4. **Rehidratar al recargar**: como el access token vive en memoria, al recargar
   se pierde. En el arranque de la app, llamar a `POST /auth/refresh`: si la
   cookie sigue válida, devuelve una sesión nueva (así la sesión "sobrevive a
   recargas"); si no, el usuario no tenía sesión.

> **Importante para axios**: usar `withCredentials: true` en el cliente (o al
> menos en las llamadas a `/auth/*`). Sin eso el navegador no envía ni recibe la
> cookie `httpOnly`.

## Seguridad implementada (backend)

- **Contraseñas**: bcrypt coste 12. Nunca se devuelven (el tipo `User` no las
  incluye; el mapper las descarta).
- **Anti-enumeración**: un login con email inexistente igualmente compara contra
  un hash señuelo → tiempos parecidos, no se puede sondear qué emails existen.
  Mensaje único `INVALID_CREDENTIALS` (no dice si falló email o contraseña).
- **Refresh token opaco + hash en BD**: si se filtra la BD, los tokens no son
  reutilizables (solo hay hashes SHA-256).
- **Rotación**: cada `refresh` revoca el token usado y emite uno nuevo.
- **Detección de reuso**: si se presenta un refresh token **ya revocado** (señal
  de robo), se revoca **toda la familia** de sesiones activas del usuario.
- **Estados de cuenta**: solo `ACTIVE` inicia/mantiene sesión. `SUSPENDED` →
  `ACCOUNT_SUSPENDED` (403); `PENDING` → `ACCOUNT_PENDING` (403). El estado se
  recomprueba en cada `refresh` (una suspensión corta la sesión al renovar).
- **Cierre por defecto**: `JwtAuthGuard` global protege TODA la API; solo pasan
  las rutas marcadas `@Public()` (registro, login, refresh, logout, health).
- **Rate limiting**: `AuthThrottlerGuard` en `login` y `register`
  (`AUTH_THROTTLE_LIMIT` intentos por IP cada `AUTH_THROTTLE_TTL` s;
  por defecto 5/60). Excedido → `TOO_MANY_REQUESTS` (429).

## Códigos de error nuevos (`ApiErrorCode`)

`INVALID_CREDENTIALS`, `ACCOUNT_SUSPENDED`, `ACCOUNT_PENDING`, `UNAUTHENTICATED`,
`INVALID_REFRESH_TOKEN`, `TOO_MANY_REQUESTS`. El frontend decide el mensaje según
el `code` (no según el texto).

## Cookies según entorno

| Entorno                          | `Secure` | `SameSite` | Nota                                                                                                                                                                                        |
| -------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| development (`http://localhost`) | `false`  | `Lax`      | Front y API comparten sitio `localhost`.                                                                                                                                                    |
| staging / producción             | `true`   | `None`     | Front (Vercel) y API (Render) son dominios distintos ⇒ cookie cross-site ⇒ requiere `Secure`+`SameSite=None`. Exige `CORS_ORIGIN` bien configurado y `credentials: true` en CORS (ya está). |

## Variables de entorno

Ver `apps/api/.env.example`. Nuevas en esta HU (todas opcionales, con defaults):
`JWT_ACCESS_EXPIRES_IN` (15m), `REFRESH_TOKEN_TTL_DAYS` (30),
`AUTH_THROTTLE_TTL` (60), `AUTH_THROTTLE_LIMIT` (5).
