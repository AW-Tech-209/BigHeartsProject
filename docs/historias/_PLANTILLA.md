# HU-XXX — Título corto de la historia

| Campo               | Valor                                                      |
| ------------------- | ---------------------------------------------------------- |
| **Sprint**          | Sprint 2 — Gestión de Aulas                                |
| **Prioridad**       | 🔴 Crítica · 🟠 Alta · 🟡 Media · 🟢 Baja                  |
| **Estimación**      | 2.5 días                                                   |
| **Estado**          | ⬜ Pendiente · 🔄 En curso · ✅ Completada                 |
| **Rama**            | `hu-XXX-slug-corto-persona`                                |
| **Alcance técnico** | backend · frontend · fullstack                             |
| **Depende de**      | HU-XXX (o "ninguna")                                       |
| **Labels**          | `sprint-N` `prioridad:<nivel>` `<capa>` `[a11y]` `[infra]` |

> **Como** \<rol\>,
> **Quiero** \<qué\>,
> **Para** \<por qué\>.

## Contexto

Dos o tres frases: qué problema resuelve dentro de la fase y qué hay que saber para implementarlo
bien. Si una decisión de arquitectura la condiciona, **enlázala** en vez de copiarla.

## Dependencias técnicas

- **Reglas de arquitectura implicadas:** `docs/ARQUITECTURA.md` §X.
- **Skills que aplican:** `bighearts-backend` · `bighearts-ui`.
- **Reutiliza:** componentes, helpers o endpoints que ya existen y **no** hay que rehacer.
- **Decisiones pendientes que bloquean esta HU:** ninguna.
  Si hay alguna de `docs/ARQUITECTURA.md` §14.6, o algo que la HU da por hecho y no existe en el
  repo (una dependencia, una columna, un servicio externo), **nómbralo aquí**. `/hu` se detiene a
  preguntarlo en vez de inventarlo.

## 🔧 Tasks

**Una sola persona, una sola sesión.** Tasks `T1…Tn` en orden, agrupadas por capa.

**Máximo 7 tasks.** Si necesitas más, no es una HU: son dos.

### Contrato — va primero

- [ ] **T1** — Tipos, enums y códigos de error nuevos en `packages/types` + `npm run build:types`.

> Existe siempre que la HU cruce back y front. **Va primera**, aunque la implemente la misma
> persona: escribir el contrato antes obliga a decidir la forma de los datos una vez, en vez de
> negociarla dos veces contra uno mismo. Si la HU es de una sola capa, borra esta sección.

### Backend

- [ ] **T2** — …
- [ ] **T3** — …

### Frontend

- [ ] **T4** — …
- [ ] **T5** — …

### Documentación

- [ ] **Tn** — Actualizar lo que esta HU deje desactualizado (tabla de §6 del skill
      `bighearts-dod`).

## ✅ Criterios de aceptación

**Máximo 6.** Cada uno **verificable**: se puede decir "cumple" o "no cumple" sin opinar. `/hu` los
recorre en una tabla al cerrar, así que un AC vago no produce verificación útil. Si tienes diez, o
la HU es demasiado grande o estás repitiendo el mismo en tres formas.

- [ ] **AC1** — \<condición observable\>.
- [ ] **AC2** — \<condición observable\>.
- [ ] **AC3** — **Errores:** ante \<situación\>, la API responde `<CÓDIGO>` y la interfaz muestra
      \<qué ve el usuario\>.
- [ ] **AC4** — **Autorización:** \<quién no puede hacer qué\>, verificado en el backend.
- [ ] **AC5** — **Accesibilidad:** la pantalla cumple el checklist del skill `bighearts-ui`
      (teclado con foco visible, los 4 estados, `.dark` y `.hc`, contraste, `aria-live`), y `axe`
      sale limpio.
- [ ] **AC6** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `npm run test` (los tres workspaces) en verde.

<!--
Cómo se escribe un AC verificable:

  ✅ Con 2 estudiantes reservando el último cupo a la vez, exactamente uno recibe 201 y el otro
     409 CLASSROOM_FULL; current_bookings queda igual a max_students.
  ❌ La reserva funciona correctamente bajo concurrencia.

  ✅ A 31 minutos del inicio el campo meetingLink NO aparece en la respuesta; a 29 minutos sí.
  ❌ El enlace se muestra a tiempo.

  ✅ Enviar el formulario con email vacío muestra el error bajo el campo, con ícono, y el foco
     salta al primer campo inválido.
  ❌ El formulario valida correctamente.

Truco: si el AC no dice QUÉ SE OBSERVA y CUÁNDO, todavía no es un AC.
Y si un AC junta tres cosas con "y", son tres AC.
-->

## 🚫 Fuera de alcance

Qué NO entra, para que no se cuele por el camino. Si algo se aplaza, di a qué HU o fase va.

## Notas de implementación

**Máximo 5 líneas**, y solo si hubo una decisión que no estaba en la HU. Si no la hubo:
«Sin desviaciones». El registro de lo que se hizo es el diff de git, no este apartado.
