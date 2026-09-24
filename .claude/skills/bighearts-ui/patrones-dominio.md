# Patrones del dominio

Viven en `src/components/dominio/`. **Reutilízalos, no los reimplementes por pantalla.**

## `<EstadoAula>` — 9 estados, derivados con `derivarEstadoAula()` de `@academia/types`

| Estado                 | Tono                   | Ícono            | Texto                   |
| ---------------------- | ---------------------- | ---------------- | ----------------------- |
| `disponible`           | `success-soft`         | `CircleCheck`    | Hay cupo                |
| `ultimos-cupos`        | `attention-soft`       | `TriangleAlert`  | Quedan {n} cupos        |
| `llena`                | `muted`                | `Users`          | Sin cupos               |
| `reservada`            | `primary-soft`         | `BookmarkCheck`  | Tienes tu cupo          |
| `acceso-abierto`       | **`attention` sólido** | `DoorOpen`       | Ya puedes entrar        |
| `en-curso`             | **`success` sólido**   | `Video`          | Clase en curso          |
| `finalizada`           | `muted`                | `CircleCheckBig` | Clase finalizada        |
| `cancelada`            | `destructive-soft`     | `CircleX`        | Clase cancelada         |
| `pendiente-aprobacion` | `attention-soft`       | `Clock`          | Pendiente de aprobación |

El **riel de estado** (4px, borde izquierdo) repite el color a propósito, también en la vista del
profesor.

## `<ModoInstruccion>`

LSC nativa o con intérprete, en su propia línea bajo el título, **nunca junto a los apoyos** y
nunca colapsado. Sin declarar: `muted`, borde punteado, «Modo de instrucción sin declarar». Los
apoyos van en una lista aparte y son lo único que colapsa tras `+N`.

## `<VentanaDeAcceso>` — el enlace se revela 30 min antes

Fases: sin reserva → faltan > 30 min (hora exacta) → faltan < 30 min (cuenta atrás) → abierto
(`attention` sólido, botón «Entrar a la clase», dispara `alerta-visual` una vez) → terminada.
`aria-live` solo en hitos. Pintar «abierto» no da acceso: lo decide el servidor.

## `<IndicadorCupo>`

Conteo literal, `role="progressbar"`, **nunca porcentajes ni gráficas**. Estudiante: `success` /
`attention` (1–3 libres) / `muted` (0). Profesor (`variante="inscritos"`): «{n} de {m} inscritos»,
tono neutro. Sin cupo o ya reservada: botón reemplazado por uno inhabilitado con ícono y texto.

## Por rol

- **Botón Reservar:** solo `STUDENT` (`puedeReservar()`); para otros roles no existe en el DOM.
- Clase propia en el catálogo: badge «Tu clase» y acción «Gestionar mi clase».
- Perspectiva profesor: sin badge de cupo; conserva los de ciclo de vida.

## Confirmaciones (`<AlertDialog>`)

Título que nombra el objeto, consecuencia clara, botones con verbo («Cancelar mi reserva» /
«Volver»), foco inicial en el seguro. Avisos confirmables del servidor: se reenvía la petición con
el flag de acuse, y los números salen de `details`, no de constantes locales.
