# Prompt para Claude Design — Diccionario BigHearts

> Cómo usarlo: pega todo lo que está debajo de la línea en Claude Design. Adjunta además
> `vocabulario-m1-m3.csv` (las 479 palabras reales), `apps/web/src/index.css` (los tokens) y 2–3
> capturas de la app actual (panel, detalle de un aula, catálogo) en claro y oscuro. Si tienen la
> maqueta navegable anterior del diccionario, adjúntala como referencia, pero este brief manda donde
> difieran.

---

## Encargo

Diseña el **Diccionario** de BigHearts: una sección nueva dentro de una plataforma web que ya existe.
Necesito calidad de producto premium: sereno, claro, sin una sola duda sobre qué tocar. Diseña las
pantallas de **lectura** (estudiantes y profesores) y las de **gestión** (solo el administrador), en
**escritorio (1280 px) y móvil (375 px)**, en **tema claro y oscuro**.

## El producto y quién lo usa

BigHearts es una academia de inglés en línea **para personas sordas e hipoacúsicas** en Colombia. La
clase ocurre en Zoom/Meet/Teams; la plataforma gestiona reservas, acceso, historial, y ahora un
diccionario.

- Para muchos usuarios la **Lengua de Señas Colombiana (LSC)** es su primera lengua; el **español
  escrito es la segunda** y el inglés, la tercera. Todo texto tiene que ser corto, literal y sin
  metáforas.
- **Nada llega por sonido.** Todo lo que otro producto diría con un «ding», aquí lo dice la pantalla.
- Parte de los usuarios tiene además **baja visión**: la app ya ofrece tamaño de texto Normal / Grande
  / Muy grande, y el diseño tiene que aguantar «Muy grande» sin romperse.
- Prueba definitiva del producto: _una persona sorda entra, encuentra lo que busca y lo usa sin
  pedirle ayuda a nadie._

## Qué es el diccionario

Inglés ↔ español ↔ LSC, organizado como enseña el profesor: **Módulo → Categoría → Entrada**, con
búsqueda que abre la entrada directamente.

- **9 módulos** en 3 tramos: Básico (1–3), Intermedio (4–6), Avanzado (7–9). Hoy solo están
  disponibles 1, 2 y 3; los demás se muestran como **Próximamente**.
- Cada módulo tiene **unidades** con nombre (Módulo 1: U1 Need, Want · U2 What, Where, When · U3 Wish
  · U4 Then and to do · U5 Have · U6 Talking about my family and me).
- **19 categorías** compartidas entre módulos, cada una con un ícono Lucide: Acciones `activity` ·
  Lugares `map-pin` · Pronombres e ideas `puzzle` · Cómo es `sparkles` · Tiempo y fechas `clock` ·
  Expresiones `quote` · Objetos `lamp` · Palabras de enlace `link` · Familia y personas `users` ·
  Escuela e idiomas `graduation-cap` · Fiestas y deportes `party-popper` · Profesiones y trabajo
  `briefcase` · Dinero y compras `wallet` · Comida y frutas `apple` · Transporte y viajes `bus` ·
  Preguntas `message-circle-question` · Colores `palette` · Números `hash` · Ropa `shirt`.
- **Entrada**: inglés, español, tipo (Palabra · Verbo · Frase · Expresión), unidad, categoría,
  **video de la seña en LSC** (3–8 s, sin audio), imagen del concepto (opcional) y nota (opcional).
- **479 entradas** hoy (203 / 167 / 109). Los videos se graban y suben **poco a poco**: durante meses
  muchas entradas **no tendrán video**. Eso es un estado normal, no un error.
- **Solo el administrador** crea, edita, elimina y sube videos.

Datos reales para usar en el diseño (no inventes palabras):

| Módulo | Categoría   | Tipo      | Inglés                   | Español                | Unidad |
| ------ | ----------- | --------- | ------------------------ | ---------------------- | ------ |
| 1      | Acciones    | Verbo     | To eat                   | Comer                  | U1     |
| 1      | Acciones    | Verbo     | To drink                 | Tomar, beber           | U1     |
| 1      | Lugares     | Frase     | At home                  | En casa                | U2     |
| 1      | Objetos     | Palabra   | Glasses                  | Gafas, vasos           | U5     |
| 1      | Expresiones | Expresión | She is fifteen years old | Ella tiene quince años | U6     |
| 2      | Acciones    | Verbo     | To apply for             | Solicitar              | U2     |
| 3      | Cómo es     | Palabra   | Short                    | Bajo (a), corto (a)    | U3     |
| 3      | Preguntas   | Frase     | Which one? / Which ones? | ¿Cuál? / ¿Cuáles?      | U3     |

(El CSV adjunto trae las 479. Usa casos largos como «She is fifteen years old» y «Which one? / Which
ones?» para probar que las tarjetas aguantan.)

## Sistema visual existente (obligatorio, no lo reinventes)

**La regla fundacional: el color no decora, significa.** Todo color no neutro tiene un significado
fijo, y **ningún estado se comunica solo con color: siempre color + ícono + texto.**

