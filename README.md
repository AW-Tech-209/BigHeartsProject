# Academia

Monorepo de la plataforma Academia: API en NestJS, frontend en React y un paquete de tipos
TypeScript compartido entre ambos.

Gestionado con **npm workspaces**. Hay un único `package-lock.json`, en la raíz.

## Requisitos

- **Node.js >= 20** (probado con 22.x)
- **npm >= 7** (necesario para workspaces; probado con 11.x)

## Clonar e instalar

```bash
git clone <url-del-repositorio>
cd BigHearts

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

## Levantar cada app

Todos los comandos se ejecutan **desde la raíz**:

```bash
npm run dev:api    # API en http://localhost:3000
npm run dev:web    # Frontend en http://localhost:5173
```

Ambos compilan antes `@academia/types`, porque las dos apps dependen de su build.

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
