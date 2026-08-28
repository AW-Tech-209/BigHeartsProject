# HU-404 — El historial de clases

| Campo               | Valor                                          |
| ------------------- | ---------------------------------------------- |
| **Sprint**          | Sprint 4 — Notificaciones e Historial          |
| **Prioridad**       | 🟠 Alta                                        |
| **Estimación**      | 2 días                                         |
| **Estado**          | ⬜ Pendiente                                   |
| **Rama**            | `hu-404-historial-de-clases-<persona>`         |
| **Alcance técnico** | fullstack                                      |
| **Depende de**      | HU-403                                         |
| **Labels**          | `sprint-4` `prioridad:alta` `fullstack` `a11y` |

> **Como** estudiante o profesor,
> **Quiero** una pantalla con las clases que ya pasaron y cómo acabaron,
> **Para** llevar seguimiento de mi actividad sin depender de mi memoria.

## Contexto

El último punto de §5.1 que queda sin construir, y el que cierra el alcance funcional de la Fase 1.

### La decisión que evita duplicar media aplicación

`/mis-clases` (HU-302) y `/mis-aulas` (HU-207) ya tienen filtro de `pasadas`. Si `/historial` se
monta encima sin más, hay dos pantallas listando lo mismo y una de las dos sobra.

**Por eso el pasado se muda.** El reparto queda así, y es la decisión **D34**:

| Pantalla                     | Qué contiene                         | Para qué se entra            |
| ---------------------------- | ------------------------------------ | ---------------------------- |
| `/mis-clases` · `/mis-aulas` | **Solo lo que está por venir**       | Prepararme para lo que viene |
| `/historial`                 | **Lo que ya pasó**, con su resultado | Consultar lo que hice        |

Los filtros `pasadas` y `canceladas` **salen** de las dos pantallas de «lo mío» y aterrizan aquí.
Cada cosa en un sitio, y las pantallas de arriba se vuelven más simples de lo que eran.

> **Nota:** esto modifica la decisión **D24** (los tres grupos disjuntos de «Mis aulas»). En esas
> pantallas quedan solo las próximas; el resto de la semántica de D24 se conserva **aquí**.

### Qué cambia según quién mira

Una sola pantalla, un endpoint por propósito, como manda §4.8:

- **Estudiante** — sus reservas pasadas, cada una con si asistió, si no asistió o si canceló.
- **Profesor** — sus aulas impartidas, con cuántos inscritos hubo y cuántos asistieron.
- **Administrador** — no entra aquí. Su supervisión (HU-210) ya le da todas las aulas, y ver el
  historial personal de nadie está sin decidir.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.8 (un endpoint por propósito; el alcance sale del token), **D24**
  (que esta HU ajusta), §4.1 regla 2 (**el `meetingLink` no viaja en ningún listado**), §7.3.
- **Skills:** `bighearts-ui` → `layout-y-composicion.md` (**filas**: se escanea para consultar, no
  para elegir) y `voz-microcopy.md` para el texto de `NO_SHOW`.
- **Reutiliza:** los listados de HU-302 y HU-207 casi enteros, `<EstadoAula>`, la paginación de
  HU-203, `<EstadoVacio>`.
- **Decisiones pendientes:** ninguna. D34 queda tomada aquí.

## 🔧 Tasks

### Contrato — va primero

- [ ] **T1** — En `packages/types`: filtros del historial y el tipo de fila para cada rol.
      **Reutiliza los items de listado existentes**; no declares tipos paralelos. Luego
      `npm run build:types`.

### Backend

- [ ] **T2** — `GET /historial` acotado **al token**, que devuelve reservas pasadas si quien pide es
      `STUDENT`, y aulas impartidas si es `TEACHER`. Filtro por resultado y por rango de fechas,
      orden descendente, paginado con el formato de HU-203.
- [ ] **T3** — El `meetingLink` **no viaja**. Es un listado, y además de clases que ya pasaron.
- [ ] **T4** — Tests: cada rol ve lo suyo; **nadie ve el historial de otro** por ningún parámetro;
      un `ADMIN` recibe `403`; `meetingLink` ausente; el orden y los filtros.

### Frontend

- [ ] **T5** — Pantalla `/historial` en filas, con su entrada en la barra de navegación. Estudiante:
      clase, fecha con zona, profesor y resultado. Profesor: clase, fecha, inscritos y asistentes.
      Los 4 estados.
- [ ] **T6** — **Quitar los filtros `pasadas` y `canceladas`** de `/mis-clases` y `/mis-aulas`, que
      pasan a mostrar solo lo próximo, con un enlace al historial (D34).
- [ ] **T7** — `NO_SHOW` se muestra con **texto neutro** —«No asististe»—, sin ícono de alerta ni
      color de error. Es un dato, no una reprimenda.

## ✅ Criterios de aceptación

- [ ] **AC1** — Un estudiante ve sus clases pasadas con su resultado: asistió, no asistió o canceló,
      cada uno con color + ícono + texto.
- [ ] **AC2** — Un profesor ve sus aulas impartidas con inscritos y asistentes.
- [ ] **AC3** — **Autorización:** el alcance sale del token; ningún parámetro devuelve el historial
      de otro, y un `ADMIN` recibe `403`. Verificado con tests.
- [ ] **AC4** — **`/mis-clases` y `/mis-aulas` ya no ofrecen `pasadas` ni `canceladas`**, y enlazan
      al historial. Ninguna clase aparece en las dos pantallas a la vez.
- [ ] **AC5** — Sin historial, la pantalla lo explica sin sonar a error. El `meetingLink` no aparece
      en la respuesta, verificado con un test.
- [ ] **AC6** — **Verificación:** `typecheck`, `lint`, `build`, `npm run test` en verde y `axe`
      limpio.

## 🚫 Fuera de alcance

- **Que el admin vea historiales ajenos.** Sin decidir, y no hace falta para la Fase 1.
- **Exportar** el historial a CSV o PDF.
- **Estadísticas**: porcentaje de asistencia, rachas, gráficas. Fase posterior.
- **Certificados** de asistencia.

## Notas de implementación

_Se rellena al cerrar._
