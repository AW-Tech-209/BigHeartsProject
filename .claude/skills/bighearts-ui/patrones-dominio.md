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

Nunca porcentajes ni gráficas circulares. Siempre conteo literal, en **dos variantes** según quién
mira — los mismos dos números contados al revés:

```
variante="cupos"      👥 14 de 20 lugares ocupados · Quedan 6
variante="inscritos"  👥 14 de 20 inscritos
```

- `role="progressbar"` con `aria-valuemin/max/now` y `aria-valuetext`.
- **`cupos`** (por defecto) responde la pregunta del estudiante —¿me da tiempo a reservar?—.
  Color: `success` con >3 libres, `attention` con 1-3 libres, `muted` con 0. Con 0 cupos el texto
  cambia a `Sin cupos disponibles` y el botón de reservar se **oculta** (nunca deshabilitado sin
  explicación).
- **`inscritos`** (HU-207) responde la del profesor —¿cuánta gente viene?—. Tono **siempre neutro**:
  «cuánta gente viene» no es ni una urgencia ni un logro, y teñirlo le inventaría al profesor una
  alarma que nadie decidió.

### La tarjeta cambia de pregunta, no de aspecto

`<TarjetaAula perspectiva="profesor">` (HU-207) usa la variante `inscritos` y **omite el badge de
`<EstadoAula>` cuando el estado sale del cupo** (`disponible`, `ultimos-cupos`, `llena`): «Quedan 2
cupos» y «8 de 10 inscritos» en la misma tarjeta son la misma cuenta dicha dos veces y al revés. Los
estados de ciclo de vida —`cancelada`, `finalizada`, `en-curso`— **sí conservan su badge**: no salen
del cupo y sin él la tarjeta no diría qué pasó. **El riel de 4px lleva el estado derivado en las dos
perspectivas**, sin excepción.

### El distintivo `Tu clase` — de quién es, no cómo está

En el **catálogo** (`perspectiva="catalogo"`), un aula que imparte quien la mira lleva un badge
`primary` / `suave` con ícono `Presentation` y el texto `Tu clase` (HU-208). Tres reglas:

1. **Se añade al estado, nunca lo sustituye.** Comparten fila. Una clase propia con últimos cupos
   dice las dos cosas: de quién es y cómo va de sitio. Son preguntas distintas y las dos importan.
2. **No aparece en `perspectiva="profesor"`.** En «Mis aulas» todas son suyas: marcarlas una por
   una no distingue nada, igual que allí no se repite su nombre en cada tarjeta.
3. **No es un permiso.** Marca propiedad para que el profesor coordine horarios en un catálogo que
   sigue siendo único; lo que puede hacer con ella lo decide el servidor (§4.8).

Sobre la clase propia, la acción del catálogo cambia de verbo y de promesa: `Gestionar mi clase`,
no la de quien va a reservar. **La acción de reservar solo se pinta para `STUDENT`** y para nadie
más — el elemento **no existe** en el DOM, no se pinta deshabilitado (§4.8, regla 1). Quién la ve
lo decide `puedeReservar()` en `features/aulas/lib/`, un solo sitio que HU-301 extiende.

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
