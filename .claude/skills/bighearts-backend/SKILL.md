---
name: bighearts-backend
description: Invariantes de negocio y convenciones de servidor para BigHearts (academia de inglés para personas hipoacúsicas y sordomudas). Úsalo siempre que se cree, edite o revise lógica de backend, endpoints, servicios, DTOs, guards, esquema de Prisma, migraciones, transacciones, o cualquier cosa que toque reservas, cupos, aulas, el enlace de la videollamada, tokens o emails. Dispara con: endpoint, controlador, servicio, DTO, guard, Prisma, migración, esquema, transacción, reserva, cupo, aula, concurrencia, enlace, token, refresh, email, recordatorio, cron, API, contrato.
license: Proprietary
---

# BigHearts — backend

Academia de inglés **para personas hipoacúsicas y sordomudas**. La plataforma no hace la
videollamada: controla **quién entra, cuándo y cuántos**. Todo el valor del producto está en esas
tres garantías, así que la lógica de servidor no puede fallar en ellas.

> **La regla que ordena todas las demás:** el servidor es la única autoridad. El frontend replica
> lógica para pintar la pantalla, **nunca** para decidir un permiso, un cupo o una ventana temporal.

## Stack (no negociable)

NestJS 11 · **Prisma ^6** (no subir a 7) · PostgreSQL 17 · Zod para validar el entorno ·
`class-validator` para DTOs · `@nestjs/jwt` + `bcryptjs` + `cookie-parser` · `@nestjs/throttler` ·
Vitest (`src/**/*.spec.ts`).

## Las cuatro invariantes duras

Ninguna admite excepción. Si una HU parece pedir romper una, **para y dilo** antes de escribir
código.

1. **Ventana de acceso al enlace.** `meetingLink` se guarda cifrado (AES-256-GCM,
   `MEETING_LINK_KEY`). Se revela solo a quien tiene `Booking.status = CONFIRMED`, y solo desde
   `scheduledAt − ACCESS_WINDOW_MINUTES` (30). El profesor dueño lo ve siempre. **Fuera de la
   ventana el campo se omite de la respuesta** — no se manda cifrado, ni vacío, ni con el dato
   escondido en otro campo.
2. **Concurrencia de cupos.** Toda mutación de reserva ocurre en una transacción que empieza
   bloqueando el aula con `SELECT … FOR UPDATE`. `currentBookings` **solo** se toca ahí dentro.
3. **Cancelación.** Hasta `CANCELLATION_WINDOW_MINUTES` (60) antes. Libera el cupo en la misma
   transacción. La fila pasa a `CANCELLED`, **nunca se borra**: es historial.
4. **No solapamiento.** Un estudiante no puede tener dos reservas `CONFIRMED` con intervalos que se
   cruzan. Se valida **dentro** de la transacción; comprobarlo antes deja una carrera abierta.

El detalle completo —SQL de la transacción, índice único parcial, derivación de estados, errores
que devolver— está en `reglas-reservas.md` de este skill. **Léelo antes de tocar `bookings/` o
`classrooms/`.**

## Tiempo

`scheduledAt` es **`timestamptz` en UTC**, sin excepciones. Toda comparación temporal (ventana de
acceso, de cancelación, "en curso") se hace en el **servidor** contra el reloj de la BD. El reloj
del cliente no decide nada. El frontend formatea a la zona del usuario y siempre muestra la zona
explícita.

## Contrato de API

Toda respuesta va envuelta en `ApiResponse<T>`, y todo error lleva un `code` estable del catálogo
`ApiErrorCode` — el frontend decide qué mostrar a partir del código, **nunca** parseando el
mensaje. El contrato entero (envelope, códigos, DTOs, tipos compartidos, convenciones de Prisma y
del esquema) está en `contrato-api.md` de este skill. **Léelo antes de crear un endpoint, un DTO o
un modelo.**

## Patrón por módulo

**Controller → Service → Prisma.** No hay capa Repository, a propósito: Prisma ya es esa
abstracción.

- **Controller** — recibe el HTTP, valida el DTO con `class-validator`, delega. Cero lógica de
  negocio.
- **Service** — toda la lógica. Lanza errores de dominio tipados. Usa `PrismaService` directo.
- **Guards** — la autenticación es global; las rutas públicas se marcan con `@Public()`. El rol se
  comprueba en el servidor, siempre.

## Seguridad — invariantes ya fijadas

bcrypt coste **12** · el login compara contra un **hash señuelo** cuando el email no existe (evita
enumerar cuentas midiendo latencias) · access token JWT de **15 min** en el cuerpo · refresh
**opaco** de 48 bytes, en BD solo su hash SHA-256, transportado en cookie `httpOnly` con
`Path=/auth` · **rotación en cada uso**, y un token revocado que se vuelve a presentar revoca toda
la familia de sesiones · rate limiting 5/60 s solo en `login` y `register`.

No reimplementes nada de esto: el flujo completo está en `AUTH_FLOW.md`, en la raíz del repo.

## Configuración

`config/env.schema.ts` (Zod) es la **única** fuente de verdad del entorno: el tipo `Env` se infiere
de ahí. Toda variable nueva se añade ahí con su comentario de por qué existe, y también a
`.env.example`. Si falta una obligatoria, la app **se niega a arrancar** y dice cuál — ese
comportamiento es deliberado, no lo suavices.

`/health` es una **readiness probe**: la API arranca aunque la BD esté caída y devuelve 503 hasta
que vuelve. No la conviertas en un ping que mate el proceso.

## Notificaciones

Emails en: reserva confirmada, cancelación por el estudiante, cancelación del aula por el profesor,
y recordatorios **24 h** y **30 min** antes. Los recordatorios los dispara un cron interno de
`@nestjs/schedule` que barre reservas con aviso pendiente; por eso `Booking` lleva marcas de envío
(`reminder24hSentAt`, `reminder30mSentAt`) y el barrido **tiene que ser idempotente**: reiniciar el
proceso no puede duplicar correos.

## Prohibido siempre

Mutar `currentBookings` fuera de la transacción de reserva · borrar filas de `bookings` · devolver
`meetingLink` fuera de la ventana o a quien no tiene reserva · decidir permisos en el frontend ·
guardar el enlace o cualquier secreto en claro · loguear tokens, contraseñas o el enlace · fecha
sin zona para `scheduledAt` · editar a mano una migración ya aplicada · un `catch` que se trague un
error de dominio y responda 200.

## Antes de dar una task de backend por terminada

`npm run typecheck` y `npm run lint` limpios · `npm run test --workspace @academia/api` en verde ·
si tocó `bookings`, **test de concurrencia** (dos transacciones peleando por el último cupo) · si
tocó el esquema, migración generada y aplicada, y enums sincronizados con `@academia/types` · si
añadió variable de entorno, está en `env.schema.ts` **y** en `.env.example` · ningún dato sensible
en la respuesta ni en los logs.

El checklist completo de "terminado" está en el skill `bighearts-dod`.
