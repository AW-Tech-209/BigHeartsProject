# Academia

Monorepo de la plataforma Academia: API en NestJS, frontend en React y un paquete de tipos
TypeScript compartido entre ambos.

Gestionado con **npm workspaces**. Hay un único `package-lock.json`, en la raíz.

> **Sobre el nombre.** El proyecto se llama **academia** en todas partes: el paquete raíz
> (`academia`) y el _scope_ de npm de los tres workspaces (`@academia/api`, `@academia/web`,
> `@academia/types`). El repositorio en GitHub se llama `BigHeartsProject` por razones
> históricas; es el único sitio donde aparece otro nombre.

## Requisitos

- **Docker Desktop** (o Docker Engine + Compose v2) — vía recomendada, levanta todo el stack.
- **Node.js >= 20** (probado con 22.x) — solo si corres las apps fuera de Docker.
- **npm >= 7** (necesario para workspaces; probado con 11.x).

## Clonar e instalar

```bash
# El segundo argumento hace que la carpeta local se llame `academia` y no
# `BigHeartsProject`, que es como se llama el repositorio en GitHub.
git clone https://github.com/AW-Tech-209/BigHeartsProject.git academia
cd academia

# Instala las dependencias de los tres workspaces y los enlaza entre sí.
# Ejecútalo SIEMPRE desde la raíz, nunca dentro de apps/ o packages/.
npm install
```

`npm install` también instala los hooks de git (Husky) mediante el script `prepare`.

## Arranque rápido con Docker (recomendado)

La forma reproducible de levantar **todo el entorno** (base de datos + backend + frontend) es
Docker Compose. Requiere **Docker Desktop** (o Docker Engine + Compose v2).

```bash
docker compose up          # levanta los tres servicios
# la primera vez, o tras cambiar dependencias/Dockerfiles:
docker compose up --build
```

Eso es **todo**. Sin pasos manuales: el contenedor de la API aplica las migraciones, siembra los
datos de prueba y arranca en modo watch; el de la web levanta Vite. No necesitas crear ningún
`.env` para el flujo Docker: el `docker-compose.yml` ya inyecta la configuración (usa un PostgreSQL
en contenedor, no Supabase — ver _Estrategia de base de datos_).

Atajos equivalentes desde npm: `npm run docker:up`, `npm run docker:up:build`, `npm run docker:down`.

### Servicios y puertos

| Servicio   | URL / puerto          | Qué es                                               |
| ---------- | --------------------- | ---------------------------------------------------- |
| `web`      | http://localhost:5173 | Frontend (Vite dev server).                          |
| `api`      | http://localhost:3000 | Backend NestJS. Health-check en `/health`.           |
| `postgres` | `localhost:5432`      | PostgreSQL 17 (volumen persistente `postgres-data`). |

Comprobación rápida de que el stack vive:

```bash
curl http://localhost:3000/health
# {"success":true,"data":{"status":"ok","uptime":1,"database":"up"},"timestamp":"..."}
```

### Credenciales de prueba (seed)

El seed crea usuarios y, en entornos no productivos, aulas de ejemplo. Todos los usuarios comparten
la misma contraseña:

| Rol     | Email                                | Estado  | Contraseña     |
| ------- | ------------------------------------ | ------- | -------------- |
| ADMIN   | `admin@academia.local`               | ACTIVE  | `Password123!` |
| TEACHER | `profe@academia.local`               | ACTIVE  | `Password123!` |
| TEACHER | `profe2@academia.local`              | ACTIVE  | `Password123!` |
| TEACHER | `profe.pendiente@academia.local`     | PENDING | `Password123!` |
| STUDENT | `alumno@academia.local`              | ACTIVE  | `Password123!` |
| STUDENT | `alumno2@academia.local`             | ACTIVE  | `Password123!` |
| STUDENT | `alumno3` a `alumno6@academia.local` | ACTIVE  | `Password123!` |

