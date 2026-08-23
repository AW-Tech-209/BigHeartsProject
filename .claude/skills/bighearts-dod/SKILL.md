---
name: bighearts-dod
description: Definición de terminado de BigHearts — qué hay que verificar para dar una task, una historia de usuario o un PR por completo en este repo. Úsalo al cerrar una task, antes de abrir o revisar un PR, al recorrer los acceptance criteria de una HU, o cuando alguien pregunte si algo está listo, terminado o mergeable. Dispara con: terminado, listo, completo, definición de terminado, DoD, acceptance criteria, criterios de aceptación, cerrar HU, PR, merge, revisión, checklist, verificar.
license: Proprietary
---

# BigHearts — definición de terminado

"Funciona en mi máquina" no es terminado. Terminado es: **los acceptance criteria de la HU se
cumplen, la verificación está corrida, y la documentación no quedó mintiendo.**

> Este checklist describe lo que **este repo** puede verificar hoy. No pide cosas que no existen.
> Un checklist que pide imposibles se ignora entero, y entonces no sirve para nada. Por eso §5
> dice también lo que **sigue** sin cubrirse, en vez de fingir que todo está automatizado.

## 1. Los acceptance criteria, uno por uno

No "los revisé". **Uno por uno, con evidencia.** Para cada AC de la HU:

- Cítalo textualmente.
- Di **cómo** lo comprobaste: test que lo cubre, comando que ejecutaste, pantalla que abriste,
  petición que hiciste.
- Veredicto explícito: **cumple** / **no cumple** / **cumple parcialmente, falta X**.

Un AC que no se puede verificar no es un AC: es un deseo. Si te encuentras uno así, dilo en vez de
darlo por bueno.

Si un AC quedó fuera del alcance de la task, **no lo marques como cumplido**. Déjalo pendiente y
nómbralo.

## 2. Verificación automática — **una vez, al cerrar**

```bash
npm run typecheck    # los tres workspaces
npm run lint         # ESLint en todo el repo
npm run test         # Vitest en los TRES workspaces (compila tipos antes)
npm run build        # compila los tres, tipos primero
```

Los cuatro en verde. `npm run test` desde la raíz ya hace `build:types` primero; si corres un
workspace suelto y tocaste `packages/types`, lanza `npm run build:types` antes o fallará con
`TS2307`.

**Esto se corre al cerrar la HU, no después de cada task.** Con 10–17 tasks por historia, repetir
la suite completa en cada una son diez o quince ejecuciones que vuelcan su salida al contexto sin
aportar nada que no aporte una. Durante la implementación se verifica **solo lo tocado**:
`npx vitest run <ruta-del-spec>` y `npx eslint <rutas tocadas>`.

**`format:check` ya no está en la lista.** El hook de `pre-commit` pasa Prettier sobre los ficheros
staged; correrlo además sobre el repo entero dentro de la sesión es pagar dos veces por el mismo
trabajo.

## 2.1 Qué se testea y qué no

Un test que no puede fallar por una razón real es coste sin red. Esta lista existe porque el repo
llegó a **0,66 líneas de test por línea de código**, y buena parte no protegía nada.

**Se testea siempre:**

- **Invariantes de negocio**: concurrencia de cupos, ventana del enlace, no solapamiento,
  transiciones de estado. Un fallo aquí no es un bug, es el producto.
- **Autorización**: quién recibe `403` y quién no, verificado en el backend.
- **Funciones puras de `packages/types`**: `derivarEstadoAula`, `coincideConLaPreferencia`. Baratas
  y es donde vive la lógica compartida por las dos apps.
- **`axe`** en componentes de dominio y en cada pantalla nueva. Es la red que sustituye a un
  checklist manual que ya se degradó una vez (HU-103).
- **Comportamiento de componente con `user-event`**: que al enviar un formulario vacío aparezca el
  error, que el foco vaya donde debe.

**No se testea:**

