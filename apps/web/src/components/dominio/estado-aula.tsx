import type { EstadoAula as EstadoAulaTipo } from '@academia/types';

import { Badge } from '@/components/ui/badge';
import { varianteEstadoAula } from './estado-aula-variantes';

/**
 * El texto visible de cada uno de los nueve estados, tal y como los fija
 * `patrones-dominio.md` del skill `bighearts-ui`. Exportada aparte de
 * `<EstadoAula>` para poder testear el mapeo sin montar DOM.
 *
 * `cuposRestantes` solo lo usa `ultimos-cupos` — es el único estado cuyo
 * texto lleva un número.
 */
export function textoEstadoAula(estado: EstadoAulaTipo, cuposRestantes?: number): string {
  switch (estado) {
    case 'disponible':
      return 'Hay cupo';
    case 'ultimos-cupos':
      return `Quedan ${cuposRestantes ?? 0} cupos`;
    case 'llena':
      return 'Sin cupos';
    case 'reservada':
      return 'Tienes tu cupo';
    case 'acceso-abierto':
      return 'Ya puedes entrar';
    case 'en-curso':
      return 'Clase en curso';
    case 'finalizada':
      return 'Clase finalizada';
    case 'cancelada':
      return 'Clase cancelada';
    case 'pendiente-aprobacion':
      return 'Pendiente de aprobación';
  }
}

type EstadoAulaProps = {
  estado: EstadoAulaTipo;
  /** Cupos que quedan libres. Solo se usa (y solo hace falta) en `ultimos-cupos`. */
  cuposRestantes?: number;
  className?: string;
};

/**
 * El diccionario de los 9 estados de un aula, en un badge con la
 * codificación triple obligatoria: color + ícono + texto (`patrones-dominio.md`).
 *
 * **No deriva el estado.** Recibe el `estado` ya calculado por quien la use
 * —con `derivarEstadoAula()` de `@academia/types`, nunca reimplementado
 * (B3)— y solo se ocupa de pintarlo. El diccionario visual (tono, ícono,
 * riel) vive separado en `estado-aula-variantes.ts` desde HU-206 (D19).
 */
export function EstadoAula({ estado, cuposRestantes, className }: EstadoAulaProps) {
  const variante = varianteEstadoAula[estado];

  return (
    <Badge
      tono={variante.tono}
      enfasis={variante.enfasis}
      icon={variante.icon}
      className={className}
    >
      {textoEstadoAula(estado, cuposRestantes)}
    </Badge>
  );
}