Además, once aulas repartidas entre los dos profesores `ACTIVE`, con fechas relativas al momento de
sembrar, y reservas reales sobre ellas: `alumno@academia.local` ve en «Mis reservas» una clase
próxima y una a punto de empezar (con el enlace ya visible), y en «Historial» las tres salidas
posibles — asistió, no asistió y canceló. Dos de esas aulas pasadas ya tienen la asistencia
marcada por su profesor (una por profesor, mezclando `ATTENDED` y `NO_SHOW`), y una más queda
pasada y sin marcar, el caso real más frecuente. `alumno3`–`alumno6` son relleno, solo para que
`currentBookings` de cada aula cuadre con las reservas que ocupan cupo de verdad — incluida una con
el último cupo libre y otra llena.

El seed es idempotente (usuarios por `upsert` de email, aulas y reservas por un id fijo): se puede
re-ejecutar sin duplicar. Para lanzarlo a mano: `npm run db:seed` (o dentro del contenedor, ya
corre solo al arrancar).

### Hot-reload

Los cambios en el código se reflejan **sin reconstruir la imagen**: el código de `apps/api/src` y
`apps/web/src` se monta en los contenedores, y tanto NestJS como Vite recargan al guardar. En
Windows/macOS el watcher usa _polling_ (los eventos de ficheros no cruzan el bind-mount), ya
configurado en el compose.

### Parar y resetear

```bash
docker compose down            # para los servicios, CONSERVA los datos
docker compose down -v         # además borra el volumen de PostgreSQL (BD desde cero)
```

### Estrategia de base de datos

- **Desarrollo** → PostgreSQL en Docker (este compose). Aislado por dev, desechable, rápido.
- **Staging / producción** → Supabase. La imagen del contenedor está pineada a la misma major que
  Supabase (17) para no introducir deriva.

El SPA corre en el **navegador**, así que `VITE_API_URL` apunta a `http://localhost:3000` (el puerto
publicado de la API), **no** a `http://api:3000` (que solo resuelve dentro de la red de Docker).

### Configurar el entorno del backend

> Solo necesario si corres la API **fuera** de Docker (`npm run dev:api`). Con `docker compose up`
> puedes saltarte esto.

La API no arranca sin sus variables de entorno. Copia la plantilla y rellénala:

```bash
cp apps/api/.env.example apps/api/.env
```

Tienes que definir, como mínimo:

- `JWT_SECRET` — 32 caracteres o más.
- `MEETING_LINK_KEY` — clave AES-256-GCM del enlace de reunión: 64 caracteres hexadecimales
  exactos (`openssl rand -hex 32`).
- `DATABASE_URL` y `DIRECT_URL` — conexión a PostgreSQL (ver la sección siguiente).

Si falta cualquier variable obligatoria, o alguna está malformada, la app **se niega a arrancar**
y te dice cuál. El `.env` real está ignorado por git; el `.env.example` no.

## Base de datos (Prisma + PostgreSQL)

La base de datos es **PostgreSQL**, alojado en **Supabase**, y se accede con **Prisma** (fijado a
la major **6**; ver _Trampas conocidas_).

### 1. Configurar la conexión

En `apps/api/.env`, sustituye `[YOUR-PASSWORD]` por la contraseña de la base de datos (Supabase →
_Project Settings → Database_) en **las dos** variables:

```bash
# Runtime: pooler en modo transacción (pgbouncer, puerto 6543)
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Migraciones: conexión directa en modo sesión (puerto 5432)
DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-0-us-east-2.pooler.supabase.com:5432/postgres
```

Son **dos** URLs a propósito: pgbouncer (el pooler) no soporta las sentencias que necesita Prisma
Migrate, así que las migraciones van por la conexión directa (`DIRECT_URL`) y las consultas
normales por el pooler (`DATABASE_URL`). Si tu contraseña tiene caracteres especiales
(`@ : / ? # & %`), **URL-encódéalos** (`@` → `%40`, etc.).

### 2. Aplicar el esquema

```bash
npm run db:migrate    # crea/aplica migraciones en desarrollo (usa DIRECT_URL)
npm run db:deploy     # aplica migraciones ya existentes (para CI / producción)
npm run db:studio     # abre Prisma Studio para inspeccionar la BD
```

El cliente de Prisma se **genera solo** tras `npm install` (script `postinstall`) y antes de cada
`build`, así que no hay que generarlo a mano. El esquema vive en
[apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) y las migraciones en
`apps/api/prisma/migrations/` (versionadas).