- **Render en los tres temas.** jsdom **no calcula CSS de verdad** — no hace cascada ni layout.
  Montar un componente con la clase `.hc` confirma que la clase se aplicó, no que se vea bien.
  `.dark` y `.hc` se revisan **a ojo en el navegador**, que es el único sitio donde son reales.
- **Texto literal de microcopy.** Frágil y de bajo valor: cambia una coma y se rompe el test sin
  que se haya roto nada.
- **«El componente renderiza sin lanzar».** Si no hay aserción de comportamiento, no hay test.
- **Wrappers y re-exports** sin lógica propia.

## 3. Si tocaste backend

- Tests nuevos para la lógica nueva, en `src/**/*.spec.ts`.
- **Si tocaste `bookings`: test de concurrencia.** Dos transacciones peleando por el último cupo.
  No es opcional, es la garantía central del producto (ver skill `bighearts-backend`).
- Si cambiaste el esquema: migración generada, aplicada y versionada; enums sincronizados con
  `@academia/types`; ningún cambio a mano en una migración ya aplicada.
- Si añadiste una variable de entorno: está en `config/env.schema.ts` **y** en `.env.example`.
- Ningún dato sensible en la respuesta ni en los logs — contraseñas, tokens, `meetingLink`.
- Los errores nuevos tienen su código estable en `ApiErrorCode`.

## 4. Si tocaste frontend

Primero los tests que §5 exige. Después recorre el **checklist del skill `bighearts-ui`** (está al
final de su `SKILL.md`) — `axe` cubre lo mecánico, pero el recorrido con teclado, el orden del
foco y si el texto se entiende siguen necesitando ojo humano. En resumen, y sin sustituirlo:

- Teclado completo con foco visible; cada estado legible sin color; contraste y objetivos táctiles.
- Los **4 estados**: cargando, vacío, error, éxito. Un componente sin los cuatro no está terminado.
- Funciona en `.dark` y `.hc`; respeta `prefers-reduced-motion`; zoom al 200% sin romperse.
- Cero colores literales; cambios dinámicos anunciados por `aria-live`.
- Microcopy revisado contra `voz-microcopy.md`: español literal, sentence case, errores que
  explican en vez de disculparse.

## 5. Tests de frontend y de tipos — qué se exige

Desde HU-205 hay runner en `apps/web` y en `packages/types`, y el CI los ejecuta en cada PR. La
regla es **cualitativa, no un porcentaje** (D17: un umbral numérico produce tests escritos para
subir el umbral):

- **Toda lógica de dominio del frontend tiene test.** Es decir, todo lo que viva en
  `features/<dominio>/lib/` y toda función pura de `packages/types` — derivar el estado de un aula,
  validar un formulario, formatear fechas y zonas, calcular la ventana de acceso para pintar.
  Entorno `node`, sin DOM. Patrón: `features/auth/lib/validate-login.spec.ts`.
- **Todo componente de `components/dominio/` tiene test de accesibilidad** con
  `esperarSinFallosDeAccesibilidad(container)`. Patrón: `components/ui/field.spec.tsx`.
- **Los componentes con interacción se prueban con teclado**, usando `user-event` —
  `user.tab()`, `user.keyboard()`—, nunca `fireEvent`. Un `fireEvent.change` no comprueba que el
  elemento sea alcanzable con Tab, ni que esté habilitado, ni que reciba el foco; en un producto
  para personas sordas ese recorrido no es un detalle. Patrón:
  `features/auth/components/login-form.spec.tsx`.
- **Se consulta por rol accesible y texto visible** (`getByRole`, `getByLabelText`).
  **`data-testid` está prohibido.** Si un elemento no se puede encontrar por su rol o su etiqueta,
  el problema es el componente, no el test — y ese es justo el fallo que queremos que salte.
- **Los tres modos de color** se montan con `renderConProviders(ui, { tema: 'dark' | 'hc' })`
  cuando el componente cambie de aspecto entre ellos.
