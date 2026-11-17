# HU-537 — Importar entradas desde CSV (pantalla)

| Campo               | Valor                                             |
| ------------------- | ------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                         |
| **Prioridad**       | 🟡 Media                                          |
| **Estimación**      | 1 día                                             |
| **Estado**          | ⬜ Pendiente                                      |
| **Asignada a**      | **Dev B** — frontend                              |
| **Rama**            | `hu-537-importar-csv-b`                           |
| **Alcance técnico** | frontend                                          |
| **Depende de**      | HU-533, HU-534                                    |
| **Labels**          | `diccionario` `prioridad:media` `frontend` `a11y` |

> **Como** administrador,
> **quiero** subir un CSV, ver qué va a pasar con cada fila y confirmar,
> **para** cargar un módulo entero sin errores silenciosos.

## Contexto

Pantalla 10, en tres pasos: subir → revisar → confirmar. **Nada se guarda hasta el paso 3.** El foco va
al título de cada paso al avanzar. Los errores se muestran por fila con su motivo; las filas con error
no se importan, las demás sí.

## Referencias

- **Archivos a tocar:** `apps/web/src/pages/AdminImportarPage.tsx`,
  `apps/web/src/features/admin/diccionario/components/{pasos-importacion,tabla-vista-previa}.tsx`,
  `apps/web/src/app/router.tsx` (`/admin/diccionario/importar`).
- **Diseño:** `docs/diccionario/diseno/10-importar-paso-1-escritorio-oscuro.png`,
  `10-importar-paso-2-escritorio-claro.png`, `10-importar-paso-3-movil-claro.png`,
  `10-importar-importacion-terminada-escritorio-claro.png` · `DISENO.md` §2 (`PasosImportacion`).
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — `<PasosImportacion>` (1 Subir · 2 Revisar · 3 Confirmar) con el paso actual marcado con
      texto y `aria-current="step"`.
- [x] **T2** — Paso 1: zona de archivo (botón + arrastrar como atajo), qué columnas debe tener y
      «Descargar plantilla». Archivo que no es CSV o > 1 MB → error con la causa.
- [x] **T3** — Paso 2: resumen («12 nuevas · 2 ya existen · 2 con errores»), chips para filtrar por
      estado, tabla con número de fila, datos y motivo del error; casilla «Actualizar también las que ya
      existen» (por defecto apagada).
- [x] **T4** — Paso 3: «Vas a importar 12 entradas en el Módulo 4» y botón «Importar 12 entradas». Al
      terminar: «Importación terminada» con enlaces a la consola filtrada por ese módulo y a la Cola de
      grabación. Token caducado → explica y vuelve al paso 1.
- [x] **T5** — Tests: el paso 2 no llama a confirmar; el botón final dice el número exacto; salir en el
      paso 2 no importa nada; `axe` limpio en los tres pasos.

## Criterios de aceptación

- [x] **AC1** — Con el CSV de ejemplo de 16 filas, el paso 2 muestra 12/2/2 con el motivo de cada error.
- [x] **AC2** — Ninguna entrada aparece en la consola hasta pulsar «Importar 12 entradas».
- [x] **AC3** — Al avanzar de paso el foco está en el título del paso, y el lector lo anuncia.
- [x] **AC4** — A 375 px la tabla de vista previa se ve como tarjetas sin scroll horizontal (como
      `10-importar-paso-2-movil-claro.png`).
- [x] **AC5** — La importación terminada enlaza a la Cola de grabación de las entradas nuevas.

## Fuera de alcance

- Importar videos (HU-540).

## Notas de implementación

La plantilla pasa a `@academia/types` (`PLANTILLA_IMPORTACION_CSV`) y el servidor la reutiliza; el navegador la descarga sin pedirla porque `httpClient` solo entiende JSON. El paso 2 muestra la casilla de actualizar solo si hay duplicadas, y el botón cuenta nuevas + duplicadas incluidas.
