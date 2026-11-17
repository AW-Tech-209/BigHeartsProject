# Diccionario BigHearts — Estrategia de implementación

> Fuente de contenido: «Propuesta: Diccionario BigHearts por Módulos y Categorías» (27-oct-2026),
> curada a partir del material del profe. Datos extraídos en
> [`vocabulario-m1-m3.csv`](./vocabulario-m1-m3.csv): **479 entradas** (203 · 167 · 109), **19
> categorías**, cuadradas contra las tablas del PDF.
>
> Este documento fija **qué** se construye y **cómo se ve y se usa**. Las HU salen de aquí, después
> del diseño en Claude Design.

---

## 1. Qué es (y qué no es)

Un diccionario **inglés ↔ español ↔ LSC** organizado como lo enseña el profe: **módulo → categoría
→ entrada**, con un atajo de búsqueda que abre la entrada directamente.

- **Es** material de consulta y repaso, disponible para cualquier persona con sesión.
- **No es** un curso, ni registra progreso, ni decide qué puede ver cada estudiante (ver §8, D-1).
- Los videos de las señas llegan **poco a poco**. Una entrada sin video sigue siendo útil (palabra,
  traducción, tipo, unidad, imagen) y lo dice con honestidad.
- **Solo el admin** crea, edita y elimina contenido, y sube los videos.

## 2. Modelo de contenido

```
Módulo (1–9) ── tramo: Básico (1–3) · Intermedio (4–6) · Avanzado (7–9)
 ├── estado: Disponible | Próximamente
 ├── Unidades (U1…Un, con nombre: «U2 · What, Where, When»)
 └── Entradas ── categoría (19, compartidas entre módulos)
                 tipo: Palabra · Verbo · Frase · Expresión
                 unidad (del mismo módulo)
                 video LSC (0 o 1 activo) · imagen (opcional)
```

| Entidad       | Campos                                                                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Módulo**    | número (único), nombre («Level I»), tramo, estado, orden                                                                                                                                       |
| **Unidad**    | módulo, código («U1»), nombre, orden                                                                                                                                                           |
| **Categoría** | nombre, slug, ícono Lucide (lista curada), descripción corta, orden                                                                                                                            |
| **Entrada**   | inglés, español (admite «Tomar, beber»), tipo, módulo, unidad, categoría, imagen?, nota? (variante regional, aclaración), publicada, `deletedAt` (papelera)                                    |
| **Video**     | entrada, lengua de señas (`LSC`; deja la puerta abierta a `ASL` sin migración), asset del proveedor, URL de reproducción, miniatura, duración, estado `PROCESANDO · LISTO · ERROR`, subido por |

**Reglas de contenido**

1. Una palabra vive en el módulo donde se enseña **por primera vez**; no se duplica en módulos
   posteriores. Al crear, si ya existe la misma palabra en inglés, se **avisa** (no se bloquea: hay
   palabras con dos sentidos).
2. Categorías **compartidas**: cada módulo muestra solo las que tienen entradas, ordenadas por
   cantidad.
3. Borrar es seguro: las entradas van a una **papelera** (30 días, «Deshacer» inmediato). Un módulo o
   una categoría con entradas no se borra sin decidir antes a dónde van esas entradas.

### Unidades de los módulos disponibles

| Módulo        | Unidades                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1 · Level I   | U1 Need, Want · U2 What, Where, When · U3 Wish · U4 Then and to do · U5 Have · U6 Talking about my family and me |
| 2 · Level II  | U1 Present progressive · U2 Future with going · U3 Future with will · U4 Planning my vacation                    |
| 3 · Level III | U1 To be, Who · U2 It · U3 Which · U4 Why and because · U5 Why is it important to be a good professional?        |

Módulos 4–9: estado **Próximamente** hasta que el profe entregue su material.

## 3. Arquitectura de información

### Para todos los roles con sesión (lectura)

