# HU-504 — El perfil de accesibilidad es del estudiante

| Campo               | Valor                                                                |
| ------------------- | -------------------------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Pulido                                                 |
| **Prioridad**       | 🟠 Alta (incoherencia de rol, con un agujero de autorización detrás) |
| **Estimación**      | 1 día                                                                |
| **Estado**          | ⬜ Pendiente                                                         |
| **Rama**            | `hu-504-la-accesibilidad-es-del-estudiante-<persona>`                |
| **Alcance técnico** | fullstack                                                            |
| **Depende de**      | ninguna                                                              |
| **Labels**          | `post-fase-1` `prioridad:alta` `fullstack` `bug` `a11y`              |

> **Como** profesor o administrador,
> **Quiero** que el perfil no me pida mi nivel de pérdida auditiva ni mi preferencia de comunicación,
> **Para** no tener que responder a algo que la plataforma no va a usar para nada mío.

## Contexto

El registro ya lo hace bien: **solo al estudiante** se le preguntan los dos campos. El catálogo
también —`AulasPage` comprueba `role === STUDENT` antes de invitar a completarlos—. El perfil se
quedó fuera de esa coherencia y se los pide a los tres roles.

No es solo una pregunta de más. Esos dos datos existen **para una cosa concreta**: que el catálogo
marque las clases que le sirven al estudiante y que el profesor sepa cómo se comunica su grupo. Un
profesor que rellena «lengua de señas» está escribiendo un dato que **nadie lee jamás**, y la
pantalla le está sugiriendo que sirve para algo.

Es el mismo tipo de fallo que corrigieron HU-208, HU-209 y HU-210 —una pantalla que no distingue
quién la mira— y sobrevivió a la pasada de cierre de HU-407 porque aquella buscaba **promesas
falsas**, no **preguntas que no aplican**. Vale la pena anotarlo: son dos defectos distintos y una
sola pasada no encuentra los dos.

### Y debajo, lo que de verdad importa

**`users.service.ts` escribe los dos campos sin mirar el rol.** Un `TEACHER` o un `ADMIN` puede
guardarlos hoy con una petición directa, aunque la interfaz deje de ofrecerlos.

`ARQUITECTURA.md` §4.8 es explícito: **la autorización se decide siempre en el servidor, y el
frontend replica la lógica solo para ocultar UI.** Si esta HU se queda en esconder los dos selects,
cumple lo que pediste y deja la regla incumplida. Por eso el arreglo es de las dos capas.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.8 (la autorización se decide en el servidor), §4.9 (para qué
  existen estos dos campos), `DEFINICION_PROYECTO.md` §5.1.
- **Skills:** `bighearts-backend` → `contrato-api.md` · `bighearts-ui` → `voz-microcopy.md`.
- **Archivos:** `apps/api/src/users/` (servicio y DTO) · `apps/web/src/features/profile/`
  (`profile-form.tsx`, `validate-profile.ts`) y el aviso de preferencias sin indicar.
- **Reutiliza:** el patrón de `AulasPage`, que ya resuelve bien esta misma pregunta.
- **Decisiones pendientes:** ninguna.

> **Los datos ya guardados no se tocan.** Si algún profesor rellenó esos campos alguna vez, sus
> valores se quedan en la base de datos: son inertes —ninguna consulta los lee para un no
> estudiante— y borrarlos es una migración con riesgo a cambio de nada. El tipo `User` tampoco
> cambia: los dos campos siguen siendo opcionales para todos los roles.

## 🔧 Tasks

### Contrato — va primero

- [ ] **T1** — En `packages/types`: el código de error para «este campo no aplica a tu rol». Luego
      `npm run build:types`.

### Backend

- [ ] **T2** — En la actualización de perfil, **rechazar** `hearingLossLevel` y
      `communicationPreference` si quien pide no es `STUDENT`. Se responde con el código nuevo, no
      se ignora en silencio: ignorar un campo enviado deja a quien llama creyendo que se guardó.
- [ ] **T3** — Tests: un `TEACHER` y un `ADMIN` que envían cualquiera de los dos campos reciben el
      error; **los mismos usuarios siguen editando nombre y apellido con normalidad**; un `STUDENT`
      los guarda como hasta ahora.

### Frontend

- [ ] **T4** — `profile-form.tsx` **solo pinta los dos selects si el usuario es `STUDENT`**. Para
      los otros roles el formulario queda con nombre y apellido, sin hueco ni encabezado huérfano.
- [ ] **T5** — El aviso de **«Todavía no indicaste tus preferencias»** solo se muestra al estudiante.
      Mismo criterio que ya usa `AulasPage`.
- [ ] **T6** — Tests: un profesor y un administrador **no ven** el aviso ni ninguno de los dos
      campos; un estudiante los ve y los guarda igual que antes; `axe` limpio en los tres casos.

### Documentación

- [ ] **T7** — Anotar en `ARQUITECTURA.md` §4.9 que **estos dos campos son del rol `STUDENT`**, y
      que el servidor lo hace cumplir. Hoy el documento explica para qué sirven pero no de quién son.

## ✅ Criterios de aceptación

- [ ] **AC1** — Un `TEACHER` y un `ADMIN` **no ven** el aviso de preferencias ni los dos selects en
      su perfil, y el resto de la pantalla queda intacta y sin huecos.
- [ ] **AC2** — Un `STUDENT` ve y edita los dos campos **exactamente igual que hoy**.
- [ ] **AC3** — **Autorización en el servidor:** una petición de actualización con cualquiera de los
      dos campos desde un `TEACHER` o un `ADMIN` **se rechaza** con el código nuevo. Verificado con
      tests de backend, no ocultando la interfaz.
- [ ] **AC4** — Un `TEACHER` y un `ADMIN` **siguen pudiendo editar nombre y apellido** sin
      tropezarse con el rechazo.
- [ ] **AC5** — Un usuario no estudiante que ya tuviera valores guardados **no rompe nada**: su
      perfil carga y se edita con normalidad.
- [ ] **AC6** — **Accesibilidad y verificación:** checklist del skill `bighearts-ui`, `axe` limpio,
      y `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Borrar los valores ya guardados** de usuarios no estudiantes. Son inertes; la migración no
  compensa.
- **Partir el tipo `User`** en variantes por rol. Sería más estricto, pero toca el contrato entero
  para resolver un caso que se resuelve en el servicio.
- **Revisar otras pantallas** por el mismo tipo de fallo. Si quieres esa pasada, es una HU propia —
  y no sería mala idea, visto que esta se coló.
- El **registro** y el **catálogo**, que ya distinguen el rol correctamente.

## Notas de implementación

_Se rellena al cerrar._
