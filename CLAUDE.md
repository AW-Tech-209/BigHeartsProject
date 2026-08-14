# BigHearts — contexto permanente

Academia de inglés en línea **para personas hipoacúsicas y sordomudas**. La videollamada ocurre
fuera (Zoom/Meet); esta plataforma gestiona acceso, cupos, reservas, recordatorios e historial.

> **Prueba definitiva del producto:** si un estudiante sordo entra, encuentra su clase, reserva y
> llega a la videollamada sin pedirle ayuda a nadie, funcionó. Ante la duda entre dos opciones, esa
> es la pregunta que decide.

Monorepo npm workspaces: `apps/api` (NestJS) · `apps/web` (React + Vite) · `packages/types`
(contrato compartido). Todo el contenido de producto se escribe **en español**; el código, en
inglés.

---

## Comandos

Todos desde la **raíz** del repo.

| Comando                                                      | Qué hace                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `docker compose up`                                          | Levanta todo (Postgres + API + web). Migra y siembra solo.   |
| `npm run dev:api` / `npm run dev:web`                        | Una app en watch, fuera de Docker. Requiere `apps/api/.env`. |
| `npm run build`                                              | Compila los tres workspaces (tipos primero).                 |
| `npm run typecheck`                                          | Tipos de los tres workspaces.                                |
| `npm run lint` / `npm run lint:fix`                          | ESLint en todo el repo.                                      |
| `npm run format:check`                                       | Prettier sin escribir.                                       |
| `npm run test --workspace @academia/api`                     | Tests de backend (Vitest). **No hay tests de frontend.**     |
| `npm run db:migrate` / `db:deploy` / `db:studio` / `db:seed` | Prisma.                                                      |

Health: `curl http://localhost:3000/health` → `{"success":true,...,"database":"up"}`.
Seed: un usuario por rol, contraseña `Password123!` (ver `README.md`).

---

## Estructura

```
apps/api/src/     config · prisma · common · health · auth ✅
                  users 🔄 · classrooms · bookings · sessions · notifications · admin ⬜ (stubs)
apps/web/src/     app/ (providers, router) · pages/ · features/<dominio>/{api,components,hooks,lib}
                  components/ui/ (shadcn+Base UI) · components/dominio/ · hooks/ · lib/ · stores/
                  index.css  ← tema Tailwind v4 y tokens. NO existe src/styles/globals.css
packages/types/   contrato único back↔front. Se compila a dist/.
docs/             DEFINICION_PROYECTO.md · ARQUITECTURA.md · historias/
```

Backend feature-first por módulo NestJS; frontend feature-based por dominio. Nada de carpetas por
tipo de archivo.

---

## Stack no negociable

**Backend** — NestJS 11 · **Prisma ^6** (no subir a 7) · PostgreSQL 17 · Zod para el entorno ·
`class-validator` para DTOs · `@nestjs/jwt` · `bcryptjs` · `@nestjs/throttler` · Vitest.

**Frontend** — React 19 · Vite 8 · **Tailwind v4 con config en CSS** (nunca crear
`tailwind.config.js`) · shadcn sobre **Base UI** (`style: "base-nova"`, prop `render`, **no**
`asChild`) · `lucide-react` · CVA + `cn()` · React Query para estado de servidor · Zustand solo
para UI y sesión · `react-router-dom` v6 · axios.

**Deploy** — Render (API) · Vercel (web) · Supabase (BD). Detalle en `DEPLOYMENT.md`.

---

## No negociables por dominio

Cada regla vive completa en el sitio que se indica. Aquí solo está el enunciado, para que nunca se
rompa por desconocimiento.

**Negocio y backend** → skill `bighearts-backend`, y `docs/ARQUITECTURA.md` §4

1. El enlace de la clase se guarda **cifrado** y solo se revela a quien tiene reserva `CONFIRMED`,
   dentro de los **30 min** previos. Fuera de la ventana el campo **no viaja** en la respuesta.
2. El cupo se decide con **transacción + `SELECT … FOR UPDATE`** sobre el aula. `currentBookings`
   solo se muta dentro de esa transacción. Nunca en un `update` suelto.
3. Cancelar hasta **60 min antes**; libera el cupo en la misma transacción; la reserva pasa a
   `CANCELLED`, **no se borra**.
4. Un estudiante **no puede** tener dos reservas `CONFIRMED` con horarios solapados. Se valida
   dentro de la transacción, no antes.
