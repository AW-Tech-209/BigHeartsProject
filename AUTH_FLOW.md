# Flujo de autenticación y sesión (HU-102)

Este documento fija el **punto de integración acordado entre backend (Dev A) y
frontend (Dev B)**: dónde vive cada token y cómo se renueva la sesión. Es la
referencia común; el contrato de tipos vive en `@academia/types`.

> Estado: **backend (Dev A) y frontend (Dev B) implementados**. El backend emite
> y rota los tokens; el frontend los consume con el store de Zustand, el
> interceptor de axios y los guards de ruta descritos más abajo.

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

## Implementación en el frontend

| Pieza                     | Archivo                                                                        | Qué resuelve                                                                    |
| ------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Store de sesión           | `apps/web/src/stores/auth-store.ts`                                            | `status` + `user` + `accessToken` **en memoria**. Sin `persist`, a propósito.   |
| Refresh silencioso        | `apps/web/src/lib/auth/refresh-session.ts`                                     | Llama a `/auth/refresh` con un axios **crudo** y colapsa llamadas concurrentes. |
| Interceptor               | `apps/web/src/lib/http-client.ts`                                              | Adjunta el Bearer; ante un 401 renueva y **reintenta** la petición original.    |
| Rehidratación al arrancar | `apps/web/src/features/auth/hooks/use-session-bootstrap.ts`                    | Un único `/auth/refresh` por carga de página.                                   |
| Pantalla de login         | `apps/web/src/pages/LoginPage.tsx` + `features/auth/components/login-form.tsx` | Formulario accesible y mensajes por código de error.                            |
| Guard de rutas            | `apps/web/src/features/auth/components/require-auth.tsx`                       | Redirige a `/login` sin sesión; muestra "sin acceso" si el rol no alcanza.      |
| UI por rol                | `apps/web/src/features/auth/components/role-gate.tsx`                          | Oculta bloques según el rol (comodidad de UI, **no** seguridad).                |

### Tres detalles que no son obvios

- **El refresh es _single-flight_.** Si dos peticiones reciben un 401 a la vez y
  cada una llamara a `/auth/refresh`, la segunda presentaría la cookie ya
  rotada: el backend lo lee como reutilización (robo) y **revoca la familia
  entera**, cerrando la sesión. Por eso `refreshSession()` reutiliza el refresh
  en vuelo. Por lo mismo, la rehidratación del arranque usa una bandera a nivel
  de módulo: `<StrictMode>` monta cada componente dos veces en desarrollo.
- **El refresh usa un cliente de axios sin interceptores.** Si viajara por
  `httpClient`, un 401 del propio refresh dispararía otro refresh en bucle.
- **`/auth/login` y `/auth/register` están excluidos del reintento.** Su 401 es
  la respuesta que la pantalla quiere mostrar ("credenciales incorrectas"), no
  un token caducado.

### Estado del access token entre recargas

El access token **no se persiste en `localStorage`**: lo que hay en disco lo lee
cualquier XSS y sobrevive al cierre de la pestaña. La persistencia entre visitas
la da la cookie `httpOnly`, que este código no puede leer. Esto es lo que hace
que exista el estado `checking` del store: tras un F5 no se sabe si hay sesión
hasta que `/auth/refresh` contesta, y sin ese estado intermedio el guard
expulsaría a login a usuarios que sí la tienen.

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

## Rutas del frontend

| Ruta        | Acceso              | Nota                                                           |
| ----------- | ------------------- | -------------------------------------------------------------- |
| `/`         | Pública             | Ofrece entrar o registrarse; si ya hay sesión, ir al panel.    |
| `/registro` | Pública             | HU-101.                                                        |
| `/login`    | Pública, sin sesión | Con sesión activa redirige a `/panel`.                         |
| `/panel`    | **Requiere sesión** | Sin sesión → `/login`, recordando a dónde iba para volver ahí. |

Para exigir además un rol: `<RequireAuth roles={[UserRole.ADMIN]}>`. Si hay
sesión pero el rol no alcanza, se muestra una pantalla de "sin acceso" en vez de
mandar al login: el usuario **sí** inició sesión, y devolverlo a un formulario de
acceso le haría creer que su sesión falló.

> **Pendiente para la siguiente HU:** hoy la API no expone ninguna ruta
> protegida (solo `/auth/*` y `/health`, todas `@Public()`), así que el reintento
> tras 401 del interceptor no tiene todavía ningún endpoint real contra el que
> dispararse. Empezará a actuar en cuanto se añada el primer endpoint con sesión
> (aulas, reservas), sin tocar este código.

## Variables de entorno

Ver `apps/api/.env.example`. Nuevas en esta HU (todas opcionales, con defaults):
`JWT_ACCESS_EXPIRES_IN` (15m), `REFRESH_TOKEN_TTL_DAYS` (30),
`AUTH_THROTTLE_TTL` (60), `AUTH_THROTTLE_LIMIT` (5).
