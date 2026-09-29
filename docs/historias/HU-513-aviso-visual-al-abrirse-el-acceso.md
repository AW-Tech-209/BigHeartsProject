# HU-513 — Aviso visual cuando se abre el acceso a la clase

| Campo               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| **Sprint**          | Post-Fase 1 · UX                                 |
| **Prioridad**       | 🟠 Alta                                          |
| **Estimación**      | 1 día                                            |
| **Estado**          | ⬜ Pendiente                                     |
| **Asignada a**      | **Dev B** — frontend                             |
| **Rama**            | `hu-513-aviso-visual-al-abrirse-el-acceso-b`     |
| **Alcance técnico** | frontend                                         |
| **Depende de**      | HU-511                                           |
| **Labels**          | `post-fase-1` `prioridad:alta` `frontend` `a11y` |

> **Como** estudiante sordo con la plataforma abierta en otra pestaña,
> **quiero** ver un aviso cuando mi clase ya se puede abrir,
> **para** enterarme sin depender de un sonido que no oigo.

## Contexto

Otro producto avisaría con un «ding». Aquí `alerta-visual` solo se ve si el estudiante está mirando
esa pantalla. Esta HU lleva el aviso **fuera de la página**: al título de la pestaña, al favicon y a
una notificación del navegador (opcional). **El reloj del cliente no decide** (§4.7): a la hora de
`accessOpensAt` el cliente vuelve a pedir el aula, y solo avisa si el servidor responde que el
acceso está abierto.

## Referencias

- **Archivos a tocar:** `apps/web/src/features/aulas/hooks/use-aviso-apertura.ts` (nuevo),
  `apps/web/src/components/layout/app-shell.tsx`, `apps/web/src/hooks/use-page-title.ts`,
  `apps/web/public/` (favicon con marca), `apps/web/src/pages/PerfilPage.tsx` (preferencia).
- **Reglas:** `ARQUITECTURA.md` → «4.1 La ventana de acceso al enlace» y «4.7 Tiempo y zonas
  horarias». Skill `bighearts-ui` → «Movimiento» (`alerta-visual`, una vez, nunca en bucle).
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — `useAvisoApertura()`, montado en `<AppShell>` solo para `STUDENT`: toma la próxima
      reserva (`useMisReservas({ estado: PROXIMAS, pageSize: 1 })`). Si `accessOpensAt` cae dentro
      de las próximas 2 h, programa **un** `setTimeout` a esa hora que invalida la query. Nada de
      polling.
- [ ] **T2** — Cuando el servidor devuelve `accessState` abierto (y antes no lo estaba): el título
      de la pestaña pasa a «● Ya puedes entrar · {título de la clase}» y el favicon cambia a su
      variante con marca. Los dos vuelven a la normalidad al entrar al detalle de esa clase o
      cuando la clase termina.
- [ ] **T3** — Notificación del navegador **opcional**: en el perfil, un interruptor «Avisarme en el
      navegador cuando se abra mi clase». El permiso **solo se pide al activarlo**, nunca al cargar.
      Si el navegador lo deniega, se explica cómo reactivarlo. Al hacer clic, la notificación lleva
      al detalle del aula.
- [ ] **T4** — Dentro de la app, un `<Callout>` con `alerta-visual` (una sola vez) y `aria-live`:
      «Tu clase {título} ya abrió» con el botón «Ir a la clase». No sale si el estudiante ya está en
      el detalle de esa clase.
- [ ] **T5** — Tests con timers falsos: sin respuesta abierta del servidor no hay aviso aunque pase
      la hora; con ella cambian el título y el callout; el permiso no se pide al montar.

## Criterios de aceptación

- [ ] **AC1** — Con la pestaña abierta en cualquier pantalla con sesión, a la hora de apertura el
      título del documento empieza por «● Ya puedes entrar» en menos de 5 segundos, sin recargar.
- [ ] **AC2** — Si el servidor todavía responde `accessState` cerrado (cliente con el reloj
      adelantado), **no hay aviso**.
- [ ] **AC3** — `Notification.requestPermission` no se llama nunca sin el gesto del usuario en el
      interruptor del perfil (verificado con un espía).
- [ ] **AC4** — Con la notificación activada y el permiso concedido, se muestra una notificación
      por apertura (no una por pantalla visitada), y hacer clic en ella lleva a `/aulas/:id`.
- [ ] **AC5** — El callout interno se anima una sola vez y respeta `prefers-reduced-motion`.

## Fuera de alcance

- Push con el navegador cerrado (requiere service worker/PWA; HU aparte).
- Vibración: la API de `Notification` sin service worker no la soporta.
- Profesores: su aviso de «tu clase empieza» es otra HU si se pide.

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
