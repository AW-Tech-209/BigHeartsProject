# HU-514 — Botón «¿Necesitas ayuda?» siempre a mano

| Campo               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| **Sprint**          | Post-Fase 1 · UX                                 |
| **Prioridad**       | 🟠 Alta                                          |
| **Estimación**      | 0.5 días                                         |
| **Estado**          | ✅ Hecha                                         |
| **Asignada a**      | **Dev B** — frontend                             |
| **Rama**            | `hu-514-boton-necesitas-ayuda-b`                 |
| **Alcance técnico** | frontend                                         |
| **Depende de**      | ninguna                                          |
| **Labels**          | `post-fase-1` `prioridad:alta` `frontend` `a11y` |

> **Como** estudiante o profesor que se atascó,
> **quiero** un botón de ayuda visible en toda la plataforma que me lleve a un canal escrito,
> **para** resolverlo sin tener que llamar a nadie.

## Contexto

Hoy quien se atasca no tiene a quién escribir desde la plataforma. Para una persona sorda **el
canal no puede ser una llamada**. WhatsApp es donde la comunidad ya está cómoda (texto, notas de
video en señas). El botón abre un panel con WhatsApp y correo. El mensaje de WhatsApp llega
**prellenado con el contexto** (pantalla y clase) para que no haya que explicar dónde se está.

## Referencias

- **Archivos a tocar:** `apps/web/src/components/layout/boton-ayuda.tsx` (nuevo),
  `apps/web/src/components/layout/app-shell.tsx`, `apps/web/src/components/layout/layout-autenticacion.tsx`,
  `apps/web/.env.example`, el esquema Zod de entorno del web (donde se valida `VITE_API_URL`).
- **Reglas:** skill `bighearts-ui` → «Accesibilidad» y `voz-microcopy.md`. Prohibido «sonido como
  señal», y por extensión: **ningún teléfono de voz como canal de ayuda**.
- **Decisiones pendientes:** el **número de WhatsApp y el correo de soporte**, y quién atiende.
  El código no espera por esto: van por variable de entorno.

## Tasks

- [x] **T1** — Entorno: `VITE_SUPPORT_WHATSAPP` (solo dígitos con indicativo, p. ej. `573001234567`)
      y `VITE_SUPPORT_EMAIL`, las dos opcionales y validadas en el esquema Zod. Si no hay ninguna, el
      botón no se renderiza (nunca un botón que no lleva a ningún sitio).
- [x] **T2** — `<BotonAyuda>`: botón con ícono `LifeBuoy` y el texto «¿Necesitas ayuda?», en la barra
      del shell (en móvil, dentro del menú y también fijo al pie del panel) y en el layout de
      autenticación (login, registro, recuperación).
- [x] **T3** — Al pulsarlo se abre un diálogo con: «Escríbenos por WhatsApp» (enlace `wa.me`),
      «Escríbenos un correo» (`mailto:`) y una línea que diga en qué horario se responde (texto
      fijo, en constante).
- [x] **T4** — Mensaje prellenado (`?text=`): «Hola, necesito ayuda en BigHearts. Estoy en: {nombre
      de la pantalla}{ · Clase: título, si la hay}». Sin correo, sin id ni datos de accesibilidad.
- [x] **T5** — Tests: sin variables no hay botón; con WhatsApp el enlace lleva el texto codificado
      con el nombre de la pantalla; el diálogo se abre y cierra con teclado; `axe` limpio.

## Criterios de aceptación

- [x] **AC1** — El botón es visible en todas las pantallas con sesión y en las de autenticación,
      en escritorio y a 375 px, con área táctil ≥ 44 px.
- [x] **AC2** — El enlace de WhatsApp es `https://wa.me/<número>?text=<texto>` con el nombre de la
      pantalla actual, y en el detalle de un aula incluye el título de la clase.
- [x] **AC3** — El mensaje prellenado **no incluye** correo, id de usuario, nivel de hipoacusia ni
      preferencias (verificado en el test sobre el `href`).
- [x] **AC4** — Sin `VITE_SUPPORT_WHATSAPP` ni `VITE_SUPPORT_EMAIL` el botón no aparece. Con solo una,
      el diálogo muestra solo esa opción.
- [x] **AC5** — Los enlaces externos abren en pestaña nueva con `rel="noopener noreferrer"` y lo
      dicen en su nombre accesible («se abre en otra pestaña»).

## Fuera de alcance

- Chat propio, tickets o centro de ayuda con artículos.
- Botón en la landing pública (se puede añadir luego con el mismo componente).

## Notas de implementación

- No existía esquema Zod en el web: T1 se resolvió con `lib/soporte.ts` (validación manual, valor inválido = ausente).
- Móvil: sin menú (el shell no tiene cajón), el botón va fijo sobre la barra inferior. Horario en `HORARIO_DE_SOPORTE` es provisional: confirmar con quien atiende. Definir las dos variables en Vercel.
