# HU-521 — La landing tiene un solo par de botones de acceso

| Campo               | Valor                                       |
| ------------------- | ------------------------------------------- |
| **Sprint**          | Post-Fase 1 · UX                            |
| **Prioridad**       | 🟠 Alta (pedido del cliente)                |
| **Estimación**      | 0.5 días                                    |
| **Estado**          | ⬜ Pendiente                                |
| **Asignada a**      | **Dev A** — frontend, `features/landing/`   |
| **Rama**            | `hu-521-un-solo-par-de-botones-de-acceso-a` |
| **Alcance técnico** | frontend                                    |
| **Depende de**      | ninguna                                     |
| **Labels**          | `post-fase-1` `prioridad:alta` `frontend`   |

> **Como** persona que entra por primera vez a la landing,
> **quiero** ver un solo lugar para crear cuenta o iniciar sesión,
> **para** no dudar de cuál de los dos botones iguales tengo que usar.

## Contexto

Al entrar, `<CtaAcceso>` aparece **dos veces a la vista**: compacto en la barra (`cabecera-landing`) y
grande en el hero (`seccion-hero`). Además vuelve en `seccion-cierre`, y `seccion-profesores` tiene
su propio «Crear mi cuenta de profesor». El cliente pidió que solo quede **el par de la barra**. Como
la barra es `sticky`, sigue a mano en cualquier punto de la página, así que quitar los demás no deja
a nadie sin salida.

## Referencias

- **Archivos a tocar:** `apps/web/src/features/landing/components/{seccion-hero,seccion-cierre,seccion-profesores,cta-acceso,cabecera-landing}.tsx`,
  `landing.spec.tsx`, `cta-acceso.spec.tsx`.
- **Reglas:** skill `bighearts-ui` → `layout-y-composicion.md`. `docs/BigHearts-Marca-y-Producto.md` →
  «Parte VI · La landing page» (se actualiza: hero y cierre sin botones de acceso).
- **Decisiones pendientes:** ninguna.

## Tasks

- [ ] **T1** — Hero: se retira `<CtaAcceso>`. En su lugar va un enlace secundario, sin estilo de
      botón de acceso, «Ver cómo es una clase» que baja a `#como-es-una-clase` (un ancla, no una
      acción de cuenta).
- [ ] **T2** — Cierre: se retira `<CtaAcceso>`. El titular queda y debajo va una línea que dirige a
      la barra solo si hace falta: nada de repetir los botones.
- [ ] **T3** — Profesores: se retira «Crear mi cuenta de profesor» y la nota de aprobación se reescribe
      sin llamada a la acción.
- [ ] **T4** — `<CtaAcceso>` queda con **un solo uso** (la barra). Se simplifica: se retira la variante
      no compacta si ya nadie la usa. En móvil, el par sigue visible en la barra, sin menú.
- [ ] **T5** — Tests: en la landing hay exactamente **un** enlace a `/registro` y **uno** a `/login`
      (por rol y nombre), y los dos están dentro del `banner`.

## Criterios de aceptación

- [ ] **AC1** — En toda la landing, `getAllByRole('link', { name: /crear/i })` hacia `/registro`
      devuelve 1 y `/iniciar sesión/i` hacia `/login` devuelve 1, ambos dentro de `role="banner"`.
- [ ] **AC2** — Al cargar la landing a 1280 px y a 375 px se ve un solo par de botones de acceso.
- [ ] **AC3** — Al hacer scroll hasta el cierre, el par de la barra sigue visible (`sticky`).
- [ ] **AC4** — Con sesión abierta, la barra sigue ofreciendo «Ir a mi panel» (comportamiento actual
      de `<CtaAcceso>`), también una sola vez.
- [ ] **AC5** — El documento de marca, Parte VI, describe el hero y el cierre sin botones de acceso.

## Fuera de alcance

- Ocultar «Crear cuenta» cuando el registro está cerrado: es HU-522.

## Notas de implementación

_Se rellena al cerrar: máximo 3 líneas o «Sin desviaciones»._
