# HU-540 — Cola de grabación con subida masiva

| Campo               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| **Sprint**          | Post-Fase 1 · Diccionario                        |
| **Prioridad**       | 🟠 Alta                                          |
| **Estimación**      | 2 días                                           |
| **Estado**          | ⬜ Pendiente                                     |
| **Asignada a**      | **Dev B** — frontend                             |
| **Rama**            | `hu-540-cola-de-grabacion-b`                     |
| **Alcance técnico** | frontend                                         |
| **Depende de**      | HU-539                                           |
| **Labels**          | `diccionario` `prioridad:alta` `frontend` `a11y` |

> **Como** administrador,
> **quiero** soltar decenas de videos a la vez y que cada uno encuentre su palabra por el nombre del
> archivo,
> **para** subir las señas de cientos de palabras en tardes y no en semanas.

## Contexto

Pantalla 08 y la especificación de `DISENO.md` §3 «Subida masiva», que manda: emparejar por nombre
normalizado, subir de 2 en 2, lo sin emparejar no bloquea a los demás, las filas no se reordenan
mientras suben, anuncios agrupados. Reutiliza `useSubirSena` y `validarVideo` de HU-539 y los endpoints
`sin-sena` de HU-538.

## Referencias

- **Archivos a tocar:** `apps/web/src/pages/AdminColaGrabacionPage.tsx`,
  `apps/web/src/features/admin/diccionario/components/{tabla-emparejamiento,fila-emparejamiento,lista-sin-sena}.tsx`,
  `apps/web/src/features/admin/diccionario/lib/emparejar-archivos.ts`, `apps/web/src/app/router.tsx`
  (`/admin/diccionario/grabacion`).
- **Diseño:** `docs/diccionario/diseno/08-cola-grabacion-escritorio-claro-subida-en-curso.png`,
  `08-cola-grabacion-escritorio-oscuro-resumen-final.png`, `08-cola-grabacion-movil-claro-subida-en-curso.png`
  · `DISENO.md` §2 (`TablaEmparejamiento`, `FilaEmparejamiento`) y §3.
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — `emparejarArchivos(archivos, entradas)` (función pura): normaliza el nombre (sin extensión,
      minúsculas, sin tildes, `-`/`_`/espacio iguales) y lo compara con `inglesNorm`. Resultado por
      archivo: `emparejada`, `sin-emparejar` (con sugerencia si hay una a ≤ 2 letras), `ambigua` (2+
      entradas: elegir módulo) o `reemplaza` (la entrada ya tiene seña lista).
- [x] **T2** — Zona de subida múltiple + resumen con foco al soltar («9 archivos · 6 emparejados · 2 sin
      emparejar · 1 con error», `role="status"`); validación de cada archivo con `validarVideo` antes de
      subir.
- [x] **T3** — Tabla de emparejamiento: archivo → entrada (módulo · unidad · categoría) → estado →
      acción. Las sin emparejar tienen selector con búsqueda y «Usar “To wash”» si hay sugerencia. Cola
      de subida de 2 en 2 con progreso en MB; «Pausar subida» y «Cancelar todo».
- [x] **T4** — Panel «Sin seña lista» agrupado por módulo y unidad con conteos (y estados de error), y
      «Descargar lista de nombres» (`sin-sena.csv`). Cada entrada sale del panel al quedar `LISTO`.
- [x] **T5** — Resumen final («38 listas · 2 con error») con solo los errores debajo y «Reemplazar
      archivo». Salir con subidas en curso abre un `AlertDialog` con foco en «Seguir aquí». Anuncios
      agrupados cada 5 s; cada error se anuncia una vez.
- [x] **T6** — Tests: `emparejarArchivos` con los casos de §3 (`to-eat.mp4`, `To_Eat.MP4`, `to-wach.mp4` →
      sugerencia «To wash», `IMG_2041.mp4`, un nombre repetido en dos módulos); nunca hay más de 2
      subidas a la vez; el diálogo de salida aparece con subidas en curso; `axe` limpio.

## Criterios de aceptación

- [x] **AC1** — Soltar 10 videos bien nombrados de la lista descargada los empareja todos sin
      intervención y terminan en «Lista».
- [x] **AC2** — Un archivo sin emparejar no detiene a los demás y se puede asignar a mano a cualquier
      entrada.
- [x] **AC3** — Nunca hay más de 2 subidas simultáneas y las filas no cambian de orden durante la subida.
- [x] **AC4** — Al terminar, el Avance de señas de la consola refleja los videos nuevos sin recargar.
- [x] **AC5** — Todo el flujo (elegir archivos → asignar uno sin emparejar → subir) se hace con teclado.

## Fuera de alcance

- Grabar desde la webcam dentro de la plataforma. Subida masiva de imágenes.

## Notas de implementación

La cola es una clase fuera de React (`lib/cola-subida.ts`) con `useSyncExternalStore`; reutiliza el pipeline de `useSubirSena` extraído a `lib/subir-sena.ts`. Se empareja por inglés y, si no coincide, por slug (la lista descargada trae `house-2.mp4`). La lista de nombres se genera en el navegador con el mismo formato de `sin-sena.csv` (el interceptor de `httpClient` solo entiende JSON); salir con subidas intercepta los enlaces porque `BrowserRouter` no tiene `useBlocker`.