Tokens (modo claro → oscuro):

| Token                | Claro                         | Oscuro                 | Significa                                             |
| -------------------- | ----------------------------- | ---------------------- | ----------------------------------------------------- |
| `--primary`          | `#054DAE`                     | `#65A8F7`              | Acción principal, «lo tuyo». Nunca decoración.        |
| `--primary-soft`     | `#F0F7FD`                     | —                      | Fondo de chips propios                                |
| `--attention`        | `#EEAE25`                     | `#F3BE55`              | **Solo TIEMPO** (urgencia, procesando). Nunca adorno. |
| `--success`          | `#116E4D`                     | —                      | Confirmado, listo                                     |
| `--destructive`      | `#A61C23`                     | —                      | Pérdida o error                                       |
| `--foreground`       | `#131E30`                     | `#F0F4F9`              | Texto (tinta azulada, no negro puro)                  |
| `--muted-foreground` | `#566374`                     | `#A5B1C0`              | Texto secundario                                      |
| `--muted`            | `#EDF4FB`                     | —                      | Inactivo, no disponible                               |
| `--background`       | `#FAFCFE`                     | `#111721`              | Fondo de página                                       |
| `--card`             | `#FFFFFF`                     | `#1B232F`              | Tarjeta (jerarquía por borde, no por sombra)          |
| `--ring`             | `#1364CE`                     | `#84BBFE`              | Foco                                                  |
| `--brand`            | `oklch(0.23 0.05 264)` (navy) | igual                  | Barra superior y barra inferior de móvil (identidad)  |
| `--accent-indigo`    | `oklch(0.46 0.16 285)`        | `oklch(0.75 0.13 285)` | Tramo **Básico** (categórico)                         |
| `--accent-teal`      | `oklch(0.42 0.09 195)`        | `oklch(0.72 0.08 195)` | Tramo **Intermedio**                                  |
| `--accent-rose`      | `oklch(0.48 0.18 340)`        | `oklch(0.78 0.11 340)` | Tramo **Avanzado**                                    |

- **Tipografía**: Geist (todo) e Instrument Serif solo para el `<h1>` de página y titulares de
  estados vacíos. Escala: 13 metadatos · 15 etiquetas · **17 cuerpo** · 19 entradilla · 22 h3 · 28 h2
  · 34 h1. Jerarquía por peso y tamaño, **nunca por color**. Peso mínimo 400. Sin mayúsculas
  sostenidas ni texto justificado.
- **Forma**: escala 4/8, radios 12 px controles · 16 px tarjetas · completo en chips. Elevación por
  borde; sombra solo en lo que flota. Táctiles ≥ 44 px, **48 px** en acciones primarias y en móvil.
- **Rejilla** de 1, 2 o 3 columnas, **nunca 4**. Contenedor máximo 1152 px.
- **Navegación** en barra superior en escritorio y **barra inferior con ícono + texto en móvil**. Nunca
  lateral, nunca hamburguesa. «Diccionario» (ícono `book-a`) se suma como destino propio.
- **La firma visual: el riel**: franja vertical de 4 px en el borde izquierdo de cada tarjeta. En el
  diccionario el riel marca el **tramo** del módulo (índigo/teal/rosa), siempre junto a una insignia
  con texto («Módulo 1 · Básico»).
- Íconos: **Lucide**, trazo 2.
- Implementación: React + Tailwind v4 + shadcn sobre Base UI. Diseña con componentes que se puedan
  construir así (tarjetas, chips, tablas, diálogos, paneles laterales, grupos de radio).

**Prohibido**: sonido como señal · **reproducción automática de video** · placeholder como única
etiqueta · texto sobre imagen o degradado · ámbar decorativo · modales anidados · deshabilitar sin
explicar por qué · porcentajes o gráficas circulares (siempre el conteo literal: «86 de 203») ·
animaciones infinitas o parallax.

## Pantallas a diseñar

### Lectura (estudiante y profesor)

1. **Inicio del diccionario**
   - Buscador protagonista: «Busca en inglés o en español». Sugerencias mientras se escribe (máx. 8,
     cada una con inglés, español, módulo y categoría). Diseña también **sin resultados** («No
     encontramos “xxx”. Prueba en inglés o en español») y la lista completa de resultados.
   - **Rejilla 3 × 3 de módulos, una fila por tramo** con su título (Básico / Intermedio / Avanzado).
     Tarjeta: número grande, «Level I», insignia de tramo, «203 palabras» y «86 con seña».
     _Próximamente_: atenuada, ícono + texto, y al tocarla explica que llegará cuando el profesor
     entregue el material.
   - «Visto recientemente»: 6 entradas compactas.
2. **Módulo**: cabecera «Módulo 1 · Básico» / «Level I»; unidades como chips con su nombre; rejilla de
   categorías del módulo (ícono, nombre, cantidad) ordenada por cantidad.
