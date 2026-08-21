# HU-212 — Coherencia temporal del aula

| Campo               | Valor                                           |
| ------------------- | ----------------------------------------------- |
| **Sprint**          | Sprint 2 — Gestión de Aulas                     |
| **Prioridad**       | 🟠 Alta                                         |
| **Estimación**      | 1 día                                           |
| **Estado**          | ⬜ Pendiente                                    |
| **Rama**            | `hu-212-coherencia-temporal-del-aula-<persona>` |
| **Alcance técnico** | fullstack                                       |
| **Depende de**      | HU-201 (✅)                                     |
| **Labels**          | `sprint-2` `prioridad:alta` `fullstack`         |

> **Como** profesor,
> **Quiero** que la plataforma no me deje publicar una clase imposible,
> **Para** no descubrir el choque de horarios cuando ya tengo estudiantes esperando.

## Contexto

HU-201 valida que el horario sea futuro, que el cupo sea mayor que cero y que el enlace tenga
formato de URL. **No valida nada más**, y eso deja pasar tres cosas que no deberían existir:

1. **Un profesor puede crear dos clases suyas a la misma hora.** Nadie está en dos videollamadas a
   la vez. La regla de no-solapamiento existe en `ARQUITECTURA.md` §4.4 **solo para el estudiante**;
   quien físicamente no puede duplicarse es el profesor, y ahí no hay regla.
2. **`durationMinutes` no tiene techo.** Se puede publicar una clase de diez mil minutos.
3. **`scheduledAt` puede ser dentro de dos minutos.** Una clase creada con esa antelación rompe a la
   vez la ventana de acceso de 30 min (§4.1) y el recordatorio de 24 h (§4.6): las dos promesas
   centrales del producto quedan sin poder cumplirse.

HU-208 justifica darle el catálogo al profesor precisamente **para coordinar horarios**. Coordinar a
ojo, mirando tarjetas, no es coordinar: es esperar que no se equivoque.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.4 (no solapamiento, hoy solo del estudiante),
  §4.1 (ventana de acceso), §4.6 (recordatorios), §4.7 (`timestamptz` en UTC).
- **Skills:** `bighearts-backend` → **`reglas-reservas.md`**, que ya especifica cómo se calcula un
  solapamiento y dónde están sus bordes · `bighearts-ui` → `voz-microcopy.md`.
- **Aplica en crear y en editar.** Si solo se valida al crear, se cuela por `PATCH`.

### Decisiones tomadas (2026-08-20)

**1. El solapamiento se valida contra las clases `PUBLISHED` del propio profesor.** Las canceladas
no cuentan: un aula cancelada no ocupa a nadie.

**2. Los bordes se tratan igual que en la regla del estudiante.** Una clase que termina a las 18:00
y otra que empieza a las 18:00 **no** se solapan. El intervalo es cerrado por la izquierda y abierto
por la derecha, exactamente como en `reglas-reservas.md` §4.

**3. La antelación mínima se deriva de la ventana de acceso, no es un número suelto.** Debe ser al
menos `ACCESS_WINDOW_MINUTES`, porque por debajo de eso el enlace se revelaría en el mismo instante
en que se publica la clase. Se propone **60 minutos**, configurable por entorno.

**4. La duración máxima se propone en 240 minutos** (cuatro horas). Configurable. _Propuesta mía:
no estaba decidida en ningún sitio._

**5. El profesor puede saltarse la antelación mínima, pero no el solapamiento.** Publicar con poca
antelación es una decisión suya que solo le afecta a él; solaparse consigo mismo es imposible. La
primera es un aviso que se puede confirmar; la segunda, un error que bloquea.

## 🔧 Tasks

### Contrato — va primero

- [ ] **T1** — En `packages/types`: los códigos `TEACHER_SCHEDULE_CONFLICT` y
      `CLASSROOM_DURATION_INVALID` en `ApiErrorCode`. Luego `npm run build:types`.

### Backend

- [ ] **T2** — `CLASS_MIN_LEAD_MINUTES` (60) y `CLASS_MAX_DURATION_MINUTES` (240) en
      `config/env.schema.ts` **y** en `.env.example`, con su comentario de por qué existen.
