# Contrato de API y convenciones de datos

Para ver los endpoints que existen: `grep -rn "@Controller\|@Get\|@Post\|@Patch" apps/api/src`.

## `@academia/types`

Única fuente del contrato back ↔ front. Sin decoradores ni tipos de framework. `enum` de TS (no
`const enum`), con los mismos miembros que su gemelo en `schema.prisma` y cambiados en el mismo
commit. Fechas como ISO 8601. **Nunca** datos sensibles (`User` no tiene `password`). Tras tocarlo:
`npm run build:types`.

## Respuestas y errores

- Todo va en el envelope `{ success, data | error, timestamp }` del interceptor global. Nunca un
  objeto crudo ni un envelope propio.
- Errores con `code` estable de `ApiErrorCode`: se añaden, no se renombran. El frontend decide por
  el `code`, nunca parseando `message`. Validación → `VALIDATION_ERROR` con `details.fields[]`.
- Si el error lleva un número que viene del entorno (umbrales), va en `details`.
- `UNAUTHENTICATED` 401 (sin sesión) ≠ `INSUFFICIENT_ROLE` 403 (rol) ≠ `ACCOUNT_*` 403 (estado de
  cuenta).

## Alcance y rutas

- El alcance sale del token (`@CurrentUser()`). **Ningún parámetro nombra a otro usuario**
  (`?teacherId=` prohibido); un filtro booleano que solo estrecha lo propio (`?mias=true`) sí vale.
- `@Roles` en el método cuando el controlador mezcla rutas públicas y restringidas; en la clase si
  todo es de un rol.
- Rutas literales (`mias`, `resumen`) **antes** de `:id` en el controlador.
- Ids de ruta con `ParseUUIDPipe` que traduce el fallo al `*_NOT_FOUND` del dominio.
- El estado de la cuenta del profesor se comprueba contra la BD, no contra el token.

## DTOs

Uno por operación, que implementa el tipo compartido. Validación en el DTO (`class-validator`); el
`whitelist` rechaza campos no declarados. Salida mapeada explícitamente al tipo compartido: **nunca**
un objeto de Prisma directo. Booleanos de query con `@Transform`, no `@Type(() => Boolean)`.

## Prisma

Id `String @id @default(uuid()) @db.Uuid` · tablas plurales snake_case con `@@map` · columnas con
`@map` · `createdAt`/`updatedAt` · fechas `timestamptz` UTC · `///` solo donde el porqué no es
obvio. Migraciones con `npm run db:migrate`; una aplicada no se edita, se corrige con otra.

## Entorno

Solo en `config/env.schema.ts` (Zod) + `.env.example`. `MEETING_LINK_KEY`: 64 hex (32 bytes);
cambiarla deja ilegibles los enlaces guardados. Los `*_DEFAULT` de `@academia/types` son valores de
fábrica para el formulario; la autoridad es el servidor.
