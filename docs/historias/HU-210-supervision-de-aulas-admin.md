# HU-210 — Supervisión de aulas para el administrador

| Campo               | Valor                                          |
| ------------------- | ---------------------------------------------- |
| **Sprint**          | Sprint 2 — Gestión de Aulas                    |
| **Prioridad**       | 🟠 Alta                                        |
| **Estimación**      | 1.5 días                                       |
| **Estado**          | ✅ Completada (2026-08-24)                     |
| **Rama**            | `hu-210-supervision-de-aulas-admin-<persona>`  |
| **Alcance técnico** | fullstack                                      |
| **Depende de**      | HU-203 (✅), HU-209                            |
| **Labels**          | `sprint-2` `prioridad:alta` `fullstack` `a11y` |

> **Como** administrador,
> **Quiero** ver todas las aulas de la academia, de todos los profesores, incluidas las canceladas
> y las que ya pasaron,
> **Para** supervisar la operación y detectar problemas sin tener que preguntarle a cada profesor.

## Contexto

`DEFINICION_PROYECTO.md` §3 dice que el administrador «gestiona la operación global del servicio», y
hoy **no puede ver ni una sola clase** más allá del catálogo público, que le muestra lo mismo que a
un estudiante: solo publicadas y futuras. Si un profesor cancela tres clases seguidas o programa una
a las tres de la mañana, el admin no tiene forma de enterarse dentro de la plataforma.

