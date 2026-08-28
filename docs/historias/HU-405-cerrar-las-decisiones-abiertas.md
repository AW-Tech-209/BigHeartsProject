# HU-405 — Cerrar las decisiones abiertas de la Fase 1

| Campo               | Valor                                             |
| ------------------- | ------------------------------------------------- |
| **Sprint**          | Sprint 4 — Notificaciones e Historial             |
| **Prioridad**       | 🟡 Media (deuda de decisiones, no de código)      |
| **Estimación**      | 0.5 días                                          |
| **Estado**          | ⬜ Pendiente                                      |
| **Rama**            | `hu-405-cerrar-las-decisiones-abiertas-<persona>` |
| **Alcance técnico** | backend · documentación                           |
| **Depende de**      | ninguna                                           |
| **Labels**          | `sprint-4` `prioridad:media` `backend` `infra`    |

> **Como** equipo,
> **Quiero** que §14.6 quede vacía y que no haya módulos que prometen algo que no existe,
> **Para** entregar la Fase 1 sin preguntas colgando de la sesión anterior.

## Contexto

`ARQUITECTURA.md` §14.6 se llama «Pendiente de tu revisión» y lleva **cuatro puntos abiertos desde
el primer día**. Ninguno bloquea nada hoy, y por eso llevan cuatro sprints sin resolverse: cada
sesión los lee, comprueba que no le afectan y sigue. Es deuda barata que se paga una vez y deja de
cobrarse.

`SessionsModule` es el caso más claro: un módulo NestJS **vacío**, con un `TODO`, registrado en la
aplicación desde el Sprint 0. Quien abre el proyecto ve un módulo de sesiones y asume que las
sesiones son un concepto del dominio. No lo son: `Booking` lleva el resultado (`ATTENDED`,
`NO_SHOW`) y `Classroom` lleva horario y duración. Una entidad `Session` duplicaría las dos sin
añadir nada.

### Los cuatro puntos, con su salida

| #   | Punto abierto                      | Qué se hace                                                                                                                                                                |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `SessionsModule` sin entidad       | **Se borra** (D35). Lo que iba a guardar ya lo guardan `Booking` y `Classroom`.                                                                                            |
| 2   | Umbral de `ultimos-cupos` en 3     | **Se confirma** y se sube a `ARQUITECTURA.md` como decisión, no como propuesta. Lleva cuatro sprints funcionando.                                                          |
| 3   | Ubicación de `derivarEstadoAula()` | **Se confirma**: vive en `@academia/types` y es lo que impide que back y front se contradigan. Ya se materializó en HU-203.                                                |
| 4   | Formato de paginación              | **Se confirma** `{ items, total, page, pageSize }`, `pageSize` 20. Es el que usan HU-203, HU-207, HU-210, HU-302 y HU-404. Ya es el estándar de facto; solo falta decirlo. |

Tres de los cuatro son **confirmar lo que ya se hizo**. El trabajo real es el primero.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §14.6 (los cuatro puntos), §6.1 (la tabla de módulos), §7.3.
- **Archivos:** `apps/api/src/sessions/`, `apps/api/src/app.module.ts`, `docs/ARQUITECTURA.md`.
- **Decisiones pendientes:** las cuatro de la tabla. **Esta HU existe para cerrarlas.**

## 🔧 Tasks

### Backend

- [ ] **T1** — Borrar `apps/api/src/sessions/` y quitar `SessionsModule` de `app.module.ts`.
      Comprobar que **nada más lo importa**.
- [ ] **T2** — Comprobar que el formato de paginación es **el mismo** en los cinco endpoints que
      paginan. Si alguno se desvió, alinearlo. Si ninguno, decirlo en las notas.

### Documentación

- [ ] **T3** — Registrar **D35** (se borra `SessionsModule`, con el porqué) y convertir los puntos
      2, 3 y 4 de §14.6 en decisiones confirmadas, en su sección correspondiente.
- [ ] **T4** — **Vaciar §14.6**, dejando solo la línea que diga que no queda ninguna decisión
      abierta de la Fase 1. Es lo que hace verificable el cierre.
- [ ] **T5** — Quitar `sessions` de la tabla de módulos de §6.1 y de la estructura que describe
      `CLAUDE.md`.

## ✅ Criterios de aceptación

- [ ] **AC1** — `apps/api/src/sessions/` **no existe**, `SessionsModule` no aparece en ningún
      import, y la aplicación arranca igual.
- [ ] **AC2** — **§14.6 no tiene ningún punto abierto**: los cuatro están resueltos o convertidos en
      decisión registrada.
- [ ] **AC3** — Los cinco endpoints paginados devuelven **el mismo formato**, verificado leyéndolos,
      no suponiéndolo.
- [ ] **AC4** — `sessions` no aparece ya ni en §6.1 ni en la estructura de `CLAUDE.md`.
- [ ] **AC5** — **Verificación:** `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Reabrir** las decisiones que se confirman. Llevan cuatro sprints funcionando; confirmarlas es
  escribir lo que ya es cierto.
- **Cambiar** el umbral de cupos o el formato de paginación. Se documentan, no se tocan.
- Revisar las decisiones ya cerradas (D1–D34).

## Notas de implementación

_Se rellena al cerrar._
