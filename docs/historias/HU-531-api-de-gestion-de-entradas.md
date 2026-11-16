# HU-531 — API de gestión de entradas (admin)

| Campo               | Valor                                       |
| ------------------- | ------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                   |
| **Prioridad**       | 🔴 Crítica                                  |
| **Estimación**      | 1.5 días                                    |
| **Estado**          | ⬜ Pendiente                                |
| **Asignada a**      | **Dev A** — backend                         |
| **Rama**            | `hu-531-api-de-gestion-de-entradas-a`       |
| **Alcance técnico** | backend · types                             |
| **Depende de**      | HU-526                                      |
| **Labels**          | `diccionario` `prioridad:critica` `backend` |

> **Como** administrador,
> **quiero** listar, crear, corregir y mover entradas del diccionario, de una en una o en lote,
> **para** mantener el contenido al día sin tocar la base de datos.

## Contexto

Todo lo que escribe en el diccionario es **solo `ADMIN`** (`@Roles` en la clase, como `admin/`). La
edición rápida de la tabla usa el mismo `PATCH` que el editor. Sin mutación optimista: el front espera
la respuesta. La papelera y la estructura van en HU-532; los archivos (video, imagen) en HU-538.

## Referencias

- **Archivos a tocar:** `packages/types/src/diccionario.ts`, `apps/api/src/admin/diccionario/`
  (nuevo: `admin-diccionario.controller.ts`, `admin-diccionario.service.ts`, `dto/*`),
  `apps/api/src/admin/admin.module.ts`, `apps/api/src/diccionario/diccionario.normalizar.ts`.
- **Diseño:** `docs/diccionario/diseno/06-consola-escritorio-claro-2-seleccionadas-edicion-rapida-en-to-drink.png`,
  `07-editor-movil-claro-pagina-crear-entrada-con-posible-duplicado.png` · `DISENO.md` §2
  (`FilaEntradaAdmin`, `BarraLote`).
- **Reglas:** skill `bighearts-backend` → DTOs, errores, contrato de respuesta.
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — `GET /admin/diccionario/avance`: por módulo disponible, `palabras`, `conSena`,
      `procesando`, `conError`, `sinSena`; y totales para los accesos de la consola (sin seña, en la
      papelera).
- [x] **T2** — `GET /admin/diccionario/entradas?q=&modulo=&categoria=&tipo=&unidad=&sena=&imagen=&publicada=&page=&pageSize=`:
      paginado (25 por defecto), sin las de la papelera, con el estado **admin** de la seña
      (`lista · procesando · error · sin-sena`) y los conteos por estado de seña para los chips.
- [x] **T3** — `POST /admin/diccionario/entradas` y `PATCH /admin/diccionario/entradas/:id`: valida que
      la unidad pertenezca al módulo, recalcula `inglesNorm`/`espanolNorm`, y una entrada nueva va al
      final del `orden` de su categoría y módulo. `GET …/entradas/:id` para el editor.
- [x] **T4** — `GET /admin/diccionario/entradas/duplicados?ingles=&tipo=`: devuelve las entradas con el
      mismo `inglesNorm` (de cualquier módulo) para el aviso «Ya existe “To drink” en Módulo 1». **Avisa,
      no bloquea.**
- [x] **T5** — `POST /admin/diccionario/entradas/lote` `{ ids, accion }` con `accion` ∈ `mover-categoria`
      (`categoriaId`), `mover-modulo` (`moduloId`, `unidadId?`), `ocultar`, `publicar`,
      `enviar-papelera`. Todo en **una transacción**: si una falla, ninguna cambia. Máx. 200 ids.
- [x] **T6** — Tests: estudiante y profesor → 403 en todo; unidad de otro módulo → 400
      `UNIT_NOT_IN_MODULE`; editar el inglés **no cambia el slug**; el lote es atómico; la entrada
      oculta deja de verse en la lectura de HU-527.

## Criterios de aceptación

- [x] **AC1** — Solo `ADMIN` recibe 2xx en `/admin/diccionario/*`; los demás roles, 403.
- [x] **AC2** — Con `modulo=1&categoria=acciones&sena=sin-sena` el listado trae solo esas entradas y
      los conteos de los chips suman el total de la categoría.
- [x] **AC3** — Editar «To drink» → «To drink (water)» se ve en lectura y búsqueda al instante, y su URL
      `/diccionario/entrada/to-drink` sigue funcionando.
- [x] **AC4** — Mover 2 entradas de categoría en lote cambia las dos; si una de ellas no existe,
      responde 404 y **ninguna** cambia.
- [x] **AC5** — Crear «To drink» en el Módulo 2 funciona y `duplicados` devuelve la del Módulo 1.

## Fuera de alcance

- Papelera, módulos, unidades y categorías (HU-532). Importar CSV (HU-533). Archivos (HU-538).

## Notas de implementación

Estado admin de la seña con prioridad lista > procesando (`SUBIENDO`/`PROCESANDO`) > error > sin-sena. `duplicados` acepta `excluir` (la que se edita) y pone primero las del mismo tipo.
Mover de categoría o de módulo (editor o lote) manda la entrada al final del orden del destino; cambiar de módulo sin `unidadId` la deja sin unidad.
