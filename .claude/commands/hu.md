---
description: Implementa una Historia de Usuario del repo y verifica sus acceptance criteria.
argument-hint: <ruta a docs/historias/HU-XXX-*.md>
---

Implementa la HU de **$ARGUMENTS**.

**Una sola sesión, de principio a fin.** No la partas en capas.

## Reglas de gasto — obedécelas

- **Verifica UNA vez, al final.** Durante la implementación, como mucho el spec concreto que
  acabas de escribir (`npx vitest run <ruta>`). Nada de suites completas, `lint`, `build` ni
  `format:check` a mitad.
- **Nunca formatees ni lintes archivos `.md`.**
- **No releas un archivo que ya leíste** en esta sesión salvo que lo hayas editado tú.
- **No expliques lo que vas a hacer antes de hacerlo.** Hazlo y reporta al final.

## Fase 1 — Orientarse (breve)

Lee la HU. Carga **solo** los skills que necesites: `bighearts-backend` si tocas servidor,
`bighearts-ui` si tocas pantalla. Sus archivos de referencia, solo si entras en su territorio.

Si la HU depende de algo sin decidir (`ARQUITECTURA.md` §14.6) o da por hecho algo que no existe en
el repo, **para y pregunta**.

Si algo contradice `ARQUITECTURA.md`, un skill o el código: pregunta y espera.

**No resumas la HU.** Empieza a trabajar.

## Fase 2 — Implementar

Tasks en orden: contrato → backend → frontend. Si tocaste `packages/types`, `npm run build:types`
antes de seguir.

**Comentarios en el código — límite duro:**

- Solo cuando el _porqué_ no se deduce del código.
- **Máximo 2 líneas.** Si necesitas más, el código está mal escrito o la razón va en la HU.
- Cero comentarios que repitan lo que hace la línea de al lado.
- Cero encabezados decorativos, cero bloques narrativos, cero referencias a números de HU.

**Tests — lo mínimo que protege:**

- Invariantes de negocio y autorización: **sí, siempre**.
- Funciones puras compartidas: sí.
- `axe` en pantalla nueva: sí, una línea.
- Todo lo demás: **no**. Es un MVP.

## Fase 3 — Cerrar

1. `npm run typecheck && npm run lint && npm run build && npm run test`. Una vez. Si falla, arregla
   y repite solo eso.
2. Marca `[x]` las tasks y los AC cumplidos en la HU.
3. **Recorre los AC en una tabla compacta**, una línea por AC:
   `| AC | veredicto | cómo se comprobó |`. Sin prosa.
4. **Notas de implementación: máximo 5 líneas**, y solo si hubo una decisión que no estaba en la
   HU. Si no la hubo, escribe «Sin desviaciones» y ya. El historial de git es el registro; la HU no.

**Tu respuesta final: máximo 15 líneas.** La tabla de AC, lo que quedó pendiente, y el mensaje de
commit en Conventional Commits. Nada más — ni resumen de lo implementado, ni explicación de las
decisiones, ni recorrido de archivos tocados. Todo eso ya está en el diff.
