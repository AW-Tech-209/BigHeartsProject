# Despliegue (staging)

Pipeline de CI/CD de Academia. Resumen de la arquitectura:

| Pieza              | Plataforma     | Qué hace                                                  |
| ------------------ | -------------- | --------------------------------------------------------- |
| CI (lint + build)  | GitHub Actions | Corre en cada PR; un fallo bloquea el merge.              |
| Backend (staging)  | Render (free)  | Deploy automático al hacer merge a `main`. Server NestJS. |
| Frontend (staging) | Vercel (free)  | Deploy en `main` + **preview URL por cada PR**.           |
| Base de datos      | Supabase       | PostgreSQL de staging (ya provisionado en la HU-002).     |

> **Reparto del trabajo.** El código (workflows, `render.yaml`, `vercel.json`, CORS) ya está en el
> repo. Lo que queda es conectar las cuentas y pegar secretos en los paneles: eso **solo se puede
> hacer a mano** (requiere tus cuentas de Render/Vercel/GitHub). Este documento es ese checklist.

---

## 1. CI en cada PR (GitHub Actions)

Ya está: [.github/workflows/ci.yml](.github/workflows/ci.yml) corre dos jobs en cada PR hacia
`main`:

- **Backend** — lint + build + tests de `@academia/api`.
- **Frontend** — lint + build + tests de `@academia/types` y de `@academia/web`.

Para que **un fallo bloquee el merge**, hay que activar la protección de rama (una sola vez):

1. GitHub → repo → **Settings → Branches → Add branch ruleset** (o _Branch protection rules_).
2. Branch name pattern: `main`.
3. Marca **Require status checks to pass before merging** y añade como obligatorios:
   - `Backend (lint + build + test)`
   - `Frontend (lint + build + test)`
4. (Recomendado) **Require a pull request before merging**.
5. Guarda.

> Los nombres de los checks aparecen en la lista solo después de que el workflow haya corrido al
> menos una vez. Abre un PR de prueba, deja que corra, y entonces añádelos.

> **⚠️ Si cambias el `name:` de un job en `ci.yml`, actualiza esta lista Y la configuración del
> ruleset en GitHub.** El check obligatorio se referencia por su nombre exacto: renombrar el job
> deja el check antiguo esperando para siempre a una ejecución que ya no existe —o, peor, la
> protección deja de aplicarse sin que nadie se entere. Estos nombres cambiaron en HU-205, al
> añadirse el paso `test` al frontend.

---

## 2. Backend en Render

### 2.1. Crear el servicio

1. Render → **New → Blueprint**.
2. Conecta el repositorio `AW-Tech-209/BigHeartsProject`.
3. Render detecta [render.yaml](render.yaml) y propone el servicio `bighearts-backend-staging`. Aplícalo.

> **Si falla la sincronización del Blueprint** (Render da un error genérico, sin detalle): lo más
> habitual es que ya exista un Blueprint sincronizado con este repo (aunque el servicio esté
> borrado). Ve a Render → **Blueprints** y comprueba si hay uno colgando antes de crear otro; si lo
> hay, bórralo primero. Si vuelve a fallar, revisa el tab **Events** de ese Blueprint — ahí sí queda
> el detalle del error, aunque el toast no lo muestre.

### 2.2. Variables de entorno (secretos)

En el servicio → **Environment**, rellena las marcadas `sync: false` en el blueprint:

| Variable           | Valor                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`     | Supabase → pooler (6543, `?pgbouncer=true`). La misma de tu `.env` local.                                                                        |
| `DIRECT_URL`       | Supabase → conexión directa (5432).                                                                                                              |
| `JWT_SECRET`       | Genera uno nuevo: `openssl rand -base64 48`.                                                                                                     |
| `MEETING_LINK_KEY` | Clave AES-256-GCM del enlace de reunión: `openssl rand -hex 32` (64 hex exactos). **Guárdala**: cambiarla deja ilegibles los enlaces ya creados. |
| `CORS_ORIGIN`      | La URL del frontend en Vercel (la tendrás tras el paso 3). Ej: `https://academia-web.vercel.app`                                                 |
| `ADMIN_EMAIL`      | Email del Admin que crea el seed. **No uses el de dev** (`admin@academia.local`).                                                                |
| `ADMIN_PASSWORD`   | Contraseña del Admin del seed. Genera una fuerte, no la de dev.                                                                                  |
| `RESEND_API_KEY`   | Clave de API de Resend (resend.com → API Keys). Sin ella la API arranca igual pero solo registra los avisos en el log, no los envía (D32).       |
| `EMAIL_FROM`       | Dirección remitente de los correos. Obligatoria si defines `RESEND_API_KEY`.                                                                     |

