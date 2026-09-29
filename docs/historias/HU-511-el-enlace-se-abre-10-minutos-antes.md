# HU-511 — El enlace se abre 10 minutos antes, no 30

| Campo               | Valor                                                 |
| ------------------- | ----------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · UX                                      |
| **Prioridad**       | 🔴 Crítica                                            |
| **Estimación**      | 1.5 días                                              |
| **Estado**          | ✅ Hecha                                              |
| **Asignada a**      | **Dev A** — fullstack (toca una regla de negocio)     |
| **Rama**            | `hu-511-el-enlace-se-abre-10-minutos-antes-a`         |
| **Alcance técnico** | fullstack · docs                                      |
| **Depende de**      | ninguna                                               |
| **Labels**          | `post-fase-1` `prioridad:critica` `fullstack` `regla` |

> **Como** estudiante con reserva,
> **quiero** que el enlace se abra 10 minutos antes de la clase,
> **para** no entrar a una sala vacía y esperar media hora a que llegue el profesor.

## Contexto

Con 30 minutos de ventana, el estudiante entra, no hay nadie y cree que se equivocó de sala. 10
minutos alcanzan para acomodarse y encender la cámara. **Cambia una regla de negocio** (§4.1, no
negociable 1 de `CLAUDE.md`), así que es decisión nueva **D46**. El recordatorio «30 min» existe
porque coincide con la apertura del enlace (§4.6): **se mueve con ella y pasa a ser a los 10 min**.
Ahora su nombre mentiría, así que se renombra.

## Referencias

- **Archivos a tocar:** `packages/types/src/estado-aula.ts` (`ACCESS_WINDOW_MINUTES_DEFAULT`),
  `packages/types/src/index.ts` (comentarios), `apps/api/src/config/env.schema.ts`,
  `apps/api/.env.example`, `apps/api/src/reminders/reminders.service.ts`,
  `apps/api/src/notifications/{notification.service,notification-templates}.ts`,
  `apps/api/prisma/schema.prisma` + migración nueva, `apps/web/src/features/aulas/**`,
  `apps/web/src/features/landing/{components,lib}/**`, `apps/web/src/components/layout/panel-de-marca.tsx`.
- **Docs y skills:** `CLAUDE.md` (no negociable 1), `docs/ARQUITECTURA.md` → «4.1 La ventana de
  acceso al enlace» y «4.6 Notificaciones», `docs/DEFINICION_PROYECTO.md` → «4.1», «4.3», «5.1»,
  `docs/BigHearts-Marca-y-Producto.md` → «Parte V» y «Parte VI», `.claude/skills/bighearts-backend/{SKILL,reglas-reservas,contrato-api}.md`,
  `.claude/skills/bighearts-ui/patrones-dominio.md`.
- **Ojo con los falsos positivos al buscar «30»:** `PASSWORD_RESET_EXPIRY_MINUTES=30`,
  `RETENCION_TOKENS_DIAS = 30` y «1 hora 30 minutos» de `horario.ts` **no se tocan**.
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — Contrato y configuración: `ACCESS_WINDOW_MINUTES_DEFAULT = 10`, `.env.example` a
      `ACCESS_WINDOW_MINUTES=10`, y los comentarios que dicen «30» pasan a nombrar la constante. El
      `refine` `CLASS_MIN_LEAD_MINUTES >= ACCESS_WINDOW_MINUTES` se queda como está (60 ≥ 10).
- [x] **T2** — Recordatorio: `BOOKING_REMINDER_30M` → `BOOKING_REMINDER_ACCESO` y
      `reminder30mSentAt` → `reminderAccesoSentAt`, con una migración `RENAME COLUMN` (sin perder
      datos; los índices parciales de `20260908000000` siguen valiendo). La plantilla dice «Tu clase
      empieza en 10 minutos. Ya puedes entrar».
- [x] **T3** — Frontend: todo el copy de producto (detalle, `<AccionEntrarAClase>`, estados de aula,
      panel de marca, landing: `fases-acceso.ts`, `seccion-acceso`, `seccion-pasos`,
      `seccion-reglas`, `seccion-como-es-una-clase`, `seccion-problema`) dice 10 minutos. Si el
      número se muestra, sale de la constante y no de un literal.
- [x] **T4** — Docs y skills de la lista de referencias: 30 → 10, y la fila **D46** en la tabla de
      decisiones de `ARQUITECTURA.md` §2 con el porqué (sala vacía).
- [x] **T5** — Tests: se actualizan los que fijaban 30. Uno nuevo en `derivarEstadoAula`: a 11 min
      del inicio sigue cerrado, a 10 min está abierto. Uno en el servicio de aulas: el enlace no
      viaja a 11 min y sí a 10.

## Criterios de aceptación

- [x] **AC1** — Con reserva `CONFIRMED`, `GET /classrooms/:id` **no incluye** `meetingLink` a 11
      minutos del inicio y **sí lo incluye** a 10, con `ACCESS_WINDOW_MINUTES` sin definir en el
      entorno.
- [x] **AC2** — El recordatorio se envía una sola vez por reserva cuando faltan ≤ 10 minutos, se
      llama `BOOKING_REMINDER_ACCESO` y su asunto dice «10 minutos». La migración conserva las marcas
      ya escritas.
- [x] **AC3** — `grep -rnE "30 ?min|30 minutos|treinta minutos" apps/web/src apps/api/src packages/types/src`,
      fuera de specs, no encuentra **ninguna** mención a la ventana de acceso ni al recordatorio.
- [x] **AC4** — `CLAUDE.md`, `ARQUITECTURA.md`, `DEFINICION_PROYECTO.md`, el documento de marca y los
      skills dicen 10 minutos, y D46 está registrada.
- [x] **AC5** — La cuenta atrás de `<AccionEntrarAClase>` («Se abre a las …») muestra la hora de
      inicio menos 10 minutos.

## Fuera de alcance

- Un tercer recordatorio a los 30 min («prepárate»). Si hace falta, será otra HU.
- La ventana de cancelación (60 min). No cambia.

## Notas de implementación

- El copy y el asunto del correo salen de `ACCESS_WINDOW_MINUTES_DEFAULT`; la cuenta atrás usa `accessOpensAt` del servidor. D46 va en §2 (la tabla viva de decisiones es §15; D41–D45 no están en `ARQUITECTURA.md`).
- `seed-demo`: EMPIEZA_PRONTO a +9, EN_CURSO a −37 y LLEGUE_TARDE a −100 para no solapar reservas del alumno demo.
- **Operativo:** aplicar la migración `20260928000000_reminder_acceso` en Supabase y revisar `ACCESS_WINDOW_MINUTES` en Render (10 o sin definir).