| Ruta                                | Pantalla                    | Qué responde                                             |
| ----------------------------------- | --------------------------- | -------------------------------------------------------- |
| `/diccionario`                      | Inicio del diccionario      | «¿Qué busco?» y «¿Por dónde empiezo?»                    |
| `/diccionario/modulo/:n`            | Módulo                      | «¿Qué temas trae este módulo?»                           |
| `/diccionario/modulo/:n/:categoria` | Categoría dentro del módulo | «¿Qué palabras hay aquí?» (filtros por tipo y unidad)    |
| `/diccionario/entrada/:slug`        | Entrada                     | «¿Cómo se signa y qué significa?»                        |
| `/diccionario?q=…`                  | Resultados de búsqueda      | Atajo: abre la entrada sin pasar por módulo ni categoría |

- **«Diccionario»** entra como destino propio en la barra superior y en la barra inferior de móvil
  (ícono `BookA` + texto) para estudiante y profesor. Para el admin, su destino es la consola (abajo),
  que incluye «Ver como estudiante».
- Del módulo a la seña en **tres toques**; la búsqueda, en uno.
- Las URL son compartibles: el profe puede pegar el enlace de una entrada en el chat de clase.

### Solo admin (gestión)

| Ruta                               | Pantalla                                                                |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `/admin/diccionario`               | Consola: avance de señas por módulo + tabla de entradas con filtros     |
| `/admin/diccionario/entrada/nueva` | Editor de entrada (también `…/entrada/:id`)                             |
| `/admin/diccionario/grabacion`     | **Cola de grabación**: entradas sin seña, ordenadas por módulo y unidad |
| `/admin/diccionario/estructura`    | Módulos (con sus unidades) y categorías                                 |
| `/admin/diccionario/importar`      | Importar CSV (módulos 4–9 cuando lleguen)                               |

## 4. Cómo se ve y se usa — lectura

### 4.1 Inicio del diccionario

1. **Buscador protagonista**: una sola caja, «Busca en inglés o en español». Tolera tildes y
   errores de escritura; sugiere mientras se escribe (máx. 8, con módulo y categoría); Enter abre la
   lista de resultados. Atajo `/` para enfocar.
2. **Módulos en rejilla 3 × 3, una fila por tramo** (Básico, Intermedio, Avanzado). Cada tarjeta:
   número grande, nombre, tramo con su color categórico + texto, «203 palabras», y cuántas tienen
   seña («86 con seña»). Los módulos _Próximamente_ se ven atenuados, con ícono y texto
   «Próximamente», y al tocarlos explican por qué (nunca un botón mudo).
3. **Visto recientemente** (en este dispositivo): las últimas 6 entradas abiertas.

### 4.2 Módulo

Cabecera con «Módulo 1 · Básico» y «Level I». Debajo, la rejilla de **categorías** del módulo
(ícono, nombre, cantidad), ordenada por cantidad. Las unidades aparecen como chips informativos
(«U2 · What, Where, When») que llevan a la categoría ya filtrada.

### 4.3 Categoría dentro del módulo

Cabecera con insignia del módulo, ícono y nombre de la categoría. **Filtros** por tipo (Palabra,
Verbo, Frase, Expresión) y por unidad, en la URL. **Tarjetas de palabra**: inglés grande (en
`lang="en"`), español debajo, chip de tipo, miniatura de la seña **estática** o el estado «Seña en
preparación». Rejilla de 1/2/3 columnas, nunca 4.

### 4.4 Entrada

- **Reproductor de la seña** (el corazón de la pantalla):
  - **Nunca arranca solo** (prohibición del sistema visual). Miniatura + botón grande «Ver la seña».
  - Al darle play, **repite en bucle** hasta que se pause.
  - **Velocidad 0.5× · 0.75× · 1×**, visible siempre (la más usada para aprender).
  - **Modo espejo** («Ver como en un espejo»), para imitarla.
  - Pantalla completa. Sin pista de audio; el atributo `muted` es fijo.
  - Sin video: un estado propio, honesto — «La seña de esta palabra se está grabando» — sin
    esconder el resto de la ficha.
- **Ficha**: inglés (titular), español, chip de tipo, línea «Módulo 1 · Básico · Unidad 2 · What,
  Where, When», categoría, imagen del concepto si hay, nota si hay.
