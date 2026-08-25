# HU-213 — Duplicar un aula

| Campo               | Valor                                   |
| ------------------- | --------------------------------------- |
| **Sprint**          | Sprint 2 — Gestión de Aulas             |
| **Prioridad**       | 🟡 Media                                |
| **Estimación**      | 0.5 días                                |
| **Estado**          | ⬜ Pendiente                            |
| **Rama**            | `hu-213-duplicar-un-aula-<persona>`     |
| **Alcance técnico** | frontend                                |
| **Depende de**      | HU-201 (✅), HU-207, HU-211             |
| **Labels**          | `sprint-2` `prioridad:media` `frontend` |

> **Como** profesor,
> **Quiero** crear una clase nueva a partir de otra que ya publiqué,
> **Para** no rellenar el mismo formulario entero cada semana.

## Contexto

[`DEFINICION_PROYECTO.md` §8.2](../DEFINICION_PROYECTO.md#82-riesgos-y-supuestos-a-vigilar) declara
un riesgo:

> _"Si el profesor percibe la plataforma como más trabajo que WhatsApp, no la usará. La creación de
> un aula debe ser rápida y evidente."_

Hoy un profesor que da «Conversación cotidiana» todos los martes rellena, cada semana: título,
descripción, nivel, fecha, hora, duración, cupo, modos de comunicación, apoyos, plataforma **y
vuelve a pegar el enlace de Zoom**. En WhatsApp reenvía un mensaje.

Las **aulas recurrentes están fuera de Fase 1** por decisión tomada
([`ARQUITECTURA.md` §7.2](../ARQUITECTURA.md), `isRecurring` es una columna sin lógica). Duplicar da
buena parte de ese alivio sin reabrir esa decisión: no crea series, no genera instancias, no añade
ni un campo al modelo.

## Dependencias técnicas

- **Skills:** `bighearts-ui` → `voz-microcopy.md` (el verbo y la confirmación).
- **Reutiliza:** el formulario de HU-201 **entero**, tal cual. Esta HU es una ruta y un precargado.
- **No toca el backend.** Duplicar es abrir el formulario de creación con valores iniciales; el
  `POST /classrooms` que ya existe hace el resto.
- **Después de HU-211**, para que los campos de accesibilidad se copien también. Si va antes, se
  copiaría un aula a medias y habría que volver.

### Decisiones tomadas (2026-08-20)

**1. La fecha y la hora se copian vacías.** Todo lo demás se precarga. Copiar la fecha invita a
publicar por error una clase en el pasado, o duplicada en el mismo horario —que HU-212 rechazaría
igualmente—. Vaciarla obliga al único dato que de verdad cambia entre semanas.

**2. El enlace de la reunión sí se copia.** Es lo más tedioso de volver a pegar y en la práctica
suele ser el mismo enlace recurrente de Zoom o Meet. El profesor puede cambiarlo antes de publicar.

**3. No es un endpoint: es una ruta del formulario.** `/mis-aulas/nueva?desde=<id>`. Sin lógica de
servidor nueva, sin tipo nuevo, sin nada que mantener aparte.

**4. Se llama «Duplicar clase», no «Copiar».** El verbo describe el resultado. `voz-microcopy.md`
pide el mismo verbo en todo el flujo: el botón dice `Duplicar clase` y el título de la pantalla
resultante dice `Duplicar «Conversación cotidiana»`.

## 🔧 Tasks

### Frontend

- [x] **T1** — Acción `Duplicar clase` en el detalle del aula (HU-204), visible **solo para el
      profesor dueño**. No en la tarjeta del listado: multiplicarla por seis tarjetas rompe la regla
      de una acción primaria por pantalla.
- [x] **T2** — Ruta `/mis-aulas/nueva?desde=<id>`: carga el aula origen y precarga el formulario con
      todos sus campos **excepto fecha y hora**.
- [x] **T3** — La cabecera de la pantalla dice de dónde viene: `Duplicar «Conversación cotidiana»`.
      El profesor tiene que saber que no está editando la original.
- [x] **T4** — El foco entra en el campo de fecha al cargar, que es el único vacío y el único que
      hay que rellenar.
- [x] **T5** — Si el `id` de origen no existe o no es del profesor, la pantalla cae al formulario
      vacío con un aviso, **no a un error**: duplicar algo que ya no está no debería bloquear crear.
- [x] **T6** — Tests: los campos se precargan; fecha y hora llegan vacías; el foco entra en fecha;
      un `id` ajeno no precarga nada; la acción no aparece para quien no es el dueño; `axe` limpio.

### Documentación

- [x] **T7** — Recorrer la tabla de §6 del skill `bighearts-dod`.

## ✅ Criterios de aceptación

- [x] **AC1** — Desde el detalle de un aula propia, `Duplicar clase` abre el formulario de creación
      con **título, descripción, nivel, duración, cupo, enlace, plataforma, modos de comunicación y
      apoyos** ya rellenos.
- [x] **AC2** — **La fecha y la hora llegan vacías**, y el formulario no se puede enviar sin ellas.
- [x] **AC3** — El foco está en el campo de fecha al cargar la pantalla.
- [x] **AC4** — La cabecera nombra el aula de origen, de forma que se distingue de una edición.
- [x] **AC5** — Publicar crea un aula **nueva**: la original no se modifica ni desaparece.
- [x] **AC6** — La acción **no aparece** para un profesor que no es el dueño, ni para estudiantes,
      ni para el administrador.
- [x] **AC7** — Un `?desde=` con un `id` inexistente o ajeno abre el formulario **vacío con un
      aviso**, no una pantalla de error.
- [ ] **AC8** — **Accesibilidad:** la pantalla se completa solo con teclado, el cambio de contexto
      se anuncia por región viva, `axe` limpio, y revisado **a ojo en el navegador** en `.dark` y `.hc` (jsdom no calcula CSS de verdad: eso no se testea).
- [x] **AC9** — **Verificación automática:** `typecheck`, `lint`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **Aulas recurrentes.** Sigue fuera de Fase 1. Esto no crea series ni instancias.
- **Duplicar varias a la vez** o generar N semanas de golpe.
- **Duplicar el aula de otro profesor.**
- Plantillas de aula guardadas y reutilizables.
- Copiar reservas o inscritos: se duplica la clase, no su gente.

## Notas de implementación

Un id ajeno o de red (no solo 404) también cae al formulario vacío con aviso: bloquear crear por un
fallo transitorio del origen sería peor que el rodeo. `Duplicar clase` se ofrece incluso sobre un
aula cancelada o ya iniciada, a diferencia de Editar/Cancelar — es el caso de uso real (la clase de
la semana pasada).
