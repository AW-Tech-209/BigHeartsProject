# HU-411 — Recuperación de contraseña (pantallas)

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Cierre de Fase 1 · diseño                           |
| **Prioridad**       | 🟡 Media                                            |
| **Estimación**      | 1.5 días                                            |
| **Estado**          | ⬜ Pendiente                                        |
| **Rama**            | `hu-411-recuperacion-de-contrasena-pantallas-ana`   |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | HU-408, HU-410                                      |
| **Labels**          | `cierre-fase-1` `prioridad:media` `frontend` `a11y` |

> **Como** persona que olvidó su contraseña,
> **Quiero** una pantalla para pedir el enlace y otra para escribir la contraseña nueva,
> **Para** volver a entrar por mi cuenta.

## Contexto

Con el backend de HU-410 y el armazón de HU-408, esta HU añade las dos pantallas del diseño:

1. **«Recupera tu contraseña»** — pide el email, botón «Enviar enlace», enlace «← Volver a iniciar
   sesión».
2. **«Crea una contraseña nueva»** — se llega desde el enlace del correo con `?token=`, pide la
   contraseña nueva y la valida con la misma regla que el registro.

Ambas sobre `<LayoutAutenticacion>`.

## Dependencias técnicas

- **Reglas implicadas:** skill `bighearts-ui` (patrón de campo, los 4 estados, `voz-microcopy.md`).
  Skill `bighearts-dod` §5 (páginas montadas sobre `<AppRoutes>` cuando leen un parámetro de ruta;
  tests con `user-event`).
- **Reutiliza:** `<LayoutAutenticacion>`, `<PaginaCabecera>`, `<Field>`, `<Input>` (con icono, de
  HU-409), `<Callout>`, `<Button>`, el patrón de `useLogin` / `login.ts` para las mutaciones,
  `RedirectIfAuthenticated`.
- **Consume:** `POST /auth/forgot-password` y `POST /auth/reset-password` de HU-410, con sus
  `ApiErrorCode`.
- **Decisiones pendientes que bloquean esta HU:** ninguna, **una vez HU-410 esté mergeada** (aporta
  el contrato). Coordinar orden de merge con HU-409, que comparte la ruta `/recuperar-contrasena`.
- **Depende de:** HU-408, HU-410.

## 🔧 Tasks

### Frontend

- [ ] **T1** — Rutas públicas en `router.tsx`: `/recuperar-contrasena` (solicitar) y
      `/nueva-contrasena` (restablecer; lee `token` de la query). Ambas bajo
      `<RedirectIfAuthenticated>`, como `/login`.
- [ ] **T2** — `features/auth/api/` + hooks: `forgot-password.ts` / `reset-password.ts` y
      `use-forgot-password` / `use-reset-password` (mutations de React Query), siguiendo
      `login.ts` / `use-login.ts`.
- [ ] **T3** — `features/auth/lib/`: `validate-solicitud-recuperacion.ts` (email) y **extraer la
      regla de contraseña a una función pura compartida** que usen `validate-register` y el reset.
      Con sus `*.spec.ts` (entorno node).
- [ ] **T4** — `SolicitarRecuperacionPage`: `<PaginaCabecera titulo="Recupera tu contraseña">`,
      enlace «Volver a iniciar sesión» arriba, `<Field>` de email con icono, botón «Enviar enlace».
      Éxito: `<Callout variant="success">` que **no revela** si la cuenta existe. Los 4 estados.
- [ ] **T5** — `NuevaContrasenaPage`: lee `token`; si falta, `<Callout variant="destructive">` con
      enlace a «Recupera tu contraseña». `<Field>` de contraseña (con ojo y descripción de la regla),
      botón «Guardar contraseña nueva». Éxito → `<Callout success>` + botón «Iniciar sesión».
      `PASSWORD_RESET_TOKEN_INVALID` / `EXPIRED` → mensaje que explica y ofrece pedir otro enlace.

### Documentación

- [ ] **T6** — Tests: las dos páginas montadas sobre `<AppRoutes>` (una lee query param) — un
      `<h1>`, foco al montar, `axe` en los tres temas; recorrido de teclado de ambos formularios con
      `user-event`; validación de contraseña (función pura) con su `*.spec.ts`.
- [ ] **T7** — Docs: `AUTH_FLOW.md` (lado cliente; coordinar con HU-410). `bighearts-ui` si aparece
      patrón nuevo. `docs/historias/README.md`. Actualizar `login-error-notice.ts` para que, además
      de soporte, mencione la opción de recuperar la contraseña.

## ✅ Criterios de aceptación

- [ ] **AC1** — `/recuperar-contrasena` muestra la pantalla del diseño (sobre el layout partido, con
      «Volver a iniciar sesión»), envía a `POST /auth/forgot-password` y, en éxito, muestra un
      `<Callout>` que **no revela** si el email existía. Un `<h1>` «Recupera tu contraseña», foco al
      montar, `axe` limpio en los tres temas.
- [ ] **AC2** — `/nueva-contrasena?token=…` con token presente muestra el formulario de contraseña
      nueva; al enviarlo con éxito muestra confirmación y un botón «Iniciar sesión». Sin `token` en
      la URL, muestra un aviso que explica y enlaza a pedir otro. Un `<h1>`, foco, `axe` limpio en
      los tres temas.
- [ ] **AC3** — **Errores:** `PASSWORD_RESET_TOKEN_INVALID` o `PASSWORD_RESET_TOKEN_EXPIRED` del
      servidor → mensaje que explica qué pasó y ofrece volver a «Recupera tu contraseña» (no un
      error genérico). Contraseña que no cumple la regla → error junto al campo, con icono, foco al
      campo. Verificado con respuestas mockeadas.
- [ ] **AC4** — La regla de la contraseña nueva es **la misma** que la del registro, extraída a una
      función pura compartida con su test. `validate-register` la sigue usando sin cambiar su
      comportamiento.
- [ ] **AC5** — Ambos formularios se recorren completos con teclado (`user-event`, no `fireEvent`),
      con foco visible, y se consultan por rol y etiqueta (cero `data-testid`). Los 4 estados
      presentes en cada pantalla.
- [ ] **AC6** — **Verificación automática:** `typecheck`, `lint`, `build` y `npm run test` (los tres
      workspaces) en verde.

## 🚫 Fuera de alcance

- El backend → **HU-410**.
- Auto-login tras restablecer (se manda a `/login`).
- `HomePage`.

## Notas de implementación

Sin desviaciones previstas.
