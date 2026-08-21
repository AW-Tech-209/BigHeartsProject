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

| HU                                                     | Título                                        | Estado                                |
| ------------------------------------------------------ | --------------------------------------------- | ------------------------------------- |
| HU-001…004                                             | Sprint 0 — Fundación técnica                  | ✅ Completo (anterior a esta carpeta) |
| HU-101, 102                                            | Registro y login con sesión persistente       | ✅ Completo (anterior a esta carpeta) |
| [HU-103](./HU-103-perfil-de-usuario.md)                | Ver y editar el perfil de usuario             | 🔄 En revisión                        |
| [HU-104](./HU-104-aprobacion-de-profesores.md)         | Aprobación de profesores por el administrador | ✅ Completada                         |
| [HU-201](./HU-201-crear-aula-virtual.md)               | Crear aula virtual con enlace manual          | ✅ Terminada                          |
| [HU-202](./HU-202-editar-cancelar-aula.md)             | Editar o cancelar un aula propia              | ⬜ Pendiente                          |
| [HU-203](./HU-203-listado-de-aulas.md)                 | Listado de aulas con filtros                  | ✅ Completada                         |
| [HU-204](./HU-204-detalle-de-aula.md)                  | Detalle de un aula                            | ⬜ Pendiente                          |
| [HU-205](./HU-205-tests-de-frontend.md)                | Infraestructura de tests de frontend y tipos  | ✅ Completada                         |
| [HU-206](./HU-206-sistema-visual-y-shell.md)           | Sistema visual y shell de la aplicación       | ✅ Completada                         |
| [HU-207](./HU-207-mis-aulas-del-profesor.md)           | Mis aulas: listado del profesor               | ⬜ Pendiente                          |
| [HU-208](./HU-208-catalogo-por-rol.md)                 | El catálogo de aulas distingue quién lo mira  | ⬜ Pendiente                          |
| [HU-209](./HU-209-panel-de-inicio-por-rol.md)          | Panel de inicio por rol                       | ⬜ Pendiente                          |
| [HU-210](./HU-210-supervision-de-aulas-admin.md)       | Supervisión de aulas para el administrador    | ⬜ Pendiente                          |
| [HU-211](./HU-211-accesibilidad-declarada-del-aula.md) | El aula declara cómo se imparte               | ⬜ Pendiente                          |
| [HU-212](./HU-212-coherencia-temporal-del-aula.md)     | Coherencia temporal del aula                  | ⬜ Pendiente                          |
| [HU-213](./HU-213-duplicar-un-aula.md)                 | Duplicar un aula                              | ⬜ Pendiente                          |
| HU-301…304                                             | Sprint 3 — Sistema de reservas                | ⬜ Sin convertir a `.md`              |
| HU-401…404                                             | Sprint 4 — Notificaciones e historial         | ⬜ Sin convertir a `.md`              |

**Orden del Sprint 2:**

```
… HU-203 ✅ ─► HU-209 ─► HU-207 ─► HU-204 ─► HU-211 ─► HU-208 ─► HU-212 ─► HU-202 ─► HU-213 ─► HU-210
```

**Quedan nueve.** Seis salieron de dos revisiones (20 de agosto), cuando se vio que el producto no
distinguía bien entre roles y que **no entregaba nada específico para su público**.

- **HU-209** va primera: `PanelPage` afirma hoy cosas que son falsas desde hace dos historias. Una
  mentira en pantalla se arregla antes que cualquier función nueva.
- **HU-207** desbloquea al profesor: `/mis-aulas` es un estado vacío permanente.
- **HU-204** es el detalle; desde ahí se llega a editar, cancelar y duplicar.
- **HU-211 es la más importante del sprint.** Sin ella, todo lo demás entrega lo mismo que
  entregaría una academia de inglés para oyentes: el estudiante declara cómo se comunica y ese dato
  no se usa en ninguna parte.
- **HU-208** marca las clases propias del profesor en el catálogo. Va antes de HU-301 sí o sí.
- **HU-212** cierra el paso a publicar clases imposibles: solapadas consigo mismo, de duración
  absurda, o con dos minutos de antelación.
- **HU-202** necesita 201, 203 y 204. **El número identifica, no ordena.**
- **HU-213** va después de HU-211 para que duplicar copie también los campos de accesibilidad.
- **HU-210** cierra: supervisión del administrador, con el panel de HU-209 como entrada.

Pendiente aparte: **HU-103** sigue en revisión, con AC4 y AC8 sin la pasada manual. Ahora que
HU-205 dejó `axe` y los tres temas montados, esa verificación se puede automatizar.

Las HUs de Sprint 0 y las primeras de Sprint 1 se implementaron antes de que existiera esta
carpeta; su texto original está en GitHub Projects. No se reconstruyen aquí.

Las de Sprint 3 y 4 se convierten **justo antes de empezar cada sprint**, no ahora: dependen de
decisiones que aún no están tomadas (`ARQUITECTURA.md` §14.6) y se reescribirían.
