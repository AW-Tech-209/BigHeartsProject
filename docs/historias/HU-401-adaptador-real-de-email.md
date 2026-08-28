# HU-401 — El adaptador real de email

| Campo               | Valor                                           |
| ------------------- | ----------------------------------------------- |
| **Sprint**          | Sprint 4 — Notificaciones e Historial           |
| **Prioridad**       | 🔴 Crítica (los avisos hoy solo van a un log)   |
| **Estimación**      | 2 días                                          |
| **Estado**          | ⬜ Pendiente                                    |
| **Rama**            | `hu-401-adaptador-real-de-email-<persona>`      |
| **Alcance técnico** | backend                                         |
| **Depende de**      | HU-301 (✅), HU-303 (✅), HU-306 (✅)           |
| **Labels**          | `sprint-4` `prioridad:critica` `backend` `a11y` |

> **Como** usuario de la plataforma,
> **Quiero** recibir de verdad los avisos que la plataforma dice que me manda,
> **Para** enterarme de lo que pasa con mis clases sin tener que entrar a mirar.

## Contexto

**Casi todo el trabajo ya está hecho, y se hizo a propósito.** La decisión **D14** montó
`NotificationService` como un puerto desde HU-104, precisamente para que este día fuera cambiar una
línea. Hoy hay **cinco tipos de aviso** emitiéndose correctamente —`TEACHER_APPROVED`,
`TEACHER_REJECTED`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `CLASSROOM_CANCELLED`— desde sus
transacciones, y todos acaban en `LoggingNotificationService`, que los escribe y ya.

Esta HU sustituye esa implementación por una real. **No toca a ningún llamador.** Si al terminar
has editado un servicio de reservas o de aulas, algo se torció: vuelve a leer D14.

### Las dos reglas del puerto que no se negocian

1. **`notify()` nunca lanza.** Un fallo de correo no puede deshacer una reserva ya escrita en la
   base de datos. El resultado se devuelve, no se propaga. Está en la firma y en su comentario.
2. **El envío no bloquea la petición.** El estudiante no espera a que Resend responda para ver su
   reserva confirmada.

### La plantilla es la accesibilidad

Este correo lo lee alguien sordo, muchas veces en el móvil. **Ningún dato puede depender del color
ni de un ícono suelto**, todo estado va con su texto, la hora lleva su zona explícita, y el
contenido tiene que entenderse en el modo texto plano que muchos clientes muestran por defecto.
Es la misma regla que la interfaz, aplicada a un medio que no controlamos.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.6 (qué se notifica y cuándo), **D14** (el puerto y sus dos
  adaptadores), **D29** (los avisos de reserva ya se emiten), §4.7 (zonas horarias).
- **Skills:** `bighearts-backend` · `bighearts-ui` → `voz-microcopy.md`, que también manda en el
  correo.
- **Reutiliza:** el puerto `NotificationService` entero y los cinco `NotificationType` que ya
  existen. **No añadas tipos nuevos aquí**: los de recordatorio son de HU-402.
- **Decisión tomada (D32):** el proveedor es **Resend**. Cierra el punto 5 de §14.6.

## 🔧 Tasks

### Backend

- [ ] **T1** — `RESEND_API_KEY` y la dirección remitente en `config/env.schema.ts`, validadas con
      Zod. En desarrollo la clave puede faltar: entonces se sigue usando el adaptador de log, y eso
      **se dice en el arranque**, no se descubre por un correo que no llega.
- [ ] **T2** — `ResendNotificationService` implementando el puerto. Se enchufa cambiando el
      `useClass` de `NotificationsModule`. **Ningún llamador se toca.**
- [ ] **T3** — Envío **fuera de la petición**: la transacción termina y responde sin esperar al
      proveedor. Un error se registra con destinatario, tipo y causa; **nunca se propaga**.
- [ ] **T4** — Las **cinco plantillas**, en español, con versión HTML y texto plano: aprobación y
      rechazo de profesor, reserva confirmada, reserva cancelada, aula cancelada. Cada una con los
      datos de la clase y la hora **con su zona explícita**.
- [ ] **T5** — Tests: el puerto **no lanza** aunque el proveedor falle; se llama una vez por evento;
      sin clave configurada se cae al adaptador de log; y las plantillas se rellenan con los datos
      correctos.

### Documentación

- [ ] **T6** — Añadir `RESEND_API_KEY` y el remitente a `DEPLOYMENT.md` y a `.env.example`, y
      registrar **D32** en `ARQUITECTURA.md` cerrando el punto 5 de §14.6.

## ✅ Criterios de aceptación

- [ ] **AC1** — Los **cinco** avisos existentes salen por Resend sin que se haya modificado ningún
      servicio que los emite. Verificado por el diff: solo cambian `notifications/`, la config y la
      documentación.
- [ ] **AC2** — Si el proveedor devuelve error o expira, **la operación de negocio se completa
      igual** y el fallo queda registrado. Verificado con un test que fuerza el fallo.
- [ ] **AC3** — La petición HTTP no espera al envío: el tiempo de respuesta de reservar no depende
      del proveedor.
- [ ] **AC4** — Sin `RESEND_API_KEY`, la aplicación **arranca** y avisa de que está usando el
      adaptador de log. No revienta ni finge que envía.
- [ ] **AC5** — Cada plantilla tiene versión en **texto plano**, la hora con su zona explícita, y
      ningún dato que dependa del color o de un ícono para entenderse.
- [ ] **AC6** — **Verificación:** `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Los recordatorios de 24 h y 30 min** → HU-402. Esta HU deja el motor listo; aquella lo usa.
- **Preferencias de notificación por usuario.** No están en §5.1: los cinco avisos son
  transaccionales, no marketing, y silenciarlos dejaría a alguien sin saber que su clase se canceló.
- **Reintentos con cola** (BullMQ, D11). Con una sola instancia en Render no hace falta todavía.
- **Editar plantillas desde un panel.** Viven en el repo.

## Notas de implementación

_Se rellena al cerrar._
