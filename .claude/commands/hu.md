---
description: Implementa una capa de una Historia de Usuario del repo, o la cierra verificando sus acceptance criteria.
argument-hint: <ruta a docs/historias/HU-XXX-*.md> [contrato|backend|frontend|cierre]
---

Trabajas sobre la Historia de Usuario que está en **$ARGUMENTS**.

Si no se pasó ninguna ruta, lista `docs/historias/` y pregunta cuál antes de seguir.

## Cómo se usa este comando

**Una capa por sesión, y `/clear` entre capas.** No implementes la HU entera de una pasada.

```
/hu docs/historias/HU-XXX-*.md contrato    → tipos y códigos de error     → /clear
/hu docs/historias/HU-XXX-*.md backend     → endpoints, modelo, tests     → /clear
/hu docs/historias/HU-XXX-*.md frontend    → pantallas y componentes      → /clear
/hu docs/historias/HU-XXX-*.md cierre      → verificación y AC uno a uno
```

**Por qué.** El coste de una sesión es _turnos × contexto acumulado_, y el contexto no baja mientras
la sesión viva. Cuatro sesiones que promedian 50k cuestan mucho menos que una que promedia 150k
haciendo el mismo trabajo. Y salen mejor: el código escrito en el turno 38 de una sesión llena es
peor que el mismo código en el turno 8 de una limpia.

**Si no se indica capa**, ejecútalas todas seguidas. Solo es razonable en HUs de 5 tasks o menos; si
la HU tiene más, **dilo y sugiere partirla por capas** antes de empezar.

---

## Fase A — Orientarse (en toda invocación, corta)

1. **Lee la HU.** Mira qué tasks están ya `[x]` y lee las **Notas de implementación**: ahí está lo
   que dejó la capa anterior.
2. **Lee solo los skills que tu capa necesita.** No cargues los cuatro:
   - `contrato` → `bighearts-backend` → `contrato-api.md`
   - `backend` → `bighearts-backend` (+ `reglas-reservas.md` solo si tocas reservas o cupos)
   - `frontend` → `bighearts-ui` (+ `layout-y-composicion.md` si montas pantalla, `patrones-dominio.md`
     si tocas componentes de dominio, `voz-microcopy.md` si escribes copy)
   - `cierre` → `bighearts-dod`
3. **Comprueba bloqueos.** Si la HU depende de algo sin decidir (`ARQUITECTURA.md` §14.6) o da por
   hecho algo que no existe en el repo, **para y pregunta**. No lo inventes.
4. **Di en dos líneas** qué vas a hacer en esta capa y qué encontraste ya hecho. Sin resumir la HU
   entera: ya la tienes delante.

**Si algo de la HU contradice `docs/ARQUITECTURA.md`, un skill o el código existente: dilo y
espera.**

## Fase B — Implementar tu capa

Ejecuta **solo las tasks de tu sección**, en orden. Ninguna de otra capa.

Verificación durante la implementación, **acotada**:

- `contrato` → `npm run build:types` al terminar. Nada más.
- `backend` → solo el spec que escribiste: `npx vitest run <ruta> --workspace @academia/api`.
- `frontend` → solo el spec que escribiste: `npx vitest run <ruta> --workspace @academia/web`.
- **Nunca** `npm run lint`, `format:check` ni `npm run test` completos aquí. Para lint puntual,
  `npx eslint <rutas que tocaste>`. Prettier ya lo pasa el hook de `pre-commit`.

Mientras escribes: sigue las convenciones del repo, mira un módulo hermano antes de inventar
estructura, comenta el **porqué** y no el qué, y no añadas dependencias sin justificarlas antes.

## Fase C — Cerrar la capa y traspasar

**Esto es lo que hace que la siguiente sesión no tenga que redescubrir nada.** Antes de terminar:

1. Marca `[x]` las tasks que completaste.
2. Escribe en **Notas de implementación** de la HU, en 3–5 líneas: qué quedó hecho, qué decisión
   tuviste que tomar que no estaba en la HU, y qué necesita saber la capa siguiente.
3. Termina diciendo: **«Capa <X> lista. Haz `/clear` y ejecuta `/hu <ruta> <siguiente capa>`».**

No sigas con la capa siguiente aunque parezca poco trabajo.

---

## La capa `cierre`

Es la única que verifica de verdad. En sesión limpia y con el contexto vacío, así que **hazla
inline: no delegues a un subagente**, que era una forma de esquivar un contexto inflado que aquí ya
no existe.

1. Lee la HU y `git diff main...HEAD` para ver qué se construyó.
2. Corre la verificación completa **una sola vez**: `npm run typecheck`, `npm run lint`,
   `npm run build`, `npm run test`. `format:check` no entra: lo hace el `pre-commit`.
3. **Recorre cada acceptance criteria, uno por uno.** Cítalo, di cómo lo comprobaste (test concreto,
   comando, petición, pantalla) y da veredicto: **cumple** / **no cumple** / **parcial, falta X**.
   Nada de «todos se cumplen».
4. Si la HU tocó frontend, recorre el checklist final del skill `bighearts-ui`. Los temas `.dark` y
   `.hc` se revisan **a ojo en el navegador**, no con tests.
5. Actualiza la documentación que quede desactualizada (tabla de §6 de `bighearts-dod`) y marca el
   **Estado** de la HU en su cabecera.

Entrega al final:

1. Qué se implementó, por capa.
2. El recorrido de acceptance criteria del punto 3.
3. **Qué quedó pendiente y por qué**: AC no cumplidos, decisiones que hicieron falta y no estaban
   tomadas, supuestos. Si de verdad no queda nada, dilo — pero revísalo antes, porque un cierre sin
   pendientes suele significar que algo se dio por bueno sin mirar.
4. Un mensaje de commit en Conventional Commits con ámbito de workspace.
