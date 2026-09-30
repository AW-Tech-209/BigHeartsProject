# HU-519 — Control de tamaño de texto

| Campo               | Valor                                            |
| ------------------- | ------------------------------------------------ |
| **Sprint**          | Post-Fase 1 · UX                                 |
| **Prioridad**       | 🟠 Alta                                          |
| **Estimación**      | 1 día                                            |
| **Estado**          | ✅ Hecha                                         |
| **Asignada a**      | **Dev B** — frontend                             |
| **Rama**            | `hu-519-control-de-tamano-de-texto-b`            |
| **Alcance técnico** | frontend                                         |
| **Depende de**      | ninguna                                          |
| **Labels**          | `post-fase-1` `prioridad:alta` `frontend` `a11y` |

> **Como** usuario que ve con dificultad,
> **quiero** agrandar el texto de la plataforma desde la propia plataforma,
> **para** leerla cómoda sin depender del zoom del navegador, que no todos saben usar.

## Contexto

Parte de la población sorda tiene además baja visión (síndrome de Usher: sordera y pérdida
progresiva de la visión), y para ellos la pantalla es el **único** canal. Como toda la escala
tipográfica y el espaciado están en `rem` (`index.css`), cambiar el `font-size` del `<html>` escala
la interfaz entera de forma coherente. El mecanismo copia el de `useTema`: clase en `<html>`, valor
en `localStorage` y aplicado antes del primer pintado para que no haya salto.

## Referencias

- **Archivos a tocar:** `apps/web/src/hooks/use-tamano-texto.ts` (nuevo, espejo de `use-tema.ts`),
  `apps/web/src/components/layout/selector-tamano-texto.tsx` (nuevo),
  `apps/web/src/components/layout/app-shell.tsx`, `apps/web/src/components/layout/layout-autenticacion.tsx`,
  `apps/web/src/pages/PerfilPage.tsx`, `apps/web/src/index.css`, `apps/web/index.html` (script de
  arranque, junto al del tema).
- **Reglas:** skill `bighearts-ui` → «Tipografía y forma» (cuerpo 17 px) y «Accesibilidad».
- **Decisiones pendientes:** ninguna.

## Tasks

- [x] **T1** — Tres tamaños: **Normal** (100 %, cuerpo 17 px), **Grande** (112.5 %, ≈ 19 px) y **Muy
      grande** (125 %, ≈ 21 px), como clases `.texto-grande` / `.texto-muy-grande` sobre `<html>` en
      `index.css`. Si hay tamaños en `px` en componentes que no escalan, se pasan a `rem`.
- [x] **T2** — `useTamanoTexto()`: lee y escribe `bighearts:tamano-texto` en `localStorage` (con
      `try/catch`, como el tema), y el script de `index.html` aplica la clase antes de pintar.
- [x] **T3** — `<SelectorTamanoTexto>`: grupo de tres opciones con una muestra «Aa» de su tamaño y
      el nombre escrito, junto al selector de tema en el shell (y dentro del menú en móvil), en el
      layout de autenticación y en una sección «Visualización» del perfil.
- [x] **T4** — Pasada por las pantallas principales en «Muy grande» a 375 px y a 1280 px (panel,
      catálogo, detalle, mis clases, mis aulas, formulario de aula, historial, perfil, login): se
      corrige lo que se corte, se solape o provoque scroll horizontal.
- [x] **T5** — Tests: el selector aplica la clase a `<html>` y la persiste; con `localStorage`
      bloqueado funciona en Normal sin romper; `axe` limpio en el selector.

## Criterios de aceptación

- [x] **AC1** — Elegir «Muy grande» sube el cuerpo de texto a ≥ 21 px en todas las pantallas con y
      sin sesión, sin recargar.
- [x] **AC2** — La elección sobrevive a recargar y a cerrar sesión, y se aplica **antes** del primer
      pintado (sin salto visible de tamaño al cargar).
- [x] **AC3** — En «Muy grande», a 375 px, ninguna de las pantallas de T4 tiene scroll horizontal ni
      texto cortado. (Revisión manual: es exactamente lo que trata esta HU.)
- [x] **AC4** — El selector se usa con teclado (flechas dentro del grupo), anuncia la opción elegida,
      y cada opción tiene nombre escrito además de la muestra «Aa».
- [x] **AC5** — Si `localStorage` no está disponible, la plataforma funciona en tamaño Normal sin
      errores en consola.

## Fuera de alcance

- Guardar la preferencia en el servidor para que siga al usuario entre dispositivos.
- Recuperar el tema de alto contraste (`.hc`), retirado del producto. Si se retoma, será otra HU.
- Espaciado de letras o fuentes para dislexia.

## Notas de implementación

El selector vive solo en Perfil → «Configuración» (no en la barra ni en el acceso) para no saturar la cabecera; la elección se aplica igual en pantallas sin sesión. AC3 (revisión manual a 375 px) sin verificar en navegador.
