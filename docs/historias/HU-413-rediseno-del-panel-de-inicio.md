# HU-413 — Rediseño del panel de inicio por rol

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| **Sprint**          | Cierre de Fase 1 · diseño                           |
| **Prioridad**       | 🟡 Media                                            |
| **Estimación**      | 1.5 días                                            |
| **Estado**          | ⬜ Pendiente                                        |
| **Rama**            | `<nº-issue>-hu-413-rediseno-del-panel-de-inicio`    |
| **Alcance técnico** | frontend                                            |
| **Depende de**      | HU-408 (identidad ya en `main`)                     |
| **Labels**          | `cierre-fase-1` `prioridad:media` `frontend` `a11y` |

> **Como** estudiante, profesor o administrador,
> **Quiero** que mi pantalla de inicio (`/panel`) tenga una composición cuidada y coherente,
> **Para** ver de un vistazo lo que me toca y la acción principal.

## Contexto

Tercer paso del lote 2 (junto a HU-412 y HU-414). El mockup mejora `/panel` (`PanelPage` +
`PanelEstudiante` + `PanelProfesor` + bloque de admin): encabezados de sección con ícono
(«Tus próximas clases»), la lista de próximas clases, la acción principal en su sitio
(«Crear una clase» para el profesor, el camino al catálogo para el estudiante), y los estados
vacíos. Los tres roles deben compartir el mismo tratamiento de encabezado de sección y de ritmo.

La lógica de `<RoleGate>` y de qué ve cada rol (D19) **no se toca**: solo composición y estilo.

## Dependencias técnicas

- **Reglas implicadas:** skill `bighearts-ui` → `layout-y-composicion.md` (anatomía de página,
  ritmo 16/32, una sola acción primaria por pantalla), `patrones-dominio.md` (tarjeta por
  perspectiva `profesor`), `voz-microcopy.md`.
- **Reutiliza:** `<AppShell>`, `<PaginaCabecera>`, `<RoleGate>`, `<TarjetaAula>` (perspectiva
  profesor), `<EstadoVacio>`, `<AprobacionesPendientes>`, `<Button>`.
- **Decisiones pendientes que bloquean esta HU:** ninguna.
- **Relación con:** HU-414 (la tarjeta), HU-412 (el catálogo).

## 🔧 Tasks

### Frontend

- [ ] **T1** — Un patrón de **encabezado de sección** reutilizable (ícono Lucide + título + ranura
      de acción a la derecha) para «Tus próximas clases» / «Tus clases» y los demás bloques, igual
      en los tres roles. Si merece componente, va en `components/layout/` o `components/dominio/`.
- [ ] **T2** — `PanelProfesor`: aplicar el encabezado, colocar «+ Crear una clase» como acción del
      encabezado (única acción primaria), y ajustar la lista de próximas clases y su estado vacío al
      ritmo del skill.
- [ ] **T3** — `PanelEstudiante`: mismo encabezado y ritmo; revisar el camino al catálogo y el
      estado vacío.
- [ ] **T4** — Bloque de `ADMIN` en `PanelPage`: encabezado coherente para «Solicitudes de cuenta
      de profesor» y el enlace secundario a supervisión, sin robarle la acción primaria a
      `<AprobacionesPendientes>`.
- [ ] **T5** — Revisar `<PaginaCabecera>` (saludo + contexto) en la nueva composición; sin copy
      nuevo salvo que `voz-microcopy.md` lo pida.

### Documentación

- [ ] **T6** — `bighearts-ui` → `layout-y-composicion.md`: documentar el encabezado de sección si
      pasa a ser patrón. Tests con el patrón de HU-205 (`PanelPage.spec.tsx` en los tres roles y
      tres temas sigue en verde).

## ✅ Criterios de aceptación

- [ ] **AC1** — Los tres roles usan el mismo patrón de encabezado de sección (ícono + título +
      ranura de acción). Verificado a ojo y con `PanelPage.spec.tsx` en los tres roles.
- [ ] **AC2** — Cada panel tiene **una sola acción primaria** (profesor: «Crear una clase»;
      estudiante: el camino al catálogo; admin: la de `<AprobacionesPendientes>`). El resto son
      enlaces o acciones secundarias.
- [ ] **AC3** — El ritmo vertical (16 dentro de bloque, 32 entre bloques) y el único `<h1>` por
      `<PaginaCabecera>` se conservan; el foco salta al `<h1>` al entrar. Verificado con el test
      estructural existente.
- [ ] **AC4** — Los estados vacíos de cada panel encajan en la nueva composición y conservan su
      copy (o el ajustado contra `voz-microcopy.md`, listado en las notas al cerrar).
- [ ] **AC5** — `axe` limpio en `/panel` para `STUDENT`, `TEACHER` y `ADMIN` en `light`, `dark` y
      `hc`. Cero colores literales en `.tsx`.
- [ ] **AC6** — **Verificación automática:** `typecheck`, `lint`, `build` y `npm run test` (los tres
      workspaces) en verde.

## 🚫 Fuera de alcance

- `<TarjetaAula>` (estados, cupos, fechas, chips) → **HU-414**.
- El catálogo `/aulas` y sus filtros → **HU-412**.
- Qué ve cada rol / la lógica de `<RoleGate>` / las consultas (D19). Solo composición y estilo.
- Nuevas secciones o datos en el panel.

## Notas de implementación

Sin desviaciones previstas.
