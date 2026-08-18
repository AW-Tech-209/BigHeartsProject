# HU-103 — Ver y editar el perfil de usuario

| Campo            | Valor                                                |
| ---------------- | ---------------------------------------------------- |
| **Sprint**       | Sprint 1 — Autenticación y Usuarios                  |
| **Prioridad**    | 🟠 Alta                                              |
| **Estimación**   | 2.5 días (⚠️ ver _Decisiones que bloquean_)          |
| **Estado**       | 🔄 En revisión (falta pasada manual de AC4 y AC8)    |
| **Rama**         | `8-hu-103-ver-y-editar-el-perfil-de-usuario-william` |
| **Colaboración** | Paralelo con contrato acordado                       |
| **Depende de**   | HU-102                                               |

> **Como** usuario autenticado,
> **Quiero** ver y editar la información de mi perfil, incluidas mis preferencias de accesibilidad,
> **Para** mantener mis datos actualizados y que la plataforma se adapte a mí.

## Contexto

El registro (HU-101) ya captura nivel de hipoacusia y preferencia de comunicación, pero hoy el
usuario no puede consultarlos ni cambiarlos después. Para el beneficiario central del producto eso
no es un detalle: son los campos con los que la plataforma se adapta a él.

Los campos editables salen del modelo `User` real
([`docs/ARQUITECTURA.md` §7.1](../ARQUITECTURA.md#71-implementado)): `firstName`, `lastName`,
`hearingLossLevel`, `communicationPreference`. El `email` y el `role` **no** se editan en esta HU.

## Dependencias técnicas

- **Reglas de arquitectura implicadas:** `docs/ARQUITECTURA.md` §6.3 (envelope y códigos de error),
  §7.1 (modelo `User` real), §8 (autorización siempre en el servidor).
- **Skills que aplican:** `bighearts-backend` (endpoints, DTOs, mapper) · `bighearts-ui`
  (formulario accesible, microcopy).
- **Contrato existente:** el tipo `User` de `@academia/types` ya define exactamente lo que puede
  viajar al frontend. `password` está deliberadamente fuera; no lo añadas.

## 🤝 Task de contrato — va primero

- [x] **T0** — En `packages/types`: `UpdateProfileInput` (`firstName`, `lastName`,
      `hearingLossLevel?`, `communicationPreference?`) y el código de error `PROFILE_FORBIDDEN` en
      `ApiErrorCode`. Luego `npm run build:types`.

## 🔧 Tasks — Dev A (backend)

- [x] **A1** — `GET /users/me` — devuelve el `User` del token, mapeado con `user.mapper.ts`.
      Nunca el objeto de Prisma directo.
- [x] **A2** — `PATCH /users/me` — actualiza solo los campos editables. `email` y `role` se
      ignoran o se rechazan; **nunca** se actualizan desde este endpoint.
- [x] **A3** — `UpdateProfileDto` con `class-validator`, derivado de `UpdateProfileInput`.
- [x] **A4** — Autorización: el `id` sale **del token**, nunca de la ruta ni del cuerpo. No existe
      `PATCH /users/:id` en esta HU.
- [x] **A5** — Tests: lectura, actualización parcial, intento de cambiar `email`/`role`, e intento
      de editar el perfil de otro usuario.

## 🔧 Tasks — Dev B (frontend)

- [x] **B1** — `features/profile/` con `api/`, `hooks/` (React Query), `components/`.
- [x] **B2** — Pantalla de perfil con los datos actuales y formulario de edición, siguiendo el
      skill `bighearts-ui`: `<label>` visible siempre, error junto al campo con `aria-invalid` +
      `aria-describedby` + ícono, y los 4 estados (cargando, vacío, error, éxito).
- [x] **B3** — Selectores de accesibilidad con las etiquetas en español ya existentes en
      `features/auth/lib/accessibility-labels.ts`. No duplicar ese diccionario.
- [x] **B4** — Al guardar: invalidar la query del perfil y sincronizar el usuario del
      `auth-store`, para que el nombre en la barra de sesión cambie sin recargar.
- [x] **B5** — Anunciar el resultado por `aria-live="polite"` con `useAnnounce`. El usuario no
      puede oír que se guardó.

## ✅ Criterios de aceptación

- [x] **AC1** — `GET /users/me` con token válido devuelve exactamente los campos del tipo `User`
      de `@academia/types`, **sin `password`** ni ningún campo extra.
- [x] **AC2** — Al abrir la pantalla de perfil, los campos aparecen rellenos con los valores reales
      del usuario autenticado, no vacíos ni con placeholders.
- [x] **AC3** — Cambiar nombre y preferencia de accesibilidad, guardar, y recargar la página: los
      valores nuevos persisten.
- [ ] **AC4** — Tras guardar con éxito, el nombre mostrado en la barra de sesión se actualiza
      **sin recargar la página**, y se anuncia por región `aria-live`. _Implementado
      (`useUpdateProfile` → `setUser` del auth-store + `useAnnounce`), pero sin comprobar en
      navegador: falta la pasada manual._
- [x] **AC5** — **Errores:** enviar el formulario con `firstName` vacío responde
      `VALIDATION_ERROR` con `details.fields[]`, y la interfaz pinta el mensaje bajo ese campo con
      ícono, no solo con borde rojo.
- [x] **AC6** — **Autorización:** no existe forma de editar el perfil de otro usuario. Enviar un
      `id` ajeno en el cuerpo de `PATCH /users/me` **no** tiene efecto sobre ese usuario. Verificado
      con un test de backend, no solo ocultando UI.
- [x] **AC7** — **Campos protegidos:** enviar `email` o `role` en el `PATCH` no los modifica.
- [ ] **AC8** — **Accesibilidad:** el formulario se completa entero con teclado y foco visible,
      funciona en `.dark` y `.hc`, y cumple el checklist final del skill `bighearts-ui`.
      _Construido con los componentes que ya cumplen el checklist (`Field`, `Input`,
      `NativeSelect`, `Callout`) y sin colores literales, pero sin verificación visual en
      navegador ni con lector de pantalla._
- [x] **AC9** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `test --workspace @academia/api` en verde. _`format:check` señala un archivo del skill de UI
      que ya fallaba antes de esta HU; ver Deuda anotada._

## 🚫 Fuera de alcance

- Cambiar el email (necesita verificación por correo — HU propia).
- Cambiar la contraseña (HU propia).
- Que un administrador edite el perfil de otro usuario (pertenece a `AdminModule`).
- Borrar la cuenta.

## Notas de implementación

### Decisiones que hubo que tomar

**`PROFILE_FORBIDDEN` se añadió pero no tiene emisor.** T0 lo pedía, pero A4 y AC6 fijan que el id
sale del token y que no existe `PATCH /users/:id`. Con ese diseño ninguna petición puede
provocarlo: no hay forma de _nombrar_ un perfil ajeno. El código queda reservado en el catálogo
(que es aditivo) y lo emitirá `AdminModule`. Está documentado como tal en `packages/types` y en
`contrato-api.md`, para que nadie invente una ruta `/users/:id` solo para darle uso.

**`email` y `role` se rechazan, no se ignoran.** A2 permitía ambas. Se mantuvo el
`whitelist + forbidNonWhitelisted` del ValidationPipe global en vez de debilitarlo para este
endpoint, así que mandarlos devuelve `400 VALIDATION_ERROR`. Cumple AC7 con más fuerza que
ignorarlos. Segunda barrera: `UsersService.updateProfile` arma el `data` campo a campo y nunca
hace spread del DTO.

**Se añadió `USER_NOT_FOUND` al catálogo**, que T0 no previó. Hace falta para el caso real de un
access token válido cuyo usuario ya no existe (el token vive 15 min y el guard no toca la BD).
La alternativa era devolver `INTERNAL_ERROR`, que mentiría sobre la causa.

**Las preferencias de accesibilidad se muestran a todos los roles**, no solo a estudiantes como en
el registro. El modelo las tiene para todo `User` y la HU dice "usuario autenticado"; ocultarlas
dejaría a un profesor sordo sin forma de declarar la suya, que es justo el usuario central del
producto.

**`null` explícito retira una preferencia; omitir la clave la deja intacta.** Sin esa distinción no
habría forma de volver a "Prefiero no indicarlo" después de haber elegido algo. Por eso
`UpdateProfileInput` admite `| null` y el service comprueba `!== undefined` en vez de usar
`?? null`, que colapsaría los dos casos.

### Deuda anotada

- `PROFILE_FORBIDDEN` sin emisor hasta que exista la edición de perfiles ajenos en `AdminModule`.
- AC4 y AC8 se verificaron leyendo el código y con `build`/`lint`, **no** con un navegador real:
  este repo no tiene tests de frontend (ver `docs/ARQUITECTURA.md` §10.2 y §14.6.4). Quedan
  pendientes de una pasada manual con teclado y lector de pantalla en `.dark` y `.hc`.
- `format:check` sigue señalando `.claude/skills/bighearts-ui/tokens.css`, que ya fallaba antes de
  esta HU. Se dejó intacto a propósito: Prettier destruiría la alineación en columnas de la tabla
  de tokens, y el CI no ejecuta `format:check`.
- Quedó en la BD de Supabase la cuenta desechable `hu103-verificacion@academia.local`, usada para
  verificar los AC contra la API real (misma práctica que las de HU-102).

### Documentación actualizada

- `docs/ARQUITECTURA.md` §6.1 — `users` pasa de 🔄 Stub a ✅.
- `CLAUDE.md` — misma marca en el árbol de estructura.
- Skill `bighearts-backend` / `contrato-api.md` — tabla de endpoints con `/users/me`, catálogo de
  códigos con `PROFILE_FORBIDDEN` y `USER_NOT_FOUND`, y la nota de por qué no existe `/users/:id`.
