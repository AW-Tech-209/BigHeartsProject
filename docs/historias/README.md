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

| HU                                             | Título                                        | Estado                                |
| ---------------------------------------------- | --------------------------------------------- | ------------------------------------- |
| HU-001…004                                     | Sprint 0 — Fundación técnica                  | ✅ Completo (anterior a esta carpeta) |
| HU-101, 102                                    | Registro y login con sesión persistente       | ✅ Completo (anterior a esta carpeta) |
| [HU-103](./HU-103-perfil-de-usuario.md)        | Ver y editar el perfil de usuario             | 🔄 En revisión                        |
| [HU-104](./HU-104-aprobacion-de-profesores.md) | Aprobación de profesores por el administrador | ✅ Completada                         |
| [HU-201](./HU-201-crear-aula-virtual.md)       | Crear aula virtual con enlace manual          | ✅ Terminada                          |
| [HU-202](./HU-202-editar-cancelar-aula.md)     | Editar o cancelar un aula propia              | ⬜ Pendiente                          |
| [HU-203](./HU-203-listado-de-aulas.md)         | Listado de aulas con filtros                  | ⬜ Pendiente                          |
| [HU-204](./HU-204-detalle-de-aula.md)          | Detalle de un aula                            | ⬜ Pendiente                          |
| [HU-205](./HU-205-tests-de-frontend.md)        | Infraestructura de tests de frontend y tipos  | ✅ Completada                         |
| [HU-206](./HU-206-sistema-visual-y-shell.md)   | Sistema visual y shell de la aplicación       | ✅ Completada                         |
| [HU-207](./HU-207-mis-aulas-del-profesor.md)   | Mis aulas: listado del profesor               | ⬜ Pendiente                          |
| HU-301…304                                     | Sprint 3 — Sistema de reservas                | ⬜ Sin convertir a `.md`              |
| HU-401…404                                     | Sprint 4 — Notificaciones e historial         | ⬜ Sin convertir a `.md`              |

**Orden del Sprint 2:**

```
HU-205 ✅ ─► HU-206 ✅ ─► HU-104 ✅ ─► HU-201 ✅ ─► HU-203 ─► HU-207 ─► HU-204 ─► HU-202
```

**Quedan cuatro**, en este orden:

- **HU-203** crea `derivarEstadoAula()` y los componentes de dominio (`<TarjetaAula>`,
  `<EstadoAula>`, `<IndicadorCupo>`). Todo lo que viene después los reutiliza.
- **HU-207** arregla un hueco real: `MisAulasPage` existe y la navegación del profesor la enlaza,
  pero hoy es un estado vacío permanente. Sin ella, HU-204 y HU-202 no tienen punto de entrada
  para el profesor.
- **HU-204** es el detalle, y desde ahí se llega a editar y cancelar.
- **HU-202 va al final** pese a su número: necesita el formulario de 201, el listado de 203 para
  verificar su AC2, y el botón de entrada de 204. **El número identifica, no ordena.**

Pendiente aparte: **HU-103** sigue en revisión, con AC4 y AC8 sin la pasada manual. Ahora que
HU-205 dejó `axe` y los tres temas montados, esa verificación se puede automatizar en vez de
arrastrarse.

Las HUs de Sprint 0 y las primeras de Sprint 1 se implementaron antes de que existiera esta
carpeta; su texto original está en GitHub Projects. No se reconstruyen aquí.

Las de Sprint 3 y 4 se convierten **justo antes de empezar cada sprint**, no ahora: dependen de
decisiones que aún no están tomadas (`ARQUITECTURA.md` §14.6) y se reescribirían.
