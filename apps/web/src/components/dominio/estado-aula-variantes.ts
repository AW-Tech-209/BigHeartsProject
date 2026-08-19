import type { VariantProps } from 'class-variance-authority';
import {
  BookmarkCheck,
  CircleCheck,
  CircleCheckBig,
  CircleX,
  Clock,
  DoorOpen,
  TriangleAlert,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react';

import type { badgeVariants } from '@/components/ui/badge';

/**
 * Los nueve estados visibles de un aula, tal y como los define
 * `patrones-dominio.md` del skill `bighearts-ui`. Ninguno es una columna de la
 * base de datos: todos se derivan (`ARQUITECTURA.md` §7.3).
 */
export type EstadoAula =
  | 'disponible'
  | 'ultimos-cupos'
  | 'llena'
  | 'reservada'
  | 'acceso-abierto'
  | 'en-curso'
  | 'finalizada'
  | 'cancelada'
  | 'pendiente-aprobacion';

type TonoBadge = NonNullable<VariantProps<typeof badgeVariants>['tono']>;
type EnfasisBadge = NonNullable<VariantProps<typeof badgeVariants>['enfasis']>;

export type VarianteEstadoAula = {
  tono: TonoBadge;
  enfasis: EnfasisBadge;
  /** Ícono de lucide. La mitad no cromática de la codificación triple. */
  icon: LucideIcon;
  /** Clase de fondo del riel de 4px de la tarjeta. */
  riel: string;
};

/**
 * **La regla del sólido.** De los nueve estados, solo dos van en color pleno:
 * `acceso-abierto` y `en-curso`.
 *
 * El sólido está reservado a «hay algo que hacer ahora mismo». Es lo más ruidoso
 * de la pantalla y debe serlo: `acceso-abierto` es el instante en el que este
 * producto cumple su promesa. **No subas otro estado a sólido para destacarlo**;
 * cuando hay dos cosas gritando, ninguna grita.
 */
export const ESTADOS_SOLIDOS: readonly EstadoAula[] = ['acceso-abierto', 'en-curso'];

/**
 * Presentación de cada estado: tono, énfasis, ícono y riel.
 *
 * Este archivo es **solo la mitad visual**. El texto visible de cada estado
 * (`Quedan 5 cupos`, `Ya puedes entrar`) depende de datos del aula, y vive en
 * `<EstadoAula>`, que nace en HU-203 sobre esta tabla. Se separó a propósito:
 * la regla del sólido es una decisión de producto que tiene que poder
 * verificarse con un test antes de que exista el componente que la obedece.
 *
 * El riel usa siempre el token pleno de su familia, aunque el badge sea suave:
 * es una franja de 4px que debe distinguirse con visión periférica, y para eso
 * necesita el contraste ≥ 3:1 que los tonos suaves no dan.
 */
export const varianteEstadoAula: Record<EstadoAula, VarianteEstadoAula> = {
  disponible: { tono: 'success', enfasis: 'suave', icon: CircleCheck, riel: 'bg-success' },
  'ultimos-cupos': {
    tono: 'attention',
    enfasis: 'suave',
    icon: TriangleAlert,
    riel: 'bg-attention',
  },
  llena: { tono: 'neutral', enfasis: 'suave', icon: Users, riel: 'bg-muted-foreground' },
  reservada: { tono: 'primary', enfasis: 'suave', icon: BookmarkCheck, riel: 'bg-primary' },
  'acceso-abierto': {
    tono: 'attention',
    enfasis: 'solido',
    icon: DoorOpen,
    riel: 'bg-attention',
  },
  'en-curso': { tono: 'success', enfasis: 'solido', icon: Video, riel: 'bg-success' },
  finalizada: {
    tono: 'neutral',
    enfasis: 'suave',
    icon: CircleCheckBig,
    riel: 'bg-muted-foreground',
  },
  cancelada: { tono: 'destructive', enfasis: 'suave', icon: CircleX, riel: 'bg-destructive' },
  'pendiente-aprobacion': {
    tono: 'attention',
    enfasis: 'suave',
    icon: Clock,
    riel: 'bg-attention',
  },
};