- [ ] **T3** — Validar en `POST /classrooms` y en `PATCH /classrooms/:id` que el aula **no se
      solapa con otra `PUBLISHED` del mismo profesor**. Al editar, la propia aula se excluye de la
      comprobación. Responde `TEACHER_SCHEDULE_CONFLICT` con el título y el horario del aula que
      choca, para que el mensaje pueda ser útil.
- [ ] **T4** — Validar `durationMinutes` contra el máximo → `CLASSROOM_DURATION_INVALID`.
- [ ] **T5** — Validar la antelación mínima. **Es un aviso, no un bloqueo**: la petición se acepta
      si trae la confirmación explícita del profesor; sin ella, responde el aviso.
- [ ] **T6** — Tests: solapamiento exacto, parcial y **en el borde** (18:00 fin / 18:00 inicio, que
      **sí** debe permitirse); las canceladas no cuentan; editar un aula sin moverla no choca
      consigo misma; duración por encima del máximo; antelación por debajo del mínimo con y sin
      confirmación.

### Frontend

- [ ] **T7** — El error de solapamiento se pinta junto al campo de horario y **nombra la clase que
      choca**: `Ya tienes «Conversación cotidiana» el martes 25 a las 6:00 p. m.` Un error que no
      dice con qué chocas obliga a buscarlo a mano.
- [ ] **T8** — El aviso de poca antelación se confirma con `AlertDialog` **con verbos**:
      `Publicar de todas formas` / `Cambiar la hora`. Explica la consecuencia: los estudiantes
      recibirán el recordatorio tarde o no lo recibirán.
- [ ] **T9** — Duración con un máximo también en el control del formulario, no solo en el servidor.
- [ ] **T10** — Tests: los tres errores se pintan bajo su campo con ícono; el diálogo de
      confirmación atrapa el foco y se cierra con `Esc`; `axe` limpio.

### Documentación

- [ ] **T11** — Añadir la regla de no-solapamiento **del profesor** a `ARQUITECTURA.md` §4.4, que
      hoy solo contempla la del estudiante. Recorrer la tabla de §6 del skill `bighearts-dod`.

## ✅ Criterios de aceptación

- [ ] **AC1** — Un profesor con una clase el martes de 18:00 a 19:00 **no puede** crear otra el
      martes de 18:30 a 19:30. Responde `TEACHER_SCHEDULE_CONFLICT`.
- [ ] **AC2** — **Sí puede** crear una que empiece exactamente a las 19:00. El borde no cuenta como
      solapamiento.
- [ ] **AC3** — Una clase **cancelada** no bloquea el horario: se puede publicar otra encima.
- [ ] **AC4** — **Editar** un aula sin cambiar su horario no falla por chocar consigo misma.
- [ ] **AC5** — El error de solapamiento **nombra la clase y el horario** con los que choca, no solo
      dice que hay conflicto.
- [ ] **AC6** — Una duración por encima del máximo responde `CLASSROOM_DURATION_INVALID`, y el
      control del formulario tampoco la deja escribir.
- [ ] **AC7** — Publicar con menos de la antelación mínima **abre un diálogo de confirmación con
      verbos** que explica la consecuencia. Confirmando, se publica. Es aviso, no bloqueo.
- [ ] **AC8** — Las tres reglas se aplican **también en `PATCH`**, no solo al crear. Verificado con
      tests de backend.
- [ ] **AC9** — **Accesibilidad:** cada error junto a su campo con `aria-invalid` +
      `aria-describedby` + ícono; el diálogo atrapa el foco y se cierra con `Esc`; `axe` limpio.
- [ ] **AC10** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **Solapamiento entre profesores distintos.** Dos clases a la vez de dos profesores es normal y
  deseable.
- **No solapamiento del estudiante** → ya está en `ARQUITECTURA.md` §4.4, se implementa en Sprint 3
  con las reservas.
- **Avisar al profesor de choques con clases de otros** en el catálogo. HU-208 le da la vista para
  mirarlo; automatizarlo es otra HU.
- Sugerir huecos libres o proponer horarios alternativos.
- Límite de clases por día o por semana.

## Notas de implementación

_Se rellena al cerrar._
