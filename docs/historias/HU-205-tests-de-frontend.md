# HU-205 — Infraestructura de tests de frontend y de tipos

| Campo            | Valor                                                        |
| ---------------- | ------------------------------------------------------------ |
| **Sprint**       | Sprint 2 — Gestión de Aulas                                  |
| **Prioridad**    | 🔴 Crítica (bloquea HU-203)                                  |
| **Estimación**   | 1.5 días                                                     |
| **Estado**       | ⬜ Pendiente                                                 |
| **Rama**         | `hu-205-tests-de-frontend-<persona>`                         |
| **Colaboración** | Dev B, con revisión de Dev A (toca el CI y `packages/types`) |
| **Depende de**   | Ninguna. Puede correr en paralelo con HU-201.                |
| **Labels**       | `sprint-2` `prioridad:critica` `infra` `a11y`                |

> **Como** equipo de desarrollo,
> **Quiero** una base de tests automatizados en `apps/web` y en `packages/types`, con verificación
> de accesibilidad,
> **Para** que la calidad y la accesibilidad dejen de depender de una revisión manual que ya se nos
> escapó una vez.

## Contexto

Hoy `apps/web` **no tiene runner de tests** y su job de CI solo hace lint y build. `packages/types`
tampoco: solo `build`, `dev` y `typecheck`.

Esto ya costó algo concreto. **HU-103 se cerró con AC4 y AC8 sin verificar**, anotados como
"implementado, pero sin pasada manual en navegador". No fue un descuido: es lo que le pasa a un
checklist de diez puntos que hay que recorrer a mano, sprint tras sprint, sobre código que uno
mismo acaba de escribir.

Y el momento es ahora, no después:

- **HU-203 crea los componentes de dominio** — `<EstadoAula>`, `<TarjetaAula>`, `<IndicadorCupo>` —
  que son la firma visual del producto y donde vive la codificación triple (color + ícono + texto).
  Testearlos desde que nacen cuesta la mitad que volver sobre ellos.
- **`derivarEstadoAula()` va en `packages/types`**, y la T0 de HU-203 pide tests unitarios que hoy
  **no se pueden escribir**: no hay dónde ejecutarlos.

El riesgo de fondo es específico de este producto: en una plataforma para personas sordas, una
regresión de accesibilidad no la detecta nadie hasta que un estudiante no consigue reservar su
clase. No hay un usuario que "se dé cuenta y avise" — ese es justo el problema que BigHearts existe
para resolver.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §10 (calidad, tests y CI) y §10.2 (el hueco que
  esta HU cierra).
- **Skills:** `bighearts-ui` — su checklist final es lo que se automatiza parcialmente aquí ·
  `bighearts-dod` — **hay que actualizarlo al cerrar**: hoy dice explícitamente que no se exigen
  tests de frontend.
- **⚠️ Trampa conocida nº 1 del `README.md`.** `optimizeDeps.include: ['@academia/types']` existe
  porque el paquete se compila a CommonJS. Los tests importan valores de ese paquete (el enum
  `UserRole`), así que **la config de test tiene que heredar la de Vite**, no ser una copia
  paralela que se desincronice.

### Decisiones tomadas (2026-08-18)

1. **Vitest en los dos workspaces.** Coherente con `@academia/api`, nativo en Vite, misma sintaxis
   y misma forma de configurar. No se introduce Jest: dos runners en un monorepo es deuda gratis.
2. **Testing Library sobre jsdom** para componentes: `@testing-library/react`,
   `@testing-library/user-event`, `@testing-library/jest-dom`. Se testea por **rol accesible y
   texto visible**, no por `data-testid` ni por clase CSS — así el test falla cuando la
   accesibilidad se rompe, que es justo lo que se quiere.
3. **`axe-core` para accesibilidad automatizada.** Cubre lo mecánico: roles, labels, `aria-*`,
   estructura de encabezados, contraste declarado. **No sustituye la pasada manual** de teclado y
   lector de pantalla — la reduce a lo que de verdad necesita ojo humano.
4. **El CI bloquea.** Se añade el paso `test` al job de frontend. Un test que no bloquea el merge
   no existe.
5. **Sin umbral numérico de cobertura.** Un porcentaje mínimo produce tests escritos para subir el
   porcentaje. En su lugar, regla cualitativa en `bighearts-dod`: toda lógica de dominio del
   frontend tiene test, y todo componente de `components/dominio/` tiene test de accesibilidad.
6. **No es retroactivo.** `features/auth` y `features/profile` no se cubren ahora; se cubren cuando
   se toquen. Esta HU entrega la infraestructura y el patrón, no la cobertura del pasado.

## 🔧 Tasks — Dev B (revisión de Dev A en T1, T7 y T8)

- [ ] **T1** — Vitest en `packages/types`: `environment: 'node'`, `include: ['src/**/*.spec.ts']`,
      script `test`. Sin jsdom ni Testing Library — aquí solo viven funciones puras.
      **Esto desbloquea la T0 de HU-203.**
