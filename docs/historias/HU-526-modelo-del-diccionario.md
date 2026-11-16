# HU-526 — Modelo del diccionario y carga de las 479 entradas

| Campo               | Valor                                                |
| ------------------- | ---------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                            |
| **Prioridad**       | 🔴 Crítica                                           |
| **Estimación**      | 1.5 días                                             |
| **Estado**          | ⬜ Pendiente                                         |
| **Asignada a**      | **Dev A** — backend                                  |
| **Rama**            | `hu-526-modelo-del-diccionario-a`                    |
| **Alcance técnico** | backend · types · prisma                             |
| **Depende de**      | ninguna                                              |
| **Labels**          | `diccionario` `prioridad:critica` `backend` `prisma` |

> **Como** equipo de BigHearts,
> **quiero** el modelo de datos del diccionario con sus 479 entradas, 9 módulos y 19 categorías ya
> cargados,
> **para** que las pantallas de lectura y de gestión tengan sobre qué construirse.

## Contexto

Base de todo el diccionario (`docs/diccionario/ESTRATEGIA.md` §2). La estructura (módulos, unidades,
categorías) es dato de referencia: va en la **migración**, para que exista igual en todos los
entornos. Las entradas van en un **script idempotente** que lee el CSV curado. La búsqueda no usa
`unaccent` (no es inmutable y en Supabase vive en otro esquema): se guardan columnas normalizadas
(`inglesNorm`, `espanolNorm`) con índice trigram. Decisión nueva **D50**.

## Referencias

- **Archivos a tocar:** `apps/api/prisma/schema.prisma` + migración nueva, `apps/api/prisma/data/diccionario-m1-m3.csv`
  (copia de `docs/diccionario/vocabulario-m1-m3.csv`), `apps/api/prisma/seed-diccionario.ts` (nuevo),
  `apps/api/package.json` + raíz (`db:seed:diccionario`), `packages/types/src/diccionario.ts` (nuevo) +
  `index.ts`, `apps/api/src/diccionario/diccionario.normalizar.ts` (nuevo), `DEPLOYMENT.md`.
- **Reglas:** `docs/diccionario/ESTRATEGIA.md` §2 (modelo y unidades) y §8 (D-1, D-2).
  `ARQUITECTURA.md` → «7. Modelo de datos» (añadir las tablas) y §2 (fila D50).
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — Contrato en `@academia/types`: enums `TramoModulo` (`BASICO`, `INTERMEDIO`, `AVANZADO`),
      `EstadoModulo` (`DISPONIBLE`, `PROXIMAMENTE`), `TipoEntrada` (`PALABRA`, `VERBO`, `FRASE`,
      `EXPRESION`), `LenguaSenas` (`LSC`), `EstadoVideo` (`SUBIENDO`, `PROCESANDO`, `LISTO`, `ERROR`) y
      sus etiquetas en español. `normalizarTexto()` (minúsculas, sin tildes por NFD, espacios
      colapsados), compartida con el front.
- [x] **T2** — Prisma: `DictionaryModule` (numero único, nombre, tramo, estado, orden),
      `DictionaryUnit` (módulo, código «U1», nombre, orden; único por módulo+código),
      `DictionaryCategory` (nombre, slug único, icono, descripcion, orden), `DictionaryEntry` (slug
      único, ingles, espanol, `inglesNorm`, `espanolNorm`, tipo, módulo, unidad?, categoría,
      `imagenKey?`, nota?, `orden` (orden del material del profe; las nuevas van al final), publicada,
      `deletedAt?`, timestamps) y `SignVideo` (entrada, lengua,
      `videoKey`, `miniaturaKey`, duracionMs, bytes, estado, subidoPor, timestamps; **un solo video
      activo por entrada y lengua**). FKs `Restrict` hacia módulo/unidad/categoría.
- [x] **T3** — Migración: `CREATE EXTENSION IF NOT EXISTS pg_trgm`, índices GIN trigram en
      `ingles_norm` y `espanol_norm`, índice por `(module_id, category_id) WHERE deleted_at IS NULL`.
      Inserta los **9 módulos** (1–3 `DISPONIBLE`, 4–9 `PROXIMAMENTE`, «Level I…IX»), las **15
      unidades** de los módulos 1–3 con sus nombres reales (ESTRATEGIA §2) y las **19 categorías** con
      su ícono Lucide (tabla del PDF; orden = total descendente).
- [x] **T4** — `seed-diccionario.ts` + `npm run db:seed:diccionario`: lee el CSV, resuelve módulo,
      unidad y categoría, genera el slug desde el inglés (`to-eat`; colisión → `to-eat-2`), guarda `orden` = número de fila y hace
      **upsert por (módulo, inglesNorm, tipo)**. Correrlo dos veces no duplica nada. El slug **no
      cambia** aunque luego se edite el inglés.
- [x] **T5** — `DEPLOYMENT.md`: correr `db:seed:diccionario` una vez por entorno tras migrar.
      `ARQUITECTURA.md`: tablas en §7 y fila **D50** en §2 (modelo en dos ejes, slug estable,
      columnas normalizadas en vez de `unaccent`, todo abierto para cualquier sesión, entradas sin seña
      visibles).
- [x] **T6** — Tests: `normalizarTexto` (tildes, mayúsculas, `¿?`), el seed es idempotente (dos
      corridas → 479), colisión de slug, conteos por módulo 203/167/109.

## Criterios de aceptación

- [x] **AC1** — Tras `db:migrate` + `db:seed:diccionario` hay 9 módulos, 15 unidades, 19 categorías y
      **479 entradas** (203 / 167 / 109), y los conteos por categoría coinciden con la tabla del PDF
      (p. ej. Acciones 51 / 42 / 9).
- [x] **AC2** — Correr `db:seed:diccionario` una segunda vez no crea filas nuevas ni cambia slugs.
- [x] **AC3** — `SELECT … WHERE ingles_norm % 'to eet'` usa el índice trigram y encuentra «To eat»;
      «Lapiz» encuentra «Lápiz» por `espanol_norm`.
- [x] **AC4** — No se puede tener dos `SignVideo` activos para la misma entrada y lengua (restricción en
      BD, verificada en test).
- [x] **AC5** — `ARQUITECTURA.md` registra D50 y las tablas nuevas; `DEPLOYMENT.md` el paso de carga.

## Fuera de alcance

- Endpoints (HU-527 lectura, HU-531 gestión). Almacenamiento de videos (HU-538).
- Módulos 4–9 con entradas: llegan por importación (HU-533) cuando el profe entregue el material.

## Notas de implementación

«Video activo» = `estado LISTO` (índice único parcial): el nuevo convive `SUBIENDO` con el anterior hasta confirmarse (HU-538).
`descripcion` de categoría queda opcional y vacía: el material no la trae. El seed no toca entradas existentes (no pisa ediciones del admin).
`normalizarTexto()` también quita `¿?¡!`.
