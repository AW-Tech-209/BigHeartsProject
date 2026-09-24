---
description: Implementa una Historia de Usuario del repo y verifica sus acceptance criteria.
argument-hint: <ruta a docs/historias/HU-XXX-*.md>
---

Implementa la HU de **$ARGUMENTS**, en una sola sesión.

## Cómo gastar poco

- **Lee solo lo necesario.** La HU, los archivos que vas a tocar y los que ella nombra. Localiza con
  `grep`/`glob`; no explores el repo.
- **Docs largos, nunca enteros.** Si la HU cita `ARQUITECTURA.md §X` o `DEFINICION_PROYECTO.md §X`,
  busca el encabezado con `grep -n` y lee solo esa sección. No abras `README.md` ni `GUIA_FLUJO.md`.
- **Skills:** `bighearts-backend` si tocas servidor, `bighearts-ui` si tocas pantalla — solo su
  `SKILL.md`. Sus archivos de referencia, solo si la HU los nombra.
- No releas un archivo que ya leíste salvo que lo hayas editado.
- No expliques lo que vas a hacer: hazlo.

## Implementar

Orden: contrato (`packages/types` → `npm run build:types`) → backend → frontend.

- **Tests, solo:** invariantes de negocio, autorización, funciones puras compartidas, y una línea de
  `axe` si hay pantalla nueva. Nada más. Si un test existente se rompe por tu cambio, arréglalo.
- **Comentarios:** solo si el porqué no se deduce del código, máximo 2 líneas, sin números de HU.
- Mientras implementas, como mucho `npx vitest run <spec que escribiste>`. **Nada de** `lint`,
  `build`, `typecheck`, suite completa ni `prettier` a mitad.
- **No verifiques a mano en el navegador** (temas, zoom, móvil, teclado) salvo que un AC lo pida
  literalmente.
- Si la HU contradice un skill, `ARQUITECTURA.md` o el código, o da por hecho algo que no existe:
  **para y pregunta**.

## Cerrar

1. **Una vez:** `npm run lint && npm run build && npm run test`.
   Si algo falla: arregla y vuelve a correr **solo el comando que falló**. No repitas la cadena.
2. Marca `[x]` tasks y AC cumplidos. Notas de implementación: máx. 3 líneas o «Sin desviaciones».
3. Respuesta final, **máx. 10 líneas**: tabla `| AC | ✅/❌ | cómo |`, lo pendiente si hay, y el
   mensaje de commit (Conventional Commits). Nada más.

No formatees ni lintes `.md`. No toques documentación que la HU no pida.
