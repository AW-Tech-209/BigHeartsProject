# HU-XXX — Título corto de la historia

| Campo            | Valor                                                                         |
| ---------------- | ----------------------------------------------------------------------------- |
| **Sprint**       | Sprint 2 — Gestión de Aulas                                                   |
| **Prioridad**    | 🔴 Crítica · 🟠 Alta · 🟡 Media · 🟢 Baja                                     |
| **Estimación**   | 2.5 días                                                                      |
| **Estado**       | ⬜ Pendiente · 🔄 En curso · ✅ Completada                                    |
| **Rama**         | `hu-XXX-slug-corto-persona`                                                   |
| **Colaboración** | Paralelo con contrato acordado · Secuencial (A → B) · Solo Dev A · Solo Dev B |
| **Depende de**   | HU-XXX (o "ninguna")                                                          |

> **Como** \<rol\>,
> **Quiero** \<qué\>,
> **Para** \<por qué\>.

## Contexto

Dos o tres frases: qué problema resuelve dentro de la fase y qué hay que saber para implementarlo
bien. Si una decisión de arquitectura la condiciona, **enlázala** en vez de copiarla.

## Dependencias técnicas

- **Reglas de arquitectura implicadas:** `docs/ARQUITECTURA.md` §X.
- **Skills que aplican:** `bighearts-backend` · `bighearts-ui`.
- **Decisiones pendientes que bloquean esta HU:** ninguna.
  Si hay alguna de `docs/ARQUITECTURA.md` §14.6, o algo que la HU da por hecho y no existe en el
  repo (una dependencia, una columna, un servicio externo), **nómbralo aquí**. `/hu` se detiene a
  preguntarlo en vez de inventarlo.

## 🤝 Task de contrato — va primero

- [ ] **T0** — Tipos, enums y códigos de error nuevos en `packages/types` + `npm run build:types`.

> Esta task existe siempre que la HU cruce back y front, y **la hace una sola persona antes de que
> las otras dos empiecen en paralelo**. Es lo que hace real el "paralelo con contrato acordado":
> sin ella, Dev A y Dev B escriben contra un contrato imaginario y el merge duele.
> Si la HU es de una sola capa, bórrala.

## 🔧 Tasks — Dev A (backend)

- [ ] …
- [ ] …

## 🔧 Tasks — Dev B (frontend)

- [ ] …
- [ ] …

## ✅ Criterios de aceptación

Cada uno debe ser **verificable**: alguien tiene que poder decir "cumple" o "no cumple" sin opinar.
`/hu` los recorre uno por uno al terminar, así que un AC vago no produce ninguna verificación útil.

- [ ] **AC1** — \<condición observable\>.
- [ ] **AC2** — \<condición observable\>.
- [ ] **AC3** — **Errores:** ante \<situación\>, la API responde `<CÓDIGO>` y la interfaz muestra
      \<qué ve el usuario\>.
- [ ] **AC4** — **Autorización:** \<quién no puede hacer qué\>, verificado en el backend.
- [ ] **AC5** — **Accesibilidad:** la pantalla cumple el checklist del skill `bighearts-ui`
      (teclado con foco visible, los 4 estados, `.dark` y `.hc`, contraste, `aria-live`), y los
      componentes nuevos pasan `esperarSinFallosDeAccesibilidad()` (`bighearts-dod` §5).
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

Se rellena **al cerrar**: decisiones que hubo que tomar, supuestos, deuda anotada, y qué
documentación se actualizó.
