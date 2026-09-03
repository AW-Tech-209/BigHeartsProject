# HU-410 — Recuperación de contraseña (backend)

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Cierre de Fase 1 · autenticación                    |
| **Prioridad**       | 🟠 Alta (bloquea HU-411)                            |
| **Estimación**      | 2 días                                              |
| **Estado**          | ⬜ Pendiente                                        |
| **Rama**            | `hu-410-recuperacion-de-contrasena-backend-ana`     |
| **Alcance técnico** | fullstack (contrato + backend)                      |
| **Depende de**      | ninguna (usa el puerto de notificaciones de HU-401) |
| **Labels**          | `cierre-fase-1` `prioridad:alta` `backend` `infra`  |

> **Como** persona que olvidó su contraseña,
> **Quiero** pedir un enlace para crear una nueva,
> **Para** recuperar el acceso sin escribir a soporte.

## Contexto

Hoy no hay recuperación de contraseña: `login-error-notice` remite a soporte. El diseño de la
Fase 1 la incorpora. Esta HU añade el backend: dos endpoints públicos (`solicitar` y `restablecer`),
una tabla de tokens de un solo uso con caducidad (espejo de `RefreshToken`: en BD solo el hash
SHA-256), y un correo transaccional nuevo por el puerto `NotificationService` (real con Resend desde
HU-401). El contrato compartido va primero.

**Invariantes implicadas** (`bighearts-backend`, `AUTH_FLOW.md`):

- El token viaja al usuario en claro (en el enlace del correo); en BD solo su hash SHA-256. Un solo
  uso (`usedAt`). Caducidad corta, configurable por entorno.
- **No revela si el email existe.** `solicitar` responde siempre igual (mismo status, mismo cuerpo)
  haya cuenta o no — el mismo principio que el hash señuelo del login (`bighearts-backend` §Seguridad).
- Rate limiting con `@nestjs/throttler` en ambos endpoints (ya se aplica a `login`/`register`).
- Restablecer con éxito **revoca todas las sesiones activas** del usuario (familia de
  `RefreshToken`), como un cambio de contraseña.
- bcrypt coste 12 para el hash nuevo. Ningún dato sensible en logs (ni el token, ni el enlace).

## Dependencias técnicas

- **Reglas implicadas:** skill `bighearts-backend` → `contrato-api.md` (envelope, `ApiErrorCode`,
  DTOs), §Seguridad, §Configuración. `AUTH_FLOW.md`. `docs/ARQUITECTURA.md` §8 y modelo de datos.
- **Reutiliza:** `NotificationService` + `notification-templates.ts` (HU-401), `TokenService` /
  patrón de `RefreshToken` para hash y revocación, la regla de contraseña del `RegisterDto`,
  `AuthThrottlerGuard`.
- **Decisiones pendientes que bloquean esta HU:** ninguna.
- **Bloquea a:** HU-411.

## 🔧 Tasks

**Una sola persona, una sola sesión.**

### Contrato — va primero

- [ ] **T1** — En `packages/types`: tipos/DTO de `POST /auth/forgot-password` y
      `POST /auth/reset-password`, y códigos nuevos en `ApiErrorCode`:
      `PASSWORD_RESET_TOKEN_INVALID`, `PASSWORD_RESET_TOKEN_EXPIRED`. `npm run build:types`.

### Backend

- [ ] **T2** — Modelo `PasswordResetToken` en Prisma (`id`, `userId`, `tokenHash @unique`,
      `expiresAt`, `usedAt?`, `createdAt`; relación con `User`, `onDelete: Cascade`). Migración
      generada y aplicada. `PASSWORD_RESET_EXPIRY_MINUTES` (y `APP_URL` si no existe) en
      `config/env.schema.ts` **y** `.env.example`.
- [ ] **T3** — Notificación: `NotificationType.PASSWORD_RESET` + plantilla en
      `notification-templates.ts` (asunto y cuerpo en español, enlace
      `{APP_URL}/nueva-contrasena?token=…`).
- [ ] **T4** — `AuthService.requestPasswordReset(email)`: si el usuario existe y está activo,
      invalida sus tokens de reset no usados, crea uno nuevo y envía el correo. Termina **siempre**
      sin señal de existencia.
- [ ] **T5** — `AuthService.resetPassword(token, newPassword)` en **una transacción**: hashea el
      token, busca por `tokenHash`, valida no usado y no caducado (`TOKEN_INVALID` / `TOKEN_EXPIRED`),
      valida la contraseña con la regla del registro, actualiza el hash, marca `usedAt`, revoca
      todas las sesiones del usuario.
- [ ] **T6** — `AuthController`: `@Public()` + `@Post('forgot-password')` y `@Post('reset-password')`
      bajo el guard de throttler. Cero lógica en el controller.

### Documentación

- [ ] **T7** — `AUTH_FLOW.md` (flujo nuevo, lado servidor). `ARQUITECTURA.md` §2 (decisión: reset
      por token de un solo uso con hash en BD) + modelo de datos. `bighearts-backend`
      `contrato-api.md` (endpoints y códigos). `README.md` (variable de entorno nueva).
      `docs/historias/README.md`. Tests en `src/auth/*.spec.ts`.

## ✅ Criterios de aceptación

- [ ] **AC1** — `POST /auth/forgot-password` con un email registrado y con uno inexistente devuelven
      **la misma respuesta** (mismo status, mismo cuerpo). Con email registrado y activo se crea una
      fila en `password_reset_tokens` y se llama a `NotificationService` una vez; con email
      inexistente, ninguna de las dos. Verificado con dos tests.
- [ ] **AC2** — `POST /auth/reset-password` con un token válido y no caducado cambia el hash de
      contraseña (login con la anterior falla, con la nueva funciona) y deja `revokedAt` no nulo en
      **todas** las sesiones del usuario. El token queda `usedAt`; un segundo intento con él devuelve
      `PASSWORD_RESET_TOKEN_INVALID`.
- [ ] **AC3** — **Errores:** token inexistente o ya usado → `PASSWORD_RESET_TOKEN_INVALID`; token
      con más de `PASSWORD_RESET_EXPIRY_MINUTES` → `PASSWORD_RESET_TOKEN_EXPIRED`; contraseña nueva
      que no cumple la regla del registro → `VALIDATION_ERROR` con el detalle del campo. Un test por
      caso.
- [ ] **AC4** — **Seguridad:** en BD solo se guarda el hash SHA-256 del token; ni el token ni el
      enlace aparecen en logs; ambos endpoints están bajo rate limiting. Verificado leyendo el
      servicio y con el test del throttler.
- [ ] **AC5** — `PASSWORD_RESET_EXPIRY_MINUTES` (y `APP_URL` si es nueva) están en
      `config/env.schema.ts` **y** en `.env.example`; el test de `notification-templates` que recorre
      todos los `NotificationType` sigue en verde con el tipo nuevo.
- [ ] **AC6** — **Verificación automática:** `typecheck`, `lint`, `build` y `npm run test` (los tres
      workspaces, incluido `@academia/api`) en verde.

## 🚫 Fuera de alcance

- Las pantallas del navegador → **HU-411**.
- Preferencias de notificación / silenciar este correo (es transaccional; sigue la decisión de
  Sprint 4).
- 2FA, preguntas de seguridad, magic-link de login.

## Notas de implementación

Sin desviaciones previstas.
