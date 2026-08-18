# Patrones del dominio BigHearts

Estos son los componentes que hacen a BigHearts distinto de un CRUD cualquiera. Deben existir
como componentes reutilizables en `src/components/dominio/`, no reimplementarse por pantalla.

## `<EstadoAula />` — el diccionario de estados

Estado siempre = **color + ícono + texto**. Esta tabla es la única fuente de verdad:

| Estado                 | Color                | Ícono (lucide)   | Texto visible             |
| ---------------------- | -------------------- | ---------------- | ------------------------- |
| `disponible`           | `success-soft`       | `CircleCheck`    | `Hay cupo`                |
| `ultimos-cupos`        | `attention-soft`     | `TriangleAlert`  | `Quedan {n} cupos`        |
| `llena`                | `muted`              | `Users`          | `Sin cupos`               |
| `reservada`            | `primary-soft`       | `BookmarkCheck`  | `Tienes tu cupo`          |
| `acceso-abierto`       | `attention` (sólido) | `DoorOpen`       | `Ya puedes entrar`        |
| `en-curso`             | `success` (sólido)   | `Video`          | `Clase en curso`          |
| `finalizada`           | `muted`              | `CircleCheckBig` | `Clase finalizada`        |
| `cancelada`            | `destructive-soft`   | `CircleX`        | `Clase cancelada`         |
| `pendiente-aprobacion` | `attention-soft`     | `Clock`          | `Pendiente de aprobación` |

```tsx
const estadoAula = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
  {
    variants: {
      estado: {
        disponible: 'bg-success-soft text-success-soft-foreground border-success-border',
        ultimosCupos: 'bg-attention-soft text-attention-soft-foreground border-attention-border',
        llena: 'bg-muted text-muted-foreground border-border',
        reservada: 'bg-primary-soft text-primary-soft-foreground border-primary/30',
        accesoAbierto: 'bg-attention text-attention-foreground border-attention',
        enCurso: 'bg-success text-success-foreground border-success',
        finalizada: 'bg-muted text-muted-foreground border-border',
        cancelada: 'bg-destructive-soft text-destructive-soft-foreground border-destructive-border',
        pendiente: 'bg-attention-soft text-attention-soft-foreground border-attention-border',
      },
    },
    defaultVariants: { estado: 'disponible' },
  },
);
```

## El riel de estado — la firma visual del producto

Cada `<TarjetaAula>` lleva una **franja vertical de 4px en su borde izquierdo** con el color del
estado. Permite **escanear una lista completa con visión periférica** sin leer una sola palabra.

```tsx
<article
  className="relative overflow-hidden rounded-xl border border-border bg-card p-5
                    focus-within:ring-2 focus-within:ring-ring"
>
  <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-success" />
  ...
</article>
```

El riel es **redundante** con el badge de estado — a propósito. La redundancia es la estrategia
central de este diseño, no un descuido.

## `<VentanaDeAcceso />` — el corazón del producto

El enlace solo se revela 30 minutos antes de la clase. Componente con 5 fases:

| Fase                  | Fondo              | Ícono            | Titular                           | Cuerpo                                          |
| --------------------- | ------------------ | ---------------- | --------------------------------- | ----------------------------------------------- |
| Sin reserva           | `muted`            | `Lock`           | `Reserva para acceder`            | `El enlace solo se muestra a quien tiene cupo.` |
| Falta mucho (>30 min) | `info-soft`        | `Clock`          | `El acceso abre 30 minutos antes` | Cuenta regresiva `tabular-nums` + hora exacta   |
| Abre pronto (<30 min) | `attention-soft`   | `Clock`          | `El acceso abre en {mm}:{ss}`     | Barra de progreso con `aria-valuenow`           |
| Abierto               | `attention` sólido | `DoorOpen`       | `Ya puedes entrar`                | Botón grande `Entrar a la clase`                |
| Terminada             | `muted`            | `CircleCheckBig` | `Esta clase ya terminó`           | Enlace a `Ver mi historial`                     |

- Cuenta regresiva anunciada con `aria-live="polite"` **solo en hitos** (30, 15, 5, 1 min).
- El paso de "abre pronto" a "abierto" dispara la animación `alerta-visual` (ver `tokens.css`):
  es el único momento del producto donde un usuario oyente recibiría una notificación sonora.
- El botón `Entrar a la clase` es el objetivo táctil más grande de la app: `h-14`, ancho completo
  en móvil, `text-lg`.

## `<IndicadorCupo />`

Nunca porcentajes ni gráficas circulares. Siempre conteo literal:

```
👥 14 de 20 lugares ocupados · Quedan 6
```

- `role="progressbar"` con `aria-valuemin/max/now` y
  `aria-valuetext="Quedan 6 de 20 lugares"`.
- Color: `success` con >3 libres, `attention` con 1-3 libres, `muted` con 0.
- Con 0 cupos el texto cambia a `Sin cupos disponibles` y el botón de reservar se **oculta**
  (nunca deshabilitado sin explicación).

## Acciones destructivas

Cancelar una reserva o un aula **siempre** pasa por `<AlertDialog>` con:

- Título que nombra el objeto: `¿Cancelar tu reserva de "Inglés básico — martes 6 p.m."?`
- Consecuencia explícita: `Tu lugar quedará disponible para otro estudiante.`
- Botones con verbos, no Sí/No: `Cancelar mi reserva` (destructive) / `Volver` (outline).
- El botón seguro (`Volver`) recibe el foco inicial.

## Preferencias de accesibilidad del usuario

El estudiante indica su nivel de hipoacusia y preferencia de comunicación al registrarse.
Store persistido en `src/stores/preferencias-accesibilidad.ts`:

```ts
type Preferencias = {
  tema: 'claro' | 'oscuro' | 'sistema';
  altoContraste: boolean;
  movimientoReducido: boolean;
  tamanoTexto: 'normal' | 'grande' | 'muy-grande'; // 100% / 112.5% / 125%
  preferenciaComunicacion: 'texto' | 'senas' | 'ambos';
};
```

Se aplican como clases en `<html>`: `dark`, `hc`, `texto-grande`. Todas cambiables desde Ajustes,
accesible en 1 clic desde cualquier página — nadie debería volver al registro para arreglar su contraste.
