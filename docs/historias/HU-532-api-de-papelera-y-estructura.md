# HU-532 — API de papelera y estructura (módulos, unidades, categorías)

| Campo               | Valor                                    |
| ------------------- | ---------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                |
| **Prioridad**       | 🟠 Alta                                  |
| **Estimación**      | 1.5 días                                 |
| **Estado**          | ⬜ Pendiente                             |
| **Asignada a**      | **Dev A** — backend                      |
| **Rama**            | `hu-532-api-de-papelera-y-estructura-a`  |
| **Alcance técnico** | backend · types                          |
| **Depende de**      | HU-531                                   |
| **Labels**          | `diccionario` `prioridad:alta` `backend` |

> **Como** administrador,
> **quiero** borrar sin miedo y reorganizar módulos, unidades y categorías,
> **para** que el diccionario siga el material del profesor aunque cambie.

## Contexto

Decisión nueva **D52**: borrar una entrada la manda a una **papelera de 30 días** (`deletedAt`);
restaurar la devuelve igual que estaba; pasados 30 días un barrido diario la elimina para siempre,
con sus archivos. Un módulo, una unidad o una categoría **con entradas** no se elimina sin decir a
dónde van esas entradas (moverlas o mandarlas a la papelera), en una transacción.

## Referencias

- **Archivos a tocar:** `packages/types/src/diccionario.ts`, `apps/api/src/admin/diccionario/`
  (`papelera.*`, `estructura.*`, `dto/*`), `apps/api/src/admin/diccionario/purga-papelera.service.ts`
  (con `@nestjs/schedule`, como `reminders/`), `apps/api/src/config/env.schema.ts`
  (`DICCIONARIO_PAPELERA_DIAS`, por defecto 30).
- **Diseño:** `docs/diccionario/diseno/09-estructura-escritorio-claro-renombrando-unidad-4-y-editando-como-es.png`,
  `09-estructura-dialogo-eliminar-categoria-escritorio-claro.png`, `11-papelera-escritorio-claro.png`.
- **Reglas:** `ARQUITECTURA.md` §2 (fila D52).
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — Papelera: `DELETE /admin/diccionario/entradas/:id` (a la papelera),
      `GET /admin/diccionario/papelera` (con «quedan N días»), `POST …/papelera/:id/restaurar`,
      `DELETE …/papelera/:id` (para siempre) y `DELETE …/papelera` (vaciar). Restaurar a una categoría o
      unidad que ya no existe → 409 `RESTORE_TARGET_MISSING` con el detalle.
- [ ] **T2** — Barrido diario: elimina para siempre las entradas con `deletedAt` de más de
      `DICCIONARIO_PAPELERA_DIAS` y pide al puerto de almacenamiento (HU-538, si existe) borrar sus
      archivos; si el puerto aún no existe, solo borra filas.
- [ ] **T3** — Módulos: `GET/PATCH /admin/diccionario/modulos[/:id]` (nombre, tramo, estado, orden) y
      reordenar. Pasar a `PROXIMAMENTE` un módulo con entradas está permitido (las oculta de la
      lectura, no las borra). Crear módulos más allá de 9 no se permite en esta HU.
- [ ] **T4** — Unidades y categorías: crear, renombrar, reordenar (`PATCH …/orden` con la lista de ids)
      y eliminar. Eliminar con entradas exige `{ destino: 'mover', haciaId } | { destino: 'papelera' }`
      y aplica todo en una transacción; sin `destino` → 409 `HAS_ENTRIES` con el conteo.
- [ ] **T5** — Ícono de categoría: solo de la lista curada de Lucide (constante compartida en
      `@academia/types`, las 19 actuales + ~20 más); otro → 400.
- [ ] **T6** — Tests: restaurar devuelve la entrada a la lectura; el barrido no toca las de 29 días y sí
      las de 31; eliminar «Ropa» moviendo sus 3 entradas a «Objetos» deja 0 en Ropa y +3 en Objetos;
      sin `destino` → 409; registro de D52 en `ARQUITECTURA.md`.

## Criterios de aceptación

- [ ] **AC1** — Una entrada enviada a la papelera desaparece de lectura, búsqueda y consola, y
      restaurarla la devuelve con su slug, módulo, categoría y video.
- [ ] **AC2** — Con fechas simuladas, el barrido elimina solo lo que lleva más de 30 días.
- [ ] **AC3** — Eliminar una categoría con entradas sin decir el destino responde 409 con el número de
      entradas; con destino, todo o nada.
- [ ] **AC4** — Renombrar «Unidad 4 · Then and to do» se refleja en lectura, chips y ficha de entrada.
- [ ] **AC5** — `ARQUITECTURA.md` registra D52.

## Fuera de alcance

- Pantallas (HU-534, HU-536). Importar (HU-533).

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
