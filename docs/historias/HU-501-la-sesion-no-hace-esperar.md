# HU-501 — La sesión no hace esperar a la landing

| Campo               | Valor                                                             |
| ------------------- | ----------------------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Pulido                                              |
| **Prioridad**       | 🔴 Crítica (la primera pantalla pública tarda 10 s en ser usable) |
| **Estimación**      | 1 día                                                             |
| **Estado**          | ⬜ Pendiente                                                      |
| **Rama**            | `hu-501-la-sesion-no-hace-esperar-<persona>`                      |
| **Alcance técnico** | frontend                                                          |
| **Depende de**      | ninguna                                                           |
| **Labels**          | `post-fase-1` `prioridad:critica` `frontend` `bug` `a11y`         |

> **Como** visitante que llega a BigHearts por primera vez,
> **Quiero** poder crear una cuenta o iniciar sesión desde el primer segundo,
> **Para** no quedarme mirando una página que no me deja hacer nada.

## Contexto

### El diagnóstico

No es un misterio y no está en la landing: está en **tres piezas que se encadenan**.

1. `stores/auth-store.ts` nace en `status: 'checking'`, y solo sale de ahí cuando responde
   `/auth/refresh`.
2. `features/landing/components/cta-acceso.tsx` hace **`if (isChecking) return null`**. Mientras el
   estado sea `checking`, los dos botones **no existen en el DOM**.
3. La API está en el plan gratuito de Render, que **duerme el servicio tras un rato sin tráfico**.
   La primera petición lo despierta, y ese arranque en frío tarda entre 10 y 30 segundos.

Esos son los diez segundos. La landing está pintada y quieta esperando a un backend que se está
levantando.

### Lo que lo hace peor, y es lo que de verdad hay que arreglar

**La landing es pública, y un visitante nuevo no tiene cookie de refresh.** Su petición no puede
tener éxito ni aunque el backend estuviera despierto: está esperando a que le confirmen una sesión
que nunca existió. Es la persona que más rápido necesita ver «Crear una cuenta», y es a la que más
se hace esperar.

El `return null` se escribió con buen criterio —su comentario dice que enseñar «Iniciar sesión» y
cambiarlo medio segundo después es peor que esperar—, y esa intención se conserva. Lo que cambia es
**a quién se le hace esperar**: solo a quien tiene motivos para creer que hay sesión.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §8 (el access token vive en memoria; el refresh en cookie httpOnly),
  y `AUTH_FLOW.md`.
- **Skills:** `bighearts-ui` → los 4 estados, y `voz-microcopy.md`.
- **Archivos:** `stores/auth-store.ts` · `features/auth/hooks/use-session-bootstrap.ts` ·
  `lib/auth/refresh-session.ts` · `features/landing/components/cta-acceso.tsx` ·
  `components/layout/app-shell.tsx`.
- **Decisiones pendientes:** ninguna.

> **La marca del shell también cambia aquí.** `app-shell.tsx` monta la marca como
> `<Link to="/">`, así que un usuario con sesión que pulsa «BigHearts» **sale de la plataforma y
> aterriza en la landing**, que es material de venta para alguien que ya compró. Va en esta HU
> porque es el mismo tema —el shell y la landing entendiendo quién está mirando— y son cuatro
> líneas.

## 🔧 Tasks

### Frontend

- [ ] **T1** — Marca de **sesión previa** en `localStorage`: se escribe al iniciar sesión y cuando
      un refresh sale bien; se borra al cerrar sesión y cuando el refresh falla. **No es un token
      ni un dato sensible**: solo dice «aquí hubo sesión alguna vez».
- [ ] **T2** — El bootstrap **no pide nada si no hay marca**: el store pasa a `anonymous` de
      inmediato. Un visitante nuevo deja de esperar por completo, y la API deja de recibir una
      petición que no podía servir.
- [ ] **T3** — Con marca, el refresh lleva **tiempo límite** (por defecto 3 s, configurable). Si
      expira, el store pasa a `anonymous` y la landing se vuelve usable; si la respuesta llega
      después y es válida, la sesión se rehidrata igual.
- [ ] **T4** — `CtaAcceso` **reserva su espacio** mientras comprueba, en vez de `return null`: un
      hueco de la altura de los botones para que nada salte al aparecer. Se conserva la decisión de
      no enseñar el par equivocado.
- [ ] **T5** — En `app-shell.tsx`, la marca lleva a **`/panel` si hay sesión** y a `/` si no.
- [ ] **T6** — Tests: sin marca no se llama a `/auth/refresh` y el estado es `anonymous` al primer
      render; con marca y respuesta lenta, se cae a `anonymous` al vencer el plazo; la marca de la
      cabecera apunta a `/panel` con sesión y a `/` sin ella; `axe` limpio.

### Documentación

- [ ] **T7** — Anotar el comportamiento en `AUTH_FLOW.md`, y en `DEPLOYMENT.md` que el plan
      gratuito de Render duerme el servicio — que es de dónde salen los 10 segundos.

## ✅ Criterios de aceptación

- [ ] **AC1** — Un visitante **sin sesión previa** ve «Crear una cuenta» e «Iniciar sesión» en el
      primer render, y **no se dispara ninguna petición** a `/auth/refresh`. Verificado con un test.
- [ ] **AC2** — Con sesión previa y la API dormida, los botones aparecen **como mucho al vencer el
      plazo**, nunca a los diez segundos.
- [ ] **AC3** — Quien sí tenía sesión válida sigue entrando rehidratado: esta HU **no rompe** el
      recordar sesión.
- [ ] **AC4** — La zona de los botones **no salta** al aparecer: el espacio estaba reservado.
- [ ] **AC5** — Pulsar «BigHearts» en la cabecera lleva a `/panel` con sesión y a `/` sin ella.
- [ ] **AC6** — **Accesibilidad y verificación:** checklist del skill `bighearts-ui`, `axe` limpio,
      y `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Despertar el backend** con un ping periódico o subir de plan en Render. Es una decisión de
  infraestructura y de coste, no de esta HU. Lo que aquí se arregla es que el frontend deje de
  depender de ello para pintar una página pública.
- **Renderizado en servidor** de la landing.
- Cambiar la rotación de refresh tokens ni nada de `AUTH_FLOW.md`.
- La marca de la cabecera **de la landing**, que apunta a su propia ancla y está bien así.

## Notas de implementación

_Se rellena al cerrar._
