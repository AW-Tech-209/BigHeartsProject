# HU-527 — API de lectura y búsqueda del diccionario

| Campo               | Valor                                       |
| ------------------- | ------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                   |
| **Prioridad**       | 🔴 Crítica                                  |
| **Estimación**      | 1.5 días                                    |
| **Estado**          | ⬜ Pendiente                                |
| **Asignada a**      | **Dev A** — backend                         |
| **Rama**            | `hu-527-api-de-lectura-del-diccionario-a`   |
| **Alcance técnico** | backend · types                             |
| **Depende de**      | HU-526                                      |
| **Labels**          | `diccionario` `prioridad:critica` `backend` |

> **Como** estudiante o profesor,
> **quiero** que la plataforma me dé los módulos, las categorías, las palabras y una búsqueda rápida,
> **para** llegar a cualquier seña en pocos toques.

## Contexto

Cinco lecturas que alimentan las pantallas 01–04 de `docs/diccionario/diseno/`. Cualquier rol con
sesión lee (D50); nadie sin sesión. Solo se ve lo **publicado, no borrado y de un módulo
`DISPONIBLE`**. La seña del estudiante tiene solo dos estados (`lista` / `en-preparacion`, decisión
2 del diseño). El campo `sena.url` existe desde ya en el contrato y llega `null` hasta HU-538.

## Referencias

- **Archivos a tocar:** `packages/types/src/diccionario.ts`, `apps/api/src/diccionario/` (módulo nuevo:
  `diccionario.controller.ts`, `diccionario.service.ts`, `diccionario.mapper.ts`, `dto/*`),
  `apps/api/src/app.module.ts`.
- **Diseño:** `docs/diccionario/diseno/DISENO.md` §1 y §3 (buscador).
- **Reglas:** skill `bighearts-backend` → contrato de respuesta y DTOs.
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — `GET /diccionario`: los 9 módulos por orden con `numero, nombre, tramo, estado,
palabras, conSena` (conSena = entradas con video `LISTO`).
- [x] **T2** — `GET /diccionario/modulos/:numero?unidad=`: módulo + unidades (con conteo) + categorías
      del módulo con conteo, **solo las que tienen entradas**, ordenadas por cantidad. Con `unidad`,
      los conteos se recalculan para esa unidad. Módulo `PROXIMAMENTE` → 404 `MODULE_NOT_AVAILABLE`.
- [x] **T3** — `GET /diccionario/modulos/:numero/categorias/:slug?tipo=&unidad=&conSena=`: entradas
      ordenadas por unidad y luego por `orden` (el del material del profe), más `filtros` con los conteos de cada tipo y cada
      unidad **existentes** (para los chips) y el total con seña. Sin paginar (máx. ~60).
- [x] **T4** — `GET /diccionario/entradas/:slug`: la entrada (inglés, español, tipo, módulo + tramo,
      unidad con nombre, categoría, nota, `imagenUrl`, `sena: { estado, url, miniaturaUrl }`) más
      `posicion` («2 de 51») y `anterior`/`siguiente` dentro de la misma categoría del mismo módulo,
      con el mismo orden que T3. Las primeras y últimas traen `null` en el lado que falta.
- [x] **T5** — `GET /diccionario/buscar?q=&limite=`: `q` ≥ 2 caracteres, normalizada; busca en
      `inglesNorm` y `espanolNorm` combinando prefijo, `ILIKE '%q%'` y `similarity()` (umbral 0.3),
      ordena exacto → prefijo → contiene → parecido. `limite` 8 para sugerencias, máx. 50. Cada
      resultado lleva módulo y categoría.
- [x] **T6** — Tests: sin sesión → 401; una entrada en la papelera, oculta o de un módulo próximo no
      aparece en ninguna lectura; orden y `anterior/siguiente`; búsqueda con tilde, sin tilde y con un
      error de una letra.

## Criterios de aceptación

- [x] **AC1** — `GET /diccionario` con cualquier rol devuelve 9 módulos; el 1 con `palabras: 203`.
- [x] **AC2** — En Módulo 1 · Acciones, `filtros.tipos` solo trae `VERBO: 51`, y con `unidad=U1` la
      lista trae 16 entradas.
- [x] **AC3** — «To drink» devuelve `posicion: { actual: 2, total: 51 }`, `anterior` = «To eat» y
      `siguiente` = «To read»; «To eat» trae `anterior: null`.
- [x] **AC4** — `buscar?q=comer` encuentra «To eat»; `q=lapiz` encuentra «Pencil»; `q=to eet`
      encuentra «To eat»; `q=a` responde 400.
- [x] **AC5** — Ninguna respuesta de lectura incluye `deletedAt`, `publicada`, claves de
      almacenamiento ni los estados `PROCESANDO`/`ERROR` del video.

## Fuera de alcance

- URLs firmadas de video e imagen (HU-538); aquí llegan `null`.
- Endpoints de gestión (HU-531+).

## Notas de implementación

Códigos nuevos `MODULE_NOT_FOUND`, `CATEGORY_NOT_FOUND`, `ENTRY_NOT_FOUND` (además de `MODULE_NOT_AVAILABLE`). `filtros` cuenta la categoría completa, sin aplicar filtros.
`GET /diccionario` responde `{ modulos }`; los próximos traen `palabras: 0`. Tests de lectura en `prisma/diccionario.integration.spec.ts` (comparten el seed).
