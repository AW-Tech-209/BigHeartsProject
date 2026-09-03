# HU-409 — Formularios de login y registro sobre la nueva identidad

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Cierre de Fase 1 · diseño                           |
| **Prioridad**       | 🟡 Media                                            |
| **Estimación**      | 1.5 días                                            |
| **Estado**          | ⬜ Pendiente                                        |
| **Rama**            | `105-hu-409-formularios-de-acceso-redisenados`      |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | HU-408                                              |
| **Labels**          | `cierre-fase-1` `prioridad:media` `frontend` `a11y` |

> **Como** persona que se registra o inicia sesión,
> **Quiero** formularios claros y coherentes con la nueva identidad,
> **Para** completarlos sin dudar.

## Contexto

Con la estructura de HU-408 en su sitio, esta HU pule los dos formularios de acceso:

1. Campos de email y contraseña con un **icono guía** dentro del control (sobre `<Input>`, que hoy
   solo soporta un `adornment` a la derecha —el ojo de mostrar/ocultar—).
2. Enlace **«¿Olvidaste tu contraseña?»** junto a la etiqueta de contraseña en login.
3. Una **pasada de microcopy** al panel de marca y a los textos de ambos formularios contra
   `voz-microcopy.md`.

La lógica de validación y de envío **no cambia**.

## Dependencias técnicas

- **Reglas implicadas:** skill `bighearts-ui` → `voz-microcopy.md`, patrón de campo accesible (§7.3),
  triple codificación. Skill `bighearts-dod` §5 (tests de formulario con teclado y `user-event`).
- **Reutiliza:** `<Field>` (prop `adornment`), `<Input>`, `<Callout>`, `<RadioCardGroup>`,
  `<NativeSelect>`, `validateLogin`, `validateRegister`, `login-error-notice`.
- **Decisiones pendientes que bloquean esta HU:** ninguna. El enlace «¿Olvidaste tu contraseña?»
  apunta a `/recuperar-contrasena` (ruta que crea **HU-411**). Coordinar el orden de merge:
  HU-411 antes o a la vez, para que el enlace no caiga en un 404 en `main`.
- **Depende de:** HU-408. **Relación con:** HU-411 (comparten la ruta de recuperación).

## 🔧 Tasks

### Frontend

- [x] **T1** — `<Input>` gana un **icono guía opcional** a la izquierda (prop `iconoInicio?:
LucideIcon`, o un `<CampoConIcono>` fino sobre `<Field>`): icono `aria-hidden`, **no** sustituye
      a la etiqueta, con padding para no solaparse con el texto. El ojo de contraseña (`adornment`)
      sigue igual.
- [x] **T2** — Login: icono de sobre en email, candado en contraseña. Enlace «¿Olvidaste tu
      contraseña?» a la derecha de la etiqueta «Contraseña», como `<Link to="/recuperar-contrasena">`,
      `text-sm`, con foco visible.
- [x] **T3** — Registro: los mismos iconos guía en email y contraseña. Revisar que la sección
      «Preferencias de accesibilidad» y el `<RadioCardGroup>` de rol encajan en el layout partido
      (ancho, aire, ritmo vertical del skill).
- [x] **T4** — Pasada de microcopy contra `voz-microcopy.md` (literal, sentence case, sin figurado):
      titular y tres propuestas de valor del `<PanelDeMarca>`, textos de ambos formularios y de
      `RegistrationResult`. Ajustar los que no cumplan.

### Documentación

- [x] **T5** — Tests: `<Input>` con icono (accesibilidad + no rompe el patrón de `<Field>`);
      recorrido con teclado del login incluyendo el enlace de recuperación (`user.tab()` llega, foco
      visible); `axe` de ambas pantallas en los tres temas.
- [x] **T6** — Docs: `voz-microcopy.md` si se fija alguna regla nueva de copy de marca;
      `bighearts-ui` si `<Input>` con icono pasa a ser patrón; `docs/historias/README.md` (estado).

## ✅ Criterios de aceptación

- [x] **AC1** — En login y registro, los campos de email y contraseña muestran un icono guía dentro
      del control; el icono es `aria-hidden` y la `<label>` visible sigue presente y asociada.
      Verificado con test de accesibilidad y a ojo.
- [x] **AC2** — En login, junto a la etiqueta «Contraseña» hay un enlace «¿Olvidaste tu
      contraseña?» que lleva a `/recuperar-contrasena`, alcanzable con `Tab` y con foco visible.
      Verificado con recorrido de teclado (`user-event`).
- [x] **AC3** — El titular y las tres propuestas de valor del panel de marca, y los textos de ambos
      formularios, cumplen `voz-microcopy.md`: español literal, sentence case, sin lenguaje
      figurado. El titular de marca queda como **única excepción** documentada en `voz-microcopy.md`
      (voz de marca, idéntico al hero de la landing).
- [x] **AC4** — La validación y el envío no cambian: los mismos errores por campo, el mismo foco al
      primer error, los mismos códigos de API. Verificado con `login-form.spec.tsx` y los tests de
      `validate-*` sin tocar su lógica.
- [x] **AC5** — `axe` limpio en login y registro en `light`, `dark` y `hc`. Cero violaciones.
- [x] **AC6** — **Verificación automática:** `typecheck`, `lint`, `build` y `npm run test` de `web`
      y `types` en verde. `api` sin cambios; su spec de integración necesita BD (lo cubre el CI).

## 🚫 Fuera de alcance

- La implementación de la recuperación de contraseña → **HU-410** (backend), **HU-411** (frontend).
  Esta HU solo pone el enlace.
- Cambios en la estructura / layout partido → **HU-408**.
- `HomePage`.

## Recorrido de acceptance criteria

| AC  | Veredicto | Cómo se comprobó                                                                                                                                                         |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1 | Cumple    | `field.spec.tsx`: `<Input iconoInicio>` conserva la etiqueta asociada y `axe` limpio. Navegador: sobre en email, candado en contraseña, ambos `aria-hidden`.             |
| AC2 | Cumple    | `login-form.spec.tsx`: el enlace tiene `href="/recuperar-contrasena"`, se alcanza con Tab (Email → enlace) y recibe foco visible.                                        |
| AC3 | Cumple    | Copy de formularios y propuestas de valor: literal, sentence case. El titular de marca se alinea con el hero de la landing y queda como excepción en `voz-microcopy.md`. |
| AC4 | Cumple    | `login-form.spec.tsx` y `validate-login.spec.ts` verdes sin tocar `validateLogin` / `validateRegister`. Suite de `web` completa (709 tests) en verde.                    |
| AC5 | Cumple    | `pages/paginas.spec.tsx` corre `axe` en Login y Register en `light` / `dark` / `hc` — cero violaciones (el ícono es `aria-hidden`).                                      |
| AC6 | Cumple    | `typecheck`, `lint` (0 errores), `build` y `test` de `web` + `types` en verde. `api` sin cambios; `bookings-index.integration.spec.ts` necesita BD (CI).                 |

## Notas de implementación

El titular del `<PanelDeMarca>` se mantiene idéntico al hero de la landing por decisión del usuario
(«alinear acceso → landing»); se documenta como única excepción a «sin lenguaje figurado» en
`voz-microcopy.md`. `<Input iconoInicio>` y `<Field labelAside>` son props nuevas mínimas.
`npm install` para traer `@fontsource/instrument-serif` (dep del merge de la landing que faltaba en
el node_modules local; no la introdujo esta HU).
