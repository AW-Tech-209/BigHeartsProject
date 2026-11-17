# HU-536 — Estructura: módulos, unidades y categorías (admin)

| Campo               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| **Sprint**          | Post-Fase 1 · Diccionario                        |
| **Prioridad**       | 🟠 Alta                                          |
| **Estimación**      | 1.5 días                                         |
| **Estado**          | ⬜ Pendiente                                     |
| **Asignada a**      | **Dev B** — frontend                             |
| **Rama**            | `hu-536-estructura-del-diccionario-b`            |
| **Alcance técnico** | frontend                                         |
| **Depende de**      | HU-532, HU-534                                   |
| **Labels**          | `diccionario` `prioridad:alta` `frontend` `a11y` |

> **Como** administrador,
> **quiero** renombrar, reordenar, crear y eliminar módulos, unidades y categorías desde una pantalla,
> **para** que el diccionario cambie cuando cambie el material del profesor.

## Contexto

Pantalla 09. Reordenar se hace con botones «Subir» / «Bajar» (y arrastrar como atajo), nunca solo
arrastrando: tiene que funcionar con teclado. Eliminar algo con entradas abre
`<DialogoEliminarCategoria>`: elegir destino y escribir el nombre para confirmar. Publicar un módulo
(`PROXIMAMENTE` → `DISPONIBLE`) es un interruptor con confirmación.

## Referencias

- **Archivos a tocar:** `apps/web/src/pages/AdminEstructuraPage.tsx`,
  `apps/web/src/features/admin/diccionario/components/{lista-modulos,lista-unidades,lista-categorias,dialogo-eliminar,selector-icono}.tsx`,
  `apps/web/src/app/router.tsx` (`/admin/diccionario/estructura`).
- **Diseño:** `docs/diccionario/diseno/09-estructura-escritorio-claro-renombrando-unidad-4-y-editando-como-es.png`,
  `09-estructura-movil-claro.png`, `09-estructura-dialogo-eliminar-categoria-escritorio-claro.png`,
  `09-estructura-dialogo-movil-oscuro.png` · `DISENO.md` §2 (`DialogoEliminarCategoria`).
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — Módulos: lista con número, nombre, tramo (`<InsigniaTramo>`), estado y conteo; editar
      nombre y tramo en línea; interruptor «Disponible» con confirmación («Los estudiantes verán sus N
      palabras»).
- [x] **T2** — Unidades de cada módulo: crear (código sugerido = siguiente), renombrar en línea,
      reordenar con «Subir»/«Bajar», eliminar.
- [x] **T3** — Categorías: crear, renombrar, `<SelectorIcono>` (rejilla de la lista curada, cada ícono
      con su nombre accesible), descripción corta, reordenar, eliminar.
- [x] **T4** — `<DialogoEliminar>` (para unidad y categoría): título serif que nombra el objeto, «Tiene N
      entradas. ¿A dónde van?» (radio: mover a… con selector / enviar a la papelera), campo «Escribe
      “Ropa” para confirmar», foco inicial en «Volver», «Eliminar» inactivo con motivo hasta que el
      nombre coincida.
- [x] **T5** — Tests: reordenar con teclado manda el orden nuevo; el diálogo no deja eliminar hasta
      escribir el nombre exacto; sin entradas, eliminar pide solo confirmación simple; `axe` limpio.

## Criterios de aceptación

- [x] **AC1** — Renombrar «Unidad 4 · Then and to do» desde aquí se ve en las pantallas de lectura sin
      recargar la app (invalida las queries del diccionario).
- [x] **AC2** — Eliminar «Ropa» moviendo sus entradas a «Objetos» exige escribir «Ropa», y al terminar
      «Objetos» tiene esas entradas.
- [x] **AC3** — Todo reordenamiento se puede hacer sin ratón.
- [x] **AC4** — Publicar el Módulo 4 lo muestra como disponible en el inicio del diccionario.
- [x] **AC5** — A 375 px sigue `09-estructura-movil-claro.png` sin scroll horizontal.

## Fuera de alcance

- Crear módulos más allá de 9. Importar (HU-537).

## Notas de implementación

Reordenar solo con botones «Subir»/«Bajar» (sin arrastrar); en los extremos quedan `aria-disabled` y su nombre dice por qué. El código sugerido de la unidad nueva se calcula en el cliente; el definitivo lo pone el servidor. Los íconos tienen nombre accesible en español (`NOMBRE_ICONO`).
