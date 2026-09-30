# HU-525 — Primer ingreso: crear tu contraseña y contarnos cómo sigues las clases

| Campo               | Valor                                                            |
| ------------------- | ---------------------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Piloto controlado                                  |
| **Prioridad**       | 🔴 Crítica                                                       |
| **Estimación**      | 1.5 días                                                         |
| **Estado**          | ⬜ Pendiente                                                     |
| **Asignada a**      | **Dev A** (T1–T3) · **Dev B** (T4–T5)                            |
| **Rama**            | `hu-525-primer-ingreso-a` / `-b`                                 |
| **Alcance técnico** | fullstack                                                        |
| **Depende de**      | HU-523                                                           |
| **Labels**          | `post-fase-1` `prioridad:critica` `fullstack` `seguridad` `a11y` |

> **Como** persona que recibió sus credenciales de la academia,
> **quiero** crear mi propia contraseña al entrar y decir cómo prefiero seguir las clases,
> **para** que mi cuenta sea solo mía y la plataforma me muestre las clases que me sirven.

## Contexto

La contraseña temporal viajó por WhatsApp: hasta que se cambie, la cuenta **no puede hacer nada más**.
Y a un estudiante creado por el admin nadie le preguntó su preferencia de accesibilidad, que es lo
que alimenta el destacado del catálogo (§4.9). El primer ingreso resuelve las dos cosas: la
contraseña es obligatoria; la preferencia se puede dejar para después.

## Referencias

- **Archivos a tocar:** `apps/api/src/auth/{auth.controller,auth.service,auth.errors,auth.types}.ts`,
  `apps/api/src/auth/guards/` (guard nuevo o ampliación de `jwt-auth.guard.ts`),
  `apps/api/src/auth/dto/cambiar-contrasena.dto.ts` (nuevo), `packages/types/src/index.ts`,
  `apps/web/src/pages/PrimerIngresoPage.tsx` (nuevo), `apps/web/src/features/auth/components/require-auth.tsx`,
  `apps/web/src/features/auth/components/campos-preferencia.tsx` (reutilizado).
- **Reglas:** `AUTH_FLOW.md` (se actualiza), `ARQUITECTURA.md` → «8. Seguridad y autenticación» y
  «4.9» regla 5 (la preferencia es solo del `STUDENT`).
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — Login: si `temporaryPasswordExpiresAt` ya pasó → 401 `TEMPORARY_PASSWORD_EXPIRED`
      («Tu contraseña temporal caducó. Pídele una nueva a la academia»). Si no, el login funciona y
      el usuario de la respuesta y el access token llevan `debeCambiarContrasena: true`.
- [ ] **T2** — Con `debeCambiarContrasena`, **toda** la API responde 403 `PASSWORD_CHANGE_REQUIRED`
      salvo `GET /users/me`, `POST /auth/cambiar-contrasena`, `POST /auth/refresh` y
      `POST /auth/logout`. Se decide en el servidor (guard global), no en el front.
- [ ] **T3** — `POST /auth/cambiar-contrasena` `{ actual, nueva }`: valida la actual, aplica la regla
      de contraseña, exige que la nueva sea distinta, limpia `mustChangePassword` y
      `temporaryPasswordExpiresAt`, **revoca las demás sesiones** y emite tokens nuevos.
- [ ] **T4** — Front: `<RequireAuth>` manda a `/primer-ingreso` a quien tenga `debeCambiarContrasena`,
      sea cual sea la ruta. Paso 1 «Crea tu contraseña» (nueva + confirmación, con los requisitos
      visibles y en vivo). Paso 2, **solo estudiantes**: «¿Cómo prefieres seguir las clases?» con
      `<CamposPreferencia>` y nivel de hipoacusia, con «Lo haré después» (se completa luego en el
      perfil). Al terminar, al panel con un `<Callout>` «Todo listo».
- [ ] **T5** — Tests: API bloquea `GET /classrooms` con la bandera y lo permite tras cambiar; contraseña
      caducada → 401 con su código; misma contraseña → 400. Front: con la bandera, `/aulas` redirige a
      `/primer-ingreso`; el profesor no ve el paso 2; `axe` en los dos pasos.

## Criterios de aceptación

- [ ] **AC1** — Con una cuenta recién creada por el admin, tras el login cualquier endpoint fuera de
      la lista de T2 responde 403 `PASSWORD_CHANGE_REQUIRED`, aunque se llame directo a la API.
- [ ] **AC2** — Tras cambiar la contraseña, la temporal ya no sirve para entrar y las otras sesiones
      abiertas quedan revocadas.
- [ ] **AC3** — Una contraseña temporal con más de 7 días no permite entrar y el mensaje dice qué
      hacer.
- [ ] **AC4** — El estudiante puede terminar el primer ingreso sin declarar preferencia, y si la
      declara, el catálogo empieza a destacarle clases sin volver a entrar.
- [ ] **AC5** — `AUTH_FLOW.md` describe el estado «debe cambiar contraseña» y los endpoints permitidos.

## Fuera de alcance

- Cambiar la contraseña desde el perfil en cualquier momento (buena HU aparte; reutiliza T3).
- Tour guiado de la plataforma tras el primer ingreso.

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