- [ ] **T2** — Vitest en `apps/web`: `environment: 'jsdom'`, archivo de setup con
      `@testing-library/jest-dom`, `include: ['src/**/*.{spec,test}.{ts,tsx}']`, scripts `test` y
      `test:watch`.
- [ ] **T3** — La configuración de test **hereda** `apps/web/vite.config.ts` (alias `@/*`,
      `optimizeDeps`), no la duplica. Ver la trampa de arriba.
- [ ] **T4** — Helper `renderConProviders()` que envuelva en `QueryClientProvider`,
      `LiveAnnouncer` y router de memoria, y **acepte el tema** (`light` | `dark` | `hc`) aplicando
      la clase correspondiente al contenedor. Es lo que permite testear los tres modos.
- [ ] **T5** — Helper `esperarSinFallosDeAccesibilidad(container)` que corra `axe` y falle con el
      detalle de la violación, no con un booleano.
- [ ] **T6** — **Tres tests de ejemplo sobre código que ya existe**, que sirvan de patrón a copiar:
      uno de lógica pura (`features/auth/lib/validate-login.ts`), uno de componente con interacción
      de teclado (`features/auth/components/login-form.tsx`), y uno de `axe` sobre una primitiva de
      `components/ui/`.
- [ ] **T7** — Script `test` en el `package.json` de la **raíz** que ejecute los tres workspaces.
      Hoy no existe: `npm run test` desde la raíz no hace nada.
- [ ] **T8** — `.github/workflows/ci.yml`: añadir el paso `test` al job de frontend, y los tests de
      `packages/types` al pipeline.
- [ ] **T9** — Actualizar la documentación afectada: `CLAUDE.md` (tabla de comandos, que hoy dice
      "**No hay tests de frontend**"), `ARQUITECTURA.md` §10.1 y §10.2, el skill `bighearts-dod`
      (§2 y §5) y `docs/historias/_PLANTILLA.md` (el AC de verificación automática).

## ✅ Criterios de aceptación

- [ ] **AC1** — `npm run test` desde la raíz ejecuta los tests de los **tres** workspaces y termina
      en verde.
- [ ] **AC2** — `npm run test --workspace @academia/types` ejecuta tests de funciones puras,
      demostrado con el test de ejemplo.
- [ ] **AC3** — `npm run test --workspace @academia/web` monta componentes en jsdom, demostrado con
      el test del formulario de login, que **interactúa con teclado** (`user-event`), no
      disparando eventos a mano.
- [ ] **AC4** — Un test de `apps/web` puede resolver el alias `@/*` **e importar un valor** de
      `@academia/types` (por ejemplo el enum `UserRole`) sin fallar. Es el mismo problema que
      `optimizeDeps` resuelve en runtime, y hay que comprobar que no reaparece en los tests.
- [ ] **AC5** — El helper de render permite montar el mismo componente en `light`, `dark` y `hc`, y
      un test lo demuestra en los tres.
- [ ] **AC6** — **La red atrapa algo de verdad.** Quitarle el `<label>` a un input de un componente
      cubierto hace **fallar** el test de `axe`, con un mensaje que nombra la violación. Este AC no
      se cumple con "axe está instalado": hay que demostrar el fallo y luego restaurarlo.
- [ ] **AC7** — El CI ejecuta los tests de los tres workspaces en cada PR, y **un test roto bloquea
      el merge**. Verificado abriendo un PR con un test que falle a propósito y comprobando que el
      check queda en rojo.
- [ ] **AC8** — **Los tests siguen la convención de consulta accesible:** los ejemplos usan
      `getByRole` y `getByLabelText`, y **no hay ni un `data-testid`** en el código entregado. Si un
      elemento no se puede encontrar por su rol o su etiqueta, el problema es el componente.
- [ ] **AC9** — **Documentación al día:** `CLAUDE.md` ya no afirma que no hay tests de frontend;
      `bighearts-dod` exige lo que ahora sí se puede exigir y deja de excusar al frontend;
      `_PLANTILLA.md` refleja el comando nuevo. Recorrido explícito de la tabla de §6 del skill
      `bighearts-dod`.
- [ ] **AC10** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `npm run test` (los tres workspaces) en verde.

## 🚫 Fuera de alcance

- **Tests de los componentes de dominio** (`<EstadoAula>`, `<TarjetaAula>`, `<IndicadorCupo>`).
  Nacen en HU-203 **con sus tests dentro de esa HU**. Aquí solo se entrega la infraestructura y el
  patrón a copiar.
- **Cobertura retroactiva** de `features/auth` y `features/profile`. Se cubren cuando se toquen.
- **E2E con Playwright.** Se evalúa al cerrar la Fase 1, cuando existan flujos completos que
  merezca la pena recorrer de punta a punta.
- **Umbral numérico de cobertura.** Decisión 5.
- **Regresión visual** (capturas comparadas). Costoso de mantener y frágil; el contraste y los
  tokens ya están verificados en `tokens.css`.
- Tests del backend: ya existen y no se tocan aquí.

## Notas de implementación

_Se rellena al cerrar._
