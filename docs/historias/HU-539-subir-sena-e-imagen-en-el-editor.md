# HU-539 — Subir la seña y la imagen desde el editor

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                           |
| **Prioridad**       | 🔴 Crítica                                          |
| **Estimación**      | 1.5 días                                            |
| **Estado**          | ⬜ Pendiente                                        |
| **Asignada a**      | **Dev B** — frontend                                |
| **Rama**            | `hu-539-subir-sena-e-imagen-en-el-editor-b`         |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | HU-535, HU-538                                      |
| **Labels**          | `diccionario` `prioridad:critica` `frontend` `a11y` |

> **Como** administrador,
> **quiero** subir el video de una seña y la imagen de la palabra desde su editor, y ver la seña antes
> de guardarla,
> **para** completar una entrada sin salir de ella.

## Contexto

Completa las zonas de archivos que HU-535 dejó preparadas. El navegador hace el trabajo que el servidor
no hace (D51): valida que el video sea MP4 reproducible, mide su duración, **captura la miniatura**
con un `<canvas>` y reduce la imagen a 800 px en WebP. La lógica de subida queda en un hook compartido
(`useSubirSena`) porque la Cola de grabación (HU-540) la reutiliza.

## Referencias

- **Archivos a tocar:** `apps/web/src/features/admin/diccionario/components/zona-subida.tsx`,
  `apps/web/src/features/admin/diccionario/hooks/{use-subir-sena,use-subir-imagen}.ts`,
  `apps/web/src/features/admin/diccionario/lib/{validar-video,capturar-miniatura,reducir-imagen}.ts`,
  `editor-entrada.tsx`.
- **Diseño:** `docs/diccionario/diseno/07-editor-escritorio-claro-panel-lateral-video-subiendo.png`,
  `07-editor-escritorio-oscuro-video-procesando.png`, `07-editor-movil-oscuro-video-listo-vista-previa.png`
  · `DISENO.md` §2 (`ZonaSubida`) y §5 (ajustes 2 y 3: 2–15 s, solo MP4).
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — `validarVideo(file)`: tipo `video/mp4`, tamaño ≤ límite, carga en un `<video>` oculto y
      exige `loadedmetadata` con `videoWidth > 0` y duración entre 2 y 15 s. Cada fallo con su causa en
      español («Dura 18 segundos. El máximo es 15.»; «Este video no se puede reproducir en todos los
      navegadores. Expórtalo en MP4 (H.264).»).
- [x] **T2** — `capturarMiniatura(video)`: fotograma al 40 % de la duración, JPEG 720 px de ancho.
      `reducirImagen(file)`: lado mayor 800 px, WebP (JPEG si el navegador no codifica WebP).
- [x] **T3** — `useSubirSena`: pide las URLs (HU-538), sube video y miniatura con progreso en MB («3,1 de
      5,8 MB», nunca porcentaje), confirma, y expone los estados de `<ZonaSubida>` (vacía · arrastrando ·
      subiendo · procesando · lista · error). Cancelable. Sin mutación optimista: «Lista» solo tras la
      confirmación del servidor.
- [x] **T4** — `<ZonaSubida>` en el editor: botón «Elegir video» (arrastrar es atajo), progreso, vista
      previa en bucle **sin autoplay** («Ver la seña»), «Reemplazar» y «Quitar» (confirmación). Igual
      para la imagen con su vista previa. Salir con una subida en curso pregunta antes.
- [x] **T5** — Tests: un `.mov` o un video de 18 s se rechazan con su causa sin llamar a la API; el
      progreso se anuncia por hitos; «Lista» no aparece antes de que responda `confirmar`; `axe` limpio.

## Criterios de aceptación

- [x] **AC1** — Subir un MP4 de 5 s a «To drink» muestra el progreso en MB, termina en «Lista» y la seña
      se reproduce en `/diccionario/entrada/to-drink` con velocidad y espejo (reproductor de HU-530).
- [x] **AC2** — Un video que no cumple (formato, duración, tamaño, no reproducible) se rechaza **antes**
      de subir y la persona sabe qué hacer.
- [x] **AC3** — La miniatura de la seña aparece en la tarjeta de la palabra en la categoría (HU-529).
- [x] **AC4** — Reemplazar un video deja en el diccionario el nuevo, sin pasar por un estado vacío para
      el estudiante.
- [x] **AC5** — Todo el flujo funciona con teclado: elegir archivo, cancelar, reemplazar y quitar.

## Fuera de alcance

- Subida masiva (HU-540). Grabar con la webcam dentro de la plataforma.

## Notas de implementación

Límites por defecto en `@academia/types` (`LIMITES_MEDIOS_POR_DEFECTO`), que también usa `env.schema.ts`; el servidor sigue decidiendo. Al crear, las zonas piden guardar primero (la subida necesita el id). La vista previa de lo ya subido sale de la lectura del estudiante, así que solo se ve si la entrada está publicada; «Quitar» confirma dentro de la zona para no anidar modales.
