# HU-209 — Panel de inicio por rol

| Campo               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| **Sprint**          | Sprint 2 — Gestión de Aulas                      |
| **Prioridad**       | 🔴 Crítica                                       |
| **Estimación**      | 2 días                                           |
| **Estado**          | ✅ Completada (2026-08-20)                       |
| **Rama**            | `hu-209-panel-de-inicio-por-rol-<persona>`       |
| **Alcance técnico** | frontend                                         |
| **Depende de**      | HU-104 (✅), HU-201 (✅), HU-203 (✅)            |
| **Labels**          | `sprint-2` `prioridad:critica` `frontend` `a11y` |

> **Como** estudiante, profesor o administrador,
> **Quiero** que al entrar aterrice en una página de inicio que hable de lo mío y sea cierta,
> **Para** saber qué hacer a continuación sin recorrer la plataforma buscándolo.

## Contexto

**`PanelPage` miente a dos de los tres roles.** Le dice al profesor _"Todavía no puedes crear
aulas"_ —falso desde HU-201— y al estudiante _"Todavía no hay aulas publicadas"_ —falso desde
HU-203—. Las dos frases eran ciertas cuando se escribieron y llevan dos historias sin actualizarse.
Un usuario que entra hoy lee que el producto no hace lo que acaba de hacer.

Y hay un problema de estructura debajo del texto: **el administrador aterriza en un panel que no es
suyo.** `/panel` le habla como a un usuario cualquiera y su trabajo real —aprobar profesores— vive
en `/admin`, escondido detrás de una tarjeta. Dos pantallas para una función, con la principal en
segundo plano.

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.8 (visibilidad por rol), §8 (autorización en el
  servidor).
- **Skills:** `bighearts-ui` → `layout-y-composicion.md` (una sola acción primaria por pantalla) y
  `voz-microcopy.md` (los vacíos invitan a actuar).
- **Reutiliza:** `<RoleGate>`, `usePendingTeachers`, `<PendingTeachersTable>`, `useResolveTeacher`,
  `<EstadoVacio>`, `<AppShell>`, `<PaginaCabecera>`.
- **⚠️ HU-104 está cerrada y probada.** Su lógica de aprobación **no se reescribe: se recoloca**.
  Los tests de `AdminPage.spec.tsx` se mueven con ella, no se borran.

### Decisiones tomadas (2026-08-20)

**1. `/panel` es el inicio de todos los roles, y su contenido cambia según quién entra.** Para el
administrador, ese inicio **es** su panel de operación: la aprobación de profesores deja de estar a
un clic escondido y pasa a ser lo primero que ve.

**2. `/admin` se pliega dentro de `/panel` y queda como redirección.** No se elimina la ruta:
cualquier enlace guardado o marcador sigue funcionando. Simplemente lleva a donde ahora vive la
función.

**3. El panel no promete lo que no existe.** Cada bloque muestra datos reales o un vacío que invita
a actuar. **Se prohíbe el texto en futuro** —"cuando esté disponible", "todavía no puedes"—: es
exactamente lo que produjo esta HU.

## 🔧 Tasks

### Frontend

- [x] **T1** — Borrar de `PanelPage` los dos textos falsos: _"Todavía no puedes crear aulas"_ y
      _"Todavía no hay aulas publicadas"_. **Antes que nada**, para que la mentira no sobreviva ni
      un commit más de lo necesario.
- [x] **T2** — Panel del **estudiante**: sus próximas clases reservadas, o un vacío que lleve al
      catálogo. Acción primaria única: `Explorar clases`.
      **⚠️ En el Sprint 2 no existen las reservas**, así que este panel siempre mostrará el vacío.
      Su texto **no puede prometer reservar**: manda a explorar y a ver el detalle, que es lo único
      que el estudiante puede hacer hoy. Cuando HU-301 aterrice, se completa.
- [x] **T3** — Panel del **profesor**: sus próximas clases a impartir, o un vacío que lleve a
      crear. Acción primaria única: `Crear una clase`.
- [x] **T4** — Panel del **administrador**: los profesores pendientes de aprobación **en primer
      plano**, con la tabla y las acciones que ya existen de HU-104. Si no hay ninguno, el vacío
      normal —una academia sana no tiene solicitudes esperando, y eso no es un error.
