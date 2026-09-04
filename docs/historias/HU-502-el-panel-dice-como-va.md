# HU-502 — El panel dice cómo va la plataforma

| Campo               | Valor                                             |
| ------------------- | ------------------------------------------------- |
| **Sprint**          | Post-Fase 1 · Pulido                              |
| **Prioridad**       | 🟠 Alta                                           |
| **Estimación**      | 2.5 días                                          |
| **Estado**          | ✅ Terminada                                      |
| **Rama**            | `hu-502-el-panel-dice-como-va-<persona>`          |
| **Alcance técnico** | fullstack                                         |
| **Depende de**      | HU-309 (✅), HU-403 (✅), HU-404 (✅)             |
| **Labels**          | `post-fase-1` `prioridad:alta` `fullstack` `a11y` |

> **Como** usuario de cualquier rol,
> **Quiero** que al entrar vea de un vistazo cómo tengo la plataforma,
> **Para** saber qué me toca sin recorrer tres pantallas para averiguarlo.

## Contexto

`/panel` es el inicio de los tres roles (D19) y hoy solo lista lo que viene: próximas clases para
estudiante y profesor, vistazo general para el admin. Eso está bien y **se queda tal cual**. Lo que
falta encima es la lectura rápida: tres tarjetas que respondan «¿cómo voy?» antes de bajar a leer
listas.

**Se inserta encima, no se sustituye nada.** Si al terminar algún bloque existente desapareció o
cambió, la HU se hizo mal.

### Las nueve tarjetas, ya elegidas

| Rol        | Tarjeta                              | Qué dice                                                                                                                               |
| ---------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Estudiante | **Tu próxima clase**                 | La más cercana, con su hora y zona, y cuánto falta en texto. Si la ventana de acceso ya está abierta, el botón de entrar aparece aquí. |
| Estudiante | **Clases que coinciden contigo**     | Cuántas aulas con cupo coinciden con su preferencia de comunicación, con enlace al catálogo.                                           |
| Estudiante | **Tus reservas activas**             | Cuántas clases próximas tiene reservadas, con enlace a `/mis-clases`.                                                                  |
| Profesor   | **Tu próxima clase**                 | Cuándo es y cuántos inscritos tiene sobre el cupo, con enlace a la lista.                                                              |
| Profesor   | **Asistencia sin marcar**            | Cuántas clases suyas ya terminaron y siguen sin marcar.                                                                                |
| Profesor   | **Cómo se comunica tu grupo**        | Recuento por modo de comunicación de todos los inscritos en sus clases próximas.                                                       |
| Admin      | **Profesores pendientes de aprobar** | Cuántos esperan, con enlace a la aprobación.                                                                                           |
| Admin      | **La operación de hoy**              | Clases programadas hoy y cuántas están en curso ahora.                                                                                 |
| Admin      | **Ocupación de la semana**           | Cupos reservados sobre cupos ofrecidos, **en conteo literal**.                                                                         |

### Tres reglas que estas tarjetas tocan de cerca

1. **Conteo literal siempre.** «84 de 120 cupos» sí; «70 % de ocupación» no, y una gráfica circular
   tampoco. Es la regla de `<IndicadorCupo>` y aplica igual aquí.
2. **El ámbar es tiempo.** «Asistencia sin marcar» puede ir en ámbar porque son clases **que ya
   terminaron** —la deuda es temporal—, y «Profesores pendientes» también, porque llevan esperando.
   Ningún otro número de estas tarjetas se pinta de ámbar (**D39**).
3. **El vacío dice algo.** Un cero mudo no sirve. «No tienes clases reservadas» lleva al catálogo;
   «Nada pendiente de marcar» es una buena noticia y se dice como tal.

## Dependencias técnicas

- **Reglas:** `ARQUITECTURA.md` §4.8 (**un endpoint por propósito, y el alcance sale del token**),
  §4.1 regla 2 (**el `meetingLink` no viaja en un resumen**), §4.7, §7.3.
- **Skills:** `bighearts-ui` → `patrones-dominio.md` (conteo literal, diccionario de color) y
  `layout-y-composicion.md` (rejilla de 3, nunca 4).
- **Reutiliza:** `derivarEstadoAula()`, `<EstadoAula>`, la ventana de acceso de HU-304, los chips de
  modo de comunicación de HU-211, y los bloques de panel de HU-209 y HU-309 —que **se conservan
  debajo**—.
- **Decisiones pendientes:** ninguna. D39 queda tomada aquí.

> **Un endpoint, no nueve.** Siguiendo el patrón de `GET /historial` (HU-404): un módulo `panel/`
> con **`GET /panel/resumen`**, acotado al token, que devuelve la forma que corresponde al rol de
> quien pide. Nueve peticiones para pintar la primera pantalla harían de la portada la página más
> lenta del producto.

