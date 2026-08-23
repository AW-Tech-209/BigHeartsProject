---
description: Implementa una Historia de Usuario versionada del repo, y verifica sus acceptance criteria uno por uno.
argument-hint: <ruta a docs/historias/HU-XXX-*.md>
---

Vas a implementar la Historia de Usuario que está en: **$ARGUMENTS**

Si no se pasó ninguna ruta, lista `docs/historias/` y pregunta cuál antes de seguir.

Trabaja en este orden. No te saltes fases: la 1 y la 2 existen precisamente para que la 3 no
produzca código que haya que rehacer.

---

## Fase 1 — Entender

1. **Lee la HU completa**, no solo el título. Sus **acceptance criteria son el contrato**: cópialos
   a un lado, los vas a necesitar al final.
2. **Localiza qué toca en el repo.** Busca de verdad, no supongas: qué módulo de `apps/api/src/`,
   qué feature de `apps/web/src/features/`, si cambia `packages/types`, si necesita migración de
   Prisma. Nombra los archivos concretos.
3. **Comprueba de qué depende.**
   - ¿Hay una decisión en `docs/ARQUITECTURA.md` que la condiciona? (modelo de datos, invariantes
     de §4, contrato de API, variables de entorno pendientes de introducir)
   - ¿Está en `docs/ARQUITECTURA.md` §14.6, la lista de lo que sigue **sin decidir**? Si la HU
     depende de algo de ahí, **para y pregunta**. No inventes la decisión.
   - ¿Qué skill aplica? `bighearts-backend` si toca servidor, `bighearts-ui` si toca pantalla,
     normalmente los dos si la HU es vertical. **Léelos ahora**, incluidos sus archivos de
     referencia si la HU entra en su territorio (reservas y cupos → `reglas-reservas.md`;
     endpoints, DTOs o esquema → `contrato-api.md`; componentes de dominio → `patrones-dominio.md`;
     texto de interfaz → `voz-microcopy.md`).
4. **Di en voz alta lo que encontraste** antes de tocar nada: archivos afectados, decisiones de
   arquitectura implicadas, skills cargados, y cualquier ambigüedad o contradicción de la HU.

**Si la HU contradice `docs/ARQUITECTURA.md`, un skill o el código existente: dilo y espera.** No
lo resuelvas en silencio.

## Fase 2 — Planear

Presenta un plan corto: las tasks en el orden en que las vas a hacer, y por qué ese orden.

Regla de orden que casi siempre aplica en este repo: **`packages/types` primero** (el contrato),
luego backend, luego frontend. Si el tipo compartido llega al final, las otras dos capas se
escriben contra un contrato imaginario.

Si la HU es grande, ambigua o toca las invariantes de reservas y cupos, **entra en modo plan** y
deja que se apruebe el plan antes de escribir código.

## Fase 3 — Implementar

Ejecuta las tasks **en orden**, una a una. No pases a la siguiente con la anterior a medias.

### Verificación durante la implementación — acotada

**No corras la suite completa después de cada task.** Con 10–17 tasks por HU eso son diez o quince
ejecuciones que vuelcan su salida al contexto y no aportan nada que no aporten dos. Durante la
implementación:

- Si tocaste `packages/types` → `npm run build:types`. Es rápido y todo lo demás depende de él.
- Si escribiste o cambiaste un test → **solo ese archivo**:
  `npx vitest run <ruta-del-spec> --workspace <workspace>`.
- Si tocaste código sin test propio → nada. Se verifica en la fase 4.
- **Nunca** `npm run lint`, `npm run format:check` ni `npm run test` completos aquí.

`eslint` y `prettier` sobre todo el repo son trabajo duplicado: el hook de `pre-commit` ya los pasa
sobre los ficheros staged. Si necesitas comprobar el lint de algo concreto, acótalo:
`npx eslint <rutas que tocaste>`.

Mientras escribes:

- Sigue las convenciones que ya existen en el repo, no las tuyas. Mira un módulo hermano antes de
  inventar una estructura.
- Comenta el **porqué**, no el qué. Es el estándar del código actual y es lo que evita que alguien
  deshaga una decisión sin saberlo.
- No añadas dependencias sin decirlo. Si hace falta una, justifícala primero.

## Fase 4 — Verificar

Aplica el skill **`bighearts-dod`**. Concretamente:

1. Corre la verificación automática **una sola vez, aquí**:
   `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`.
   **`format:check` no entra**: lo resuelve el hook de `pre-commit` sobre los ficheros staged, y
   correrlo sobre el repo entero dentro de la sesión es pagar dos veces por lo mismo.
2. **Recorre cada acceptance criteria de la HU, uno por uno.** Para cada uno:
   - Cítalo textualmente.
   - Di cómo lo comprobaste (test concreto, comando, petición, pantalla).
   - Veredicto: **cumple** / **no cumple** / **cumple parcialmente, falta X**.

   Sin atajos: nada de "todos los AC se cumplen". Uno por uno, con su evidencia.

3. Si la HU tocó frontend, recorre también el checklist final del skill `bighearts-ui`.
4. Actualiza la documentación que haya quedado desactualizada (tabla de §6 del skill
   `bighearts-dod`).

> Si la HU tiene muchos acceptance criteria, o el diff es grande, **delega el recorrido de la fase
> 4 a un subagente** con instrucción de revisar el diff contra la HU sin asumir que el trabajo está
> bien. Quien acaba de escribir el código es el peor juez de si cumple: llega con el sesgo de haber
> decidido ya que sí.

## Fase 5 — Cerrar

Entrega:

1. Qué se implementó, por task.
2. El recorrido completo de acceptance criteria de la fase 4.
3. **Qué quedó pendiente y por qué**: AC no cumplidos, decisiones que hicieron falta y no estaban
   tomadas, supuestos que tuviste que hacer.
4. Qué documentación tocaste.
5. Un mensaje de commit propuesto en Conventional Commits con ámbito de workspace.

El punto 3 no es opcional. Si de verdad no quedó nada pendiente, dilo explícitamente; pero
revísalo antes, porque un cierre sin pendientes suele significar que algo se dio por bueno sin
mirarlo.
