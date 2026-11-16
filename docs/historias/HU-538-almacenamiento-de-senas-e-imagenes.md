# HU-538 — Almacenamiento de señas e imágenes (API)

| Campo               | Valor                                                           |
| ------------------- | --------------------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                                       |
| **Prioridad**       | 🔴 Crítica                                                      |
| **Estimación**      | 2 días                                                          |
| **Estado**          | ⬜ Pendiente                                                    |
| **Asignada a**      | **Dev A** — backend                                             |
| **Rama**            | `hu-538-almacenamiento-de-senas-e-imagenes-a`                   |
| **Alcance técnico** | backend · types · infra                                         |
| **Depende de**      | HU-531                                                          |
| **Labels**          | `diccionario` `prioridad:critica` `backend` `infra` `seguridad` |

> **Como** administrador,
> **quiero** subir el video de cada seña y la imagen de cada palabra,
> **para** que los estudiantes vean la seña real en el diccionario.

## Contexto

Decisión nueva **D51**: los archivos van a **Supabase Storage** (ya es nuestro proveedor de BD), en un
**bucket privado**, detrás de un **puerto** `AlmacenamientoMedios` con dos adaptadores, igual que
`NotificationService` (D14): Supabase si están sus variables, y disco local en desarrollo y tests. El
navegador sube **directo** al almacenamiento con una URL firmada (el archivo no pasa por Render) y la
lectura usa URLs firmadas de 1 h. **No hay conversión de video**: se acepta solo MP4 (H.264, lo
valida el navegador en HU-539) de 2 a 15 s y ≤ 20 MB. Si más adelante se contrata un proveedor de
video, es un tercer adaptador y no cambia ningún llamador.

## Referencias

- **Archivos a tocar:** `apps/api/src/almacenamiento/` (nuevo: puerto, `supabase-almacenamiento.service.ts`,
  `local-almacenamiento.service.ts`, `almacenamiento.module.ts`), `apps/api/src/admin/diccionario/medios.*`,
  `apps/api/src/diccionario/diccionario.mapper.ts` (URLs firmadas en la lectura), `apps/api/src/config/env.schema.ts`,
  `apps/api/.env.example`, `packages/types/src/diccionario.ts`, `DEPLOYMENT.md`, `ARQUITECTURA.md` §2 y §11.
- **Reglas:** `ARQUITECTURA.md` → «4.6 Notificaciones» (D14, el patrón de puerto + adaptadores) y «8.
  Seguridad». Skill `bighearts-backend`.
- **Decisiones pendientes:** ninguna para programar. **Operativa:** confirmar que el plan de Supabase
  tiene espacio para ~479 videos (≈ 1–2 MB cada uno a 720p).

## Tasks

- [ ] **T1** — Puerto `AlmacenamientoMedios`: `urlDeSubida(clave, tipo, maxBytes)`,
      `urlsDeLectura(claves, ttl)`, `metadatos(clave)` y `borrar(claves)`. Adaptador Supabase
      (`@supabase/supabase-js` con la service role key, **solo en el servidor**) y adaptador local
      (carpeta `apps/api/storage/`, subida y lectura por endpoints de la API con token firmado). El
      módulo elige en el arranque y lo dice en el log; en `production` sin variables de Supabase, el
      arranque falla (refine en `env.schema.ts`).
- [ ] **T2** — Entorno: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
      (`diccionario`), `DICCIONARIO_VIDEO_MAX_MB` (20), `DICCIONARIO_VIDEO_MIN_S` (2),
      `DICCIONARIO_VIDEO_MAX_S` (15), `DICCIONARIO_IMAGEN_MAX_KB` (800). `DEPLOYMENT.md`: crear el bucket
      privado y definir las variables en Render.
- [ ] **T3** — Video: `POST /admin/diccionario/entradas/:id/video/subida` `{ tipo: 'video/mp4', bytes,
    duracionMs, miniaturaTipo: 'image/jpeg' }` valida límites y crea un `SignVideo` `SUBIENDO` con
      claves `videos/<entradaId>/<uuid>.mp4` y `.jpg`; devuelve las dos URLs de subida.
      `POST …/video/:videoId/confirmar` comprueba que los dos objetos existen y su tamaño, pasa a
      `LISTO`, retira el video anterior de la entrada y borra sus archivos. `DELETE …/video` quita la
      seña. Lo que quede `SUBIENDO` más de 1 h pasa a `ERROR` y se borra (barrido).
- [ ] **T4** — Imagen: `POST …/imagen/subida` (`image/webp` o `image/jpeg`, ≤ `DICCIONARIO_IMAGEN_MAX_KB`)
      y `POST …/imagen/confirmar`; `DELETE …/imagen`. La purga de la papelera (HU-532) borra video e
      imagen de las entradas eliminadas para siempre.
- [ ] **T5** — Lectura: las respuestas de HU-527 llenan `sena.url`, `sena.miniaturaUrl` e `imagenUrl` con
      URLs firmadas de 1 h, pedidas **en lote** por respuesta (no una llamada por entrada). Para la
      Cola de grabación: `GET /admin/diccionario/sin-sena?modulo=` (id, inglés, `inglesNorm`, módulo,
      unidad, categoría, estado de seña) y `GET …/sin-sena.csv` (`modulo, unidad, ingles,
    nombre_de_archivo` con `nombre_de_archivo` = slug + `.mp4`).
- [ ] **T6** — Tests con el adaptador local: límites (19 MB ok, 21 MB → 400 `FILE_TOO_LARGE`; 16 s → 400
      `VIDEO_TOO_LONG`); confirmar sin archivo → 409; reemplazar borra los archivos viejos; un
      estudiante nunca recibe una clave de almacenamiento, solo URLs firmadas; registro de D51.

## Criterios de aceptación

- [ ] **AC1** — En desarrollo, sin variables de Supabase, se sube y se ve un video de prueba con el
      adaptador local; en `production` sin esas variables la API no arranca y dice por qué.
- [ ] **AC2** — Subir el video de «To drink» y confirmarlo hace que `GET /diccionario/entradas/to-drink`
      traiga `sena.estado: 'lista'` y una URL que reproduce el video, y que `conSena` del Módulo 1 suba
      en 1.
- [ ] **AC3** — El bucket es privado: la URL de lectura caduca y una clave sin firmar no da acceso
      (verificado en staging).
- [ ] **AC4** — Reemplazar el video de una entrada deja un solo `SignVideo` activo y borra los archivos
      anteriores del almacenamiento.
- [ ] **AC5** — `ARQUITECTURA.md` registra D51 y `DEPLOYMENT.md` el bucket y las variables.

## Fuera de alcance

- Conversión de video, quitar el audio en el servidor o un proveedor de video administrado (sería un
  tercer adaptador). Las pantallas de subida (HU-539, HU-540).

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