### 3. Comprobar la conexión

`GET /health` confirma que la API **y** la base de datos responden:

```bash
curl -i http://localhost:3000/health
# 200 → {"success":true,"data":{"status":"ok","uptime":1,"database":"up"},"timestamp":"..."}
# 503 → {"success":false,"error":{"code":"DATABASE_UNAVAILABLE",...}}  (BD inalcanzable)
```

La API **arranca aunque la BD esté caída** (patrón _readiness probe_): en vez de entrar en
crash-loop, sigue viva y `/health` devuelve 503 hasta que la base de datos vuelve.

### Configurar el entorno del frontend

El frontend necesita saber dónde vive la API. Copia también su plantilla:

```bash
cp apps/web/.env.example apps/web/.env
```

Como mínimo tienes que definir `VITE_API_URL` (por defecto, `http://localhost:3000`).

## Levantar cada app sin Docker

Alternativa al flujo Docker, útil para depurar una sola app en el host. Requiere Node y un
PostgreSQL accesible (puedes levantar solo la BD con `docker compose up postgres`). Todos los
comandos se ejecutan **desde la raíz**:

```bash
npm run dev:api    # API en http://localhost:3000
npm run dev:web    # Frontend en http://localhost:5173
```

Ambos compilan antes `@academia/types`, porque las dos apps dependen de su build. Recuerda tener
`apps/api/.env` configurado (ver _Configurar el entorno del backend_).

> **CORS en desarrollo.** `apps/api/src/main.ts` habilita CORS solo cuando `NODE_ENV` es
> `development`, para cualquier origen `http://localhost:<puerto>`. Así no importa en qué
> puerto acabe Vite si el 5173 ya está ocupado (5174, 5175...). En producción no se habilita
> nada; la configuración real de CORS de producción queda para la HU-003 de despliegue.

Comprobación rápida de que la API vive:

```bash
curl http://localhost:3000/health
# {"success":true,"data":{"status":"ok","uptime":1,"database":"up"},"timestamp":"..."}
```

## Scripts de la raíz

| Comando                   | Qué hace                                                        |
| ------------------------- | --------------------------------------------------------------- |
| `npm run dev:api`         | Levanta el backend en modo watch.                               |
| `npm run dev:web`         | Levanta el frontend en modo watch.                              |
| `npm run build`           | Compila los tres workspaces (`types` primero, por dependencia). |
| `npm run build:types`     | Compila solo el paquete de tipos compartidos.                   |
| `npm run lint`            | Pasa ESLint a todo el repo.                                     |
| `npm run lint:fix`        | Igual, arreglando lo que se pueda automáticamente.              |
| `npm run format`          | Formatea todo el repo con Prettier.                             |
| `npm run format:check`    | Comprueba el formato sin escribir nada (útil en CI).            |
| `npm run typecheck`       | Comprueba los tipos de los tres workspaces.                     |
| `npm run test`            | Vitest en los tres workspaces (compila los tipos antes).        |
| `npm run db:migrate`      | Crea y aplica migraciones de Prisma en desarrollo.              |
| `npm run db:deploy`       | Aplica migraciones existentes (CI / producción).                |
| `npm run db:studio`       | Abre Prisma Studio.                                             |
| `npm run db:seed`         | Siembra los usuarios de prueba (idempotente).                   |
| `npm run docker:up`       | Levanta el stack completo en Docker.                            |
| `npm run docker:up:build` | Igual, reconstruyendo las imágenes.                             |
| `npm run docker:down`     | Para el stack (conserva los datos).                             |

## Estructura de carpetas

```
.
├── apps/
│   ├── api/          Backend NestJS. Expone la API HTTP.
│   └── web/          Frontend React + Vite. Consume la API.
├── packages/
│   └── types/        Tipos TypeScript compartidos entre api y web.
├── docker-compose.yml     Stack de desarrollo: postgres + api + web.
├── .dockerignore          Qué NO entra al contexto de build de Docker.
├── eslint.config.mjs      Config de ESLint para todo el repo (flat config).
├── .prettierrc.json       Reglas de formato, compartidas por todos.
├── commitlint.config.mjs  Convención de mensajes de commit.
├── tsconfig.base.json     Opciones de TypeScript comunes a los 3 workspaces.
└── package.json           Raíz del monorepo. Declara los workspaces.
```

