# HU-530 — La entrada y el reproductor de la seña

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                           |
| **Prioridad**       | 🔴 Crítica                                          |
| **Estimación**      | 2 días                                              |
| **Estado**          | ⬜ Pendiente                                        |
| **Asignada a**      | **Dev B** — frontend                                |
| **Rama**            | `hu-530-entrada-y-reproductor-de-sena-b`            |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | HU-529                                              |
| **Labels**          | `diccionario` `prioridad:critica` `frontend` `a11y` |

> **Como** estudiante sordo,
> **quiero** ver la seña de una palabra despacio, en bucle y como en un espejo, junto a su
> significado,
> **para** aprenderla e imitarla.

## Contexto

La pantalla más importante del diccionario (04 del diseño). El reproductor se construye **completo
desde ya** sobre `<video>` nativo, sin librería, aunque todavía no haya videos: con `sena.url = null`
se ve `<SenaEnGrabacion>`, y en cuanto HU-538 entregue URLs reales funciona sin tocar nada. **Nunca
`autoplay`.** Con `prefers-reduced-motion` el bucle se detiene tras 3 repeticiones (decisión 13,
adoptada; se valida en el piloto).

## Referencias

- **Archivos a tocar:** `apps/web/src/pages/DiccionarioEntradaPage.tsx`,
  `apps/web/src/features/diccionario/components/{reproductor-sena,sena-en-grabacion,nav-entradas,ficha-entrada}.tsx`,
  `apps/web/src/features/diccionario/hooks/use-preferencias-reproductor.ts`, `apps/web/src/app/router.tsx`.
- **Diseño:** `docs/diccionario/diseno/04-entrada-escritorio-claro-reproduciendo-a-0-75-con-espejo.png`,
  `04-entrada-movil-claro-antes-de-reproducir.png`, `04-entrada-sin-video-escritorio-claro.png`,
  `04c-entrada-muy-grande.png` · `DISENO.md` §3 «Reproductor» (foco, atajos, anuncios: es la
  especificación).
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — `/diccionario/entrada/:slug`: migas, «Volver a {categoría}», «Entrada 2 de 51 en
      Acciones», y dos columnas en escritorio (reproductor | ficha) que pasan a una en móvil (video
      arriba). Ficha: insignia de módulo + `<ChipTipo>`, inglés como `<h1>` serif (`tabIndex=-1`),
      español, «Módulo y unidad», categoría (enlace), `<EstadoSena vista="estudiante">`, imagen y nota
      solo si existen. Guarda la entrada en «Visto recientemente».
- [x] **T2** — `<ReproductorSena>`: `<video muted playsinline loop preload="none" poster>`; reposo con
      la pastilla opaca «Ver la seña» sobre la miniatura; al pulsarla el foco pasa a «Pausa».
      Controles siempre visibles y con texto: Reproducir/Pausa, Velocidad 0.5× · 0.75× · 1× (radiogroup),
      «Ver como en un espejo» (switch, `scaleX(-1)` solo sobre el video), Pantalla completa sobre el
      contenedor. Tocar el video pausa/reanuda.
- [x] **T3** — Línea de estado visible con `aria-live="polite"` con los textos exactos de `DISENO.md`
      §3 (reposo, reproduciendo, pausa, velocidad, espejo, cargando > 400 ms, conexión lenta > 10 s);
      error con `role="alert"` y «Reintentar». Velocidad y espejo se recuerdan en el dispositivo
      (`localStorage` con `try/catch`). Reduced motion: se detiene tras 3 vueltas y lo dice.
- [x] **T4** — Atajos solo fuera de campos de texto: `Espacio`/`K`, `1 2 3`, `E`, `F`/`Esc`, `← →`
      (dentro del grupo Velocidad las flechas cambian la velocidad). Se muestran escritos bajo los
      controles en escritorio. El listener se monta en la página, no en `window` global de la app.
- [x] **T5** — `<NavEntradas>`: tarjetas en escritorio y dock fijo sobre la barra inferior en móvil;
      en los extremos «Primera de 51» / «Última de 51». Al cambiar de entrada: foco al `<h1>` y título
      del documento «To read · Acciones · Diccionario».
- [x] **T6** — Tests: no hay `autoplay`; «Ver la seña» llama a `play()` y mueve el foco; elegir 0.75×
      fija `playbackRate`; espejo cambia `aria-checked`; `→` navega a la siguiente; sin URL se ve
      «La seña de esta palabra se está grabando» y no hay controles; `axe` limpio.

## Criterios de aceptación

- [x] **AC1** — Ninguna entrada reproduce video sin que la persona lo pida (verificado: el `<video>` no
      tiene `autoplay` y `play()` solo se llama desde un gesto).
- [x] **AC2** — Con un video de prueba, reproducir a 0.75× con espejo deja `playbackRate === 0.75`, el
      video invertido y los controles sin invertir; la línea de estado dice «Reproduciendo en bucle ·
      Velocidad 0.75×».
- [x] **AC3** — Una entrada sin seña muestra su ficha completa y el bloque «La seña de esta palabra se
      está grabando», sin hueco vacío ni error.
- [x] **AC4** — Todo el reproductor se usa con teclado en el orden de `DISENO.md` §3, y al salir de
      pantalla completa el foco vuelve al botón.
- [x] **AC5** — A 375 px y en «Muy grande» la composición sigue `04-entrada-movil-claro-antes-de-reproducir.png`
      y `04c-entrada-muy-grande.png`, sin scroll horizontal.

## Fuera de alcance

- Subir videos (HU-538 a HU-540). Práctica, favoritos.

## Notas de implementación

Con `prefers-reduced-motion` el `<video>` va sin `loop` y se repite a mano 3 veces (`ended`) antes de detenerse. `<AppShell conDock>` sube el botón de ayuda en móvil para que no tape el dock de Anterior/Siguiente. Pantalla completa y foco al salir no se cubren con test (jsdom no la implementa).