## 🔧 Tasks

### Contrato — va primero

- [x] **T1** — En `packages/types`: el resumen por rol, reutilizando los tipos de listado que ya
      existen. Luego `npm run build:types`.

### Backend

- [x] **T2** — Módulo `panel/` con `GET /panel/resumen`, **acotado al token**. Devuelve solo lo del
      rol de quien pide; ningún parámetro amplía el alcance. **Sin `meetingLink`.**
- [x] **T3** — Resumen del **estudiante**: próxima clase, número de reservas próximas, y cuántas
      aulas con cupo coinciden con su preferencia de comunicación.
- [x] **T4** — Resumen del **profesor**: próxima clase con inscritos sobre cupo, clases terminadas
      sin asistencia marcada, y recuento por modo de comunicación de sus inscritos próximos.
- [x] **T5** — Resumen del **admin**: profesores `PENDING`, clases de hoy y en curso, y cupos
      reservados sobre ofrecidos en la semana. Todo como **números enteros**, sin porcentajes.
- [x] **T6** — Tests: cada rol recibe lo suyo y **nada de otro rol**; ningún parámetro amplía el
      alcance; el `meetingLink` no aparece; los recuentos cuadran con los datos del seed.

### Frontend

- [x] **T7** — Fila de **tres tarjetas** encima del contenido actual de `/panel`, en rejilla de 1/2/3
      columnas, con sus 4 estados y el vacío de cada una diciendo algo útil. **Lo que ya había se
      mantiene íntegro debajo.**

## ✅ Criterios de aceptación

- [x] **AC1** — Cada rol ve **sus tres tarjetas** de la tabla de arriba, y ninguna de otro rol.
- [x] **AC2** — **Lo que ya existía en `/panel` sigue ahí, debajo y sin cambios.** Verificado
      comparando con la pantalla anterior.
- [x] **AC3** — **Autorización:** el alcance sale del token; ningún parámetro devuelve el resumen de
      otro usuario, y el `meetingLink` no aparece en la respuesta. Verificado con tests.
- [x] **AC4** — La ocupación del admin se muestra en **conteo literal** («84 de 120»), sin
      porcentajes ni gráficas circulares. El ámbar solo aparece en las dos tarjetas que D39 permite.
- [x] **AC5** — Con la cuenta vacía, **cada tarjeta explica qué significa ese cero** y a dónde ir.
      Ninguna se queda en un número suelto.
- [x] **AC6** — **Accesibilidad y verificación:** las tarjetas se recorren con teclado, cada dato se
      entiende sin color, `axe` limpio, y `typecheck`, `lint`, `build` y `npm run test` en verde.

## 🚫 Fuera de alcance

- **Gráficas de cualquier tipo.** Ni barras, ni líneas, ni circulares. Números y texto.
- **Métricas históricas o tendencias** («un 12 % más que la semana pasada»). No hay datos para
  sostenerlas y no las pide nadie.
- **Personalizar** qué tarjetas ve cada usuario.
- **Exportar** nada del panel.
- **Rehacer** los bloques existentes del panel. Se conservan tal cual.
- **Actualización en tiempo real.** El resumen se calcula al cargar; el usuario recarga si quiere
  otro.

## Notas de implementación

Sin desviaciones. Decisiones no fijadas en la HU: «hoy» del admin = día UTC;
«la semana» = ventana móvil de 7 días desde ahora; «en curso» y «ya terminó» se
cortan en memoria contra `scheduledAt + duración` (Prisma no filtra dos columnas).

### Recorrido de AC

| AC  | Veredicto | Cómo se comprobó                                                                                                                |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | ✅        | `panel.service.spec` reparte por rol; `resumen-panel.spec` pinta las 3 tarjetas de cada rol                                     |
| AC2 | ✅        | `PanelPage.spec` (127 tests) sigue verde: los bloques HU-209/HU-309 quedan íntegros debajo                                      |
| AC3 | ✅        | `GET /panel/resumen` sin parámetros; `panel.controller.spec` pasa solo el token; `meetingLink` ausente en `proximaClase` (spec) |
| AC4 | ✅        | admin en conteo literal («84 de 120»), sin `%`; ámbar solo en «Asistencia sin marcar» y «Profesores pendientes» y solo con n>0  |
| AC5 | ✅        | cada tarjeta tiene rama de vacío con texto + enlace (`resumen-panel.spec`)                                                      |
| AC6 | ✅        | `axe` limpio con datos; teclado (enlaces/botones nativos); `typecheck`+`lint`+`build`+`test` en verde                           |
