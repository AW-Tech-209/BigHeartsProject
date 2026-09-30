# HU-522 — El registro público se cierra por configuración

| Campo               | Valor                                                     |
| ------------------- | --------------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Piloto controlado                           |
| **Prioridad**       | 🔴 Crítica                                                |
| **Estimación**      | 1 día                                                     |
| **Estado**          | ⬜ Pendiente                                              |
| **Asignada a**      | **Dev A** (T1–T3) · **Dev B** (T4–T5)                     |
| **Rama**            | `hu-522-registro-publico-cerrado-a` / `-b`                |
| **Alcance técnico** | fullstack                                                 |
| **Depende de**      | HU-521                                                    |
| **Labels**          | `post-fase-1` `prioridad:critica` `fullstack` `seguridad` |

> **Como** dueño de la academia en fase de pruebas,
> **quiero** que nadie pueda crearse una cuenta por su cuenta,
> **para** que en la plataforma solo estén las personas que yo invité.

## Contexto

Mientras no haya modelo de negocio, el piloto es **cerrado**: las cuentas las crea el admin (HU-523).
El registro público **no se borra**: se apaga con una variable, y volverlo a abrir es cambiarla.
Decisión **D48**: `PUBLIC_REGISTRATION_ENABLED`, **por defecto `false`** (cerrado salvo que alguien
lo abra a propósito). El servidor es la única fuente de verdad: el front pregunta si está abierto,
no lo supone.

## Referencias

- **Archivos a tocar:** `apps/api/src/config/env.schema.ts` + `app-config.service.ts`, `apps/api/.env.example`,
  `apps/api/src/auth/{auth.controller,auth.service,auth.errors}.ts`, `apps/api/src/config-publica/` (nuevo
  módulo), `packages/types/src/index.ts`, `apps/web/src/features/landing/components/cta-acceso.tsx`,
  `apps/web/src/pages/RegisterPage.tsx`, `apps/web/src/features/auth/components/login-form.tsx`.
- **Reglas:** `ARQUITECTURA.md` → «4.5 Registro y aprobación» (se reescribe con D48) y «8. Seguridad
  y autenticación». `AUTH_FLOW.md` se actualiza.
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — Entorno: `PUBLIC_REGISTRATION_ENABLED` (`'true' | 'false'`, por defecto `false`), igual
      que `TEACHER_APPROVAL_REQUIRED`.
- [ ] **T2** — `POST /auth/register` con el registro cerrado → **403 `REGISTRATION_CLOSED`**, sin crear
      nada y antes de validar si el correo existe (no se filtra qué correos hay).
- [ ] **T3** — `GET /config/publica` (`@Public()`): `{ registroAbierto: boolean }`. Cacheable 5 min
      en el cliente (React Query `staleTime`).
- [ ] **T4** — Front con el registro cerrado: la barra de la landing muestra **solo «Iniciar sesión»**;
      el login no enlaza a `/registro`; y `/registro` muestra un estado honesto: «BigHearts está en
      fase de pruebas. Las cuentas las crea la academia», con el botón «Iniciar sesión» y el botón de
      ayuda de HU-514 para pedir acceso. El formulario de registro **no se borra**.
- [ ] **T5** — Tests: API cerrada → 403 y ningún `user.create`; abierta → comportamiento actual.
      Front: con `registroAbierto: false` no hay enlaces a `/registro` en landing ni login, y
      `/registro` muestra el aviso.

## Criterios de aceptación

- [ ] **AC1** — Sin definir la variable, `POST /auth/register` responde 403 `REGISTRATION_CLOSED` para
      cualquier rol, y la tabla `users` no cambia.
- [ ] **AC2** — Con `PUBLIC_REGISTRATION_ENABLED=true`, el registro de estudiantes y profesores
      (con aprobación) funciona exactamente como hoy (los tests existentes pasan sin tocarlos).
- [ ] **AC3** — Con el registro cerrado, ninguna pantalla pública tiene un enlace a `/registro`, y la
      barra de la landing muestra un solo botón: «Iniciar sesión».
- [ ] **AC4** — Entrar a `/registro` escribiendo la URL muestra el aviso de fase de pruebas, no el
      formulario.
- [ ] **AC5** — `ARQUITECTURA.md` §4.5 y `AUTH_FLOW.md` describen D48.

## Fuera de alcance

- Crear cuentas desde el admin (HU-523/HU-524).
- Lista de espera o formulario de «solicitar acceso» con datos. Por ahora, el botón de ayuda.

## Notas de implementación

_Se rellena al cerrar. Recordatorio: en Render, **no** definir la variable (o `false`) en staging y
prod durante el piloto._