`NODE_ENV=staging`, `NODE_VERSION=22` y `PORT` ya los gestiona Render (los dos primeros vía el
blueprint, `PORT` lo inyecta Render solo).

### 2.3. Migraciones y seed

No hay que hacer nada: el `startCommand` corre `prisma migrate deploy` y luego el seed
(`npm run db:seed`) antes de arrancar, en cada deploy. Ambos son idempotentes: las migraciones ya
aplicadas no se reaplican, y el seed hace `upsert` por email (nunca pisa un Admin existente ni
crea usuarios de prueba en `NODE_ENV=production`; en staging sí los crea, ver `seedTestUsers` en
`apps/api/prisma/seed.ts`).

Si `ADMIN_EMAIL`/`ADMIN_PASSWORD` no están seteados en el paso 2.2, el seed aborta con un error
claro y el deploy falla — es intencional, para no arrancar en staging/prod sin Admin.

> **Free tier:** el servicio se **duerme tras ~15 min** sin tráfico y el primer request tarda
> ~30-60s en despertar. Es normal; el frontend reintenta el health-check.
>
> De ahí salen los ~10s que tardaba la landing en ser usable: el visitante nuevo esperaba a un
> `/auth/refresh` contra un backend dormido. Ya no — el arranque solo pide refresh si hay marca de
> sesión previa, y con plazo (`VITE_SESSION_REFRESH_TIMEOUT_MS`, 3s). Ver `AUTH_FLOW.md`.

Cuando termine, anota la URL pública: `https://bighearts-backend-staging.onrender.com` (o la que asigne).

---

## 3. Frontend en Vercel

### 3.1. Crear el proyecto

1. Vercel → **Add New → Project** → importa el repositorio.
2. **Root Directory:** déjalo en la raíz del repo (`.`). El [vercel.json](vercel.json) ya define
   `installCommand`, `buildCommand` y `outputDirectory` (`apps/web/dist`) para el monorepo.
3. Framework preset: **Other** (lo controla `vercel.json`).

### 3.2. Variable de entorno

En **Settings → Environment Variables**, para _todos_ los entornos (Production + Preview):

| Variable       | Valor                                        |
| -------------- | -------------------------------------------- |
| `VITE_API_URL` | La URL del backend en Render (del paso 2.3). |

> Vite inyecta `VITE_API_URL` en **build**, no en runtime. Si la cambias, hay que redeployar.

### 3.3. Evitar rebuilds del frontend por cambios solo-backend (monorepo)

**Settings → Git → Ignored Build Step**, comando:

```bash
git diff --quiet HEAD^ HEAD -- apps/web packages/types
```

Sale 0 (sin cambios en la web ni en los tipos) → Vercel **salta** el build. Sale 1 (sí hubo
cambios) → build. Así un cambio solo-backend no redepliega la web.

### 3.4. Preview URLs

Automáticas: cada PR genera una URL `https://<rama>-....vercel.app`. Vercel la comenta en el PR.
Las previews usan el mismo `VITE_API_URL` (apuntan al backend de staging).

---

## 4. Cerrar el círculo del CORS

Cuando tengas la URL de Vercel, ponla en `CORS_ORIGIN` del backend en Render (paso 2.2) y
redeploya el backend. Sin esto, el navegador bloquea las peticiones del frontend al backend.

Si quieres que las **preview URLs** (dominios cambiantes por PR) también funcionen contra el
backend, añade a `CORS_ORIGIN` un patrón/URL de preview, o usa un dominio fijo de preview en Vercel.
Para staging básico, con la URL de producción de Vercel basta.

---

## 5. Smoke test end-to-end (punto de integración)

Con ambos desplegados:

1. Abre la URL del frontend en Vercel.
2. La home hace `GET /health` contra el backend de Render. Deberías ver el JSON de estado
   (`status: ok`, `database: up`). Si el backend estaba dormido, el primer intento puede tardar;
   pulsa **Reintentar**.
3. Comprobación directa del backend:
   ```bash
   curl https://bighearts-backend-staging.onrender.com/health
   ```
4. Comprobación de CORS (debe devolver la cabecera con tu origen de Vercel):
   ```bash
   curl -s -D - -o /dev/null https://bighearts-backend-staging.onrender.com/health \
     -H "Origin: https://academia-web.vercel.app" | grep -i access-control-allow-origin
   ```

---

## Notas

- **Tests en CI:** por ahora el CI corre lint + build. Los tests automatizados quedan diferidos a
  una HU posterior (no había framework de test en el repo). Cuando se añadan, se enchufan como un
  tercer paso en cada job de `ci.yml` y como check obligatorio en la protección de rama.
- **Producción:** este documento cubre **staging**. El corte a producción (dominio propio, secretos
  de prod, CORS de prod) se hará en su momento con el mismo esquema.
