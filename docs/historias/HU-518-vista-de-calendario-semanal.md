# HU-518 — Vista de calendario semanal

| Campo               | Valor                                              |
| ------------------- | -------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · UX                                   |
| **Prioridad**       | 🟡 Media                                           |
| **Estimación**      | 2 días                                             |
| **Estado**          | ✅ Hecha                                           |
| **Asignada a**      | **Dev A** (T1) · **Dev B** (T2–T6)                 |
| **Rama**            | `hu-518-vista-de-calendario-semanal-a` / `-b`      |
| **Alcance técnico** | fullstack (backend mínimo)                         |
| **Depende de**      | ninguna                                            |
| **Labels**          | `post-fase-1` `prioridad:media` `fullstack` `a11y` |

> **Como** estudiante o profesor,
> **quiero** ver mis clases de la semana en un calendario,
> **para** entender mi semana de un vistazo en vez de leer una lista.

## Contexto

«Mis clases» y «Mis aulas» son listas paginadas: sirven para buscar una clase, pero no para
responder «¿qué tengo el jueves?». Se añade una vista **Semana** a las dos pantallas, sin
reemplazar la lista. Es de solo lectura (no se arrastra ni se crea nada desde el calendario), así
que se construye con CSS grid y **sin librería de calendario**. En móvil una rejilla de 7 columnas
no se lee: allí la semana se muestra como agenda día por día.

## Referencias

- **Archivos a tocar:** `packages/types/src/index.ts` (`MisReservasQuery`, `MisAulasQuery`),
  `apps/api/src/bookings/dto/list-mis-reservas.dto.ts`, `apps/api/src/classrooms/dto/list-mis-aulas.dto.ts`
  y sus servicios, `apps/web/src/features/calendario/` (nuevo), `apps/web/src/pages/MisClasesPage.tsx`,
  `apps/web/src/pages/MisAulasPage.tsx`, `apps/web/src/features/aulas/lib/horario.ts`.
- **Reglas:** `ARQUITECTURA.md` → «4.7 Tiempo y zonas horarias». Skill `bighearts-ui` →
  `patrones-dominio.md` (riel de estado, `<EstadoAula>`) y `layout-y-composicion.md`.
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — API: `desde` y `hasta` (ISO, opcionales, juntos, rango ≤ 42 días) en
      `GET /bookings/mias` y en el listado de «Mis aulas». Con rango, devuelven **todo** lo que
      empieza dentro de él, sin paginar, ordenado por `scheduledAt`. Sin rango, el comportamiento
      actual no cambia.
- [x] **T2** — Selector de vista «Lista | Semana» en «Mis clases» y «Mis aulas», con la vista y la
      semana en la URL (`?vista=semana&semana=2026-09-28`). Por defecto, la lista (no cambia lo que ya
      conocen).
- [x] **T3** — `<CalendarioSemana>` en escritorio: 7 columnas (lunes a domingo) con las horas que
      tienen clases. Cada clase es un **enlace** al detalle con hora, título, riel de estado y
      `<ModoInstruccion>` compacto. «Hoy» se marca con texto, no solo con color.
- [x] **T4** — En móvil (`useEsMovil`): agenda por día, con los días sin clases plegados en «Sin
      clases». Mismo componente de evento.
- [x] **T5** — Navegación: «Semana anterior», «Esta semana», «Semana siguiente», y encabezado con el
      rango y la zona («del 28 de sep. al 4 de oct. · hora de Colombia»). Al cambiar de semana, se
      anuncia el nuevo rango (`aria-live`) sin mover el foco.
- [x] **T6** — Tests: la API filtra por rango y sin rango pagina como antes; el evento es un enlace
      con la hora y el título en su nombre; la navegación cambia la URL; en móvil se ve la agenda;
      `axe` limpio.

## Criterios de aceptación

- [x] **AC1** — `GET /bookings/mias?desde=…&hasta=…` devuelve solo las reservas del estudiante que
      empiezan en el rango, sin paginar. Un rango > 42 días o con solo uno de los dos extremos → 400.
- [x] **AC2** — En la vista Semana, cada clase aparece en el día y la hora locales correctos (una
      clase a las 00:30 UTC del martes aparece el lunes a las 19:30 en hora de Colombia).
- [x] **AC3** — Cada clase del calendario se alcanza con Tab y su nombre accesible incluye día, hora
      y título. Enter lleva al detalle.
- [x] **AC4** — Vista y semana sobreviven a recargar la página, y el botón «atrás» vuelve a la semana
      anterior que se estaba viendo.
- [x] **AC5** — A 375 px se muestra la agenda por días y no hay scroll horizontal.

## Fuera de alcance

- Vista de calendario del **catálogo** (clases disponibles). Buena siguiente HU, con el mismo
  componente.
- Vista mensual, arrastrar para mover una clase, crear desde el calendario.
- Exportar a Google Calendar o `.ics`.

## Notas de implementación

Las reservas canceladas llegan en el rango pero la vista Semana no las pinta (como «Mis clases»).
La semana se agrupa por hora del navegador; el rótulo «hora de Colombia» sale de `Intl`, no está fijo.
`npm run build` del API sigue fallando por tipos previos de `admin-metricas.service.ts`.
