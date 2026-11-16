# HU-528 — El diccionario entra a la plataforma: inicio y búsqueda

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                           |
| **Prioridad**       | 🔴 Crítica                                          |
| **Estimación**      | 2 días                                              |
| **Estado**          | ⬜ Pendiente                                        |
| **Asignada a**      | **Dev B** — frontend                                |
| **Rama**            | `hu-528-inicio-y-busqueda-del-diccionario-b`        |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | HU-527 (contrato en `main`; la API se mockea)       |
| **Labels**          | `diccionario` `prioridad:critica` `frontend` `a11y` |

> **Como** estudiante,
> **quiero** encontrar el diccionario en la barra y buscar una palabra en inglés o en español,
> **para** llegar a su seña sin saber en qué módulo está.

## Contexto

Primera pantalla del diccionario y la que fija sus piezas compartidas. Añade **«Diccionario»** como
destino de todos los roles: estudiante y profesor llegan a `/diccionario`; el admin, a su consola
(`/admin/diccionario`, HU-534), que enlaza a la vista de lectura. Con este destino la barra inferior de
móvil pasa a **5** (decisión 11 del diseño). Esta HU también deja escritos en el skill de UI los
patrones nuevos, para que las HU siguientes los hereden.

## Referencias

- **Archivos a tocar:** `apps/web/src/features/diccionario/` (nuevo: `api/`, `hooks/`, `components/`, `lib/`),
  `apps/web/src/pages/DiccionarioPage.tsx`, `apps/web/src/app/router.tsx`,
  `apps/web/src/components/layout/destinos-por-rol.ts` y `app-shell.tsx` (barra inferior),
  `.claude/skills/bighearts-ui/patrones-dominio.md`.
- **Diseño:** `docs/diccionario/diseno/01-inicio-escritorio-claro.png`, `01-inicio-movil-claro.png`,
  `01b-busqueda-sugerencias-escritorio-claro.png`, `01b-busqueda-sin-resultados-movil-claro.png` ·
  `DISENO.md` §2 (`TarjetaModulo`, `InsigniaTramo`, `BuscadorDiccionario`) y §3 (buscador).
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — Piezas compartidas en `features/diccionario/components/`: `<InsigniaTramo>` (color del
      tramo + ícono `signal-low/medium/high` + texto), `<EstadoSena vista>`, `<ChipTipo>` y la clase
      del riel por tramo (`--accent-indigo/teal/rose`). Skill `bighearts-ui` → `patrones-dominio.md`:
      sección «Diccionario» con el riel por tramo, la insignia, y la regla «el video de una seña no
      lleva subtítulos: la palabra escrita al lado es su equivalente».
- [ ] **T2** — Destino «Diccionario» (`BookA`) en `destinos-por-rol.ts` para los tres roles (admin →
      `/admin/diccionario`) y ruta `/diccionario` con `<RequireAuth>`. Barra inferior de móvil con 5
      destinos; en «Muy grande» sus etiquetas bajan a `0.75rem`.
- [ ] **T3** — `<TarjetaModulo>`: disponible (enlace al módulo) y próximo (botón con `aria-expanded`
      que despliega la explicación «Llegará cuando el profesor entregue el material» + «Ir al Módulo
      3»). Layout vertical en escritorio (rejilla 3 × 3, una fila por tramo con su título) y compacta
      en móvil (una columna, número a la izquierda).
- [ ] **T4** — `<BuscadorDiccionario>`: combobox ARIA, desde 2 letras, 150 ms de espera, máx. 8
      sugerencias (inglés con `<Ingles>`, español, módulo y categoría), coincidencia en negrita +
      subrayado, ↑ ↓ Enter Esc, `/` enfoca. Enter sin sugerencia elegida → `/diccionario?q=` con la
      lista completa de resultados. Estados: sin resultados («No encontramos “xxx”. Prueba en inglés o
      en español») y error de red.
- [ ] **T5** — «Visto recientemente»: las últimas 6 entradas abiertas, en `localStorage`
      (`bighearts:diccionario:recientes`, con `try/catch`), con «Borrar esta lista». Si no hay, la
      sección no aparece.
- [ ] **T6** — Tests: el destino aparece para los tres roles con su ruta; el módulo próximo despliega
      la explicación con teclado; el buscador no pide nada con 1 letra y con 2 sí; Enter abre la
      entrada sugerida; `axe` limpio en inicio y resultados.

## Criterios de aceptación

- [ ] **AC1** — Estudiante y profesor ven «Diccionario» en la barra superior y en la barra inferior de
      móvil, y llega a `/diccionario`; el admin llega a `/admin/diccionario`.
- [ ] **AC2** — La pantalla sigue la composición de `01-inicio-escritorio-claro.png` (rejilla 3 × 3
      por tramo) y a 375 px la de `01-inicio-movil-claro.png` (columna compacta).
- [ ] **AC3** — Un módulo próximo es un botón que explica por qué no está disponible; nunca es un
      enlace muerto ni un botón inactivo sin motivo.
- [ ] **AC4** — Escribir «comer» y elegir la primera sugerencia abre la entrada «To eat»; todo el flujo
      funciona solo con teclado.
- [ ] **AC5** — Cada tramo se distingue sin color (ícono de barras + nombre).

## Fuera de alcance

- Pantallas de módulo, categoría y entrada (HU-529, HU-530). La consola del admin (HU-534).

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
