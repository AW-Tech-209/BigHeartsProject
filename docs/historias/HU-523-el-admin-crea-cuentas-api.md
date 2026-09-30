# HU-523 — El admin crea cuentas de estudiantes y profesores (API)

| Campo               | Valor                                                            |
| ------------------- | ---------------------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Piloto controlado                                  |
| **Prioridad**       | 🔴 Crítica                                                       |
| **Estimación**      | 1.5 días                                                         |
| **Estado**          | ✅ Hecha                                                         |
| **Asignada a**      | **Dev A** — backend                                              |
| **Rama**            | `hu-523-el-admin-crea-cuentas-api-a`                             |
| **Alcance técnico** | backend · types · prisma                                         |
| **Depende de**      | ninguna (se puede hacer en paralelo a HU-522)                    |
| **Labels**          | `post-fase-1` `prioridad:critica` `backend` `seguridad` `prisma` |

> **Como** administrador,
> **quiero** crear la cuenta de cada persona del piloto y recibir una contraseña temporal para
> compartírsela,
> **para** controlar exactamente quién entra a la plataforma.

## Contexto

Decisión **D49**: el admin crea la cuenta con nombre, correo y rol (`STUDENT` o `TEACHER`). El
servidor genera una **contraseña temporal**, la devuelve **una sola vez** y guarda solo el hash. La
cuenta nace `ACTIVE`: que el admin cree a un profesor **es** la aprobación. La contraseña temporal
**caduca a los 7 días** y obliga a cambiarla al entrar (HU-525), porque va a viajar por WhatsApp y
no puede quedar como la contraseña definitiva.

## Referencias

- **Archivos a tocar:** `apps/api/prisma/schema.prisma` + migración, `packages/types/src/index.ts`,
  `apps/api/src/admin/admin-usuarios.{controller,service}.ts` (nuevos), `apps/api/src/admin/dto/*`,
  `apps/api/src/admin/admin.module.ts`, `apps/api/src/auth/token.service.ts` (revocar sesiones),
  `apps/api/src/common/contrasena-temporal.ts` (nuevo).
- **Reglas:** `ARQUITECTURA.md` → «4.5 Registro y aprobación» y «8. Seguridad y autenticación».
  Skill `bighearts-backend` → contrato de respuesta, DTOs, errores.
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — Modelo: `User.mustChangePassword Boolean @default(false)` y
      `User.temporaryPasswordExpiresAt DateTime?`. Las cuentas existentes quedan en `false`/`null`.
- [x] **T2** — `generarContrasenaTemporal()`: 12 caracteres con `crypto.randomInt`, alfabeto **sin
      caracteres ambiguos** (sin `0 O o 1 l I`), agrupada para dictarla o copiarla sin error
      (`Kx7m-Pq4r-Tz9w`). Cumple la regla de contraseña de `register.dto.ts`.
- [x] **T3** — `POST /admin/usuarios` (`@Roles(ADMIN)`): `{ firstName, lastName, email, role }` con
      `role ∈ {STUDENT, TEACHER}` (un admin no crea admins). Crea la cuenta `ACTIVE` con
      `mustChangePassword = true` y caducidad a 7 días. Responde `{ usuario, contrasenaTemporal,
caducaEl }`. Correo repetido → 409 `EMAIL_ALREADY_REGISTERED`.
- [x] **T4** — `POST /admin/usuarios/:id/contrasena-temporal`: genera una nueva, vuelve a activar
      `mustChangePassword`, **revoca todas las sesiones** del usuario y responde igual que T3. No
      aplica a cuentas `ADMIN`.
- [x] **T5** — `GET /admin/usuarios?rol=&estado=&q=&page=`: lista paginada (nombre, correo, rol,
      estado, `pendienteDePrimerIngreso`, `createdAt`). **Nunca** incluye contraseñas ni hashes.
- [x] **T6** — Tests: estudiante y profesor → 403; crear devuelve la contraseña y en BD solo hay un
      hash que la valida; el alfabeto no contiene ambiguos (1 000 generaciones); reset revoca los
      refresh tokens; el listado no expone `password`.

## Criterios de aceptación

- [x] **AC1** — El admin crea un estudiante y un profesor. Los dos pueden hacer login con la
      contraseña devuelta sin pasar por aprobación, y quedan con `mustChangePassword = true`.
- [x] **AC2** — La contraseña temporal aparece **solo** en la respuesta de T3/T4. Ningún otro
      endpoint ni log la contiene (verificado buscando en los logs del test).
- [x] **AC3** — Pedir una contraseña temporal nueva invalida la anterior y cierra todas las sesiones
      abiertas del usuario.
- [x] **AC4** — `POST /admin/usuarios` con `role: ADMIN` → 400. Sin rol `ADMIN` → 403.
- [x] **AC5** — `ARQUITECTURA.md` registra D49 y §4.5 describe las dos vías de alta (registro
      público apagable y alta por el admin).

## Fuera de alcance

- Alta masiva por CSV (buena siguiente HU para el piloto).
- Enviar las credenciales por correo automáticamente.
- Editar o borrar usuarios. Suspender y reactivar puede ir en una HU aparte.

## Notas de implementación

Desviación: el 409 usa el código existente `EMAIL_ALREADY_EXISTS` (la HU decía `EMAIL_ALREADY_REGISTERED`, que no existe). Los specs de integración con BD (`prisma/*.integration.spec.ts`) fallan por no haber Postgres local.
