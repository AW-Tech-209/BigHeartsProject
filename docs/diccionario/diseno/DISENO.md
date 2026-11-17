# Diccionario — Diseño

Fuente: lienzo de Claude Design «BigHearts · Diccionario» (noviembre 2026). Las imágenes de esta
carpeta se generaron desde ese lienzo; el código original de cada artboard está en `referencia/`
**solo como consulta** (no se copia: se construye con los componentes y tokens de la app).

> **Cómo usarlo en una HU:** citar 2–4 imágenes de la pantalla que se construye y la sección de este
> documento. No adjuntar el resto: cada imagen cuesta contexto.

## 1. Índice de pantallas

Convención: `NN-pantalla[-estado]-dispositivo-tema[-detalle].png` · escritorio = 1280 px · movil = 375 px.

| Código | Pantalla                    | Imágenes clave                                                                                                                                                                 |
| ------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01     | Inicio del diccionario      | `01-inicio-escritorio-claro`, `01-inicio-movil-claro`, `01-inicio-*-oscuro-modulo-4-tocado` (próximamente desplegado)                                                          |
| 01b    | Búsqueda                    | `01b-busqueda-sugerencias-*`, `01b-busqueda-sin-resultados-*`, `01b-busqueda-lista-completa-*`                                                                                 |
| 02     | Módulo                      | `02-modulo-*-todas-las-unidades`, `02-modulo-*-unidad-2-elegida`                                                                                                               |
| 03     | Categoría dentro del módulo | `03-categoria-*-sin-filtros`, `03-categoria-*-unidad-1-solo-con-sena`, `03-categoria-filtros-sin-resultados-*`, `03-categoria-cargando-*`                                      |
| 04     | Entrada                     | `04-entrada-escritorio-claro-reproduciendo-…`, `04-entrada-movil-claro-antes-de-reproducir`, `04-entrada-sin-video-*`, `04-entrada-cargando-*`, `04-entrada-error-de-carga-*`  |
| 04c    | Entrada en «Muy grande»     | `04c-entrada-muy-grande`                                                                                                                                                       |
| 05     | Práctica (concepto)         | `05-practica-*` — **no se construye en la primera entrega**                                                                                                                    |
| 06     | Consola (admin)             | `06-consola-escritorio-claro-2-seleccionadas-…`, `06-consola-*-aviso-deshacer*`                                                                                                |
| 07     | Editor de entrada           | `07-editor-escritorio-claro-panel-lateral-video-subiendo`, `07-editor-movil-claro-…-posible-duplicado`, `07-editor-*-video-procesando`, `07-editor-*-video-listo-vista-previa` |
| 08     | Cola de grabación           | `08-cola-grabacion-*-subida-en-curso`, `08-cola-grabacion-*-resumen-final`                                                                                                     |
| 09     | Estructura                  | `09-estructura-escritorio-claro-renombrando-…`, `09-estructura-dialogo-*`                                                                                                      |
| 10     | Importar CSV                | `10-importar-paso-1-*`, `10-importar-paso-2-*`, `10-importar-paso-3-*`, `10-importar-importacion-terminada-*`                                                                  |
| 11     | Papelera                    | `11-papelera-*`                                                                                                                                                                |
| 00     | Sistema                     | `00-estados-*` (estados compartidos), `00-componentes`, `00-interaccion`, `00-decisiones`                                                                                      |

## 2. Componentes nuevos

Ubicación: `apps/web/src/features/diccionario/components/` (lectura) y
`apps/web/src/features/admin/diccionario/components/` (gestión). Tokens de `index.css`, CVA + `cn()`.

