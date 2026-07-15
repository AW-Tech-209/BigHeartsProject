# Academia

Monorepo de la plataforma Academia: API en NestJS, frontend en React y un paquete de tipos
TypeScript compartido entre ambos.

Gestionado con **npm workspaces**. Hay un único `package-lock.json`, en la raíz.

> **Sobre el nombre.** El proyecto se llama **academia** en todas partes: el paquete raíz
> (`academia`) y el _scope_ de npm de los tres workspaces (`@academia/api`, `@academia/web`,
> `@academia/types`). El repositorio en GitHub se llama `BigHeartsProject` por razones
> históricas; es el único sitio donde aparece otro nombre.

## Requisitos

- **Node.js >= 20** (probado con 22.x)
- **npm >= 7** (necesario para workspaces; probado con 11.x)

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

### Configurar el entorno del backend

La API no arranca sin sus variables de entorno. Copia la plantilla y rellénala:

```bash
cp apps/api/.env.example apps/api/.env
```

Como mínimo tienes que definir `JWT_SECRET` (32 caracteres o más). Si falta cualquier variable
obligatoria, o alguna está malformada, la app **se niega a arrancar** y te dice cuál.

El `.env` real está ignorado por git; el `.env.example` no.

### Configurar el entorno del frontend

El frontend necesita saber dónde vive la API. Copia también su plantilla:

```bash
cp apps/web/.env.example apps/web/.env
```

Como mínimo tienes que definir `VITE_API_URL` (por defecto, `http://localhost:3000`).

## Levantar cada app

Todos los comandos se ejecutan **desde la raíz**:

```bash
npm run dev:api    # API en http://localhost:3000
npm run dev:web    # Frontend en http://localhost:5173
```

Ambos compilan antes `@academia/types`, porque las dos apps dependen de su build.

> **CORS en desarrollo.** `apps/api/src/main.ts` habilita CORS solo cuando `NODE_ENV` es
> `development`, para cualquier origen `http://localhost:<puerto>`. Así no importa en qué
> puerto acabe Vite si el 5173 ya está ocupado (5174, 5175...). En producción no se habilita
> nada; la configuración real de CORS de producción queda para la HU-003 de despliegue.

Comprobación rápida de que la API vive:

```bash
curl http://localhost:3000/health
# {"success":true,"data":{"status":"ok","uptime":1},"timestamp":"..."}
```

## Scripts de la raíz

| Comando                | Qué hace                                                        |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev:api`      | Levanta el backend en modo watch.                               |
| `npm run dev:web`      | Levanta el frontend en modo watch.                              |
| `npm run build`        | Compila los tres workspaces (`types` primero, por dependencia). |
| `npm run build:types`  | Compila solo el paquete de tipos compartidos.                   |
| `npm run lint`         | Pasa ESLint a todo el repo.                                     |
| `npm run lint:fix`     | Igual, arreglando lo que se pueda automáticamente.              |
| `npm run format`       | Formatea todo el repo con Prettier.                             |
| `npm run format:check` | Comprueba el formato sin escribir nada (útil en CI).            |
| `npm run typecheck`    | Comprueba los tipos de los tres workspaces.                     |

## Estructura de carpetas

```
.
├── apps/
│   ├── api/          Backend NestJS. Expone la API HTTP.
│   └── web/          Frontend React + Vite. Consume la API.
├── packages/
│   └── types/        Tipos TypeScript compartidos entre api y web.
├── eslint.config.mjs      Config de ESLint para todo el repo (flat config).
├── .prettierrc.json       Reglas de formato, compartidas por todos.
├── commitlint.config.mjs  Convención de mensajes de commit.
├── tsconfig.base.json     Opciones de TypeScript comunes a los 3 workspaces.
└── package.json           Raíz del monorepo. Declara los workspaces.
```

### Dentro de `apps/api`

```
src/
├── main.ts         Bootstrap. Lee el puerto del ConfigService.
├── app.module.ts   Módulo raíz. Compone los módulos de dominio.
├── config/         Config global y validación del entorno con Zod.
├── common/         Piezas transversales: filtros, guards, interceptores, pipes.
├── health/         Endpoint GET /health.
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
├── components.json     Config de shadcn/ui (estilo, alias, base color).
├── tsconfig.json       TypeScript del código de navegador (DOM, JSX, alias @/*).
├── tsconfig.node.json  TypeScript de vite.config.ts, que corre en Node.
└── src/
    ├── main.tsx            Bootstrap de React (createRoot + StrictMode) e import de index.css.
    ├── index.css           Tailwind v4 + tema de shadcn/ui (alto contraste, fuente base 16px).
    ├── vite-env.d.ts       Tipos que Vite inyecta, incl. import.meta.env.VITE_API_URL.
    ├── app/
    │   ├── App.tsx         Componente raíz: compone providers.tsx + router.tsx.
    │   ├── providers.tsx   QueryClientProvider de React Query.
    │   └── router.tsx      Rutas con react-router-dom (BrowserRouter).
    ├── pages/              Componentes de página (uno por ruta).
    ├── features/           Módulos de dominio (vacío hoy: cada HU añade el suyo aquí).
    ├── components/ui/      Componentes generados por shadcn/ui (p. ej. button.tsx).
    ├── lib/
    │   ├── http-client.ts  Instancia de axios: adjunta el token y desenvuelve ApiResponse/ApiError.
    │   ├── api-error.ts    ApiClientError, el error tipado que lanza http-client.ts.
    │   ├── auth/token-storage.ts  Wrapper sobre localStorage para el token.
    │   ├── query-client.ts Instancia de QueryClient.
    │   └── utils.ts        Helper cn() de shadcn/ui.
    └── stores/
        └── useAppStore.ts  Store de Zustand, vacío a propósito: listo para futuras HUs.
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

## Despliegue (resumen)

Todavía **no está configurado**. Se hará en la **HU-003**.

La idea: ambas apps se despliegan **desde este mismo repositorio**, cada una apuntando a su
subcarpeta como raíz del proyecto y leyendo su propio `.env`:

| App      | Raíz del despliegue | Variables de entorno |
| -------- | ------------------- | -------------------- |
| Frontend | `apps/web`          | su propio `.env`     |
| Backend  | `apps/api`          | su propio `.env`     |

Esto no requiere separar el monorepo: las plataformas de despliegue habituales admiten indicar un
directorio raíz dentro del repo. La configuración concreta (comandos de build, variables por
entorno, dominios) queda para la HU-003.

## Trampas conocidas

Dos cosas que ya nos han mordido, están resueltas, y **no hay que reintroducir**. Ambas están
comentadas también en el código, junto a la línea que las evita.

### 1. `optimizeDeps.include: ['@academia/types']` en `apps/web/vite.config.ts`

**No borres esa línea.** Vite excluye del pre-bundling las dependencias enlazadas por symlink (los
workspaces del monorepo), porque asume que son fuentes ESM. Pero `@academia/types` se compila a
**CommonJS**, ya que NestJS lo consume con `require()`.

Sin esa línea el `build` sigue pasando, pero el navegador revienta en cuanto se importa un **valor**
del paquete (por ejemplo el enum `UserRole`), porque esbuild nunca convirtió el módulo CJS a ESM.

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
