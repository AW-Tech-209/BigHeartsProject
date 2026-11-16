# HU-533 — API de importación de entradas por CSV

| Campo               | Valor                                     |
| ------------------- | ----------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                 |
| **Prioridad**       | 🟡 Media                                  |
| **Estimación**      | 1 día                                     |
| **Estado**          | ⬜ Pendiente                              |
| **Asignada a**      | **Dev A** — backend                       |
| **Rama**            | `hu-533-api-de-importacion-csv-a`         |
| **Alcance técnico** | backend · types                           |
| **Depende de**      | HU-532                                    |
| **Labels**          | `diccionario` `prioridad:media` `backend` |

> **Como** administrador,
> **quiero** cargar las palabras de un módulo nuevo desde una hoja de cálculo,
> **para** no escribir a mano cientos de entradas cuando el profe entregue los módulos 4 a 9.

## Contexto

Mismo formato que `docs/diccionario/vocabulario-m1-m3.csv`
(`modulo, unidad, categoria, tipo, ingles, espanol`). Dos pasos en el servidor: **vista previa** (no
escribe nada) y **confirmar**. Reutiliza la lógica de resolución y upsert del seed de HU-526, que pasa a
vivir en un servicio compartido. Las unidades que no existen se pueden crear en la importación si el
CSV trae su nombre (columna opcional `unidad_nombre`).

## Referencias

- **Archivos a tocar:** `apps/api/src/admin/diccionario/importacion.*`, `apps/api/src/diccionario/carga-entradas.service.ts`
  (extraído de `prisma/seed-diccionario.ts`, que pasa a usarlo), `packages/types/src/diccionario.ts`.
- **Diseño:** `docs/diccionario/diseno/10-importar-paso-2-escritorio-claro.png` (los motivos de error
  por fila salen de aquí).
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — `POST /admin/diccionario/importacion/vista-previa` (multipart, CSV ≤ 1 MB, UTF-8 con o sin
      BOM, separador `,` o `;`): devuelve cada fila como `nueva`, `duplicada` (ya existe ese inglés+tipo
      en ese módulo) o `error` con su motivo en español («La categoría “Comidas” no existe»; «El tipo
      debe ser Palabra, Verbo, Frase o Expresión»; «Falta el español»), más el resumen y un `token` de
      la vista previa (válido 30 min, guardado en memoria/BD).
- [ ] **T2** — `POST /admin/diccionario/importacion/confirmar` `{ token, incluirDuplicadas: false }`:
      inserta las `nueva` (y actualiza las duplicadas solo si se pide) en **una transacción**, y crea las
      unidades nuevas declaradas. Si el módulo estaba `PROXIMAMENTE`, **no** lo cambia (eso es decisión
      del admin en Estructura).
- [ ] **T3** — `carga-entradas.service.ts`: resolución de módulo/unidad/categoría por nombre o código,
      normalización, slug y `orden`. El seed de HU-526 lo usa también (un solo camino de carga).
- [ ] **T4** — `GET /admin/diccionario/importacion/plantilla`: CSV de ejemplo con las cabeceras y 3 filas.
- [ ] **T5** — Tests: el CSV real de M1–M3 sobre una base vacía da 479 `nueva`; sobre la base ya cargada,
      479 `duplicada`; una fila con categoría inventada da `error` con su motivo; confirmar con un
      token caducado → 410.

## Criterios de aceptación

- [ ] **AC1** — La vista previa no escribe nada en la base (verificado contando filas antes y después).
- [ ] **AC2** — Un CSV de 16 filas con 2 errores y 2 duplicadas devuelve 12 nuevas, 2 duplicadas y 2
      errores, cada error con su fila y su motivo.
- [ ] **AC3** — Confirmar importa exactamente las nuevas, y si falla una inserción no queda ninguna.
- [ ] **AC4** — Un CSV guardado desde Excel en español (separador `;`, BOM) se lee bien.
- [ ] **AC5** — Seed e importación comparten el mismo servicio (no hay dos implementaciones).

## Fuera de alcance

- Importar videos o imágenes (HU-540). La pantalla (HU-537).

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