3. **Categoría dentro del módulo**: insignia del módulo + ícono y nombre de la categoría; filtros por
   tipo y por unidad (con contadores y «Quitar filtros»); **tarjetas de palabra**: inglés grande,
   español, chip de tipo, miniatura **estática** de la seña o el estado **«Seña en preparación»**.
   Filtro «Solo con seña». Un botón «Practicar Acciones» al final, marcado visualmente como función
   próxima (diséñalo, se construye después).
4. **Entrada** (la pantalla más importante — dale el mayor cuidado):
   - **Reproductor de la seña** grande: miniatura + botón «Ver la seña» (nunca autoplay). Al reproducir,
     repite en bucle. Controles siempre visibles con texto: **Velocidad 0.5× · 0.75× · 1×**, **Espejo**
     («Ver como en un espejo»), Pausa/Reproducir, Pantalla completa. Estado de carga y de error.
   - **Sin video**: estado honesto y digno, no un hueco gris: «La seña de esta palabra se está
     grabando», con el resto de la ficha completa.
   - **Ficha**: inglés como titular, español, chip de tipo, línea «Módulo 1 · Básico · Unidad 2 · What,
     Where, When», categoría, imagen del concepto (si hay), nota (si hay).
   - **Anterior / Siguiente** dentro de la categoría del módulo, con «Entrada 2 de 51 en Acciones», y
     «Volver a Acciones».
   - En móvil: el video arriba, los controles al alcance del pulgar, anterior/siguiente fijos abajo
     sobre la barra de navegación.
5. **Práctica (solo concepto, opcional)**: una tarjeta tipo flashcard — se ve la seña, se adivina, se
   revela la palabra. Una sola propuesta, para validar la idea.

### Gestión (solo administrador)

6. **Consola del diccionario**
   - Avance de señas por módulo: «Módulo 1 · 86 de 203 con seña», barra + número escrito.
   - **Tabla de entradas**: búsqueda; filtros por módulo, categoría, tipo, unidad, seña (con / sin /
     procesando / error) e imagen; selección múltiple con acciones en lote (mover de categoría, mover
     de módulo/unidad, ocultar, enviar a la papelera); **edición rápida en la fila** de inglés, español
     y tipo. Estado de cada seña con color + ícono + texto (Lista · Procesando · Error · Sin seña).
   - Accesos a Cola de grabación, Estructura, Importar y Papelera.
7. **Editor de entrada** (panel lateral en escritorio, página en móvil): campos, módulo → unidad
   dependiente, categoría, nota, imagen, **zona de video** (arrastrar o elegir, progreso de subida,
   «Procesando…», vista previa en bucle, reemplazar, quitar), «Publicada», aviso de posible duplicado,
   «Guardar» y «Guardar y crear otra».
8. **Cola de grabación + subida masiva**: lista de entradas sin seña agrupada por módulo y unidad;
   zona para soltar **muchos videos a la vez**; **tabla de emparejamiento** archivo → entrada
   (`to-eat.mp4` → «To eat»), con los no emparejados resaltados para asignar a mano; progreso por
   archivo; resumen final («38 listas · 2 con error»). Botón «Descargar lista de nombres».
9. **Estructura**: módulos (nombre, tramo, estado Disponible/Próximamente, reordenar) con sus
   unidades (crear, renombrar, reordenar); categorías (nombre, ícono desde una lista curada,
   reordenar). Diseña el diálogo **«Eliminar categoría “Ropa” — tiene 3 entradas. ¿A dónde van?»**
   (mover a… / papelera) con confirmación escribiendo el nombre.
10. **Importar CSV**: tres pasos — subir → vista previa (nuevas / duplicadas / con errores, con el
    motivo en cada fila) → confirmar. Nada se guarda hasta confirmar.
11. **Papelera** y el aviso de **«Deshacer»** tras eliminar (sin depender de que se vea en 3 s: queda
    en la papelera 30 días).

## Estados que cada pantalla debe mostrar

Cargando (con texto, no un esqueleto mudo) · vacío · error con reintento · éxito. Además: entrada sin
video, video procesándose, módulo próximamente, búsqueda sin resultados, filtros sin resultados.

## Microcopy

Español neutro, literal, voz activa, frases cortas. Di lo que pasa y qué hacer. Los errores explican
la causa. Nada de «¡Ups!», ni signos de exclamación de celebración, ni lenguaje figurado. El inglés
de las entradas se muestra tal cual (es contenido).

## Lo que necesito que entregues

1. Todas las pantallas de arriba en **1280 px y 375 px**, **claro y oscuro**.
2. La pantalla de Entrada además a **tamaño de texto «Muy grande»** (raíz al 125 %).
3. **Inventario de componentes** nuevos (tarjeta de módulo, tarjeta de categoría, tarjeta de palabra,
   reproductor de seña, insignia de tramo, fila de tabla del admin, zona de subida, tabla de
   emparejamiento…) con sus variantes y estados, nombrados para mapear a React + Tailwind.
4. **Especificación de interacción** del reproductor (orden de foco, atajos, qué se anuncia a lector de
   pantalla) y de la subida masiva.
5. Una nota corta de cada decisión que se aparte de este brief, con el porqué.