Cada app tiene su `Dockerfile.dev` (imagen de desarrollo con hot-reload) en su carpeta:
`apps/api/Dockerfile.dev` y `apps/web/Dockerfile.dev`.

### Dentro de `apps/api`

```
apps/api/
├── prisma/
│   ├── schema.prisma   Esquema de la BD (modelo User, enum UserRole).
│   └── migrations/      Migraciones versionadas.
└── src/
    ├── main.ts         Bootstrap. Lee el puerto del ConfigService.
    ├── app.module.ts   Módulo raíz. Compone los módulos de dominio.
    ├── config/         Config global y validación del entorno con Zod.
    ├── prisma/         PrismaService/PrismaModule (@Global). Acceso a la BD.
    ├── common/         Piezas transversales: filtros, guards, interceptores, pipes.
    ├── health/         Endpoint GET /health (comprueba proceso + BD).
    ├── auth/           Autenticación, JWT y guards de rol.
    ├── users/          Usuarios: alumnos, profesores, administradores.
    ├── classrooms/     Aulas: catálogo, capacidad, disponibilidad.
    ├── bookings/       Reservas de aulas.
    ├── sessions/       Sesiones de clase en el calendario.
    ├── notifications/  Envío de notificaciones (email, in-app).
    └── admin/          Operaciones de back-office (rol ADMIN).
```

### Dentro de `apps/web`

```
apps/web/
├── index.html          Punto de entrada de Vite. Monta <div id="root">.
├── vite.config.ts      Config de Vite (plugin de React, Tailwind, alias @/*, optimizeDeps).
├── vitest.config.ts    Config de test. HEREDA vite.config.ts con mergeConfig; no la copia.
├── components.json     Config de shadcn/ui (estilo, alias, base color).
├── tsconfig.json       TypeScript del código de navegador (DOM, JSX, alias @/*).
├── tsconfig.node.json  TypeScript de vite.config.ts y vitest.config.ts, que corren en Node.
└── src/
    ├── main.tsx            Bootstrap de React (createRoot + StrictMode) e import de index.css.
    ├── index.css           Tailwind v4 + tema de shadcn/ui (alto contraste, fuente base 16px).
    ├── vite-env.d.ts       Tipos que Vite inyecta, incl. import.meta.env.VITE_API_URL.
    ├── app/
    │   ├── App.tsx         Componente raíz: compone providers.tsx + router.tsx.
    │   ├── providers.tsx   React Query, región viva y rehidratación de la sesión.
    │   └── router.tsx      Rutas con react-router-dom. Las privadas van en <RequireAuth>.
    ├── pages/              Componentes de página (uno por ruta).
    ├── features/           Módulos de dominio: uno por área.
    │   └── auth/           Login, sesión y refresh (api/, components/, hooks/, lib/).
    ├── components/ui/      Componentes generados por shadcn/ui (p. ej. button.tsx).
    ├── hooks/              useAnnounce (región viva), usePageTitle (foco al <h1> por ruta).
    ├── lib/
    │   ├── http-client.ts  Axios: adjunta el token, desenvuelve ApiResponse y renueva ante un 401.
    │   ├── api-error.ts    ApiClientError, el error tipado que lanza http-client.ts.
    │   ├── auth/refresh-session.ts  Renovación silenciosa del access token (single-flight).
    │   ├── query-client.ts Instancia de QueryClient.
    │   └── utils.ts        Helper cn() de shadcn/ui.
    ├── stores/
    │   ├── auth-store.ts   Sesión: usuario, estado y access token EN MEMORIA (nunca en disco).
    │   └── useAppStore.ts  Store de Zustand, vacío a propósito: listo para futuras HUs.
    └── test/               Utilidades de test (no son tests: los .spec van junto al código).
        ├── setup.ts                 Matchers de jest-dom + stub de matchMedia.
        ├── render-con-providers.tsx Monta con React Query, región viva, router y tema.
        └── accesibilidad.ts         esperarSinFallosDeAccesibilidad(): axe con detalle del fallo.
```

