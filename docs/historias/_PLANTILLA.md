# HU-XXX — Título corto de la historia

|            |                                            |
| ---------- | ------------------------------------------ |
| **Sprint** | 2 — Gestión de aulas                       |
| **Estado** | ⬜ Pendiente · 🔄 En curso · ✅ Completada |
| **Rama**   | `hu-XXX-slug-corto-persona`                |
| **Capa**   | backend · frontend · ambas                 |

## Historia

> Como **\<rol\>**, quiero **\<qué\>**, para **\<por qué\>**.

## Contexto

Dos o tres frases: qué problema resuelve esto dentro de la fase y qué hay que saber para
implementarlo bien. Si hay una decisión de arquitectura que la condiciona, enlázala en vez de
copiarla.

## Dependencias

- Depende de: HU-XXX (o "ninguna").
- Reglas de arquitectura implicadas: `docs/ARQUITECTURA.md` §X.
- Skills que aplican: `bighearts-backend` · `bighearts-ui`.
- **Decisiones pendientes que bloquean esta HU:** ninguna. (Si hay alguna de
  `docs/ARQUITECTURA.md` §14.6, nómbrala aquí — `/hu` se detendrá a preguntarla.)

## Tasks

- [ ] **T1** — Contrato: tipos y códigos de error nuevos en `packages/types`.
- [ ] **T2** — Backend: modelo/migración si aplica.
- [ ] **T3** — Backend: service con la lógica y sus tests.
- [ ] **T4** — Backend: controller, DTO y guard de rol.
- [ ] **T5** — Frontend: llamadas de API y hooks de React Query.
- [ ] **T6** — Frontend: componentes y pantalla.
- [ ] **T7** — Documentación afectada.

> El orden habitual en este repo es **tipos → backend → frontend**. Si el contrato compartido llega
> al final, las otras dos capas se escriben contra un contrato imaginario.

## Acceptance criteria

Cada uno debe ser **verificable**: alguien tiene que poder decir "cumple" o "no cumple" sin
opinar. `/hu` los recorre uno por uno al terminar.

- [ ] **AC1** — \<condición observable\>.
- [ ] **AC2** — \<condición observable\>.
- [ ] **AC3** — Errores: ante \<situación\>, la API responde `<CÓDIGO>` y la interfaz muestra
      \<qué ve el usuario\>.
- [ ] **AC4** — Accesibilidad: la pantalla cumple el checklist del skill `bighearts-ui`
      (teclado, 4 estados, `.dark` y `.hc`, contraste, `aria-live`).
- [ ] **AC5** — Verificación automática: `typecheck`, `lint`, `format:check`, `build` y
      `test --workspace @academia/api` en verde.

<!--
Ejemplos de AC bien y mal escritos:

  ✅ Con 2 estudiantes reservando el último cupo a la vez, exactamente uno recibe 201
     y el otro recibe 409 CLASSROOM_FULL; current_bookings queda igual a max_students.
  ❌ La reserva funciona correctamente bajo concurrencia.

  ✅ A 31 minutos del inicio el campo meetingLink NO aparece en la respuesta;
     a 29 minutos sí aparece.
  ❌ El enlace se muestra a tiempo.
-->

## Fuera de alcance

Qué NO entra en esta HU, para que no se cuele. Si algo se aplaza, di a qué HU o fase va.

## Notas de implementación

Se rellena **al cerrar**: decisiones que hubo que tomar, supuestos, deuda que quedó anotada, y
qué documentación se actualizó.
