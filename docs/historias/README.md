# Historias de Usuario

Aquí viven las HUs **versionadas en el repo**, para que Claude Code las lea como archivos en vez de
que se le peguen a mano en el chat.

## Convención de nombre

```
HU-XXX-slug-corto.md
```

- `XXX` — tres dígitos, con la numeración por sprint que ya usa el proyecto:
  `0XX` fundación técnica · `1XX` autenticación y usuarios · `2XX` aulas · `3XX` reservas ·
  `4XX` notificaciones e historial.
- `slug-corto` — en español, en minúsculas, con guiones. Tres o cuatro palabras: describe la HU,
  no la repite entera.

Ejemplos: `HU-201-crear-aula-virtual.md` · `HU-301-reservar-cupo.md` ·
`HU-303-acceso-al-enlace.md`.

**El número es estable.** Es lo que enlaza el archivo, la rama de git y la tarjeta de GitHub
Projects. No se renumera una HU después de crearla.

## Cómo se usa

1. Pega la HU que Claude te generó en un archivo nuevo con este nombre, usando
   [`_PLANTILLA.md`](./_PLANTILLA.md) como formato.
2. Crea el **issue de GitHub** como **puntero**, nunca como copia (ver abajo).
3. Crea la rama: `hu-<número>-<slug>-<persona>`.
4. Impleméntala con `/hu docs/historias/HU-XXX-slug-corto.md`.
5. Al cerrar el PR, marca la HU como completada en su cabecera y mueve la tarjeta.

El flujo completo, con el porqué de cada paso, está en [`GUIA_FLUJO.md`](../../GUIA_FLUJO.md).

## El issue de GitHub es un puntero

**No se copia el texto de la HU al issue.** Dos fuentes de verdad divergen siempre: cuando cambia
una dependencia se edita un archivo, no dos, y las _Notas de implementación_ se escriben al cerrar
sin que nadie las lleve de vuelta al tablero. Si los checkboxes viven en los dos sitios, uno miente.

GitHub lleva **estado**; el repo lleva **contenido**. Plantilla del issue:

```
Título:  HU-XXX · <título de la HU>
Labels:  sprint-N, prioridad:<nivel>, <capa>, [a11y] [infra]

Cuerpo:
  <la historia: Como… Quiero… Para…>

  📄 Tasks y criterios de aceptación:
  docs/historias/HU-XXX-slug-corto.md

  Depende de: … · Bloquea: …
```

Sprint, Prioridad, Estimación, Assignee y Estado se rellenan como **campos del Project**, no en el
cuerpo del issue.

## Reglas del contenido

- **En español.** Es contenido de producto.
- **Los acceptance criteria son el contrato.** El comando `/hu` los recorre uno por uno al terminar,
  así que tienen que ser **verificables**: "el cupo nunca se pasa de `maxStudents` bajo dos
  reservas simultáneas" sirve; "la reserva funciona bien" no.
- **No repitas reglas de negocio que ya viven en `docs/ARQUITECTURA.md`.** Referéncialas. La HU dice
  _qué_ hay que construir; la arquitectura dice _cómo_ se comporta el sistema. Si una HU necesita
  cambiar una regla, eso es un cambio a `ARQUITECTURA.md`, no un párrafo enterrado en la HU.
- **Si una HU depende de algo sin decidir** (ver `docs/ARQUITECTURA.md` §14.6), anótalo en
  _Dependencias_. `/hu` se detendrá ahí a preguntar en vez de inventarlo.

## Estado

