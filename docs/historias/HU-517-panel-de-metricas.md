# HU-517 — Panel de métricas del administrador

| Campo               | Valor                                             |
| ------------------- | ------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · UX                                  |
| **Prioridad**       | 🟡 Media                                          |
| **Estimación**      | 1.5 días                                          |
| **Estado**          | ✅ Hecha                                          |
| **Asignada a**      | **Dev B** — frontend                              |
| **Rama**            | `hu-517-panel-de-metricas-b`                      |
| **Alcance técnico** | frontend                                          |
| **Depende de**      | HU-516 (contrato en `main`; la API se mockea)     |
| **Labels**          | `post-fase-1` `prioridad:media` `frontend` `a11y` |

> **Como** administrador,
> **quiero** ver las métricas de la academia en una pantalla que se entienda de un vistazo y poder
> exportarlas,
> **para** llevarlas a la reunión donde se deciden los planes de clase.

## Contexto

Pinta el contrato de HU-516. Dos reglas del sistema visual condicionan todo: **el color significa
algo** (nada de paletas decorativas por serie) y **prohibidas las gráficas circulares**. Por eso:
barras horizontales hechas con HTML/CSS, **siempre con el número escrito**, y cada gráfica con su
tabla equivalente. No se añade librería de gráficas.

## Referencias

- **Archivos a tocar:** `apps/web/src/pages/MetricasPage.tsx` (nuevo),
  `apps/web/src/features/metricas/{api,hooks,components,lib}/` (nuevo),
  `apps/web/src/app/router.tsx`, `apps/web/src/components/layout/destinos-por-rol.ts`.
- **Reglas:** skill `bighearts-ui` → «Color», «Prohibido» y `layout-y-composicion.md` (rejilla,
  anatomía de página).
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — Ruta `/admin/metricas` con `<RequireAuth roles={[ADMIN]}>` y destino «Métricas» (ícono
      `ChartColumn`) en la barra del admin. Selector de rango: «Últimos 7 / 30 / 90 días» y
      «Personalizado» (dos fechas), guardado en la URL.
- [x] **T2** — Fila de indicadores (`<TarjetaResumen>` del panel): clases impartidas, ocupación,
      asistencia, estudiantes activos. Cada uno con su número y una línea de contexto («de 42
      cupos»). «Clases sin asistencia marcada» en `attention` si es > 0, con un enlace a supervisión.
- [x] **T3** — Desgloses por nivel, modo de instrucción y profesor: barras horizontales con el valor
      escrito al final de cada barra y un botón «Ver como tabla» que alterna con un `<table>`
      semántico.
- [x] **T4** — Franjas: tabla día × hora (solo las horas con clases), cada celda con el número de
      clases y la ocupación escrita. La intensidad del fondo usa **un solo token** en escalones, y
      **nunca** es la única señal.
- [x] **T5** — Bloque de valoraciones (conteos y problemas más citados, en texto) y lista de
      comentarios. Botón «Exportar CSV» que genera un archivo por desglose en el cliente
      (`metricas-AAAA-MM-DD_AAAA-MM-DD.csv`).
- [x] **T6** — Los 4 estados (cargando con texto, vacío «No hubo clases en este rango», error con
      reintento, éxito). Tests: el profesor no ve el destino ni la ruta; cambiar el rango cambia la
      query; «Ver como tabla» muestra los mismos números; `axe` limpio.

## Criterios de aceptación

- [x] **AC1** — Solo el admin ve «Métricas» en la barra. `/admin/metricas` con otro rol muestra
      acceso denegado.
- [x] **AC2** — Cada valor representado en una barra o en una celda de la franja está **escrito como
      número** junto a ella (verificable por texto en el test).
- [x] **AC3** — No hay gráficas circulares ni colores literales en `.tsx`; la intensidad de la
      franja usa un único token.
- [x] **AC4** — El rango sobrevive a recargar la página (está en la URL) y el CSV exportado contiene
      las mismas cifras que la pantalla para ese rango.
- [x] **AC5** — A 375 px no hay scroll horizontal en la página. La tabla de franjas puede
      desplazarse dentro de su propio contenedor, que es enfocable y tiene nombre accesible.

## Fuera de alcance

- Comparativa contra el periodo anterior («+12 %»). Buena siguiente iteración.
- Métricas para el profesor sobre sus propias clases.

## Notas de implementación

El contrato no trae cupos totales: la ocupación se escribe como «72 %» con «de los cupos ofrecidos», no «de 42 cupos».
El CSV sale en un archivo por desglose: `metricas-AAAA-MM-DD_AAAA-MM-DD-<desglose>.csv`.
`npm run build` del API falla por tipos de HU-516 (`admin-metricas.service.ts`), previo a este cambio.
