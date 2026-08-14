---
name: bighearts-dod
description: Definición de terminado de BigHearts — qué hay que verificar para dar una task, una historia de usuario o un PR por completo en este repo. Úsalo al cerrar una task, antes de abrir o revisar un PR, al recorrer los acceptance criteria de una HU, o cuando alguien pregunte si algo está listo, terminado o mergeable. Dispara con: terminado, listo, completo, definición de terminado, DoD, acceptance criteria, criterios de aceptación, cerrar HU, PR, merge, revisión, checklist, verificar.
license: Proprietary
---

# BigHearts — definición de terminado

"Funciona en mi máquina" no es terminado. Terminado es: **los acceptance criteria de la HU se
cumplen, la verificación está corrida, y la documentación no quedó mintiendo.**

> Este checklist describe lo que **este repo** puede verificar hoy. No pide cosas que no existen
> —por ejemplo, tests de frontend, que hoy no tienen runner instalado (ver §5)—. Un checklist que
> pide imposibles se ignora entero, y entonces no sirve para nada.

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

## 2. Verificación automática — siempre

```bash
npm run typecheck                          # los tres workspaces
npm run lint                               # ESLint en todo el repo
npm run format:check                       # Prettier
npm run test --workspace @academia/api     # Vitest (backend)
npm run build                              # compila los tres, tipos primero
```

Los cinco en verde. Si tocaste `packages/types`, `npm run build:types` **antes** de lo demás, o el
resto falla con `TS2307`.

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

Recorre el **checklist del skill `bighearts-ui`** (está al final de su `SKILL.md`). En resumen, y
sin sustituirlo:

- Teclado completo con foco visible; cada estado legible sin color; contraste y objetivos táctiles.
- Los **4 estados**: cargando, vacío, error, éxito. Un componente sin los cuatro no está terminado.
- Funciona en `.dark` y `.hc`; respeta `prefers-reduced-motion`; zoom al 200% sin romperse.
- Cero colores literales; cambios dinámicos anunciados por `aria-live`.
- Microcopy revisado contra `voz-microcopy.md`: español literal, sentence case, errores que
  explican en vez de disculparse.

## 5. El hueco que hoy existe

`apps/web` **no tiene runner de tests instalado**, y su job de CI solo hace lint y build. Por tanto:

- **No se exigen tests de frontend.** La verificación de UI es manual, contra el checklist de §4.
- Si una HU mete lógica de dominio en el frontend (derivar estados de aula, formatear fechas y
  zonas, calcular la ventana de acceso para pintar), **dilo en el PR**: es la señal de que hace
  falta decidir el runner antes de seguir acumulando.
- Tampoco hay E2E. Los flujos completos se prueban a mano contra `docker compose up` con los
  usuarios del seed.

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
