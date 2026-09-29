# HU-516 — Métricas de la academia (API)

| Campo               | Valor                                     |
| ------------------- | ----------------------------------------- |
| **Sprint**          | Post-Fase 1 · UX                          |
| **Prioridad**       | 🟡 Media                                  |
| **Estimación**      | 1.5 días                                  |
| **Estado**          | ⬜ Pendiente                              |
| **Asignada a**      | **Dev A** — backend                       |
| **Rama**            | `hu-516-metricas-de-la-academia-api-a`    |
| **Alcance técnico** | backend · types                           |
| **Depende de**      | HU-515 (bloque de valoraciones)           |
| **Labels**          | `post-fase-1` `prioridad:media` `backend` |

> **Como** administrador de la academia,
> **quiero** saber qué horarios se llenan, cuánta gente asiste y si las clases se pueden seguir,
> **para** decidir los planes de clase con datos y no a ojo.

## Contexto

El cliente todavía tiene que definir niveles, planes y clases obligatorias. Estas métricas son
**la base para esa decisión**: qué franjas y niveles tienen demanda, dónde hay ausencias y qué
modo de instrucción funciona mejor. Solo lectura, solo `ADMIN`, calculado en SQL (agregados, nada
de traer filas a memoria, como en `c88b0fa`). Las franjas horarias se agrupan en la **zona de la
academia**, no en UTC.

## Referencias

- **Archivos a tocar:** `packages/types/src/index.ts` (tipos `MetricasAcademia`,
  `MetricasQuery`), `apps/api/src/admin/admin-metricas.{controller,service}.ts` (nuevos),
  `apps/api/src/admin/dto/metricas.dto.ts`, `apps/api/src/admin/admin.module.ts`,
  `apps/api/src/config/env.schema.ts` (`ACADEMY_TIMEZONE`, por defecto `America/Bogota`).
- **Reglas:** `ARQUITECTURA.md` → «4.7 Tiempo y zonas horarias» y «4.8 Visibilidad y acciones por
  rol». Skill `bighearts-backend` → contrato de respuesta y DTOs.
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — Contrato: `GET /admin/metricas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` (fechas locales de
      la academia, inclusivas, máximo 366 días, por defecto los últimos 30). Una clase entra en el
      rango por su `scheduledAt`.
- [ ] **T2** — Resumen: clases publicadas, canceladas e impartidas (terminadas y no canceladas);
      **ocupación** de las impartidas (reservas `CONFIRMED`+`ATTENDED`+`NO_SHOW` ÷ suma de
      `maxStudents`); **asistencia** (`ATTENDED` ÷ `ATTENDED`+`NO_SHOW`); clases terminadas sin
      asistencia marcada; cancelaciones de estudiantes; estudiantes activos (≥ 1 reserva en el rango)
      y nuevos (registrados en el rango).
- [ ] **T3** — Desgloses: por **franja** (día de la semana × hora de inicio, en `ACADEMY_TIMEZONE`),
      por **nivel**, por **modo de instrucción** (incluido «sin declarar») y por **profesor**, cada
      uno con clases, ocupación y asistencia.
- [ ] **T4** — Valoraciones (HU-515): agregado global (sí / a medias / no, problemas) y los últimos
      50 comentarios con título y fecha de la clase, **sin datos del estudiante**.
- [ ] **T5** — Tests: `@Roles(ADMIN)` (estudiante y profesor → 403); rango inválido o > 366 días →
      400; una clase del lunes 19:00 hora de Colombia cae en la franja lunes-19 aunque en UTC sea
      martes 00:00; ocupación y asistencia con datos sembrados conocidos.

## Criterios de aceptación

- [ ] **AC1** — Solo `ADMIN` recibe 200. `STUDENT` y `TEACHER` reciben 403.
- [ ] **AC2** — Con un seed conocido (2 clases impartidas de cupo 10, con 5 y 7 reservas; 9
      `ATTENDED` y 3 `NO_SHOW`), la ocupación es 0.6 y la asistencia 0.75.
- [ ] **AC3** — Las franjas usan `ACADEMY_TIMEZONE`: el caso lunes 19:00 COT del T5 cae en lunes-19.
- [ ] **AC4** — Ningún campo de la respuesta identifica a un estudiante (sin nombres, ids ni correos
      de estudiantes). Los profesores sí aparecen por nombre en su desglose.
- [ ] **AC5** — La respuesta se calcula con consultas agregadas: el servicio no carga en memoria
      reservas ni aulas individuales (revisión del código, y un test con 500 reservas sembradas que
      responde en < 1 s en el Postgres de CI).

## Fuera de alcance

- La pantalla (HU-517) y la exportación a CSV, que se hace en el cliente.
- Métricas en tiempo real o caché. Si hace falta, se evalúa con datos reales.

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
