# HU-309 — El panel del estudiante sigue diciendo que no tiene clases

| Campo               | Valor                                                  |
| ------------------- | ------------------------------------------------------ |
| **Sprint**          | Sprint 3 — Sistema de Reservas                         |
| **Prioridad**       | 🔴 Crítica (la pantalla de inicio miente)              |
| **Estimación**      | 0.5 días                                               |
| **Estado**          | ⬜ Pendiente                                           |
| **Rama**            | `hu-309-el-panel-conoce-las-reservas-<persona>`        |
| **Alcance técnico** | frontend                                               |
| **Depende de**      | HU-302 (✅)                                            |
| **Labels**          | `sprint-3` `prioridad:critica` `frontend` `bug` `a11y` |

> **Como** estudiante con una clase reservada,
> **Quiero** verla al entrar a la plataforma,
> **Para** no tener que buscarla en otro sitio cuando es lo único que vine a mirar.

## Contexto

**El propio código pidió esta HU y nadie volvió a por ella.** `panel-estudiante.tsx` lleva escrito
en su comentario de cabecera:

> _«En el Sprint 2 siempre muestra el vacío, y no es un descuido. `Booking` no existe hasta el
> Sprint 3 (…). **HU-301 trae el dato y esta pieza pasa a tener sus cuatro estados**; hasta entonces
> tiene uno, porque uno es la verdad.»_

HU-301 llegó, HU-302 construyó «Mis reservas», y el panel se quedó con su único estado. Hoy un
estudiante que acaba de reservar entra a `/panel` —**el inicio de todos los roles**, D19— y lee
**«No tienes clases reservadas»**, con un botón que le invita a explorar el catálogo como si
viniera de cero.

Ya no es la verdad: es una pantalla prometiendo lo contrario de lo que el producto hace. Y es
exactamente el fallo que originó HU-209, reintroducido por el lado opuesto — aquel decía de más,
este dice de menos.

Pesa más de lo que parece por dónde está. La prueba definitiva del producto es que el estudiante
**encuentre su clase** sin pedir ayuda; el primer sitio donde la busca es el que la app le da al
entrar.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.8 regla 5 (`/panel` es el inicio de cada rol), **D19**, §7.3.
- **Skills:** `bighearts-ui` → `patrones-dominio.md` y `voz-microcopy.md`.
- **Reutiliza:** `useMisReservas()` y el hook de HU-302 —el dato ya existe y ya está paginado—,
  `<EstadoAula>`, `<EstadoVacio>`, el bloque de acceso al enlace de HU-304.
- **Decisiones pendientes:** ninguna.

> **No dupliques «Mis reservas».** El panel muestra **las dos o tres próximas** y enlaza a
> `/mis-clases` para el resto. Si el panel se convierte en la misma lista con otro título, sobra uno
> de los dos.

## 🔧 Tasks

### Frontend

- [ ] **T1** — `PanelEstudiante` consulta sus reservas próximas con el hook de HU-302 y pinta **sus
      cuatro estados**: cargando con texto, vacío, error y lista.
- [ ] **T2** — Muestra **hasta tres** clases próximas, con fecha y zona explícita, estado del aula y
      modos de comunicación. Un enlace a `/mis-clases` para el resto.
- [ ] **T3** — Si alguna está **dentro de la ventana de acceso**, el botón de entrar aparece aquí
      también. Es el caso que más importa: el estudiante entra a la plataforma justo antes de clase.
- [ ] **T4** — El estado vacío se mantiene **solo cuando de verdad no hay reservas**, con el texto
      actual, que ya es correcto.
- [ ] **T5** — Revisar el panel del **profesor** por el mismo motivo: comprobar si su bloque asume
      un mundo sin reservas y corregirlo si es así.
- [ ] **T6** — Tests: con reservas se listan y no aparece «No tienes clases reservadas»; sin
      reservas aparece; `axe` limpio.
- [ ] **T7** — Borrar el comentario de cabecera que anuncia el vacío como provisional, y con él la
      deuda que describía.

## ✅ Criterios de aceptación

- [ ] **AC1** — Un estudiante con reservas `CONFIRMED` ve sus próximas clases en `/panel`, y **no**
      aparece por ninguna parte «No tienes clases reservadas».
- [ ] **AC2** — Un estudiante sin reservas sigue viendo el estado vacío actual, con su invitación al
      catálogo.
- [ ] **AC3** — El panel muestra **como mucho tres** clases y enlaza a `/mis-clases`. No es la misma
      lista con otro título.
- [ ] **AC4** — Con una clase dentro de la ventana de acceso, el botón de entrar está en el panel.
- [ ] **AC5** — El bloque tiene sus cuatro estados, y el de error no se confunde con el vacío.
- [ ] **AC6** — **Accesibilidad y verificación:** checklist del skill `bighearts-ui`, `axe` limpio, y
      `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Rehacer el panel** entero. Solo el bloque del estudiante y, si hace falta, el del profesor.
- **Reservar o cancelar desde el panel.** Se navega al aula o a «Mis reservas».
- **El panel del administrador.** Es su vista de operación y no depende de reservas.
- Métricas o resúmenes de actividad.

## Notas de implementación

_Se rellena al cerrar._