5. `scheduledAt` es **`timestamptz` en UTC**. Toda comparación temporal ocurre en el servidor.
6. La autorización se decide **siempre en el servidor**. El frontend replica la lógica solo para
   ocultar UI.
7. Los secretos van por entorno, validados en `config/env.schema.ts`. Nunca en el código.

**UI y accesibilidad** → skill `bighearts-ui` (léelo antes de tocar cualquier componente)

8. Nada de color decorativo · todo estado se comunica con **color + ícono + texto** · **cero
   dependencia del audio**.
9. Cuerpo **17px**. Cero colores literales en `.tsx` (usa tokens: `bg-primary`, nunca `#054DAE`).
10. **Sin mutaciones optimistas en reservas**: el cupo tiene concurrencia real, no se muestra
    "reservado" antes de que el servidor confirme.

**Terminar una task** → skill `bighearts-dod`

---

## Trampas conocidas — no reintroducir

Las cinco están explicadas a fondo en [`README.md` → Trampas conocidas](./README.md#trampas-conocidas)
y comentadas junto a la línea que las evita.

1. **No borres `optimizeDeps.include: ['@academia/types']`** de `apps/web/vite.config.ts`. Sin ella
   el navegador revienta al importar un valor del paquete (el build sigue pasando).
2. **No actives `incremental: true`** en `apps/api/tsconfig.json`. Produce un `dist/` incompleto
   con `nest build` saliendo en código 0.
3. **`@academia/types` se compila antes que las apps.** `npm run build --workspaces` no respeta el
   orden de dependencias.
4. **Prisma fijado a `^6`.** La 7 elimina `url`/`directUrl` del schema y rompe Supabase. Subir es
   una HU propia.
5. **Con el pooler de Supabase, no fíes de `information_schema`.** Verifica con Prisma Client o por
   `DIRECT_URL`.

Y una sexta, del monorepo: **un solo `package-lock.json`, en la raíz**. `npm install` siempre desde
la raíz; para un workspace concreto, `npm install <pkg> -w apps/api`.

---

## Git

- Rama por HU: `hu-<número>-<slug>-<persona>` (o `<issue>-hu-<número>-<slug>-<persona>`).
- **Conventional Commits** con ámbito de workspace: `feat(api):`, `feat(web):`, `feat(types):`,
  `docs:`, `chore:`. Commitlint rechaza el commit si no cumple.
- Todo entra por PR; el CI (lint + build + test de backend, lint + build de frontend) debe pasar.
- `pre-commit` pasa ESLint y Prettier sobre los ficheros staged.

---

## Dónde vive cada cosa

| Necesitas…                                                           | Ve a                                              |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| Qué es el producto, alcance de la fase, roadmap                      | `docs/DEFINICION_PROYECTO.md`                     |
| Modelo de datos, decisiones técnicas, reglas de negocio en detalle   | `docs/ARQUITECTURA.md`                            |
| La HU que estás implementando                                        | `docs/historias/HU-XXX-*.md` — o usa `/hu <ruta>` |
| Color, tipografía, accesibilidad, patrones de componentes, microcopy | skill `bighearts-ui`                              |
| Transacciones, contrato de API, convenciones de Prisma y DTOs        | skill `bighearts-backend`                         |
| Si una task está terminada                                           | skill `bighearts-dod`                             |
| Tokens, cookies, refresh, rotación                                   | `AUTH_FLOW.md`                                    |
| Instalar, Docker, seed, dependencias                                 | `README.md`                                       |
| Render, Vercel, Supabase, secretos                                   | `DEPLOYMENT.md`                                   |
| Cómo funciona todo el flujo de trabajo                               | `GUIA_FLUJO.md`                                   |

---

## Cómo trabajar aquí

- **Lee la HU antes de escribir código.** Sus acceptance criteria son el contrato; al terminar hay
  que recorrerlos uno por uno.
- **Si algo que te piden contradice `docs/ARQUITECTURA.md` o un skill, dilo antes de escribir el
  código.** No lo resuelvas en silencio.
- **No inventes reglas de negocio.** Si una decisión no está en los documentos ni en el código,
  pregunta. `docs/ARQUITECTURA.md` §14.6 lista lo que sigue abierto.
- **Cambio de código ⇒ cambio de documentación.** Si tocas una convención que este archivo o un
  skill describen, actualízalos en el mismo PR. La deriva entre documentos y repo ya pasó una vez.
