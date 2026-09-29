# HU-512 — Guía «Antes de entrar» según la plataforma de la clase

| Campo               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| **Sprint**          | Post-Fase 1 · UX                                 |
| **Prioridad**       | 🟠 Alta                                          |
| **Estimación**      | 1 día                                            |
| **Estado**          | ⬜ Pendiente                                     |
| **Asignada a**      | **Dev B** — frontend                             |
| **Rama**            | `hu-512-guia-antes-de-entrar-b`                  |
| **Alcance técnico** | frontend                                         |
| **Depende de**      | HU-511 (el copy menciona los 10 minutos)         |
| **Labels**          | `post-fase-1` `prioridad:alta` `frontend` `a11y` |

> **Como** estudiante sordo con una clase reservada,
> **quiero** saber antes de entrar cómo fijar al intérprete y activar los subtítulos en la
> plataforma de mi clase,
> **para** no perder los primeros minutos buscando botones mientras la clase ya empezó.

## Contexto

El aula ya declara `meetingProvider` (Zoom, Meet, Teams) e `instructionMode`, pero la plataforma no
le dice al estudiante **qué hacer con eso** al entrar. Lo que más falla: el intérprete queda en un
cuadro pequeño, o los subtítulos están apagados. Es contenido fijo, no necesita backend: se elige
según `meetingProvider` y los pasos de «fijar video» se adaptan al `instructionMode` (al intérprete
si es `INTERPRETE_LSC`, al profesor si es `LSC_NATIVA`).

## Referencias

- **Archivos a tocar:** `apps/web/src/features/aulas/lib/guia-plataforma.ts` (nuevo),
  `apps/web/src/features/aulas/components/guia-antes-de-entrar.tsx` (nuevo),
  `apps/web/src/pages/AulaDetallePage.tsx`,
  `apps/web/src/features/aulas/components/accion-entrar-a-clase.tsx`.
- **Reglas:** `ARQUITECTURA.md` → «4.9 Accesibilidad declarada del aula». Skill `bighearts-ui` →
  `voz-microcopy.md` (literal, voz activa) y `patrones-dominio.md`.
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — `guia-plataforma.ts`: pasos por proveedor (`ZOOM`, `GOOGLE_MEET`, `MICROSOFT_TEAMS`,
      y `MANUAL` genérico). Cada guía cubre: activar subtítulos, fijar/anclar el video correcto
      según `instructionMode`, vista de galería o de orador, y probar la cámara. Los nombres de los
      botones se escriben **como aparecen hoy en la interfaz en español** de cada plataforma
      (verificado a mano en las tres, y la fecha de verificación queda en un comentario).
- [x] **T2** — `<GuiaAntesDeEntrar>`: pasos numerados (`<ol>`), cada uno con ícono y texto, dentro
      de un bloque desplegable con título «Antes de entrar a {plataforma}». Los nombres de los
      botones de la plataforma van en `<strong>`.
- [x] **T3** — Detalle del aula: se muestra al estudiante con reserva `CONFIRMED` **siempre**, no
      solo en la ventana, para que pueda prepararse. **Abierto por defecto** cuando el acceso ya se
      abrió; cerrado antes de eso.
- [x] **T4** — `<AccionEntrarAClase>`: junto al botón de entrar, un enlace «Cómo ver bien al
      intérprete» (o «al profesor») que lleva al bloque del detalle.
- [x] **T5** — Tests: la guía de un aula de Zoom con intérprete habla de fijar al intérprete; la de
      Meet con LSC nativa habla de fijar al profesor; sin reserva no aparece; `axe` limpio.

## Criterios de aceptación

- [x] **AC1** — Para cada uno de los 4 valores de `meetingProvider` la guía tiene contenido propio,
      y el título nombra la plataforma («Antes de entrar a Zoom»). `MANUAL` dice «tu plataforma».
- [x] **AC2** — Con `INTERPRETE_LSC` el paso de fijar video dice «intérprete»; con `LSC_NATIVA` dice
      «profesor». Con modo sin declarar dice «la persona que signa».
- [x] **AC3** — Un estudiante sin reserva, el profesor y el admin **no** ven la guía.
- [x] **AC4** — Con el acceso abierto el bloque llega desplegado; antes llega plegado y se abre con
      teclado (Enter/Espacio) y se anuncia su estado (`aria-expanded`).
- [x] **AC5** — Si el aula declara el apoyo `LIVE_CAPTIONS`, el paso de subtítulos va **primero**.

## Fuera de alcance

- Capturas o GIF de cada plataforma. Buena mejora siguiente; aquí basta el texto.
- Videos en LSC con la explicación (depende de que el profe los grabe).

## Notas de implementación

T1 abierta: los nombres de los botones están escritos de memoria; falta verificarlos a mano en Zoom, Meet y Teams y anotar la fecha en `guia-plataforma.ts`.
La guía no se pinta en clases finalizadas. `DAILY` (heredado) usa la guía genérica de `MANUAL`.
