# BigHearts — contexto permanente

Academia de inglés en línea **para personas sordas e hipoacúsicas**. La clase ocurre en Zoom, Meet o
Teams; esta plataforma gestiona acceso, cupos, reservas, recordatorios e historial.

> **Prueba definitiva:** si un estudiante sordo entra, encuentra su clase, reserva y llega a la
> videollamada sin pedir ayuda, funcionó. **Pregunta guía:** ¿esta decisión trata la LSC como la
> lengua en la que se enseña, o como un accesorio sobre una lengua oral?

Monorepo npm workspaces: `apps/api` (NestJS) · `apps/web` (React + Vite) · `packages/types`
(contrato compartido, se compila a `dist/`). Contenido de producto **en español**; código en inglés.

## Comandos (desde la raíz)

| Comando                                           | Qué hace                                        |
| ------------------------------------------------- | ----------------------------------------------- |
| `docker compose up`                               | Postgres + API + web. Migra y siembra solo.     |
| `npm run dev:api` / `npm run dev:web`             | Una app en watch. Requiere `apps/api/.env`.     |
| `npm run lint` · `npm run build` · `npm run test` | La verificación. `build` compila tipos primero. |
| `npm run test --workspace @academia/api`          | Un solo workspace (igual con `web` y `types`).  |
| `npx vitest run <ruta>`                           | Un solo spec, mientras escribes.                |
| `npm run build:types`                             | Tras tocar `packages/types`.                    |
| `npm run db:migrate` · `db:seed` · `db:seed:demo` | Prisma. `db:seed:demo` monta todos los casos.   |

## Estructura

Backend feature-first: un módulo NestJS por dominio en `apps/api/src/<dominio>/`. Frontend por
dominio: `apps/web/src/features/<dominio>/{api,components,hooks,lib}` + `pages/`,
`components/{ui,layout,dominio}`, `hooks/`, `lib/`, `stores/`. Tema y tokens en
`apps/web/src/index.css` (no existe `globals.css`). Toda pantalla va sobre `<AppShell>` y
`<PaginaCabecera>` (único `<h1>`).

## Stack no negociable

**Back:** NestJS 11 · **Prisma ^6** · PostgreSQL 17 · Zod (entorno) · `class-validator` · Vitest.
**Front:** React 19 · Vite 8 · **Tailwind v4 con config en CSS** · shadcn sobre **Base UI** (prop
`render`, no `asChild`) · `lucide-react` · CVA + `cn()` · React Query · Zustand solo UI/sesión ·
`react-router-dom` v6 · axios. **Deploy:** Render · Vercel · Supabase (`DEPLOYMENT.md`).

## No negociables

Detalle en los skills `bighearts-backend` y `bighearts-ui`.

1. Enlace de clase **cifrado**; solo con reserva `CONFIRMED` y dentro de los **30 min** previos. Si
   no, el campo no viaja.
2. Cupo con **transacción + `SELECT … FOR UPDATE`**; `currentBookings` solo se muta ahí.
3. Cancelar hasta **60 min antes**, liberando cupo en la misma transacción; la reserva pasa a
   `CANCELLED`, no se borra.
4. Sin reservas `CONFIRMED` solapadas; se valida dentro de la transacción.
5. `scheduledAt` en **UTC**; toda comparación temporal en el servidor.
6. La autorización se decide **en el servidor** (`@Roles` + `RolesGuard`); el front solo oculta UI.
7. Secretos por entorno, validados en `config/env.schema.ts`.
8. Estados con **color + ícono + texto**; cero audio; cero colores literales en `.tsx`.
9. Sin mutaciones optimistas en reservas.
10. Tests por rol y texto visible, con `user-event`; **nunca `data-testid`**.

## Coste de contexto

- **No leas `docs/ARQUITECTURA.md` ni `docs/DEFINICION_PROYECTO.md` enteros** (son largos): busca
  la sección con `grep -n` y lee solo esa.
- Comentarios: máximo 2 líneas y solo si el porqué no se deduce.
- Tests: solo invariantes, autorización, funciones puras y `axe` en pantalla nueva. Es un MVP.
- Verifica **una vez al final** (`lint`, `build`, `test`); si falla, repite solo lo que falló.
- Nunca formatees, lintes ni revises `.md`.

## Trampas conocidas (detalle en `README.md`)

1. No borres `optimizeDeps.include: ['@academia/types']` de `apps/web/vite.config.ts`.
2. No actives `incremental: true` en `apps/api/tsconfig.json`.
3. `@academia/types` se compila antes que las apps.
4. Prisma fijado a `^6`; la 7 rompe Supabase.
5. Con el pooler de Supabase, no fíes de `information_schema`.
6. Un solo `package-lock.json`, en la raíz: `npm install <pkg> -w apps/api`.

## Git

Rama `hu-<número>-<slug>-<persona>` · Conventional Commits con ámbito (`feat(api):`, `feat(web):`,
`feat(types):`, `fix(...)`, `docs:`, `chore:`) · todo entra por PR con CI en verde.

## Dónde vive cada cosa

HU en curso → `docs/historias/HU-XXX-*.md` (o `/hu <ruta>`) · reglas de negocio y modelo →
`docs/ARQUITECTURA.md` · alcance → `docs/DEFINICION_PROYECTO.md` · tokens y refresh →
`AUTH_FLOW.md` · instalación → `README.md` · despliegue → `DEPLOYMENT.md`.

**Si algo contradice un doc o un skill, dilo antes de escribir código. No inventes reglas de
negocio: pregunta.**