- **Anterior / Siguiente** dentro de la misma categoría del mismo módulo, con «Entrada 2 de 51 en
  Acciones». Flechas ← → del teclado como atajo, además de los botones.
- «Volver a Acciones» siempre visible.

### 4.5 Uso del color en el diccionario

El diccionario no tiene estados de clase, así que el **riel izquierdo** de las tarjetas marca el
**tramo** del módulo con los acentos categóricos que ya existen: `--accent-indigo` Básico,
`--accent-teal` Intermedio, `--accent-rose` Avanzado. Siempre acompañado de la insignia con texto
(«Módulo 1 · Básico»). Ámbar, verde y rojo **no** se usan aquí salvo para lo que ya significan
(error de carga → destructivo; video procesándose → ámbar suave de _tiempo_; seña lista → éxito en
la consola del admin).

## 5. Cómo se ve y se usa — gestión (admin)

### 5.1 Consola

- **Avance de señas por módulo**: «Módulo 1 · 86 de 203 con seña», con barra y número escrito.
- **Tabla de entradas**: búsqueda; filtros por módulo, categoría, tipo, unidad, **seña (con / sin /
  procesando / error)** e imagen; orden por columna; selección múltiple con acciones en lote
  (mover a categoría, mover a módulo/unidad, ocultar, enviar a la papelera).
- **Edición rápida en la fila** de inglés, español y tipo (Enter guarda, Esc cancela), para corregir
  traducciones con el profe al lado sin abrir el editor.

### 5.2 Editor de entrada

Panel lateral (o página en móvil) con: inglés, español, tipo, módulo → unidad (dependiente),
categoría, nota, imagen, **zona de video** (arrastrar o elegir; vista previa en bucle; reemplazar;
quitar) y «Publicada». Aviso de duplicado si la palabra ya existe. Guardar con `Ctrl+S`. Al crear:
«Guardar y crear otra» en el mismo módulo y categoría.

### 5.3 Cola de grabación (lo que hace viable subir ~479 videos)

- Lista de entradas **sin seña**, agrupada por módulo y unidad: el orden en que se graban.
- **Subida masiva por nombre de archivo**: el admin arrastra muchos videos a la vez; el sistema los
  empareja por nombre (`to-eat.mp4` → «To eat»), muestra la tabla de emparejamiento para confirmar o
  corregir, y sube en paralelo con progreso por archivo. Cada fila sale de la cola cuando su video
  queda `LISTO`.
- Botón «Descargar lista de nombres» (CSV) para que quien graba nombre los archivos bien desde el
  principio.

### 5.4 Estructura

- **Módulos**: crear, editar (nombre, tramo, estado), reordenar y sus **unidades** (crear, renombrar,
  reordenar). Pasar un módulo de _Próximamente_ a _Disponible_ es un interruptor con confirmación.
- **Categorías**: crear, renombrar, elegir ícono de una lista curada de Lucide, reordenar.
- Eliminar un módulo, una unidad o una categoría con entradas abre «¿A dónde van sus N entradas?»
  (mover a… / enviar a la papelera), con confirmación escrita del nombre.

### 5.5 Importar CSV

Mismas columnas que `vocabulario-m1-m3.csv` (`modulo, unidad, categoria, tipo, ingles, espanol`).
Flujo en tres pasos: subir → **vista previa** con nuevas / duplicadas / con errores (categoría o
unidad inexistente, tipo inválido) → confirmar. Nada se escribe hasta confirmar. Es el camino para
los módulos 4–9 y también la carga inicial de las 479.

## 6. Técnica, en una página

- **Backend** (`apps/api/src/diccionario/`): lectura con `@Roles` de cualquier sesión; escritura con
  `@Roles(ADMIN)`. Búsqueda con `unaccent` + `pg_trgm` (índices GIN en inglés y español), sin
  servicio externo. Paginación en tablas del admin; listas de lectura completas por categoría (máx.
  ~60 entradas).