| HU                                                     | Título                                         | Estado                                |
| ------------------------------------------------------ | ---------------------------------------------- | ------------------------------------- |
| HU-001…004                                             | Sprint 0 — Fundación técnica                   | ✅ Completo (anterior a esta carpeta) |
| HU-101, 102                                            | Registro y login con sesión persistente        | ✅ Completo (anterior a esta carpeta) |
| [HU-103](./HU-103-perfil-de-usuario.md)                | Ver y editar el perfil de usuario              | 🔄 En revisión                        |
| [HU-104](./HU-104-aprobacion-de-profesores.md)         | Aprobación de profesores por el administrador  | ✅ Completada                         |
| [HU-201](./HU-201-crear-aula-virtual.md)               | Crear aula virtual con enlace manual           | ✅ Terminada                          |
| [HU-202](./HU-202-editar-cancelar-aula.md)             | Editar o cancelar un aula propia               | ✅ Completada                         |
| [HU-203](./HU-203-listado-de-aulas.md)                 | Listado de aulas con filtros                   | ✅ Completada                         |
| [HU-204](./HU-204-detalle-de-aula.md)                  | Detalle de un aula                             | ✅ Completada                         |
| [HU-205](./HU-205-tests-de-frontend.md)                | Infraestructura de tests de frontend y tipos   | ✅ Completada                         |
| [HU-206](./HU-206-sistema-visual-y-shell.md)           | Sistema visual y shell de la aplicación        | ✅ Completada                         |
| [HU-207](./HU-207-mis-aulas-del-profesor.md)           | Mis aulas: listado del profesor                | ✅ Completada                         |
| [HU-208](./HU-208-catalogo-por-rol.md)                 | El catálogo de aulas distingue quién lo mira   | ✅ Completada                         |
| [HU-209](./HU-209-panel-de-inicio-por-rol.md)          | Panel de inicio por rol                        | ✅ Completada                         |
| [HU-210](./HU-210-supervision-de-aulas-admin.md)       | Supervisión de aulas para el administrador     | ✅ Completada                         |
| [HU-211](./HU-211-accesibilidad-declarada-del-aula.md) | El aula declara cómo se imparte                | ✅ Completada                         |
| [HU-212](./HU-212-coherencia-temporal-del-aula.md)     | Coherencia temporal del aula                   | ✅ Completada                         |
| [HU-213](./HU-213-duplicar-un-aula.md)                 | Duplicar un aula                               | ✅ Completada                         |
| [HU-214](./HU-214-datos-de-demostracion.md)            | Datos de demostración en el seed               | ✅ Completada                         |
| [HU-215](./HU-215-pasada-de-accesibilidad.md)          | Pasada manual de accesibilidad                 | ✅ Completada                         |
| [HU-216](./HU-216-mecanismo-de-tema.md)                | Mecanismo real para `.dark` y `.hc`            | ✅ Completada                         |
| [HU-301](./HU-301-reservar-un-cupo.md)                 | Reservar un cupo                               | ✅ Completada                         |
| [HU-302](./HU-302-mis-reservas.md)                     | Mis reservas: el estudiante encuentra su clase | ✅ Completada                         |
| [HU-303](./HU-303-cancelar-una-reserva.md)             | Cancelar una reserva                           | ✅ Completada                         |
| [HU-304](./HU-304-acceso-al-enlace.md)                 | El enlace se revela dentro de su ventana       | ✅ Completada                         |
| [HU-305](./HU-305-el-profesor-ve-quien-viene.md)       | El profesor ve quién viene a su clase          | ✅ Completada                         |
| [HU-306](./HU-306-un-aula-con-reservas.md)             | Un aula con reservas no cambia en silencio     | ✅ Completada                         |
| [HU-307](./HU-307-seed-con-reservas.md)                | El seed siembra reservas                       | ✅ Completada                         |
| [HU-308](./HU-308-indice-de-reservas.md)               | El schema de Prisma miente sobre el índice     | ⬜ Pendiente                          |
| [HU-309](./HU-309-el-panel-conoce-las-reservas.md)     | El panel del estudiante no conoce las reservas | ⬜ Pendiente                          |
| HU-401…404                                             | Sprint 4 — Notificaciones e historial          | ⬜ Sin convertir a `.md`              |

**Sprint 2 — cerrado (2026-08-25).** Las quince HUs de gestión de aulas, incluidas HU-214 y HU-215,
están implementadas.

**Sprint 3 — Sistema de Reservas.** Las siete HUs planificadas (HU-301…307) están implementadas
con sus AC verificados, más HU-216. El recorrido completo funciona: reservar con concurrencia real,
encontrar lo reservado, cancelar liberando el cupo, y entrar a la videollamada en su ventana.

**Quedan dos para cerrarlo**, las dos encontradas en la pasada final y las dos del mismo tipo —algo
que el Sprint 2 dejó escrito y que el Sprint 3 debía recoger:

```
HU-308 (índice de reservas) · HU-309 (panel del estudiante)   ← independientes entre sí
```

- **HU-308** es una bomba de relojería, no un fallo visible: la base de datos está bien, pero el
  schema de Prisma declara un índice único **total** donde la migración creó uno **parcial**. La
  próxima `prisma migrate dev` reintroduce el bug de §4.3 que ya se corrigió una vez.
- **HU-309** es una mentira en la pantalla de inicio: `panel-estudiante.tsx` tiene escrito en su
  propio comentario que HU-301 lo llenaría de datos. HU-301 llegó y nadie volvió. Un estudiante que
  acaba de reservar entra a `/panel` y lee «No tienes clases reservadas».

Las HUs de Sprint 0 y las primeras de Sprint 1 se implementaron antes de que existiera esta
carpeta; su texto original está en GitHub Projects. No se reconstruyen aquí.

Las de Sprint 3 y 4 se convierten **justo antes de empezar cada sprint**, no ahora: dependen de
decisiones que aún no están tomadas (`ARQUITECTURA.md` §14.6) y se reescribirían.
