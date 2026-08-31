# HU-402 — Recordatorios de clase

| Campo               | Valor                                     |
| ------------------- | ----------------------------------------- |
| **Sprint**          | Sprint 4 — Notificaciones e Historial     |
| **Prioridad**       | 🟠 Alta                                   |
| **Estimación**      | 1.5 días                                  |
| **Estado**          | ✅ Hecho                                  |
| **Rama**            | `hu-402-recordatorios-de-clase-<persona>` |
| **Alcance técnico** | backend                                   |
| **Depende de**      | HU-401                                    |
| **Labels**          | `sprint-4` `prioridad:alta` `backend`     |

> **Como** estudiante,
> **Quiero** que me avisen un día antes y media hora antes de mi clase,
> **Para** no perderme una clase que reservé hace dos semanas.

## Contexto

Las columnas ya están puestas. HU-301 creó `reminder24hSentAt` y `reminder30mSentAt` en `Booking`
sin ninguna lógica detrás, igual que HU-201 creó `currentBookings` un sprint antes de que nadie lo
moviera. **Esta HU es la que las usa.**

**Son marcas de tiempo, no booleanos, y esa es la clave de la idempotencia.** El barrido busca
reservas `CONFIRMED` cuya marca esté vacía y cuya clase entre en la ventana; al enviar, escribe la
marca. Si el proceso se reinicia a mitad, lo ya enviado tiene fecha y no se repite.

### El recordatorio de 30 minutos no es un aviso cualquiera

§4.6 lo dice y conviene no perderlo de vista: **el recordatorio de 30 minutos y la apertura de la
ventana de acceso (§4.1) son el mismo instante, a propósito.** El correo llega justo cuando el
enlace ya se puede ver. Ese correo es, para muchos estudiantes, la forma de llegar a la clase.
Debe llevar el enlace directo a la pantalla del aula — **no el enlace de la videollamada**, que
solo se revela en el servidor bajo sus reglas.

### La limitación que hay que dejar escrita

Con **más de una instancia** de la API, este diseño duplica correos: dos procesos barren a la vez.
Hoy Render corre una sola, así que sirve. Si eso cambia hay que migrar a BullMQ (D11) o poner un
lock en base de datos — y quien lo lea entonces tiene que encontrar esta advertencia.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.6 (el cron, las marcas, la limitación de una sola instancia),
  §4.1 (la ventana de acceso), §4.7 (todo se compara contra el reloj del servidor).
- **Skills:** `bighearts-backend`.
- **Reutiliza:** el adaptador de HU-401 entero, las columnas `reminder24hSentAt` y
  `reminder30mSentAt` de HU-301, y `@nestjs/schedule`.
- **Decisiones pendientes:** ninguna.

## 🔧 Tasks

### Contrato — va primero

- [x] **T1** — Añadir `BOOKING_REMINDER_24H` y `BOOKING_REMINDER_30M` a `NotificationType`, y sus
      dos plantillas al adaptador. Luego `npm run build:types` si el tipo se comparte.

### Backend

- [x] **T2** — Instalar y cablear `@nestjs/schedule`. Un barrido periódico, con el intervalo en el
      entorno y validado por Zod.
- [x] **T3** — El barrido busca reservas **`CONFIRMED`** con la marca correspondiente **vacía** y la
      clase dentro de la ventana. Al enviar, **escribe la marca**.
- [x] **T4** — **No se recuerda** una clase `CANCELLED`, ni una reserva `CANCELLED`, ni una clase
      que ya empezó. Un aviso de algo que no va a ocurrir es peor que ninguno.
- [x] **T5** — El correo de 30 min enlaza a **la pantalla del aula**, no a la videollamada: el
      enlace real solo lo revela el servidor bajo §4.1.
- [x] **T6** — Tests: dos barridos seguidos **no duplican** el envío; una reserva cancelada no
      recibe nada; un aula cancelada tampoco; y la ventana se calcula contra el reloj del servidor.

### Documentación

- [x] **T7** — Dejar escrito en `ARQUITECTURA.md` §4.6, junto al código, que **con más de una
      instancia esto duplica correos**, y qué hacer entonces.

## ✅ Criterios de aceptación

- [x] **AC1** — Una reserva `CONFIRMED` recibe **un** recordatorio a 24 h y **uno** a 30 min, cada
      uno con su marca escrita.
- [x] **AC2** — **Idempotencia:** ejecutar el barrido dos veces seguidas no envía nada por segunda
      vez. Verificado con un test.
- [x] **AC3** — No se envía recordatorio de una clase `CANCELLED`, de una reserva `CANCELLED`, ni de
      una clase que ya empezó.
- [x] **AC4** — El recordatorio de 30 min lleva al aula, y **no contiene el enlace de la
      videollamada**. Verificado con un test.
- [x] **AC5** — Un fallo del proveedor **no deja la marca escrita**: el siguiente barrido reintenta.
- [x] **AC6** — **Verificación:** `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Recordatorios configurables** por el usuario o por el profesor. Las dos ventanas son fijas.
- **Cola de trabajos** (BullMQ). Se documenta como camino de salida, no se construye.
- **Recordatorio al profesor.** §4.6 solo promete los del estudiante; añadirlo es otra HU.
- **SMS o notificaciones push.** Fase posterior.

## Notas de implementación

`ResendNotificationService.notify()` es fire-and-forget (no espera la respuesta de Resend, D32), así
que un fallo real del proveedor no es visible para el cron. AC5 se cumple contra la única señal
disponible: la marca solo se escribe si `notify()` no lanza. Decisión confirmada con el usuario
antes de implementar.