Esta HU **amplía el alcance de Fase 1**, y esa ampliación queda registrada en
[`DEFINICION_PROYECTO.md` §5.1](../DEFINICION_PROYECTO.md#51-dentro-del-alcance) con su nota de
auditoría. No es un extra: es cerrar una incoherencia entre lo que el documento promete del rol y
lo que el rol puede hacer.

### Por qué no es el catálogo con otro filtro

Misma distinción que separó HU-207 de HU-203:

|              | Catálogo (HU-203)             | Supervisión (esta HU)                                 |
| ------------ | ----------------------------- | ----------------------------------------------------- |
| Qué muestra  | Solo `PUBLISHED` y futuras    | **Todas**: canceladas, pasadas, de cualquier profesor |
| Para qué     | Descubrir una clase que tomar | Vigilar que la operación va bien                      |
| Quién        | Cualquier usuario con sesión  | **Solo `ADMIN`**                                      |
| Filtro clave | Nivel y fecha                 | Profesor y estado                                     |

## Dependencias técnicas

- **Reglas de arquitectura:** `ARQUITECTURA.md` §4.8 (visibilidad por rol), §4.1 (el enlace nunca
  viaja en un listado), §7.3 (derivación de estados), §8.
- **Skills:** `bighearts-backend` → `contrato-api.md` · `bighearts-ui` →
  `layout-y-composicion.md` (cuándo tarjeta y cuándo fila).
- **Reutiliza:** `derivarEstadoAula()`, `<EstadoAula>`, `<Table>` de HU-206, la paginación de
  HU-203. **El endpoint de HU-207 no sirve**: aquel está acotado al token del profesor.
- **Va después de HU-209**, que es donde el admin gana un panel de verdad desde el que llegar aquí.

### Decisiones tomadas (2026-08-20)

**1. Endpoint propio, no un parámetro del catálogo.** `GET /admin/classrooms` con `@Roles('ADMIN')`.
Añadir un `?todas=true` a `GET /classrooms` convertiría un endpoint público en uno con dos
comportamientos según el rol, que es la clase de bifurcación por la que se cuelan los fallos de
autorización.

**2. El `meetingLink` no viaja tampoco aquí.** El admin supervisa la operación; no necesita entrar
a las clases. La regla de §4.1 no tiene excepción por rol, y menos para el rol con más poder.

**3. Se presenta en filas, no en tarjetas.** `layout-y-composicion.md` lo dice: tarjeta cuando se
escanea para elegir, fila cuando se escanea para administrar. El admin administra.

**4. Solo lectura.** El administrador **no** edita ni cancela aulas ajenas en Fase 1. Si detecta un
problema, habla con el profesor. Dar poder de edición sobre el trabajo de otro necesita una
conversación de producto que no hemos tenido.

## 🔧 Tasks

### Contrato — va primero

- [x] **T1** — En `packages/types`: filtros de supervisión (profesor, estado, rango de fechas) y el
      tipo de respuesta. **Reutiliza `ClassroomListItem`**; no declares un tipo paralelo. Luego
      `npm run build:types`.

### Backend

- [x] **T2** — `GET /admin/classrooms` en `AdminModule`, con `@Roles('ADMIN')`.
- [x] **T3** — Devuelve **todas** las aulas de **todos** los profesores: `PUBLISHED`, `CANCELLED`,
      y las pasadas. Sin exclusiones por defecto.
- [x] **T4** — Filtros opcionales por profesor, por estado y por rango de fechas, combinables.
      Orden: `scheduledAt` descendente — al supervisar interesa primero lo más reciente.
- [x] **T5** — El `meetingLink` **no se incluye**. Decisión 2.
- [x] **T6** — Paginación con el mismo formato que HU-203. No inventes un segundo formato.
- [x] **T7** — Tests: un `STUDENT` y un `TEACHER` reciben `403`; aparecen aulas de varios
      profesores; aparecen canceladas y pasadas; cada filtro; el orden; y **un test explícito de
      que `meetingLink` no aparece**.

### Frontend

- [x] **T8** — Pantalla de supervisión en `features/admin/`, alcanzable desde el panel del
      administrador (HU-209).
- [x] **T9** — Presentación en **filas** con el riel de estado de 4 px, mostrando profesor,
      título, fecha con zona explícita, estado e inscritos sobre cupo.
- [x] **T10** — Filtros por profesor, estado y fechas, accesibles por teclado y con su estado en la
      URL.
- [x] **T11** — Los 4 estados: cargando con texto, vacío, error y lista.
- [x] **T12** — Tests: la pantalla no es alcanzable para roles que no son `ADMIN`; `axe` limpio.

### Documentación

- [x] **T13** — Confirmar que `DEFINICION_PROYECTO.md` §5.1 recoge la supervisión dentro del
      alcance, y recorrer la tabla de §6 del skill `bighearts-dod`.

## ✅ Criterios de aceptación

- [x] **AC1** — Un administrador ve aulas de **al menos dos profesores distintos** en la misma
      pantalla.
- [x] **AC2** — **Aparecen las canceladas y las pasadas**, cada una con su estado en color + ícono + texto.
- [x] **AC3** — **Autorización:** un `STUDENT` y un `TEACHER` reciben `403` en
      `GET /admin/classrooms`. Verificado con tests de backend, no ocultando la UI.
- [x] **AC4** — **El `meetingLink` no aparece en la respuesta**, ni siquiera para el admin.
      Verificado con un test.
- [x] **AC5** — Los filtros de profesor, estado y fechas funcionan por separado y **combinados**, y
      quedan en la URL.
- [x] **AC6** — El orden es `scheduledAt` descendente.
- [x] **AC7** — La presentación es en filas, con el riel de estado. No se usan tarjetas.
- [x] **AC8** — **Solo lectura:** en esta pantalla no hay ninguna acción de editar ni cancelar
      sobre un aula ajena.
- [ ] **AC9** — **Accesibilidad:** tabla con encabezados reales, recorrido completo con teclado,
      cambios anunciados por `aria-live`, `axe` limpio (✅, ver tests), y revisado **a ojo en el
      navegador** en `.dark` y `.hc` (⬜ pendiente — jsdom no calcula CSS de verdad: eso no se
      testea, y esta sesión no abrió un navegador).
- [x] **AC10** — **Verificación automática:** `typecheck`, `lint`, `build` y
      `npm run test` en verde.

## 🚫 Fuera de alcance

- **Que el admin edite o cancele aulas de otro.** Decisión 4.
- **Métricas y estadísticas** de ocupación o asistencia. Fase posterior.
- **Ver los estudiantes inscritos** de cada aula → HU-304 lo hace para el profesor; para el admin
  no está decidido.
- **Exportar** el listado.
- Suspender a un profesor desde esta pantalla.

## Notas de implementación

La HU no decía cómo elige el admin a qué profesor filtrar, y no existía ningún endpoint que
listara profesores. Se preguntó al usuario: se añadió `GET /admin/teachers` (todos los profesores,
cualquier estado) para poblar el `<select>` del filtro — un profesor `SUSPENDED` puede tener aulas
pasadas que el admin todavía necesita encontrar. Pendiente: revisión visual en `.dark`/`.hc` en
navegador real (AC9, segunda mitad).
