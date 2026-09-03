# Patrones del dominio BigHearts

Estos son los componentes que hacen a BigHearts distinto de un CRUD cualquiera. Deben existir
como componentes reutilizables en `src/components/dominio/`, no reimplementarse por pantalla.

## 1. `<EstadoAula />` — Diccionario de Estados

Color + Ícono (Lucide) + Texto visible.

| Estado                 | Color Token              | Ícono            | Texto Visible                                              |
| ---------------------- | ------------------------ | ---------------- | ---------------------------------------------------------- |
| `disponible`           | `success-soft`           | `CircleCheck`    | `Hay cupo`                                                 |
| `ultimos-cupos`        | `attention-soft`         | `TriangleAlert`  | `Quedan {n} cupo` / `cupos` (pluraliza: `pluralizarCupos`) |
| `llena`                | `muted`                  | `Users`          | `Sin cupos`                                                |
| `reservada`            | `primary-soft`           | `BookmarkCheck`  | `Tienes tu cupo`                                           |
| `acceso-abierto`       | **`attention` (sólido)** | `DoorOpen`       | `Ya puedes entrar`                                         |
| `en-curso`             | **`success` (sólido)**   | `Video`          | `Clase en curso`                                           |
| `finalizada`           | `muted`                  | `CircleCheckBig` | `Clase finalizada`                                         |
| `cancelada`            | `destructive-soft`       | `CircleX`        | `Clase cancelada`                                          |
| `pendiente-aprobacion` | `attention-soft`         | `Clock`          | `Pendiente de aprobación`                                  |

### Riel de Estado (Firma Visual)

Franja vertical de 4px (`absolute inset-y-0 left-0 w-1`) en `<TarjetaAula />` con el color del estado derivado (redundante con el badge a propósito).

## 2. `<VentanaDeAcceso />`

Revela acceso 30 min antes. Componente de 5 fases:

| Fase            | Fondo                | Ícono            | Titular                           | Cuerpo / UI                                       |
| --------------- | -------------------- | ---------------- | --------------------------------- | ------------------------------------------------- |
| **Sin reserva** | `muted`              | `Lock`           | `Reserva para acceder`            | "El enlace solo se muestra a quien tiene cupo."   |
| **> 30 min**    | `info-soft`          | `Clock`          | `El acceso abre 30 minutos antes` | Countdown `tabular-nums` + hora exacta            |
| **< 30 min**    | `attention-soft`     | `Clock`          | `El acceso abre en {mm}:{ss}`     | Progress bar (`aria-valuenow`)                    |
| **Abierto**     | `attention` (sólido) | `DoorOpen`       | `Ya puedes entrar`                | Botón `Entrar a la clase` (`h-14 w-full text-lg`) |
| **Terminada**   | `muted`              | `CircleCheckBig` | `Esta clase ya terminó`           | Enlace `Ver mi historial`                         |

- **A11y:** `aria-live="polite"` solo en hitos (30, 15, 5, 1 min).
- **Animación:** Transición a "Abierto" dispara `alerta-visual` (`tokens.css`).

## 3. `<IndicadorCupo />`

Sin porcentajes ni gráficos. Usa `role="progressbar"` con `aria-valuemin/max/now/text`.

- `variante="cupos"` (Default - Estudiante):
  - Color: `success` (>3 libres), `attention` (1-3 libres), `muted` (0 libres).
  - Con 0 cupos, o si el estudiante ya reservó esa clase: el botón de reservar
    se **reemplaza** por uno inhabilitado con ícono + texto propio ("Sin cupos
    disponibles" / "Cupo reservado", HU-301) — nunca desaparece sin explicación
    ni queda un botón activo que invite a "re-reservar".
- `variante="inscritos"` (Profesor - HU-207):
  - Texto: `{n} de {m} inscritos`. Tono **siempre neutro**.

## 4. Tarjetas por Perspectiva y Rol

- **`perspectiva="profesor"`:** Usa `variante="inscritos"`. Omite badge `<EstadoAula>` si el estado depende de cupo (`disponible`, `ultimos-cupos`, `llena`). Mantiene badges de ciclo de vida (`cancelada`, `finalizada`, `en-curso`). Riel de 4px conserva siempre el estado.
- **Badge `Tu clase`:** En catálogo (`perspectiva="catalogo"`), si la clase es propia, muestra badge `primary-soft` (`Presentation` + `Tu clase`) **sumado** al estado. No se muestra en `perspectiva="profesor"`. Acción cambia a "Gestionar mi clase".
- **Botón Reservar:** SOLO se renderiza para rol `STUDENT` (`puedeReservar()` en `features/aulas/lib/`). Para otros roles NO debe existir en el DOM.

## 5. Modales y Confirmaciones (`<AlertDialog>`)

- **Acciones Destructivas:**
  - Título nombra objeto explícito (`¿Cancelar tu reserva de "{nombre}"?`).
  - Consecuencia clara + Botones con verbos (`Cancelar mi reserva` [destructive] vs `Volver` [outline]).
  - Foco inicial obligatorio en el botón seguro (`Volver`).
- **Avisos del Servidor (Confirmación no bloqueante, e.g., HU-212):**
  - Sin `Trigger` (vincuado al estado de la API). Reenvía la petición con flag de acuse.
  - Mensajes y umbrales extraídos dinámicamente del payload `details` del servidor (validar forma, no usar constantes local hardcodeadas ni `as` implícito).

## 6. Preferencias de Accesibilidad

Store persistido en `src/stores/preferencias-accesibilidad.ts`:

```ts
type Preferencias = {
  tema: 'claro' | 'oscuro' | 'sistema';
  altoContraste: boolean;
  movimientoReducido: boolean;
  tamanoTexto: 'normal' | 'grande' | 'muy-grande'; // 100% / 112.5% / 125%
  preferenciaComunicacion: 'texto' | 'senas' | 'ambos';
};

Se aplican como clases en `<html>`: `dark`, `hc`, `texto-grande`. Todas cambiables desde Ajustes,
accesible en 1 clic desde cualquier página — nadie debería volver al registro para arreglar su contraste.
```
