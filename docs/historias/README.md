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

| Sprint                         | Rango      | Estado                                |
| ------------------------------ | ---------- | ------------------------------------- |
| 0 — Fundación técnica          | HU-001…004 | ✅ Completo (anterior a esta carpeta) |
| 1 — Autenticación y usuarios   | HU-101…104 | 🔄 En curso                           |
| 2 — Gestión de aulas           | HU-201…204 | ⬜ Sin empezar                        |
| 3 — Sistema de reservas        | HU-301…304 | ⬜ Sin empezar                        |
| 4 — Notificaciones e historial | HU-401…404 | ⬜ Sin empezar                        |

Las HUs de Sprint 0 y las primeras de Sprint 1 se implementaron antes de que existiera esta
carpeta; su texto original está en GitHub Projects. No se reconstruyen aquí: se documenta desde la
siguiente en adelante.