- **Video**: subida **directa del navegador al proveedor** (la API emite una URL firmada; el archivo
  no pasa por Render), conversión a MP4 H.264, miniatura y webhook que marca `LISTO`. Proveedor
  administrado (Bunny Stream / Cloudflare Stream / Mux) — **decisión y costo del cliente** (D-3).
  Respaldo sin proveedor: Supabase Storage aceptando solo MP4 H.264 ≤ 20 MB y ≤ 15 s, con miniatura
  capturada en el navegador.
- **Imágenes**: Supabase Storage, redimensionadas a 800 px en el navegador antes de subir.
- **Carga inicial**: seed/importación de `vocabulario-m1-m3.csv` + 9 módulos + unidades + 19
  categorías con sus íconos (tabla del PDF).
- **Frontend**: `features/diccionario/` (lectura) y `features/admin/diccionario/` (gestión).
  Reproductor propio sobre `<video>` nativo (sin librería), con controles accesibles.

## 7. Accesibilidad y reglas del sistema que aplican

- El video **es** la seña: la palabra y la traducción escritas al lado son su equivalente textual, así
  que no requiere subtítulos. Se deja escrito en el skill de UI para que no parezca una excepción.
- Sin reproducción automática; `prefers-reduced-motion` respetado en transiciones.
- Inglés siempre dentro de `<Ingles>` (`lang="en"`).
- Controles del reproductor como `<button>` con nombre accesible y estado (`aria-pressed` en bucle y
  espejo); velocidad como grupo de radio.
- Táctiles ≥ 44 px (48 px en el botón de reproducir y en móvil). Funciona con «Muy grande» (HU-519).
- Los cuatro estados en cada pantalla: cargando con texto, vacío, error con reintento, éxito.

## 8. Decisiones pendientes (del cliente, no del equipo)

| #   | Pregunta                                                                                                                                                                                                                       | Propuesta por defecto                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| D-1 | El PDF dice «el estudiante solo ve lo que ya le tocó aprender». Hoy la plataforma **no sabe en qué módulo va cada estudiante**. ¿Se limita el acceso por módulo? Eso exige asignar módulos a estudiantes: es plan de estudios. | ✅ **Resuelta (D50):** todo abierto con sesión. Limitar es fase posterior.                                                    |
| D-2 | ¿Se muestran las entradas que aún no tienen seña?                                                                                                                                                                              | ✅ **Resuelta (D50):** sí, «Seña en preparación» + filtro «Solo con seña».                                                    |
| D-3 | Proveedor de video y su costo mensual.                                                                                                                                                                                         | ✅ **Resuelta (D51):** Supabase Storage privado tras un puerto; solo MP4, 2–15 s. Un proveedor de video sería otro adaptador. |
| D-4 | Autorización de imagen de quien signa en los videos.                                                                                                                                                                           | La gestiona la academia fuera de la plataforma.                                                                               |
| D-5 | Diferencia entre «Frase» y «Expresión» (el PDF usa las dos).                                                                                                                                                                   | Mantener ambas como vienen; revisarlo con el profe.                                                                           |
| D-6 | Botón «Practicar <categoría>» que menciona el PDF.                                                                                                                                                                             | Fuera de la primera entrega; se diseña ahora y se construye después.                                                          |

## 9. Entregas propuestas (las HU se escriben después del diseño)

| Etapa                       | Contenido                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **A · Contenido y lectura** | Modelo + carga de las 479 · endpoints de lectura y búsqueda · inicio, módulo, categoría, entrada (sin video, con su estado honesto) |
| **B · Gestión**             | Consola y tabla · editor de entrada · estructura (módulos, unidades, categorías) · papelera · importar CSV                          |
| **C · Señas**               | Proveedor de video · subida en el editor · reproductor completo · cola de grabación con subida masiva                               |
| **D · Después**             | Practicar · favoritos («Mi vocabulario») · vocabulario de la clase · acceso por módulo (si D-1 lo pide)                             |

La etapa A ya entrega valor: los estudiantes consultan las 479 palabras mientras se graban las señas.