> **Arquitectura feature-based.** `app/` es cableado transversal (providers, router), `pages/`
> son componentes de ruta, y `features/` es donde vivirán los módulos de dominio (auth, aulas,
> reservas...) según se vayan implementando: cada uno con sus propios `components/`, `hooks/` y
> llamadas a `lib/http-client.ts`.

## El paquete de tipos compartidos

`@academia/types` es un workspace local. Las apps lo declaran como `"@academia/types": "*"` y npm
lo enlaza por symlink en `node_modules/` durante el `npm install`. Se importa como cualquier
paquete de npm, sin rutas relativas:

```ts
import { UserRole, type ApiResponse } from '@academia/types';
```

El paquete se **compila** (`tsc` a `dist/`) porque exporta valores en runtime, no solo tipos: el
enum `UserRole` existe en el JavaScript final. Si cambias algo en `packages/types/src/`, recompila:

```bash
npm run build:types
```

## Cómo añadir dependencias

Hay dos formas de instalar un paquete en un workspace concreto, y **son equivalentes**:

```bash
# Opción A: desde la raíz, apuntando al workspace con -w
npm install zod -w apps/api
npm install zod -w @academia/api   # también vale el nombre del paquete

# Opción B: entrando en la carpeta del workspace
cd apps/api && npm install zod
```

En los dos casos npm hace lo mismo: añade `zod` a `apps/api/package.json` y actualiza el
**lockfile de la raíz**. Aunque ejecutes el comando dentro de `apps/api`, npm sube por el árbol
de directorios hasta encontrar el `package.json` que declara `workspaces` y trabaja desde ahí.

Para una dependencia de herramientas que afecte a todo el repo (linters, formatters, hooks),
instálala en la raíz:

```bash
npm install -D <paquete>   # desde la raíz, sin -w
```

### La regla del lockfile

> **Debe existir UN solo `package-lock.json`, en la raíz del repo. Nunca dentro de `apps/*` ni de
> `packages/*`.**

Ese fichero es el que garantiza que todo el equipo y el CI instalen exactamente las mismas
versiones. Un lockfile dentro de una app rompe la resolución compartida de npm: las apps podrían
acabar con copias distintas de la misma dependencia, y `@academia/types` dejaría de enlazarse por
symlink.

Si alguna vez aparece un `package-lock.json` dentro de una app (normalmente porque alguien corrió
un generador tipo `npm create vite` o `nest new` ahí dentro), bórralo y reinstala desde la raíz:

```bash
rm apps/<app>/package-lock.json
npm install
```

Comprobación rápida de que la regla se cumple:

```bash
find . -name package-lock.json -not -path "*/node_modules/*"
# Debe imprimir exactamente una línea: ./package-lock.json
```

## CI/CD y despliegue

Cada Pull Request ejecuta **lint + build** (backend y frontend) vía GitHub Actions
([.github/workflows/ci.yml](.github/workflows/ci.yml)); con la protección de rama activada, un fallo
bloquea el merge. Al hacer merge a `main`, el stack se despliega a **staging** sin intervención:

| Pieza         | Plataforma | Disparador                                        |
| ------------- | ---------- | ------------------------------------------------- |
| Backend       | Render     | Merge a `main` (solo si cambió el back).          |
| Frontend      | Vercel     | Merge a `main` + **preview URL por PR**.          |
| Base de datos | Supabase   | PostgreSQL de staging (migraciones en el deploy). |