- **Una pantalla cuyo `<h1>` dependa de un parámetro de la ruta se monta sobre `<AppRoutes />`**,
  con `renderConProviders(<AppRoutes />, { ruta: '/aulas/xxx' })`. Montarla suelta deja `useParams()`
  vacío y el test acaba probando otra cosa. Patrón: `pages/AulaDetallePage.spec.tsx`, que además
  cubre así la navegación real desde la tarjeta. Por eso esas páginas **no** entran en la tabla de
  `pages/paginas.spec.tsx`, que monta cada elemento por su cuenta.
- **`testTimeout` está en 15 s en `apps/web/vitest.config.ts`, no en los 5 s por defecto.** Los
  recorridos con teclado escriben carácter a carácter con temporizadores reales y rondan los 4 s;
  con los workers compitiendo por CPU, el límite de 5 s convertía cada archivo de test nuevo en un
  fallo aparentemente ajeno. Si un test tuyo se acerca a ese techo, el problema es el test, no el
  límite.

**Lo que `axe` NO cubre, y por tanto sigue siendo manual (§4):** que el orden del foco tenga
sentido, que un lector de pantalla lea algo comprensible, que el texto se entienda, y el contraste
real —jsdom no aplica las hojas de Tailwind, así que la regla `color-contrast` está desactivada a
propósito en el helper; automatizarla ahí daría un falso verde—.

**Lo que sigue sin existir:**

- **Cobertura retroactiva.** `features/auth` y `features/profile` se cubren cuando se toquen. Los
  tests de ejemplo de HU-205 caen sobre `auth` porque era el código que había, no porque `auth`
  esté cubierto.
- **E2E.** Los flujos completos se prueban a mano contra `docker compose up` con los usuarios del
  seed. Se evalúa Playwright al cerrar la Fase 1.

## 6. Documentación

**Cambio de código ⇒ cambio de documentación, en el mismo PR.**

| Si tocaste…                                          | Actualiza…                    |
| ---------------------------------------------------- | ----------------------------- |
| Una convención de estructura, comando o stack        | `CLAUDE.md`                   |
| Una decisión técnica o el modelo de datos            | `docs/ARQUITECTURA.md`        |
| El alcance o una regla de negocio de la fase         | `docs/DEFINICION_PROYECTO.md` |
| Endpoints de `/auth` o el flujo de tokens            | `AUTH_FLOW.md`                |
| Instalación, scripts, dependencias, una trampa nueva | `README.md`                   |
| Una regla de UI o un patrón de componente            | skill `bighearts-ui`          |
| Una convención de tests o un helper de `src/test/`   | este skill (§5)               |
| Una invariante de servidor o el contrato de API      | skill `bighearts-backend`     |

Si descubriste que un documento o un skill **ya estaba desactualizado**, arréglalo aunque no sea de
tu task, y menciónalo en el PR. Es más barato que la siguiente auditoría.

## 7. Git

- Rama `hu-<número>-<slug>-<persona>`.
- Commits en **Conventional Commits** con ámbito de workspace: `feat(api):`, `feat(web):`,
  `feat(types):`, `fix(...)`, `docs:`, `chore:`. Commitlint rechaza lo que no cumpla.
- PR abierto, CI en verde. Sin CI verde no hay merge.
- La HU en `docs/historias/` marcada como completada, y su tarjeta movida en GitHub Projects.

## 8. Cierre

Al terminar, entrega un resumen con:

1. **Qué se implementó**, por task.
2. **El recorrido de acceptance criteria** de §1, con veredicto por cada uno.
3. **Qué quedó fuera** y por qué — pendientes, decisiones que hicieron falta y no estaban tomadas,
   supuestos que tuviste que hacer.
4. **Qué documentación tocaste.**

El punto 3 es el más importante. Un cierre que no menciona nada pendiente casi siempre significa
que algo se dio por bueno sin mirar.