- [x] **T5** — Mover `PendingTeachersTable` y su lógica de `AdminPage` al panel del administrador.
      Mover también sus tests.
- [x] **T6** — `/admin` pasa a redirigir a `/panel`. La ruta no desaparece.
- [x] **T7** — Los 4 estados en cada uno de los tres paneles: cargando con texto, vacío, error y
      contenido.
      → ⚠️ Profesor y administrador tienen los cuatro. El **estudiante tiene uno**, porque no hace
      ninguna consulta: sin `Booking` no hay nada que cargar y por tanto nada que fallar. Ver nota 5.
- [x] **T8** — Tests: cada rol ve su panel y **no** ve el de los otros dos; los textos borrados no
      reaparecen; `/admin` redirige; `axe` limpio en los tres paneles y en los tres temas.

### Documentación

- [x] **T9** — Actualizar `ARQUITECTURA.md` §9 con la estructura de rutas resultante, y recorrer la
      tabla de §6 del skill `bighearts-dod`.

## ✅ Criterios de aceptación

- [ ] **AC1** — **Ninguna de las dos frases falsas queda en el código.**
      `grep -rn "Todavía no puedes crear aulas\|Todavía no hay aulas publicadas" apps/web/src` no
      devuelve nada.
      → ⚠️ **Cumple en el panel; el comando literal no.** Ver nota 1 del cierre.
- [x] **AC2** — Un **estudiante** en `/panel` ve sus próximas clases reservadas, o un vacío que
      lleva al catálogo. No ve nada del profesor ni del administrador.
      → ⚠️ La rama del vacío está entera; la de «clases reservadas» no puede existir sin `Booking`
      (lo dice la propia T2).
- [x] **AC2b** — **El vacío del estudiante no promete lo que el sprint no entrega.** Como todavía
      no hay reservas, su texto invita a explorar el catálogo y ver el detalle de una clase, **no a
      reservarla**. Mandarle a un sitio donde no puede hacer nada es el mismo fallo que produjo
      esta HU.
      → ⚠️ No invita al **detalle**: HU-204 no existe y `/aulas/:id` no es una ruta. Ver nota 4.
- [x] **AC3** — Un **profesor** en `/panel` ve sus próximas clases a impartir, o un vacío que lleva
      a crear una.
- [x] **AC4** — Un **administrador** en `/panel` ve los profesores pendientes **como contenido
      principal**, no detrás de un enlace, y puede aprobarlos y rechazarlos ahí mismo.
- [x] **AC5** — Aprobar y rechazar siguen funcionando exactamente igual que en HU-104: mismos
      códigos de error, mismo anuncio por región viva, mismos tests pasando tras moverse.
- [x] **AC6** — Entrar en `/admin` lleva a `/panel`. Un marcador antiguo no se rompe.
- [x] **AC7** — **Una sola acción primaria por panel.** Ninguno de los tres pinta dos.
- [x] **AC8** — **Cero texto en futuro.** Ningún panel dice "cuando esté disponible", "próximamente"
      ni "todavía no". Los vacíos invitan a actuar, según `voz-microcopy.md`.
- [x] **AC9** — **Accesibilidad:** un solo `<h1>` por panel, foco al `<h1>` al navegar, recorrido
      completo con teclado, `axe` limpio en los tres roles y en `light`, `dark` y `hc`.
- [x] **AC10** — **Verificación automática:** `typecheck`, `lint`, `format:check`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **La vista de supervisión global de aulas del administrador** → HU-210. Aquí el admin solo ve
  aprobaciones.
- **Métricas y estadísticas** en cualquiera de los tres paneles. Fase posterior.
- **Cambiar la lógica de aprobación de HU-104.** Se recoloca, no se reescribe.
- Notificaciones o avisos dentro del panel.
- Personalización del panel por parte del usuario.

## Notas de implementación

### Estructura resultante

`PanelPage` pasa a ser un compositor de tres piezas, una por rol, montadas con `<RoleGate>` — así
las consultas de los paneles ajenos ni se disparan:

| Rol       | Componente                                              |
| --------- | ------------------------------------------------------- |
| `STUDENT` | `features/panel/components/panel-estudiante.tsx`        |
| `TEACHER` | `features/panel/components/panel-profesor.tsx`          |
| `ADMIN`   | `features/admin/components/aprobaciones-pendientes.tsx` |

`pages/AdminPage.tsx` desaparece: git lo registra como **rename** hacia `aprobaciones-pendientes.tsx`
porque es un movimiento, no una reescritura (AC5). Su spec viaja con él y sus seis tests pasan sin
cambiar una sola aserción; lo único que se editó fue el sujeto que montan.

`AppRouter` se parte en dos: `<AppRouter>` monta el `<BrowserRouter>` y `<AppRoutes>` la tabla de
rutas. Sin esa separación la redirección de `/admin` no sería testeable — anidar routers rompe la
navegación —, y el AC6 se habría quedado en una comprobación de mentira.

### Notas de cierre — lo que quedó abierto

**1. AC1 no se cumple en su forma literal, y no debe cumplirse.** El `grep` del criterio sigue
devolviendo `Todavía no hay aulas publicadas` en `AulasPage.tsx` (líneas 47 y 125) y en dos specs.
**Ahí la frase es verdad**: es el estado vacío del catálogo cuando la API devuelve cero aulas, es el
AC8 de HU-203 y tiene tests que lo verifican. Borrarla rompería un comportamiento correcto y
mentiría en la dirección contraria. Lo que la HU quería —que el **panel** no la diga— se cumple, y
hay un test que lo guarda (`PanelPage.spec.tsx`, «el panel no miente»). El comando del AC estaba
escrito dando por hecho que esas cadenas solo vivían en `PanelPage`.

**2. El panel del profesor lee una fuente provisional.** `GET /classrooms/mias` (§4.8) es la task A1
de **HU-207**, que sigue pendiente, y esta HU es de alcance frontend. Hasta entonces el panel filtra
el catálogo público por `teacherId` en el cliente —el mecanismo que autoriza la decisión 2 de
HU-208—. Limitación real: si las clases del profesor cayeran fuera de las 100 próximas de toda la
academia, vería el vacío teniéndolas. Está marcado en el propio componente y en `ARQUITECTURA.md`
§9. **HU-207 debe sustituir esa consulta.**

**3. `/admin` ya no lleva `roles={[ADMIN]}`.** Antes, un estudiante que escribiera esa URL veía
`<AccessDenied>`; ahora aterriza en su propio panel. Es deliberado: una redirección responde a una
URL vieja, no ofrece una pantalla, y negarle el acceso a algo que ya no existe es ruido. Cambio de
conducta, aun así, y por eso se anota.

**4. El vacío del estudiante no menciona el detalle del aula.** El AC2b pedía invitar a «ver el
detalle de una clase», pero HU-204 no existe y `/aulas/:id` no es una ruta. Mandar al estudiante a
un 404 sería el mismo fallo que originó esta HU, así que el texto describe lo que sí va a encontrar
en el catálogo. **Cuando HU-204 aterrice, conviene revisar este microcopy.**

**5. El panel del estudiante tiene un estado, no cuatro.** No hace ninguna consulta —`Booking` llega
en el Sprint 3—, así que no hay carga que anunciar ni error que explicar. Inventar un «cargando» que
nunca se ve habría sido decorado. HU-301 lo completa.

**6. Se retiró el `<Callout>` «Tu sesión se mantiene abierta».** No lo pedía la HU. Estaba encima de
todo el contenido y empujaba hacia abajo el trabajo del administrador, que el AC4 exige en primer
plano; y no es ni un dato real ni un vacío que invite a actuar, que es lo que la decisión 3 admite en
este panel. Si se quiere recuperar, su sitio es `/perfil`, no el inicio.

**7. Sin verificación manual con teclado ni lector de pantalla.** `axe` sale limpio en los tres roles
y los tres temas, y todo lo interactivo es `<a>` o `<button>` nativo, pero el §5 del skill
`bighearts-dod` avisa de que el orden del foco y la comprensibilidad real siguen siendo manuales.