El paso a paso completo (conectar cuentas, secretos, protección de rama, smoke test) está en
**[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Trampas conocidas

Seis cosas que ya nos han mordido, están resueltas, y **no hay que reintroducir**. Todas están
comentadas también en el código, junto a la línea que las evita.

### 1. `optimizeDeps.include: ['@academia/types']` en `apps/web/vite.config.ts`

**No borres esa línea.** Vite excluye del pre-bundling las dependencias enlazadas por symlink (los
workspaces del monorepo), porque asume que son fuentes ESM. Pero `@academia/types` se compila a
**CommonJS**, ya que NestJS lo consume con `require()`.

Sin esa línea el `build` sigue pasando, pero el navegador revienta en cuanto se importa un **valor**
del paquete (por ejemplo el enum `UserRole`), porque esbuild nunca convirtió el módulo CJS a ESM.

Por lo mismo, `apps/web/vitest.config.ts` **hereda** esta config con `mergeConfig` en vez de
declarar la suya. Una config de test paralela se desincronizaría de esta línea y el síntoma sería
un test que falla al importar un valor de `@academia/types` — el mismo fallo, en otro sitio.

### 2. No actives `incremental: true` en `apps/api/tsconfig.json`

`nest-cli.json` usa `deleteOutDir: true`, que borra `dist/` en cada build — pero **no** borra el
fichero `.tsbuildinfo`. Con `incremental` activado, tsc consulta esa caché, concluye que los
ficheros ya están emitidos y no los vuelve a escribir.

El resultado es un `dist/` incompleto y, lo peor, **`nest build` sale con código 0**. El fallo solo
aparece al arrancar el binario compilado, con un `Cannot find module './admin/admin.module'`.

### 3. Compila `@academia/types` antes que las apps

El script `build` de la raíz llama a `build:types` explícitamente antes que al resto. Esto es
necesario: `npm run build --workspaces` recorre los workspaces en el orden en que están declarados
(`apps/*` y luego `packages/*`), **no** en orden topológico de dependencias. Sin ese paso previo,
`apps/api` y `apps/web` fallan con `TS2307: Cannot find module '@academia/types'`.

Por eso `dev:api` y `dev:web` también invocan `build:types` antes de arrancar.

### 4. Prisma está fijado a la major 6 (no subir a la 7 a la ligera)

Prisma **7** eliminó `url`/`directUrl` del bloque `datasource` del `schema.prisma` y obliga a mover
la conexión a un `prisma.config.ts` con _driver adapters_. Es un cambio de arquitectura que esta HU
no necesita, y que además rompe la configuración de Supabase (pooler + conexión directa) tal cual la
documenta Supabase. Por eso `prisma` y `@prisma/client` están fijados a `^6`. Subir a la 7 es un
trabajo propio, no un `npm update`.

### 5. Con el pooler (pgbouncer), no fíes de consultas sueltas a `information_schema`

El pooler de Supabase en modo transacción (`DATABASE_URL`, puerto 6543) cachea _prepared statements_
y puede devolver resultados parciales/obsoletos al consultar el catálogo (`information_schema`)
directamente. No es un fallo del esquema: para verificar el estado real de la BD usa Prisma Client
(un `create`/`findMany`) o conéctate por `DIRECT_URL` (puerto 5432).

### 6. Prisma no modela índices parciales; no vuelvas a declararlos con `@@unique`

El índice único de `bookings` (`bookings_active_uniq`) es **parcial** (`WHERE status =
'CONFIRMED'`): un estudiante que cancela puede volver a reservar la misma clase. Si el modelo
`Booking` declarase `@@unique([studentId, classroomId])`, Prisma generaría en la próxima `migrate
dev` un índice **total** que reintroduce ese bug ya corregido (`docs/ARQUITECTURA.md` §4.3,
HU-308). El índice vive solo en SQL, escrito a mano en su migración; el CI corre `prisma migrate
diff` para detectar la deriva si alguien lo vuelve a declarar.

## Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/). Un hook de `commit-msg`
valida cada mensaje con commitlint y **rechaza el commit** si no cumple.

```
<tipo>(<ámbito opcional>): <descripción en minúscula>
```

Tipos admitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `revert`.

```bash
# ✅ válidos
git commit -m "feat(api): añade endpoint de login"
git commit -m "fix(web): corrige el redirect tras cerrar sesión"
git commit -m "chore: actualiza dependencias"

# ❌ rechazados
git commit -m "arreglé cosas"
git commit -m "WIP"
```

### Hooks de git

Se instalan solos con `npm install`.

- **pre-commit** → `lint-staged` pasa ESLint y Prettier **solo sobre los ficheros staged**.
- **commit-msg** → `commitlint` valida el mensaje.

Si un hook falla, el commit no se crea. Arregla el problema y vuelve a intentarlo.
