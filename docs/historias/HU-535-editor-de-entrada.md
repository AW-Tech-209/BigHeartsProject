# HU-535 — Editor de entrada (admin)

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Diccionario                           |
| **Prioridad**       | 🔴 Crítica                                          |
| **Estimación**      | 1.5 días                                            |
| **Estado**          | ⬜ Pendiente                                        |
| **Asignada a**      | **Dev B** — frontend                                |
| **Rama**            | `hu-535-editor-de-entrada-b`                        |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | HU-534                                              |
| **Labels**          | `diccionario` `prioridad:critica` `frontend` `a11y` |

> **Como** administrador,
> **quiero** crear y editar una entrada con todos sus datos en un solo lugar,
> **para** añadir palabras nuevas o corregir las del material del profe.

## Contexto

Pantalla 07. Panel lateral en escritorio (sobre la consola, sin perder la tabla) y página en móvil. Esta
HU cubre los **datos**; las zonas de imagen y video se dejan en su sitio con el texto «La subida de
archivos llega en la siguiente entrega» y se completan en HU-539, para no bloquear la gestión de
contenido mientras se resuelve el almacenamiento.

## Referencias

- **Archivos a tocar:** `apps/web/src/features/admin/diccionario/components/{editor-entrada,formulario-entrada}.tsx`,
  `apps/web/src/pages/AdminEntradaPage.tsx` (móvil y enlace directo), `apps/web/src/app/router.tsx`
  (`/admin/diccionario/entrada/nueva` y `/admin/diccionario/entrada/:id`).
- **Diseño:** `docs/diccionario/diseno/07-editor-escritorio-claro-panel-lateral-video-subiendo.png`
  (estructura del panel; la zona de video aún no), `07-editor-movil-claro-pagina-crear-entrada-con-posible-duplicado.png`.
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — Formulario: inglés, español, tipo (radio), módulo → unidad (dependiente: al cambiar el
      módulo se vacía la unidad), categoría, nota (opcional, ≤ 300), «Publicada» (switch). Etiquetas
      visibles, error junto al campo, botón «Guardar» inactivo **con motivo** mientras falten inglés o
      español.
- [ ] **T2** — Aviso de posible duplicado al salir del campo inglés (`duplicados`, HU-531): «Ya existe
      “To drink” en Módulo 1 · Acciones» con enlace a esa entrada. No bloquea.
- [ ] **T3** — Panel lateral en escritorio (foco atrapado, Esc cierra y devuelve el foco a la fila;
      si hay cambios sin guardar, pregunta dentro del mismo panel). Página en móvil. `Ctrl+S` guarda.
- [ ] **T4** — «Guardar» y, al crear, «Guardar y crear otra» (vuelve al formulario vacío conservando
      módulo, unidad y categoría). Al guardar: aviso «Entrada guardada · To drink ya se ve en el
      diccionario» y la tabla se refresca.
- [ ] **T5** — Desde el editor: «Enviar a la papelera» (con `<AvisoDeshacer>`) y «Ver en el diccionario»
      (abre `/diccionario/entrada/:slug`).
- [ ] **T6** — Tests: no deja guardar sin inglés y lo dice; cambiar el módulo vacía la unidad; el aviso de
      duplicado aparece y no bloquea; «Guardar y crear otra» conserva módulo y categoría; `axe` limpio.

## Criterios de aceptación

- [ ] **AC1** — El admin crea «To swim / Nadar / Verbo / Módulo 2 · U1 · Acciones» y aparece en la
      lectura de esa categoría al final de la Unidad 1.
- [ ] **AC2** — Cerrar el panel con cambios sin guardar pregunta antes, sin abrir un segundo modal.
- [ ] **AC3** — Crear 3 entradas seguidas con «Guardar y crear otra» no obliga a volver a elegir módulo y
      categoría.
- [ ] **AC4** — El editor completo se usa con teclado y lector de pantalla (foco atrapado en el panel,
      vuelve a la fila al cerrar).
- [ ] **AC5** — A 375 px el editor es una página y sigue `07-editor-movil-claro-…png`.

## Fuera de alcance

- Subir video e imagen (HU-539).

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