| Componente                                                              | Qué es · variantes y estados                                                                                                                                           |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<TarjetaModulo>`                                                       | Enlace (disponible) o botón que despliega la explicación (próximo, `aria-expanded`). Layout `vertical` (escritorio) · `compacta` (móvil, número a la izquierda).       |
| `<InsigniaTramo>`                                                       | Categórica: color del tramo + **ícono de barras** (`signal-low/medium/high`) + nombre. Nunca depende del color.                                                        |
| `<EstadoSena>`                                                          | `vista="estudiante"`: Seña lista · Seña en preparación. `vista="admin"`: Lista · Procesando (ámbar = tiempo) · Error · Sin seña.                                       |
| `<ChipTipo>`                                                            | Palabra · Verbo · Frase · Expresión (neutro).                                                                                                                          |
| `<ChipFiltro>` · `<GrupoFiltros>`                                       | Con conteo; seleccionado = fondo propio + borde + ✓. Solo se muestran los tipos/unidades que existen. Total en `role="status"`.                                        |
| `<TarjetaCategoria>`                                                    | Ícono Lucide + nombre + cantidad; fila (escritorio), apilada a 2 columnas (móvil).                                                                                     |
| `<TarjetaPalabra>`                                                      | Miniatura **estática** o «Seña en preparación»; inglés en `<Ingles>` con `overflow-wrap:anywhere`. Vertical (escritorio) · horizontal (móvil).                         |
| `<ReproductorSena>` + `<SenaEnGrabacion>`                               | Reposo · cargando · reproduciendo en bucle · pausado · error · sin video. Ver §3.                                                                                      |
| `<BuscadorDiccionario>` · `<SugerenciaBusqueda>`                        | Combobox ARIA, ≥ 2 letras, 150 ms, máx. 8. Coincidencia en negrita + subrayado, no con color.                                                                          |
| `<NavEntradas>`                                                         | Anterior / Siguiente: tarjetas (escritorio) · dock fijo sobre la barra inferior (móvil). En los extremos dice «Primera de 51» / «Última de 51».                        |
| `<AvanceSenas>`                                                         | «86 de 203 con seña» + barra; `role="progressbar"` con `aria-valuetext` igual al texto.                                                                                |
| `<FilaEntradaAdmin>` · `<BarraLote>`                                    | Lectura · seleccionada · edición rápida · guardando · error. En móvil cada fila es tarjeta.                                                                            |
| `<ZonaSubida>`                                                          | Uno (editor) o muchos (cola). Botón siempre; arrastrar es atajo. Vacía · arrastrando · subiendo · procesando · lista · error · reemplazar · quitar.                    |
| `<TablaEmparejamiento>` · `<FilaEmparejamiento>`                        | Emparejada · en espera · subiendo · procesando · lista · sin emparejar (con sugerencia) · ambigua · error.                                                             |
| `<PasosImportacion>` · `<DialogoEliminarCategoria>` · `<AvisoDeshacer>` | Flujo del admin. El diálogo es `AlertDialog` con foco inicial en «Volver» y confirmación escribiendo el nombre. `<AvisoDeshacer>` ≥ 8 s, reversible desde la Papelera. |

## 3. Interacción (resumen de `00-interaccion.png`)

**Reproductor**

- `<video muted playsinline loop preload="none" poster>`; **nunca** `autoplay`. Velocidad = `playbackRate`; espejo = `scaleX(-1)` solo sobre el video. Velocidad y espejo se recuerdan en el dispositivo.
- Pantalla completa sobre el contenedor (video + controles + línea de estado), no sobre el `<video>`.
- Foco: «Ver la seña» → Reproducir/Pausa → Velocidad (radiogroup, ← →) → Espejo (switch) → Pantalla completa → ficha → Anterior/Siguiente. Al pulsar «Ver la seña» el foco pasa a «Pausa».
- Atajos solo fuera de campos de texto: `Espacio`/`K` reproducir · `1 2 3` velocidad · `E` espejo · `F`/`Esc` pantalla completa · `← →` entrada anterior/siguiente.
- Una línea de estado visible bajo el video con `aria-live="polite"` («Reproduciendo en bucle · Velocidad 0.75×»). Error con `role="alert"` y «Reintentar». Al cambiar de entrada, foco al `<h1>` y título del documento «To read · Acciones · Diccionario».
- Táctil: tocar el video pausa/reanuda; controles de 48 px en móvil.

**Subida masiva**

1. Elegir o soltar → 2. Validar en el navegador (tipo, tamaño, duración) con la causa en la fila → 3. Emparejar por nombre normalizado (minúsculas, sin tildes, `-`/`_`/espacio iguales; sugerencia si hay una a ≤ 2 letras; ambigua si hay 2+ entradas) → 4. Subir de 2 en 2, progreso en MB, lo sin emparejar no bloquea → 5. Procesar en servidor → 6. Resumen «38 listas · 2 con error».

- Foco al resumen al soltar; anuncios agrupados cada 5 s; las filas no se reordenan; salir con subidas en curso abre `AlertDialog` con foco en «Seguir aquí».
- «Descargar lista de nombres»: CSV `modulo, unidad, ingles, nombre_de_archivo` de las entradas sin seña lista.

**Otras:** edición rápida sin mutación optimista («Guardando…»), barra de lote anuncia «2 seleccionadas», importar no escribe nada hasta «Importar N entradas».

## 4. Decisiones de diseño y su revisión

| #   | Decisión de Claude Design                                                         | Revisión                                                              |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | «Ver la seña» en pastilla opaca sobre la miniatura                                | ✅ Se adopta (respeta «sin texto sobre imagen»).                      |
| 2   | El estudiante solo ve «Seña lista» / «Seña en preparación»                        | ✅ Se adopta.                                                         |
| 3   | Insignia de tramo con ícono de barras                                             | ✅ Se adopta.                                                         |
| 4   | «Próximamente» en gris, no ámbar                                                  | ✅ Se adopta.                                                         |
| 5   | Módulos en columna compacta en móvil                                              | ✅ Se adopta.                                                         |
| 6   | Entrada en dos columnas en escritorio                                             | ✅ Se adopta.                                                         |
| 7   | Filtro de tipo muestra solo los tipos existentes                                  | ✅ Se adopta.                                                         |
| 8   | «Enviar a la papelera» sin confirmación, con «Deshacer»                           | ✅ Se adopta.                                                         |
| 9   | Selectores en la consola; chips solo para Seña                                    | ✅ Se adopta.                                                         |
| 10  | Práctica con botones neutros, sin puntaje                                         | ✅ Se adopta (cuando se construya).                                   |
| 11  | Barra inferior con 5 destinos; etiquetas a 15 px en «Muy grande»                  | ✅ Se adopta. Afecta a toda la app: va en la HU que añade el destino. |
| 12  | Riel en todas las tarjetas del diccionario                                        | ✅ Se adopta; se documenta en el skill `bighearts-ui`.                |
| 13  | Con `prefers-reduced-motion`, el bucle se detiene tras 3 repeticiones (propuesta) | ✅ Se adopta como propuesta y se valida con estudiantes en el piloto. |

## 5. Ajustes sobre el diseño (mandan sobre las imágenes)

1. **Nombres de unidad de los módulos 2 y 3.** El diseño muestra «Unidad N»; se usan los nombres reales de `../ESTRATEGIA.md` §2.
2. **Duración del video: 2 a 15 s, configurable** (el diseño dice 3–8 s). Frases y expresiones como «She is fifteen years old» no caben en 8 s.
3. **Solo MP4 (H.264) (D51).** El diseño dice «MP4 o MOV»; sin conversión en el servidor, el navegador valida que el video sea MP4 reproducible.
4. **Barra del admin.** El diseño muestra «Panel · Aulas · Diccionario»; se conservan los destinos que ya existen (Usuarios, Métricas…) y se suma Diccionario, que para el admin lleva a la consola.
5. **Cifras de seña y miniaturas** son de ejemplo (marcadores de posición). La nota del profesor y la imagen del concepto son opcionales: si no hay, el bloque no aparece.
6. **Logotipo:** el diseño usa el ícono `heart`; se usa `<MarcaBigHearts>`.
7. **«Visto recientemente»** se guarda en el dispositivo (`localStorage` con `try/catch`), como el tema.
