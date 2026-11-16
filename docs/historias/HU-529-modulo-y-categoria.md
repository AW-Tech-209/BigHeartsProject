# HU-529 — Módulo y categoría: de la estructura a las palabras

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                           |
| **Prioridad**       | 🔴 Crítica                                          |
| **Estimación**      | 1.5 días                                            |
| **Estado**          | ⬜ Pendiente                                        |
| **Asignada a**      | **Dev B** — frontend                                |
| **Rama**            | `hu-529-modulo-y-categoria-b`                       |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | HU-528                                              |
| **Labels**          | `diccionario` `prioridad:critica` `frontend` `a11y` |

> **Como** estudiante,
> **quiero** entrar a un módulo, ver sus temas y abrir la lista de palabras de uno,
> **para** repasar el vocabulario como lo enseña el profesor.

## Contexto

Pantallas 02 y 03 del diseño. Los filtros viven en la URL (como en `/aulas`), para que un enlace
compartido abra la misma vista. Una palabra sin video se muestra completa con el estado «Seña en
preparación»: durante meses será lo más común, no un error. La miniatura **nunca reproduce**. El
botón «Practicar» aparece con su estado «Próximamente» del diseño, sin funcionalidad.

## Referencias

- **Archivos a tocar:** `apps/web/src/pages/DiccionarioModuloPage.tsx`,
  `apps/web/src/pages/DiccionarioCategoriaPage.tsx`, `apps/web/src/features/diccionario/{components,hooks,api,lib}/`,
  `apps/web/src/app/router.tsx`.
- **Diseño:** `docs/diccionario/diseno/02-modulo-escritorio-claro-todas-las-unidades.png`,
  `02-modulo-movil-claro-todas-las-unidades.png`, `03-categoria-escritorio-claro-sin-filtros.png`,
  `03-categoria-movil-oscuro-unidad-1-solo-con-sena.png` · `DISENO.md` §2 (`TarjetaCategoria`,
  `ChipFiltro`, `TarjetaPalabra`) y decisión 7.
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — `/diccionario/modulo/:numero`: migas, cabecera con insignia y «Level I», datos (palabras,
      con seña, unidades, categorías), chips de unidad con nombre y conteo (`?unidad=` en la URL) y
      rejilla de `<TarjetaCategoria>` ordenada por cantidad. Enlace «Siguiente módulo» si está
      disponible. Módulo próximo o inexistente → estado vacío con salida al inicio.
- [ ] **T2** — `/diccionario/modulo/:numero/:categoria`: migas, cabecera con insignia + ícono +
      nombre, resumen («51 palabras · 24 con seña»), y `<GrupoFiltros>`: tipo (solo los tipos que
      existen, con la línea «Solo aparecen los tipos que hay en esta categoría»), unidad, y el
      interruptor «Solo con seña». Todo en la URL; «Quitar filtros».
- [ ] **T3** — `<TarjetaPalabra>`: miniatura estática con «Ver la seña» o el bloque «Seña en
      preparación», inglés en `<Ingles>` con `overflow-wrap:anywhere`, español, `<ChipTipo>` y unidad.
      Vertical (rejilla de 3) en escritorio, horizontal en móvil. Muestra 9 y «Mostrar 12 más».
- [ ] **T4** — Tarjeta «Practicar {categoría}» al final, con el estado «Próximamente» (reloj en gris) y el
      botón inactivo **con su motivo escrito** («Llegará en una próxima versión»).
- [ ] **T5** — Los 4 estados en las dos pantallas (cargando con texto, vacío, error con reintento,
      filtros sin resultados con «Quitar filtros»). Título del documento por pantalla
      («Acciones · Módulo 1 · Diccionario»).
- [ ] **T6** — Tests: los chips reflejan la URL y la cambian; «Solo con seña» filtra; un tipo
      inexistente no tiene chip; la tarjeta de una palabra sin seña dice «Seña en preparación» y
      sigue siendo un enlace a su entrada; `axe` limpio.

## Criterios de aceptación

- [ ] **AC1** — Desde el inicio se llega a «Módulo 1 → Acciones → To eat» en tres toques, y cada paso
      tiene migas que vuelven atrás.
- [ ] **AC2** — En Módulo 1 · Acciones solo aparece el chip de tipo «Verbo 51»; con `?unidad=U1` se ven
      16 palabras, y recargar la página conserva el filtro.
- [ ] **AC3** — Ninguna miniatura reproduce video por sí sola ni al pasar el cursor.
- [ ] **AC4** — A 375 px la categoría sigue `03-categoria-movil-oscuro-unidad-1-solo-con-sena.png`
      (filtros arriba, tarjetas horizontales) y no hay scroll horizontal, también en «Muy grande».
- [ ] **AC5** — «Practicar» no hace nada y dice por qué.

## Fuera de alcance

- La pantalla de entrada y el reproductor (HU-530). La práctica funcional.

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
