import { useId } from 'react';

import { cn } from '@/lib/utils';

/**
 * Las tres ilustraciones del producto: vacío, no encontrado y error.
 *
 * **Están construidas con los primitivos del propio producto** —la tarjeta y su
 * riel de 4px—, no con un dibujo decorativo. Es el producto explicándose a sí
 * mismo: quien ya vio una lista de aulas reconoce la forma.
 *
 * Reglas que las tres cumplen y que no se negocian:
 *  - **Solo tokens.** Ni un hex, ni un degradado, ni una sombra. Así sobreviven
 *    a `.dark` y a `.hc`, donde un color fijo se volvería invisible.
 *  - `role="img"` con `aria-label` que describe **lo que se dibuja**.
 *  - **Nunca aportan información que no esté en el texto.** Son refuerzo. Si
 *    alguien no las ve, no se pierde nada.
 *
 * Solo se usan en estados vacíos y onboarding. Nunca en una tarjeta de aula ni
 * junto a datos reales.
 */
type IlustracionProps = {
  className?: string;
};

const CLASES_BASE = 'h-auto w-full max-w-[180px]';

type TarjetaSvgProps = {
  /** Id único del recorte. El riel se clipa con la tarjeta para no desbordar su radio. */
  clipId: string;
  x: number;
  y: number;
  ancho?: number;
  alto?: number;
  /** Clase de relleno del riel. Neutro salvo que el estado signifique algo. */
  riel?: string;
};

/**
 * Una tarjeta con su riel, en SVG.
 *
 * El riel va recortado por la propia tarjeta (`clipPath`) en vez de dibujarse
 * con esquinas redondeadas propias: es la misma decisión que en el componente
 * real, donde el riel es `absolute` dentro de un `overflow-hidden`. Un borde de
 * un solo lado con radio propio se ve roto.
 */
function TarjetaSvg({
  clipId,
  x,
  y,
  ancho = 112,
  alto = 26,
  riel = 'fill-muted-foreground',
}: TarjetaSvgProps) {
  return (
    <>
      <clipPath id={clipId}>
        <rect x={x} y={y} width={ancho} height={alto} rx={8} />
      </clipPath>
      <rect
        x={x}
        y={y}
        width={ancho}
        height={alto}
        rx={8}
        strokeWidth={2}
        className="fill-card stroke-border"
      />
      <rect x={x} y={y} width={4} height={alto} clipPath={`url(#${clipId})`} className={riel} />
    </>
  );
}

/** Estados vacíos: la lista existe, todavía no tiene nada dentro. */
export function IlustracionVacio({ className }: IlustracionProps) {
  const id = useId();

  return (
    <svg
      viewBox="0 0 160 120"
      role="img"
      aria-label="Una lista de tarjetas de clase con el último lugar todavía vacío."
      className={cn(CLASES_BASE, className)}
    >
      <TarjetaSvg clipId={`${id}-1`} x={24} y={16} />
      <TarjetaSvg clipId={`${id}-2`} x={24} y={50} />
      <rect
        x={24}
        y={84}
        width={112}
        height={26}
        rx={8}
        strokeWidth={2}
        strokeDasharray="6 5"
        className="fill-muted stroke-border"
      />
    </svg>
  );
}

/** 404: existe la lista, pero lo que se buscaba no está en ella. */
export function IlustracionNoEncontrado({ className }: IlustracionProps) {
  const id = useId();

  return (
    <svg
      viewBox="0 0 160 120"
      role="img"
      aria-label="Una tarjeta de clase fuera de la lista, en un lugar que no le corresponde."
      className={cn(CLASES_BASE, className)}
    >
      <TarjetaSvg clipId={`${id}-1`} x={14} y={14} ancho={84} />
      <rect
        x={14}
        y={48}
        width={84}
        height={26}
        rx={8}
        strokeWidth={2}
        strokeDasharray="6 5"
        className="fill-muted stroke-border"
      />
      <TarjetaSvg clipId={`${id}-2`} x={14} y={82} ancho={84} />
      <g transform="rotate(14 128 61)">
        <TarjetaSvg clipId={`${id}-3`} x={104} y={48} ancho={44} />
      </g>
    </svg>
  );
}

/** Error de carga: la pieza está, pero llegó partida. */
export function IlustracionError({ className }: IlustracionProps) {
  const id = useId();

  return (
    <svg
      viewBox="0 0 160 120"
      role="img"
      aria-label="Una tarjeta de clase partida en dos mitades separadas."
      className={cn(CLASES_BASE, className)}
    >
      {/* El riel en `destructive` sí significa algo: acompaña siempre a un texto
          de error. No es color decorativo. */}
      <TarjetaSvg clipId={`${id}-1`} x={14} y={34} ancho={58} alto={44} riel="fill-destructive" />
      <TarjetaSvg clipId={`${id}-2`} x={88} y={44} ancho={58} alto={44} />
    </svg>
  );
}
