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
2. Copia el mismo contenido a una tarjeta de GitHub Projects (el proyecto sigue siendo el tablero;
   el repo es la fuente de verdad del texto).
3. Crea la rama: `hu-<número>-<slug>-<persona>`.
4. Impleméntala con `/hu docs/historias/HU-XXX-slug-corto.md`.
5. Al cerrar el PR, marca la HU como completada en su cabecera y mueve la tarjeta.

El flujo completo, con el porqué de cada paso, está en [`GUIA_FLUJO.md`](../../GUIA_FLUJO.md).

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
| [HU-104](./HU-104-aprobacion-de-profesores.md) | Aprobación de profesores por el administrador | ⬜ Pendiente                          |
| [HU-201](./HU-201-crear-aula-virtual.md)       | Crear aula virtual con enlace manual          | ⬜ Pendiente                          |
| [HU-202](./HU-202-editar-cancelar-aula.md)     | Editar o cancelar un aula propia              | ⬜ Pendiente                          |
| [HU-203](./HU-203-listado-de-aulas.md)         | Listado de aulas con filtros                  | ⬜ Pendiente                          |
| [HU-204](./HU-204-detalle-de-aula.md)          | Detalle de un aula                            | ⬜ Pendiente                          |
| [HU-205](./HU-205-tests-de-frontend.md)        | Infraestructura de tests de frontend y tipos  | ⬜ Pendiente                          |
| HU-301…304                                     | Sprint 3 — Sistema de reservas                | ⬜ Sin convertir a `.md`              |
| HU-401…404                                     | Sprint 4 — Notificaciones e historial         | ⬜ Sin convertir a `.md`              |

**Orden del Sprint 2:**

```
HU-104 ──► HU-201 ──► HU-203 ──► HU-204 ──► HU-202
HU-205 ──────────────►┘
```

- **HU-104** va primero aunque sea del Sprint 1: crea el decorador `@Roles` y es lo único que
  produce un profesor `ACTIVE`, sin el cual HU-201 no se puede probar.
- **HU-205** no depende de nada y puede correr en paralelo con HU-201, pero **tiene que estar
  cerrada antes de HU-203**: esa HU escribe la función compartida `derivarEstadoAula()` y los
  componentes de dominio, y hoy no hay dónde ejecutar sus tests.
- **HU-202 va al final** pese a su número: necesita el formulario de 201, el botón de entrada de
  204, y el listado de 203 para poder verificar su AC2. **El número identifica, no ordena.**

Las HUs de Sprint 0 y las primeras de Sprint 1 se implementaron antes de que existiera esta
carpeta; su texto original está en GitHub Projects. No se reconstruyen aquí.

Las de Sprint 3 y 4 se convierten **justo antes de empezar cada sprint**, no ahora: dependen de
decisiones que aún no están tomadas (`ARQUITECTURA.md` §14.6) y se reescribirían.
