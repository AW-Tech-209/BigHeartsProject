# HU-534 — Consola del diccionario y papelera (admin)

| Campo               | Valor                                                  |
| ------------------- | ------------------------------------------------------ |
| **Sprint**          | Post-Fase 1 · Diccionario                              |
| **Prioridad**       | 🔴 Crítica                                             |
| **Estimación**      | 2 días                                                 |
| **Estado**          | ⬜ Pendiente                                           |
| **Asignada a**      | **Dev B** — frontend                                   |
| **Rama**            | `hu-534-consola-y-papelera-b`                          |
| **Alcance técnico** | frontend                                               |
| **Depende de**      | HU-531, HU-532 (contratos en `main`; la API se mockea) |
| **Labels**          | `diccionario` `prioridad:critica` `frontend` `a11y`    |

> **Como** administrador,
> **quiero** ver el avance de las señas y corregir entradas directamente en una tabla,
> **para** mantener 479 palabras sin abrirlas una por una.

## Contexto

Pantallas 06 y 11. Es el destino «Diccionario» del admin (`/admin/diccionario`, HU-528). La edición
rápida y el lote **no son optimistas**: la fila dice «Guardando…» hasta que el servidor responde.
«Enviar a la papelera» no pide confirmación porque es reversible (decisión 8): deja `<AvisoDeshacer>`
al menos 8 s y la entrada queda 30 días en la papelera.

## Referencias

- **Archivos a tocar:** `apps/web/src/pages/AdminDiccionarioPage.tsx`, `apps/web/src/pages/AdminPapeleraPage.tsx`,
  `apps/web/src/features/admin/diccionario/{api,hooks,components,lib}/` (nuevo), `apps/web/src/app/router.tsx`.
- **Diseño:** `docs/diccionario/diseno/06-consola-escritorio-claro-2-seleccionadas-edicion-rapida-en-to-drink.png`,
  `06-consola-movil-oscuro-2-seleccionadas.png`, `06-consola-escritorio-oscuro-aviso-deshacer.png`,
  `11-papelera-escritorio-claro.png` · `DISENO.md` §2 (`AvanceSenas`, `FilaEntradaAdmin`,
  `BarraLote`, `AvisoDeshacer`), §3 «Otras» y decisiones 8 y 9.
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — Cabecera con «Crear entrada», `<AvanceSenas>` por módulo («86 de 203 con seña», barra +
      número, `role="progressbar"` con `aria-valuetext`) y los 4 accesos: Cola de grabación,
      Estructura, Importar CSV, Papelera (con sus conteos). Enlace «Ver el diccionario como
      estudiante» a `/diccionario`.
- [ ] **T2** — Tabla de entradas: buscador y selectores visibles con etiqueta (módulo, categoría, tipo,
      unidad, imagen) + chips de seña con conteo; todo en la URL; paginación. En móvil cada fila es una
      tarjeta. Cada fila: inglés, español, tipo, módulo · unidad · categoría, `<EstadoSena vista="admin">`,
      «Editar» (al editor, HU-535) y menú.
- [ ] **T3** — Edición rápida en la fila de inglés, español y tipo: Enter guarda, Esc cancela, Tab
      recorre; «Guardando…»; error bajo la fila; al guardar, foco al botón «Editar» y aviso «To drink
      guardada» (8 s, con cerrar).
- [ ] **T4** — Selección múltiple con `<BarraLote>` («2 seleccionadas», anunciado): mover de categoría,
      mover de módulo o unidad (diálogo con selectores), ocultar/publicar y enviar a la papelera con
      `<AvisoDeshacer>` («Deshacer» restaura).
- [ ] **T5** — `/admin/diccionario/papelera`: lista con «Quedan N días» (ámbar solo cuando quedan ≤ 3),
      «Restaurar», «Eliminar para siempre» (confirmación) y «Vaciar papelera» (confirmación con el
      número). Estado vacío «La papelera está vacía». 409 al restaurar → explica a dónde falta moverla.
- [ ] **T6** — Tests: estudiante y profesor no ven la ruta; el filtro va a la URL; Enter guarda la edición
      rápida y Esc no; el lote envía los ids marcados; «Deshacer» llama a restaurar; `axe` limpio.

## Criterios de aceptación

- [ ] **AC1** — La consola sigue `06-consola-escritorio-claro-…png` en escritorio y
      `06-consola-movil-oscuro-2-seleccionadas.png` a 375 px.
- [ ] **AC2** — Corregir el español de «To drink» desde la fila y pulsar Enter lo guarda sin abrir otra
      pantalla, y la fila no muestra el valor nuevo como guardado hasta que responde el servidor.
- [ ] **AC3** — Enviar 2 entradas a la papelera muestra «2 entradas enviadas a la papelera · Deshacer»
      durante al menos 8 s; «Deshacer» las devuelve a la tabla.
- [ ] **AC4** — Ningún avance se muestra como porcentaje: siempre «N de M».
- [ ] **AC5** — Todo el flujo (filtrar → marcar 2 → mover de categoría) se hace con teclado.

## Fuera de alcance

- Editor (HU-535), estructura (HU-536), importar (HU-537), cola de grabación (HU-540).

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
